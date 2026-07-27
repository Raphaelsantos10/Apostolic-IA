begin;
create table public.ai_sources(id uuid primary key default gen_random_uuid(),title text not null,reference_label text not null,kind text not null check(kind in('lesson','doctrine','editorial')),approved boolean not null default false,approved_at timestamptz);
create table public.ai_source_chunks(id uuid primary key default gen_random_uuid(),source_id uuid not null references public.ai_sources(id) on delete cascade,content text not null check(char_length(content) between 20 and 8000),search_vector tsvector generated always as(to_tsvector('portuguese',content)) stored);
create table public.ai_conversations(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,title text not null check(char_length(title) between 3 and 100),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.ai_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.ai_conversations(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,role text not null check(role in('user','assistant')),content text not null check(char_length(content) between 1 and 12000),citations jsonb not null default '[]',created_at timestamptz not null default now());
create table public.ai_feedback(message_id uuid not null references public.ai_messages(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,rating smallint not null check(rating in(-1,1)),reason text check(reason is null or char_length(reason)<=500),primary key(message_id,user_id));
create index ai_chunks_search_idx on public.ai_source_chunks using gin(search_vector);
create trigger ai_conversations_updated before update on public.ai_conversations for each row execute function public.set_updated_at();
alter table public.ai_sources enable row level security;alter table public.ai_sources force row level security;
alter table public.ai_source_chunks enable row level security;alter table public.ai_source_chunks force row level security;
alter table public.ai_conversations enable row level security;alter table public.ai_conversations force row level security;
alter table public.ai_messages enable row level security;alter table public.ai_messages force row level security;
alter table public.ai_feedback enable row level security;alter table public.ai_feedback force row level security;
create policy ai_sources_read on public.ai_sources for select to authenticated using(approved);
create policy ai_chunks_read on public.ai_source_chunks for select to authenticated using(exists(select 1 from public.ai_sources s where s.id=source_id and s.approved));
create policy ai_conversations_own on public.ai_conversations for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy ai_messages_own on public.ai_messages for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.ai_conversations c where c.id=conversation_id and c.user_id=(select auth.uid())));
create policy ai_feedback_own on public.ai_feedback for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
revoke all on public.ai_sources,public.ai_source_chunks,public.ai_conversations,public.ai_messages,public.ai_feedback from anon,authenticated;
grant select on public.ai_sources,public.ai_source_chunks to authenticated;
grant select,insert,update,delete on public.ai_conversations,public.ai_messages,public.ai_feedback to authenticated;
create or replace function public.search_approved_ai_sources(p_query text,p_limit integer default 5)
returns table(chunk_id uuid,title text,reference_label text,content text,rank real) language sql stable security definer set search_path=''
as $$select c.id,s.title,s.reference_label,c.content,ts_rank(c.search_vector,websearch_to_tsquery('portuguese',p_query)) from public.ai_source_chunks c join public.ai_sources s on s.id=c.source_id where s.approved and c.search_vector@@websearch_to_tsquery('portuguese',p_query) order by 5 desc limit least(greatest(p_limit,1),8)$$;
create or replace function public.ai_daily_quota_available() returns boolean language sql stable security definer set search_path=''
as $$select (select count(*) from public.ai_messages where user_id=(select auth.uid()) and role='user' and created_at>=current_date)<30$$;
revoke all on function public.search_approved_ai_sources(text,integer),public.ai_daily_quota_available() from public;
grant execute on function public.search_approved_ai_sources(text,integer),public.ai_daily_quota_available() to authenticated;
insert into public.ai_sources(title,reference_label,kind,approved,approved_at) select l.title,'Aula: '||l.title,'lesson',true,now() from public.lessons l where l.status='published' and l.body_text is not null;
insert into public.ai_source_chunks(source_id,content) select s.id,l.body_text from public.ai_sources s join public.lessons l on s.reference_label='Aula: '||l.title where s.approved;
commit;
