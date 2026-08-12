begin;

-- V76: temporadas e ligas de guerra
create table public.arena_alliance_war_seasons(
  id text primary key,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  check(ends_at>starts_at)
);
create table public.arena_alliance_war_ratings(
  alliance_id uuid primary key references public.arena_alliances(id) on delete cascade,
  rating integer not null default 1000 check(rating>=0),
  wins integer not null default 0 check(wins>=0),
  losses integer not null default 0 check(losses>=0),
  updated_at timestamptz not null default now()
);
insert into public.arena_alliance_war_seasons values
('guerras-s1','Temporada das Doze Tribos',date_trunc('month',now()),date_trunc('month',now())+interval '90 days',true);

-- V77: fila e formação protegida pela liderança
create table public.arena_alliance_war_queue(
  alliance_id uuid primary key references public.arena_alliances(id) on delete cascade,
  season_id text not null references public.arena_alliance_war_seasons(id),
  queued_by uuid not null references public.profiles(id),
  queued_at timestamptz not null default now(),
  status text not null default 'searching' check(status in('searching','matched','cancelled'))
);
create table public.arena_alliance_war_roster(
  alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  selected_by uuid not null references public.profiles(id),
  selected_at timestamptz not null default now(),
  primary key(alliance_id,user_id)
);

-- V78: confrontos e placar; resultados só podem ser gravados pelo backend confiável
create table public.arena_alliance_wars(
  id uuid primary key default gen_random_uuid(),
  season_id text not null references public.arena_alliance_war_seasons(id),
  home_alliance_id uuid not null references public.arena_alliances(id),
  away_alliance_id uuid not null references public.arena_alliances(id),
  home_score integer not null default 0 check(home_score>=0),
  away_score integer not null default 0 check(away_score>=0),
  status text not null default 'preparation' check(status in('preparation','battle','finished','cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check(home_alliance_id<>away_alliance_id),
  check(ends_at>starts_at)
);
create index arena_alliance_wars_home_idx on public.arena_alliance_wars(home_alliance_id,created_at desc);
create index arena_alliance_wars_away_idx on public.arena_alliance_wars(away_alliance_id,created_at desc);

-- V79: recompensas idempotentes
create table public.arena_alliance_war_rewards(
  war_id uuid not null references public.arena_alliance_wars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  coins integer not null default 0 check(coins>=0),
  gems integer not null default 0 check(gems>=0),
  claimed_at timestamptz,
  primary key(war_id,user_id)
);

-- V80: torneios internos
create table public.arena_alliance_tournaments(
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
  title text not null check(length(trim(title)) between 3 and 60),
  state text not null default 'registration' check(state in('registration','running','finished','cancelled')),
  max_players integer not null default 16 check(max_players between 4 and 50),
  starts_at timestamptz not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.arena_alliance_tournament_entries(
  tournament_id uuid not null references public.arena_alliance_tournaments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null default 0 check(score>=0),
  joined_at timestamptz not null default now(),
  primary key(tournament_id,user_id)
);

alter table public.arena_alliance_war_seasons enable row level security;
alter table public.arena_alliance_war_ratings enable row level security;
alter table public.arena_alliance_war_queue enable row level security;
alter table public.arena_alliance_war_roster enable row level security;
alter table public.arena_alliance_wars enable row level security;
alter table public.arena_alliance_war_rewards enable row level security;
alter table public.arena_alliance_tournaments enable row level security;
alter table public.arena_alliance_tournament_entries enable row level security;
revoke all on public.arena_alliance_war_seasons,public.arena_alliance_war_ratings,public.arena_alliance_war_queue,public.arena_alliance_war_roster,public.arena_alliance_wars,public.arena_alliance_war_rewards,public.arena_alliance_tournaments,public.arena_alliance_tournament_entries from anon,authenticated;

create or replace function public.arena_get_alliance_competitive() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;
begin
  select alliance_id into v_alliance from public.arena_alliance_members where user_id=v_user;
  if v_alliance is null then raise exception 'alliance required'; end if;
  return jsonb_build_object(
    'rating',coalesce((select rating from public.arena_alliance_war_ratings where alliance_id=v_alliance),1000),
    'queue',(select to_jsonb(q) from(select status,queued_at from public.arena_alliance_war_queue where alliance_id=v_alliance)q),
    'war',(select to_jsonb(w) from(select id,status,home_alliance_id,away_alliance_id,home_score,away_score,starts_at,ends_at from public.arena_alliance_wars where (home_alliance_id=v_alliance or away_alliance_id=v_alliance)and status in('preparation','battle')order by created_at desc limit 1)w),
    'roster',(select coalesce(jsonb_agg(to_jsonb(r)order by display_name),'[]'::jsonb)from(select m.user_id,coalesce(p.display_name,'Guardião')display_name,m.role,exists(select 1 from public.arena_alliance_war_roster wr where wr.alliance_id=v_alliance and wr.user_id=m.user_id)selected from public.arena_alliance_members m left join public.profiles p on p.id=m.user_id where m.alliance_id=v_alliance)r),
    'tournaments',(select coalesce(jsonb_agg(to_jsonb(t)order by starts_at desc),'[]'::jsonb)from(select t.id,t.title,t.state,t.max_players,t.starts_at,count(e.user_id)::integer players from public.arena_alliance_tournaments t left join public.arena_alliance_tournament_entries e on e.tournament_id=t.id where t.alliance_id=v_alliance group by t.id order by t.starts_at desc limit 12)t)
  );
end;$$;

create or replace function public.arena_toggle_alliance_war_queue(p_join boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;v_season text;
begin
  select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
  if v_role not in('founder','elder')then raise exception 'manager required';end if;
  if p_join then
    select id into v_season from public.arena_alliance_war_seasons where active and now()between starts_at and ends_at order by starts_at desc limit 1;
    if v_season is null then raise exception 'no active season';end if;
    insert into public.arena_alliance_war_ratings(alliance_id)values(v_alliance)on conflict do nothing;
    insert into public.arena_alliance_war_queue(alliance_id,season_id,queued_by)values(v_alliance,v_season,v_user)on conflict(alliance_id)do update set season_id=excluded.season_id,queued_by=v_user,queued_at=now(),status='searching';
  else delete from public.arena_alliance_war_queue where alliance_id=v_alliance and status='searching';end if;
  return jsonb_build_object('queued',p_join);
end;$$;

create or replace function public.arena_set_alliance_war_roster(p_user_id uuid,p_selected boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;
begin
  select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
  if v_role not in('founder','elder')or not exists(select 1 from public.arena_alliance_members where alliance_id=v_alliance and user_id=p_user_id)then raise exception 'manager required';end if;
  if p_selected then
    if(select count(*)from public.arena_alliance_war_roster where alliance_id=v_alliance)>=20 then raise exception 'roster full';end if;
    insert into public.arena_alliance_war_roster values(v_alliance,p_user_id,v_user,now())on conflict do nothing;
  else delete from public.arena_alliance_war_roster where alliance_id=v_alliance and user_id=p_user_id;end if;
  return jsonb_build_object('selected',p_selected);
end;$$;

create or replace function public.arena_create_alliance_tournament(p_title text,p_starts_at timestamptz,p_max_players integer default 16) returns uuid language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;v_id uuid;
begin
  select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
  if v_role not in('founder','elder')or p_starts_at<now()+interval '10 minutes'then raise exception 'invalid tournament';end if;
  insert into public.arena_alliance_tournaments(alliance_id,title,max_players,starts_at,created_by)values(v_alliance,trim(p_title),least(greatest(p_max_players,4),50),p_starts_at,v_user)returning id into v_id;
  return v_id;
end;$$;

create or replace function public.arena_join_alliance_tournament(p_tournament_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_t public.arena_alliance_tournaments%rowtype;
begin
  select alliance_id into v_alliance from public.arena_alliance_members where user_id=v_user;
  select*into v_t from public.arena_alliance_tournaments where id=p_tournament_id and alliance_id=v_alliance and state='registration' and starts_at>now()for update;
  if not found or(select count(*)from public.arena_alliance_tournament_entries where tournament_id=p_tournament_id)>=v_t.max_players then raise exception 'tournament unavailable';end if;
  insert into public.arena_alliance_tournament_entries(tournament_id,user_id)values(p_tournament_id,v_user)on conflict do nothing;
  return jsonb_build_object('joined',true);
end;$$;

revoke all on function public.arena_get_alliance_competitive(),public.arena_toggle_alliance_war_queue(boolean),public.arena_set_alliance_war_roster(uuid,boolean),public.arena_create_alliance_tournament(text,timestamptz,integer),public.arena_join_alliance_tournament(uuid) from public;
grant execute on function public.arena_get_alliance_competitive(),public.arena_toggle_alliance_war_queue(boolean),public.arena_set_alliance_war_roster(uuid,boolean),public.arena_create_alliance_tournament(text,timestamptz,integer),public.arena_join_alliance_tournament(uuid) to authenticated;
commit;
