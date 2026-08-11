begin;

create or replace function public.arena_rotating_offer_price(p_product_id text)
returns integer language plpgsql stable security definer set search_path=''
as $$
declare v_price integer;v_daily text;v_weekly text;v_daily_count integer;v_weekly_count integer;
begin
 select price into v_price from public.arena_shop_products where id=p_product_id and active;
 if v_price is null then return null; end if;
 select count(*) into v_daily_count from public.arena_shop_products where active and currency in ('gems','coins') and category='chests';
 if v_daily_count>0 then select id into v_daily from public.arena_shop_products where active and currency in ('gems','coins') and category='chests' order by id offset (extract(doy from now())::integer%v_daily_count) limit 1; end if;
 select count(*) into v_weekly_count from public.arena_shop_products where active and currency in ('gems','coins') and category in ('skins','effects');
 if v_weekly_count>0 then select id into v_weekly from public.arena_shop_products where active and currency in ('gems','coins') and category in ('skins','effects') order by id offset (extract(week from now())::integer%v_weekly_count) limit 1; end if;
 if p_product_id=v_daily then return greatest(1,floor(v_price*.80)::integer); end if;
 if p_product_id=v_weekly then return greatest(1,floor(v_price*.85)::integer); end if;
 return v_price;
end;
$$;

create or replace function public.arena_get_rotating_shop_offers()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_daily public.arena_shop_products%rowtype;v_weekly public.arena_shop_products%rowtype;v_daily_count integer;v_weekly_count integer;
begin
 select count(*) into v_daily_count from public.arena_shop_products where active and currency in ('gems','coins') and category='chests';
 if v_daily_count>0 then select * into v_daily from public.arena_shop_products where active and currency in ('gems','coins') and category='chests' order by id offset (extract(doy from now())::integer%v_daily_count) limit 1; end if;
 select count(*) into v_weekly_count from public.arena_shop_products where active and currency in ('gems','coins') and category in ('skins','effects');
 if v_weekly_count>0 then select * into v_weekly from public.arena_shop_products where active and currency in ('gems','coins') and category in ('skins','effects') order by id offset (extract(week from now())::integer%v_weekly_count) limit 1; end if;
 return jsonb_build_array(
  jsonb_build_object('kind','daily','product_id',v_daily.id,'name',v_daily.name,'subtitle',coalesce(v_daily.metadata->>'subtitle','Oferta da cidadela'),'image',v_daily.metadata->>'image','currency',v_daily.currency,'original_price',v_daily.price,'offer_price',public.arena_rotating_offer_price(v_daily.id),'discount_percent',20,'ends_at',date_trunc('day',now())+interval '1 day'),
  jsonb_build_object('kind','weekly','product_id',v_weekly.id,'name',v_weekly.name,'subtitle',coalesce(v_weekly.metadata->>'subtitle','Escolha da semana'),'image',v_weekly.metadata->>'image','currency',v_weekly.currency,'original_price',v_weekly.price,'offer_price',public.arena_rotating_offer_price(v_weekly.id),'discount_percent',15,'ends_at',date_trunc('week',now())+interval '1 week')
 );
end;
$$;

create or replace function public.arena_purchase_product(p_product_id text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid());v_product public.arena_shop_products%rowtype;v_wallet public.arena_player_wallets%rowtype;v_owned integer:=0;v_purchases bigint:=0;v_quantity integer:=0;v_price integer;
begin
 if v_user is null then raise exception 'authentication required'; end if;if p_idempotency_key is null or length(p_idempotency_key)<16 then raise exception 'invalid idempotency key';end if;
 select * into v_product from public.arena_shop_products where id=p_product_id and active and currency in ('gems','coins') and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now());if not found then raise exception 'product unavailable';end if;v_price:=public.arena_rotating_offer_price(v_product.id);
 if exists(select 1 from public.arena_wallet_transactions where idempotency_key=p_idempotency_key) then select * into v_wallet from public.arena_player_wallets where user_id=v_user;select coalesce(quantity,0) into v_quantity from public.arena_player_inventory where user_id=v_user and product_id=p_product_id;return jsonb_build_object('coins',v_wallet.coins,'gems',v_wallet.gems,'product_id',p_product_id,'quantity',v_quantity,'replayed',true);end if;
 select count(*) into v_purchases from public.arena_wallet_transactions where user_id=v_user and source='shop' and reference_id=p_product_id and amount<0;if v_product.purchase_limit is not null and v_purchases>=v_product.purchase_limit then raise exception 'purchase limit reached';end if;
 select coalesce(quantity,0) into v_owned from public.arena_player_inventory where user_id=v_user and product_id=p_product_id;if v_owned>0 and coalesce((v_product.metadata->>'stackable')::boolean,false)=false then raise exception 'product already owned';end if;
 insert into public.arena_player_wallets(user_id) values(v_user) on conflict(user_id) do nothing;select * into v_wallet from public.arena_player_wallets where user_id=v_user for update;
 if v_product.currency='gems' and v_wallet.gems<v_price then raise exception 'insufficient gems';end if;if v_product.currency='coins' and v_wallet.coins<v_price then raise exception 'insufficient coins';end if;
 if v_product.currency='gems' then update public.arena_player_wallets set gems=gems-v_price where user_id=v_user returning * into v_wallet;else update public.arena_player_wallets set coins=coins-v_price where user_id=v_user returning * into v_wallet;end if;
 insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key) values(v_user,v_product.currency,-v_price,'spend','shop',v_product.id,p_idempotency_key);
 insert into public.arena_player_inventory(user_id,product_id,quantity,source) values(v_user,v_product.id,1,'shop') on conflict(user_id,product_id) do update set quantity=public.arena_player_inventory.quantity+1,acquired_at=now(),source='shop' returning quantity into v_quantity;
 return jsonb_build_object('coins',v_wallet.coins,'gems',v_wallet.gems,'product_id',v_product.id,'quantity',v_quantity,'price_paid',v_price,'replayed',false);
end;
$$;

revoke all on function public.arena_rotating_offer_price(text),public.arena_get_rotating_shop_offers() from public;
grant execute on function public.arena_get_rotating_shop_offers() to anon,authenticated;

commit;
