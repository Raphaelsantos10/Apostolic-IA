begin;

alter table public.arena_shop_products
  add column if not exists compare_at_price integer check (compare_at_price is null or compare_at_price >= price),
  add column if not exists sort_order integer not null default 100 check (sort_order between 0 and 10000),
  add column if not exists purchase_limit integer check (purchase_limit is null or purchase_limit > 0),
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists arena_shop_products_set_updated_at on public.arena_shop_products;
create trigger arena_shop_products_set_updated_at before update on public.arena_shop_products
for each row execute function public.set_updated_at();

update public.arena_shop_products set metadata=metadata||case id
  when 'skin-davi-guerreiro' then '{"subtitle":"Skin rara · apenas visual","image":"/games/apostolic-arena/cards/art/common/001-davi-e-a-funda-v1.webp","rarity":"rare","featured":true}'::jsonb
  when 'skin-davi-rei' then '{"subtitle":"Skin épica · apenas visual","image":"/games/apostolic-arena/cards/art/legendary/103-rei-davi-v1.webp","rarity":"epic","featured":true}'::jsonb
  when 'skin-moises-mar-vermelho' then '{"subtitle":"Skin épica · apenas visual","image":"/games/apostolic-arena/cards/art/champion/117-moises-o-libertador-v1.webp","rarity":"epic"}'::jsonb
  when 'skin-elias-fogo-ceu' then '{"subtitle":"Skin lendária · apenas visual","image":"/games/apostolic-arena/cards/art/legendary/104-profeta-elias-v1.webp","rarity":"legendary"}'::jsonb
  when 'chest-alianca' then '{"subtitle":"Épica garantida","image":"/games/apostolic-arena/chests/alliance-chest-v1.webp","rarity":"epic","featured":true}'::jsonb
  when 'chest-real' then '{"subtitle":"Raras e épicas","image":"/games/apostolic-arena/chests/golden-chest-v1.webp","rarity":"rare"}'::jsonb
  when 'effect-trombetas-jerico' then '{"subtitle":"Efeito de vitória","image":"/games/apostolic-arena/cards/art/epic/077-trombetas-de-jerico-v1.webp","rarity":"epic"}'::jsonb
  when 'effect-fogo-celestial' then '{"subtitle":"Efeito de entrada","image":"/games/apostolic-arena/cards/art/epic/091-coluna-de-fogo-v1.webp","rarity":"legendary","featured":true}'::jsonb
  when 'emote-noe-pomba' then '{"subtitle":"Emote da Aliança","image":"/games/apostolic-arena/cards/art/epic/088-noe-o-patriarca-v1.webp","rarity":"rare"}'::jsonb
  when 'pass-alianca-s1' then '{"subtitle":"Trilha premium · sem poder de combate","image":"/games/apostolic-arena/ui/emblems/alianca-v1.png","rarity":"premium","featured":true,"sellable":true,"premium_pass":true,"season_id":"alianca-s1"}'::jsonb
  when 'gems-small' then '{"subtitle":"Pacote Pequeno","image":"/games/apostolic-arena/ui/currency/gema-celestial-v1.png","rarity":"rare","sellable":true,"grant_gems":100}'::jsonb
  when 'gems-warrior' then '{"subtitle":"Pacote Guerreiro","image":"/games/apostolic-arena/ui/currency/gema-celestial-v1.png","rarity":"epic","sellable":true,"grant_gems":550}'::jsonb
  when 'gems-king' then '{"subtitle":"Pacote Rei","image":"/games/apostolic-arena/ui/currency/gema-celestial-v1.png","rarity":"epic","sellable":true,"grant_gems":1200}'::jsonb
  when 'gems-prophet' then '{"subtitle":"Pacote Profeta","image":"/games/apostolic-arena/ui/currency/gema-celestial-v1.png","rarity":"legendary","sellable":true,"grant_gems":2600}'::jsonb
  when 'gems-covenant' then '{"subtitle":"Pacote Aliança","image":"/games/apostolic-arena/ui/currency/gema-celestial-v1.png","rarity":"premium","featured":true,"sellable":true,"grant_gems":7000}'::jsonb
  else '{}'::jsonb end;

update public.arena_shop_products set sort_order=case id
  when 'pass-alianca-s1' then 10 when 'chest-alianca' then 20 when 'effect-fogo-celestial' then 30
  when 'skin-davi-rei' then 40 when 'skin-davi-guerreiro' then 50 when 'chest-real' then 60 else 100 end;
update public.arena_shop_products set compare_at_price=699 where id='pass-alianca-s1' and price=599;
update public.arena_shop_products set compare_at_price=5999 where id='gems-covenant' and price=4999;

create or replace function public.arena_admin_upsert_shop_product(p_product jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid()); v_id text:=p_product->>'id';
begin
  if v_user is null or not exists(select 1 from public.arena_admins where user_id=v_user) then raise exception 'administrator required'; end if;
  if v_id is null or v_id !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid product id'; end if;
  insert into public.arena_shop_products(id,category,name,currency,price,compare_at_price,sort_order,purchase_limit,active,starts_at,ends_at,metadata)
  values(v_id,p_product->>'category',left(p_product->>'name',100),p_product->>'currency',(p_product->>'price')::integer,nullif(p_product->>'compare_at_price','')::integer,coalesce((p_product->>'sort_order')::integer,100),nullif(p_product->>'purchase_limit','')::integer,coalesce((p_product->>'active')::boolean,false),nullif(p_product->>'starts_at','')::timestamptz,nullif(p_product->>'ends_at','')::timestamptz,coalesce(p_product->'metadata','{}'::jsonb))
  on conflict(id) do update set category=excluded.category,name=excluded.name,currency=excluded.currency,price=excluded.price,compare_at_price=excluded.compare_at_price,sort_order=excluded.sort_order,purchase_limit=excluded.purchase_limit,active=excluded.active,starts_at=excluded.starts_at,ends_at=excluded.ends_at,metadata=excluded.metadata;
  return jsonb_build_object('id',v_id,'saved',true);
end;
$$;

revoke all on function public.arena_admin_upsert_shop_product(jsonb) from public;
grant execute on function public.arena_admin_upsert_shop_product(jsonb) to authenticated;

commit;
