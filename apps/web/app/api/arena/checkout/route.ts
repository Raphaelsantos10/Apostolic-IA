import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { readJsonBody,resolveAppOrigin } from "../../../../lib/request-security.mjs";

type PreparedPurchase={receipt_id:string;product_id:string;name:string;amount_minor:number;currency:string};

export async function POST(request:Request){
  if(process.env.ARENA_PAYMENTS_ENABLED!=="true")return NextResponse.json({error:"Compras da Arena ainda estão em validação."},{status:503});
  if(!process.env.STRIPE_SECRET_KEY)return NextResponse.json({error:"Pagamento não configurado."},{status:503});
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Entre na sua conta para comprar."},{status:401});
  const parsed=await readJsonBody(request,4096);
  if(!parsed.ok)return NextResponse.json({error:"Pedido inválido."},{status:400});
  const productId=String((parsed.value as Record<string,unknown>).productId??"");
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(productId))return NextResponse.json({error:"Produto inválido."},{status:400});
  const {data:allowed}=await supabase.rpc("consume_api_rate_limit",{p_bucket:"arena-checkout",p_limit:5,p_window_seconds:600});
  if(!allowed)return NextResponse.json({error:"Muitas tentativas. Aguarde alguns minutos."},{status:429});
  const {data,error}=await supabase.rpc("arena_prepare_money_purchase",{p_product_id:productId});
  if(error||!data)return NextResponse.json({error:"Produto indisponível."},{status:400});
  const purchase=data as PreparedPurchase;
  const origin=resolveAppOrigin({configured:process.env.APP_BASE_URL,requestUrl:request.url,production:process.env.NODE_ENV==="production"});
  if(!origin)return NextResponse.json({error:"Origem segura não configurada."},{status:503});
  const body=new URLSearchParams();
  body.set("mode","payment"); body.set("client_reference_id",user.id); body.set("customer_email",user.email??"");
  body.set("success_url",`${origin}/dashboard-preview?section=games&arenaPayment=success`); body.set("cancel_url",`${origin}/dashboard-preview?section=games&arenaPayment=cancel`);
  body.set("line_items[0][quantity]","1"); body.set("line_items[0][price_data][currency]",purchase.currency); body.set("line_items[0][price_data][unit_amount]",String(purchase.amount_minor)); body.set("line_items[0][price_data][product_data][name]",purchase.name);
  body.set("metadata[kind]","apostolic_arena"); body.set("metadata[receipt_id]",purchase.receipt_id); body.set("metadata[user_id]",user.id); body.set("metadata[product_id]",purchase.product_id);
  try{
    const stripe=await fetch("https://api.stripe.com/v1/checkout/sessions",{method:"POST",headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,"Content-Type":"application/x-www-form-urlencoded","Idempotency-Key":`arena-${purchase.receipt_id}`},body,signal:AbortSignal.timeout(20_000)});
    const result=await stripe.json().catch(()=>({})) as {url?:string};
    if(!stripe.ok||!result.url)return NextResponse.json({error:"Não foi possível iniciar o pagamento."},{status:502});
    return NextResponse.json({url:result.url});
  }catch{return NextResponse.json({error:"Serviço de pagamento indisponível."},{status:502});}
}
