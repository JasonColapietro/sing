import { afterAll, beforeAll, expect, it } from 'vitest';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOutbox } from './outbox';
import { purchaseEvent } from './core';
const binary=process.env.REDIS_SERVER_BIN;
const cli=process.env.REDIS_CLI_BIN;
const run= binary && cli ? it : it.skip;
const dir=mkdtempSync(join(tmpdir(),'sing-intake-')); const socket=join(dir,'redis.sock');
let server:ChildProcess;
const command=async(args:(string|number)[]):Promise<unknown>=>JSON.parse(execFileSync(cli!,['-s',socket,'--json',...args.map(String)],{encoding:'utf8'}));
beforeAll(async()=>{if(!binary)return; await new Promise<void>((resolve,reject)=>{server=spawn(binary,['--port','0','--unixsocket',socket,'--save','','--appendonly','no','--dir',dir]);server.once('error',reject);server.stdout!.on('data',b=>{if(String(b).includes('Ready to accept connections'))resolve();});});});
afterAll(async()=>{if(server && server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill();await done;}rmSync(dir,{recursive:true,force:true});});
const event=(n:number)=>purchaseEvent({id:`evt_${n}`,created:1792929600,type:'checkout.session.completed',data:{object:{id:`cs_fixture_${n}`,created:1792929600,metadata:{app:'suede-sing',plan:'lifetime'},payment_status:'paid',amount_total:9900,currency:'usd'}}})!;
const env={SING_INTAKE_ENABLED:'1',SUEDE_INTAKE_CONTRACT:'0b33f45a0bdde87b8e7746666d6200c17d0c4b82'};
it('disabled core does not access store',async()=>{const q=createOutbox(async()=>{throw Error('store touched');});expect(await q.enqueue(event(1),{})).toBe('disabled');expect(await q.drain({},async()=>{throw Error();})).toEqual([]);});
run('atomic durable admission deduplicates, isolates bad traffic, and recovers config failures',async()=>{
 const q=createOutbox(command,()=>1000,1); await command(['FLUSHDB']);
 expect(await q.enqueue({...event(1),canary:true},env)).toBe('rejected');
 expect(await q.enqueue({...event(1),suspectedSpam:{reason:'honeypot'}},env)).toBe('rejected');
 expect(await Promise.all([q.enqueue(event(1),env),q.enqueue(event(1),env)])).toEqual(['pending','duplicate']);
 expect(await q.enqueue(event(2),env)).toBe('full');
 expect(await q.drain(env,async()=>({state:'blocked',code:401}))).toEqual(['blocked']);
 expect(await q.drain(env,async()=>{throw Error('must stay blocked');})).toEqual([]);
 expect(await q.repair(event(1).id,env)).toBe(true);
 expect(await q.drain(env,async()=>({state:'delivered'}))).toEqual(['delivered']);
 expect(await q.enqueue(event(1),env)).toBe('delivered');
 expect(await q.enqueue(event(2),env)).toBe('pending');
});
run('ambiguous delivery and lease recovery preserve bytes across queue restart',async()=>{
 await command(['FLUSHDB']);let now=1000;const q=createOutbox(command,()=>now);
 await q.enqueue(event(3),env);let bytes='';await q.drain(env,async body=>{bytes=JSON.stringify(body);throw Error('lost ACK');});
 expect(await q.drain(env,async()=>{throw Error('backoff');})).toEqual([]);
 now+=61000;expect(await createOutbox(command,()=>now).drain(env,async body=>{expect(JSON.stringify(body)).toBe(bytes);return {state:'delivered'};})).toEqual(['delivered']);
});

run('expired lease permits recovery while stale worker cannot overwrite receipt',async()=>{
 await command(['FLUSHDB']);let now=1000;const q=createOutbox(command,()=>now);await q.enqueue(event(4),env);
 let release!:()=>void;const barrier=new Promise<void>(r=>{release=r;});let entered!:()=>void;const started=new Promise<void>(r=>{entered=r;});
 const first=q.drain(env,async()=>{entered();await barrier;return {state:'pending'};});await started;
 expect(await q.drain(env,async()=>({state:'delivered'}))).toEqual([]);
 now+=31000;expect(await q.drain(env,async()=>({state:'delivered'}))).toEqual(['delivered']);
 release();expect(await first).toEqual(['concurrent-update']);expect(await q.enqueue(event(4),env)).toBe('delivered');
});
it('storage failure never acknowledges accepted event',async()=>{await expect(createOutbox(async()=>{throw Error('store unavailable');}).enqueue(event(5),env)).rejects.toThrow('store unavailable');});
