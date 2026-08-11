begin;

create table public.arena_alliance_join_requests (
 id uuid primary key default gen_random_uuid(),
 alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 message text not null default '' check(length(message)<=240),
 status text not null default 'pending' check(status in('pending','approved','rejected','cancelled')),
 reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create unique index arena_alliance_one_pending_request on public.arena_alliance_join_requests(user_id) where status='pending';
create index arena_alliance_requests_queue on public.arena_alliance_join_requests(alliance_id,created_at) where status='pending';

create table public.arena_alliance_invites (
 code text primary key check(code~'^[A-Z0-9]{8}$'),
 alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
 created_by uuid not null references public.profiles(id) on delete cascade,
 max_uses integer not null default 10 check(max_uses between 1 and 50),
 uses integer not null default 0 check(uses>=0 and uses<=max_uses),
 expires_at timestamptz not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create index arena_alliance_invites_active on public.arena_alliance_invites(alliance_id,expires_at) where active;

create table public.arena_alliance_moderation_log (
 id bigint generated always as identity primary key,
 alliance_id uuid not null references public.arena_alliances(id) on delete cascade,
 actor_id uuid references public.profiles(id) on delete set null,
 target_id uuid references public.profiles(id) on delete set null,
 action text not null check(action in('request_approved','request_rejected','role_changed','member_removed','policy_changed','invite_created','member_left')),
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index arena_alliance_moderation_recent on public.arena_alliance_moderation_log(alliance_id,created_at desc);

alter table public.arena_alliance_join_requests enable row level security;
alter table public.arena_alliance_join_requests force row level security;
alter table public.arena_alliance_invites enable row level security;
alter table public.arena_alliance_invites force row level security;
alter table public.arena_alliance_moderation_log enable row level security;
alter table public.arena_alliance_moderation_log force row level security;
revoke all on public.arena_alliance_join_requests,public.arena_alliance_invites,public.arena_alliance_moderation_log from anon,authenticated;

create or replace function public.arena_apply_to_alliance(p_alliance_id uuid,p_message text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_alliance public.arena_alliances%rowtype; v_id uuid;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if exists(select 1 from public.arena_alliance_members where user_id=v_user) then raise exception 'already in alliance'; end if;
 select * into v_alliance from public.arena_alliances where id=p_alliance_id and visibility='approval';
 if not found then raise exception 'alliance does not accept requests'; end if;
 if (select count(*) from public.arena_alliance_members where alliance_id=p_alliance_id)>=v_alliance.max_members then raise exception 'alliance full'; end if;
 insert into public.arena_alliance_join_requests(alliance_id,user_id,message) values(p_alliance_id,v_user,left(trim(coalesce(p_message,'')),240)) returning id into v_id;
 return jsonb_build_object('requested',true,'request_id',v_id);
exception when unique_violation then raise exception 'request already pending';
end;
$$;

create or replace function public.arena_create_alliance_invite(p_max_uses integer default 10,p_hours integer default 72) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_alliance uuid; v_role text; v_code text; v_expires timestamptz;
begin
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null or v_role not in('founder','elder') then raise exception 'alliance manager required'; end if;
 if p_max_uses not between 1 and 50 or p_hours not between 1 and 168 then raise exception 'invalid invite limits'; end if;
 v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)); v_expires:=now()+make_interval(hours=>p_hours);
 insert into public.arena_alliance_invites(code,alliance_id,created_by,max_uses,expires_at) values(v_code,v_alliance,v_user,p_max_uses,v_expires);
 insert into public.arena_alliance_moderation_log(alliance_id,actor_id,action,details) values(v_alliance,v_user,'invite_created',jsonb_build_object('code',v_code,'max_uses',p_max_uses));
 return jsonb_build_object('code',v_code,'expires_at',v_expires,'max_uses',p_max_uses);
end;
$$;

create or replace function public.arena_accept_alliance_invite(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_invite public.arena_alliance_invites%rowtype; v_alliance public.arena_alliances%rowtype;
begin
 if v_user is null then raise exception 'authentication required'; end if;
 if exists(select 1 from public.arena_alliance_members where user_id=v_user) then raise exception 'already in alliance'; end if;
 select * into v_invite from public.arena_alliance_invites where code=upper(trim(p_code)) and active and expires_at>now() and uses<max_uses for update;
 if not found then raise exception 'invite unavailable'; end if;
 select * into v_alliance from public.arena_alliances where id=v_invite.alliance_id for update;
 if (select count(*) from public.arena_alliance_members where alliance_id=v_alliance.id)>=v_alliance.max_members then raise exception 'alliance full'; end if;
 insert into public.arena_alliance_members(alliance_id,user_id) values(v_alliance.id,v_user);
 update public.arena_alliance_invites set uses=uses+1,active=(uses+1<max_uses) where code=v_invite.code;
 update public.arena_alliance_join_requests set status='cancelled',reviewed_at=now() where user_id=v_user and status='pending';
 insert into public.arena_alliance_activities(alliance_id,actor_id,kind,message) values(v_alliance.id,v_user,'join','Um guardião entrou por convite.');
 return jsonb_build_object('joined',true,'alliance_id',v_alliance.id,'alliance_name',v_alliance.name);
end;
$$;

create or replace function public.arena_get_alliance_management() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_alliance uuid; v_role text; v_manage boolean; v_founder boolean;
begin
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null then raise exception 'alliance required'; end if;
 v_manage:=v_role in('founder','elder'); v_founder:=v_role='founder';
 return jsonb_build_object(
  'role',v_role,'can_manage',v_manage,'is_founder',v_founder,
  'members',(select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'display_name',coalesce(p.display_name,'Guardião'),'avatar_url',p.avatar_url,'role',m.role,'contribution',m.contribution,'joined_at',m.joined_at) order by case m.role when'founder'then 1 when'elder'then 2 when'guardian'then 3 else 4 end,m.contribution desc),'[]'::jsonb) from public.arena_alliance_members m join public.profiles p on p.id=m.user_id where m.alliance_id=v_alliance),
  'requests',(case when v_manage then(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'user_id',r.user_id,'display_name',coalesce(p.display_name,'Candidato'),'avatar_url',p.avatar_url,'message',r.message,'created_at',r.created_at)order by r.created_at),'[]'::jsonb)from public.arena_alliance_join_requests r join public.profiles p on p.id=r.user_id where r.alliance_id=v_alliance and r.status='pending')else'[]'::jsonb end),
  'invites',(case when v_manage then(select coalesce(jsonb_agg(jsonb_build_object('code',i.code,'uses',i.uses,'max_uses',i.max_uses,'expires_at',i.expires_at)order by i.created_at desc),'[]'::jsonb)from public.arena_alliance_invites i where i.alliance_id=v_alliance and i.active and i.expires_at>now())else'[]'::jsonb end)
 );
end;
$$;

create or replace function public.arena_review_alliance_request(p_request_id uuid,p_decision text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_alliance uuid; v_role text; v_request public.arena_alliance_join_requests%rowtype; v_max integer;
begin
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null or v_role not in('founder','elder') then raise exception 'alliance manager required'; end if;
 if p_decision not in('approved','rejected') then raise exception 'invalid decision'; end if;
 select * into v_request from public.arena_alliance_join_requests where id=p_request_id and alliance_id=v_alliance and status='pending' for update;
 if not found then raise exception 'request unavailable'; end if;
 if p_decision='approved' then
  select max_members into v_max from public.arena_alliances where id=v_alliance for update;
  if (select count(*) from public.arena_alliance_members where alliance_id=v_alliance)>=v_max then raise exception 'alliance full'; end if;
  if exists(select 1 from public.arena_alliance_members where user_id=v_request.user_id) then raise exception 'candidate already joined'; end if;
  insert into public.arena_alliance_members(alliance_id,user_id) values(v_alliance,v_request.user_id);
  insert into public.arena_alliance_activities(alliance_id,actor_id,kind,message) values(v_alliance,v_request.user_id,'join','Um novo guardião foi aprovado.');
 end if;
 update public.arena_alliance_join_requests set status=p_decision,reviewed_by=v_user,reviewed_at=now() where id=v_request.id;
 insert into public.arena_alliance_moderation_log(alliance_id,actor_id,target_id,action) values(v_alliance,v_user,v_request.user_id,case when p_decision='approved'then'request_approved'else'request_rejected'end);
 return jsonb_build_object('reviewed',true,'decision',p_decision);
end;
$$;

create or replace function public.arena_set_alliance_member_role(p_user_id uuid,p_role text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_alliance uuid; v_actor_role text; v_target_role text;
begin
 select alliance_id,role into v_alliance,v_actor_role from public.arena_alliance_members where user_id=v_user;
 select role into v_target_role from public.arena_alliance_members where alliance_id=v_alliance and user_id=p_user_id;
 if v_target_role is null or p_role not in('elder','guardian','member') then raise exception 'invalid role change'; end if;
 if v_actor_role<>'founder' and not(v_actor_role='elder'and v_target_role in('guardian','member')and p_role in('guardian','member')) then raise exception 'founder required'; end if;
 if v_target_role='founder' or p_user_id=v_user then raise exception 'protected member'; end if;
 update public.arena_alliance_members set role=p_role where alliance_id=v_alliance and user_id=p_user_id;
 insert into public.arena_alliance_moderation_log(alliance_id,actor_id,target_id,action,details) values(v_alliance,v_user,p_user_id,'role_changed',jsonb_build_object('from',v_target_role,'to',p_role));
 return jsonb_build_object('changed',true,'user_id',p_user_id,'role',p_role);
end;
$$;

create or replace function public.arena_remove_alliance_member(p_user_id uuid,p_reason text default '') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_alliance uuid; v_actor_role text; v_target_role text;
begin
 select alliance_id,role into v_alliance,v_actor_role from public.arena_alliance_members where user_id=v_user;
 select role into v_target_role from public.arena_alliance_members where alliance_id=v_alliance and user_id=p_user_id;
 if v_actor_role not in('founder','elder') or v_target_role is null then raise exception 'alliance manager required'; end if;
 if p_user_id=v_user or v_target_role='founder' or(v_actor_role='elder'and v_target_role='elder')then raise exception 'protected member';end if;
 delete from public.arena_alliance_members where alliance_id=v_alliance and user_id=p_user_id;
 insert into public.arena_alliance_moderation_log(alliance_id,actor_id,target_id,action,details)values(v_alliance,v_user,p_user_id,'member_removed',jsonb_build_object('reason',left(trim(coalesce(p_reason,'')),160)));
 return jsonb_build_object('removed',true,'user_id',p_user_id);
end;
$$;

create or replace function public.arena_leave_alliance() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_alliance uuid; v_role text;
begin
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null then raise exception 'alliance required'; end if;
 if v_role='founder' then raise exception 'founder must transfer leadership'; end if;
 delete from public.arena_alliance_members where alliance_id=v_alliance and user_id=v_user;
 insert into public.arena_alliance_moderation_log(alliance_id,actor_id,target_id,action)values(v_alliance,v_user,v_user,'member_left');
 return jsonb_build_object('left',true);
end;
$$;

create or replace function public.arena_transfer_alliance_leadership(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid()); v_alliance uuid; v_target_role text;
begin
 select alliance_id into v_alliance from public.arena_alliance_members where user_id=v_user and role='founder';
 if v_alliance is null then raise exception 'founder required'; end if;
 if p_user_id=v_user then raise exception 'select another member'; end if;
 select role into v_target_role from public.arena_alliance_members where alliance_id=v_alliance and user_id=p_user_id for update;
 if v_target_role is null then raise exception 'member required'; end if;
 update public.arena_alliance_members set role='elder' where alliance_id=v_alliance and user_id=v_user;
 update public.arena_alliance_members set role='founder' where alliance_id=v_alliance and user_id=p_user_id;
 update public.arena_alliances set founder_id=p_user_id where id=v_alliance;
 insert into public.arena_alliance_moderation_log(alliance_id,actor_id,target_id,action,details)
 values(v_alliance,v_user,p_user_id,'role_changed',jsonb_build_object('from',v_target_role,'to','founder','previous_founder',v_user));
 return jsonb_build_object('transferred',true,'founder_id',p_user_id);
end;
$$;

revoke all on function public.arena_apply_to_alliance(uuid,text),public.arena_create_alliance_invite(integer,integer),public.arena_accept_alliance_invite(text),public.arena_get_alliance_management(),public.arena_review_alliance_request(uuid,text),public.arena_set_alliance_member_role(uuid,text),public.arena_remove_alliance_member(uuid,text),public.arena_leave_alliance(),public.arena_transfer_alliance_leadership(uuid) from public;
grant execute on function public.arena_apply_to_alliance(uuid,text),public.arena_create_alliance_invite(integer,integer),public.arena_accept_alliance_invite(text),public.arena_get_alliance_management(),public.arena_review_alliance_request(uuid,text),public.arena_set_alliance_member_role(uuid,text),public.arena_remove_alliance_member(uuid,text),public.arena_leave_alliance(),public.arena_transfer_alliance_leadership(uuid) to authenticated;

commit;
