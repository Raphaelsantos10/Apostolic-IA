"use client";

import { FormEvent, useEffect, useState } from "react";
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

  useEffect(()=>{
    let active=true;
    const loadCircles=async()=>{
      const supabase=createClient();
      const {data:auth}=await supabase.auth.getUser();
      if(!active)return;
      if(!auth.user){setStatus("Entre na sua conta para participar.");return;}
      setUserId(auth.user.id);
      const {data,error}=await supabase.from("community_circles")
        .select("id,name,description,visibility").order("created_at");
      if(!active)return;
      if(error){setStatus("Não foi possível carregar os círculos.");return;}
      const next=(data??[]) as Circle[];
      setCircles(next);
      setSelected((current)=>current||next[0]?.id||"");
      setStatus("");
    };
    void loadCircles();
    return()=>{active=false;};
  },[]);

  useEffect(()=>{
    let active=true;
    const loadPosts=async()=>{
      if(!selected){setPosts([]);return;}
      const response=await createClient().from("community_posts")
        .select("id,circle_id,body,created_at").eq("circle_id",selected)
        .order("created_at",{ascending:false});
      if(!active)return;
      if(response.error){setStatus("Não foi possível carregar as publicações.");return;}
      setPosts((response.data??[]) as Post[]);
      setMessage("");
    };
    void loadPosts();
    return()=>{active=false;};
  },[selected]);

  async function createCircle(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!userId)return;
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    const supabase=createClient();
    const {data,error}=await supabase.from("community_circles").insert({
      owner_id:userId,name:String(form.get("name")),description:String(form.get("description")),
      visibility:String(form.get("visibility"))
    }).select("id,name,description,visibility").single();
    if(error){setStatus("Revise os dados do círculo.");return;}
    const membership=await supabase.from("community_circle_members")
      .insert({circle_id:data.id,user_id:userId,role:"owner"});
    if(membership.error){setStatus("O círculo foi criado, mas a adesão falhou.");return;}
    formElement.reset();
    setCircles((current)=>[...current.filter((circle)=>circle.id!==data.id),data as Circle]);
    setSelected(data.id);
  }

  async function publish(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!userId||!selected)return;
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    const {data,error}=await createClient().from("community_posts").insert({
      circle_id:selected,author_id:userId,body:String(form.get("body"))
    }).select("id,circle_id,body,created_at").single();
    setMessage(error?"Não foi possível publicar. Aguarde e tente novamente.":"Publicação enviada.");
    if(!error&&data){
      formElement.reset();
      setPosts((current)=>[data as Post,...current.filter((post)=>post.id!==data.id)]);
    }
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
