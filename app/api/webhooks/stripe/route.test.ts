import { beforeEach, expect, it, vi } from 'vitest';
import Stripe from 'stripe';
const { command }=vi.hoisted(()=>({command:vi.fn(async()=> 'pending')}));
vi.mock('@/lib/intake/store',()=>({storeCommand:()=>command}));
import { POST } from './route';
const secret='whsec_synthetic_fixture';
const env={SING_INTAKE_ENABLED:'1',SUEDE_INTAKE_CONTRACT:'0b33f45a0bdde87b8e7746666d6200c17d0c4b82',SING_STRIPE_INTAKE_WEBHOOK_SECRET:secret,UPSTASH_REDIS_REST_URL:'https://synthetic.invalid',UPSTASH_REDIS_REST_TOKEN:'fixture'};
const request=(payload:string,signature?:string)=>new Request('http://localhost/api/webhooks/stripe',{method:'POST',body:payload,headers:signature?{'stripe-signature':signature}:{}});
beforeEach(()=>{vi.unstubAllEnvs();command.mockReset();command.mockResolvedValue('pending');});
it('defaults disabled without parsing body or storage',async()=>{const req=request('not json');expect((await POST(req)).status).toBe(503);expect(req.bodyUsed).toBe(false);expect(command).not.toHaveBeenCalled();});
it('refuses unsigned traffic before admission',async()=>{for(const [k,v]of Object.entries(env))vi.stubEnv(k,v);expect((await POST(request('{}'))).status).toBe(400);expect(command).not.toHaveBeenCalled();});
it('acknowledges only durable admission and keeps storage failure retryable',async()=>{
 for(const [k,v]of Object.entries(env))vi.stubEnv(k,v);
 const payload=JSON.stringify({id:'evt_fixture',created:1792929600,type:'checkout.session.completed',data:{object:{id:'cs_synthetic',created:1792929600,metadata:{app:'suede-sing',plan:'lifetime',secret:'NEVER'},payment_status:'paid',amount_total:9900,currency:'usd',customer_email:'private@example.test'}}});
 const signature=Stripe.webhooks.generateTestHeaderString({payload,secret});
 expect((await POST(request(payload,signature))).status).toBe(200);
 expect(JSON.stringify(command.mock.calls)).not.toMatch(/private@example|NEVER|cs_synthetic/);
 command.mockRejectedValue(Error('store down'));expect((await POST(request(payload,signature))).status).toBe(503);
});
