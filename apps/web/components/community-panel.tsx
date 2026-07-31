"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Circle = { id:string; name:string; description:string; visibility:"public"|"private" };
type Post = { id:string; circle_id:string; author_id:string; body:string; created_at:string };
type ProfileCard = { id:string; display_name:string|null; avatar_url:string|null };

export function CommunityPanel() {
  const [userId,setUserId]=useState<string|null>(null);
  const [circles,setCircles]=useState<Circle[]>([]);
  const [posts,setPosts]=useState<Post[]>([]);
  const [selected,setSelected]=useState<string>("");
  const [message,setMessage]=useState("");
  const [profiles,setProfiles]=useState<Record<string,ProfileCard>>({});
  const [ownProfile,setOwnProfile]=useState<ProfileCard|null>(null);
  const [status,setStatus]=useState("A carregar comunidade…");

  useEffect(()=>{
    let active=true;
    const loadCircles=async()=>{
      const supabase=createClient();
      const {data:auth}=await supabase.auth.getUser();
      if(!active)return;
      if(!auth.user){setStatus("Entre na sua conta para participar.");return;}
      setUserId(auth.user.id);
      const ownProfileResponse=await supabase.from("profiles")
        .select("id,display_name,avatar_url").eq("id",auth.user.id).maybeSingle();
      if(ownProfileResponse.data)setOwnProfile(ownProfileResponse.data as ProfileCard);
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
        .select("id,circle_id,author_id,body,created_at").eq("circle_id",selected)
        .order("created_at",{ascending:false});
      if(!active)return;
      if(response.error){setStatus("Não foi possível carregar as publicações.");return;}
      const nextPosts=(response.data??[]) as Post[];
      setPosts(nextPosts);
      const authorIds=[...new Set(nextPosts.map((post)=>post.author_id))];
      if(authorIds.length){
        const cards=await createClient().from("community_profile_cards")
          .select("id,display_name,avatar_url").in("id",authorIds);
        if(!cards.error)setProfiles(Object.fromEntries(
          ((cards.data??[]) as ProfileCard[]).map((profile)=>[profile.id,profile])
        ));
      }
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
    }).select("id,circle_id,author_id,body,created_at").single();
    setMessage(error?"Não foi possível publicar. Aguarde e tente novamente.":"Publicação enviada.");
    if(!error&&data){
      formElement.reset();
      setPosts((current)=>[data as Post,...current.filter((post)=>post.id!==data.id)]);
    }
  }

  if(!userId&&status) return <div className="notice"><h2>Comunidade opcional</h2><p>{status} <a href="/entrar">Entrar</a></p></div>;

  const selectedCircle=circles.find((circle)=>circle.id===selected);

  return <section className="community community-modern" aria-labelledby="community-title">
    <header className="community-hero">
      <div>
        <p className="eyebrow">Comunidade segura e voluntária</p>
        <h1 id="community-title">Aprender também é caminhar juntos</h1>
        <p className="lead">Perguntas, reflexões e círculos moderados. Sem rankings espirituais e com privacidade por padrão.</p>
      </div>
      <div className="community-stats" aria-label="Resumo da comunidade">
        <span><strong>{circles.length}</strong> círculos</span>
        <span><strong>{posts.length}</strong> publicações</span>
      </div>
    </header>
    {status&&<p role="status">{status}</p>}
    <div className="community-layout">
      <aside className="circle-list" aria-label="Seus círculos">
        <div className="community-section-title"><span aria-hidden="true">◌</span><h2>Seus círculos</h2></div>
        {circles.map(circle=><button key={circle.id} type="button"
          className={selected===circle.id?"is-active":""} onClick={()=>setSelected(circle.id)}>
          <span className="circle-avatar" aria-hidden="true">{circle.name.slice(0,1).toUpperCase()}</span>
          <span><strong>{circle.name}</strong><small>{circle.visibility==="private"?"Privado":"Público"}</small></span>
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
        <header className="feed-header">
          <div><p className="eyebrow">Círculo atual</p><h2>{selectedCircle?.name??"Comunidade"}</h2></div>
          <span>{selectedCircle?.visibility==="private"?"◉ Privado":"◎ Público"}</span>
        </header>
        <form onSubmit={publish} className="community-form community-composer">
          <span className="community-user-avatar" style={ownProfile?.avatar_url?{backgroundImage:`url("${ownProfile.avatar_url}")`}:undefined}>
            {ownProfile?.avatar_url?"":(ownProfile?.display_name??"A").slice(0,1).toUpperCase()}
          </span>
          <label htmlFor="community-post"><span className="sr-only">Nova publicação</span>
            <textarea id="community-post" name="body" required maxLength={2000}
              placeholder="Partilhe uma pergunta ou reflexão respeitosa." disabled={!selected}/>
          </label>
          <div className="composer-actions">
            <span>Texto • até 2.000 caracteres</span>
            <button className="button button-primary" disabled={!selected}>Publicar</button>
          </div>
          {message&&<small role="status">{message}</small>}
        </form>
        {posts.length===0?<div className="notice"><h2>Nenhuma publicação</h2><p>Inicie uma conversa edificante neste círculo.</p></div>:
          posts.map(post=>{const author=profiles[post.author_id];return <article className="community-post" key={post.id}>
            <header><span className="community-user-avatar" style={author?.avatar_url?{backgroundImage:`url("${author.avatar_url}")`}:undefined}>{author?.avatar_url?"":(author?.display_name??"M").slice(0,1).toUpperCase()}</span><span><strong>{author?.display_name??"Membro da comunidade"}</strong><small>{new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeStyle:"short"}).format(new Date(post.created_at))}</small></span></header>
            <p>{post.body}</p><footer><button type="button">♡ Apoiar</button><button type="button">◌ Responder</button><button type="button">◇ Guardar</button></footer>
          </article>})}
      </div>
    </div>
  </section>;
}
