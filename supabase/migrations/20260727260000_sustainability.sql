begin;

create table public.billing_plans (
  code text primary key check (code ~ '^[a-z0-9_-]+$'),
  name text not null,
  description text not null,
  ai_daily_limit integer not null check (ai_daily_limit between 0 and 1000),
  status text not null default 'active' check (status in ('active','archived')),
  sort_order integer not null default 0
);

create table public.billing_prices (
  plan_code text not null references public.billing_plans(code) on delete cascade,
  region text not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  monthly_minor integer not null check (monthly_minor >= 0),
  annual_minor integer not null check (annual_minor >= 0),
  active boolean not null default true,
  primary key (plan_code, region)
);

create table public.billing_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan_code text not null references public.billing_plans(code),
  provider text not null check (provider in ('stripe','apple','google','manual')),
  provider_customer_id text,
  provider_subscription_id text unique,
  status text not null check (status in ('trialing','active','past_due','canceled','unpaid')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.billing_webhook_events (
  provider text not null,
  event_id text not null,
  received_at timestamptz not null default now(),
  primary key (provider,event_id)
);

create trigger billing_subscriptions_updated before update on public.billing_subscriptions
for each row execute function public.set_updated_at();

alter table public.billing_plans enable row level security;
alter table public.billing_plans force row level security;
alter table public.billing_prices enable row level security;
alter table public.billing_prices force row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_subscriptions force row level security;
alter table public.billing_webhook_events enable row level security;
alter table public.billing_webhook_events force row level security;

create policy billing_plans_read on public.billing_plans for select
to anon,authenticated using (status='active');
create policy billing_prices_read on public.billing_prices for select
to anon,authenticated using (active);
create policy billing_subscription_own_read on public.billing_subscriptions for select
to authenticated using (user_id=(select auth.uid()));

revoke all on public.billing_plans,public.billing_prices,public.billing_subscriptions,
  public.billing_webhook_events from anon,authenticated;
grant select on public.billing_plans,public.billing_prices to anon,authenticated;
grant select on public.billing_subscriptions to authenticated;

insert into public.billing_plans(code,name,description,ai_daily_limit,sort_order) values
('free','Gratuito','Estudo essencial, Bíblia e recursos de aprendizagem.',10,1),
('plus','Plus','Maior utilização de IA, voz e sincronização.',150,2),
('supporter','Apoiador','Limites ampliados e contribuição para bolsas de acesso.',300,3);

insert into public.billing_prices(plan_code,region,currency,monthly_minor,annual_minor)
values
('free','PT','EUR',0,0),('plus','PT','EUR',899,8990),('supporter','PT','EUR',1299,12990),
('free','BR','BRL',0,0),('plus','BR','BRL',2990,29900),('supporter','BR','BRL',4490,44900),
('free','US','USD',0,0),('plus','US','USD',799,7990),('supporter','US','USD',1199,11990),
('free','GB','GBP',0,0),('plus','GB','GBP',699,6990),('supporter','GB','GBP',999,9990),
('free','IN','INR',0,0),('plus','IN','INR',29900,299000),('supporter','IN','INR',49900,499000),
('free','PK','PKR',0,0),('plus','PK','PKR',149900,1499000),('supporter','PK','PKR',229900,2299000),
('free','GLOBAL','USD',0,0),('plus','GLOBAL','USD',799,7990),('supporter','GLOBAL','USD',1199,11990);

create or replace function public.current_billing_plan()
returns text language sql stable security definer set search_path=''
as $$
  select coalesce((
    select s.plan_code from public.billing_subscriptions s
    where s.user_id=(select auth.uid()) and s.status in ('trialing','active')
    limit 1
  ),'free')
$$;

create or replace function public.ai_daily_quota_available()
returns boolean language sql stable security definer set search_path=''
as $$
  select (
    select count(*) from public.ai_messages
    where user_id=(select auth.uid()) and role='user' and created_at>=current_date
  ) < coalesce((
    select p.ai_daily_limit
    from public.billing_plans p
    where p.code=public.current_billing_plan()
  ),10)
$$;

revoke all on function public.current_billing_plan(),public.ai_daily_quota_available() from public;
grant execute on function public.current_billing_plan(),public.ai_daily_quota_available() to authenticated;

commit;
