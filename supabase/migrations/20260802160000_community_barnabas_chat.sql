begin;

create table public.community_bot_settings (
  circle_id uuid primary key references public.community_circles(id) on delete cascade,
  enabled boolean not null default true,
  display_name text not null default 'Barnabé' check (char_length(display_name) between 2 and 40),
  greeting text not null default 'A paz! Sou Barnabé, o guia virtual da comunidade. Como posso ajudar?' check (char_length(greeting) between 10 and 300),
  tone text not null default 'acolhedor' check (tone in ('acolhedor','direto','academico')),
  show_avatar_every_message boolean not null default true,
  animations_enabled boolean not null default true,
  allow_channel_recommendations boolean not null default true,
  allow_thread_summary boolean not null default true,
  allow_lumi_handoff boolean not null default true,
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.community_bot_conversations (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.community_bot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.community_bot_conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  intent text not null default 'general' check (intent in ('general','channel','summary','rules','lumi','tutor','safety')),
  avatar_state text not null default 'speaking' check (avatar_state in ('greeting','thinking','speaking','studying','careful','success')),
  created_at timestamptz not null default now()
);

create table public.community_tutor_requests (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.community_circles(id) on delete cascade,
  channel_id uuid references public.community_channels(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null check (char_length(question) between 5 and 1000),
  status text not null default 'open' check (status in ('open','claimed','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index community_bot_conversations_user_idx on public.community_bot_conversations(user_id,circle_id,updated_at desc);
create index community_bot_messages_conversation_idx on public.community_bot_messages(conversation_id,created_at);
create index community_tutor_requests_circle_idx on public.community_tutor_requests(circle_id,status,created_at);

create trigger community_bot_settings_updated before update on public.community_bot_settings for each row execute function public.set_updated_at();
create trigger community_bot_conversations_updated before update on public.community_bot_conversations for each row execute function public.set_updated_at();

alter table public.community_bot_settings enable row level security;
alter table public.community_bot_conversations enable row level security;
alter table public.community_bot_messages enable row level security;
alter table public.community_tutor_requests enable row level security;
alter table public.community_bot_settings force row level security;
alter table public.community_bot_conversations force row level security;
alter table public.community_bot_messages force row level security;
alter table public.community_tutor_requests force row level security;

create policy bot_settings_read on public.community_bot_settings for select to authenticated using (public.is_active_circle_member(circle_id,(select auth.uid())));
create policy bot_settings_manage on public.community_bot_settings for all to authenticated using (public.is_circle_moderator(circle_id,(select auth.uid()))) with check (updated_by=(select auth.uid()) and public.is_circle_moderator(circle_id,(select auth.uid())));
create policy bot_conversations_own on public.community_bot_conversations for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and public.is_active_circle_member(circle_id,(select auth.uid())));
create policy bot_messages_own on public.community_bot_messages for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and exists(select 1 from public.community_bot_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())));
create policy tutor_requests_own_read on public.community_tutor_requests for select to authenticated using (user_id=(select auth.uid()) or public.is_circle_moderator(circle_id,(select auth.uid())));
create policy tutor_requests_create on public.community_tutor_requests for insert to authenticated with check (user_id=(select auth.uid()) and public.is_active_circle_member(circle_id,(select auth.uid())));
create policy tutor_requests_moderate on public.community_tutor_requests for update to authenticated using (public.is_circle_moderator(circle_id,(select auth.uid()))) with check (public.is_circle_moderator(circle_id,(select auth.uid())));

revoke all on public.community_bot_settings,public.community_bot_conversations,public.community_bot_messages,public.community_tutor_requests from anon,authenticated;
grant select,insert,update on public.community_bot_settings to authenticated;
grant select,insert,update,delete on public.community_bot_conversations,public.community_bot_messages to authenticated;
grant select,insert,update on public.community_tutor_requests to authenticated;

commit;
