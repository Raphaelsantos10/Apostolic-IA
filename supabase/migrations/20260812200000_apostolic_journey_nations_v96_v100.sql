begin;

-- V96 - mundos e as cinco regioes biblicas. O beta nasce no Vale de Canaa.
create table public.apostolic_worlds(
 id uuid primary key default gen_random_uuid(),slug text not null unique check(slug~'^[a-z0-9-]+$'),name text not null unique,
 status text not null default'beta'check(status in('beta','active','maintenance','archived')),max_players integer not null default 1600 check(max_players between 16 and 50000),
 starts_at timestamptz not null default now(),created_at timestamptz not null default now()
);
create table public.apostolic_world_regions(
 id smallint primary key,slug text not null unique,name text not null unique,sort_order smallint not null unique,
 progression_tier smallint not null check(progression_tier between 1 and 5),biome text not null,resource_affinities text[] not null default'{}',is_beta_entry boolean not null default false
);
insert into public.apostolic_world_regions(id,slug,name,sort_order,progression_tier,biome,resource_affinities,is_beta_entry)values
 (1,'vale-canaa','Vale de Canaã',1,1,'Vales férteis, rios e oliveiras',array['wheat','oil'],true),
 (2,'costa-mediterraneo','Costa do Mediterrâneo',2,2,'Litoral, portos e falésias',array['cedar'],false),
 (3,'negev','Negev',3,3,'Oásis, cânions e pedreiras',array['stone'],false),
 (4,'asia-menor','Ásia Menor',4,4,'Montanhas e vales fortificados',array['oil','gold'],false),
 (5,'planalto-imperial','Planalto Imperial',5,5,'Capitais monumentais e estradas imperiais',array['stone','gold'],false);
insert into public.apostolic_worlds(slug,name,status,max_players)values('beta-canaa-1','Beta - Vale de Canaã','beta',1600);

-- V97 - provincias dinamicas com 16 cidades e capital compartilhada por Aliancas.
create table public.apostolic_provinces(
 id uuid primary key default gen_random_uuid(),world_id uuid not null references public.apostolic_worlds(id)on delete restrict,region_id smallint not null references public.apostolic_world_regions(id),
 sequence_no integer not null check(sequence_no>0),name text not null,city_count smallint not null default 0 check(city_count between 0 and 16),capacity smallint not null default 16 check(capacity=16),
 capital_alliance_id uuid references public.arena_alliances(id)on delete set null,capital_level smallint not null default 1 check(capital_level between 1 and 100),created_at timestamptz not null default now(),
 unique(world_id,region_id,sequence_no),unique(world_id,name)
);
create index apostolic_provinces_open_idx on public.apostolic_provinces(world_id,region_id,city_count,sequence_no)where city_count<16;

-- V98 - uma cidade inicial por jogador, ocupando atomicamente um slot provincial.
create table public.apostolic_cities(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null unique references public.profiles(id)on delete cascade,province_id uuid not null references public.apostolic_provinces(id)on delete restrict,
 slot_no smallint not null check(slot_no between 1 and 16),name text not null check(length(trim(name))between 3 and 32),level smallint not null default 1 check(level between 1 and 100),
 warehouse_level smallint not null default 1 check(warehouse_level between 1 and 100),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(province_id,slot_no)
);

-- V99 - recursos e producao calculados exclusivamente no servidor.
create table public.apostolic_city_resources(
 city_id uuid not null references public.apostolic_cities(id)on delete cascade,resource text not null check(resource in('wheat','cedar','stone','oil','gold')),
 amount bigint not null default 0 check(amount>=0),capacity bigint not null default 1000 check(capacity>=1000),production_per_hour integer not null check(production_per_hour between 0 and 100000),
 last_collected_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(city_id,resource),check(amount<=capacity)
);
create table public.apostolic_resource_ledger(
 id bigint generated always as identity primary key,city_id uuid not null references public.apostolic_cities(id)on delete cascade,resource text not null check(resource in('wheat','cedar','stone','oil','gold')),
 delta bigint not null,balance_after bigint not null check(balance_after>=0),reason text not null,idempotency_key uuid,created_at timestamptz not null default now(),unique(city_id,idempotency_key,resource)
);
create index apostolic_resource_ledger_city_idx on public.apostolic_resource_ledger(city_id,created_at desc);

-- V100 - armazem, edificios iniciais e base para pesquisas/construcoes futuras.
create table public.apostolic_city_buildings(
 city_id uuid not null references public.apostolic_cities(id)on delete cascade,building text not null check(building in('town_hall','warehouse','farm','lumberyard','quarry','olive_press','market')),
 level smallint not null default 1 check(level between 0 and 100),state text not null default'ready'check(state in('ready','building','upgrading')),finishes_at timestamptz,updated_at timestamptz not null default now(),primary key(city_id,building)
);

alter table public.apostolic_worlds enable row level security;
alter table public.apostolic_world_regions enable row level security;
alter table public.apostolic_provinces enable row level security;
alter table public.apostolic_cities enable row level security;
alter table public.apostolic_city_resources enable row level security;
alter table public.apostolic_resource_ledger enable row level security;
alter table public.apostolic_city_buildings enable row level security;
create policy apostolic_worlds_read on public.apostolic_worlds for select to authenticated using(status in('beta','active','maintenance'));
create policy apostolic_regions_read on public.apostolic_world_regions for select to authenticated using(true);
create policy apostolic_provinces_read on public.apostolic_provinces for select to authenticated using(true);
create policy apostolic_cities_read_self on public.apostolic_cities for select to authenticated using(owner_id=(select auth.uid()));
create policy apostolic_resources_read_self on public.apostolic_city_resources for select to authenticated using(exists(select 1 from public.apostolic_cities c where c.id=city_id and c.owner_id=(select auth.uid())));
create policy apostolic_buildings_read_self on public.apostolic_city_buildings for select to authenticated using(exists(select 1 from public.apostolic_cities c where c.id=city_id and c.owner_id=(select auth.uid())));
revoke all on public.apostolic_worlds,public.apostolic_world_regions,public.apostolic_provinces,public.apostolic_cities,public.apostolic_city_resources,public.apostolic_resource_ledger,public.apostolic_city_buildings from anon,authenticated;
grant select on public.apostolic_worlds,public.apostolic_world_regions,public.apostolic_provinces,public.apostolic_cities,public.apostolic_city_resources,public.apostolic_city_buildings to authenticated;

create or replace function public.apostolic_create_initial_city(p_name text default'Cidade da Promessa')returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_world uuid;v_province public.apostolic_provinces%rowtype;v_city public.apostolic_cities%rowtype;v_sequence integer;v_slot smallint;v_name text:=trim(p_name);
begin
 if v_user is null then raise exception'authentication required';end if;
 if length(v_name)not between 3 and 32 then raise exception'city name must contain 3 to 32 characters';end if;
 select*into v_city from public.apostolic_cities where owner_id=v_user;if found then return public.apostolic_get_city_overview();end if;
 select id into v_world from public.apostolic_worlds where status in('beta','active')order by(status='beta')desc,starts_at limit 1;
 if v_world is null then raise exception'no world available';end if;
 perform pg_advisory_xact_lock(hashtextextended(v_world::text||':1',0));
 select*into v_province from public.apostolic_provinces where world_id=v_world and region_id=1 and city_count<16 order by sequence_no for update skip locked limit 1;
 if not found then
  select coalesce(max(sequence_no),0)+1 into v_sequence from public.apostolic_provinces where world_id=v_world and region_id=1;
  insert into public.apostolic_provinces(world_id,region_id,sequence_no,name)values(v_world,1,v_sequence,'Província do Jordão '||v_sequence)returning*into v_province;
 end if;
 select s into v_slot from generate_series(1,16)s where not exists(select 1 from public.apostolic_cities c where c.province_id=v_province.id and c.slot_no=s)order by s limit 1;
 if v_slot is null then raise exception'province capacity exhausted';end if;
 insert into public.apostolic_cities(owner_id,province_id,slot_no,name)values(v_user,v_province.id,v_slot,v_name)returning*into v_city;
 update public.apostolic_provinces set city_count=city_count+1 where id=v_province.id;
 insert into public.apostolic_city_resources(city_id,resource,amount,capacity,production_per_hour)values
  (v_city.id,'wheat',300,1000,60),(v_city.id,'cedar',220,1000,35),(v_city.id,'stone',220,1000,35),(v_city.id,'oil',120,1000,20),(v_city.id,'gold',250,1000,25);
 insert into public.apostolic_city_buildings(city_id,building,level)values(v_city.id,'town_hall',1),(v_city.id,'warehouse',1),(v_city.id,'farm',1),(v_city.id,'lumberyard',1),(v_city.id,'quarry',1),(v_city.id,'olive_press',1),(v_city.id,'market',1);
 return public.apostolic_get_city_overview();
end;$$;

create or replace function public.apostolic_collect_city_production(p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_city uuid;r record;v_gain bigint;v_now timestamptz:=clock_timestamp();
begin
 if v_user is null then raise exception'authentication required';end if;if p_idempotency_key is null then raise exception'idempotency key required';end if;
 select id into v_city from public.apostolic_cities where owner_id=v_user for update;if v_city is null then raise exception'city not found';end if;
 if exists(select 1 from public.apostolic_resource_ledger where city_id=v_city and idempotency_key=p_idempotency_key)then return public.apostolic_get_city_overview();end if;
 for r in select*from public.apostolic_city_resources where city_id=v_city for update loop
  v_gain:=least(r.capacity-r.amount,floor(extract(epoch from(v_now-r.last_collected_at))*r.production_per_hour/3600)::bigint);
  update public.apostolic_city_resources set amount=amount+v_gain,last_collected_at=v_now,updated_at=v_now where city_id=v_city and resource=r.resource;
  insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)values(v_city,r.resource,v_gain,r.amount+v_gain,'production',p_idempotency_key);
 end loop;
 return public.apostolic_get_city_overview();
end;$$;

create or replace function public.apostolic_get_city_overview()returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('world',jsonb_build_object('id',w.id,'name',w.name,'status',w.status),'region',jsonb_build_object('id',rg.id,'name',rg.name,'biome',rg.biome),'province',jsonb_build_object('id',p.id,'name',p.name,'cities',p.city_count,'capacity',p.capacity,'capital_level',p.capital_level),'city',jsonb_build_object('id',c.id,'name',c.name,'level',c.level,'slot',c.slot_no,'warehouse_level',c.warehouse_level),'resources',(select coalesce(jsonb_object_agg(cr.resource,jsonb_build_object('amount',cr.amount,'capacity',cr.capacity,'per_hour',cr.production_per_hour,'last_collected_at',cr.last_collected_at)),'{}'::jsonb)from public.apostolic_city_resources cr where cr.city_id=c.id),'buildings',(select coalesce(jsonb_object_agg(b.building,jsonb_build_object('level',b.level,'state',b.state,'finishes_at',b.finishes_at)),'{}'::jsonb)from public.apostolic_city_buildings b where b.city_id=c.id))from public.apostolic_cities c join public.apostolic_provinces p on p.id=c.province_id join public.apostolic_worlds w on w.id=p.world_id join public.apostolic_world_regions rg on rg.id=p.region_id where c.owner_id=(select auth.uid())),'null'::jsonb)
$$;

revoke all on function public.apostolic_create_initial_city(text),public.apostolic_collect_city_production(uuid),public.apostolic_get_city_overview()from public;
grant execute on function public.apostolic_create_initial_city(text),public.apostolic_collect_city_production(uuid),public.apostolic_get_city_overview()to authenticated;
commit;
