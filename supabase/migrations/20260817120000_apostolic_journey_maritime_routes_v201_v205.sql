begin;

-- V201: rotas próprias da Jornada, com distância, risco e pesquisa conectada.
create table public.apostolic_maritime_route_catalog(
 code text primary key,
 name text not null unique,
 description text not null,
 distance_nm integer not null check(distance_nm between 10 and 5000),
 risk_percent smallint not null check(risk_percent between 0 and 80),
 duration_seconds integer not null check(duration_seconds between 300 and 604800),
 gold_per_unit numeric(6,2) not null check(gold_per_unit between 0.1 and 10),
 required_research_code text not null references public.apostolic_research_catalog(code),
 sort_order smallint not null unique
);
insert into public.apostolic_maritime_route_catalog values
 ('patmos_harbor','Porto de Patmos','Rota curta de abastecimento e comunhão entre pequenas ilhas.',90,8,900,0.72,'navigation_basics',1),
 ('cyprus_harbor','Enseada de Chipre','Mercadores experientes procuram azeite, pedra e madeira de cedro.',240,18,1800,0.94,'merchant_hulls',2),
 ('antioch_coast','Costa de Antioquia','Grande entreposto para cargas organizadas e viagens missionárias.',520,28,3600,1.18,'cargo_logistics',3),
 ('malta_refuge','Refúgio de Malta','Travessia longa e arriscada, protegida por uma escolta preparada.',940,42,7200,1.52,'naval_defense',4);

-- V202: cada viagem reserva navios reais e uma carga limitada pela frota.
create table public.apostolic_maritime_voyages(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 city_id uuid not null references public.apostolic_cities(id) on delete cascade,
 route_code text not null references public.apostolic_maritime_route_catalog(code),
 cargo_resource text not null check(cargo_resource in('wheat','cedar','stone','oil')),
 cargo_quantity integer not null check(cargo_quantity between 10 and 1000000),
 cargo_delivered integer check(cargo_delivered is null or cargo_delivered>=0),
 merchant_code text not null references public.apostolic_vessel_catalog(code),
 merchant_quantity smallint not null check(merchant_quantity between 1 and 20),
 escort_code text references public.apostolic_vessel_catalog(code),
 escort_quantity smallint not null default 0 check(escort_quantity between 0 and 20),
 cargo_capacity integer not null check(cargo_capacity>0),
 escort_power integer not null default 0 check(escort_power>=0),
 loss_percent smallint check(loss_percent is null or loss_percent between 0 and 80),
 gold_reward bigint check(gold_reward is null or gold_reward>=0),
 status text not null default'sailing' check(status in('sailing','completed','cancelled')),
 departed_at timestamptz not null default clock_timestamp(),
 arrives_at timestamptz not null,
 completed_at timestamptz,
 idempotency_key uuid not null,
 unique(city_id,idempotency_key)
);
create unique index apostolic_maritime_one_active_idx on public.apostolic_maritime_voyages(city_id)where status='sailing';
create index apostolic_maritime_due_idx on public.apostolic_maritime_voyages(arrives_at,city_id)where status='sailing';
create index apostolic_maritime_history_idx on public.apostolic_maritime_voyages(owner_id,departed_at desc);

-- V203: relatório imutável registra proteção, perdas e retorno comercial.
create table public.apostolic_maritime_reports(
 id bigint generated always as identity primary key,
 voyage_id uuid not null unique references public.apostolic_maritime_voyages(id) on delete cascade,
 owner_id uuid not null references public.profiles(id) on delete cascade,
 route_name text not null,
 outcome text not null check(outcome in('safe_arrival','partial_loss')),
 cargo_resource text not null,
 cargo_sent integer not null check(cargo_sent>0),
 cargo_delivered integer not null check(cargo_delivered>=0),
 loss_percent smallint not null check(loss_percent between 0 and 80),
 escort_power integer not null check(escort_power>=0),
 gold_reward bigint not null check(gold_reward>=0),
 summary text not null,
 created_at timestamptz not null default clock_timestamp()
);
create index apostolic_maritime_reports_owner_idx on public.apostolic_maritime_reports(owner_id,created_at desc);

alter table public.apostolic_maritime_route_catalog enable row level security;
alter table public.apostolic_maritime_route_catalog force row level security;
alter table public.apostolic_maritime_voyages enable row level security;
alter table public.apostolic_maritime_voyages force row level security;
alter table public.apostolic_maritime_reports enable row level security;
alter table public.apostolic_maritime_reports force row level security;
revoke all on public.apostolic_maritime_route_catalog,public.apostolic_maritime_voyages,public.apostolic_maritime_reports from anon,authenticated;

-- V204: liquidação lazy devolve a frota, aplica proteção e credita somente ouro comum.
create or replace function public.apostolic_get_maritime_center()returns jsonb language sql stable security definer set search_path=''as $$select null::jsonb$$;
create or replace function public.apostolic_sync_maritime_center()returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;v public.apostolic_maritime_voyages%rowtype;r public.apostolic_maritime_route_catalog%rowtype;effective_loss integer;delivered integer;reward bigint;gold_before bigint;gold_gain bigint;
begin
 if uid is null then raise exception'authentication required';end if;
 select id into cid from public.apostolic_cities where owner_id=uid for update;
 if cid is null then return null;end if;
 select*into v from public.apostolic_maritime_voyages where city_id=cid and status='sailing'and arrives_at<=clock_timestamp()order by arrives_at for update limit 1;
 if found then
  select*into r from public.apostolic_maritime_route_catalog where code=v.route_code;
  effective_loss:=greatest(0,r.risk_percent-least(r.risk_percent,v.escort_power/10));
  delivered:=floor(v.cargo_quantity*(100-effective_loss)/100.0);
  reward:=floor(delivered*r.gold_per_unit);
  update public.apostolic_city_fleet set ready=ready+v.merchant_quantity,updated_at=clock_timestamp()where city_id=cid and vessel_code=v.merchant_code;
  if v.escort_code is not null and v.escort_quantity>0 then update public.apostolic_city_fleet set ready=ready+v.escort_quantity,updated_at=clock_timestamp()where city_id=cid and vessel_code=v.escort_code;end if;
  select amount into gold_before from public.apostolic_city_resources where city_id=cid and resource='gold'for update;
  select least(reward,capacity-amount)into gold_gain from public.apostolic_city_resources where city_id=cid and resource='gold';
  update public.apostolic_city_resources set amount=amount+gold_gain,updated_at=clock_timestamp()where city_id=cid and resource='gold';
  insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)values(cid,'gold',gold_gain,gold_before+gold_gain,'maritime_trade:'||v.route_code,v.id);
  update public.apostolic_maritime_voyages set cargo_delivered=delivered,loss_percent=effective_loss,gold_reward=gold_gain,status='completed',completed_at=clock_timestamp()where id=v.id;
  insert into public.apostolic_maritime_reports(voyage_id,owner_id,route_name,outcome,cargo_resource,cargo_sent,cargo_delivered,loss_percent,escort_power,gold_reward,summary)values(v.id,uid,r.name,case when effective_loss=0 then'safe_arrival'else'partial_loss'end,v.cargo_resource,v.cargo_quantity,delivered,effective_loss,v.escort_power,gold_gain,case when effective_loss=0 then'A escolta protegeu toda a carga.'else'Parte da carga foi perdida durante a travessia.'end);
 end if;
 return public.apostolic_get_maritime_center();
end;$$;

-- V205: centro marítimo e partida atômica, idempotente e com limite antiabuso.
create or replace function public.apostolic_get_maritime_center()returns jsonb language sql stable security definer set search_path=''as $$
with own as(select id from public.apostolic_cities where owner_id=(select auth.uid()))
select case when not exists(select 1 from own)then null else jsonb_build_object(
 'routes',(select jsonb_agg(jsonb_build_object('code',r.code,'name',r.name,'description',r.description,'distance_nm',r.distance_nm,'risk_percent',r.risk_percent,'duration_seconds',r.duration_seconds,'gold_per_unit',r.gold_per_unit,'research_name',x.name,'research_unlocked',exists(select 1 from public.apostolic_city_research cr where cr.city_id=(select id from own)and cr.research_code=r.required_research_code))order by r.sort_order)from public.apostolic_maritime_route_catalog r join public.apostolic_research_catalog x on x.code=r.required_research_code),
 'resources',(select jsonb_object_agg(resource,amount)from public.apostolic_city_resources where city_id=(select id from own)),
 'fleet',(select jsonb_agg(jsonb_build_object('code',v.code,'name',v.name,'role',v.role,'ready',f.ready,'cargo_capacity',v.cargo_capacity,'escort_power',v.attack+v.defense)order by v.sort_order)from public.apostolic_city_fleet f join public.apostolic_vessel_catalog v on v.code=f.vessel_code where f.city_id=(select id from own)),
 'active',(select to_jsonb(a)from(select id,route_code,cargo_resource,cargo_quantity,merchant_code,merchant_quantity,escort_code,escort_quantity,cargo_capacity,escort_power,departed_at,arrives_at from public.apostolic_maritime_voyages where city_id=(select id from own)and status='sailing'limit 1)a),
 'departures_today',(select count(*)from public.apostolic_maritime_voyages where city_id=(select id from own)and departed_at>=date_trunc('day',clock_timestamp())),
 'daily_limit',4,
 'reports',(select coalesce(jsonb_agg(to_jsonb(h)order by h.created_at desc),'[]'::jsonb)from(select route_name,outcome,cargo_resource,cargo_sent,cargo_delivered,loss_percent,escort_power,gold_reward,summary,created_at from public.apostolic_maritime_reports where owner_id=(select auth.uid())order by created_at desc limit 8)h)
)end$$;

create or replace function public.apostolic_start_maritime_voyage(p_route_code text,p_resource text,p_quantity integer,p_merchant_code text,p_merchant_quantity integer,p_escort_code text,p_escort_quantity integer,p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;r public.apostolic_maritime_route_catalog%rowtype;m public.apostolic_vessel_catalog%rowtype;e public.apostolic_vessel_catalog%rowtype;available integer;capacity integer;power integer:=0;balance bigint;
begin
 if uid is null then raise exception'authentication required';end if;
 if p_idempotency_key is null then raise exception'idempotency key required';end if;
 if p_resource not in('wheat','cedar','stone','oil')or p_quantity not between 10 and 1000000 then raise exception'invalid cargo';end if;
 if p_merchant_quantity not between 1 and 20 or coalesce(p_escort_quantity,0)not between 0 and 20 then raise exception'invalid fleet quantity';end if;
 select id into cid from public.apostolic_cities where owner_id=uid for update;
 if cid is null then raise exception'city not found';end if;
 if exists(select 1 from public.apostolic_maritime_voyages where city_id=cid and idempotency_key=p_idempotency_key)then return public.apostolic_get_maritime_center();end if;
 perform public.apostolic_sync_maritime_center();
 if exists(select 1 from public.apostolic_maritime_voyages where city_id=cid and status='sailing')then raise exception'a convoy is already sailing';end if;
 if(select count(*)from public.apostolic_maritime_voyages where city_id=cid and departed_at>=date_trunc('day',clock_timestamp()))>=4 then raise exception'daily voyage limit reached';end if;
 select*into r from public.apostolic_maritime_route_catalog where code=p_route_code;if not found then raise exception'route unavailable';end if;
 if not exists(select 1 from public.apostolic_city_research where city_id=cid and research_code=r.required_research_code)then raise exception'research required: %',r.required_research_code;end if;
 select*into m from public.apostolic_vessel_catalog where code=p_merchant_code and role='merchant';if not found then raise exception'merchant vessel required';end if;
 select ready into available from public.apostolic_city_fleet where city_id=cid and vessel_code=m.code for update;if coalesce(available,0)<p_merchant_quantity then raise exception'merchant fleet unavailable';end if;
 capacity:=m.cargo_capacity*p_merchant_quantity;if p_quantity>capacity then raise exception'cargo capacity exceeded';end if;
 if coalesce(p_escort_quantity,0)>0 then
  select*into e from public.apostolic_vessel_catalog where code=p_escort_code and role='defense';if not found then raise exception'defense escort required';end if;
  select ready into available from public.apostolic_city_fleet where city_id=cid and vessel_code=e.code for update;if coalesce(available,0)<p_escort_quantity then raise exception'escort unavailable';end if;
  power:=(e.attack+e.defense)*p_escort_quantity;
 end if;
 select amount into balance from public.apostolic_city_resources where city_id=cid and resource=p_resource for update;if coalesce(balance,0)<p_quantity then raise exception'insufficient cargo resource';end if;
 update public.apostolic_city_resources set amount=amount-p_quantity,updated_at=clock_timestamp()where city_id=cid and resource=p_resource;
 insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)values(cid,p_resource,-p_quantity,balance-p_quantity,'maritime_cargo:'||r.code,p_idempotency_key);
 update public.apostolic_city_fleet set ready=ready-p_merchant_quantity,updated_at=clock_timestamp()where city_id=cid and vessel_code=m.code;
 if coalesce(p_escort_quantity,0)>0 then update public.apostolic_city_fleet set ready=ready-p_escort_quantity,updated_at=clock_timestamp()where city_id=cid and vessel_code=e.code;end if;
 insert into public.apostolic_maritime_voyages(owner_id,city_id,route_code,cargo_resource,cargo_quantity,merchant_code,merchant_quantity,escort_code,escort_quantity,cargo_capacity,escort_power,arrives_at,idempotency_key)values(uid,cid,r.code,p_resource,p_quantity,m.code,p_merchant_quantity,case when p_escort_quantity>0 then e.code end,coalesce(p_escort_quantity,0),capacity,power,clock_timestamp()+make_interval(secs=>r.duration_seconds),p_idempotency_key);
 return public.apostolic_get_maritime_center();
end;$$;

revoke all on function public.apostolic_get_maritime_center(),public.apostolic_sync_maritime_center(),public.apostolic_start_maritime_voyage(text,text,integer,text,integer,text,integer,uuid)from public,anon,authenticated;
grant execute on function public.apostolic_get_maritime_center(),public.apostolic_sync_maritime_center(),public.apostolic_start_maritime_voyage(text,text,integer,text,integer,text,integer,uuid)to authenticated;

commit;
