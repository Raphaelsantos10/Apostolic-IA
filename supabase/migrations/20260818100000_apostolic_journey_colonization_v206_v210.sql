begin;

-- V206: arquipélago original da Jornada, com identidade e recursos próprios.
create table public.apostolic_island_catalog(
 code text primary key,
 name text not null unique,
 description text not null,
 biome text not null,
 primary_resource text not null check(primary_resource in('wheat','cedar','stone','oil','gold')),
 terrain_options text[] not null check(cardinality(terrain_options)>=2),
 distance_nm integer not null check(distance_nm between 40 and 5000),
 exploration_seconds integer not null check(exploration_seconds between 900 and 604800),
 foundation_seconds integer not null check(foundation_seconds between 3600 and 1209600),
 settlement_capacity smallint not null check(settlement_capacity between 8 and 100),
 town_hall_level smallint not null check(town_hall_level between 1 and 100),
 required_research_code text not null references public.apostolic_research_catalog(code),
 exploration_costs jsonb not null check(jsonb_typeof(exploration_costs)='object'and not(exploration_costs?'gems')),
 foundation_costs jsonb not null check(jsonb_typeof(foundation_costs)='object'and not(foundation_costs?'gems')),
 visual_asset text not null,
 sort_order smallint not null unique
);
insert into public.apostolic_island_catalog values
 ('patmos','Ilha de Patmos','Falésias tranquilas, enseadas protegidas e caminhos de reflexão.','Falésias e oliveiras','oil',array['olive_grove','harbor','highland'],120,1200,14400,32,5,'navigation_basics','{"wheat":120,"cedar":90,"gold":80}','{"wheat":600,"cedar":700,"stone":420,"oil":180,"gold":500}','/games/apostolic-journey/world/colonization-archipelago-v210.webp',1),
 ('cyprus','Jardins de Chipre','Planícies férteis ligadas a pedreiras e portos de águas claras.','Planície mediterrânica','stone',array['fertile_plain','quarry','harbor'],280,2400,21600,40,7,'merchant_hulls','{"wheat":180,"cedar":140,"oil":80,"gold":130}','{"wheat":900,"cedar":980,"stone":620,"oil":260,"gold":760}','/games/apostolic-journey/world/colonization-archipelago-v210.webp',2),
 ('crete','Costa de Creta','Uma grande ilha de montanhas, campos e bosques antigos.','Montanhas costeiras','cedar',array['cedar_forest','fertile_plain','highland'],470,3600,28800,48,10,'cargo_logistics','{"wheat":260,"cedar":210,"oil":140,"gold":190}','{"wheat":1300,"cedar":1450,"stone":900,"oil":420,"gold":1100}','/games/apostolic-journey/world/colonization-archipelago-v210.webp',3),
 ('malta','Refúgio de Malta','Portos naturais e pedra resistente para uma comunidade perseverante.','Baías rochosas','stone',array['quarry','harbor','olive_grove'],760,5400,36000,36,12,'naval_defense','{"wheat":340,"cedar":300,"oil":210,"gold":280}','{"wheat":1800,"cedar":1900,"stone":1350,"oil":650,"gold":1550}','/games/apostolic-journey/world/colonization-archipelago-v210.webp',4),
 ('tarsis','Ilhas de Társis','Arquipélago remoto de comércio, metais e travessias exigentes.','Ilhas minerais','gold',array['quarry','harbor','highland'],1180,7200,50400,28,16,'cargo_logistics','{"wheat":480,"cedar":430,"oil":320,"gold":400}','{"wheat":2500,"cedar":2800,"stone":2200,"oil":900,"gold":2300}','/games/apostolic-journey/world/colonization-archipelago-v210.webp',5),
 ('melita','Campos de Melita','Terras acolhedoras para lavoura, cuidado de viajantes e missão.','Campos e enseadas','wheat',array['fertile_plain','olive_grove','harbor'],1540,9000,64800,24,20,'mission_routes','{"wheat":620,"cedar":560,"oil":390,"gold":520}','{"wheat":3400,"cedar":3600,"stone":2800,"oil":1250,"gold":3100}','/games/apostolic-journey/world/colonization-archipelago-v210.webp',6);

-- V207: exploração descobre terrenos sem revelar tudo instantaneamente.
create table public.apostolic_island_discoveries(
 owner_id uuid not null references public.profiles(id)on delete cascade,
 island_code text not null references public.apostolic_island_catalog(code),
 discovered_at timestamptz not null default clock_timestamp(),
 report text not null,
 primary key(owner_id,island_code)
);
create table public.apostolic_colonization_projects(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id)on delete cascade,
 origin_city_id uuid not null references public.apostolic_cities(id)on delete cascade,
 island_code text not null references public.apostolic_island_catalog(code),
 project_type text not null check(project_type in('exploration','foundation')),
 terrain text,
 colony_name text,
 merchant_code text not null references public.apostolic_vessel_catalog(code),
 merchant_quantity smallint not null check(merchant_quantity between 1 and 10),
 costs jsonb not null check(jsonb_typeof(costs)='object'and not(costs?'gems')),
 status text not null default'active'check(status in('active','completed','cancelled')),
 started_at timestamptz not null default clock_timestamp(),
 finishes_at timestamptz not null,
 completed_at timestamptz,
 idempotency_key uuid not null,
 unique(owner_id,idempotency_key)
);
create unique index apostolic_colonization_one_active_idx on public.apostolic_colonization_projects(owner_id)where status='active';
create index apostolic_colonization_due_idx on public.apostolic_colonization_projects(finishes_at,owner_id)where status='active';

-- V208-V209: colónias são cidades administráveis isoladas da capital existente.
create table public.apostolic_colonies(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id)on delete cascade,
 island_code text not null references public.apostolic_island_catalog(code),
 name text not null check(length(trim(name))between 3 and 32),
 terrain text not null,
 level smallint not null default 1 check(level between 1 and 100),
 population integer not null default 35 check(population>=0),
 population_capacity integer not null default 80 check(population_capacity>=35),
 satisfaction smallint not null default 70 check(satisfaction between 0 and 100),
 corruption smallint not null default 30 check(corruption between 0 and 100),
 governor_hall_level smallint not null default 1 check(governor_hall_level between 1 and 100),
 focus text not null default'balanced'check(focus in('balanced','harvest','construction','mission','defense')),
 last_focus_change timestamptz not null default'-infinity',
 founded_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 unique(owner_id,island_code),unique(owner_id,name)
);
create index apostolic_colonies_owner_idx on public.apostolic_colonies(owner_id,founded_at);
create table public.apostolic_colony_resources(
 colony_id uuid not null references public.apostolic_colonies(id)on delete cascade,
 resource text not null check(resource in('wheat','cedar','stone','oil','gold')),
 amount bigint not null default 0 check(amount>=0),
 capacity bigint not null default 1200 check(capacity>=1200),
 base_production_per_hour integer not null check(base_production_per_hour between 0 and 100000),
 last_collected_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 primary key(colony_id,resource),check(amount<=capacity)
);
create table public.apostolic_colony_log(
 id bigint generated always as identity primary key,
 owner_id uuid not null references public.profiles(id)on delete cascade,
 colony_id uuid references public.apostolic_colonies(id)on delete cascade,
 event text not null,
 details jsonb not null default'{}',
 idempotency_key uuid,
 created_at timestamptz not null default clock_timestamp(),
 unique(owner_id,idempotency_key,event)
);
create index apostolic_colony_log_owner_idx on public.apostolic_colony_log(owner_id,created_at desc);

alter table public.apostolic_island_catalog enable row level security;alter table public.apostolic_island_catalog force row level security;
alter table public.apostolic_island_discoveries enable row level security;alter table public.apostolic_island_discoveries force row level security;
alter table public.apostolic_colonization_projects enable row level security;alter table public.apostolic_colonization_projects force row level security;
alter table public.apostolic_colonies enable row level security;alter table public.apostolic_colonies force row level security;
alter table public.apostolic_colony_resources enable row level security;alter table public.apostolic_colony_resources force row level security;
alter table public.apostolic_colony_log enable row level security;alter table public.apostolic_colony_log force row level security;
revoke all on public.apostolic_island_catalog,public.apostolic_island_discoveries,public.apostolic_colonization_projects,public.apostolic_colonies,public.apostolic_colony_resources,public.apostolic_colony_log from anon,authenticated;

-- V210: sincronização lazy conclui expedições e produz recursos das colónias.
create or replace function public.apostolic_get_colonization_center()returns jsonb language sql stable security definer set search_path=''as $$select null::jsonb$$;
create or replace function public.apostolic_sync_colonization_center()returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());p public.apostolic_colonization_projects%rowtype;i public.apostolic_island_catalog%rowtype;colony_id uuid;rr record;mult numeric;gain bigint;
begin
 if uid is null then raise exception'authentication required';end if;
 select*into p from public.apostolic_colonization_projects where owner_id=uid and status='active'and finishes_at<=clock_timestamp()order by finishes_at for update limit 1;
 if found then
  select*into i from public.apostolic_island_catalog where code=p.island_code;
  update public.apostolic_city_fleet set ready=ready+p.merchant_quantity,updated_at=clock_timestamp()where city_id=p.origin_city_id and vessel_code=p.merchant_code;
  if p.project_type='exploration'then
   insert into public.apostolic_island_discoveries(owner_id,island_code,report)values(uid,p.island_code,'A expedição cartografou '||i.name||' e confirmou terrenos para uma futura comunidade.')on conflict do nothing;
   insert into public.apostolic_colony_log(owner_id,event,details,idempotency_key)values(uid,'island_discovered',jsonb_build_object('island_code',p.island_code,'island_name',i.name),p.id);
  else
   perform pg_advisory_xact_lock(hashtextextended('apostolic-island:'||p.island_code,0));
   if(select count(*)from public.apostolic_colonies where island_code=p.island_code)>=i.settlement_capacity then raise exception'island capacity exhausted';end if;
   insert into public.apostolic_colonies(owner_id,island_code,name,terrain)values(uid,p.island_code,p.colony_name,p.terrain)returning id into colony_id;
   insert into public.apostolic_colony_resources(colony_id,resource,amount,base_production_per_hour)values
    (colony_id,'wheat',220,case when i.primary_resource='wheat'or p.terrain='fertile_plain'then 55 else 28 end),
    (colony_id,'cedar',180,case when i.primary_resource='cedar'or p.terrain='cedar_forest'then 42 else 22 end),
    (colony_id,'stone',160,case when i.primary_resource='stone'or p.terrain='quarry'then 38 else 18 end),
    (colony_id,'oil',100,case when i.primary_resource='oil'or p.terrain='olive_grove'then 30 else 12 end),
    (colony_id,'gold',120,case when i.primary_resource='gold'or p.terrain='harbor'then 24 else 10 end);
   insert into public.apostolic_colony_log(owner_id,colony_id,event,details,idempotency_key)values(uid,colony_id,'colony_founded',jsonb_build_object('island_code',p.island_code,'terrain',p.terrain,'name',p.colony_name),p.id);
  end if;
  update public.apostolic_colonization_projects set status='completed',completed_at=clock_timestamp()where id=p.id;
 end if;
 for rr in select cr.*,c.focus,c.terrain,i.primary_resource from public.apostolic_colony_resources cr join public.apostolic_colonies c on c.id=cr.colony_id join public.apostolic_island_catalog i on i.code=c.island_code where c.owner_id=uid for update of cr loop
  mult:=case when rr.focus='harvest'and rr.resource=rr.primary_resource then 1.30 when rr.focus='construction'and rr.resource in('cedar','stone')then 1.20 when rr.focus='mission'and rr.resource in('wheat','oil')then 1.15 when rr.focus='defense'and rr.resource='gold'then 1.10 else 1.00 end;
  gain:=least(rr.capacity-rr.amount,floor(extract(epoch from(clock_timestamp()-rr.last_collected_at))*rr.base_production_per_hour*mult/3600)::bigint);
  update public.apostolic_colony_resources set amount=amount+greatest(0,gain),last_collected_at=clock_timestamp(),updated_at=clock_timestamp()where colony_id=rr.colony_id and resource=rr.resource;
 end loop;
 return public.apostolic_get_colonization_center();
end;$$;

create or replace function public.apostolic_get_colonization_center()returns jsonb language sql stable security definer set search_path=''as $$
with capital as(select c.id,c.name,c.level,coalesce((select b.level from public.apostolic_city_buildings b where b.city_id=c.id and b.building='town_hall'),c.level)town_hall_level from public.apostolic_cities c where c.owner_id=(select auth.uid())order by c.created_at limit 1)
select case when not exists(select 1 from capital)then null else jsonb_build_object(
 'capital',(select to_jsonb(capital)from capital),
 'colony_limit',(select least(5,greatest(0,floor(town_hall_level/5.0)::integer))from capital),
 'colony_count',(select count(*)from public.apostolic_colonies where owner_id=(select auth.uid())),
 'islands',(select jsonb_agg(jsonb_build_object('code',i.code,'name',i.name,'description',i.description,'biome',i.biome,'primary_resource',i.primary_resource,'terrain_options',i.terrain_options,'distance_nm',i.distance_nm,'exploration_seconds',i.exploration_seconds,'foundation_seconds',i.foundation_seconds,'capacity',i.settlement_capacity,'occupied',(select count(*)from public.apostolic_colonies x where x.island_code=i.code),'town_hall_level',i.town_hall_level,'research_name',r.name,'research_unlocked',exists(select 1 from public.apostolic_city_research cr where cr.city_id=(select id from capital)and cr.research_code=i.required_research_code),'discovered',exists(select 1 from public.apostolic_island_discoveries d where d.owner_id=(select auth.uid())and d.island_code=i.code),'colonized',exists(select 1 from public.apostolic_colonies c where c.owner_id=(select auth.uid())and c.island_code=i.code),'exploration_costs',i.exploration_costs,'foundation_costs',i.foundation_costs,'visual_asset',i.visual_asset)order by i.sort_order)from public.apostolic_island_catalog i join public.apostolic_research_catalog r on r.code=i.required_research_code),
 'resources',(select jsonb_object_agg(resource,amount)from public.apostolic_city_resources where city_id=(select id from capital)),
 'merchant_fleet',(select coalesce(jsonb_agg(jsonb_build_object('code',v.code,'name',v.name,'ready',f.ready,'capacity',v.cargo_capacity)order by v.sort_order),'[]'::jsonb)from public.apostolic_city_fleet f join public.apostolic_vessel_catalog v on v.code=f.vessel_code where f.city_id=(select id from capital)and v.role='merchant'),
 'active_project',(select to_jsonb(a)from(select id,island_code,project_type,terrain,colony_name,merchant_code,merchant_quantity,started_at,finishes_at from public.apostolic_colonization_projects where owner_id=(select auth.uid())and status='active'limit 1)a),
 'colonies',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'island_code',c.island_code,'island_name',i.name,'terrain',c.terrain,'level',c.level,'population',c.population,'population_capacity',c.population_capacity,'satisfaction',c.satisfaction,'corruption',c.corruption,'governor_hall_level',c.governor_hall_level,'focus',c.focus,'last_focus_change',c.last_focus_change,'resources',(select jsonb_object_agg(cr.resource,jsonb_build_object('amount',cr.amount,'capacity',cr.capacity,'per_hour',cr.base_production_per_hour))from public.apostolic_colony_resources cr where cr.colony_id=c.id))order by c.founded_at),'[]'::jsonb)from public.apostolic_colonies c join public.apostolic_island_catalog i on i.code=c.island_code where c.owner_id=(select auth.uid())),
 'history',(select coalesce(jsonb_agg(to_jsonb(h)order by h.created_at desc),'[]'::jsonb)from(select event,details,created_at from public.apostolic_colony_log where owner_id=(select auth.uid())order by created_at desc limit 10)h)
)end$$;

create or replace function public.apostolic_start_island_exploration(p_island_code text,p_merchant_code text,p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;i public.apostolic_island_catalog%rowtype;v public.apostolic_vessel_catalog%rowtype;ready_count integer;rr record;cost bigint;balance bigint;
begin
 if uid is null then raise exception'authentication required';end if;if p_idempotency_key is null then raise exception'idempotency key required';end if;
 select id into cid from public.apostolic_cities where owner_id=uid order by created_at for update limit 1;if cid is null then raise exception'capital not found';end if;
 if exists(select 1 from public.apostolic_colonization_projects where owner_id=uid and idempotency_key=p_idempotency_key)then return public.apostolic_get_colonization_center();end if;
 perform public.apostolic_sync_colonization_center();
 if exists(select 1 from public.apostolic_colonization_projects where owner_id=uid and status='active')then raise exception'an expedition is already active';end if;
 if(select count(*)from public.apostolic_colonization_projects where owner_id=uid and project_type='exploration'and started_at>=clock_timestamp()-interval'24 hours')>=2 then raise exception'exploration limit reached';end if;
 select*into i from public.apostolic_island_catalog where code=p_island_code;if not found then raise exception'island unavailable';end if;
 if exists(select 1 from public.apostolic_island_discoveries where owner_id=uid and island_code=i.code)then raise exception'island already discovered';end if;
 if(select coalesce((select b.level from public.apostolic_city_buildings b where b.city_id=cid and b.building='town_hall'),0))<i.town_hall_level then raise exception'town hall level required';end if;
 if not exists(select 1 from public.apostolic_city_research where city_id=cid and research_code=i.required_research_code)then raise exception'research required: %',i.required_research_code;end if;
 select*into v from public.apostolic_vessel_catalog where code=p_merchant_code and role='merchant';if not found then raise exception'merchant vessel required';end if;
 select ready into ready_count from public.apostolic_city_fleet where city_id=cid and vessel_code=v.code for update;if coalesce(ready_count,0)<1 then raise exception'merchant fleet unavailable';end if;
 for rr in select key,value from jsonb_each_text(i.exploration_costs)loop cost:=rr.value::bigint;select amount into balance from public.apostolic_city_resources where city_id=cid and resource=rr.key for update;if coalesce(balance,0)<cost then raise exception'insufficient resource: %',rr.key;end if;end loop;
 for rr in select key,value from jsonb_each_text(i.exploration_costs)loop cost:=rr.value::bigint;update public.apostolic_city_resources set amount=amount-cost,updated_at=clock_timestamp()where city_id=cid and resource=rr.key;insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)select cid,rr.key,-cost,amount,'island_exploration:'||i.code,p_idempotency_key from public.apostolic_city_resources where city_id=cid and resource=rr.key;end loop;
 update public.apostolic_city_fleet set ready=ready-1,updated_at=clock_timestamp()where city_id=cid and vessel_code=v.code;
 insert into public.apostolic_colonization_projects(owner_id,origin_city_id,island_code,project_type,merchant_code,merchant_quantity,costs,finishes_at,idempotency_key)values(uid,cid,i.code,'exploration',v.code,1,i.exploration_costs,clock_timestamp()+make_interval(secs=>i.exploration_seconds),p_idempotency_key);
 return public.apostolic_get_colonization_center();
end;$$;

create or replace function public.apostolic_found_colony(p_island_code text,p_terrain text,p_name text,p_merchant_code text,p_merchant_quantity integer,p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;i public.apostolic_island_catalog%rowtype;v public.apostolic_vessel_catalog%rowtype;ready_count integer;town_level integer;colony_limit integer;rr record;cost bigint;balance bigint;clean_name text:=trim(p_name);
begin
 if uid is null then raise exception'authentication required';end if;if p_idempotency_key is null then raise exception'idempotency key required';end if;if length(clean_name)not between 3 and 32 then raise exception'invalid colony name';end if;if p_merchant_quantity not between 2 and 10 then raise exception'at least two merchant vessels required';end if;
 select id into cid from public.apostolic_cities where owner_id=uid order by created_at for update limit 1;if cid is null then raise exception'capital not found';end if;
 if exists(select 1 from public.apostolic_colonization_projects where owner_id=uid and idempotency_key=p_idempotency_key)then return public.apostolic_get_colonization_center();end if;
 perform public.apostolic_sync_colonization_center();if exists(select 1 from public.apostolic_colonization_projects where owner_id=uid and status='active')then raise exception'an expedition is already active';end if;
 select*into i from public.apostolic_island_catalog where code=p_island_code;if not found then raise exception'island unavailable';end if;
 if not exists(select 1 from public.apostolic_island_discoveries where owner_id=uid and island_code=i.code)then raise exception'explore island first';end if;
 if exists(select 1 from public.apostolic_colonies where owner_id=uid and island_code=i.code)then raise exception'island already colonized';end if;
 perform pg_advisory_xact_lock(hashtextextended('apostolic-island:'||i.code,0));
 if(select count(*)from public.apostolic_colonies where island_code=i.code)+(select count(*)from public.apostolic_colonization_projects where island_code=i.code and project_type='foundation'and status='active')>=i.settlement_capacity then raise exception'island capacity exhausted';end if;
 if p_terrain is null or not(p_terrain=any(i.terrain_options))then raise exception'invalid terrain';end if;
 select coalesce((select b.level from public.apostolic_city_buildings b where b.city_id=cid and b.building='town_hall'),0)into town_level;colony_limit:=least(5,greatest(0,floor(town_level/5.0)::integer));
 if(select count(*)from public.apostolic_colonies where owner_id=uid)>=colony_limit then raise exception'colony limit reached';end if;
 if not exists(select 1 from public.apostolic_city_research where city_id=cid and research_code='cargo_logistics')then raise exception'research required: cargo_logistics';end if;
 select*into v from public.apostolic_vessel_catalog where code=p_merchant_code and role='merchant';if not found then raise exception'merchant vessel required';end if;select ready into ready_count from public.apostolic_city_fleet where city_id=cid and vessel_code=v.code for update;if coalesce(ready_count,0)<p_merchant_quantity then raise exception'merchant fleet unavailable';end if;
 if v.cargo_capacity*p_merchant_quantity<(select coalesce(sum(value::bigint),0)from jsonb_each_text(i.foundation_costs))then raise exception'foundation cargo capacity exceeded';end if;
 for rr in select key,value from jsonb_each_text(i.foundation_costs)loop cost:=rr.value::bigint;select amount into balance from public.apostolic_city_resources where city_id=cid and resource=rr.key for update;if coalesce(balance,0)<cost then raise exception'insufficient resource: %',rr.key;end if;end loop;
 for rr in select key,value from jsonb_each_text(i.foundation_costs)loop cost:=rr.value::bigint;update public.apostolic_city_resources set amount=amount-cost,updated_at=clock_timestamp()where city_id=cid and resource=rr.key;insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)select cid,rr.key,-cost,amount,'colony_foundation:'||i.code,p_idempotency_key from public.apostolic_city_resources where city_id=cid and resource=rr.key;end loop;
 update public.apostolic_city_fleet set ready=ready-p_merchant_quantity,updated_at=clock_timestamp()where city_id=cid and vessel_code=v.code;
 insert into public.apostolic_colonization_projects(owner_id,origin_city_id,island_code,project_type,terrain,colony_name,merchant_code,merchant_quantity,costs,finishes_at,idempotency_key)values(uid,cid,i.code,'foundation',p_terrain,clean_name,v.code,p_merchant_quantity,i.foundation_costs,clock_timestamp()+make_interval(secs=>i.foundation_seconds),p_idempotency_key);
 return public.apostolic_get_colonization_center();
end;$$;

create or replace function public.apostolic_set_colony_focus(p_colony_id uuid,p_focus text,p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());c public.apostolic_colonies%rowtype;
begin
 if uid is null then raise exception'authentication required';end if;if p_idempotency_key is null then raise exception'idempotency key required';end if;if p_focus not in('balanced','harvest','construction','mission','defense')then raise exception'invalid colony focus';end if;
 perform public.apostolic_sync_colonization_center();select*into c from public.apostolic_colonies where id=p_colony_id and owner_id=uid for update;if not found then raise exception'colony not found';end if;
 if exists(select 1 from public.apostolic_colony_log where owner_id=uid and idempotency_key=p_idempotency_key and event='focus_changed')then return public.apostolic_get_colonization_center();end if;
 if c.last_focus_change>clock_timestamp()-interval'6 hours'then raise exception'focus change is on cooldown';end if;
 update public.apostolic_colonies set focus=p_focus,last_focus_change=clock_timestamp(),updated_at=clock_timestamp()where id=c.id;
 insert into public.apostolic_colony_log(owner_id,colony_id,event,details,idempotency_key)values(uid,c.id,'focus_changed',jsonb_build_object('from',c.focus,'to',p_focus),p_idempotency_key);
 return public.apostolic_get_colonization_center();
end;$$;

revoke all on function public.apostolic_get_colonization_center(),public.apostolic_sync_colonization_center(),public.apostolic_start_island_exploration(text,text,uuid),public.apostolic_found_colony(text,text,text,text,integer,uuid),public.apostolic_set_colony_focus(uuid,text,uuid)from public,anon,authenticated;
grant execute on function public.apostolic_get_colonization_center(),public.apostolic_sync_colonization_center(),public.apostolic_start_island_exploration(text,text,uuid),public.apostolic_found_colony(text,text,text,text,integer,uuid),public.apostolic_set_colony_focus(uuid,text,uuid)to authenticated;

commit;
