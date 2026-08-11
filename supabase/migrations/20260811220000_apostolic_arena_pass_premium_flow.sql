begin;

create or replace function public.arena_claim_available_pass_rewards()
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_user uuid:=(select auth.uid());v_pass public.arena_player_passes%rowtype;v_level public.arena_pass_levels%rowtype;v_claimed integer:=0;
begin
 if v_user is null then raise exception 'authentication required';end if;
 select p.* into v_pass from public.arena_player_passes p join public.arena_seasons s on s.id=p.season_id where p.user_id=v_user and s.active and now()>=s.starts_at and now()<s.ends_at for update;
 if not found then raise exception 'pass unavailable';end if;
 for v_level in select * from public.arena_pass_levels where season_id=v_pass.season_id and xp_required<=v_pass.xp order by level loop
  if v_level.free_reward is not null and not exists(select 1 from public.arena_pass_claims where user_id=v_user and season_id=v_pass.season_id and level=v_level.level and track='free') then perform public.arena_claim_pass_reward(v_level.level,'free');v_claimed:=v_claimed+1;end if;
  if v_pass.premium and v_level.premium_reward is not null and not exists(select 1 from public.arena_pass_claims where user_id=v_user and season_id=v_pass.season_id and level=v_level.level and track='premium') then perform public.arena_claim_pass_reward(v_level.level,'premium');v_claimed:=v_claimed+1;end if;
 end loop;
 return jsonb_build_object('claimed_count',v_claimed,'status',public.arena_get_pass_status());
end;
$$;

revoke all on function public.arena_claim_available_pass_rewards() from public;
grant execute on function public.arena_claim_available_pass_rewards() to authenticated;

commit;
