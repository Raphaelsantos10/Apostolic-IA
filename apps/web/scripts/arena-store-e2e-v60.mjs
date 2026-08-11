import assert from "node:assert/strict";
const base=(process.env.ARENA_E2E_BASE_URL??"http://localhost:3000").replace(/\/$/,"");
for(const path of ["/legal/termos","/legal/privacidade","/legal/reembolsos"]){const response=await fetch(base+path);assert.equal(response.status,200,`${path} deve responder 200`);const html=await response.text();assert.ok(html.length>500,`${path} deve conter conteúdo`)}
const checkout=await fetch(base+"/api/arena/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:"gems-small"})});assert.ok([401,503].includes(checkout.status),"checkout anónimo ou desativado deve ser bloqueado");console.log("V60 E2E: páginas jurídicas e bloqueio do checkout aprovados.");
