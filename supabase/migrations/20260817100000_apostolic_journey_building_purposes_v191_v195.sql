begin;

-- V191: cada edifício recebe uma finalidade jogável e progressão própria.
create table public.apostolic_building_action_catalog(
 building text not null references public.apostolic_building_catalog(building)on delete cascade,
 action text not null check(action~'^[a-z0-9_]{3,40}$'),name text not null check(length(name)between 3 and 80),
 description text not null check(length(description)between 10 and 240),metric text not null check(metric in('care','mission','wisdom','unity','stewardship','readiness')),
 cost_resource text not null check(cost_resource in('wheat','cedar','stone','oil','gold')),base_cost integer not null check(base_cost between 1 and 100000),
 base_reward integer not null check(base_reward between 1 and 10000),base_duration_seconds integer not null check(base_duration_seconds between 60 and 604800),
 required_building_level smallint not null default 1 check(required_building_level between 1 and 100),sort_order smallint not null,
 primary key(building,action)
);

insert into public.apostolic_building_action_catalog values
('town_hall','organize_council','Reunir o Conselho','Coordena prioridades da cidade e melhora a administração dos recursos.','stewardship','gold',90,12,900,1,1),
('warehouse','prepare_reserves','Preparar reservas','Separa provisões para crises, viagens e acolhimento de famílias.','stewardship','wheat',80,10,1200,1,2),
('farm','community_harvest','Colheita comunitária','Mobiliza trabalhadores para alimentar famílias e viajantes.','care','wheat',65,10,900,1,3),
('lumberyard','supply_builders','Apoiar construtores','Prepara madeira para obras comunitárias e postos missionários.','stewardship','cedar',70,10,1200,1,4),
('quarry','restore_roads','Restaurar caminhos','Recupera estradas usadas pela população, comércio e missões.','stewardship','stone',75,11,1500,1,5),
('olive_press','prepare_relief_oil','Preparar azeite de socorro','Produz azeite destinado ao cuidado de enfermos e necessitados.','care','oil',55,12,1200,1,6),
('market','hold_fair','Organizar feira justa','Estimula trocas equilibradas sem vantagens compradas com dinheiro real.','unity','gold',85,11,1200,1,7),
('academy','study_crafts','Pesquisar novos ofícios','Gera conhecimento para economia, navegação, defesa e serviço.','wisdom','gold',110,14,1800,1,8),
('tavern','share_table','Repartir a mesa','Fortalece comunhão e satisfação através de uma refeição coletiva.','unity','wheat',75,13,1200,1,9),
('museum','welcome_families','Acolher famílias','A Casa de Oração escuta, orienta e acompanha pessoas da comunidade.','care','oil',70,15,1800,1,10),
('embassy','send_mission_team','Enviar equipe missionária','Envia uma equipe para servir, ensinar e apoiar outra região.','mission','wheat',120,18,3600,1,11),
('hideout','protect_vulnerable','Proteger vulneráveis','Organiza abrigo discreto e proteção para pessoas em risco.','care','gold',100,14,1800,1,12),
('infirmary','care_for_wounded','Cuidar dos feridos','Mobiliza cuidadores e acelera o restauro de pessoas feridas.','care','oil',90,16,1800,1,13),
('barracks','train_guardians','Treinar guardiões','Prepara defensores para proteger a cidade sem incentivar agressão.','readiness','wheat',115,14,2700,1,14),
('wall','inspect_defenses','Inspecionar muralhas','Reforça pontos vulneráveis e melhora a prontidão defensiva.','readiness','stone',130,15,3000,1,15),
('shipyard','prepare_relief_fleet','Preparar frota de auxílio','Equipa navios para proteção costeira e transporte de ajuda.','readiness','cedar',150,17,3600,1,16);

-- V192: indicadores persistentes mostram o impacto humano e estratégico da cidade.
create table public.apostolic_city_ministries(
 city_id uuid primary key references public.apostolic_cities(id)on delete cascade,
 care bigint not null default 0 check(care>=0),mission bigint not null default 0 check(mission>=0),wisdom bigint not null default 0 check(wisdom>=0),
 unity bigint not null default 0 check(unity>=0),stewardship bigint not null default 0 check(stewardship>=0),readiness bigint not null default 0 check(readiness>=0),
 updated_at timestamptz not null default clock_timestamp()
);
insert into public.apostolic_city_ministries(city_id)select id from public.apostolic_cities on conflict do nothing;

create or replace function public.apostolic_create_city_ministry_state()returns trigger
language plpgsql security invoker set search_path=''as $$begin insert into public.apostolic_city_ministries(city_id)values(new.id)on conflict do nothing;return new;end;$$;
create trigger apostolic_city_ministry_state after insert on public.apostolic_cities for each row execute function public.apostolic_create_city_ministry_state();

-- V193: atividades são temporais, idempotentes e usam somente recursos conquistados no jogo.
create table public.apostolic_building_action_queue(
 id uuid primary key default gen_random_uuid(),city_id uuid not null references public.apostolic_cities(id)on delete cascade,
 building text not null,action text not null,building_level smallint not null check(building_level between 1 and 100),
 metric text not null check(metric in('care','mission','wisdom','unity','stewardship','readiness')),cost_resource text not null check(cost_resource in('wheat','cedar','stone','oil','gold')),
 cost integer not null check(cost>0),reward integer not null check(reward>0),status text not null default'active'check(status in('active','completed')),
 started_at timestamptz not null default clock_timestamp(),finishes_at timestamptz not null,completed_at timestamptz,idempotency_key uuid not null,
 foreign key(building,action)references public.apostolic_building_action_catalog(building,action),unique(city_id,idempotency_key)
);
create unique index apostolic_building_action_one_active_idx on public.apostolic_building_action_queue(city_id)where status='active';
create index apostolic_building_action_due_idx on public.apostolic_building_action_queue(finishes_at,city_id)where status='active';

alter table public.apostolic_building_action_catalog enable row level security;
alter table public.apostolic_building_action_catalog force row level security;
alter table public.apostolic_city_ministries enable row level security;
alter table public.apostolic_city_ministries force row level security;
alter table public.apostolic_building_action_queue enable row level security;
alter table public.apostolic_building_action_queue force row level security;
revoke all on public.apostolic_building_action_catalog,public.apostolic_city_ministries,public.apostolic_building_action_queue from anon,authenticated;

-- V194: conclusão lazy e início atômico impedem cliques duplicados e progressão instantânea.
create or replace function public.apostolic_get_building_purposes()returns jsonb
language sql stable security definer set search_path=''as $$
with own as(select id from public.apostolic_cities where owner_id=(select auth.uid()))
select case when not exists(select 1 from own)then null else jsonb_build_object(
 'metrics',(select to_jsonb(m)-'city_id'-'updated_at'||jsonb_build_object('updated_at',m.updated_at)from public.apostolic_city_ministries m where m.city_id=(select id from own)),
 'active',(select to_jsonb(q)from(select id,building,action,metric,cost_resource,cost,reward,started_at,finishes_at from public.apostolic_building_action_queue where city_id=(select id from own)and status='active'limit 1)q),
 'actions',(select coalesce(jsonb_agg(jsonb_build_object('building',a.building,'action',a.action,'name',a.name,'description',a.description,'metric',a.metric,'cost_resource',a.cost_resource,
  'cost',ceil(a.base_cost*power(1.22,greatest(b.level,1)-1))::integer,'reward',ceil(a.base_reward*power(1.12,greatest(b.level,1)-1))::integer,
  'duration_seconds',ceil(a.base_duration_seconds*power(1.10,greatest(b.level,1)-1))::integer,'building_level',b.level)order by a.sort_order),'[]'::jsonb)
  from public.apostolic_building_action_catalog a join public.apostolic_city_buildings b on b.building=a.building and b.city_id=(select id from own)
  where b.level>=a.required_building_level and b.state='ready')
 )end$$;

create or replace function public.apostolic_sync_building_purposes()returns jsonb
language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;q public.apostolic_building_action_queue%rowtype;
begin
 if uid is null then raise exception'authentication required';end if;
 select id into cid from public.apostolic_cities where owner_id=uid for update;
 if cid is null then return null;end if;
 insert into public.apostolic_city_ministries(city_id)values(cid)on conflict do nothing;
 select*into q from public.apostolic_building_action_queue where city_id=cid and status='active'and finishes_at<=clock_timestamp()order by finishes_at for update limit 1;
 if found then
  update public.apostolic_city_ministries set
   care=care+case when q.metric='care'then q.reward else 0 end,
   mission=mission+case when q.metric='mission'then q.reward else 0 end,
   wisdom=wisdom+case when q.metric='wisdom'then q.reward else 0 end,
   unity=unity+case when q.metric='unity'then q.reward else 0 end,
   stewardship=stewardship+case when q.metric='stewardship'then q.reward else 0 end,
   readiness=readiness+case when q.metric='readiness'then q.reward else 0 end,updated_at=clock_timestamp()where city_id=cid;
  update public.apostolic_building_action_queue set status='completed',completed_at=clock_timestamp()where id=q.id;
 end if;
 return public.apostolic_get_building_purposes();
end;$$;

create or replace function public.apostolic_start_building_purpose(p_building text,p_action text,p_idempotency_key uuid)returns jsonb
language plpgsql security definer set search_path=''as $$
declare uid uuid:=(select auth.uid());cid uuid;building_level integer;a public.apostolic_building_action_catalog%rowtype;cost_value integer;reward_value integer;duration_value integer;balance bigint;
begin
 if uid is null then raise exception'authentication required';end if;if p_idempotency_key is null then raise exception'idempotency key required';end if;
 select id into cid from public.apostolic_cities where owner_id=uid for update;if cid is null then raise exception'city not found';end if;
 if exists(select 1 from public.apostolic_building_action_queue where city_id=cid and idempotency_key=p_idempotency_key)then return public.apostolic_get_building_purposes();end if;
 perform public.apostolic_sync_building_purposes();
 if exists(select 1 from public.apostolic_building_action_queue where city_id=cid and status='active')then raise exception'building activity already active';end if;
 select level into building_level from public.apostolic_city_buildings where city_id=cid and building=p_building and state='ready'for update;
 select*into a from public.apostolic_building_action_catalog where building=p_building and action=p_action;
 if building_level is null or not found or building_level<a.required_building_level then raise exception'building action unavailable';end if;
 cost_value:=ceil(a.base_cost*power(1.22,greatest(building_level,1)-1));reward_value:=ceil(a.base_reward*power(1.12,greatest(building_level,1)-1));duration_value:=ceil(a.base_duration_seconds*power(1.10,greatest(building_level,1)-1));
 select amount into balance from public.apostolic_city_resources where city_id=cid and resource=a.cost_resource for update;
 if coalesce(balance,0)<cost_value then raise exception'insufficient resource: %',a.cost_resource;end if;
 update public.apostolic_city_resources set amount=amount-cost_value,updated_at=clock_timestamp()where city_id=cid and resource=a.cost_resource;
 insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)values(cid,a.cost_resource,-cost_value,balance-cost_value,'building_purpose:'||p_building||':'||p_action,p_idempotency_key);
 insert into public.apostolic_building_action_queue(city_id,building,action,building_level,metric,cost_resource,cost,reward,finishes_at,idempotency_key)
 values(cid,p_building,p_action,building_level,a.metric,a.cost_resource,cost_value,reward_value,clock_timestamp()+make_interval(secs=>duration_value),p_idempotency_key);
 return public.apostolic_get_building_purposes();
end;$$;

-- V195: somente RPCs autenticadas formam a API; nenhuma moeda premium compra progresso.
revoke all on function public.apostolic_get_building_purposes(),public.apostolic_sync_building_purposes(),public.apostolic_start_building_purpose(text,text,uuid)from public,anon,authenticated;
grant execute on function public.apostolic_get_building_purposes(),public.apostolic_sync_building_purposes(),public.apostolic_start_building_purpose(text,text,uuid)to authenticated;
revoke all on function public.apostolic_create_city_ministry_state()from public,anon,authenticated;

commit;
