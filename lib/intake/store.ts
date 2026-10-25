/** Existing Redis REST integration only; called after independent activation gates. */
export function storeCommand(env:Readonly<Record<string,string|undefined>>,fetcher:typeof fetch=fetch) {
 const url=env.UPSTASH_REDIS_REST_URL??env.KV_REST_API_URL;
 const token=env.UPSTASH_REDIS_REST_TOKEN??env.KV_REST_API_TOKEN;
 if(!url||!token)throw Error('intake-store-unconfigured');
 const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash)throw Error('intake-store-invalid-url');
 return async(args:(string|number)[]):Promise<unknown>=>{
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
  const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('intake-store-timeout'));},4000);});
  try{return await Promise.race([deadline,(async()=>{const response=await fetcher(url,{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify(args),signal:controller.signal});const data=await response.json() as {error?:unknown;result?:unknown};if(!response.ok||data.error)throw Error('intake-store-unavailable');return data.result;})()]);}
  finally{clearTimeout(timer!);}
 };
}
