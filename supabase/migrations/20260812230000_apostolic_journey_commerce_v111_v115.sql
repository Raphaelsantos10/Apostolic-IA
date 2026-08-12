begin;

-- V111-V115: mercado entre cidades, caravanas temporizadas, imposto justo e sinais de risco auditáveis.
create table public.apostolic_market_listings(
 id uuid primary key default gen_random_uuid(), seller_city_id uuid not null references public.apostolic_cities(id) on delete cascade,
 resource text not null check(resource in('wheat','cedar','stone','oil')), quantity bigint not null check(quantity between 10 and 10000),
 unit_price integer not null check(unit_price between 1 and 1000), status text not null default 'open' check(status in('open','sold','cancelled')),
 idempotency_key uuid not null, buyer_city_id uuid references public.apostolic_cities(id) on delete set null,
 created_at timestamptz not null default clock_timestamp(), sold_at timestamptz, unique(seller_city_id,idempotency_key)
);
create index apostolic_market_open_idx on public.apostolic_market_listings(status,resource,unit_price,created_at) where status='open';

create table public.apostolic_caravans(
 id uuid primary key default gen_random_uuid(), listing_id uuid not null unique references public.apostolic_market_listings(id) on delete restrict,
 origin_city_id uuid not null references public.apostolic_cities(id) on delete restrict, destination_city_id uuid not null references public.apostolic_cities(id) on delete restrict,
 resource text not null check(resource in('wheat','cedar','stone','oil')), quantity bigint not null check(quantity>0),
 gross_gold bigint not null check(gross_gold>0), tax_gold bigint not null check(tax_gold>=0), status text not null default 'travelling' check(status in('travelling','delivered')),
 departs_at timestamptz not null default clock_timestamp(), arrives_at timestamptz not null, delivered_at timestamptz
);
create index apostolic_caravans_destination_idx on public.apostolic_caravans(destination_city_id,status,arrives_at);

create table public.apostolic_commerce_risk_events(
 id bigint generated always as identity primary key, actor_id uuid not null references public.profiles(id) on delete cascade,
 action text not null, risk_score smallint not null check(risk_score between 0 and 100), reasons text[] not null default '{}',
 context jsonb not null default '{}', review_status text not null default 'observed' check(review_status in('observed','reviewing','cleared','confirmed')),
 created_at timestamptz not null default clock_timestamp()
);
create index apostolic_commerce_risk_actor_idx on public.apostolic_commerce_risk_events(actor_id,created_at desc);

alter table public.apostolic_market_listings enable row level security;
alter table public.apostolic_caravans enable row level security;
alter table public.apostolic_commerce_risk_events enable row level security;
create policy apostolic_market_read on public.apostolic_market_listings for select to authenticated using(status='open' or exists(select 1 from public.apostolic_cities c where c.id in(seller_city_id,buyer_city_id) and c.owner_id=(select auth.uid())));
create policy apostolic_caravans_self on public.apostolic_caravans for select to authenticated using(exists(select 1 from public.apostolic_cities c where c.id in(origin_city_id,destination_city_id) and c.owner_id=(select auth.uid())));
revoke all on public.apostolic_market_listings,public.apostolic_caravans,public.apostolic_commerce_risk_events from anon,authenticated;
grant select on public.apostolic_market_listings,public.apostolic_caravans to authenticated;

create or replace function public.apostolic_get_commerce_center() returns jsonb language sql stable security definer set search_path='' as $$
with own as(select id from public.apostolic_cities where owner_id=(select auth.uid()))
select jsonb_build_object(
 'tax_percent',5,
 'unlocked',exists(select 1 from public.apostolic_city_research where city_id=(select id from own) and research_code='caravan_routes'),
 'offers',coalesce((select jsonb_agg(jsonb_build_object('id',l.id,'resource',l.resource,'quantity',l.quantity,'unit_price',l.unit_price,'seller',c.name,'mine',l.seller_city_id=(select id from own)) order by l.unit_price,l.created_at) from public.apostolic_market_listings l join public.apostolic_cities c on c.id=l.seller_city_id where l.status='open'),'[]'::jsonb),
 'caravans',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'resource',v.resource,'quantity',v.quantity,'arrives_at',v.arrives_at,'status',v.status,'incoming',v.destination_city_id=(select id from own)) order by v.arrives_at) from public.apostolic_caravans v where (v.origin_city_id=(select id from own) or v.destination_city_id=(select id from own)) and v.status='travelling'),'[]'::jsonb)
)$$;

create or replace function public.apostolic_create_market_listing(p_resource text,p_quantity bigint,p_unit_price integer,p_idempotency_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=(select auth.uid());cid uuid;bal bigint;recent integer;score smallint:=0;why text[]:='{}';
begin
 if uid is null then raise exception'authentication required';end if;
 if p_resource not in('wheat','cedar','stone','oil') or p_quantity not between 10 and 10000 or p_unit_price not between 1 and 1000 or p_idempotency_key is null then raise exception'invalid offer';end if;
 select id into cid from public.apostolic_cities where owner_id=uid for update;
 if not exists(select 1 from public.apostolic_city_research where city_id=cid and research_code='caravan_routes')then raise exception'caravan routes required';end if;
 if(select count(*) from public.apostolic_market_listings where seller_city_id=cid and status='open')>=5 then raise exception'offer limit reached';end if;
 select amount into bal from public.apostolic_city_resources where city_id=cid and resource=p_resource for update;
 if coalesce(bal,0)<p_quantity then raise exception'insufficient resource';end if;
 if exists(select 1 from public.apostolic_market_listings where seller_city_id=cid and idempotency_key=p_idempotency_key)then return public.apostolic_get_commerce_center();end if;
 update public.apostolic_city_resources set amount=amount-p_quantity,updated_at=clock_timestamp() where city_id=cid and resource=p_resource;
 insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)values(cid,p_resource,-p_quantity,bal-p_quantity,'market_reserve',p_idempotency_key);
 insert into public.apostolic_market_listings(seller_city_id,resource,quantity,unit_price,idempotency_key)values(cid,p_resource,p_quantity,p_unit_price,p_idempotency_key);
 select count(*) into recent from public.apostolic_market_listings where seller_city_id=cid and created_at>clock_timestamp()-interval'10 minutes';
 if recent>=4 then score:=score+25;why:=array_append(why,'many_offers_10m');end if;if p_unit_price>=500 then score:=score+20;why:=array_append(why,'high_unit_price');end if;
 if score>0 then insert into public.apostolic_commerce_risk_events(actor_id,action,risk_score,reasons,context)values(uid,'create_listing',score,why,jsonb_build_object('quantity',p_quantity,'unit_price',p_unit_price));end if;
 return public.apostolic_get_commerce_center();
end;$$;

create or replace function public.apostolic_buy_market_listing(p_listing_id uuid,p_idempotency_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=(select auth.uid());buyer uuid;l public.apostolic_market_listings%rowtype;total bigint;tax bigint;seller_balance bigint;buyer_balance bigint;travel integer;
begin
 if uid is null or p_idempotency_key is null then raise exception'authentication required';end if;
 select id into buyer from public.apostolic_cities where owner_id=uid for update;
 if not exists(select 1 from public.apostolic_city_research where city_id=buyer and research_code='caravan_routes')then raise exception'caravan routes required';end if;
 select*into l from public.apostolic_market_listings where id=p_listing_id for update;if not found or l.status<>'open' then raise exception'offer unavailable';end if;
 if l.seller_city_id=buyer then raise exception'cannot buy own offer';end if;
 if exists(select 1 from public.apostolic_caravans where listing_id=l.id)then return public.apostolic_get_commerce_center();end if;
 total:=l.quantity*l.unit_price;tax:=ceil(total*0.05);select amount into buyer_balance from public.apostolic_city_resources where city_id=buyer and resource='gold' for update;
 if coalesce(buyer_balance,0)<total then raise exception'insufficient gold';end if;
 update public.apostolic_city_resources set amount=amount-total,updated_at=clock_timestamp()where city_id=buyer and resource='gold';
 insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason,idempotency_key)values(buyer,'gold',-total,buyer_balance-total,'market_purchase',p_idempotency_key);
 select amount into seller_balance from public.apostolic_city_resources where city_id=l.seller_city_id and resource='gold' for update;
 update public.apostolic_city_resources set amount=least(capacity,amount+total-tax),updated_at=clock_timestamp()where city_id=l.seller_city_id and resource='gold';
 insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason)select l.seller_city_id,'gold',least(capacity,seller_balance+total-tax)-seller_balance,least(capacity,seller_balance+total-tax),'market_sale' from public.apostolic_city_resources where city_id=l.seller_city_id and resource='gold';
 travel:=greatest(60,300-(select level*10 from public.apostolic_city_buildings where city_id=buyer and building='market'));
 update public.apostolic_market_listings set status='sold',buyer_city_id=buyer,sold_at=clock_timestamp()where id=l.id;
 insert into public.apostolic_caravans(listing_id,origin_city_id,destination_city_id,resource,quantity,gross_gold,tax_gold,arrives_at)values(l.id,l.seller_city_id,buyer,l.resource,l.quantity,total,tax,clock_timestamp()+make_interval(secs=>travel));
 return public.apostolic_get_commerce_center();
end;$$;

create or replace function public.apostolic_claim_caravan(p_caravan_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid;v public.apostolic_caravans%rowtype;bal bigint;gain bigint;
begin
 select id into cid from public.apostolic_cities where owner_id=(select auth.uid())for update;select*into v from public.apostolic_caravans where id=p_caravan_id and destination_city_id=cid for update;
 if not found then raise exception'caravan not found';end if;if v.status='delivered'then return public.apostolic_get_commerce_center();end if;if v.arrives_at>clock_timestamp()then raise exception'caravan travelling';end if;
 select amount into bal from public.apostolic_city_resources where city_id=cid and resource=v.resource for update;select least(v.quantity,capacity-amount)into gain from public.apostolic_city_resources where city_id=cid and resource=v.resource;
 update public.apostolic_city_resources set amount=amount+gain,updated_at=clock_timestamp()where city_id=cid and resource=v.resource;
 insert into public.apostolic_resource_ledger(city_id,resource,delta,balance_after,reason)values(cid,v.resource,gain,bal+gain,'caravan_delivery');
 update public.apostolic_caravans set status='delivered',delivered_at=clock_timestamp()where id=v.id;return public.apostolic_get_commerce_center();
end;$$;

revoke all on function public.apostolic_get_commerce_center(),public.apostolic_create_market_listing(text,bigint,integer,uuid),public.apostolic_buy_market_listing(uuid,uuid),public.apostolic_claim_caravan(uuid)from public;
grant execute on function public.apostolic_get_commerce_center(),public.apostolic_create_market_listing(text,bigint,integer,uuid),public.apostolic_buy_market_listing(uuid,uuid),public.apostolic_claim_caravan(uuid)to authenticated;
commit;
