begin;

create table public.arena_purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.arena_shop_products(id),
  provider text not null check(provider='stripe'),
  amount_minor integer not null check(amount_minor>0),
  currency text not null check(currency ~ '^[a-z]{3}$'),
  status text not null default 'pending' check(status in ('pending','paid','refunded','disputed','failed')),
  provider_checkout_session_id text unique,
  provider_payment_intent_id text unique,
  granted_gems integer not null default 0 check(granted_gems>=0),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  reversed_at timestamptz
);
alter table public.arena_purchase_receipts enable row level security;
alter table public.arena_purchase_receipts force row level security;
create policy "arena_receipts_read_own" on public.arena_purchase_receipts for select to authenticated using((select auth.uid())=user_id);
revoke all on public.arena_purchase_receipts from anon,authenticated;
grant select on public.arena_purchase_receipts to authenticated;

update public.arena_shop_products set active=true,metadata=metadata||'{"grant_gems":100,"sellable":true}'::jsonb where id='gems-small';
update public.arena_shop_products set active=true,metadata=metadata||'{"grant_gems":550,"sellable":true}'::jsonb where id='gems-warrior';
update public.arena_shop_products set active=true,metadata=metadata||'{"premium_pass":true,"season_id":"alianca-s1","sellable":true}'::jsonb where id='pass-alianca-s1';
insert into public.arena_shop_products(id,category,name,currency,price,active,metadata) values
 ('gems-king','gems','1.200 Gemas','money',999,true,'{"grant_gems":1200,"sellable":true}'),
 ('gems-prophet','gems','2.600 Gemas','money',1999,true,'{"grant_gems":2600,"sellable":true}'),
 ('gems-covenant','gems','7.000 Gemas','money',4999,true,'{"grant_gems":7000,"sellable":true}')
on conflict(id) do nothing;

create or replace function public.arena_prepare_money_purchase(p_product_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid()); v_product public.arena_shop_products%rowtype; v_receipt public.arena_purchase_receipts%rowtype;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select * into v_product from public.arena_shop_products where id=p_product_id and active and currency='money' and metadata->>'sellable'='true';
 if not found then raise exception 'product unavailable'; end if;
 insert into public.arena_purchase_receipts(user_id,product_id,provider,amount_minor,currency) values(v_user,v_product.id,'stripe',v_product.price,'eur') returning * into v_receipt;
 return jsonb_build_object('receipt_id',v_receipt.id,'product_id',v_product.id,'name',v_product.name,'amount_minor',v_product.price,'currency','eur');
end;
$$;

create or replace function public.arena_fulfill_money_purchase(p_receipt_id uuid,p_checkout_session_id text,p_payment_intent_id text,p_amount_minor integer,p_currency text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_receipt public.arena_purchase_receipts%rowtype; v_product public.arena_shop_products%rowtype; v_wallet public.arena_player_wallets%rowtype; v_gems integer;
begin
 if coalesce((select auth.role()),'')<>'service_role' then raise exception 'server verification required'; end if;
 select * into v_receipt from public.arena_purchase_receipts where id=p_receipt_id for update;
 if not found then raise exception 'receipt unavailable'; end if;
 if v_receipt.status='paid' then return jsonb_build_object('fulfilled',false,'replayed',true); end if;
 if v_receipt.status<>'pending' or v_receipt.amount_minor<>p_amount_minor or v_receipt.currency<>lower(p_currency) then raise exception 'payment mismatch'; end if;
 select * into v_product from public.arena_shop_products where id=v_receipt.product_id;
 insert into public.arena_player_wallets(user_id) values(v_receipt.user_id) on conflict do nothing;
 v_gems:=coalesce((v_product.metadata->>'grant_gems')::integer,0);
 if v_gems>0 then
  update public.arena_player_wallets set gems=gems+v_gems where user_id=v_receipt.user_id returning * into v_wallet;
  insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key) values(v_receipt.user_id,'gems',v_gems,'purchase','stripe',v_receipt.id::text,'stripe-purchase:'||v_receipt.id);
 elsif v_product.metadata->>'premium_pass'='true' then
  insert into public.arena_player_passes(user_id,season_id,premium) values(v_receipt.user_id,v_product.metadata->>'season_id',true) on conflict(user_id,season_id) do update set premium=true,updated_at=now();
 else raise exception 'unsupported fulfillment'; end if;
 update public.arena_purchase_receipts set status='paid',provider_checkout_session_id=p_checkout_session_id,provider_payment_intent_id=p_payment_intent_id,granted_gems=v_gems,paid_at=now() where id=v_receipt.id;
 return jsonb_build_object('fulfilled',true,'gems',v_gems);
end;
$$;

create or replace function public.arena_reverse_money_purchase(p_payment_intent_id text,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_receipt public.arena_purchase_receipts%rowtype; v_wallet public.arena_player_wallets%rowtype; v_status text:=case when p_reason='dispute' then 'disputed' else 'refunded' end;
begin
 if coalesce((select auth.role()),'')<>'service_role' then raise exception 'server verification required'; end if;
 select * into v_receipt from public.arena_purchase_receipts where provider_payment_intent_id=p_payment_intent_id for update;
 if not found then return jsonb_build_object('reversed',false,'missing',true); end if;
 if v_receipt.status in ('refunded','disputed') then return jsonb_build_object('reversed',false,'replayed',true); end if;
 if v_receipt.status<>'paid' then raise exception 'receipt not paid'; end if;
 if v_receipt.granted_gems>0 then
  select * into v_wallet from public.arena_player_wallets where user_id=v_receipt.user_id for update;
  update public.arena_player_wallets set gems=greatest(0,gems-v_receipt.granted_gems) where user_id=v_receipt.user_id;
  if least(v_wallet.gems,v_receipt.granted_gems)>0 then
   insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key) values(v_receipt.user_id,'gems',-least(v_wallet.gems,v_receipt.granted_gems),'refund','stripe-'||v_status,v_receipt.id::text,'stripe-reversal:'||v_receipt.id||':'||v_status);
  end if;
 else
  update public.arena_player_passes set premium=false,updated_at=now() where user_id=v_receipt.user_id and season_id=(select metadata->>'season_id' from public.arena_shop_products where id=v_receipt.product_id);
 end if;
 update public.arena_purchase_receipts set status=v_status,reversed_at=now() where id=v_receipt.id;
 return jsonb_build_object('reversed',true,'status',v_status);
end;
$$;

revoke all on function public.arena_prepare_money_purchase(text),public.arena_fulfill_money_purchase(uuid,text,text,integer,text),public.arena_reverse_money_purchase(text,text) from public;
grant execute on function public.arena_prepare_money_purchase(text) to authenticated;
grant execute on function public.arena_fulfill_money_purchase(uuid,text,text,integer,text),public.arena_reverse_money_purchase(text,text) to service_role;
commit;
