begin;

-- V121: quartel, muralha e enfermaria entram na cidade e na fila de construções existente.
alter table public.apostolic_building_catalog drop constraint apostolic_building_catalog_building_check;
alter table public.apostolic_building_catalog add constraint apostolic_building_catalog_building_check check(building in('town_hall','warehouse','farm','lumberyard','quarry','olive_press','market','academy','barracks','wall','infirmary'));
alter table public.apostolic_city_buildings drop constraint apostolic_city_buildings_building_check;
alter table public.apostolic_city_buildings add constraint apostolic_city_buildings_building_check check(building in('town_hall','warehouse','farm','lumberyard','quarry','olive_press','market','academy','barracks','wall','infirmary'));
insert into public.apostolic_building_catalog(building,name,description,base_duration_seconds,base_costs,sort_order)values
('barracks','Quartel','Treina e amplia a capacidade da guarnição.',110,'{"wheat":80,"cedar":100,"stone":70,"gold":55}',9),
('wall','Muralha','Protege a cidade e multiplica sua resistência defensiva.',130,'{"cedar":60,"stone":150,"oil":40,"gold":60}',10),
('infirmary','Enfermaria','Prepara a recuperação de unidades feridas.',100,'{"wheat":90,"cedar":65,"stone":70,"oil":55}',11);
insert into public.apostolic_city_buildings(city_id,building,level)select c.id,b,1 from public.apostolic_cities c cross join unnest(array['barracks','wall','infirmary'])b on conflict do nothing;
create or replace function public.apostolic_add_defense_buildings_to_city()returns trigger language plpgsql security definer set search_path=''as $$begin insert into public.apostolic_city_buildings(city_id,building,level)values(new.id,'barracks',1),(new.id,'wall',1),(new.id,'infirmary',1)on conflict do nothing;return new;end;$$;
create trigger apostolic_city_defense_after_insert after insert on public.apostolic_cities for each row execute function public.apostolic_add_defense_buildings_to_city();

-- V122: unidades iniciais equilibradas por espaço, ataque, defesa e tempo.
create table public.apostolic_unit_catalog(
 code text primary key,name text not null,description text not null,attack smallint not null check(attack>0),defense smallint not null check(defense>0),
 space smallint not null check(space between 1 and 10),barracks_level smallint not null check(barracks_level between 1 and 20),
 duration_seconds integer not null check(duration_seconds between 10 and 86400),costs jsonb not null check(jsonb_typeof(costs)='object'and not(costs?'gems')),sort_order smallint not null unique
);
insert into public.apostolic_unit_catalog values
('watchman','Vigia','Sentinela econômico para a primeira linha de defesa.',8,15,1,1,35,'{"wheat":18,"gold":6}',1),
('slinger','Fundibulário','Combatente móvel treinado no uso da funda.',18,10,1,1,45,'{"wheat":22,"stone":8,"gold":8}',2),
('spearman','Lanceiro','Defensor disciplinado contra avanços terrestres.',16,24,2,2,70,'{"wheat":35,"cedar":16,"gold":12}',3),
('archer','Arqueiro de Cedro','Atirador de longo alcance protegido pelas muralhas.',28,16,2,3,90,'{"wheat":40,"cedar":25,"gold":18}',4);
create table public.apostolic_city_garrison(
 city_id uuid not null references public.apostolic_cities(id)on delete cascade,unit_code text not null references public.apostolic_unit_catalog(code),
 ready integer not null default 0 check(ready>=0),wounded integer not null default 0 check(wounded>=0),updated_at timestamptz not null default clock_timestamp(),primary key(city_id,unit_code)
);
insert into public.apostolic_city_garrison(city_id,unit_code)select c.id,u.code from public.apostolic_cities c cross join public.apostolic_unit_catalog u on conflict do nothing;
create or replace function public.apostolic_add_garrison_to_city()returns trigger language plpgsql security definer set search_path=''as $$begin insert into public.apostolic_city_garrison(city_id,unit_code)select new.id,code from public.apostolic_unit_catalog on conflict do nothing;return new;end;$$;
create trigger apostolic_city_garrison_after_insert after insert on public.apostolic_cities for each row execute function public.apostolic_add_garrison_to_city();

-- V123/V124: treinamento transacional, uma fila por cidade e relógio do servidor.
create table public.apostolic_training_queue(
 id uuid primary key default gen_random_uuid(),city_id uuid not null references public.apostolic_cities(id)on delete cascade,unit_code text not null references public.apostolic_unit_catalog(code),
 quantity smallint not null check(quantity between 1 and 50),costs jsonb not null,started_at timestamptz not null default clock_timestamp(),finishes_at timestamptz not null,
 status text not null default'training'check(status in('training','completed','cancelled')),idempotency_key uuid not null,completed_at timestamptz,unique(city_id,idempotency_key)
);
create unique index apostolic_training_one_active_idx on public.apostolic_training_queue(city_id)where status='training';
alter table public.apostolic_unit_catalog enable row level security;alter table public.apostolic_city_garrison enable row level security;alter table public.apostolic_training_queue enable row level security;
create policy apostolic_unit_catalog_read on public.apostolic_unit_catalog for select to authenticated using(true);
create policy apostolic_garrison_self on public.apostolic_city_garrison for select to authenticated using(exists(select 1 from public.apostolic_cities c where c.id=city_id and c.owner_id=(select auth.uid())));
create policy apostolic_training_self on public.apostolic_training_queue for select to authenticated using(exists(select 1 from public.apostolic_cities c where c.id=city_id and c.owner_id=(select auth.uid())));
revoke all on public.apostolic_unit_catalog,public.apostolic_city_garrison,public.apostolic_training_queue from anon,authenticated;grant select on public.apostolic_unit_catalog,public.apostolic_city_garrison,public.apostolic_training_queue to authenticated;

create or replace function public.apostolic_get_defense_center()returns jsonb language sql stable security definer set search_path=''as $$
with own as(select id,name from public.apostolic_cities where owner_id=(select auth.uid())),levels as(select building,level from public.apostolic_city_buildings where city_id=(select id from own)and building in('barracks','wall','infirmary')),units as(select u.*,g.ready,g.wounded from public.apostolic_unit_catalog u join public.apostolic_city_garrison g on g.unit_code=u.code and g.city_id=(select id from own))
select jsonb_build_object('city_name',(select name from own),'barracks_level',coalesce((select level from levels where building='barracks'),0),'wall_level',coalesce((select level from levels where building='wall'),0),'infirmary_level',coalesce((select level from levels where building='infirmary'),0),'capacity',coalesce((select level from levels where building='barracks'),0)*40,'used_space',coalesce((select sum((ready+wounded)*space)from units),0),'defense_power',coalesce((select sum(ready*defense)from units),0)*(100+coalesce((select level from levels where building='wall'),0)*5)/100,'queue',(select to_jsonb(q)from(select id,unit_code,quantity,finishes_at from public.apostolic_training_queue where city_id=(select id from own)and status='training'limit 1)q),'units',(select jsonb_agg(jsonb_build_object('code',code,'name',name,'description',description,'attack',attack,'defense',defense,'space',space,'barracks_level',barracks_level,'duration_seconds',duration_seconds,'costs',costs,'ready',ready,'wounded',wounded)order by sort_order)from units))
$$;

create or replace function public.apostolic_start_unit_training(p_unit_code text,p_quantity integer,p_idempotency_key uuid)returns jsonb language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;u public.apostolic_unit_catalog%rowtype;bl smallint;capacity integer;used integer;total_costs jsonb;r record;cost bigint;
begin
 if uid is null or p_idempotency_key is null then raise exception'authentication required';end if;if p_quantity not between 1 and 50 then raise exception'invalid quantity';end if;
 select id into cid from public.apostolic_cities where owner_id=uid for update;if exists(select 1 from public.apostolic_training_queue where city_id=cid and idempotency_key=p_idempotency_key)then return public.apostolic_get_defense_center();end if;
 if exists(select 1 from public.apostolic_training_queue where city_id=cid and status='training')then raise exception'training queue occupied';end if;
 select*into u from public.apostolic_unit_catalog where code=p_unit_code;if not found then raise exception'unit unavailable';end if;select level into bl from public.apostolic_city_buildings where city_id=cid and building='barracks';if bl<u.barracks_level then raise exception'barracks level required';end if;
 select coalesce(sum((g.ready+g.wounded)*c.space),0)into used from public.apostolic_city_garrison g join public.apostolic_unit_catalog c on c.code=g.unit_code where g.city_id=cid;capacity:=bl*40;if used+p_quantity*u.space>capacity then raise exception'garrison capacity exceeded';end if;
 select jsonb_object_agg(key,(value::text)::bigint*p_quantity)into total_costs from jsonb_each(u.costs);
 for r in select key,value from jsonb_each_text(total_costs)loop cost:=r.value::bigint;if not exists(select 1 from public.apostolic_city_resources where city_id=cid and resource=r.key and amount>=cost)then raise exception'insufficient resource: %',r.key;end if;end loop;
 for r in select key,value from jsonb_each_text(total_costs)loop cost:=r.value::bigint;update public.apostolic_city_resources set amount=amount-cost,updated_at=clock_timestamp()where city_id=cid and resource=r.key;insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)select cid,r.key,-cost,amount,'training:'||p_unit_code,p_idempotency_key from public.apostolic_city_resources where city_id=cid and resource=r.key;end loop;
 insert into public.apostolic_training_queue(city_id,unit_code,quantity,costs,finishes_at,idempotency_key)values(cid,p_unit_code,p_quantity,total_costs,clock_timestamp()+make_interval(secs=>u.duration_seconds*p_quantity),p_idempotency_key);return public.apostolic_get_defense_center();
end;$$;
create or replace function public.apostolic_finish_unit_training()returns jsonb language plpgsql security definer set search_path=''as $$declare cid uuid;q public.apostolic_training_queue%rowtype;begin select id into cid from public.apostolic_cities where owner_id=(select auth.uid())for update;select*into q from public.apostolic_training_queue where city_id=cid and status='training'for update;if not found then return public.apostolic_get_defense_center();end if;if q.finishes_at>clock_timestamp()then raise exception'training in progress';end if;update public.apostolic_city_garrison set ready=ready+q.quantity,updated_at=clock_timestamp()where city_id=cid and unit_code=q.unit_code;update public.apostolic_training_queue set status='completed',completed_at=clock_timestamp()where id=q.id;return public.apostolic_get_defense_center();end;$$;
revoke all on function public.apostolic_get_defense_center(),public.apostolic_start_unit_training(text,integer,uuid),public.apostolic_finish_unit_training()from public;grant execute on function public.apostolic_get_defense_center(),public.apostolic_start_unit_training(text,integer,uuid),public.apostolic_finish_unit_training()to authenticated;
commit;
