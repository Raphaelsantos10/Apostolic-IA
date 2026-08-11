import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { resolveAppOrigin } from "../../../../lib/request-security.mjs";
export async function POST(request: Request) {
  if (
    process.env.ARENA_PAYMENTS_ENABLED !== "true" ||
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.STRIPE_ALLIANCE_PRO_PRICE_ID
  )
    return NextResponse.json(
      { error: "Aliança PRO ainda não configurada." },
      { status: 503 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "Autenticação necessária." },
      { status: 401 },
    );
  const { data, error } = await supabase.rpc(
    "arena_prepare_alliance_pro_checkout",
  );
  if (error || !data)
    return NextResponse.json(
      { error: "Somente o fundador pode assinar." },
      { status: 403 },
    );
  const intent = data as { intent_id: string; alliance_id: string };
  const origin = resolveAppOrigin({
    configured: process.env.APP_BASE_URL,
    requestUrl: request.url,
    production: process.env.NODE_ENV === "production",
  });
  if (!origin)
    return NextResponse.json(
      { error: "Origem segura não configurada." },
      { status: 503 },
    );
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", process.env.STRIPE_ALLIANCE_PRO_PRICE_ID);
  body.set("line_items[0][quantity]", "1");
  body.set("customer_email", user.email ?? "");
  body.set(
    "success_url",
    `${origin}/dashboard-preview?section=games&alliancePro=success`,
  );
  body.set(
    "cancel_url",
    `${origin}/dashboard-preview?section=games&alliancePro=cancel`,
  );
  for (const [k, v] of Object.entries({
    kind: "apostolic_alliance_pro",
    intent_id: intent.intent_id,
    alliance_id: intent.alliance_id,
    user_id: user.id,
  })) {
    body.set(`metadata[${k}]`, v);
    body.set(`subscription_data[metadata][${k}]`, v);
  }
  const stripe = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `alliance-pro-${intent.intent_id}`,
    },
    body,
  });
  const result = (await stripe.json().catch(() => ({}))) as { url?: string };
  return stripe.ok && result.url
    ? NextResponse.json({ url: result.url })
    : NextResponse.json(
        { error: "Não foi possível iniciar a assinatura." },
        { status: 502 },
      );
}
