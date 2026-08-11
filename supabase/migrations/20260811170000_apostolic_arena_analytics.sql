begin;

create table public.arena_admins (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
create table public.arena_analytics_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles(id) on delete cascade,
 event_name text not null check(event_name in ('shop_view','product_view','checkout_started','purchase_complete','pass_view','reward_claimed','battle_started','battle_finished')),
 product_id text,
 properties jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now()
);
create index arena_analytics_events_period_idx on public.arena_analytics_events(occurred_at desc,event_name);
create index arena_analytics_events_user_period_idx on public.arena_analytics_events(user_id,occurred_at desc);

create or replace function public.arena_receipt_analytics_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='paid' and old.status is distinct from 'paid' then
  insert into public.arena_analytics_events(user_id,event_name,product_id,properties) values(new.user_id,'purchase_complete',new.product_id,jsonb_build_object('amount_minor',new.amount_minor,'currency',new.currency));
 end if;
 return new;
end;
$$;
create trigger arena_receipt_paid_analytics after update on public.arena_purchase_receipts for each row execute function public.arena_receipt_analytics_trigger();

alter table public.arena_admins enable row level security;
alter table public.arena_analytics_events enable row level security;
create policy "arena_admin_read_self" on public.arena_admins for select to authenticated using((select auth.uid())=user_id);
create policy "arena_analytics_read_own" on public.arena_analytics_events for select to authenticated using((select auth.uid())=user_id);
revoke all on public.arena_admins,public.arena_analytics_events from anon,authenticated;
grant select on public.arena_admins,public.arena_analytics_events to authenticated;

create or replace function public.arena_track_event(p_event_name text,p_product_id text default null,p_properties jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());
begin
 if v_user is null then return; end if;
 if p_event_name not in ('shop_view','product_view','checkout_started','pass_view','reward_claimed','battle_started','battle_finished') then raise exception 'invalid analytics event'; end if;
 if pg_column_size(coalesce(p_properties,'{}'::jsonb))>2048 then raise exception 'analytics payload too large'; end if;
 insert into public.arena_analytics_events(user_id,event_name,product_id,properties) values(v_user,p_event_name,left(p_product_id,80),coalesce(p_properties,'{}'::jsonb));
end;
$$;

create or replace function public.arena_get_economy_analytics(p_days integer default 30)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_since timestamptz; v_summary jsonb; v_sources jsonb; v_products jsonb; v_retention jsonb; v_audit jsonb;
begin
 if v_user is null or not exists(select 1 from public.arena_admins where user_id=v_user) then raise exception 'administrator required'; end if;
 p_days:=greatest(1,least(coalesce(p_days,30),365)); v_since:=now()-make_interval(days=>p_days);
 select jsonb_build_object(
  'days',p_days,
  'active_players',(select count(distinct user_id) from public.arena_analytics_events where occurred_at>=v_since),
  'buyers',(select count(distinct user_id) from public.arena_purchase_receipts where status='paid' and paid_at>=v_since),
  'paid_receipts',(select count(*) from public.arena_purchase_receipts where status='paid' and paid_at>=v_since),
  'gross_minor',(select coalesce(sum(amount_minor),0) from public.arena_purchase_receipts where status='paid' and paid_at>=v_since),
  'refunds',(select count(*) from public.arena_purchase_receipts where status='refunded' and reversed_at>=v_since),
  'disputes',(select count(*) from public.arena_purchase_receipts where status='disputed' and reversed_at>=v_since),
  'gems_earned',(select coalesce(sum(amount),0) from public.arena_wallet_transactions where currency='gems' and amount>0 and created_at>=v_since),
  'gems_spent',(select coalesce(-sum(amount),0) from public.arena_wallet_transactions where currency='gems' and amount<0 and created_at>=v_since),
  'median_gem_balance',(select coalesce(percentile_cont(.5) within group(order by gems),0) from public.arena_player_wallets)
 ) into v_summary;
 select coalesce(jsonb_agg(row_data),'[]'::jsonb) into v_sources from (select jsonb_build_object('source',source,'earned',coalesce(sum(amount) filter(where amount>0),0),'spent',coalesce(-sum(amount) filter(where amount<0),0)) row_data from public.arena_wallet_transactions where currency='gems' and created_at>=v_since group by source order by sum(abs(amount)) desc) s;
 select coalesce(jsonb_agg(row_data),'[]'::jsonb) into v_products from (select jsonb_build_object('product_id',product_id,'purchases',count(*),'gross_minor',sum(amount_minor)) row_data from public.arena_purchase_receipts where status='paid' and paid_at>=v_since group by product_id order by count(*) desc limit 10) p;
 select jsonb_build_object('d1',(select count(distinct a.user_id) from public.arena_analytics_events a where a.occurred_at>=v_since and exists(select 1 from public.arena_analytics_events b where b.user_id=a.user_id and b.occurred_at::date=a.occurred_at::date+1)),'d7',(select count(distinct a.user_id) from public.arena_analytics_events a where a.occurred_at>=v_since and exists(select 1 from public.arena_analytics_events b where b.user_id=a.user_id and b.occurred_at::date=a.occurred_at::date+7)),'d30',(select count(distinct a.user_id) from public.arena_analytics_events a where a.occurred_at>=v_since and exists(select 1 from public.arena_analytics_events b where b.user_id=a.user_id and b.occurred_at::date=a.occurred_at::date+30))) into v_retention;
 select jsonb_build_object('negative_wallets',(select count(*) from public.arena_player_wallets where coins<0 or gems<0),'stale_pending_receipts',(select count(*) from public.arena_purchase_receipts where status='pending' and created_at<now()-interval '24 hours'),'paid_without_provider_reference',(select count(*) from public.arena_purchase_receipts where status='paid' and (provider_checkout_session_id is null or provider_payment_intent_id is null)),'payments_enabled_ready',not exists(select 1 from public.arena_purchase_receipts where status='paid' and paid_at is null)) into v_audit;
 return jsonb_build_object('generated_at',now(),'summary',v_summary,'sources',v_sources,'products',v_products,'retention',v_retention,'audit',v_audit);
end;
$$;

revoke all on function public.arena_receipt_analytics_trigger(),public.arena_track_event(text,text,jsonb),public.arena_get_economy_analytics(integer) from public;
grant execute on function public.arena_track_event(text,text,jsonb),public.arena_get_economy_analytics(integer) to authenticated;
commit;
