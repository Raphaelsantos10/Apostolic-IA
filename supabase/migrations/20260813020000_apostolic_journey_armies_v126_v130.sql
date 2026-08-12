begin;

-- V126-V130: exércitos destacáveis e marchas amistosas. Ataques só entram na V136.
create table public.apostolic_armies(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id)on delete cascade,
 home_city_id uuid not null references public.apostolic_cities(id)on delete cascade,name text not null check(length(trim(name))between 3 and 30),
 units jsonb not null check(jsonb_typeof(units)='object'),total_units integer not null check(total_units between 1 and 200),
 attack_power integer not null check(attack_power>=0),defense_power integer not null check(defense_power>=0),
 status text not null default'ready'check(status in('ready','marching','stationed','returning')),created_at timestamptz not null default clock_timestamp()
);
create table public.apostolic_army_marches(
 id uuid primary key default gen_random_uuid(),army_id uuid not null references public.apostolic_armies(id)on delete cascade,
 origin_city_id uuid not null references public.apostolic_cities(id)on delete restrict,destination_city_id uuid not null references public.apostolic_cities(id)on delete restrict,
 purpose text not null default'reinforce'check(purpose in('reinforce','return')),distance integer not null check(distance between 1 and 30),
 speed numeric(6,2)not null check(speed>0),supply_wheat integer not null check(supply_wheat>=0),
 status text not null default'marching'check(status in('marching','arrived','completed')),departs_at timestamptz not null default clock_timestamp(),arrives_at timestamptz not null,
 completed_at timestamptz,idempotency_key uuid not null,unique(army_id,idempotency_key)
);
create unique index apostolic_army_one_march_idx on public.apostolic_army_marches(army_id)where status='marching';
create index apostolic_army_owner_idx on public.apostolic_armies(owner_id,status);
alter table public.apostolic_armies enable row level security;alter table public.apostolic_army_marches enable row level security;
create policy apostolic_armies_self on public.apostolic_armies for select to authenticated using(owner_id=(select auth.uid()));
create policy apostolic_marches_self on public.apostolic_army_marches for select to authenticated using(exists(select 1 from public.apostolic_armies a where a.id=army_id and a.owner_id=(select auth.uid())));
revoke all on public.apostolic_armies,public.apostolic_army_marches from anon,authenticated;grant select on public.apostolic_armies,public.apostolic_army_marches to authenticated;

create or replace function public.apostolic_get_army_center()returns jsonb language sql stable security definer set search_path=''as $$
with own as(select id,province_id,slot_no,name from public.apostolic_cities where owner_id=(select auth.uid()))
select jsonb_build_object(
 'city',(select jsonb_build_object('id',id,'name',name,'slot',slot_no)from own),
 'garrison',(select coalesce(jsonb_agg(jsonb_build_object('code',u.code,'name',u.name,'ready',g.ready,'attack',u.attack,'defense',u.defense,'space',u.space)order by u.sort_order),'[]'::jsonb)from public.apostolic_city_garrison g join public.apostolic_unit_catalog u on u.code=g.unit_code where g.city_id=(select id from own)),
 'destinations',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'slot',c.slot_no,'level',c.level)order by c.slot_no),'[]'::jsonb)from public.apostolic_cities c where c.province_id=(select province_id from own)and c.id<>(select id from own)),
 'armies',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'name',a.name,'units',a.units,'total_units',a.total_units,'attack_power',a.attack_power,'defense_power',a.defense_power,'status',a.status,'march',(select jsonb_build_object('id',m.id,'destination_id',m.destination_city_id,'destination_name',d.name,'destination_slot',d.slot_no,'purpose',m.purpose,'distance',m.distance,'speed',m.speed,'supply_wheat',m.supply_wheat,'arrives_at',m.arrives_at,'status',m.status)from public.apostolic_army_marches m join public.apostolic_cities d on d.id=m.destination_city_id where m.army_id=a.id order by m.departs_at desc limit 1))order by a.created_at desc),'[]'::jsonb)from public.apostolic_armies a where a.owner_id=(select auth.uid()))
)$$;

create or replace function public.apostolic_form_army(p_name text,p_units jsonb)returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;r record;qty integer;total integer:=0;atk integer:=0;def integer:=0;
begin
 if uid is null then raise exception'authentication required';end if;if length(trim(p_name))not between 3 and 30 or jsonb_typeof(p_units)<>'object'then raise exception'invalid army';end if;
 select id into cid from public.apostolic_cities where owner_id=uid for update;if(select count(*)from public.apostolic_armies where owner_id=uid and status<>'stationed')>=5 then raise exception'army limit reached';end if;
 for r in select u.code,u.attack,u.defense,(e.value::text)::integer quantity from jsonb_each(p_units)e join public.apostolic_unit_catalog u on u.code=e.key loop
  qty:=r.quantity;if qty<0 then raise exception'invalid quantity';end if;if qty>coalesce((select ready from public.apostolic_city_garrison where city_id=cid and unit_code=r.code),0)then raise exception'insufficient units: %',r.code;end if;total:=total+qty;atk:=atk+qty*r.attack;def:=def+qty*r.defense;
 end loop;
 if (select count(*)from jsonb_object_keys(p_units))<>(select count(*)from jsonb_object_keys(p_units)as k(code)join public.apostolic_unit_catalog u on u.code=k.code)then raise exception'unknown unit';end if;
 if total not between 1 and 200 then raise exception'army size must be 1 to 200';end if;
 for r in select key,(value::text)::integer quantity from jsonb_each(p_units)loop update public.apostolic_city_garrison set ready=ready-r.quantity,updated_at=clock_timestamp()where city_id=cid and unit_code=r.key;end loop;
 insert into public.apostolic_armies(owner_id,home_city_id,name,units,total_units,attack_power,defense_power)values(uid,cid,trim(p_name),p_units,total,atk,def);return public.apostolic_get_army_center();
end;$$;

create or replace function public.apostolic_start_army_march(p_army_id uuid,p_destination_city_id uuid,p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());a public.apostolic_armies%rowtype;origin public.apostolic_cities%rowtype;dest public.apostolic_cities%rowtype;distance integer;speed numeric;seconds integer;supply integer;wheat bigint;
begin
 if uid is null or p_idempotency_key is null then raise exception'authentication required';end if;select*into a from public.apostolic_armies where id=p_army_id and owner_id=uid for update;if not found or a.status<>'ready'then raise exception'army unavailable';end if;
 select*into origin from public.apostolic_cities where id=a.home_city_id;select*into dest from public.apostolic_cities where id=p_destination_city_id;if not found or dest.province_id<>origin.province_id or dest.id=origin.id then raise exception'invalid destination';end if;
 if exists(select 1 from public.apostolic_army_marches where army_id=a.id and idempotency_key=p_idempotency_key)then return public.apostolic_get_army_center();end if;
 distance:=greatest(1,abs(dest.slot_no-origin.slot_no));speed:=greatest(1,12-(a.total_units/25.0));seconds:=greatest(60,ceil(distance*60/speed)::integer*10);supply:=greatest(5,ceil(a.total_units*distance/4.0)::integer);
 select amount into wheat from public.apostolic_city_resources where city_id=origin.id and resource='wheat'for update;if coalesce(wheat,0)<supply then raise exception'insufficient wheat supplies';end if;
 update public.apostolic_city_resources set amount=amount-supply,updated_at=clock_timestamp()where city_id=origin.id and resource='wheat';insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)values(origin.id,'wheat',-supply,wheat-supply,'army_march',p_idempotency_key);
 insert into public.apostolic_army_marches(army_id,origin_city_id,destination_city_id,distance,speed,supply_wheat,arrives_at,idempotency_key)values(a.id,origin.id,dest.id,distance,speed,supply,clock_timestamp()+make_interval(secs=>seconds),p_idempotency_key);update public.apostolic_armies set status='marching'where id=a.id;return public.apostolic_get_army_center();
end;$$;

create or replace function public.apostolic_finish_army_march(p_march_id uuid)returns jsonb language plpgsql security definer set search_path=''as $$declare uid uuid:=(select auth.uid());m public.apostolic_army_marches%rowtype;begin select m0.* into m from public.apostolic_army_marches m0 join public.apostolic_armies a on a.id=m0.army_id where m0.id=p_march_id and a.owner_id=uid for update of m0;if not found then raise exception'march not found';end if;if m.status<>'marching'then return public.apostolic_get_army_center();end if;if m.arrives_at>clock_timestamp()then raise exception'army still marching';end if;update public.apostolic_army_marches set status='arrived',completed_at=clock_timestamp()where id=m.id;update public.apostolic_armies set status='stationed'where id=m.army_id;return public.apostolic_get_army_center();end;$$;

revoke all on function public.apostolic_get_army_center(),public.apostolic_form_army(text,jsonb),public.apostolic_start_army_march(uuid,uuid,uuid),public.apostolic_finish_army_march(uuid)from public;
grant execute on function public.apostolic_get_army_center(),public.apostolic_form_army(text,jsonb),public.apostolic_start_army_march(uuid,uuid,uuid),public.apostolic_finish_army_march(uuid)to authenticated;
commit;
