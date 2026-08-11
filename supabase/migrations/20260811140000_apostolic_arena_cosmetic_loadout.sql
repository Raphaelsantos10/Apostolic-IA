begin;

create table public.arena_player_cosmetic_loadouts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  slot text not null check (slot in ('skin','emote','entrance_effect','victory_effect')),
  product_id text not null references public.arena_shop_products(id),
  equipped_at timestamptz not null default now(),
  primary key (user_id,slot)
);

alter table public.arena_player_cosmetic_loadouts enable row level security;
alter table public.arena_player_cosmetic_loadouts force row level security;
create policy "arena_cosmetic_loadout_select_own" on public.arena_player_cosmetic_loadouts
  for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.arena_player_cosmetic_loadouts from anon, authenticated;
grant select on public.arena_player_cosmetic_loadouts to authenticated;

create or replace function public.arena_cosmetic_slot(p_product_id text)
returns text language sql immutable set search_path='' as $$
  select case
    when p_product_id like 'skin-%' then 'skin'
    when p_product_id like 'emote-%' then 'emote'
    when p_product_id='effect-fogo-celestial' then 'entrance_effect'
    when p_product_id like 'effect-%' then 'victory_effect'
    else null
  end;
$$;

create or replace function public.arena_get_cosmetic_loadout()
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user_id uuid := (select auth.uid()); v_result jsonb;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  select coalesce(jsonb_object_agg(slot,product_id),'{}'::jsonb) into v_result
    from public.arena_player_cosmetic_loadouts where user_id=v_user_id;
  return v_result;
end;
$$;

create or replace function public.arena_equip_cosmetic(p_product_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_slot text := public.arena_cosmetic_slot(p_product_id);
  v_result jsonb;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if v_slot is null then raise exception 'product is not equippable'; end if;
  if not exists(select 1 from public.arena_player_inventory where user_id=v_user_id and product_id=p_product_id) then raise exception 'product not owned'; end if;
  insert into public.arena_player_cosmetic_loadouts(user_id,slot,product_id)
    values(v_user_id,v_slot,p_product_id)
    on conflict(user_id,slot) do update set product_id=excluded.product_id,equipped_at=now();
  select coalesce(jsonb_object_agg(slot,product_id),'{}'::jsonb) into v_result
    from public.arena_player_cosmetic_loadouts where user_id=v_user_id;
  return v_result;
end;
$$;

revoke all on function public.arena_cosmetic_slot(text), public.arena_get_cosmetic_loadout(), public.arena_equip_cosmetic(text) from public;
grant execute on function public.arena_get_cosmetic_loadout(), public.arena_equip_cosmetic(text) to authenticated;

commit;
