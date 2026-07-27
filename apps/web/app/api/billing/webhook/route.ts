import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

function validSignature(payload:string,header:string,secret:string){
  const parts=Object.fromEntries(header.split(",").map((item)=>item.split("=")));
  if(!parts.t||!parts.v1)return false;
  if(Math.abs(Date.now()/1000-Number(parts.t))>300)return false;
  const expected=createHmac("sha256",secret).update(`${parts.t}.${payload}`).digest("hex");
  const received=String(parts.v1);
  return expected.length===received.length&&timingSafeEqual(Buffer.from(expected),Buffer.from(received));
}

export async function POST(request:Request){
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  const signature=request.headers.get("stripe-signature");
  const payload=await request.text();
  if(!secret||!signature||!validSignature(payload,signature,secret)){
    return NextResponse.json({error:"Assinatura inválida."},{status:400});
  }
  const event=JSON.parse(payload);
  const admin=createAdminClient();
  const {error:eventError}=await admin.from("billing_webhook_events").insert({provider:"stripe",event_id:event.id});
  if(eventError?.code==="23505")return NextResponse.json({received:true,duplicate:true});
  if(eventError)return NextResponse.json({error:"Evento não registado."},{status:500});

  if(["customer.subscription.created","customer.subscription.updated","customer.subscription.deleted"].includes(event.type)){
    const subscription=event.data.object;
    const userId=subscription.metadata?.user_id;
    const planCode=subscription.metadata?.plan_code;
    if(userId&&planCode){
      const supportedStatus=new Set(["trialing","active","past_due","canceled","unpaid"]);
      const status=event.type==="customer.subscription.deleted"
        ?"canceled"
        :supportedStatus.has(subscription.status)?subscription.status:"unpaid";
      const {error:subscriptionError}=await admin.from("billing_subscriptions").upsert({
        user_id:userId,
        plan_code:planCode,
        provider:"stripe",
        provider_customer_id:String(subscription.customer),
        provider_subscription_id:String(subscription.id),
        status,
        current_period_end:subscription.current_period_end?new Date(subscription.current_period_end*1000).toISOString():null,
        cancel_at_period_end:Boolean(subscription.cancel_at_period_end)
      });
      if(subscriptionError){
        await admin.from("billing_webhook_events").delete().eq("provider","stripe").eq("event_id",event.id);
        return NextResponse.json({error:"Assinatura não atualizada."},{status:500});
      }
    }
  }
  return NextResponse.json({received:true});
}
