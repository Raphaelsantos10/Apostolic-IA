begin;

-- V86 · matchmaking balanceado e executado apenas pelo backend confiável
alter table public.arena_alliance_war_queue add column if not exists roster_size integer not null default 0 check(roster_size between 0 and 20);
alter table public.arena_alliance_wars add column if not exists preparation_ends_at timestamptz;
alter table public.arena_alliance_wars add column if not exists winner_alliance_id uuid references public.arena_alliances(id);
alter table public.arena_alliance_wars add column if not exists finalized_at timestamptz;

-- V87 · escalação congelada por guerra
create table public.arena_alliance_war_participants(
  war_id uuid not null references public.arena_alliance_wars(id) on delete cascade,
  alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attacks_used integer not null default 0 check(attacks_used between 0 and 4),
  score integer not null default 0 check(score >= 0),
  primary key(war_id,user_id)
);
create index arena_alliance_war_participants_alliance_idx on public.arena_alliance_war_participants(war_id,alliance_id,score desc);

-- V88 · tickets e resultados autoritativos
create table public.arena_alliance_war_battles(
  id uuid primary key default gen_random_uuid(),
  war_id uuid not null references public.arena_alliance_wars(id) on delete cascade,
  attacker_id uuid not null references public.profiles(id) on delete cascade,
  attacker_alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
  opponent_alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
  status text not null default 'issued' check(status in('issued','running','verified','expired','rejected')),
  server_nonce uuid not null default gen_random_uuid() unique,
  score integer check(score between 0 and 1000),
  result_payload jsonb,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '20 minutes',
  verified_at timestamptz,
  unique(war_id,attacker_id,server_nonce)
);
create index arena_alliance_war_battles_war_idx on public.arena_alliance_war_battles(war_id,status,issued_at desc);

-- V89 · baús e recebimento idempotente
alter table public.arena_alliance_war_rewards add column if not exists chest_tier text not null default 'bronze' check(chest_tier in('bronze','silver','gold','celestial'));

-- V90 · classificação histórica por temporada
create table public.arena_alliance_war_standings(
  season_id text not null references public.arena_alliance_war_seasons(id) on delete cascade,
  alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
  rating integer not null default 1000 check(rating>=0),
  points integer not null default 0 check(points>=0),
  wins integer not null default 0 check(wins>=0),
  losses integer not null default 0 check(losses>=0),
  score_for integer not null default 0 check(score_for>=0),
  score_against integer not null default 0 check(score_against>=0),
  updated_at timestamptz not null default now(),
  primary key(season_id,alliance_id)
);
create index arena_alliance_war_standings_rank_idx on public.arena_alliance_war_standings(season_id,points desc,rating desc,score_for desc);

alter table public.arena_alliance_war_participants enable row level security;
alter table public.arena_alliance_war_battles enable row level security;
alter table public.arena_alliance_war_standings enable row level security;
revoke all on public.arena_alliance_war_participants,public.arena_alliance_war_battles,public.arena_alliance_war_standings from anon,authenticated;

create or replace function public.arena_run_alliance_war_matchmaking() returns integer
language plpgsql security definer set search_path = '' as $$
declare a record;b record;v_war uuid;v_count integer:=0;
begin
  for a in select q.*,coalesce(r.rating,1000) rating from public.arena_alliance_war_queue q left join public.arena_alliance_war_ratings r using(alliance_id) where q.status='searching' order by q.queued_at for update skip locked loop
    select q.*,coalesce(r.rating,1000) rating into b from public.arena_alliance_war_queue q left join public.arena_alliance_war_ratings r using(alliance_id) where q.status='searching' and q.alliance_id<>a.alliance_id and q.season_id=a.season_id and abs(coalesce(r.rating,1000)-a.rating)<=greatest(150,extract(epoch from(now()-a.queued_at))/60*5) order by abs(coalesce(r.rating,1000)-a.rating),q.queued_at limit 1 for update of q skip locked;
    if found then
      insert into public.arena_alliance_wars(season_id,home_alliance_id,away_alliance_id,status,preparation_ends_at,starts_at,ends_at)values(a.season_id,a.alliance_id,b.alliance_id,'preparation',now()+interval '12 hours',now()+interval '12 hours',now()+interval '60 hours')returning id into v_war;
      insert into public.arena_alliance_war_participants(war_id,alliance_id,user_id)select v_war,r.alliance_id,r.user_id from public.arena_alliance_war_roster r where r.alliance_id in(a.alliance_id,b.alliance_id);
      update public.arena_alliance_war_queue set status='matched' where alliance_id in(a.alliance_id,b.alliance_id);
      v_count:=v_count+1;
    end if;
  end loop;
  return v_count;
end;$$;

create or replace function public.arena_request_alliance_war_battle(p_war_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid());v_part public.arena_alliance_war_participants%rowtype;v_war public.arena_alliance_wars%rowtype;v_id uuid;v_nonce uuid;
begin
  select * into v_part from public.arena_alliance_war_participants where war_id=p_war_id and user_id=v_user for update;
  select * into v_war from public.arena_alliance_wars where id=p_war_id for update;
  if v_part.user_id is null or v_war.status<>'battle' or not(now()between v_war.starts_at and v_war.ends_at) or v_part.attacks_used>=4 then raise exception 'battle unavailable';end if;
  if exists(select 1 from public.arena_alliance_war_battles where war_id=p_war_id and attacker_id=v_user and status in('issued','running')and expires_at>now())then raise exception 'active ticket exists';end if;
  insert into public.arena_alliance_war_battles(war_id,attacker_id,attacker_alliance_id,opponent_alliance_id)values(p_war_id,v_user,v_part.alliance_id,case when v_part.alliance_id=v_war.home_alliance_id then v_war.away_alliance_id else v_war.home_alliance_id end)returning id,server_nonce into v_id,v_nonce;
  return jsonb_build_object('battle_id',v_id,'nonce',v_nonce,'expires_at',now()+interval '20 minutes');
end;$$;

create or replace function public.arena_verify_alliance_war_result(p_battle_id uuid,p_nonce uuid,p_score integer,p_payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_battle public.arena_alliance_war_battles%rowtype;v_war public.arena_alliance_wars%rowtype;
begin
  if current_user not in('postgres','service_role','supabase_admin')then raise exception 'trusted backend required';end if;
  select * into v_battle from public.arena_alliance_war_battles where id=p_battle_id and server_nonce=p_nonce for update;
  if not found or v_battle.status not in('issued','running')or v_battle.expires_at<now()or p_score not between 0 and 1000 then raise exception 'invalid result';end if;
  select * into v_war from public.arena_alliance_wars where id=v_battle.war_id and status='battle' for update;
  if not found then raise exception 'war unavailable';end if;
  update public.arena_alliance_war_battles set status='verified',score=p_score,result_payload=p_payload,verified_at=now()where id=p_battle_id;
  update public.arena_alliance_war_participants set attacks_used=attacks_used+1,score=score+p_score where war_id=v_battle.war_id and user_id=v_battle.attacker_id;
  if v_battle.attacker_alliance_id=v_war.home_alliance_id then update public.arena_alliance_wars set home_score=home_score+p_score where id=v_war.id;else update public.arena_alliance_wars set away_score=away_score+p_score where id=v_war.id;end if;
  return jsonb_build_object('verified',true,'score',p_score);
end;$$;

create or replace function public.arena_finalize_alliance_war(p_war_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w public.arena_alliance_wars%rowtype;v_winner uuid;v_loser uuid;v_home_points integer;v_away_points integer;
begin
  if current_user not in('postgres','service_role','supabase_admin')then raise exception 'trusted backend required';end if;
  select * into w from public.arena_alliance_wars where id=p_war_id for update;
  if not found or w.status='finished'then return jsonb_build_object('finalized',false);end if;
  if w.ends_at>now()then raise exception 'war still active';end if;
  if w.home_score>w.away_score then v_winner:=w.home_alliance_id;v_loser:=w.away_alliance_id;v_home_points:=3;v_away_points:=0;elsif w.away_score>w.home_score then v_winner:=w.away_alliance_id;v_loser:=w.home_alliance_id;v_home_points:=0;v_away_points:=3;else v_home_points:=1;v_away_points:=1;end if;
  update public.arena_alliance_wars set status='finished',winner_alliance_id=v_winner,finalized_at=now()where id=w.id;
  insert into public.arena_alliance_war_standings(season_id,alliance_id,points,wins,losses,score_for,score_against)values(w.season_id,w.home_alliance_id,v_home_points,(v_winner=w.home_alliance_id)::integer,(v_loser=w.home_alliance_id)::integer,w.home_score,w.away_score),(w.season_id,w.away_alliance_id,v_away_points,(v_winner=w.away_alliance_id)::integer,(v_loser=w.away_alliance_id)::integer,w.away_score,w.home_score)on conflict(season_id,alliance_id)do update set points=public.arena_alliance_war_standings.points+excluded.points,wins=public.arena_alliance_war_standings.wins+excluded.wins,losses=public.arena_alliance_war_standings.losses+excluded.losses,score_for=public.arena_alliance_war_standings.score_for+excluded.score_for,score_against=public.arena_alliance_war_standings.score_against+excluded.score_against,updated_at=now();
  insert into public.arena_alliance_war_rewards(war_id,user_id,coins,gems,chest_tier)select w.id,p.user_id,case when p.alliance_id=v_winner then 800 else 350 end,case when p.alliance_id=v_winner then 3 else 1 end,case when p.alliance_id=v_winner then'gold'else'silver'end from public.arena_alliance_war_participants p where p.war_id=w.id and p.attacks_used>0 on conflict do nothing;
  return jsonb_build_object('finalized',true,'winner',v_winner);
end;$$;

create or replace function public.arena_claim_alliance_war_reward(p_war_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid());r public.arena_alliance_war_rewards%rowtype;
begin
  select * into r from public.arena_alliance_war_rewards where war_id=p_war_id and user_id=v_user for update;
  if not found or r.claimed_at is not null then raise exception 'reward unavailable';end if;
  insert into public.arena_player_wallets(user_id)values(v_user)on conflict do nothing;
  update public.arena_player_wallets set coins=coins+r.coins,gems=gems+r.gems where user_id=v_user;
  update public.arena_alliance_war_rewards set claimed_at=now()where war_id=p_war_id and user_id=v_user;
  return jsonb_build_object('claimed',true,'coins',r.coins,'gems',r.gems,'chest',r.chest_tier);
end;$$;

create or replace function public.arena_get_alliance_war_center() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_season text;
begin
 select alliance_id into v_alliance from public.arena_alliance_members where user_id=v_user;
 select id into v_season from public.arena_alliance_war_seasons where active and now()between starts_at and ends_at order by starts_at desc limit 1;
 return jsonb_build_object(
 'season',v_season,
 'war',(select to_jsonb(x)from(select w.*,home.name home_name,away.name away_name from public.arena_alliance_wars w join public.arena_alliances home on home.id=w.home_alliance_id join public.arena_alliances away on away.id=w.away_alliance_id where v_alliance in(w.home_alliance_id,w.away_alliance_id)order by w.created_at desc limit 1)x),
 'me',(select to_jsonb(x)from(select attacks_used,score from public.arena_alliance_war_participants where user_id=v_user order by war_id desc limit 1)x),
 'rewards',(select coalesce(jsonb_agg(to_jsonb(x)order by finalized_at desc),'[]'::jsonb)from(select r.war_id,r.coins,r.gems,r.chest_tier,r.claimed_at,w.finalized_at from public.arena_alliance_war_rewards r join public.arena_alliance_wars w on w.id=r.war_id where r.user_id=v_user)x),
 'ranking',(select coalesce(jsonb_agg(to_jsonb(x)order by points desc,rating desc),'[]'::jsonb)from(select s.alliance_id,a.name,a.tag,s.points,s.rating,s.wins,s.losses,s.score_for from public.arena_alliance_war_standings s join public.arena_alliances a on a.id=s.alliance_id where s.season_id=v_season order by s.points desc,s.rating desc limit 50)x));
end;$$;

revoke all on function public.arena_run_alliance_war_matchmaking(),public.arena_request_alliance_war_battle(uuid),public.arena_verify_alliance_war_result(uuid,uuid,integer,jsonb),public.arena_finalize_alliance_war(uuid),public.arena_claim_alliance_war_reward(uuid),public.arena_get_alliance_war_center() from public;
grant execute on function public.arena_request_alliance_war_battle(uuid),public.arena_claim_alliance_war_reward(uuid),public.arena_get_alliance_war_center() to authenticated;
grant execute on function public.arena_run_alliance_war_matchmaking(),public.arena_verify_alliance_war_result(uuid,uuid,integer,jsonb),public.arena_finalize_alliance_war(uuid) to service_role;
commit;
