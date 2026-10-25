import { expect,it,vi } from 'vitest';
import { storeCommand } from './store';
it('bounds a Redis response body that ignores abort without exposing token',async()=>{
 vi.useFakeTimers();try{
 const request=storeCommand({UPSTASH_REDIS_REST_URL:'https://synthetic.invalid',UPSTASH_REDIS_REST_TOKEN:'NEVER'},async()=>({ok:true,json:()=>new Promise(()=>{})}) as Response)(['PING']);
 const result=request.catch(e=>String(e));await vi.advanceTimersByTimeAsync(4001);expect(await result).toBe('Error: intake-store-timeout');
 }finally{vi.useRealTimers();}
});
it('rejects credential-bearing configuration URL before network',()=>{
 expect(()=>storeCommand({UPSTASH_REDIS_REST_URL:'https://user:secret@example.test/?token=secret',UPSTASH_REDIS_REST_TOKEN:'fixture'})).toThrow('intake-store-invalid-url');
});
