begin;

create table public.api_rate_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null check (
    bucket ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and char_length(bucket) between 3 and 64
  ),
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket, window_start)
);

alter table public.api_rate_limits enable row level security;
alter table public.api_rate_limits force row level security;
revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_window_start timestamptz;
  v_count integer;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;
  if p_bucket is null
    or p_bucket !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or char_length(p_bucket) not between 3 and 64
    or p_limit not between 1 and 1000
    or p_window_seconds not between 10 and 86400 then
    raise exception 'invalid rate limit parameters';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from statement_timestamp()) / p_window_seconds)
      * p_window_seconds
  );

  insert into public.api_rate_limits(
    user_id, bucket, window_start, request_count
  ) values (
    v_user_id, p_bucket, v_window_start, 1
  )
  on conflict(user_id, bucket, window_start) do update set
    request_count = public.api_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  delete from public.api_rate_limits
  where user_id = v_user_id
    and window_start < now() - interval '2 days';

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer)
from public;
grant execute on function public.consume_api_rate_limit(text, integer, integer)
to authenticated;

commit;
