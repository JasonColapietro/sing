import Stripe from 'stripe';
import { purchaseEvent } from '@/lib/intake/core';
import { createOutbox } from '@/lib/intake/outbox';
import { storeCommand } from '@/lib/intake/store';
export const runtime='nodejs';
const PIN='0b33f45a0bdde87b8e7746666d6200c17d0c4b82';
/** Admission only. No fulfillment/refund or external-notification operations. */
export async function POST(request:Request):Promise<Response> {
 const env=process.env;
 if(env.SING_INTAKE_ENABLED!=='1'||env.SUEDE_INTAKE_CONTRACT!==PIN||!env.SING_STRIPE_INTAKE_WEBHOOK_SECRET||!(env.UPSTASH_REDIS_REST_URL??env.KV_REST_API_URL)||!(env.UPSTASH_REDIS_REST_TOKEN??env.KV_REST_API_TOKEN)) return Response.json({error:'Intake disabled or unconfigured'},{status:503});
 const signature=request.headers.get('stripe-signature');if(!signature)return Response.json({error:'Invalid signature'},{status:400});
 const reader=request.body?.getReader();if(!reader)return Response.json({error:'Invalid body'},{status:400});
 let timer:ReturnType<typeof setTimeout>;
 try{
  const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{void reader.cancel().catch(()=>{});reject(Error('body-timeout'));},4000);});
  const body=await Promise.race([deadline,(async()=>{let size=0;const chunks:Uint8Array[]=[];while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>65536){await reader.cancel();throw Error('body-too-large');}chunks.push(part.value);}return Buffer.concat(chunks).toString('utf8');})()]);
  let event:Stripe.Event;
  try{event=Stripe.webhooks.constructEvent(body,signature,env.SING_STRIPE_INTAKE_WEBHOOK_SECRET);}catch{return Response.json({error:'Invalid signature'},{status:400});}
  if(event.type!=='checkout.session.completed')return Response.json({received:true});
  const purchase=purchaseEvent(event);if(!purchase){if(event.data.object.metadata?.app==='suede-sing' && event.data.object.payment_status==='paid')return Response.json({error:'Purchase requires reconciliation'},{status:503});return Response.json({received:true});}
  const state=await createOutbox(storeCommand(env)).enqueue(purchase,env);
  if(!['pending','duplicate','delivered'].includes(state))return Response.json({error:'Intake admission unavailable'},{status:503});
  return Response.json({received:true});
 }catch{return Response.json({error:'Intake admission unavailable'},{status:503});}
 finally{clearTimeout(timer!);}
}
