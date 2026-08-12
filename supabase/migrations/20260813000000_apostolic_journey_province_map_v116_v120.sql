begin;

-- V116: disposição oficial e imutável dos 16 lotes de cada província.
create table public.apostolic_province_slot_layout(
 slot_no smallint primary key check(slot_no between 1 and 16),x_percent numeric(5,2)not null check(x_percent between 5 and 95),y_percent numeric(5,2)not null check(y_percent between 8 and 92),terrain text not null check(terrain in('plain','river','hill','forest'))
);
insert into public.apostolic_province_slot_layout values
(1,16,20,'hill'),(2,36,14,'forest'),(3,61,16,'plain'),(4,83,24,'hill'),
(5,10,43,'plain'),(6,31,38,'river'),(7,69,38,'river'),(8,90,45,'forest'),
(9,15,70,'forest'),(10,36,63,'plain'),(11,64,64,'plain'),(12,85,71,'hill'),
(13,25,88,'hill'),(14,45,82,'river'),(15,59,84,'river'),(16,75,89,'forest');

-- V117/V119: estado e contribuição compartilhada da capital da Aliança.
create table public.apostolic_province_capital_state(
 province_id uuid primary key references public.apostolic_provinces(id)on delete cascade,
 alliance_id uuid not null references public.arena_alliances(id)on delete cascade,
 progress integer not null default 0 check(progress>=0),established_by uuid not null references public.profiles(id)on delete restrict,
 established_at timestamptz not null default clock_timestamp(),updated_at timestamptz not null default clock_timestamp()
);
create table public.apostolic_province_capital_contributions(
 id bigint generated always as identity primary key,province_id uuid not null references public.apostolic_provinces(id)on delete cascade,
 alliance_id uuid not null references public.arena_alliances(id)on delete cascade,contributor_id uuid not null references public.profiles(id)on delete cascade,
 resource text not null check(resource in('wheat','cedar','stone','oil','gold')),quantity integer not null check(quantity between 10 and 10000),
 points integer not null check(points>0),idempotency_key uuid not null,created_at timestamptz not null default clock_timestamp(),unique(contributor_id,idempotency_key)
);
create index apostolic_capital_contributions_idx on public.apostolic_province_capital_contributions(province_id,created_at desc);

alter table public.apostolic_province_slot_layout enable row level security;
alter table public.apostolic_province_capital_state enable row level security;
alter table public.apostolic_province_capital_contributions enable row level security;
create policy apostolic_slot_layout_read on public.apostolic_province_slot_layout for select to authenticated using(true);
create policy apostolic_capital_state_read on public.apostolic_province_capital_state for select to authenticated using(true);
create policy apostolic_capital_contributions_alliance on public.apostolic_province_capital_contributions for select to authenticated using(exists(select 1 from public.arena_alliance_members m where m.alliance_id=apostolic_province_capital_contributions.alliance_id and m.user_id=(select auth.uid())));
revoke all on public.apostolic_province_slot_layout,public.apostolic_province_capital_state,public.apostolic_province_capital_contributions from anon,authenticated;
grant select on public.apostolic_province_slot_layout,public.apostolic_province_capital_state,public.apostolic_province_capital_contributions to authenticated;

-- V118: mapa agrega cidades, Alianças, capital e rotas ativas sem expor dados privados.
create or replace function public.apostolic_get_province_map()returns jsonb language sql stable security definer set search_path=''as $$
with own as(select c.id,c.province_id,c.owner_id from public.apostolic_cities c where c.owner_id=(select auth.uid())),membership as(select alliance_id,role from public.arena_alliance_members where user_id=(select auth.uid()))
select coalesce((select jsonb_build_object(
 'province',jsonb_build_object('id',p.id,'name',p.name,'cities',p.city_count,'capacity',p.capacity),
 'region',jsonb_build_object('name',r.name,'biome',r.biome),
 'capital',jsonb_build_object('level',p.capital_level,'alliance_id',p.capital_alliance_id,'alliance_name',a.name,'alliance_tag',a.tag,'progress',coalesce(cs.progress,0),'next_level_points',p.capital_level*500),
 'my_alliance',jsonb_build_object('id',m.alliance_id,'role',m.role,'can_establish',p.capital_alliance_id is null and m.role in('founder','elder')),
 'slots',(select jsonb_agg(jsonb_build_object('slot',l.slot_no,'x',l.x_percent,'y',l.y_percent,'terrain',l.terrain,'city_id',c.id,'city_name',c.name,'city_level',c.level,'mine',c.owner_id=(select auth.uid()),'alliance_tag',ca.tag)order by l.slot_no)from public.apostolic_province_slot_layout l left join public.apostolic_cities c on c.province_id=p.id and c.slot_no=l.slot_no left join public.arena_alliance_members cm on cm.user_id=c.owner_id left join public.arena_alliances ca on ca.id=cm.alliance_id),
 'routes',(select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'from_slot',oc.slot_no,'to_slot',dc.slot_no,'resource',v.resource,'arrives_at',v.arrives_at,'mine',oc.owner_id=(select auth.uid())or dc.owner_id=(select auth.uid()))),'[]'::jsonb)from public.apostolic_caravans v join public.apostolic_cities oc on oc.id=v.origin_city_id join public.apostolic_cities dc on dc.id=v.destination_city_id where v.status='travelling'and oc.province_id=p.id and dc.province_id=p.id)
)from own o join public.apostolic_provinces p on p.id=o.province_id join public.apostolic_world_regions r on r.id=p.region_id left join public.apostolic_province_capital_state cs on cs.province_id=p.id left join public.arena_alliances a on a.id=p.capital_alliance_id left join membership m on true),'null'::jsonb)
$$;

create or replace function public.apostolic_establish_province_capital()returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;pid uuid;aid uuid;member_role text;
begin
 if uid is null then raise exception'authentication required';end if;select id,province_id into cid,pid from public.apostolic_cities where owner_id=uid;
 select alliance_id,role into aid,member_role from public.arena_alliance_members where user_id=uid;
 if cid is null or aid is null or member_role not in('founder','elder')then raise exception'alliance leadership required';end if;
 perform pg_advisory_xact_lock(hashtextextended(pid::text,0));
 update public.apostolic_provinces set capital_alliance_id=aid where id=pid and capital_alliance_id is null;
 if not found and not exists(select 1 from public.apostolic_provinces where id=pid and capital_alliance_id=aid)then raise exception'province already has a capital alliance';end if;
 insert into public.apostolic_province_capital_state(province_id,alliance_id,established_by)values(pid,aid,uid)on conflict(province_id)do nothing;
 insert into public.arena_alliance_activities(alliance_id,actor_id,kind,message)values(aid,uid,'system','A Aliança estabeleceu a capital provincial.');return public.apostolic_get_province_map();
end;$$;

-- V120: contribuições orgânicas elevam a capital; nenhuma gema ou aceleração paga.
create or replace function public.apostolic_contribute_province_capital(p_resource text,p_quantity integer,p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;pid uuid;aid uuid;bal bigint;pts integer;st public.apostolic_province_capital_state%rowtype;lvl integer;threshold integer;
begin
 if uid is null or p_idempotency_key is null then raise exception'authentication required';end if;if p_resource not in('wheat','cedar','stone','oil','gold')or p_quantity not between 10 and 10000 then raise exception'invalid contribution';end if;
 select id,province_id into cid,pid from public.apostolic_cities where owner_id=uid for update;select alliance_id into aid from public.arena_alliance_members where user_id=uid;
 select*into st from public.apostolic_province_capital_state where province_id=pid for update;if not found or st.alliance_id<>aid then raise exception'not a member of the capital alliance';end if;
 if exists(select 1 from public.apostolic_province_capital_contributions where contributor_id=uid and idempotency_key=p_idempotency_key)then return public.apostolic_get_province_map();end if;
 select amount into bal from public.apostolic_city_resources where city_id=cid and resource=p_resource for update;if coalesce(bal,0)<p_quantity then raise exception'insufficient resource';end if;
 pts:=p_quantity*case p_resource when'gold'then 3 when'oil'then 2 else 1 end;
 update public.apostolic_city_resources set amount=amount-p_quantity,updated_at=clock_timestamp()where city_id=cid and resource=p_resource;
 insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)values(cid,p_resource,-p_quantity,bal-p_quantity,'province_capital',p_idempotency_key);
 insert into public.apostolic_province_capital_contributions(province_id,alliance_id,contributor_id,resource,quantity,points,idempotency_key)values(pid,aid,uid,p_resource,p_quantity,pts,p_idempotency_key);
 update public.apostolic_province_capital_state set progress=progress+pts,updated_at=clock_timestamp()where province_id=pid returning progress into pts;select capital_level into lvl from public.apostolic_provinces where id=pid for update;
 threshold:=lvl*500;while pts>=threshold and lvl<100 loop pts:=pts-threshold;lvl:=lvl+1;threshold:=lvl*500;end loop;
 update public.apostolic_province_capital_state set progress=pts where province_id=pid;update public.apostolic_provinces set capital_level=lvl where id=pid;return public.apostolic_get_province_map();
end;$$;

revoke all on function public.apostolic_get_province_map(),public.apostolic_establish_province_capital(),public.apostolic_contribute_province_capital(text,integer,uuid)from public;
grant execute on function public.apostolic_get_province_map(),public.apostolic_establish_province_capital(),public.apostolic_contribute_province_capital(text,integer,uuid)to authenticated;
commit;
