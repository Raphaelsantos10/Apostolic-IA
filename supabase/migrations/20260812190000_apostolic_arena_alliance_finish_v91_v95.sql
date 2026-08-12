begin;

-- V91 · caixa de notificações privada e preparada para Realtime
create table public.arena_alliance_notifications(
 id bigint generated always as identity primary key,user_id uuid not null references public.profiles(id)on delete cascade,alliance_id uuid references public.arena_alliances(id)on delete cascade,
 kind text not null check(kind in('war','reward','member','moderation','season','system')),title text not null check(length(title)between 2 and 80),body text not null check(length(body)between 2 and 240),action_path text,read_at timestamptz,created_at timestamptz not null default now()
);
create index arena_alliance_notifications_user_idx on public.arena_alliance_notifications(user_id,read_at,created_at desc);
alter table public.arena_alliance_notifications enable row level security;
create policy arena_alliance_notifications_read_self on public.arena_alliance_notifications for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.arena_alliance_notifications from anon,authenticated;grant select on public.arena_alliance_notifications to authenticated;

-- V92 · execuções automáticas observáveis; agendamento pode ser ativado no Supabase Cron
create table public.arena_alliance_job_runs(id bigint generated always as identity primary key,job_name text not null,status text not null check(status in('running','success','failed')),details jsonb not null default'{}',started_at timestamptz not null default now(),finished_at timestamptz);
alter table public.arena_alliance_job_runs enable row level security;revoke all on public.arena_alliance_job_runs from anon,authenticated;

-- V93 · central administrativa única para Alianças
create table public.arena_alliance_admin_actions(id bigint generated always as identity primary key,admin_id uuid not null references public.profiles(id),alliance_id uuid references public.arena_alliances(id)on delete set null,action text not null,reason text not null check(length(trim(reason))between 3 and 300),metadata jsonb not null default'{}',created_at timestamptz not null default now());
alter table public.arena_alliance_admin_actions enable row level security;revoke all on public.arena_alliance_admin_actions from anon,authenticated;

-- V94 · sinais de risco, sem punição automática baseada apenas em IP/dispositivo
create table public.arena_alliance_risk_events(id bigint generated always as identity primary key,user_id uuid references public.profiles(id)on delete set null,alliance_id uuid references public.arena_alliances(id)on delete set null,event_type text not null,severity integer not null check(severity between 1 and 100),signals jsonb not null default'{}',status text not null default'open'check(status in('open','reviewed','dismissed','confirmed')),created_at timestamptz not null default now(),reviewed_at timestamptz);
create index arena_alliance_risk_events_open_idx on public.arena_alliance_risk_events(status,severity desc,created_at desc);
alter table public.arena_alliance_risk_events enable row level security;revoke all on public.arena_alliance_risk_events from anon,authenticated;

create or replace function public.arena_get_alliance_notifications(p_limit integer default 30)returns jsonb language sql stable security definer set search_path = '' as $$select coalesce(jsonb_agg(to_jsonb(n)order by created_at desc),'[]'::jsonb)from(select id,kind,title,body,action_path,read_at,created_at from public.arena_alliance_notifications where user_id=(select auth.uid())order by created_at desc limit least(greatest(p_limit,1),100))n$$;
create or replace function public.arena_read_alliance_notification(p_id bigint)returns void language sql security definer set search_path = '' as $$update public.arena_alliance_notifications set read_at=coalesce(read_at,now())where id=p_id and user_id=(select auth.uid())$$;

create or replace function public.arena_process_alliance_jobs()returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_run bigint;v_matches integer:=0;v_started integer:=0;v_finished integer:=0;w record;
begin
 if current_user not in('postgres','service_role','supabase_admin')then raise exception'trusted backend required';end if;
 insert into public.arena_alliance_job_runs(job_name,status)values('alliance-orchestrator','running')returning id into v_run;
 v_matches:=public.arena_run_alliance_war_matchmaking();
 update public.arena_alliance_wars set status='battle'where status='preparation'and starts_at<=now();get diagnostics v_started=row_count;
 update public.arena_alliance_war_battles set status='expired'where status in('issued','running')and expires_at<now();
 for w in select id from public.arena_alliance_wars where status='battle'and ends_at<=now()for update skip locked loop perform public.arena_finalize_alliance_war(w.id);v_finished:=v_finished+1;end loop;
 insert into public.arena_alliance_notifications(user_id,alliance_id,kind,title,body,action_path)select p.user_id,p.alliance_id,'war','A guerra começou','Sua Aliança entrou em batalha. Você possui até quatro ataques.','/games/apostolic-arena'from public.arena_alliance_war_participants p join public.arena_alliance_wars aw on aw.id=p.war_id where aw.status='battle'and aw.starts_at between now()-interval'6 minutes'and now()on conflict do nothing;
 update public.arena_alliance_job_runs set status='success',details=jsonb_build_object('matches',v_matches,'started',v_started,'finished',v_finished),finished_at=now()where id=v_run;
 return jsonb_build_object('matches',v_matches,'started',v_started,'finished',v_finished);
exception when others then update public.arena_alliance_job_runs set status='failed',details=jsonb_build_object('error',sqlerrm),finished_at=now()where id=v_run;raise;end;$$;

create or replace function public.arena_admin_get_alliance_center()returns jsonb language plpgsql stable security definer set search_path = '' as $$declare v_user uuid:=(select auth.uid());begin if not exists(select 1 from public.arena_admins where user_id=v_user)then raise exception'administrator required';end if;return jsonb_build_object(
 'summary',jsonb_build_object('alliances',(select count(*)from public.arena_alliances),'members',(select count(*)from public.arena_alliance_members),'active_wars',(select count(*)from public.arena_alliance_wars where status in('preparation','battle')),'open_reports',(select count(*)from public.arena_alliance_reports where status='open'),'risk_events',(select count(*)from public.arena_alliance_risk_events where status='open')),
 'alliances',(select coalesce(jsonb_agg(to_jsonb(x)order by weekly_glory desc),'[]'::jsonb)from(select a.id,a.name,a.tag,a.level,a.weekly_glory,a.visibility,count(m.user_id)::integer members from public.arena_alliances a left join public.arena_alliance_members m on m.alliance_id=a.id group by a.id order by a.weekly_glory desc limit 100)x),
 'risks',(select coalesce(jsonb_agg(to_jsonb(x)order by severity desc,created_at desc),'[]'::jsonb)from(select id,user_id,alliance_id,event_type,severity,signals,status,created_at from public.arena_alliance_risk_events where status='open'limit 100)x),
 'jobs',(select coalesce(jsonb_agg(to_jsonb(x)order by started_at desc),'[]'::jsonb)from(select id,job_name,status,details,started_at,finished_at from public.arena_alliance_job_runs order by started_at desc limit 20)x));end;$$;
create or replace function public.arena_admin_review_alliance_risk(p_id bigint,p_status text,p_reason text)returns void language plpgsql security definer set search_path = '' as $$declare v_user uuid:=(select auth.uid());v_event public.arena_alliance_risk_events%rowtype;begin if not exists(select 1 from public.arena_admins where user_id=v_user)or p_status not in('reviewed','dismissed','confirmed')then raise exception'administrator required';end if;select*into v_event from public.arena_alliance_risk_events where id=p_id for update;if not found then raise exception'event unavailable';end if;update public.arena_alliance_risk_events set status=p_status,reviewed_at=now()where id=p_id;insert into public.arena_alliance_admin_actions(admin_id,alliance_id,action,reason,metadata)values(v_user,v_event.alliance_id,'risk:'||p_status,trim(p_reason),jsonb_build_object('risk_id',p_id,'user_id',v_event.user_id));end;$$;

revoke all on function public.arena_get_alliance_notifications(integer),public.arena_read_alliance_notification(bigint),public.arena_process_alliance_jobs(),public.arena_admin_get_alliance_center(),public.arena_admin_review_alliance_risk(bigint,text,text)from public;
grant execute on function public.arena_get_alliance_notifications(integer),public.arena_read_alliance_notification(bigint),public.arena_admin_get_alliance_center(),public.arena_admin_review_alliance_risk(bigint,text,text)to authenticated;
grant execute on function public.arena_process_alliance_jobs()to service_role;
commit;
