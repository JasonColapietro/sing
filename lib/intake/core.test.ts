import { describe, expect, it, vi } from 'vitest';
import { purchaseEvent, signBody, deliver, validPurchase } from './core';
import fixtures from '../../tests/fixtures/intake-contract-v1.json';
import vector from '../../tests/fixtures/owner-v1-signing.json';

describe('dormant Sing purchase sender', () => {
  it('matches the owner signing vector', () => {
    expect(signBody(vector.secret, vector.timestamp, vector.rawBody)).toBe(vector.signature);
  });
  it('constructs only permitted purchase data with opaque stable identity', () => {
    const event = purchaseEvent({ id: 'evt_fixture', created: 1792929600, type:'checkout.session.completed', data: { object: {created:1792929600,
      id: 'cs_access_secret', metadata: { app: 'suede-sing', plan: 'monthly', token: 'NEVER' },
      payment_status: 'paid', amount_total: 1200, currency: 'usd', customer_details: { email: 'buyer@example.test' },
    } } });
    expect(event?.details).toEqual({product:'sing-pro',plan:'monthly',amount:1200,currency:'usd'});
    expect(JSON.stringify(event)).not.toMatch(/cs_access_secret|NEVER|buyer@example/);
    expect(event?.id).toMatch(/^purchase:[a-f0-9]{64}$/);
    expect(purchaseEvent({ id:'x', created:1792929600, data:{object:{ metadata:{app:'other'}, payment_status:'paid' }} })).toBeNull();
  });
  it('supports the current lifetime checkout',()=>{
    expect(purchaseEvent({id:'evt_life',created:1792929600,type:'checkout.session.completed',data:{object:{id:'cs_fixture',created:1792929600,metadata:{app:'suede-sing',plan:'lifetime'},payment_status:'paid',amount_total:9900,currency:'usd'}}})?.details.plan).toBe('lifetime');
  });
  it('refuses pending payments and unknown plans', () => {
    for (const [plan,status] of [['monthly','unpaid'],['bad','paid']]) {
      expect(purchaseEvent({ id:'evt_x',created:1792929600,type:'checkout.session.completed',data:{object:{id:'cs_fixture',created:1792929600,metadata:{app:'suede-sing',plan},payment_status:status,amount_total:100,currency:'usd'}}})).toBeNull();
    }
  });
  it('defaults disabled with zero outgoing requests', async () => {
    const event=purchaseEvent({id:'evt_x',created:1792929600,type:'checkout.session.completed',data:{object:{id:'cs_fixture',created:1792929600,metadata:{app:'suede-sing',plan:'monthly'},payment_status:'paid',amount_total:100,currency:'usd'}}})!;
    let calls=0;
    expect(await deliver(event, {}, async()=>{calls++;throw Error();})).toEqual({state:'disabled'});
    expect(calls).toBe(0);
  });
  it('requires durable accepted ACK and retains config errors as blocked', async () => {
    const event=purchaseEvent({id:'evt_x',created:1792929600,type:'checkout.session.completed',data:{object:{id:'cs_fixture',created:1792929600,metadata:{app:'suede-sing',plan:'monthly'},payment_status:'paid',amount_total:100,currency:'usd'}}})!;
    const env={SING_INTAKE_ENABLED:'1',SUEDE_INTAKE_CONTRACT:'0b33f45a0bdde87b8e7746666d6200c17d0c4b82',SUEDE_INTAKE_SECRET:'synthetic-test-secret-01234567890123456789'};
    for(const [status,body,want] of [[401,{},'blocked'],[202,{},'pending'],[202,{accepted:true,duplicate:false},'delivered']] as const){
      const result=await deliver(event,env,async()=>new Response(JSON.stringify(body),{status}));
      expect(result.state).toBe(want);
    }
  });
});

it('rejects shared negative fixtures at the narrower sender boundary',()=>{for(const sample of fixtures.invalid) expect(validPurchase(sample.event)).toBe(false);});

it('hard-bounds a fetch that ignores abort',async()=>{
 vi.useFakeTimers();try{
 const event=purchaseEvent({id:'evt_x',created:1792929600,type:'checkout.session.completed',data:{object:{id:'cs_fixture',created:1792929600,metadata:{app:'suede-sing',plan:'lifetime'},payment_status:'paid',amount_total:100,currency:'usd'}}})!;
 const promise=deliver(event,{SING_INTAKE_ENABLED:'1',SUEDE_INTAKE_CONTRACT:'0b33f45a0bdde87b8e7746666d6200c17d0c4b82',SUEDE_INTAKE_SECRET:'fixture-secret-012345678901234567890123'},()=>new Promise(()=>{}));
 await vi.advanceTimersByTimeAsync(4001);expect(await promise).toEqual({state:'pending'});
 }finally{vi.useRealTimers();}
});
it('deduplicates different provider notifications for the same checkout',()=>{
 const session={id:'cs_same',created:1792929600,metadata:{app:'suede-sing',plan:'lifetime'},payment_status:'paid',amount_total:100,currency:'usd'};
 const first=purchaseEvent({id:'evt_a',created:1792929600,type:'checkout.session.completed',data:{object:session}});
 const second=purchaseEvent({id:'evt_b',created:1792929700,type:'checkout.session.completed',data:{object:session}});
 expect(first).toEqual(second);
 expect(purchaseEvent({id:'evt_a',created:1792929600,type:'unrelated',data:{object:session}})).toBeNull();
});
it('rejects normalized impossible dates and dates beyond four-digit ISO years',()=>{
 const raw={id:'evt_date',created:1792929600,type:'checkout.session.completed',data:{object:{id:'cs_date',created:1792929600,metadata:{app:'suede-sing',plan:'lifetime'},payment_status:'paid',amount_total:100,currency:'usd'}}};
 const event=purchaseEvent(raw)!;
 for(const occurredAt of ['2026-02-30T12:00:00.000Z','2026-10-25T24:00:00.000Z','2026-10-25T12:60:00.000Z'])expect(validPurchase({...event,occurredAt})).toBe(false);
 expect(purchaseEvent({...raw,data:{object:{...raw.data.object,created:253402300800}}})).toBeNull();
});
