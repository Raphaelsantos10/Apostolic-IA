"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "../lib/supabase/client";
import { CommunityBarnabasChat } from "./community-barnabas-chat";

type Circle = { id:string; name:string; description:string; visibility:"public"|"private" };
type Channel = { id:string; circle_id:string; name:string; category:string; channel_kind:"chat"|"forum"|"read_only"; description:string; slowmode_seconds:number; position:number };
type Post = { id:string; circle_id:string; channel_id:string|null; parent_post_id:string|null; author_id:string; body:string; created_at:string };
type ProfileCard = { id:string; display_name:string|null; avatar_url:string|null };
type CommunityProfile = { bio:string; interests:string[]; specialties:string[]; enrolled_courses:string[]; reputation:number; badge:string|null };
type ReactionName = "amen"|"thanks"|"helpful"|"pray"|"heart";
type Reaction = { post_id:string; user_id:string; reaction:ReactionName };
type StudyRoom = { id:string; title:string; room_mode:"audio"|"video"; status:"scheduled"|"live"|"ended"; starts_at:string; external_url:string|null };

export function CommunityPanel() {
  const [userId,setUserId]=useState<string|null>(null);
  const [circles,setCircles]=useState<Circle[]>([]);
  const [posts,setPosts]=useState<Post[]>([]);
  const [selected,setSelected]=useState<string>("");
  const [channels,setChannels]=useState<Channel[]>([]);
  const [selectedChannel,setSelectedChannel]=useState("");
  const [replyingTo,setReplyingTo]=useState<Post|null>(null);
  const [memberRole,setMemberRole]=useState("member");
  const [message,setMessage]=useState("");
  const [profiles,setProfiles]=useState<Record<string,ProfileCard>>({});
  const [ownProfile,setOwnProfile]=useState<ProfileCard|null>(null);
  const [status,setStatus]=useState("A carregar comunidade…");
  const [communityProfile,setCommunityProfile]=useState<CommunityProfile>({bio:"",interests:[],specialties:[],enrolled_courses:[],reputation:0,badge:null});
  const [reactions,setReactions]=useState<Reaction[]>([]);
  const [studyRooms,setStudyRooms]=useState<StudyRoom[]>([]);
  const [lumiOpen,setLumiOpen]=useState(false);
  const [editingChannel,setEditingChannel]=useState<Channel|null>(null);
  const [profileSaving,setProfileSaving]=useState(false);

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
      const detailResponse=await supabase.from("community_profile_details")
        .select("bio,interests,specialties,enrolled_courses,reputation,badge").eq("user_id",auth.user.id).maybeSingle();
      if(detailResponse.data)setCommunityProfile(detailResponse.data as CommunityProfile);
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
    const loadChannels=async()=>{
      if(!selected){setChannels([]);return;}
      const supabase=createClient();
      const [channelResponse,membershipResponse]=await Promise.all([
        supabase.from("community_channels").select("id,circle_id,name,category,channel_kind,description,slowmode_seconds,position").eq("circle_id",selected).order("position"),
        supabase.from("community_circle_members").select("role").eq("circle_id",selected).eq("user_id",userId??"").maybeSingle()
      ]);
      if(!active)return;
      const next=(channelResponse.data??[]) as Channel[];
      setChannels(next); setSelectedChannel(next[0]?.id??"");
      setMemberRole(String(membershipResponse.data?.role??"member"));
    };
    void loadChannels();
    return()=>{active=false;};
  },[selected,userId]);

  useEffect(()=>{
    let active=true;
    const loadPosts=async()=>{
      if(!selected||!selectedChannel){setPosts([]);return;}
      const response=await createClient().from("community_posts")
        .select("id,circle_id,channel_id,parent_post_id,author_id,body,created_at")
        .eq("circle_id",selected).eq("channel_id",selectedChannel)
        .order("created_at",{ascending:false});
      if(!active)return;
      if(response.error){setStatus("Não foi possível carregar as publicações.");return;}
      const nextPosts=(response.data??[]) as Post[];
      setPosts(nextPosts);
      if(nextPosts.length){
        const reactionResponse=await createClient().from("community_post_reactions")
          .select("post_id,user_id,reaction").in("post_id",nextPosts.map(post=>post.id));
        if(!reactionResponse.error)setReactions((reactionResponse.data??[]) as Reaction[]);
      }else setReactions([]);
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
  },[selected,selectedChannel]);

  useEffect(()=>{
    if(!selected){setStudyRooms([]);return;}
    let active=true;
    void createClient().from("community_study_rooms")
      .select("id,title,room_mode,status,starts_at,external_url").eq("circle_id",selected)
      .neq("status","ended").order("starts_at").then(({data})=>{if(active)setStudyRooms((data??[]) as StudyRoom[]);});
    return()=>{active=false;};
  },[selected]);

  useEffect(()=>{
    if(!selectedChannel)return;
    const supabase=createClient();
    const realtime=supabase.channel(`community:${selectedChannel}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"community_posts",filter:`channel_id=eq.${selectedChannel}`},payload=>{
        const incoming=payload.new as Post;
        setPosts(current=>current.some(post=>post.id===incoming.id)?current:[incoming,...current]);
      })
      .on("postgres_changes",{event:"DELETE",schema:"public",table:"community_posts",filter:`channel_id=eq.${selectedChannel}`},payload=>{
        setPosts(current=>current.filter(post=>post.id!==String(payload.old.id)));
      }).subscribe();
    return()=>{void supabase.removeChannel(realtime);};
  },[selectedChannel]);

  async function createCircle(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!userId)return;
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    const supabase=createClient();
    setStatus("A criar círculo e canais…");
    const {data,error}=await supabase.rpc("create_community_circle",{
      p_name:String(form.get("name")),p_description:String(form.get("description")??""),
      p_visibility:String(form.get("visibility"))
    });
    const created=(Array.isArray(data)?data[0]:data) as Circle|null;
    if(error||!created){setStatus(`Não foi possível criar o círculo${error?.message?`: ${error.message}`:"."}`);return;}
    formElement.reset();
    setCircles((current)=>[...current.filter((circle)=>circle.id!==created.id),created]);
    setSelected(created.id); setSelectedChannel("");
    setStatus("Círculo criado. Os canais de estudo já estão disponíveis.");
  }

  async function publish(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(!userId||!selected||!selectedChannel)return;
    const formElement=event.currentTarget;
    const form=new FormData(formElement);
    const {data,error}=await createClient().from("community_posts").insert({
      circle_id:selected,channel_id:selectedChannel,parent_post_id:replyingTo?.id??null,
      author_id:userId,body:String(form.get("body"))
    }).select("id,circle_id,channel_id,parent_post_id,author_id,body,created_at").single();
    setMessage(error?"Não foi possível publicar. Aguarde e tente novamente.":"Publicação enviada.");
    if(!error&&data){
      formElement.reset();
      setPosts((current)=>[data as Post,...current.filter((post)=>post.id!==data.id)]);
      setReplyingTo(null);
    }
  }

  async function saveCommunityProfile(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); if(!userId)return; setProfileSaving(true);
    const formElement=event.currentTarget; const form=new FormData(formElement); const supabase=createClient();
    const split=(value:FormDataEntryValue|null)=>String(value??"").split(",").map(item=>item.trim()).filter(Boolean).slice(0,12);
    const next={bio:String(form.get("bio")??"").slice(0,280),interests:split(form.get("interests")),specialties:split(form.get("specialties")),enrolled_courses:split(form.get("courses"))};
    let avatarUrl=ownProfile?.avatar_url??null;
    const avatar=form.get("avatar");
    if(avatar instanceof File&&avatar.size>0){
      if(avatar.size>2_097_152||!["image/jpeg","image/png","image/webp"].includes(avatar.type)){setMessage("Use uma fotografia JPG, PNG ou WebP com até 2 MB.");setProfileSaving(false);return;}
      const extension=avatar.name.split(".").pop()?.toLowerCase()||"webp";
      const path=`${userId}/community-${Date.now()}.${extension}`;
      const upload=await supabase.storage.from("profile-avatars").upload(path,avatar,{upsert:false,contentType:avatar.type});
      if(upload.error){setMessage("Não foi possível enviar a fotografia.");setProfileSaving(false);return;}
      avatarUrl=supabase.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
    }
    const displayName=String(form.get("display_name")??"").trim().slice(0,80);
    const [detailResponse,profileResponse]=await Promise.all([
      supabase.from("community_profile_details").upsert({user_id:userId,...next}),
      supabase.from("profiles").update({display_name:displayName,avatar_url:avatarUrl}).eq("id",userId)
    ]);
    const error=detailResponse.error??profileResponse.error;
    if(!error){setCommunityProfile(current=>({...current,...next}));setOwnProfile({id:userId,display_name:displayName,avatar_url:avatarUrl});formElement.reset();}
    setMessage(error?"Não foi possível guardar o perfil.":"Perfil e fotografia atualizados."); setProfileSaving(false);
  }

  const normalizeChannelName=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40);

  async function createChannel(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); if(!userId||!selected||!(["owner","moderator"].includes(memberRole)))return;
    const formElement=event.currentTarget; const form=new FormData(formElement);
    const payload={circle_id:selected,created_by:userId,name:normalizeChannelName(String(form.get("name"))),category:String(form.get("category")),channel_kind:String(form.get("channel_kind")),description:String(form.get("description")??"").slice(0,240),slowmode_seconds:Number(form.get("slowmode_seconds")??10),position:(Math.max(0,...channels.map(channel=>channel.position))+10)};
    const {data,error}=await createClient().from("community_channels").insert(payload).select("id,circle_id,name,category,channel_kind,description,slowmode_seconds,position").single();
    if(error){setMessage(`Não foi possível criar o canal: ${error.message}`);return;}
    setChannels(current=>[...current,data as Channel].sort((a,b)=>a.position-b.position));formElement.reset();setMessage("Canal criado.");
  }

  async function updateChannel(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); if(!editingChannel||!(["owner","moderator"].includes(memberRole)))return;
    const form=new FormData(event.currentTarget); const changes={name:normalizeChannelName(String(form.get("name"))),category:String(form.get("category")),channel_kind:String(form.get("channel_kind")),description:String(form.get("description")??"").slice(0,240),slowmode_seconds:Number(form.get("slowmode_seconds")??10)};
    const {data,error}=await createClient().from("community_channels").update(changes).eq("id",editingChannel.id).select("id,circle_id,name,category,channel_kind,description,slowmode_seconds,position").single();
    if(error){setMessage(`Não foi possível editar o canal: ${error.message}`);return;}
    setChannels(current=>current.map(channel=>channel.id===data.id?data as Channel:channel));setEditingChannel(null);setMessage("Canal atualizado.");
  }

  async function removeChannel(channel:Channel){
    if(!(["owner","moderator"].includes(memberRole)))return;
    if(!window.confirm(`Remover #${channel.name}? As publicações e threads deste canal também serão removidas.`))return;
    const {error}=await createClient().from("community_channels").delete().eq("id",channel.id);
    if(error){setMessage(`Não foi possível remover o canal: ${error.message}`);return;}
    const remaining=channels.filter(item=>item.id!==channel.id);setChannels(remaining);setSelectedChannel(current=>current===channel.id?(remaining[0]?.id??""):current);setEditingChannel(null);setMessage("Canal removido.");
  }

  async function reportPost(post:Post){
    if(!userId)return;
    const details=window.prompt("Descreva brevemente o problema (sem incluir dados pessoais):")?.trim();
    if(!details)return;
    const {error}=await createClient().from("community_reports").insert({reporter_id:userId,circle_id:selected,post_id:post.id,reason:"other",details:details.slice(0,500)});
    setMessage(error?"Não foi possível enviar a denúncia.":"Denúncia enviada à moderação.");
  }

  async function removeOwnPost(post:Post){
    if(post.author_id!==userId)return;
    const {error}=await createClient().from("community_posts").delete().eq("id",post.id);
    if(!error)setPosts((current)=>current.filter((item)=>item.id!==post.id));
  }

  async function toggleReaction(postId:string,reaction:ReactionName){
    if(!userId)return;
    const {data,error}=await createClient().rpc("toggle_community_reaction",{p_post_id:postId,p_reaction:reaction});
    if(error){setMessage("Não foi possível registar a reação.");return;}
    setReactions(current=>data
      ?[...current.filter(item=>!(item.post_id===postId&&item.user_id===userId&&item.reaction===reaction)),{post_id:postId,user_id:userId,reaction}]
      :current.filter(item=>!(item.post_id===postId&&item.user_id===userId&&item.reaction===reaction)));
  }

  async function createStudyRoom(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); if(!userId||!selected)return;
    const formElement=event.currentTarget; const form=new FormData(formElement);
    const startsAt=String(form.get("starts_at")||new Date(Date.now()+15*60_000).toISOString());
    const {data,error}=await createClient().from("community_study_rooms").insert({
      circle_id:selected,channel_id:selectedChannel||null,host_id:userId,title:String(form.get("title")),
      room_mode:String(form.get("room_mode")),starts_at:new Date(startsAt).toISOString()
    }).select("id,title,room_mode,status,starts_at,external_url").single();
    if(error){setMessage("Não foi possível agendar a sala.");return;}
    setStudyRooms(current=>[...current,data as StudyRoom].sort((a,b)=>a.starts_at.localeCompare(b.starts_at)));
    formElement.reset(); setMessage("Sala de estudo agendada.");
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
      <div className="community-hero-side">
        <div className="community-stats" aria-label="Resumo da comunidade">
          <span><strong>{circles.length}</strong> círculos</span><span><strong>{posts.length}</strong> publicações</span>
        </div>
        <button className="community-lumi-trigger" type="button" onClick={()=>setLumiOpen(value=>!value)} aria-expanded={lumiOpen}>
          <Image src="/characters/lumi/community-barnabas-greeting-v2.png" width={180} height={180} alt="Barnabé acenando com a centelha da Lumi"/>
          <span><strong>Falar com Barnabé</strong><small>{lumiOpen?"Fechar orientação":"Onde devo publicar?"}</small></span>
        </button>
      </div>
    </header>
    {lumiOpen&&<aside className="community-lumi-panel" aria-label="Orientação de Barnabé">
      <button type="button" className="community-lumi-close" onClick={()=>setLumiOpen(false)} aria-label="Fechar Barnabé">×</button>
      <Image src="/characters/lumi/community-barnabas-study-v2.png" width={220} height={220} alt="Barnabé estudando um pergaminho com a centelha da Lumi"/>
      <div><p className="eyebrow">Barnabé na comunidade</p><h2>Vamos manter a conversa edificante?</h2>
        <p>Escolha o canal da matéria, abra uma thread para cada pergunta e responda ao conteúdo — não à pessoa.</p>
        <ul><li><strong>Dúvida sobre um texto:</strong> Hermenêutica</li><li><strong>Necessidade pessoal:</strong> Pedidos de oração</li><li><strong>Não sabe onde:</strong> Dúvidas gerais</li></ul>
        <p><strong>Regra de ouro:</strong> foco no estudo, respeito entre tradições e cuidado com dados pessoais.</p></div>
    </aside>}
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
        <details className="community-profile-editor">
          <summary>Meu perfil comunitário</summary>
          <form className="community-form" onSubmit={saveCommunityProfile}>
            <div className="community-profile-preview">
              <span className="community-profile-photo" style={ownProfile?.avatar_url?{backgroundImage:`url("${ownProfile.avatar_url}")`}:undefined}>{ownProfile?.avatar_url?"":(ownProfile?.display_name??"A").slice(0,1).toUpperCase()}</span>
              <span><strong>{ownProfile?.display_name??"Seu nome"}</strong><small>Perfil visto pelos membros</small></span>
            </div>
            <label>Nome de apresentação<input name="display_name" required minLength={2} maxLength={80} defaultValue={ownProfile?.display_name??""}/></label>
            <label>Fotografia real<input name="avatar" type="file" accept="image/jpeg,image/png,image/webp"/><small>JPG, PNG ou WebP, até 2 MB.</small></label>
            <label>Bio<textarea name="bio" maxLength={280} defaultValue={communityProfile.bio}/></label>
            <label>Interesses<input name="interests" defaultValue={communityProfile.interests.join(", ")} placeholder="Bíblia, liderança, música"/></label>
            <label>Especialidades<input name="specialties" defaultValue={communityProfile.specialties.join(", ")} placeholder="Ensino, louvor, aconselhamento"/></label>
            <label>Cursos matriculados<input name="courses" defaultValue={communityProfile.enrolled_courses.join(", ")} placeholder="Panorama Bíblico, Hermenêutica"/></label>
            <small>Separe as etiquetas por vírgulas.</small>
            <button className="button button-secondary" type="submit" disabled={profileSaving}>{profileSaving?"A guardar…":"Guardar perfil completo"}</button>
          </form>
        </details>
        <div className="channel-directory">
          <div className="channel-heading"><h3>Canais</h3>{["owner","moderator"].includes(memberRole)&&<details><summary>＋ Criar</summary>
            <form className="community-form channel-form" onSubmit={createChannel}>
              <label>Nome<input name="name" required minLength={2} maxLength={40} placeholder="estudo-de-romanos"/></label>
              <label>Categoria<select name="category"><option value="study">Estudos</option><option value="community">Comunidade</option><option value="announcements">Informação</option><option value="start">Comece aqui</option><option value="showcase">Conquistas</option></select></label>
              <label>Formato<select name="channel_kind"><option value="forum">Fórum com threads</option><option value="chat">Chat</option><option value="read_only">Somente leitura</option></select></label>
              <label>Descrição<input name="description" maxLength={240}/></label><label>Modo lento (segundos)<input name="slowmode_seconds" type="number" min={0} max={3600} defaultValue={10}/></label>
              <button className="button button-primary">Criar canal</button>
            </form></details>}</div>
          {editingChannel&&<form className="community-form channel-form channel-edit-form" onSubmit={updateChannel}>
            <div className="channel-form-title"><strong>Editar #{editingChannel.name}</strong><button type="button" onClick={()=>setEditingChannel(null)}>×</button></div>
            <label>Nome<input name="name" required minLength={2} maxLength={40} defaultValue={editingChannel.name}/></label>
            <label>Categoria<select name="category" defaultValue={editingChannel.category}><option value="study">Estudos</option><option value="community">Comunidade</option><option value="announcements">Informação</option><option value="start">Comece aqui</option><option value="showcase">Conquistas</option></select></label>
            <label>Formato<select name="channel_kind" defaultValue={editingChannel.channel_kind}><option value="forum">Fórum com threads</option><option value="chat">Chat</option><option value="read_only">Somente leitura</option></select></label>
            <label>Descrição<input name="description" maxLength={240} defaultValue={editingChannel.description}/></label><label>Modo lento<input name="slowmode_seconds" type="number" min={0} max={3600} defaultValue={editingChannel.slowmode_seconds}/></label>
            <div className="channel-form-actions"><button className="button button-secondary">Guardar</button><button className="button channel-delete" type="button" onClick={()=>void removeChannel(editingChannel)}>Remover canal</button></div>
          </form>}
          {["start","announcements","community","study","showcase"].map(category=>{
            const categoryChannels=channels.filter(channel=>channel.category===category);
            if(!categoryChannels.length)return null;
            const labels:Record<string,string>={start:"Comece aqui",announcements:"Informação",community:"Comunidade",study:"Estudos",showcase:"Conquistas"};
            return <section key={category}><small>{labels[category]}</small>{categoryChannels.map(channel=><div className="channel-row" key={channel.id}><button
              type="button" className={selectedChannel===channel.id?"is-active":""}
              onClick={()=>{setSelectedChannel(channel.id);setReplyingTo(null);}} title={channel.description}>
              <span aria-hidden="true">{channel.channel_kind==="forum"?"◫":"#"}</span><span>{channel.name}</span>
              {channel.channel_kind==="read_only"&&<em>leitura</em>}
            </button>{["owner","moderator"].includes(memberRole)&&<button className="channel-settings" type="button" onClick={()=>setEditingChannel(channel)} aria-label={`Editar canal ${channel.name}`}>•••</button>}</div>)}</section>;
          })}
        </div>
      </aside>
      <div className="community-feed">
        <header className="feed-header">
          <div><p className="eyebrow">{selectedCircle?.name??"Comunidade"}</p><h2># {channels.find(channel=>channel.id===selectedChannel)?.name??"canal"}</h2><small>{channels.find(channel=>channel.id===selectedChannel)?.description}</small></div>
          <span>{memberRole==="owner"?"👑 Diretor":memberRole==="moderator"?"📖 Tutor / Moderador":"🎓 Estudante"}</span>
        </header>
        <details className="community-study-rooms">
          <summary>🎙 Salas de estudo por áudio ou vídeo <span>{studyRooms.length}</span></summary>
          <div className="study-room-grid">
            {studyRooms.map(room=><article key={room.id}><span aria-hidden="true">{room.room_mode==="video"?"📹":"🎧"}</span><div><strong>{room.title}</strong><small>{new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeStyle:"short"}).format(new Date(room.starts_at))}</small></div>{room.external_url?<a className="button button-secondary" href={room.external_url} target="_blank" rel="noreferrer">Entrar</a>:<span className="room-waiting">Lobby</span>}</article>)}
          </div>
          <form className="community-room-form" onSubmit={createStudyRoom}>
            <input name="title" required minLength={3} maxLength={100} placeholder="Tema da sala de estudo"/>
            <select name="room_mode" aria-label="Modo da sala"><option value="audio">Áudio</option><option value="video">Vídeo</option></select>
            <input name="starts_at" type="datetime-local" required aria-label="Data e hora"/>
            <button className="button button-secondary">Agendar sala</button>
          </form>
          <small>O lobby organiza o encontro. A ligação segura da chamada será ativada quando o provedor de áudio/vídeo for configurado.</small>
        </details>
        {replyingTo&&<div className="replying-banner"><span>A responder a <strong>{profiles[replyingTo.author_id]?.display_name??"membro"}</strong></span><button type="button" onClick={()=>setReplyingTo(null)}>Cancelar</button></div>}
        <form onSubmit={publish} className="community-form community-composer">
          <span className="community-user-avatar" style={ownProfile?.avatar_url?{backgroundImage:`url("${ownProfile.avatar_url}")`}:undefined}>
            {ownProfile?.avatar_url?"":(ownProfile?.display_name??"A").slice(0,1).toUpperCase()}
          </span>
          <label htmlFor="community-post"><span className="sr-only">Nova publicação</span>
            <textarea id="community-post" name="body" required maxLength={2000}
              placeholder={replyingTo?"Escreva uma resposta organizada nesta thread.":"Partilhe uma pergunta ou reflexão respeitosa."}
              disabled={!selected||channels.find(channel=>channel.id===selectedChannel)?.channel_kind==="read_only"&&memberRole==="member"}/>
          </label>
          <div className="composer-actions">
            <span>Markdown • até 2.000 caracteres • slowmode {channels.find(channel=>channel.id===selectedChannel)?.slowmode_seconds??0}s</span>
            <button className="button button-primary" disabled={!selectedChannel}>Publicar</button>
          </div>
          {message&&<small role="status">{message}</small>}
        </form>
        {posts.filter(post=>!post.parent_post_id).length===0?<div className="notice"><h2>Nenhuma publicação</h2><p>Inicie uma conversa edificante neste canal.</p></div>:
          posts.filter(post=>!post.parent_post_id).map(post=>{const author=profiles[post.author_id];const replies=posts.filter(item=>item.parent_post_id===post.id);return <article className="community-post" key={post.id}>
            <header><span className="community-user-avatar" style={author?.avatar_url?{backgroundImage:`url("${author.avatar_url}")`}:undefined}>{author?.avatar_url?"":(author?.display_name??"M").slice(0,1).toUpperCase()}</span><span><strong>{author?.display_name??"Membro da comunidade"}</strong><small>{new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeStyle:"short"}).format(new Date(post.created_at))}</small></span></header>
            <p>{post.body}</p><div className="community-reactions" aria-label="Reações à publicação">
              {([['amen','🙏','Amém'],['thanks','🤝','Obrigado'],['helpful','💡','Útil'],['heart','❤️','Amor']] as [ReactionName,string,string][]).map(([name,emoji,label])=>{const items=reactions.filter(item=>item.post_id===post.id&&item.reaction===name);return <button key={name} type="button" className={items.some(item=>item.user_id===userId)?"is-active":""} onClick={()=>void toggleReaction(post.id,name)} aria-pressed={items.some(item=>item.user_id===userId)}>{emoji} {label}{items.length>0&&<strong>{items.length}</strong>}</button>})}
            </div><footer><button type="button" onClick={()=>setReplyingTo(post)}>◌ Responder em thread {replies.length?`(${replies.length})`:""}</button><button type="button" onClick={()=>void reportPost(post)}>⚑ Denunciar</button>{post.author_id===userId&&<button type="button" onClick={()=>void removeOwnPost(post)}>Excluir</button>}</footer>
            {replies.length>0&&<div className="thread-replies">{replies.map(reply=>{const replyAuthor=profiles[reply.author_id];return <article key={reply.id}><strong>{replyAuthor?.display_name??"Membro"}</strong><p>{reply.body}</p></article>})}</div>}
          </article>})}
      </div>
    </div>
    {userId&&<CommunityBarnabasChat circleId={selected} channelId={selectedChannel} userId={userId} userAvatar={ownProfile?.avatar_url??null} memberRole={memberRole} onSelectChannel={(id)=>{setSelectedChannel(id);setReplyingTo(null);}}/>}
  </section>;
}
