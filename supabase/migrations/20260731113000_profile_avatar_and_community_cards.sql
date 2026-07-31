begin;

alter table public.profiles
  add column if not exists avatar_url text
  check (avatar_url is null or char_length(avatar_url) <= 500);

grant update (avatar_url) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "profile_avatars_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_update_own"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-avatars'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "profile_avatars_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-avatars'
  and owner_id = (select auth.uid())::text
);

create or replace view public.community_profile_cards
with (security_barrier = true)
as
select id, display_name, avatar_url
from public.profiles
where status = 'active';

revoke all on public.community_profile_cards from anon, public;
grant select on public.community_profile_cards to authenticated;

comment on view public.community_profile_cards is
  'Campos públicos mínimos usados para identificar autores na comunidade.';

commit;
