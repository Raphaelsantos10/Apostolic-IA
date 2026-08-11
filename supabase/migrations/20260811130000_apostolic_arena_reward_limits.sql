begin;

create table public.arena_reward_definitions (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  currency text not null check (currency in ('coins','gems')),
  amount integer not null check (amount > 0),
  counter_key text not null,
  period text not null check (period in ('day','week','month','season','lifetime')),
  per_period_limit integer not null default 1 check (per_period_limit > 0),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.arena_reward_definitions enable row level security;
alter table public.arena_reward_definitions force row level security;
create policy "arena_reward_definitions_read_active" on public.arena_reward_definitions
  for select to authenticated using (active);
revoke all on public.arena_reward_definitions from anon, authenticated;
grant select on public.arena_reward_definitions to authenticated;

insert into public.arena_reward_definitions(id,currency,amount,counter_key,period,per_period_limit,metadata) values
  ('weekly-mission-gems','gems',5,'weekly-mission-gems','week',1,'{"source":"mission","requires_server_verification":true}'),
  ('league-bronze-gems','gems',5,'league-bronze-gems','lifetime',1,'{"source":"league","requires_server_verification":true}'),
  ('league-silver-gems','gems',10,'league-silver-gems','lifetime',1,'{"source":"league","requires_server_verification":true}'),
  ('league-gold-gems','gems',15,'league-gold-gems','lifetime',1,'{"source":"league","requires_server_verification":true}'),
  ('monthly-event-gems','gems',15,'monthly-event-gems','month',1,'{"source":"event","requires_server_verification":true}'),
  ('study-milestone-gems','gems',3,'study-milestone-gems','month',4,'{"source":"study","requires_server_verification":true}'),
  ('battle-victory-coins','coins',75,'battle-victory-coins','day',20,'{"source":"battle","requires_server_verification":true}');

create or replace function public.arena_period_key(p_period text, p_at timestamptz default now())
returns text language sql immutable set search_path='' as $$
  select case p_period
    when 'day' then to_char(p_at at time zone 'UTC','YYYY-MM-DD')
    when 'week' then to_char(p_at at time zone 'UTC','IYYY-"W"IW')
    when 'month' then to_char(p_at at time zone 'UTC','YYYY-MM')
    when 'season' then to_char(p_at at time zone 'UTC','YYYY-"S"Q')
    else 'lifetime'
  end;
$$;

create or replace function public.arena_free_gem_status()
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_period text := public.arena_period_key('month');
  v_earned integer := 0;
  v_target integer := 80;
  v_cap integer := 120;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  select coalesce(value,80)::integer into v_target from public.arena_economy_limits where key='free-gems-monthly-target';
  select coalesce(value,120)::integer into v_cap from public.arena_economy_limits where key='free-gems-monthly-hard-cap';
  select coalesce(sum(value),0)::integer into v_earned from public.arena_player_reward_counters
    where user_id=v_user_id and counter_key='free-gems-total' and period_key=v_period;
  return jsonb_build_object('period_key',v_period,'earned',v_earned,'target',v_target,'hard_cap',v_cap,'remaining',greatest(0,v_cap-v_earned));
end;
$$;

create or replace function public.arena_grant_configured_reward(
  p_user_id uuid,
  p_reward_id text,
  p_reference_id text,
  p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_reward public.arena_reward_definitions%rowtype;
  v_wallet public.arena_player_wallets%rowtype;
  v_period_key text;
  v_claim_count integer := 0;
  v_month_key text := public.arena_period_key('month');
  v_month_gems integer := 0;
  v_cap integer := 120;
begin
  if p_user_id is null or p_idempotency_key is null or length(p_idempotency_key)<16 then raise exception 'invalid reward request'; end if;
  if coalesce((select auth.role()),'') <> 'service_role' then raise exception 'server verification required'; end if;
  select * into v_reward from public.arena_reward_definitions where id=p_reward_id and active for share;
  if not found then raise exception 'reward unavailable'; end if;
  insert into public.arena_player_wallets(user_id) values(p_user_id) on conflict(user_id) do nothing;
  select * into v_wallet from public.arena_player_wallets where user_id=p_user_id for update;
  if exists(select 1 from public.arena_wallet_transactions where idempotency_key=p_idempotency_key) then
    return jsonb_build_object('granted',false,'replayed',true,'coins',v_wallet.coins,'gems',v_wallet.gems);
  end if;
  v_period_key := public.arena_period_key(v_reward.period);
  select coalesce(value,0) into v_claim_count from public.arena_player_reward_counters
    where user_id=p_user_id and counter_key=v_reward.counter_key and period_key=v_period_key for update;
  if v_claim_count>=v_reward.per_period_limit then raise exception 'reward period limit reached'; end if;
  if v_reward.currency='gems' then
    select coalesce(value,120)::integer into v_cap from public.arena_economy_limits where key='free-gems-monthly-hard-cap';
    select coalesce(value,0) into v_month_gems from public.arena_player_reward_counters
      where user_id=p_user_id and counter_key='free-gems-total' and period_key=v_month_key for update;
    if v_month_gems+v_reward.amount>v_cap then raise exception 'monthly free gem cap reached'; end if;
  end if;
  insert into public.arena_player_reward_counters(user_id,counter_key,period_key,value)
    values(p_user_id,v_reward.counter_key,v_period_key,1)
    on conflict(user_id,counter_key,period_key) do update set value=public.arena_player_reward_counters.value+1;
  if v_reward.currency='gems' then
    insert into public.arena_player_reward_counters(user_id,counter_key,period_key,value)
      values(p_user_id,'free-gems-total',v_month_key,v_reward.amount)
      on conflict(user_id,counter_key,period_key) do update set value=public.arena_player_reward_counters.value+excluded.value;
    update public.arena_player_wallets set gems=gems+v_reward.amount where user_id=p_user_id returning * into v_wallet;
  else
    update public.arena_player_wallets set coins=coins+v_reward.amount where user_id=p_user_id returning * into v_wallet;
  end if;
  insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key)
    values(p_user_id,v_reward.currency,v_reward.amount,'earn',coalesce(v_reward.metadata->>'source','reward'),p_reference_id,p_idempotency_key);
  return jsonb_build_object('granted',true,'replayed',false,'reward_id',v_reward.id,'currency',v_reward.currency,'amount',v_reward.amount,'coins',v_wallet.coins,'gems',v_wallet.gems);
end;
$$;

revoke all on function public.arena_period_key(text,timestamptz), public.arena_free_gem_status(), public.arena_grant_configured_reward(uuid,text,text,text) from public;
grant execute on function public.arena_free_gem_status() to authenticated;
grant execute on function public.arena_grant_configured_reward(uuid,text,text,text) to service_role;

commit;
