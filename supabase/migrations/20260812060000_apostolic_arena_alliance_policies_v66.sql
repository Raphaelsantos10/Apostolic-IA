begin;
create or replace function public.arena_get_alliance_settings() returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());v_alliance uuid;v_role text;
begin
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null then raise exception 'alliance required';end if;
 return(select jsonb_build_object('name',name,'tag',tag,'description',description,'visibility',visibility,'min_trophies',min_trophies,'can_edit',v_role in('founder','elder'))from public.arena_alliances where id=v_alliance);
end;
$$;
create or replace function public.arena_update_alliance_settings(p_description text,p_visibility text,p_min_trophies integer) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());v_alliance uuid;v_role text;
begin
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null or v_role not in('founder','elder')then raise exception 'alliance manager required';end if;
 if p_visibility not in('open','approval','invite')or p_min_trophies not between 0 and 100000 then raise exception 'invalid settings';end if;
 update public.arena_alliances set description=left(trim(coalesce(p_description,'')),240),visibility=p_visibility,min_trophies=p_min_trophies,updated_at=now()where id=v_alliance;
 insert into public.arena_alliance_moderation_log(alliance_id,actor_id,action,details)values(v_alliance,v_user,'policy_changed',jsonb_build_object('visibility',p_visibility,'min_trophies',p_min_trophies));
 return jsonb_build_object('updated',true,'visibility',p_visibility,'min_trophies',p_min_trophies);
end;
$$;
create or replace function public.arena_revoke_alliance_invite(p_code text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user uuid := (select auth.uid());v_alliance uuid;v_role text;v_count integer;
begin
 select alliance_id,role into v_alliance,v_role from public.arena_alliance_members where user_id=v_user;
 if v_alliance is null or v_role not in('founder','elder')then raise exception 'alliance manager required';end if;
 update public.arena_alliance_invites set active=false where alliance_id=v_alliance and code=upper(trim(p_code))and active;get diagnostics v_count=row_count;
 if v_count=0 then raise exception 'invite unavailable';end if;
 return jsonb_build_object('revoked',true,'code',upper(trim(p_code)));
end;
$$;
revoke all on function public.arena_get_alliance_settings(),public.arena_update_alliance_settings(text,text,integer),public.arena_revoke_alliance_invite(text)from public;
grant execute on function public.arena_get_alliance_settings(),public.arena_update_alliance_settings(text,text,integer),public.arena_revoke_alliance_invite(text)to authenticated;
commit;
