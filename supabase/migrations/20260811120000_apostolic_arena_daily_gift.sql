begin;

create table public.arena_daily_gift_claims (
  user_id uuid not null references public.profiles(id) on delete cascade,
  claimed_on date not null default current_date,
  streak_day smallint not null check (streak_day between 1 and 7),
  reward_currency text not null check (reward_currency in ('coins','gems')),
  reward_amount integer not null check (reward_amount > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, claimed_on)
);

alter table public.arena_daily_gift_claims enable row level security;
alter table public.arena_daily_gift_claims force row level security;
create policy "arena_daily_claims_select_own" on public.arena_daily_gift_claims for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.arena_daily_gift_claims from anon, authenticated;
grant select on public.arena_daily_gift_claims to authenticated;

create or replace function public.arena_daily_gift_status()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_today public.arena_daily_gift_claims%rowtype;
  v_last public.arena_daily_gift_claims%rowtype;
  v_next_day smallint := 1;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  select * into v_today from public.arena_daily_gift_claims where user_id=v_user_id and claimed_on=current_date;
  if found then
    return jsonb_build_object('can_claim',false,'streak_day',v_today.streak_day,'next_day',case when v_today.streak_day=7 then 1 else v_today.streak_day+1 end,'reward_currency',v_today.reward_currency,'reward_amount',v_today.reward_amount);
  end if;
  select * into v_last from public.arena_daily_gift_claims where user_id=v_user_id order by claimed_on desc limit 1;
  if found and v_last.claimed_on=current_date-1 then v_next_day := case when v_last.streak_day=7 then 1 else v_last.streak_day+1 end; end if;
  return jsonb_build_object('can_claim',true,'streak_day',v_next_day,'next_day',v_next_day,'reward_currency',case when v_next_day=7 then 'gems' else 'coins' end,'reward_amount',case v_next_day when 1 then 200 when 2 then 250 when 3 then 300 when 4 then 350 when 5 then 400 when 6 then 500 else 3 end);
end;
$$;

create or replace function public.arena_claim_daily_gift()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_last public.arena_daily_gift_claims%rowtype;
  v_claim public.arena_daily_gift_claims%rowtype;
  v_wallet public.arena_player_wallets%rowtype;
  v_day smallint := 1;
  v_currency text;
  v_amount integer;
  v_inserted integer;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  insert into public.arena_player_wallets(user_id) values(v_user_id) on conflict(user_id) do nothing;
  select * into v_last from public.arena_daily_gift_claims where user_id=v_user_id order by claimed_on desc limit 1;
  if found and v_last.claimed_on=current_date then
    select * into v_wallet from public.arena_player_wallets where user_id=v_user_id;
    return jsonb_build_object('claimed',false,'already_claimed',true,'streak_day',v_last.streak_day,'reward_currency',v_last.reward_currency,'reward_amount',v_last.reward_amount,'coins',v_wallet.coins,'gems',v_wallet.gems);
  end if;
  if found and v_last.claimed_on=current_date-1 then v_day := case when v_last.streak_day=7 then 1 else v_last.streak_day+1 end; end if;
  v_currency := case when v_day=7 then 'gems' else 'coins' end;
  v_amount := case v_day when 1 then 200 when 2 then 250 when 3 then 300 when 4 then 350 when 5 then 400 when 6 then 500 else 3 end;

  insert into public.arena_daily_gift_claims(user_id,claimed_on,streak_day,reward_currency,reward_amount)
  values(v_user_id,current_date,v_day,v_currency,v_amount) on conflict(user_id,claimed_on) do nothing returning * into v_claim;
  get diagnostics v_inserted = row_count;
  if v_inserted=0 then
    select * into v_claim from public.arena_daily_gift_claims where user_id=v_user_id and claimed_on=current_date;
    select * into v_wallet from public.arena_player_wallets where user_id=v_user_id;
    return jsonb_build_object('claimed',false,'already_claimed',true,'streak_day',v_claim.streak_day,'reward_currency',v_claim.reward_currency,'reward_amount',v_claim.reward_amount,'coins',v_wallet.coins,'gems',v_wallet.gems);
  end if;

  if v_currency='gems' then update public.arena_player_wallets set gems=gems+v_amount where user_id=v_user_id returning * into v_wallet;
  else update public.arena_player_wallets set coins=coins+v_amount where user_id=v_user_id returning * into v_wallet; end if;
  insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key)
  values(v_user_id,v_currency,v_amount,'earn','daily-gift',current_date::text,'daily-gift:'||v_user_id::text||':'||current_date::text);
  return jsonb_build_object('claimed',true,'already_claimed',false,'streak_day',v_day,'reward_currency',v_currency,'reward_amount',v_amount,'coins',v_wallet.coins,'gems',v_wallet.gems);
end;
$$;

revoke all on function public.arena_daily_gift_status(), public.arena_claim_daily_gift() from public;
grant execute on function public.arena_daily_gift_status(), public.arena_claim_daily_gift() to authenticated;

commit;
