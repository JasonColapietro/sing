import { createHash, createHmac } from 'node:crypto';

// Draft-code conformance: Studio 0b33f45a0bdde87b8e7746666d6200c17d0c4b82.
// A gated admission route is prepared; no provider registration or activation.
// Identity/consent reconciliation remains held.
export interface PurchaseEvent {
  readonly id: string;
  readonly kind: 'purchase';
  readonly property: 'sing.suedeai.ai';
  readonly occurredAt: string;
  readonly summary: 'Sing Pro purchase';
  readonly details: { readonly product: 'sing-pro'; readonly plan: 'monthly' | 'annual' | 'lifetime'; readonly amount: number; readonly currency: string };
}
function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
/** Only call after provider signature verification. Omits all customer contact. */
export function purchaseEvent(raw: unknown): PurchaseEvent | null {
  const event=record(raw); const session=record(record(event?.data)?.object); const metadata=record(session?.metadata);
  if (!event || event.type!=='checkout.session.completed' || !session || metadata?.app !== 'suede-sing' || !['monthly','annual','lifetime'].includes(String(metadata.plan)) || session.payment_status !== 'paid') return null;
  if(typeof session.id!=='string'||!/^cs_[A-Za-z0-9_]{1,200}$/.test(session.id)||typeof session.created!=='number'||!Number.isSafeInteger(session.created)||session.created<0||session.created>253402300799)return null;
  if (typeof session.amount_total !== 'number' || !Number.isSafeInteger(session.amount_total) || session.amount_total < 0 || typeof session.currency !== 'string' || !/^[a-z]{3}$/.test(session.currency)) return null;
  return { id:`purchase:${createHash('sha256').update(session.id).digest('hex')}`,kind:'purchase',property:'sing.suedeai.ai',occurredAt:new Date(session.created*1000).toISOString(),summary:'Sing Pro purchase',details:{product:'sing-pro',plan:metadata.plan as 'monthly'|'annual'|'lifetime',amount:session.amount_total,currency:session.currency} };
}
/** Reject runtime additions and malformed fields before persistence or sending. */
export function validPurchase(raw: unknown): raw is PurchaseEvent {
  const e=record(raw); const d=record(e?.details);
  if(!e || !d || Object.keys(e).sort().join(',')!=='details,id,kind,occurredAt,property,summary' || Object.keys(d).sort().join(',')!=='amount,currency,plan,product') return false;
  return typeof e.id==='string' && /^purchase:[a-f0-9]{64}$/.test(e.id) && e.kind==='purchase' && e.property==='sing.suedeai.ai' && e.summary==='Sing Pro purchase' && typeof e.occurredAt==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.occurredAt) && Number.isFinite(Date.parse(e.occurredAt)) && new Date(e.occurredAt).toISOString()===e.occurredAt && d.product==='sing-pro' && ['monthly','annual','lifetime'].includes(String(d.plan)) && typeof d.amount==='number' && Number.isSafeInteger(d.amount) && d.amount>=0 && typeof d.currency==='string' && /^[a-z]{3}$/.test(d.currency);
}
export function signBody(secret: string, timestamp: string, body: string): string {
  return `v1=${createHmac('sha256',secret).update(`${timestamp}.${body}`).digest('hex')}`;
}
export type DeliveryResult = { readonly state:'disabled'|'blocked'|'pending'|'delivered'; readonly code?:number; readonly retryAfterMs?:number };
/** One bounded attempt; caller must persist pending/blocked results for repair. */
export async function deliver(event: PurchaseEvent, env: Readonly<Record<string,string|undefined>>, fetcher: typeof fetch = fetch): Promise<DeliveryResult> {
  if(env.SING_INTAKE_ENABLED !== '1' || env.SUEDE_INTAKE_CONTRACT!=='0b33f45a0bdde87b8e7746666d6200c17d0c4b82') return {state:'disabled'};
  if(!validPurchase(event)) return {state:'blocked'};
  const secret=env.SUEDE_INTAKE_SECRET;
  if(!secret || Buffer.byteLength(secret)<32) return {state:'blocked'};
  // Reconstruct approved fields, ignoring runtime additions to typed objects.
  const body=JSON.stringify({id:event.id,kind:'purchase',property:'sing.suedeai.ai',occurredAt:event.occurredAt,summary:'Sing Pro purchase',details:{product:'sing-pro',plan:event.details.plan,amount:event.details.amount,currency:event.details.currency}});
  const timestamp=String(Math.floor(Date.now()/1000));
  const controller=new AbortController();
  let timeout:ReturnType<typeof setTimeout>;
  const deadline=new Promise<DeliveryResult>(resolve=>{timeout=setTimeout(()=>{controller.abort();resolve({state:'pending'});},4000);});
  try {
    return await Promise.race([deadline,(async():Promise<DeliveryResult>=>{
    const response=await fetcher('https://agents.suedeai.ai/api/intake/events',{method:'POST',redirect:'error',headers:{'content-type':'application/json','x-suede-intake-source':'sing','x-suede-intake-timestamp':timestamp,'x-suede-intake-signature':signBody(secret,timestamp,body)},body,signal:controller.signal});
    if([400,401,403,413].includes(response.status)) return {state:'blocked',code:response.status};
    if(response.status !== 202) {const header=response.headers.get('retry-after');const seconds=header&&/^\d+$/.test(header)?Number(header):header?Math.max(0,(Date.parse(header)-Date.now())/1000):0;return {state:'pending',code:response.status,retryAfterMs:Number.isFinite(seconds)?Math.min(86400000,seconds*1000):0};}
    // Response parsing is inside the same deadline. Never accept a bare 202.
    const ack:unknown=await response.json(); const data=record(ack);
    return data?.accepted===true && typeof data.duplicate==='boolean' ? {state:'delivered'} : {state:'pending'};
    })()]);
  } catch { return {state:'pending'}; }
  finally {controller.abort();clearTimeout(timeout!);}
}
