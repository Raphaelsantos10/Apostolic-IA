begin;

create table public.arena_seasons (
  id text primary key,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at>starts_at),
  active boolean not null default true
);

create table public.arena_pass_levels (
  season_id text not null references public.arena_seasons(id) on delete cascade,
  level smallint not null check (level between 1 and 50),
  xp_required integer not null check (xp_required>=0),
  free_reward jsonb,
  premium_reward jsonb,
  primary key(season_id,level)
);

create table public.arena_player_passes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id text not null references public.arena_seasons(id) on delete cascade,
  xp integer not null default 0 check (xp>=0),
  premium boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key(user_id,season_id)
);

create table public.arena_pass_claims (
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id text not null,
  level smallint not null,
  track text not null check(track in ('free','premium')),
  claimed_at timestamptz not null default now(),
  primary key(user_id,season_id,level,track),
  foreign key(season_id,level) references public.arena_pass_levels(season_id,level) on delete cascade
);

create table public.arena_pass_xp_grants (
  idempotency_key text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  season_id text not null references public.arena_seasons(id) on delete cascade,
  amount integer not null check(amount>0),
  reference_id text,
  created_at timestamptz not null default now()
);

alter table public.arena_seasons enable row level security;
alter table public.arena_pass_levels enable row level security;
alter table public.arena_player_passes enable row level security;
alter table public.arena_pass_claims enable row level security;
alter table public.arena_pass_xp_grants enable row level security;
create policy "arena_seasons_read" on public.arena_seasons for select to authenticated using(active);
create policy "arena_pass_levels_read" on public.arena_pass_levels for select to authenticated using(true);
create policy "arena_player_pass_read_own" on public.arena_player_passes for select to authenticated using((select auth.uid())=user_id);
create policy "arena_pass_claims_read_own" on public.arena_pass_claims for select to authenticated using((select auth.uid())=user_id);
create policy "arena_pass_xp_read_own" on public.arena_pass_xp_grants for select to authenticated using((select auth.uid())=user_id);
revoke all on public.arena_seasons,public.arena_pass_levels,public.arena_player_passes,public.arena_pass_claims,public.arena_pass_xp_grants from anon,authenticated;
grant select on public.arena_seasons,public.arena_pass_levels,public.arena_player_passes,public.arena_pass_claims to authenticated;

insert into public.arena_seasons(id,name,starts_at,ends_at) values
  ('alianca-s1','Temporada da Aliança','2026-08-01T00:00:00Z','2026-10-01T00:00:00Z');
insert into public.arena_pass_levels(season_id,level,xp_required,free_reward,premium_reward) values
  ('alianca-s1',1,0,'{"currency":"coins","amount":250}','{"currency":"coins","amount":500}'),
  ('alianca-s1',2,100,'{"currency":"coins","amount":300}','{"currency":"gems","amount":10}'),
  ('alianca-s1',3,220,'{"currency":"gems","amount":3}','{"product_id":"emote-noe-pomba"}'),
  ('alianca-s1',4,360,'{"currency":"coins","amount":400}','{"currency":"coins","amount":800}'),
  ('alianca-s1',5,520,'{"currency":"gems","amount":5}','{"product_id":"effect-trombetas-jerico"}'),
  ('alianca-s1',6,700,'{"currency":"coins","amount":500}','{"currency":"gems","amount":15}'),
  ('alianca-s1',7,900,'{"currency":"gems","amount":5}','{"currency":"coins","amount":1000}'),
  ('alianca-s1',8,1120,'{"currency":"coins","amount":600}','{"currency":"gems","amount":20}'),
  ('alianca-s1',9,1360,'{"currency":"gems","amount":7}','{"product_id":"effect-fogo-celestial"}'),
  ('alianca-s1',10,1620,'{"currency":"gems","amount":10}','{"product_id":"skin-davi-rei"}');

create or replace function public.arena_get_pass_status()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_season public.arena_seasons%rowtype; v_pass public.arena_player_passes%rowtype; v_levels jsonb;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  select * into v_season from public.arena_seasons where active and now()>=starts_at and now()<ends_at order by starts_at desc limit 1;
  if not found then return jsonb_build_object('active',false); end if;
  insert into public.arena_player_passes(user_id,season_id) values(v_user,v_season.id) on conflict do nothing;
  select * into v_pass from public.arena_player_passes where user_id=v_user and season_id=v_season.id;
  select jsonb_agg(jsonb_build_object('level',l.level,'xp_required',l.xp_required,'free_reward',l.free_reward,'premium_reward',l.premium_reward,
    'free_claimed',exists(select 1 from public.arena_pass_claims c where c.user_id=v_user and c.season_id=l.season_id and c.level=l.level and c.track='free'),
    'premium_claimed',exists(select 1 from public.arena_pass_claims c where c.user_id=v_user and c.season_id=l.season_id and c.level=l.level and c.track='premium')) order by l.level)
    into v_levels from public.arena_pass_levels l where l.season_id=v_season.id;
  return jsonb_build_object('active',true,'season_id',v_season.id,'name',v_season.name,'ends_at',v_season.ends_at,'xp',v_pass.xp,'premium',v_pass.premium,'levels',coalesce(v_levels,'[]'::jsonb));
end;
$$;

create or replace function public.arena_grant_pass_xp(p_user_id uuid,p_amount integer,p_reference text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_season_id text; v_xp integer;
begin
  if coalesce((select auth.role()),'')<>'service_role' then raise exception 'server verification required'; end if;
  if p_amount<=0 or length(coalesce(p_idempotency_key,''))<16 then raise exception 'invalid xp grant'; end if;
  select id into v_season_id from public.arena_seasons where active and now()>=starts_at and now()<ends_at order by starts_at desc limit 1;
  if v_season_id is null then raise exception 'no active season'; end if;
  if exists(select 1 from public.arena_pass_xp_grants where idempotency_key=p_idempotency_key) then
    select xp into v_xp from public.arena_player_passes where user_id=p_user_id and season_id=v_season_id;
    return jsonb_build_object('granted',false,'replayed',true,'xp',coalesce(v_xp,0));
  end if;
  insert into public.arena_pass_xp_grants(idempotency_key,user_id,season_id,amount,reference_id) values(p_idempotency_key,p_user_id,v_season_id,p_amount,p_reference);
  insert into public.arena_player_passes(user_id,season_id,xp) values(p_user_id,v_season_id,p_amount)
    on conflict(user_id,season_id) do update set xp=public.arena_player_passes.xp+excluded.xp,updated_at=now() returning xp into v_xp;
  return jsonb_build_object('granted',true,'xp',v_xp);
end;
$$;

create or replace function public.arena_claim_pass_reward(p_level smallint,p_track text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_pass public.arena_player_passes%rowtype; v_level public.arena_pass_levels%rowtype; v_reward jsonb; v_wallet public.arena_player_wallets%rowtype; v_currency text; v_amount integer; v_product text;
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if p_track not in ('free','premium') then raise exception 'invalid track'; end if;
  select p.* into v_pass from public.arena_player_passes p join public.arena_seasons s on s.id=p.season_id where p.user_id=v_user and s.active and now()>=s.starts_at and now()<s.ends_at for update;
  if not found then raise exception 'pass unavailable'; end if;
  select * into v_level from public.arena_pass_levels where season_id=v_pass.season_id and level=p_level;
  if not found or v_pass.xp<v_level.xp_required then raise exception 'level locked'; end if;
  if p_track='premium' and not v_pass.premium then raise exception 'premium pass required'; end if;
  v_reward:=case when p_track='free' then v_level.free_reward else v_level.premium_reward end;
  if v_reward is null then raise exception 'reward unavailable'; end if;
  insert into public.arena_pass_claims(user_id,season_id,level,track) values(v_user,v_pass.season_id,p_level,p_track) on conflict do nothing;
  if not found then raise exception 'reward already claimed'; end if;
  v_currency:=v_reward->>'currency'; v_amount:=coalesce((v_reward->>'amount')::integer,0); v_product:=v_reward->>'product_id';
  insert into public.arena_player_wallets(user_id) values(v_user) on conflict do nothing;
  if v_currency='gems' then update public.arena_player_wallets set gems=gems+v_amount where user_id=v_user;
  elsif v_currency='coins' then update public.arena_player_wallets set coins=coins+v_amount where user_id=v_user;
  elsif v_product is not null then insert into public.arena_player_inventory(user_id,product_id,source) values(v_user,v_product,'pass') on conflict(user_id,product_id) do update set quantity=public.arena_player_inventory.quantity+1;
  else raise exception 'invalid reward'; end if;
  if v_currency in ('coins','gems') then insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key) values(v_user,v_currency,v_amount,'earn','pass',v_pass.season_id||':'||p_level||':'||p_track,'pass:'||v_user||':'||v_pass.season_id||':'||p_level||':'||p_track); end if;
  select * into v_wallet from public.arena_player_wallets where user_id=v_user;
  return jsonb_build_object('claimed',true,'level',p_level,'track',p_track,'reward',v_reward,'coins',v_wallet.coins,'gems',v_wallet.gems);
end;
$$;

revoke all on function public.arena_get_pass_status(),public.arena_grant_pass_xp(uuid,integer,text,text),public.arena_claim_pass_reward(smallint,text) from public;
grant execute on function public.arena_get_pass_status(),public.arena_claim_pass_reward(smallint,text) to authenticated;
grant execute on function public.arena_grant_pass_xp(uuid,integer,text,text) to service_role;
commit;
