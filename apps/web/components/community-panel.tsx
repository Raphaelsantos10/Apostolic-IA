"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Circle = { id:string; name:string; description:string; visibility:"public"|"private" };
type Post = { id:string; circle_id:string; body:string; created_at:string };

export function CommunityPanel() {
  const [userId,setUserId]=useState<string|null>(null);
  const [circles,setCircles]=useState<Circle[]>([]);
  const [posts,setPosts]=useState<Post[]>([]);
  const [selected,setSelected]=useState<string>("");
  const [message,setMessage]=useState("");
  const [status,setStatus]=useState("A carregar comunidade…");

  const load=useCallback(async()=>{
    const supabase=createClient();
    const {data:auth}=await supabase.auth.getUser();
    if(!auth.user){setStatus("Entre na sua conta para participar.");return;}
    setUserId(auth.user.id);
    const {data,error}=await supabase.from("community_circles")
      .select("id,name,description,visibility").order("created_at");
    if(error){setStatus("Não foi possível carregar os círculos.");return;}
    const next=(data??[]) as Circle[];
    setCircles(next);
    const circleId=selected||next[0]?.id||"";
    setSelected(circleId);
    if(circleId){
      const response=await supabase.from("community_posts")
        .select("id,circle_id,body,created_at").eq("circle_id",circleId).order("created_at",{ascending:false});
      setPosts((response.data??[]) as Post[]);
    }
    setStatus("");
  },[selected]);

  useEffect(()=>{void load();},[load]);

  async function createCircle(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!userId)return;
    const form=new FormData(event.currentTarget);
    const supabase=createClient();
    const {data,error}=await supabase.from("community_circles").insert({
      owner_id:userId,name:String(form.get("name")),description:String(form.get("description")),
      visibility:String(form.get("visibility"))
    }).select("id").single();
    if(error){setStatus("Revise os dados do círculo.");return;}
    await supabase.from("community_circle_members").insert({circle_id:data.id,user_id:userId,role:"owner"});
    event.currentTarget.reset();
    setSelected(data.id);
    await load();
  }

  async function publish(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!userId||!selected)return;
    const form=new FormData(event.currentTarget);
    const {error}=await createClient().from("community_posts").insert({
      circle_id:selected,author_id:userId,body:String(form.get("body"))
    });
    setMessage(error?"Não foi possível publicar. Aguarde e tente novamente.":"Publicação enviada.");
    if(!error){event.currentTarget.reset();await load();}
  }

  if(!userId&&status) return <div className="notice"><h2>Comunidade opcional</h2><p>{status} <a href="/entrar">Entrar</a></p></div>;

  return <section className="community" aria-labelledby="community-title">
    <header>
      <p className="eyebrow">Comunidade segura e voluntária</p>
      <h1 id="community-title">Círculos de estudo</h1>
      <p className="lead">Participe no seu ritmo. Perfis são privados e práticas espirituais nunca entram em rankings.</p>
    </header>
    {status&&<p role="status">{status}</p>}
    <div className="community-layout">
      <aside className="circle-list" aria-label="Seus círculos">
        <h2>Círculos</h2>
        {circles.map(circle=><button key={circle.id} type="button"
          className={selected===circle.id?"is-active":""} onClick={()=>setSelected(circle.id)}>
          <strong>{circle.name}</strong><small>{circle.visibility==="private"?"Privado":"Público"}</small>
        </button>)}
        <details>
          <summary>Criar círculo</summary>
          <form onSubmit={createCircle} className="community-form">
            <label>Nome<input name="name" required minLength={3} maxLength={80}/></label>
            <label>Descrição<textarea name="description" maxLength={500}/></label>
            <label>Visibilidade<select name="visibility"><option value="private">Privado</option><option value="public">Público</option></select></label>
            <button className="button button-primary" type="submit">Criar</button>
          </form>
        </details>
      </aside>
      <div className="community-feed">
        <form onSubmit={publish} className="community-form">
          <label htmlFor="community-post">Nova publicação</label>
          <textarea id="community-post" name="body" required maxLength={2000}
            placeholder="Partilhe uma pergunta ou reflexão respeitosa." disabled={!selected}/>
          <button className="button button-primary" disabled={!selected}>Publicar</button>
          {message&&<small role="status">{message}</small>}
        </form>
        {posts.length===0?<div className="notice"><h2>Nenhuma publicação</h2><p>Inicie uma conversa edificante neste círculo.</p></div>:
          posts.map(post=><article className="community-post" key={post.id}>
            <p>{post.body}</p><small>{new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium"}).format(new Date(post.created_at))}</small>
          </article>)}
      </div>
    </div>
  </section>;
}
