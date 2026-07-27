"use client";
import {useEffect,useState} from "react";
import {createClient} from "../lib/supabase/client";
import {matchSpokenOption} from "../lib/voice-utils.mjs";
import {SpeechPlayer,VoiceInput,VoicePrivacySettings} from "./voice-accessibility";
type Question={id:string;prompt:string;options:string[]};
type Session={id:string;question_ids:string[];current_index:number;score:number;difficulty:number};
export function BibleGame(){
 const [session,setSession]=useState<Session|null>(null),[question,setQuestion]=useState<Question|null>(null);
 const [feedback,setFeedback]=useState(""),[ready,setReady]=useState(false),[oralAnswer,setOralAnswer]=useState("");
 useEffect(()=>{void createClient().auth.getUser().then(({data})=>setReady(Boolean(data.user)));},[]);
 async function loadQuestion(next:Session){
  const id=next.question_ids[next.current_index]; if(!id){setQuestion(null);return;}
  const {data}=await createClient().from("quiz_questions").select("id,prompt,options").eq("id",id).single();
  setQuestion(data as Question|null);
 }
 async function start(){
  const {data,error}=await createClient().rpc("start_bible_game",{p_question_count:5});
  if(error){setFeedback("Não há perguntas aprovadas suficientes.");return;}
  const next=data as Session; setSession(next);setFeedback("");await loadQuestion(next);
 }
 async function answer(index:number){
  if(!session)return; const {data,error}=await createClient().rpc("answer_bible_game",{p_session:session.id,p_selected_index:index});
  if(error){setFeedback("Não foi possível registrar a resposta.");return;}
  const result=data?.[0];setFeedback(`${result.is_correct?"Correto.":"Vamos revisar."} ${result.explanation}`);
  if(result.session_completed){setSession({...session,score:result.score,current_index:session.question_ids.length});setQuestion(null);}
  else{const next={...session,score:result.score,current_index:session.current_index+1};setSession(next);await loadQuestion(next);}
 }
 function confirmOralAnswer(){
  if(!question)return;
  const index=matchSpokenOption(oralAnswer,question.options);
  if(index<0){setFeedback("Não reconheci uma opção. Edite a transcrição ou responda pelos botões.");return;}
  setOralAnswer("");
  void answer(index);
 }
 if(!ready)return <div className="notice"><h2>Jogos bíblicos</h2><p><a href="/entrar">Entre</a> para jogar e revisar.</p></div>;
 return <section className="bible-game"><p className="eyebrow">Aprendizagem, não competição espiritual</p><h1>Desafio bíblico</h1><VoicePrivacySettings/>
 {!session&&<button className="button button-primary" onClick={start}>Iniciar sessão</button>}
 {session&&<p>Questão {Math.min(session.current_index+1,session.question_ids.length)} de {session.question_ids.length} · Pontos {session.score} · Nível adaptativo {session.difficulty}</p>}
 {question&&<article><h2>{question.prompt}</h2><SpeechPlayer text={`${question.prompt}. ${question.options.map((option,index)=>`Opção ${index+1}: ${option}`).join(". ")}`} label="Ouvir questão"/><div className="game-options">{question.options.map((option,index)=><button type="button" key={option} onClick={()=>void answer(index)}>{index+1}. {option}</button>)}</div><div className="oral-answer"><label htmlFor="oral-answer">Resposta oral editável</label><input id="oral-answer" value={oralAnswer} onChange={(event)=>setOralAnswer(event.target.value)} placeholder="Diga o número ou o texto da opção"/><VoiceInput label="Responder por voz" onTranscript={setOralAnswer}/><button className="button button-primary" type="button" disabled={!oralAnswer.trim()} onClick={confirmOralAnswer}>Confirmar resposta transcrita</button></div></article>}
 {session&&!question&&<div className="notice"><h2>Sessão concluída</h2><p>Resultado: {session.score}/{session.question_ids.length}. Erros entram na sua revisão privada.</p><button className="button button-primary" onClick={()=>{setSession(null);setFeedback("");}}>Jogar novamente</button></div>}
 {feedback&&<p className="game-feedback" role="status">{feedback}</p>}</section>;
}
