begin;

update public.arena_shop_products set metadata=metadata||'{"stackable":true}'::jsonb,purchase_limit=25 where category='chests';
update public.arena_shop_products set purchase_limit=1 where category in ('skins','effects','pass');

create or replace function public.arena_purchase_product(p_product_id text, p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid());v_product public.arena_shop_products%rowtype;v_wallet public.arena_player_wallets%rowtype;v_owned integer:=0;v_purchases bigint:=0;v_quantity integer:=0;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if p_idempotency_key is null or length(p_idempotency_key)<16 then raise exception 'invalid idempotency key'; end if;
 select * into v_product from public.arena_shop_products where id=p_product_id and active and currency in ('gems','coins') and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now());
 if not found then raise exception 'product unavailable'; end if;
 if exists(select 1 from public.arena_wallet_transactions where idempotency_key=p_idempotency_key) then
  select * into v_wallet from public.arena_player_wallets where user_id=v_user;
  select coalesce(quantity,0) into v_quantity from public.arena_player_inventory where user_id=v_user and product_id=p_product_id;
  return jsonb_build_object('coins',v_wallet.coins,'gems',v_wallet.gems,'product_id',p_product_id,'quantity',v_quantity,'replayed',true);
 end if;
 select count(*) into v_purchases from public.arena_wallet_transactions where user_id=v_user and source='shop' and reference_id=p_product_id and amount<0;
 if v_product.purchase_limit is not null and v_purchases>=v_product.purchase_limit then raise exception 'purchase limit reached'; end if;
 select coalesce(quantity,0) into v_owned from public.arena_player_inventory where user_id=v_user and product_id=p_product_id;
 if v_owned>0 and coalesce((v_product.metadata->>'stackable')::boolean,false)=false then raise exception 'product already owned'; end if;
 insert into public.arena_player_wallets(user_id) values(v_user) on conflict(user_id) do nothing;
 select * into v_wallet from public.arena_player_wallets where user_id=v_user for update;
 if v_product.currency='gems' and v_wallet.gems<v_product.price then raise exception 'insufficient gems'; end if;
 if v_product.currency='coins' and v_wallet.coins<v_product.price then raise exception 'insufficient coins'; end if;
 if v_product.currency='gems' then update public.arena_player_wallets set gems=gems-v_product.price where user_id=v_user returning * into v_wallet;
 else update public.arena_player_wallets set coins=coins-v_product.price where user_id=v_user returning * into v_wallet; end if;
 insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key) values(v_user,v_product.currency,-v_product.price,'spend','shop',v_product.id,p_idempotency_key);
 insert into public.arena_player_inventory(user_id,product_id,quantity,source) values(v_user,v_product.id,1,'shop') on conflict(user_id,product_id) do update set quantity=public.arena_player_inventory.quantity+1,acquired_at=now(),source='shop' returning quantity into v_quantity;
 return jsonb_build_object('coins',v_wallet.coins,'gems',v_wallet.gems,'product_id',v_product.id,'quantity',v_quantity,'replayed',false);
end;
$$;

create or replace function public.arena_prepare_money_purchase(p_product_id text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid());v_product public.arena_shop_products%rowtype;v_receipt public.arena_purchase_receipts%rowtype;v_paid bigint;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select * into v_product from public.arena_shop_products where id=p_product_id and active and currency='money' and metadata->>'sellable'='true' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now());
 if not found then raise exception 'product unavailable'; end if;
 select count(*) into v_paid from public.arena_purchase_receipts where user_id=v_user and product_id=v_product.id and status='paid';
 if v_product.purchase_limit is not null and v_paid>=v_product.purchase_limit then raise exception 'purchase limit reached'; end if;
 insert into public.arena_purchase_receipts(user_id,product_id,provider,amount_minor,currency) values(v_user,v_product.id,'stripe',v_product.price,'eur') returning * into v_receipt;
 return jsonb_build_object('receipt_id',v_receipt.id,'product_id',v_product.id,'name',v_product.name,'amount_minor',v_product.price,'currency','eur');
end;
$$;

create or replace function public.arena_get_purchase_history(p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid());v_result jsonb;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 select coalesce(jsonb_agg(item order by occurred_at desc),'[]'::jsonb) into v_result from (
  select jsonb_build_object('id',t.id,'product_id',t.reference_id,'name',coalesce(p.name,t.reference_id),'image',p.metadata->>'image','currency',t.currency,'amount',abs(t.amount),'status','completed','occurred_at',t.created_at) item,t.created_at occurred_at from public.arena_wallet_transactions t left join public.arena_shop_products p on p.id=t.reference_id where t.user_id=v_user and t.source='shop' and t.amount<0
  union all
  select jsonb_build_object('id',r.id,'product_id',r.product_id,'name',p.name,'image',p.metadata->>'image','currency','money','amount',r.amount_minor,'status',r.status,'occurred_at',r.created_at),r.created_at from public.arena_purchase_receipts r join public.arena_shop_products p on p.id=r.product_id where r.user_id=v_user
  order by occurred_at desc limit least(greatest(coalesce(p_limit,20),1),50)
 ) history;
 return v_result;
end;
$$;

revoke all on function public.arena_get_purchase_history(integer) from public;
grant execute on function public.arena_get_purchase_history(integer) to authenticated;

commit;
