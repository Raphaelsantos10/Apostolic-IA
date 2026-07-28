import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { billingRegions } from "../../../../lib/billing";
import {
  readJsonBody,
  resolveAppOrigin
} from "../../../../lib/request-security.mjs";

const allowedPlans = new Set(["plus","supporter"]);
const allowedIntervals = new Set(["monthly","annual"]);

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Entre na sua conta para assinar."},{status:401});

  const bodyResult=await readJsonBody(request,16_384);
  if(!bodyResult.ok){
    return NextResponse.json(
      {error:bodyResult.tooLarge?"Pedido demasiado grande.":"JSON inválido."},
      {status:bodyResult.tooLarge?413:400}
    );
  }
  const input=bodyResult.value as Record<string,unknown>;
  const planCode=String(input.planCode??"");
  const region=String(input.region??"");
  const interval=String(input.interval??"");
  if(!allowedPlans.has(planCode)||!(region in billingRegions)||!allowedIntervals.has(interval)){
    return NextResponse.json({error:"Plano, região ou período inválido."},{status:400});
  }

  const {data:allowed,error:limitError}=await supabase.rpc("consume_api_rate_limit",{
    p_bucket:"billing-checkout",p_limit:5,p_window_seconds:600
  });
  if(limitError)return NextResponse.json({error:"Proteção temporariamente indisponível."},{status:503});
  if(!allowed)return NextResponse.json({error:"Muitas tentativas. Aguarde alguns minutos."},{status:429});

  const {data:price}=await supabase.from("billing_prices")
    .select("currency,monthly_minor,annual_minor")
    .eq("plan_code",planCode).eq("region",region).eq("active",true).single();
  if(!price)return NextResponse.json({error:"Preço regional indisponível."},{status:404});
  if(!process.env.STRIPE_SECRET_KEY){
    return NextResponse.json({error:"Checkout ainda não ativado neste ambiente."},{status:503});
  }

  const amount=interval==="monthly"?price.monthly_minor:price.annual_minor;
  const origin=resolveAppOrigin({
    configured:process.env.APP_BASE_URL,
    requestUrl:request.url,
    production:process.env.NODE_ENV==="production"
  });
  if(!origin)return NextResponse.json({error:"Origem segura não configurada."},{status:503});
  const body=new URLSearchParams();
  body.set("mode","subscription");
  body.set("client_reference_id",user.id);
  body.set("customer_email",user.email??"");
  body.set("success_url",`${origin}/?billing=success`);
  body.set("cancel_url",`${origin}/?billing=cancel`);
  body.set("line_items[0][quantity]","1");
  body.set("line_items[0][price_data][currency]",price.currency.toLowerCase());
  body.set("line_items[0][price_data][unit_amount]",String(amount));
  body.set("line_items[0][price_data][recurring][interval]",interval==="monthly"?"month":"year");
  body.set("line_items[0][price_data][product_data][name]",`Apostolic IA ${planCode==="plus"?"Plus":"Apoiador"}`);
  body.set("subscription_data[metadata][user_id]",user.id);
  body.set("subscription_data[metadata][plan_code]",planCode);
  body.set("metadata[user_id]",user.id);
  body.set("metadata[plan_code]",planCode);
  body.set("metadata[region]",region);

  try{
    const stripe=await fetch("https://api.stripe.com/v1/checkout/sessions",{
      method:"POST",
      headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,"Content-Type":"application/x-www-form-urlencoded"},
      body,
      signal:AbortSignal.timeout(20_000)
    });
    const result=await stripe.json().catch(()=>({}));
    if(!stripe.ok||!result.url)return NextResponse.json({error:"Não foi possível iniciar o checkout."},{status:502});
    return NextResponse.json({url:result.url});
  }catch{
    return NextResponse.json({error:"Serviço de pagamento indisponível."},{status:502});
  }
}
