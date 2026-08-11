begin;

create table public.arena_alliance_background_catalog(
 id text primary key check(id~'^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 name text not null,
 image_path text not null,
 tier text not null check(tier in('free','gems','level','pro')),
 gem_price integer check(gem_price is null or gem_price between 1 and 10000),
 required_level integer check(required_level is null or required_level between 1 and 100),
 sort_order integer not null unique,
 active boolean not null default true,
 check((tier='gems')=(gem_price is not null)),
 check((tier='level')=(required_level is not null))
);

insert into public.arena_alliance_background_catalog(id,name,image_path,tier,gem_price,required_level,sort_order) values
('cidadela-dourada','Cidadela Dourada','/images/arena/alliance-backgrounds-v62/cidadela-dourada.webp','free',null,null,1),
('vale-dos-cedros','Vale dos Cedros','/images/arena/alliance-backgrounds-v62/vale-dos-cedros.webp','free',null,null,2),
('fortaleza-do-deserto','Fortaleza do Deserto','/images/arena/alliance-backgrounds-v62/fortaleza-do-deserto.webp','free',null,null,3),
('cidade-nas-nuvens','Cidade nas Nuvens','/images/arena/alliance-backgrounds-v62/cidade-nas-nuvens.webp','free',null,null,4),
('porto-de-tarsis','Porto de Társis','/images/arena/alliance-backgrounds-v62/porto-de-tarsis.webp','gems',350,null,5),
('jardim-das-oliveiras','Jardim das Oliveiras','/images/arena/alliance-backgrounds-v62/jardim-das-oliveiras.webp','gems',350,null,6),
('muralhas-de-neemias','Muralhas de Neemias','/images/arena/alliance-backgrounds-v62/muralhas-de-neemias.webp','gems',450,null,7),
('fortaleza-de-gelo','Fortaleza de Gelo','/images/arena/alliance-backgrounds-v62/fortaleza-de-gelo.webp','gems',450,null,8),
('monte-sinai','Monte Sinai','/images/arena/alliance-backgrounds-v62/monte-sinai.webp','gems',550,null,9),
('refugio-do-jordao','Refúgio do Jordão','/images/arena/alliance-backgrounds-v62/refugio-do-jordao.webp','gems',550,null,10),
('palacio-de-ester','Palácio de Ester','/images/arena/alliance-backgrounds-v62/palacio-de-ester.webp','gems',650,null,11),
('torre-de-vigia','Torre de Vigia','/images/arena/alliance-backgrounds-v62/torre-de-vigia.webp','gems',650,null,12),
('ruinas-da-alianca','Ruínas da Aliança','/images/arena/alliance-backgrounds-v62/ruinas-da-alianca.webp','level',null,3,13),
('oasis-de-en-gedi','Oásis de En-Gedi','/images/arena/alliance-backgrounds-v62/oasis-de-en-gedi.webp','level',null,6,14),
('cidade-de-safira','Cidade de Safira','/images/arena/alliance-backgrounds-v62/cidade-de-safira.webp','level',null,10,15),
('campos-de-belem','Campos de Belém','/images/arena/alliance-backgrounds-v62/campos-de-belem.webp','level',null,15,16),
('trono-de-leoes','Trono de Leões','/images/arena/alliance-backgrounds-v62/trono-de-leoes.webp','pro',null,null,17),
('vale-do-fogo','Vale do Fogo','/images/arena/alliance-backgrounds-v62/vale-do-fogo.webp','pro',null,null,18),
('biblioteca-de-salomao','Biblioteca de Salomão','/images/arena/alliance-backgrounds-v62/biblioteca-de-salomao.webp','pro',null,null,19),
('nova-jerusalem','Nova Jerusalém','/images/arena/alliance-backgrounds-v62/nova-jerusalem.webp','pro',null,null,20);

alter table public.arena_alliances add column background_id text not null default 'cidadela-dourada' references public.arena_alliance_background_catalog(id);

create table public.arena_alliance_background_unlocks(
 alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
 background_id text not null references public.arena_alliance_background_catalog(id),
 purchased_by uuid not null references public.profiles(id) on delete restrict,
 gem_price integer not null check(gem_price>0),
 unlocked_at timestamptz not null default now(),
 primary key(alliance_id,background_id)
);

create table public.arena_alliance_subscriptions(
 alliance_id uuid primary key references public.arena_alliances(id) on delete cascade,
 provider text not null check(provider in('stripe','apple','google','manual')),
 provider_subscription_id text unique,
 status text not null check(status in('trialing','active','past_due','canceled','unpaid')),
 current_period_end timestamptz,
 cancel_at_period_end boolean not null default false,
 updated_at timestamptz not null default now()
);
create trigger arena_alliance_subscriptions_updated before update on public.arena_alliance_subscriptions for each row execute function public.set_updated_at();

alter table public.arena_alliance_background_catalog enable row level security;
alter table public.arena_alliance_background_unlocks enable row level security;
alter table public.arena_alliance_subscriptions enable row level security;
alter table public.arena_alliance_background_catalog force row level security;
alter table public.arena_alliance_background_unlocks force row level security;
alter table public.arena_alliance_subscriptions force row level security;
revoke all on public.arena_alliance_background_catalog,public.arena_alliance_background_unlocks,public.arena_alliance_subscriptions from anon,authenticated;

create or replace function public.arena_alliance_has_pro(p_alliance_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.arena_alliance_subscriptions s where s.alliance_id=p_alliance_id and s.status in('trialing','active') and(s.current_period_end is null or s.current_period_end>now()))
$$;

create or replace function public.arena_alliance_can_use_background(p_alliance_id uuid,p_background_id text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from public.arena_alliances a join public.arena_alliance_background_catalog c on c.id=p_background_id and c.active
  where a.id=p_alliance_id and(
   public.arena_alliance_has_pro(a.id) or c.tier='free' or(c.tier='level' and a.level>=c.required_level) or
   (c.tier='gems' and exists(select 1 from public.arena_alliance_background_unlocks u where u.alliance_id=a.id and u.background_id=c.id))
  )
 )
$$;

create or replace function public.arena_alliance_effective_background(p_alliance_id uuid) returns text language sql stable security definer set search_path='' as $$
 select case when public.arena_alliance_can_use_background(a.id,a.background_id) then a.background_id else 'cidadela-dourada' end from public.arena_alliances a where a.id=p_alliance_id
$$;

create or replace function public.arena_get_alliance_backgrounds() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;v_level integer;v_gems bigint;v_pro boolean;
begin
 if v_user is null then raise exception 'authentication required';end if;
 select m.alliance_id,m.role,a.level into v_alliance,v_role,v_level from public.arena_alliance_members m join public.arena_alliances a on a.id=m.alliance_id where m.user_id=v_user;
 if v_alliance is null then raise exception 'alliance required';end if;
 select gems into v_gems from public.arena_player_wallets where user_id=v_user;
 v_pro:=public.arena_alliance_has_pro(v_alliance);
 return jsonb_build_object('is_pro',v_pro,'can_manage',v_role in('founder','elder'),'wallet_gems',coalesce(v_gems,0),'backgrounds',(
  select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'image',c.image_path,'tier',c.tier,'price',c.gem_price,'required_level',c.required_level,'unlocked',v_pro or c.tier='free' or(c.tier='level' and v_level>=c.required_level)or exists(select 1 from public.arena_alliance_background_unlocks u where u.alliance_id=v_alliance and u.background_id=c.id))order by c.sort_order) from public.arena_alliance_background_catalog c where c.active
 ));
end;$$;

create or replace function public.arena_purchase_alliance_background(p_background_id text,p_idempotency_key text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;v_item public.arena_alliance_background_catalog%rowtype;v_wallet public.arena_player_wallets%rowtype;
begin
 if v_user is null then raise exception 'authentication required';end if;
 if p_idempotency_key is null or length(p_idempotency_key)<16 then raise exception 'invalid idempotency key';end if;
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null or v_role not in('founder','elder')then raise exception 'alliance manager required';end if;
 select * into v_item from public.arena_alliance_background_catalog where id=p_background_id and tier='gems' and active;
 if not found then raise exception 'background not purchasable';end if;
 if public.arena_alliance_has_pro(v_alliance)then return jsonb_build_object('unlocked',true,'included_with_pro',true,'background_id',v_item.id);end if;
 if exists(select 1 from public.arena_alliance_background_unlocks where alliance_id=v_alliance and background_id=v_item.id)then return jsonb_build_object('unlocked',true,'already_owned',true,'background_id',v_item.id);end if;
 insert into public.arena_player_wallets(user_id)values(v_user)on conflict(user_id)do nothing;
 select * into v_wallet from public.arena_player_wallets where user_id=v_user for update;
 if exists(select 1 from public.arena_wallet_transactions where idempotency_key=p_idempotency_key)then return jsonb_build_object('unlocked',exists(select 1 from public.arena_alliance_background_unlocks where alliance_id=v_alliance and background_id=v_item.id),'replayed',true,'gems',v_wallet.gems);end if;
 if v_wallet.gems<v_item.gem_price then raise exception 'insufficient gems';end if;
 update public.arena_player_wallets set gems=gems-v_item.gem_price where user_id=v_user returning * into v_wallet;
 insert into public.arena_wallet_transactions(user_id,currency,amount,transaction_type,source,reference_id,idempotency_key)values(v_user,'gems',-v_item.gem_price,'spend','alliance-background',v_alliance||':'||v_item.id,p_idempotency_key);
 insert into public.arena_alliance_background_unlocks(alliance_id,background_id,purchased_by,gem_price)values(v_alliance,v_item.id,v_user,v_item.gem_price);
 insert into public.arena_alliance_activities(alliance_id,actor_id,kind,message)values(v_alliance,v_user,'system','Um novo cenário foi desbloqueado para a sede.');
 return jsonb_build_object('unlocked',true,'background_id',v_item.id,'gems',v_wallet.gems);
end;$$;

create or replace function public.arena_select_alliance_background(p_background_id text) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user uuid:=(select auth.uid());v_alliance uuid;v_role text;
begin
 if v_user is null then raise exception 'authentication required';end if;
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null or v_role not in('founder','elder')then raise exception 'alliance manager required';end if;
 if not public.arena_alliance_can_use_background(v_alliance,p_background_id)then raise exception 'background locked';end if;
 update public.arena_alliances set background_id=p_background_id where id=v_alliance;
 insert into public.arena_alliance_activities(alliance_id,actor_id,kind,message)values(v_alliance,v_user,'system','A aparência da sede foi renovada.');
 return jsonb_build_object('selected',true,'background_id',p_background_id,'is_pro',public.arena_alliance_has_pro(v_alliance));
end;$$;

create or replace function public.arena_get_alliance_hub() returns jsonb language plpgsql security definer set search_path='' as $$declare v_user uuid:=(select auth.uid());v_id uuid;v_result jsonb;begin if v_user is null then raise exception'authentication required';end if;select alliance_id into v_id from public.arena_alliance_members where user_id=v_user;if v_id is null then return null;end if;select jsonb_build_object('alliance',(select to_jsonb(x)from(select a.*,public.arena_alliance_effective_background(a.id)effective_background_id,public.arena_alliance_has_pro(a.id)is_pro,count(allm.user_id)::integer member_count,m.role,m.contribution from public.arena_alliances a join public.arena_alliance_members m on m.alliance_id=a.id and m.user_id=v_user left join public.arena_alliance_members allm on allm.alliance_id=a.id where a.id=v_id group by a.id,m.role,m.contribution)x),'members',(select coalesce(jsonb_agg(to_jsonb(x)order by contribution desc,joined_at),'[]'::jsonb)from(select user_id,role,contribution,joined_at from public.arena_alliance_members where alliance_id=v_id limit 50)x),'activities',(select coalesce(jsonb_agg(to_jsonb(x)order by created_at desc),'[]'::jsonb)from(select id,kind,message,created_at from public.arena_alliance_activities where alliance_id=v_id order by created_at desc limit 30)x),'missions',(select coalesce(jsonb_agg(to_jsonb(x)order by ends_at),'[]'::jsonb)from(select id,title,description,target,progress,reward_label,ends_at from public.arena_alliance_missions where alliance_id=v_id and ends_at>now())x))into v_result;return v_result;end;$$;

revoke all on function public.arena_alliance_has_pro(uuid),public.arena_alliance_can_use_background(uuid,text),public.arena_alliance_effective_background(uuid),public.arena_get_alliance_backgrounds(),public.arena_purchase_alliance_background(text,text),public.arena_select_alliance_background(text) from public;
grant execute on function public.arena_get_alliance_backgrounds(),public.arena_purchase_alliance_background(text,text),public.arena_select_alliance_background(text) to authenticated;

commit;
