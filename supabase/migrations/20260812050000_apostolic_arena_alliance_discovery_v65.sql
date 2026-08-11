begin;
create or replace function public.arena_browse_alliances(p_query text default '',p_limit integer default 12) returns jsonb language sql stable security definer set search_path = '' as $$
select coalesce(jsonb_agg(x order by weekly_glory desc,member_count desc),'[]'::jsonb) from(
 select a.id,a.name,a.tag,a.description,a.emblem_id,public.arena_alliance_effective_emblem(a.id) effective_emblem_id,a.visibility,a.level,a.weekly_glory,a.max_members,count(m.user_id)::integer member_count,r.id pending_request_id
 from public.arena_alliances a left join public.arena_alliance_members m on m.alliance_id=a.id
 left join public.arena_alliance_join_requests r on r.alliance_id=a.id and r.user_id=(select auth.uid()) and r.status='pending'
 where a.visibility in('open','approval') and(trim(p_query)=''or a.name ilike'%'||trim(p_query)||'%'or a.tag ilike'%'||trim(p_query)||'%')
 group by a.id,r.id order by a.weekly_glory desc,count(m.user_id)desc limit least(greatest(p_limit,1),30)
)x;
$$;
create or replace function public.arena_cancel_alliance_request(p_request_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());v_count integer;
begin
 if v_user is null then raise exception 'authentication required';end if;
 update public.arena_alliance_join_requests set status='cancelled',reviewed_at=now() where id=p_request_id and user_id=v_user and status='pending';
 get diagnostics v_count=row_count;if v_count=0 then raise exception 'request unavailable';end if;
 return jsonb_build_object('cancelled',true,'request_id',p_request_id);
end;
$$;
revoke all on function public.arena_browse_alliances(text,integer),public.arena_cancel_alliance_request(uuid) from public;
grant execute on function public.arena_browse_alliances(text,integer),public.arena_cancel_alliance_request(uuid) to authenticated;
commit;
