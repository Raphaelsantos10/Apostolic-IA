begin;

-- V81: agenda cooperativa
create table public.arena_alliance_events(
  id uuid primary key default gen_random_uuid(),alliance_id uuid not null references public.arena_alliances(id)on delete cascade,
  title text not null check(length(trim(title))between 3 and 70),description text not null default''check(length(description)<=300),
  kind text not null check(kind in('training','study','war','tournament','community')),starts_at timestamptz not null,
  capacity integer check(capacity between 2 and 50),created_by uuid not null references public.profiles(id),created_at timestamptz not null default now()
);
create table public.arena_alliance_event_attendees(event_id uuid not null references public.arena_alliance_events(id)on delete cascade,user_id uuid not null references public.profiles(id)on delete cascade,joined_at timestamptz not null default now(),primary key(event_id,user_id));

-- V82: diplomacia entre Alianças
create table public.arena_alliance_relations(
  id uuid primary key default gen_random_uuid(),source_alliance_id uuid not null references public.arena_alliances(id)on delete cascade,target_alliance_id uuid not null references public.arena_alliances(id)on delete cascade,
  kind text not null check(kind in('ally','friendly','rival')),status text not null default'pending'check(status in('pending','active','declined','ended')),
  proposed_by uuid not null references public.profiles(id),responded_by uuid references public.profiles(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  check(source_alliance_id<>target_alliance_id)
);
create unique index arena_alliance_relations_open_idx on public.arena_alliance_relations(least(source_alliance_id,target_alliance_id),greatest(source_alliance_id,target_alliance_id))where status in('pending','active');

-- V83: mentoria de membros
create table public.arena_alliance_mentorships(
  alliance_id uuid not null references public.arena_alliances(id)on delete cascade,mentor_id uuid not null references public.profiles(id)on delete cascade,apprentice_id uuid not null references public.profiles(id)on delete cascade,
  status text not null default'active'check(status in('active','completed','cancelled')),weekly_goal integer not null default 5 check(weekly_goal between 1 and 30),progress integer not null default 0 check(progress>=0),created_at timestamptz not null default now(),primary key(alliance_id,mentor_id,apprentice_id),check(mentor_id<>apprentice_id)
);
create table public.arena_alliance_mentor_pool(alliance_id uuid not null references public.arena_alliances(id)on delete cascade,user_id uuid not null references public.profiles(id)on delete cascade,preference text not null check(preference in('mentor','apprentice')),created_at timestamptz not null default now(),primary key(alliance_id,user_id));

-- V84: conquistas coletivas configuráveis
create table public.arena_alliance_achievement_catalog(id text primary key,title text not null,description text not null,metric text not null check(metric in('members','xp','glory','war_wins')),target integer not null check(target>0),reward_label text not null);
insert into public.arena_alliance_achievement_catalog values
('primeira-companhia','Primeira Companhia','Reúna 10 guardiões.','members',10,'Moldura Companhia'),
('cidade-sobre-o-monte','Cidade sobre o Monte','Alcance 10.000 XP coletivo.','xp',10000,'Brasão Radiante'),
('estandarte-de-ouro','Estandarte de Ouro','Some 5.000 de glória semanal.','glory',5000,'Fundo Estandarte'),
('veteranos-do-reino','Veteranos do Reino','Vença 25 guerras.','war_wins',25,'Título Veteranos');

-- V85: snapshot diário para análises sem expor dados pessoais
create table public.arena_alliance_daily_metrics(alliance_id uuid not null references public.arena_alliances(id)on delete cascade,metric_date date not null default current_date,members integer not null default 0,xp integer not null default 0,glory integer not null default 0,donations integer not null default 0,chat_messages integer not null default 0,primary key(alliance_id,metric_date));

alter table public.arena_alliance_events enable row level security;alter table public.arena_alliance_event_attendees enable row level security;alter table public.arena_alliance_relations enable row level security;alter table public.arena_alliance_mentorships enable row level security;alter table public.arena_alliance_mentor_pool enable row level security;alter table public.arena_alliance_achievement_catalog enable row level security;alter table public.arena_alliance_daily_metrics enable row level security;
revoke all on public.arena_alliance_events,public.arena_alliance_event_attendees,public.arena_alliance_relations,public.arena_alliance_mentorships,public.arena_alliance_mentor_pool,public.arena_alliance_achievement_catalog,public.arena_alliance_daily_metrics from anon,authenticated;

create or replace function public.arena_get_alliance_command_center()returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;v_members integer;v_xp integer;v_glory integer;v_wins integer;
begin
 select m.alliance_id,m.role into v_alliance,v_role from public.arena_alliance_members m where m.user_id=v_user;
 if v_alliance is null then raise exception'alliance required';end if;
 select count(*)::integer into v_members from public.arena_alliance_members where alliance_id=v_alliance;
 select xp,weekly_glory into v_xp,v_glory from public.arena_alliances where id=v_alliance;
 select coalesce(wins,0)into v_wins from public.arena_alliance_war_ratings where alliance_id=v_alliance;
 return jsonb_build_object('role',v_role,
 'events',(select coalesce(jsonb_agg(to_jsonb(e)order by starts_at),'[]'::jsonb)from(select e.id,e.title,e.description,e.kind,e.starts_at,e.capacity,count(a.user_id)::integer attendees,exists(select 1 from public.arena_alliance_event_attendees mine where mine.event_id=e.id and mine.user_id=v_user)joined from public.arena_alliance_events e left join public.arena_alliance_event_attendees a on a.event_id=e.id where e.alliance_id=v_alliance and e.starts_at>now()-interval'2 hours'group by e.id order by e.starts_at limit 20)e),
 'relations',(select coalesce(jsonb_agg(to_jsonb(r)order by created_at desc),'[]'::jsonb)from(select r.id,r.kind,r.status,r.source_alliance_id,r.target_alliance_id,case when r.source_alliance_id=v_alliance then target.name else source.name end alliance_name,r.created_at from public.arena_alliance_relations r join public.arena_alliances source on source.id=r.source_alliance_id join public.arena_alliances target on target.id=r.target_alliance_id where r.source_alliance_id=v_alliance or r.target_alliance_id=v_alliance)r),
 'mentor_pool',(select coalesce(jsonb_agg(to_jsonb(p)order by preference,display_name),'[]'::jsonb)from(select mp.user_id,mp.preference,coalesce(pr.display_name,'Guardião')display_name from public.arena_alliance_mentor_pool mp left join public.profiles pr on pr.id=mp.user_id where mp.alliance_id=v_alliance)p),
 'achievements',(select jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'target',c.target,'reward',c.reward_label,'value',case c.metric when'members'then v_members when'xp'then v_xp when'glory'then v_glory else coalesce(v_wins,0)end)order by c.target)from public.arena_alliance_achievement_catalog c),
 'metrics',jsonb_build_object('members',v_members,'xp',v_xp,'glory',v_glory,'war_wins',coalesce(v_wins,0),'active_events',(select count(*)from public.arena_alliance_events where alliance_id=v_alliance and starts_at>now())));
end;$$;

create or replace function public.arena_create_alliance_event(p_title text,p_description text,p_kind text,p_starts_at timestamptz,p_capacity integer default null)returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;v_id uuid;begin select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;if v_role not in('founder','elder','guardian')or p_starts_at<now()then raise exception'organizer required';end if;insert into public.arena_alliance_events(alliance_id,title,description,kind,starts_at,capacity,created_by)values(v_alliance,trim(p_title),trim(p_description),p_kind,p_starts_at,p_capacity,v_user)returning id into v_id;insert into public.arena_alliance_event_attendees values(v_id,v_user,now());return v_id;end;$$;
create or replace function public.arena_join_alliance_event(p_event_id uuid)returns jsonb language plpgsql security definer set search_path = '' as $$declare v_user uuid:=(select auth.uid());v_alliance uuid;v_event public.arena_alliance_events%rowtype;begin select alliance_id into v_alliance from public.arena_alliance_members where user_id=v_user;select*into v_event from public.arena_alliance_events where id=p_event_id and alliance_id=v_alliance and starts_at>now()for update;if not found or(v_event.capacity is not null and(select count(*)from public.arena_alliance_event_attendees where event_id=p_event_id)>=v_event.capacity)then raise exception'event unavailable';end if;insert into public.arena_alliance_event_attendees values(p_event_id,v_user,now())on conflict do nothing;return jsonb_build_object('joined',true);end;$$;
create or replace function public.arena_set_alliance_mentor_preference(p_preference text)returns jsonb language plpgsql security definer set search_path = '' as $$declare v_user uuid:=(select auth.uid());v_alliance uuid;begin select alliance_id into v_alliance from public.arena_alliance_members where user_id=v_user;if p_preference not in('mentor','apprentice')then raise exception'invalid preference';end if;insert into public.arena_alliance_mentor_pool values(v_alliance,v_user,p_preference,now())on conflict(alliance_id,user_id)do update set preference=excluded.preference,created_at=now();return jsonb_build_object('preference',p_preference);end;$$;
create or replace function public.arena_propose_alliance_relation(p_target_id uuid,p_kind text)returns uuid language plpgsql security definer set search_path = '' as $$declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;v_id uuid;begin select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;if v_role not in('founder','elder')or p_kind not in('ally','friendly','rival')or p_target_id=v_alliance then raise exception'manager required';end if;insert into public.arena_alliance_relations(source_alliance_id,target_alliance_id,kind,proposed_by)values(v_alliance,p_target_id,p_kind,v_user)returning id into v_id;return v_id;end;$$;
create or replace function public.arena_respond_alliance_relation(p_relation_id uuid,p_accept boolean)returns jsonb language plpgsql security definer set search_path = '' as $$declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;begin select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;if v_role not in('founder','elder')then raise exception'manager required';end if;update public.arena_alliance_relations set status=case when p_accept then'active'else'declined'end,responded_by=v_user,updated_at=now()where id=p_relation_id and target_alliance_id=v_alliance and status='pending';if not found then raise exception'proposal unavailable';end if;return jsonb_build_object('accepted',p_accept);end;$$;

revoke all on function public.arena_get_alliance_command_center(),public.arena_create_alliance_event(text,text,text,timestamptz,integer),public.arena_join_alliance_event(uuid),public.arena_set_alliance_mentor_preference(text),public.arena_propose_alliance_relation(uuid,text),public.arena_respond_alliance_relation(uuid,boolean)from public;
grant execute on function public.arena_get_alliance_command_center(),public.arena_create_alliance_event(text,text,text,timestamptz,integer),public.arena_join_alliance_event(uuid),public.arena_set_alliance_mentor_preference(text),public.arena_propose_alliance_relation(uuid,text),public.arena_respond_alliance_relation(uuid,boolean)to authenticated;
commit;
