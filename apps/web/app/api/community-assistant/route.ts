import { NextResponse } from "next/server";
import { readJsonBody } from "../../../lib/request-security.mjs";
import { createClient } from "../../../lib/supabase/server";

const json=(body:unknown,status=200)=>{const response=NextResponse.json(body,{status});response.headers.set("Cache-Control","no-store");return response;};
const includesAny=(value:string,words:string[])=>words.some(word=>value.includes(word));

export async function POST(request:Request){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return json({error:"Autenticação necessária."},401);
  const body=await readJsonBody(request,12_288);
  if(!body.ok)return json({error:body.tooLarge?"Pedido demasiado grande.":"JSON inválido."},body.tooLarge?413:400);
  const input=body.value as Record<string,unknown>;
  const question=String(input.question??"").trim(); const circleId=String(input.circleId??"");
  const channelId=String(input.channelId??"")||null; let conversationId=String(input.conversationId??"")||null;
  if(question.length<2||question.length>1000||!circleId)return json({error:"Mensagem inválida."},400);
  const [{data:membership},{data:channels},{data:settings}]=await Promise.all([
    supabase.from("community_circle_members").select("role").eq("circle_id",circleId).eq("user_id",user.id).eq("status","active").maybeSingle(),
    supabase.from("community_channels").select("id,name,description,category").eq("circle_id",circleId).order("position"),
    supabase.from("community_bot_settings").select("enabled,display_name,greeting,tone,allow_channel_recommendations,allow_thread_summary,allow_lumi_handoff").eq("circle_id",circleId).maybeSingle()
  ]);
  if(!membership)return json({error:"Participação ativa necessária."},403);
  if(settings?.enabled===false)return json({error:"O guia virtual está desativado neste círculo."},403);
  const {data:allowed}=await supabase.rpc("consume_api_rate_limit",{p_bucket:"community-barnabas",p_limit:12,p_window_seconds:60});
  if(!allowed)return json({error:"Muitas mensagens. Aguarde um minuto."},429);
  if(!conversationId){
    const {data,error}=await supabase.from("community_bot_conversations").insert({circle_id:circleId,user_id:user.id}).select("id").single();
    if(error)return json({error:"Não foi possível iniciar a conversa."},500); conversationId=data.id;
  }
  const normalized=question.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  let intent="general",avatarState="speaking",answer="",actions:Array<{label:string;kind:string;value?:string}>=[];
  const channelList=channels??[];
  const pick=(terms:string[])=>channelList.find(channel=>includesAny(`${channel.name} ${channel.description}`.toLowerCase(),terms));
  if(includesAny(normalized,["tutor","moderador","pessoa humana","ajuda humana"])){
    intent="tutor";avatarState="careful";
    const {error}=await supabase.from("community_tutor_requests").insert({circle_id:circleId,channel_id:channelId,user_id:user.id,question});
    answer=error?"Não consegui chamar o tutor agora. Tente novamente dentro de instantes.":"Enviei o seu pedido aos Tutores/Moderadores. Eles poderão responder no círculo quando estiverem disponíveis.";
  }else if(includesAny(normalized,["biblia","versiculo","passagem","doutrina","interpretacao","hermeneutica","deus","jesus"])){
    intent="lumi";avatarState="studying";answer="Esta é uma pergunta bíblica. Para não misturar organização comunitária com interpretação, vou encaminhá-la à Lumi, que responde usando as fontes bíblicas aprovadas.";
    actions=[{label:"Perguntar à Lumi",kind:"lumi",value:question}];
  }else if(includesAny(normalized,["onde","qual canal","publicar","canal certo"])&&settings?.allow_channel_recommendations!==false){
    intent="channel";avatarState="success";
    const recommended=includesAny(normalized,["oracao","orar"])?pick(["oracao"]):includesAny(normalized,["historia","igreja antiga"])?pick(["historia"]):includesAny(normalized,["interpret","hermeneutica"])?pick(["hermeneutica","interpretacao"]):includesAny(normalized,["devocional","reflexao"])?pick(["devocional"]):pick(["duvidas-gerais","duvidas gerais"])??channelList.find(channel=>channel.category==="study");
    answer=recommended?`O canal mais adequado parece ser #${recommended.name}. Assim as respostas ficam organizadas numa única thread.`:"Não encontrei um canal específico. Um Diretor ou Tutor pode criar um canal para este tema.";
    if(recommended)actions=[{label:`Abrir #${recommended.name}`,kind:"channel",value:recommended.id}];
  }else if(includesAny(normalized,["resum","o que disseram","esta conversa"])&&settings?.allow_thread_summary!==false){
    intent="summary";avatarState="studying";
    const query=supabase.from("community_posts").select("body,created_at").eq("circle_id",circleId).order("created_at",{ascending:false}).limit(12);
    if(channelId)query.eq("channel_id",channelId);
    const {data:recent}=await query;
    answer=recent?.length?`Resumo das mensagens recentes:\n${recent.slice(0,5).map((post,index)=>`${index+1}. ${post.body.slice(0,180)}`).join("\n")}\n\nConfirme os detalhes nas publicações originais.`:"Ainda não há mensagens suficientes para resumir.";
  }else if(includesAny(normalized,["regra","conduta","debate","respeito","privacidade"])){
    intent="rules";avatarState="careful";answer="A regra principal é edificar: foque no conteúdo do estudo, responda com mansidão, use threads, não exponha dados pessoais e procure um Tutor quando a conversa ficar sensível.";
  }else{
    answer=`Posso recomendar canais, resumir as mensagens recentes, explicar as regras, chamar um Tutor ou encaminhar uma pergunta bíblica à Lumi. O que deseja fazer?`;
    actions=[{label:"Onde devo publicar?",kind:"prompt"},{label:"Resumir este canal",kind:"prompt"},{label:"Chamar um tutor",kind:"prompt"}];
  }
  await supabase.from("community_bot_messages").insert([
    {conversation_id:conversationId,user_id:user.id,role:"user",content:question,intent:"general",avatar_state:"greeting"},
    {conversation_id:conversationId,user_id:user.id,role:"assistant",content:answer,intent,avatar_state:avatarState}
  ]);
  await supabase.from("community_bot_conversations").update({updated_at:new Date().toISOString()}).eq("id",conversationId);
  return json({conversationId,answer,intent,avatarState,actions,name:settings?.display_name??"Barnabé"});
}
