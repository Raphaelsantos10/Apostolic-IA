begin;

-- V151-V155: tratamento dos feridos de batalha na enfermaria da cidade.
alter table public.apostolic_battle_outcomes
  add column recovered_wounded integer not null default 0
  check (recovered_wounded between 0 and attacker_wounded);

create table public.apostolic_infirmary_queue (
  id uuid primary key default gen_random_uuid(),
  outcome_id uuid not null references public.apostolic_battle_outcomes(id) on delete cascade,
  army_id uuid not null references public.apostolic_armies(id) on delete cascade,
  city_id uuid not null references public.apostolic_cities(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 200),
  costs jsonb not null check (jsonb_typeof(costs) = 'object' and not (costs ? 'gems')),
  status text not null default 'healing' check (status in ('healing','completed','cancelled')),
  started_at timestamptz not null default clock_timestamp(),
  finishes_at timestamptz not null,
  completed_at timestamptz,
  idempotency_key uuid not null,
  unique (city_id,idempotency_key)
);

create unique index apostolic_infirmary_one_active_idx
  on public.apostolic_infirmary_queue(city_id) where status = 'healing';
create index apostolic_infirmary_outcome_idx
  on public.apostolic_infirmary_queue(outcome_id,status);

alter table public.apostolic_infirmary_queue enable row level security;
create policy apostolic_infirmary_self on public.apostolic_infirmary_queue
  for select to authenticated
  using (exists (
    select 1 from public.apostolic_cities c
    where c.id = city_id and c.owner_id = (select auth.uid())
  ));
revoke all on public.apostolic_infirmary_queue from anon,authenticated;
grant select on public.apostolic_infirmary_queue to authenticated;

create or replace function public.apostolic_get_infirmary_center()
returns jsonb language sql stable security definer set search_path = '' as $$
with own as (
  select c.id,c.name,coalesce(b.level,0) infirmary_level
  from public.apostolic_cities c
  left join public.apostolic_city_buildings b on b.city_id=c.id and b.building='infirmary'
  where c.owner_id=(select auth.uid())
), wounds as (
  select o.id outcome_id,a.army_id,ar.name army_name,o.result,o.resolved_at,
    greatest(0,o.attacker_wounded-o.recovered_wounded-coalesce((
      select sum(q.quantity) from public.apostolic_infirmary_queue q
      where q.outcome_id=o.id and q.status='healing'
    ),0)) available
  from public.apostolic_battle_outcomes o
  join public.apostolic_city_attacks a on a.id=o.attack_id
  join public.apostolic_armies ar on ar.id=a.army_id
  where o.attacker_id=(select auth.uid())
)
select jsonb_build_object(
  'city_name',(select name from own),
  'infirmary_level',(select infirmary_level from own),
  'capacity',(select infirmary_level*10 from own),
  'queue',(select to_jsonb(q) from (
    select iq.id,iq.outcome_id,iq.quantity,iq.costs,iq.finishes_at
    from public.apostolic_infirmary_queue iq
    where iq.city_id=(select id from own) and iq.status='healing' limit 1
  ) q),
  'wounds',coalesce((select jsonb_agg(to_jsonb(w) order by resolved_at desc)
    from wounds w where available>0),'[]'::jsonb)
)$$;

create or replace function public.apostolic_start_infirmary_treatment(
  p_outcome_id uuid,p_quantity integer,p_idempotency_key uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid()); cid uuid; aid uuid; level smallint;
  wounded integer; recovered integer; reserved integer; oil_cost bigint; wheat_cost bigint;
begin
  if uid is null or p_idempotency_key is null then raise exception 'authentication required'; end if;
  if p_quantity not between 1 and 200 then raise exception 'invalid quantity'; end if;
  select c.id,b.level into cid,level
  from public.apostolic_cities c join public.apostolic_city_buildings b on b.city_id=c.id and b.building='infirmary'
  where c.owner_id=uid for update of c;
  if cid is null or coalesce(level,0)<1 then raise exception 'infirmary required'; end if;
  if exists(select 1 from public.apostolic_infirmary_queue where city_id=cid and idempotency_key=p_idempotency_key) then
    return public.apostolic_get_infirmary_center();
  end if;
  if exists(select 1 from public.apostolic_infirmary_queue where city_id=cid and status='healing') then
    raise exception 'infirmary queue occupied';
  end if;
  select a.army_id,o.attacker_wounded,o.recovered_wounded into aid,wounded,recovered
  from public.apostolic_battle_outcomes o
  join public.apostolic_city_attacks a on a.id=o.attack_id
  join public.apostolic_armies ar on ar.id=a.army_id and ar.owner_id=uid and ar.home_city_id=cid
  where o.id=p_outcome_id and o.attacker_id=uid for update of o;
  if aid is null then raise exception 'wounded group unavailable'; end if;
  select coalesce(sum(quantity),0) into reserved from public.apostolic_infirmary_queue
  where outcome_id=p_outcome_id and status='healing';
  if p_quantity>wounded-recovered-reserved then raise exception 'insufficient wounded units'; end if;
  if p_quantity>level*10 then raise exception 'infirmary capacity exceeded'; end if;
  oil_cost:=p_quantity*2; wheat_cost:=p_quantity*3;
  if not exists(select 1 from public.apostolic_city_resources where city_id=cid and resource='oil' and amount>=oil_cost for update) then raise exception 'insufficient oil'; end if;
  if not exists(select 1 from public.apostolic_city_resources where city_id=cid and resource='wheat' and amount>=wheat_cost for update) then raise exception 'insufficient wheat'; end if;
  update public.apostolic_city_resources set amount=amount-oil_cost,updated_at=clock_timestamp() where city_id=cid and resource='oil';
  insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)
    select cid,'oil',-oil_cost,amount,'infirmary_treatment',p_idempotency_key from public.apostolic_city_resources where city_id=cid and resource='oil';
  update public.apostolic_city_resources set amount=amount-wheat_cost,updated_at=clock_timestamp() where city_id=cid and resource='wheat';
  insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)
    select cid,'wheat',-wheat_cost,amount,'infirmary_treatment',p_idempotency_key from public.apostolic_city_resources where city_id=cid and resource='wheat';
  insert into public.apostolic_infirmary_queue(outcome_id,army_id,city_id,quantity,costs,finishes_at,idempotency_key)
  values(p_outcome_id,aid,cid,p_quantity,jsonb_build_object('oil',oil_cost,'wheat',wheat_cost),
    clock_timestamp()+make_interval(secs=>greatest(30,(p_quantity*120)/level)),p_idempotency_key);
  return public.apostolic_get_infirmary_center();
end;$$;

create or replace function public.apostolic_finish_infirmary_treatment()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); cid uuid; q public.apostolic_infirmary_queue%rowtype; max_units integer;
begin
  if uid is null then raise exception 'authentication required'; end if;
  select id into cid from public.apostolic_cities where owner_id=uid for update;
  select * into q from public.apostolic_infirmary_queue where city_id=cid and status='healing' for update;
  if not found then return public.apostolic_get_infirmary_center(); end if;
  if q.finishes_at>clock_timestamp() then raise exception 'treatment in progress'; end if;
  select coalesce(sum((value::text)::integer),0) into max_units
    from public.apostolic_armies a cross join lateral jsonb_each(a.units)
    where a.id=q.army_id and a.owner_id=uid;
  update public.apostolic_armies set total_units=least(max_units,total_units+q.quantity) where id=q.army_id and owner_id=uid;
  update public.apostolic_battle_outcomes set recovered_wounded=recovered_wounded+q.quantity where id=q.outcome_id;
  update public.apostolic_infirmary_queue set status='completed',completed_at=clock_timestamp() where id=q.id;
  return public.apostolic_get_infirmary_center();
end;$$;

revoke all on function public.apostolic_get_infirmary_center(),public.apostolic_start_infirmary_treatment(uuid,integer,uuid),public.apostolic_finish_infirmary_treatment() from public;
grant execute on function public.apostolic_get_infirmary_center(),public.apostolic_start_infirmary_treatment(uuid,integer,uuid),public.apostolic_finish_infirmary_treatment() to authenticated;

commit;
