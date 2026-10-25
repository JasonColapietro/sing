import { randomUUID } from 'node:crypto';
import { deliver, validPurchase, type DeliveryResult, type PurchaseEvent } from './core';
type Command=(args:(string|number)[])=>Promise<unknown>;
const KEYS=['sing:{intake-v1}:rows','sing:{intake-v1}:due','sing:{intake-v1}:receipts'];
const PIN='0b33f45a0bdde87b8e7746666d6200c17d0c4b82';
const enabled=(env:Readonly<Record<string,string|undefined>>)=>env.SING_INTAKE_ENABLED==='1' && env.SUEDE_INTAKE_CONTRACT===PIN;
// All admission/claim/settle mutations are atomic and use one Redis hash slot.
const SCRIPT=`
local op=ARGV[1]
local id=ARGV[2]
local now=tonumber(ARGV[3])
if op=='enqueue' then
 if redis.call('HEXISTS',KEYS[3],id)==1 then return 'delivered' end
 if redis.call('HEXISTS',KEYS[1],id)==1 then return 'duplicate' end
 if redis.call('HLEN',KEYS[1])>=tonumber(ARGV[5]) then return 'full' end
 redis.call('HSET',KEYS[1],id,ARGV[4]);redis.call('ZADD',KEYS[2],now,id);return 'pending'
end
if op=='claim' then
 local ids=redis.call('ZRANGEBYSCORE',KEYS[2],'-inf',now,'LIMIT',0,1)
 if #ids==0 then return false end
 id=ids[1]
 local raw=redis.call('HGET',KEYS[1],id)
 if not raw then redis.call('ZREM',KEYS[2],id);return false end
 local row=cjson.decode(raw)
 row.token=ARGV[4];row.attempts=row.attempts+1;row.state='delivering'
 redis.call('HSET',KEYS[1],id,cjson.encode(row));redis.call('ZADD',KEYS[2],now+30000,id)
 return cjson.encode(row)
end
local raw=redis.call('HGET',KEYS[1],id)
if not raw then return 0 end
local row=cjson.decode(raw)
if op=='repair' then
 if row.state~='blocked' then return 0 end
 row.state='pending';row.code=nil;row.token=nil
 redis.call('HSET',KEYS[1],id,cjson.encode(row));redis.call('ZADD',KEYS[2],now,id);return 1
end
if row.token~=ARGV[4] then return 0 end
if ARGV[5]=='delivered' then
 redis.call('HSET',KEYS[3],id,'1');redis.call('HDEL',KEYS[1],id);redis.call('ZREM',KEYS[2],id);return 1
end
row.state=ARGV[5];row.token=nil;row.code=tonumber(ARGV[6])
redis.call('HSET',KEYS[1],id,cjson.encode(row))
if row.state=='blocked' then redis.call('ZREM',KEYS[2],id)
else redis.call('ZADD',KEYS[2],now+math.max(tonumber(ARGV[7]) or 0,math.min(3600000,60000*2^math.min(row.attempts-1,6))),id) end
return 1`;
interface Row {event:PurchaseEvent;state:string;attempts:number;token:string}
/** Dormant durable core with gated admission route; no provider webhook registration, worker schedule or activation. */
export function createOutbox(command:Command, now:()=>number=Date.now, capacity=1000) {
 const evalOp=(...args:(string|number)[])=>command(['EVAL',SCRIPT,3,...KEYS,...args]);
 return {
  async enqueue(raw:unknown,env:Readonly<Record<string,string|undefined>>):Promise<string> {
   if(!enabled(env))return 'disabled';if(!validPurchase(raw))return 'rejected';
   return String(await evalOp('enqueue',raw.id,now(),JSON.stringify({event:raw,state:'pending',attempts:0}),capacity));
  },
  async repair(id:string,env:Readonly<Record<string,string|undefined>>):Promise<boolean> {
   if(!enabled(env)||!/^purchase:[a-f0-9]{64}$/.test(id))return false;
   return Boolean(await evalOp('repair',id,now()));
  },
  async drain(env:Readonly<Record<string,string|undefined>>,transport:(event:PurchaseEvent)=>Promise<DeliveryResult>=e=>deliver(e,env)):Promise<string[]> {
   if(!enabled(env))return [];
   // One claim per invocation bounds work; a process crash leaves a 30s lease.
   const raw=await evalOp('claim','',now(),randomUUID());if(!raw)return [];
   const row=JSON.parse(String(raw)) as Row;
   let result:DeliveryResult;
   try{result=await transport(row.event);}catch{result={state:'pending'};}
   if(!['pending','blocked','delivered'].includes(result.state)) result={state:'pending'};
   const changed=await evalOp('settle',row.event.id,now(),row.token,result.state,result.code??'',Math.min(86400000,Math.max(0,result.retryAfterMs??0)));
   return [changed?result.state:'concurrent-update'];
  },
 };
}
