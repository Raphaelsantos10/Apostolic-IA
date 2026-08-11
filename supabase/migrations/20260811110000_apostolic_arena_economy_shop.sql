begin;

create table public.arena_player_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  coins bigint not null default 2500 check (coins >= 0),
  gems bigint not null default 100 check (gems >= 0),
  updated_at timestamptz not null default now()
);

create table public.arena_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency text not null check (currency in ('coins','gems')),
  amount bigint not null check (amount <> 0),
  transaction_type text not null check (transaction_type in ('earn','spend','purchase','refund')),
  source text not null,
  reference_id text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table public.arena_shop_products (
  id text primary key check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text not null check (category in ('featured','chests','skins','effects','pass','gems')),
  name text not null,
  currency text not null check (currency in ('gems','money','coins')),
  price integer not null check (price >= 0),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table public.arena_player_inventory (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.arena_shop_products(id),
  quantity integer not null default 1 check (quantity > 0),
  acquired_at timestamptz not null default now(),
  source text not null,
  primary key (user_id, product_id)
);

create table public.arena_economy_limits (
  key text primary key,
  value numeric not null check (value >= 0),
  period text not null check (period in ('day','week','month','season','lifetime'))
);

create table public.arena_player_reward_counters (
  user_id uuid not null references public.profiles(id) on delete cascade,
  counter_key text not null,
  period_key text not null,
  value integer not null default 0 check (value >= 0),
  primary key (user_id, counter_key, period_key)
);

create trigger arena_player_wallets_set_updated_at before update on public.arena_player_wallets
for each row execute function public.set_updated_at();

alter table public.arena_player_wallets enable row level security;
alter table public.arena_player_wallets force row level security;
alter table public.arena_wallet_transactions enable row level security;
alter table public.arena_wallet_transactions force row level security;
alter table public.arena_shop_products enable row level security;
alter table public.arena_shop_products force row level security;
alter table public.arena_player_inventory enable row level security;
alter table public.arena_player_inventory force row level security;
alter table public.arena_economy_limits enable row level security;
alter table public.arena_economy_limits force row level security;
alter table public.arena_player_reward_counters enable row level security;
alter table public.arena_player_reward_counters force row level security;

create policy "arena_wallet_select_own" on public.arena_player_wallets for select to authenticated using ((select auth.uid())=user_id);
create policy "arena_transactions_select_own" on public.arena_wallet_transactions for select to authenticated using ((select auth.uid())=user_id);
create policy "arena_products_read_active" on public.arena_shop_products for select to authenticated using (active and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()));
create policy "arena_inventory_select_own" on public.arena_player_inventory for select to authenticated using ((select auth.uid())=user_id);
create policy "arena_reward_counters_select_own" on public.arena_player_reward_counters for select to authenticated using ((select auth.uid())=user_id);

revoke all on public.arena_player_wallets, public.arena_wallet_transactions, public.arena_shop_products,
  public.arena_player_inventory, public.arena_economy_limits, public.arena_player_reward_counters from anon, authenticated;
grant select on public.arena_player_wallets, public.arena_wallet_transactions, public.arena_shop_products,
  public.arena_player_inventory, public.arena_player_reward_counters to authenticated;

insert into public.arena_economy_limits(key,value,period) values
  ('free-gems-weekly-target',18,'week'),('free-gems-monthly-target',80,'month'),('free-gems-monthly-hard-cap',120,'month');

insert into public.arena_shop_products(id,category,name,currency,price,active,metadata) values
  ('skin-davi-guerreiro','skins','Davi Guerreiro','gems',180,true,'{"rarity":"rare","cosmetic":true}'),
  ('skin-davi-rei','skins','Davi Rei','gems',350,true,'{"rarity":"epic","cosmetic":true}'),
  ('skin-moises-mar-vermelho','skins','Moisés - Mar Vermelho','gems',350,true,'{"rarity":"epic","cosmetic":true}'),
  ('skin-elias-fogo-ceu','skins','Elias - Fogo do Céu','gems',500,true,'{"rarity":"legendary","cosmetic":true}'),
  ('chest-alianca','chests','Baú da Aliança','gems',160,true,'{"reward_kind":"chest"}'),
  ('chest-real','chests','Baú Real','gems',90,true,'{"reward_kind":"chest"}'),
  ('effect-trombetas-jerico','effects','Trombetas de Jericó','gems',220,true,'{"cosmetic":true}'),
  ('effect-fogo-celestial','effects','Fogo Celestial','gems',280,true,'{"cosmetic":true}'),
  ('emote-noe-pomba','effects','Noé e a Pomba','gems',80,true,'{"cosmetic":true}'),
  ('pass-alianca-s1','pass','Passe da Aliança','money',599,false,'{"coming_soon":true}'),
  ('gems-small','gems','100 Gemas','money',99,false,'{"coming_soon":true}'),
  ('gems-warrior','gems','550 Gemas','money',499,false,'{"coming_soon":true}');

create or replace function public.arena_get_wallet()
returns table (coins bigint, gems bigint, updated_at timestamptz)
language plpgsql
security definer
set search_path=''
as $$
declare v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  insert into public.arena_player_wallets(user_id) values (v_user_id) on conflict (user_id) do nothing;
  return query select w.coins,w.gems,w.updated_at from public.arena_player_wallets w where w.user_id=v_user_id;
end;
$$;

create or replace function public.arena_purchase_product(p_product_id text, p_idempotency_key text)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_product public.arena_shop_products%rowtype;
  v_wallet public.arena_player_wallets%rowtype;
begin
  if v_user_id is null then raise exception 'authentication required'; end if;
  if p_idempotency_key is null or length(p_idempotency_key)<16 then raise exception 'invalid idempotency key'; end if;

  select * into v_product from public.arena_shop_products
  where id=p_product_id and active and currency='gems'
    and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now());
  if not found then raise exception 'product unavailable'; end if;

  if exists(select 1 from public.arena_wallet_transactions where idempotency_key=p_idempotency_key) then
    select * into v_wallet from public.arena_player_wallets where user_id=v_user_id;
    return jsonb_build_object('coins',v_wallet.coins,'gems',v_wallet.gems,'product_id',p_product_id,'replayed',true);
  end if;
  if exists(select 1 from public.arena_player_inventory where user_id=v_user_id and product_id=p_product_id) then raise exception 'product already owned'; end if;

  insert into public.arena_player_wallets(user_id) values(v_user_id) on conflict(user_id) do nothing;
  select * into v_wallet from public.arena_player_wallets where user_id=v_user_id for update;
  if v_wallet.gems<v_product.price then raise exception 'insufficient gems'; end if;

  update public.arena_player_wallets set gems=gems-v_product.price where user_id=v_user_id returning * into v_wallet;
  insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key)
  values(v_user_id,'gems',-v_product.price,'spend','shop',v_product.id,p_idempotency_key);
  insert into public.arena_player_inventory(user_id,product_id,source) values(v_user_id,v_product.id,'shop');
  return jsonb_build_object('coins',v_wallet.coins,'gems',v_wallet.gems,'product_id',v_product.id,'replayed',false);
end;
$$;

revoke all on function public.arena_get_wallet(), public.arena_purchase_product(text,text) from public;
grant execute on function public.arena_get_wallet(), public.arena_purchase_product(text,text) to authenticated;

commit;
