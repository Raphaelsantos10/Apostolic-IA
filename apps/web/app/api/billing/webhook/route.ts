import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { readTextBody } from "../../../../lib/request-security.mjs";
import { verifyStripeSignature } from "../../../../lib/stripe-webhook.mjs";

export async function POST(request:Request){
  const secret=process.env.STRIPE_WEBHOOK_SECRET;
  const signature=request.headers.get("stripe-signature");
  const bodyResult=await readTextBody(request,1_000_000);
  if(!bodyResult.ok)return NextResponse.json({error:"Evento demasiado grande."},{status:413});
  const payload=bodyResult.value;
  if(!secret||!signature||!verifyStripeSignature(payload,signature,secret)){
    return NextResponse.json({error:"Assinatura inválida."},{status:400});
  }
  let event:Record<string,any>;
  try{
    event=JSON.parse(payload) as Record<string,any>;
  }catch{
    return NextResponse.json({error:"Evento inválido."},{status:400});
  }
  if(!event||typeof event!=="object"||typeof event.id!=="string"||
    event.id.length<3||event.id.length>255||typeof event.type!=="string"){
    return NextResponse.json({error:"Evento inválido."},{status:400});
  }
  const admin=createAdminClient();
  const {error:eventError}=await admin.from("billing_webhook_events").insert({provider:"stripe",event_id:event.id});
  if(eventError?.code==="23505")return NextResponse.json({received:true,duplicate:true});
  if(eventError)return NextResponse.json({error:"Evento não registado."},{status:500});

  const object=event.data?.object??{};
  if(["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)&&object.metadata?.kind==="apostolic_arena"){
    if(object.payment_status!=="paid")return NextResponse.json({received:true,pending:true});
    const {error:fulfillError}=await admin.rpc("arena_fulfill_money_purchase",{
      p_receipt_id:object.metadata.receipt_id,p_checkout_session_id:String(object.id),p_payment_intent_id:String(object.payment_intent),p_amount_minor:Number(object.amount_total),p_currency:String(object.currency)
    });
    if(fulfillError){await admin.from("billing_webhook_events").delete().eq("provider","stripe").eq("event_id",event.id);return NextResponse.json({error:"Compra da Arena não reconciliada."},{status:500});}
  }
  const fullRefund=event.type==="charge.refunded"&&Number(object.amount_refunded)>=Number(object.amount);
  if((fullRefund||event.type==="charge.dispute.created")&&object.payment_intent){
    const {error:reverseError}=await admin.rpc("arena_reverse_money_purchase",{p_payment_intent_id:String(object.payment_intent),p_reason:event.type==="charge.dispute.created"?"dispute":"refund"});
    if(reverseError){await admin.from("billing_webhook_events").delete().eq("provider","stripe").eq("event_id",event.id);return NextResponse.json({error:"Reversão da Arena não reconciliada."},{status:500});}
  }

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
