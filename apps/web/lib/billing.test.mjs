import assert from "node:assert/strict";
import test from "node:test";

function annualSavings(monthlyMinor,annualMinor){
  if(monthlyMinor<=0)return 0;
  return Math.max(0,Math.round((1-annualMinor/(monthlyMinor*12))*100));
}

test("calcula desconto anual",()=>assert.equal(annualSavings(899,8990),17));
test("plano gratuito não apresenta desconto",()=>assert.equal(annualSavings(0,0),0));
test("não apresenta desconto negativo",()=>assert.equal(annualSavings(100,1300),0));
