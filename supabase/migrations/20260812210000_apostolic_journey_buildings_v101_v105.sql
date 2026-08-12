begin;

-- V101 - catalogo de edificios e balanceamento controlado pelo servidor.
create table public.apostolic_building_catalog(
 building text primary key check(building in('town_hall','warehouse','farm','lumberyard','quarry','olive_press','market')),
 name text not null,description text not null,max_level smallint not null default 20 check(max_level between 1 and 100),
 base_duration_seconds integer not null check(base_duration_seconds between 10 and 604800),duration_growth numeric(5,2)not null default 1.35 check(duration_growth between 1 and 5),
 base_costs jsonb not null check(jsonb_typeof(base_costs)='object'),cost_growth numeric(5,2)not null default 1.45 check(cost_growth between 1 and 5),sort_order smallint not null unique
);
insert into public.apostolic_building_catalog(building,name,description,base_duration_seconds,base_costs,sort_order)values
('town_hall','Prefeitura','Eleva o nível da cidade e libera futuras construções.',120,'{"cedar":120,"stone":100,"gold":80}',1),
('warehouse','Armazém','Aumenta em 500 a capacidade de todos os recursos.',75,'{"cedar":90,"stone":70,"gold":40}',2),
('farm','Campos de Trigo','Aumenta a produção de trigo em 30 por hora.',45,'{"cedar":55,"stone":25,"gold":25}',3),
('lumberyard','Bosque de Cedros','Aumenta a produção de cedro em 20 por hora.',50,'{"wheat":35,"stone":30,"gold":25}',4),
('quarry','Pedreira','Aumenta a produção de pedra em 20 por hora.',55,'{"wheat":40,"cedar":35,"gold":30}',5),
('olive_press','Prensa de Azeite','Aumenta a produção de azeite em 12 por hora.',60,'{"cedar":45,"stone":40,"gold":35}',6),
('market','Mercado','Prepara comércio, caravanas e geração econômica.',90,'{"cedar":70,"stone":55,"gold":70}',7);

-- V102 - fila única e temporal; nenhuma gema reduz duração.
create table public.apostolic_construction_queue(
 id uuid primary key default gen_random_uuid(),city_id uuid not null references public.apostolic_cities(id)on delete cascade,building text not null references public.apostolic_building_catalog(building),
 from_level smallint not null check(from_level>=0),to_level smallint not null check(to_level=from_level+1),costs jsonb not null,started_at timestamptz not null default clock_timestamp(),finishes_at timestamptz not null,
 status text not null default'building'check(status in('building','completed','cancelled')),idempotency_key uuid not null,completed_at timestamptz,created_at timestamptz not null default now(),
 unique(city_id,idempotency_key)
);
create unique index apostolic_construction_one_active_idx on public.apostolic_construction_queue(city_id)where status='building';
create index apostolic_construction_history_idx on public.apostolic_construction_queue(city_id,created_at desc);
alter table public.apostolic_building_catalog enable row level security;
alter table public.apostolic_construction_queue enable row level security;
create policy apostolic_building_catalog_read on public.apostolic_building_catalog for select to authenticated using(true);
create policy apostolic_construction_read_self on public.apostolic_construction_queue for select to authenticated using(exists(select 1 from public.apostolic_cities c where c.id=city_id and c.owner_id=(select auth.uid())));
revoke all on public.apostolic_building_catalog,public.apostolic_construction_queue from anon,authenticated;
grant select on public.apostolic_building_catalog,public.apostolic_construction_queue to authenticated;

-- V103 - conclusao idempotente e efeitos economicos atomicos.
create or replace function public.apostolic_finish_city_construction()returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_city uuid;q public.apostolic_construction_queue%rowtype;v_bonus integer;
begin
 if v_user is null then raise exception'authentication required';end if;
 select id into v_city from public.apostolic_cities where owner_id=v_user for update;if v_city is null then raise exception'city not found';end if;
 select*into q from public.apostolic_construction_queue where city_id=v_city and status='building'for update;
 if not found then return public.apostolic_get_city_overview();end if;
 if q.finishes_at>clock_timestamp()then raise exception'construction still in progress';end if;
 update public.apostolic_city_buildings set level=q.to_level,state='ready',finishes_at=null,updated_at=clock_timestamp()where city_id=v_city and building=q.building;
 update public.apostolic_construction_queue set status='completed',completed_at=clock_timestamp()where id=q.id;
 if q.building='warehouse'then
  update public.apostolic_cities set warehouse_level=q.to_level,updated_at=clock_timestamp()where id=v_city;
  update public.apostolic_city_resources set capacity=1000+(q.to_level-1)*500,updated_at=clock_timestamp()where city_id=v_city;
 elsif q.building='town_hall'then update public.apostolic_cities set level=q.to_level,updated_at=clock_timestamp()where id=v_city;
 else
  v_bonus:=case q.building when'farm'then 30 when'lumberyard'then 20 when'quarry'then 20 when'olive_press'then 12 else 0 end;
  if v_bonus>0 then update public.apostolic_city_resources set production_per_hour=production_per_hour+v_bonus,updated_at=clock_timestamp()where city_id=v_city and resource=case q.building when'farm'then'wheat'when'lumberyard'then'cedar'when'quarry'then'stone'else'oil'end;end if;
 end if;
 return public.apostolic_get_city_overview();
end;$$;

-- V104 - inicio transacional: custos, nivel e fila validados no banco.
create or replace function public.apostolic_start_building_upgrade(p_building text,p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_city uuid;b public.apostolic_city_buildings%rowtype;cat public.apostolic_building_catalog%rowtype;v_costs jsonb;v_duration integer;r record;v_cost bigint;
begin
 if v_user is null then raise exception'authentication required';end if;if p_idempotency_key is null then raise exception'idempotency key required';end if;
 select id into v_city from public.apostolic_cities where owner_id=v_user for update;if v_city is null then raise exception'city not found';end if;
 if exists(select 1 from public.apostolic_construction_queue where city_id=v_city and idempotency_key=p_idempotency_key)then return public.apostolic_get_city_overview();end if;
 if exists(select 1 from public.apostolic_construction_queue where city_id=v_city and status='building')then raise exception'construction queue occupied';end if;
 select*into b from public.apostolic_city_buildings where city_id=v_city and building=p_building for update;if not found then raise exception'building unavailable';end if;
 select*into cat from public.apostolic_building_catalog where building=p_building;if not found or b.level>=cat.max_level then raise exception'maximum level reached';end if;
 select coalesce(jsonb_object_agg(key,ceil((value::text)::numeric*power(cat.cost_growth,b.level-1))::bigint),'{}'::jsonb)into v_costs from jsonb_each(cat.base_costs);
 v_duration:=ceil(cat.base_duration_seconds*power(cat.duration_growth,b.level-1));
 for r in select key,value from jsonb_each_text(v_costs)loop
  v_cost:=r.value::bigint;
  if not exists(select 1 from public.apostolic_city_resources where city_id=v_city and resource=r.key and amount>=v_cost)then raise exception'insufficient resource: %',r.key;end if;
 end loop;
 for r in select key,value from jsonb_each_text(v_costs)loop
  v_cost:=r.value::bigint;
  update public.apostolic_city_resources set amount=amount-v_cost,updated_at=clock_timestamp()where city_id=v_city and resource=r.key;
  insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)select v_city,r.key,-v_cost,amount,'construction:'||p_building,p_idempotency_key from public.apostolic_city_resources where city_id=v_city and resource=r.key;
 end loop;
 insert into public.apostolic_construction_queue(city_id,building,from_level,to_level,costs,finishes_at,idempotency_key)values(v_city,p_building,b.level,b.level+1,v_costs,clock_timestamp()+make_interval(secs=>v_duration),p_idempotency_key);
 update public.apostolic_city_buildings set state='upgrading',finishes_at=clock_timestamp()+make_interval(secs=>v_duration),updated_at=clock_timestamp()where city_id=v_city and building=p_building;
 return public.apostolic_get_city_overview();
end;$$;

-- V105 - painel completo com catalogo, proximo custo e fila atual.
create or replace function public.apostolic_get_construction_center()returns jsonb language sql stable security definer set search_path='' as $$
with own_city as(select id from public.apostolic_cities where owner_id=(select auth.uid())),items as(
 select cat.building,cat.name,cat.description,b.level,cat.max_level,b.state,b.finishes_at,
 (select coalesce(jsonb_object_agg(key,ceil((value::text)::numeric*power(cat.cost_growth,b.level-1))::bigint),'{}'::jsonb)from jsonb_each(cat.base_costs))next_costs,
 ceil(cat.base_duration_seconds*power(cat.duration_growth,b.level-1))::integer duration_seconds,cat.sort_order
 from own_city c join public.apostolic_city_buildings b on b.city_id=c.id join public.apostolic_building_catalog cat on cat.building=b.building)
select jsonb_build_object('server_now',clock_timestamp(),'queue',(select to_jsonb(q)from(select id,building,from_level,to_level,costs,started_at,finishes_at,status from public.apostolic_construction_queue where city_id=(select id from own_city)and status='building'limit 1)q),'buildings',coalesce((select jsonb_agg(to_jsonb(i)-'sort_order'order by sort_order)from items i),'[]'::jsonb))
$$;
revoke all on function public.apostolic_finish_city_construction(),public.apostolic_start_building_upgrade(text,uuid),public.apostolic_get_construction_center()from public;
grant execute on function public.apostolic_finish_city_construction(),public.apostolic_start_building_upgrade(text,uuid),public.apostolic_get_construction_center()to authenticated;
commit;
