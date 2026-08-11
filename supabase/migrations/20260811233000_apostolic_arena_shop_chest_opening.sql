begin;

create table if not exists public.arena_shop_chest_openings(
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null references public.arena_shop_products(id), idempotency_key text not null unique,
 reward_coins integer not null check(reward_coins>=0), reward_gems integer not null check(reward_gems>=0), opened_at timestamptz not null default now()
);
alter table public.arena_shop_chest_openings enable row level security;
alter table public.arena_shop_chest_openings force row level security;
create policy "arena_chest_openings_read_own" on public.arena_shop_chest_openings for select to authenticated using((select auth.uid())=user_id);
revoke all on public.arena_shop_chest_openings from anon,authenticated;
grant select on public.arena_shop_chest_openings to authenticated;

create or replace function public.arena_open_shop_chest(p_product_id text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid());v_quantity integer;v_coins integer;v_gems integer;v_reward_coins integer;v_reward_gems integer;v_existing public.arena_shop_chest_openings%rowtype;
begin
 if v_user is null then raise exception 'authentication required';end if;
 if p_idempotency_key is null or length(p_idempotency_key)<16 then raise exception 'invalid idempotency key';end if;
 select * into v_existing from public.arena_shop_chest_openings where idempotency_key=p_idempotency_key and user_id=v_user;
 if found then select coins,gems into v_coins,v_gems from public.arena_player_wallets where user_id=v_user;select quantity into v_quantity from public.arena_player_inventory where user_id=v_user and product_id=p_product_id;return jsonb_build_object('coins',v_coins,'gems',v_gems,'reward_coins',v_existing.reward_coins,'reward_gems',v_existing.reward_gems,'remaining',coalesce(v_quantity,0),'replayed',true);end if;
 if not exists(select 1 from public.arena_shop_products where id=p_product_id and category='chests') then raise exception 'invalid chest';end if;
 select quantity into v_quantity from public.arena_player_inventory where user_id=v_user and product_id=p_product_id for update;
 if coalesce(v_quantity,0)<1 then raise exception 'chest unavailable';end if;
 v_reward_coins:=case when p_product_id='chest-alianca' then 700+floor(random()*401)::integer else 280+floor(random()*221)::integer end;
 v_reward_gems:=case when p_product_id='chest-alianca' and random()<.25 then 5 else 0 end;
 update public.arena_player_inventory set quantity=quantity-1 where user_id=v_user and product_id=p_product_id returning quantity into v_quantity;
 delete from public.arena_player_inventory where user_id=v_user and product_id=p_product_id and quantity=0;
 insert into public.arena_player_wallets(user_id,coins,gems) values(v_user,v_reward_coins,v_reward_gems) on conflict(user_id) do update set coins=public.arena_player_wallets.coins+v_reward_coins,gems=public.arena_player_wallets.gems+v_reward_gems returning coins,gems into v_coins,v_gems;
 insert into public.arena_shop_chest_openings(user_id,product_id,idempotency_key,reward_coins,reward_gems) values(v_user,p_product_id,p_idempotency_key,v_reward_coins,v_reward_gems);
 return jsonb_build_object('coins',v_coins,'gems',v_gems,'reward_coins',v_reward_coins,'reward_gems',v_reward_gems,'remaining',v_quantity,'replayed',false);
end;$$;
revoke all on function public.arena_open_shop_chest(text,text) from public;
grant execute on function public.arena_open_shop_chest(text,text) to authenticated;
commit;
