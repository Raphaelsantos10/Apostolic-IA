export function arenaLaunchReadiness(env){
 const checks={
  payments_flag:env.ARENA_PAYMENTS_ENABLED==="true",stripe_secret:Boolean(env.STRIPE_SECRET_KEY?.startsWith("sk_")),stripe_webhook:Boolean(env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_")),https_origin:Boolean(env.APP_BASE_URL?.startsWith("https://")),
  legal_review:env.ARENA_LEGAL_REVIEW_APPROVED==="true",business_address:env.ARENA_BUSINESS_ADDRESS_CONFIGURED==="true",invoicing:env.ARENA_INVOICING_CONFIGURED==="true",complaints_book:env.ARENA_COMPLAINTS_BOOK_CONFIGURED==="true",adr_entity:env.ARENA_ADR_CONFIGURED==="true"
 };
 const blockers=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);
 return {ready:blockers.length===0,checks,blockers};
}
