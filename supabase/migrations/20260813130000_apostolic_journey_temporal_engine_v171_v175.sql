begin;

-- V171: buscas da fila temporal permanecem rápidas mesmo com histórico extenso.
create index if not exists apostolic_construction_due_idx
 on public.apostolic_construction_queue(finishes_at,city_id)
 where status='building';

-- V172-V174: produção lazy, população e conclusão de obra numa única transação.
create or replace function public.apostolic_sync_city_state()returns jsonb
language plpgsql security definer set search_path=''as $$
declare
 uid uuid:=(select auth.uid());cid uuid;now_at timestamptz:=clock_timestamp();elapsed numeric;
 pop integer;cap integer;sat integer;town_level integer;r record;gain bigint;rate integer;
 q public.apostolic_construction_queue%rowtype;bonus integer;
begin
 if uid is null then raise exception'authentication required';end if;
 select c.id,c.population,c.satisfaction,extract(epoch from(now_at-c.population_updated_at))/3600.0,b.level
 into cid,pop,sat,elapsed,town_level
 from public.apostolic_cities c join public.apostolic_city_buildings b on b.city_id=c.id and b.building='town_hall'
 where c.owner_id=uid for update of c;
 if cid is null then return null;end if;
 cap:=60+town_level*40;
 pop:=least(cap,greatest(0,pop+floor(elapsed*greatest(0,sat-50)/25.0)::integer));
 update public.apostolic_cities set population=pop,population_updated_at=now_at,updated_at=now_at where id=cid;
 for r in select*from public.apostolic_city_resources where city_id=cid for update loop
  rate:=r.production_per_hour+case when r.resource='gold'then floor(pop*.25)::integer else 0 end;
  gain:=greatest(0,least(r.capacity-r.amount,floor(extract(epoch from(now_at-r.last_collected_at))*rate/3600)::bigint));
  update public.apostolic_city_resources set amount=amount+gain,last_collected_at=now_at,updated_at=now_at
  where city_id=cid and resource=r.resource;
 end loop;
 select*into q from public.apostolic_construction_queue
 where city_id=cid and status='building'and finishes_at<=now_at order by finishes_at for update limit 1;
 if found then
  update public.apostolic_city_buildings set level=q.to_level,state='ready',finishes_at=null,updated_at=now_at
  where city_id=cid and building=q.building;
  update public.apostolic_construction_queue set status='completed',completed_at=now_at where id=q.id;
  if q.building='warehouse'then
   update public.apostolic_cities set warehouse_level=q.to_level,updated_at=now_at where id=cid;
   update public.apostolic_city_resources set capacity=1000+(q.to_level-1)*500,updated_at=now_at where city_id=cid;
  elsif q.building='town_hall'then
   update public.apostolic_cities set level=q.to_level,updated_at=now_at where id=cid;
  elsif q.building='tavern'then
   update public.apostolic_cities set satisfaction=least(1000,satisfaction+15),updated_at=now_at where id=cid;
  elsif q.building='museum'then
   update public.apostolic_cities set satisfaction=least(1000,satisfaction+25),updated_at=now_at where id=cid;
  else
   bonus:=case q.building when'farm'then 30 when'lumberyard'then 20 when'quarry'then 20 when'olive_press'then 12 else 0 end;
   if bonus>0 then update public.apostolic_city_resources
    set production_per_hour=production_per_hour+bonus,updated_at=now_at where city_id=cid
    and resource=case q.building when'farm'then'wheat'when'lumberyard'then'cedar'when'quarry'then'stone'else'oil'end;
   end if;
  end if;
 end if;
 return public.apostolic_get_city_management();
end;$$;

-- V175: o cliente recebe relógio autoritativo, todos os recursos e próxima melhoria.
create or replace function public.apostolic_get_city_management()returns jsonb
language sql stable security definer set search_path=''as $$
with own as(select c.*,b.level town_level from public.apostolic_cities c join public.apostolic_city_buildings b on b.city_id=c.id and b.building='town_hall'where c.owner_id=(select auth.uid()))
select coalesce((select jsonb_build_object(
 'server_now',clock_timestamp(),
 'city',jsonb_build_object('id',o.id,'name',o.name,'town_hall_level',o.town_level,'population',o.population,'capacity',60+o.town_level*40,'satisfaction',o.satisfaction,'visual_phase',case when o.town_level<=3 then 1 when o.town_level<=9 then 2 when o.town_level<=15 then 3 when o.town_level<=24 then 4 else 5 end),
 'resources',(select coalesce(jsonb_object_agg(cr.resource,jsonb_build_object('amount',cr.amount,'capacity',cr.capacity,'per_hour',cr.production_per_hour+case when cr.resource='gold'then floor(o.population*.25)::integer else 0 end,'last_synced_at',cr.last_collected_at)),'{}'::jsonb)from public.apostolic_city_resources cr where cr.city_id=o.id),
 'gold',(select jsonb_build_object('amount',amount,'per_hour',production_per_hour+floor(o.population*.25))from public.apostolic_city_resources where city_id=o.id and resource='gold'),
 'slots',(select jsonb_agg(jsonb_build_object('slot',s.slot_no,'terrain',s.terrain,'x',s.x,'y',s.y,'unlock_level',s.unlock_town_hall_level,'unlocked',o.town_level>=s.unlock_town_hall_level,'building',b.building,'building_level',b.level,'state',b.state,
  'next_costs',case when b.building is null then null else(select coalesce(jsonb_object_agg(e.key,ceil((e.value::text)::numeric*power(cat.cost_growth,greatest(b.level,1)-1))::bigint),'{}'::jsonb)from public.apostolic_building_catalog cat cross join lateral jsonb_each(cat.base_costs)e where cat.building=b.building)end,
  'next_duration_seconds',case when b.building is null then null else(select ceil(cat.base_duration_seconds*power(cat.duration_growth,greatest(b.level,1)-1))::integer from public.apostolic_building_catalog cat where cat.building=b.building)end,
  'options',(select coalesce(jsonb_agg(jsonb_build_object('building',cat.building,'name',cat.name,'description',cat.description,'costs',cat.base_costs,'duration_seconds',cat.base_duration_seconds,'required_level',cat.required_town_hall_level)order by cat.sort_order),'[]'::jsonb)from public.apostolic_building_catalog cat where cat.terrain=s.terrain and cat.required_town_hall_level<=o.town_level and not exists(select 1 from public.apostolic_city_buildings used where used.city_id=o.id and used.building=cat.building)))order by s.slot_no)
  from public.apostolic_city_slot_catalog s left join public.apostolic_city_buildings b on b.city_id=o.id and b.slot_no=s.slot_no),
 'queue',(select to_jsonb(q)from(select id,building,from_level,to_level,slot_no,costs,started_at,finishes_at from public.apostolic_construction_queue where city_id=o.id and status='building'limit 1)q)
 )from own o),'null'::jsonb)$$;

revoke all on function public.apostolic_sync_city_state(),public.apostolic_get_city_management()from public,anon,authenticated;
grant execute on function public.apostolic_sync_city_state(),public.apostolic_get_city_management()to authenticated;
commit;
