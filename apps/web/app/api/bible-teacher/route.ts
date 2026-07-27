import {NextResponse} from "next/server";
import {createClient} from "../../../lib/supabase/server";
export async function POST(request:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:"Autenticação necessária."},{status:401});
 const input=await request.json().catch(()=>({}));const question=String(input.question??"").trim();
 if(question.length<5||question.length>1000)return NextResponse.json({error:"Pergunta inválida."},{status:400});
 const {data:quota}=await supabase.rpc("ai_daily_quota_available");if(!quota)return NextResponse.json({error:"Limite diário alcançado."},{status:429});
 const {data:sources}=await supabase.rpc("search_approved_ai_sources",{p_query:question,p_limit:5});
 if(!sources?.length)return NextResponse.json({answer:"Não encontrei fundamento aprovado suficiente. Consulte a Bíblia e uma liderança responsável.",citations:[]});
 const citations=sources.map((s:{title:string;reference_label:string})=>({title:s.title,reference:s.reference_label}));
 let answer=`Com base nas fontes aprovadas: ${sources[0].content}`;
 if(process.env.OPENAI_API_KEY){const context=sources.map((s:{reference_label:string;content:string})=>`[${s.reference_label}] ${s.content}`).join("\n\n");
  const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-5.6-sol",store:false,instructions:"Auxilie estudo bíblico somente com o contexto aprovado. Cite referências. Não crie doutrina, não profetize e declare limites.",input:`CONTEXTO:\n${context}\n\nPERGUNTA:\n${question}`})});
  if(response.ok){const result=await response.json();answer=result.output_text||answer;}}
 const {data:conversation}=await supabase.from("ai_conversations").insert({user_id:user.id,title:question.slice(0,80)}).select("id").single();
 if(conversation)await supabase.from("ai_messages").insert([{conversation_id:conversation.id,user_id:user.id,role:"user",content:question},{conversation_id:conversation.id,user_id:user.id,role:"assistant",content:answer,citations}]);
 return NextResponse.json({answer,citations});
}
