begin;

-- V186: cada construção passa a ter posição própria no mapa da sua cidade.
alter table public.apostolic_city_buildings
 add column map_x smallint,
 add column map_y smallint,
 add column map_rotation smallint not null default 0,
 add column footprint_w smallint not null default 10,
 add column footprint_h smallint not null default 8;

alter table public.apostolic_city_buildings
 add constraint apostolic_city_buildings_map_x_check check(map_x is null or map_x between 5 and 95),
 add constraint apostolic_city_buildings_map_y_check check(map_y is null or map_y between 8 and 92),
 add constraint apostolic_city_buildings_rotation_check check(map_rotation in(0,1,2,3)),
 add constraint apostolic_city_buildings_footprint_check check(footprint_w between 4 and 24 and footprint_h between 4 and 20);

update public.apostolic_city_buildings b set
 map_x=coalesce((select s.x from public.apostolic_city_slot_catalog s where s.slot_no=b.slot_no),50),
 map_y=coalesce((select s.y from public.apostolic_city_slot_catalog s where s.slot_no=b.slot_no),49),
 footprint_w=case b.building when'town_hall'then 16 when'market'then 14 when'shipyard'then 16 when'wall'then 18 else 10 end,
 footprint_h=case b.building when'town_hall'then 12 when'market'then 10 when'shipyard'then 12 when'wall'then 7 else 8 end;

alter table public.apostolic_city_buildings alter column map_x set not null,alter column map_y set not null;
create index apostolic_city_buildings_map_idx on public.apostolic_city_buildings(city_id,map_y,map_x);

-- V187: novas obras recebem automaticamente a coordenada inicial do terreno escolhido.
create or replace function public.apostolic_set_initial_building_placement()returns trigger
language plpgsql security invoker set search_path=''as $$
declare sx smallint;sy smallint;
begin
 if new.map_x is null or new.map_y is null then
  select x,y into sx,sy from public.apostolic_city_slot_catalog where slot_no=new.slot_no;
  new.map_x:=coalesce(sx,50);new.map_y:=coalesce(sy,49);
 end if;
 new.footprint_w:=case new.building when'town_hall'then 16 when'market'then 14 when'shipyard'then 16 when'wall'then 18 else 10 end;
 new.footprint_h:=case new.building when'town_hall'then 12 when'market'then 10 when'shipyard'then 12 when'wall'then 7 else 8 end;
 return new;
end;$$;
create trigger apostolic_city_building_initial_placement before insert on public.apostolic_city_buildings for each row execute function public.apostolic_set_initial_building_placement();

-- V188-V189: movimentação atômica, autenticada, com terreno e colisão validados no servidor.
create or replace function public.apostolic_move_city_building(p_building text,p_x integer,p_y integer,p_rotation integer default 0)returns jsonb
language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;target public.apostolic_city_buildings%rowtype;target_terrain text;
begin
 if uid is null then raise exception'authentication required';end if;
 if p_x not between 5 and 95 or p_y not between 8 and 92 then raise exception'position outside city bounds';end if;
 if p_rotation not in(0,1,2,3)then raise exception'invalid rotation';end if;
 select c.id into cid from public.apostolic_cities c where c.owner_id=uid for update;
 if cid is null then raise exception'city not found';end if;
 select*into target from public.apostolic_city_buildings where city_id=cid and building=p_building for update;
 if not found then raise exception'building not found';end if;
 select cat.terrain into target_terrain from public.apostolic_building_catalog cat where cat.building=p_building;
 if target_terrain='coast'and p_y<68 then raise exception'coastal building requires coast';end if;
 if target_terrain<>'coast'and p_y>78 then raise exception'land building cannot enter the sea';end if;
 if exists(select 1 from public.apostolic_city_buildings other where other.city_id=cid and other.building<>target.building
  and abs(other.map_x-p_x)*2<(other.footprint_w+target.footprint_w)
  and abs(other.map_y-p_y)*2<(other.footprint_h+target.footprint_h))then raise exception'building collision';end if;
 update public.apostolic_city_buildings set map_x=p_x,map_y=p_y,map_rotation=p_rotation,updated_at=clock_timestamp()
 where city_id=cid and building=target.building;
 return public.apostolic_get_city_management();
end;$$;

-- V190: o painel recebe a posição persistente, rotação e footprint de cada edifício.
create or replace function public.apostolic_get_city_management()returns jsonb
language sql stable security definer set search_path=''as $$
with own as(select c.*,b.level town_level from public.apostolic_cities c join public.apostolic_city_buildings b on b.city_id=c.id and b.building='town_hall'where c.owner_id=(select auth.uid()))
select coalesce((select jsonb_build_object(
 'server_now',clock_timestamp(),
 'city',jsonb_build_object('id',o.id,'name',o.name,'town_hall_level',o.town_level,'population',o.population,'capacity',60+o.town_level*40,'satisfaction',o.satisfaction,'visual_phase',case when o.town_level<=3 then 1 when o.town_level<=9 then 2 when o.town_level<=15 then 3 when o.town_level<=24 then 4 else 5 end),
 'resources',(select coalesce(jsonb_object_agg(cr.resource,jsonb_build_object('amount',cr.amount,'capacity',cr.capacity,'per_hour',cr.production_per_hour+case when cr.resource='gold'then floor(o.population*.25)::integer else 0 end,'last_synced_at',cr.last_collected_at)),'{}'::jsonb)from public.apostolic_city_resources cr where cr.city_id=o.id),
 'gold',(select jsonb_build_object('amount',amount,'per_hour',production_per_hour+floor(o.population*.25))from public.apostolic_city_resources where city_id=o.id and resource='gold'),
 'slots',(select jsonb_agg(jsonb_build_object('slot',s.slot_no,'terrain',s.terrain,'x',coalesce(b.map_x,s.x),'y',coalesce(b.map_y,s.y),'rotation',coalesce(b.map_rotation,0),'footprint_w',coalesce(b.footprint_w,10),'footprint_h',coalesce(b.footprint_h,8),'unlock_level',s.unlock_town_hall_level,'unlocked',o.town_level>=s.unlock_town_hall_level,'building',b.building,'building_level',b.level,'state',b.state,
  'next_costs',case when b.building is null then null else(select coalesce(jsonb_object_agg(e.key,ceil((e.value::text)::numeric*power(cat.cost_growth,greatest(b.level,1)-1))::bigint),'{}'::jsonb)from public.apostolic_building_catalog cat cross join lateral jsonb_each(cat.base_costs)e where cat.building=b.building)end,
  'next_duration_seconds',case when b.building is null then null else(select ceil(cat.base_duration_seconds*power(cat.duration_growth,greatest(b.level,1)-1))::integer from public.apostolic_building_catalog cat where cat.building=b.building)end,
  'options',(select coalesce(jsonb_agg(jsonb_build_object('building',cat.building,'name',cat.name,'description',cat.description,'costs',cat.base_costs,'duration_seconds',cat.base_duration_seconds,'required_level',cat.required_town_hall_level)order by cat.sort_order),'[]'::jsonb)from public.apostolic_building_catalog cat where cat.terrain=s.terrain and cat.required_town_hall_level<=o.town_level and not exists(select 1 from public.apostolic_city_buildings used where used.city_id=o.id and used.building=cat.building)))order by s.slot_no)
  from public.apostolic_city_slot_catalog s left join public.apostolic_city_buildings b on b.city_id=o.id and b.slot_no=s.slot_no),
 'queue',(select to_jsonb(q)from(select id,building,from_level,to_level,slot_no,costs,started_at,finishes_at from public.apostolic_construction_queue where city_id=o.id and status='building'limit 1)q)
 )from own o),'null'::jsonb)$$;

revoke all on function public.apostolic_move_city_building(text,integer,integer,integer)from public,anon,authenticated;
grant execute on function public.apostolic_move_city_building(text,integer,integer,integer)to authenticated;
revoke all on function public.apostolic_set_initial_building_placement()from public,anon,authenticated;
revoke all on function public.apostolic_get_city_management()from public,anon,authenticated;
grant execute on function public.apostolic_get_city_management()to authenticated;

commit;
