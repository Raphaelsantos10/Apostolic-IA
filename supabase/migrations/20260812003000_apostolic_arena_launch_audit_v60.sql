begin;
create or replace function public.arena_admin_launch_audit() returns jsonb language plpgsql security definer set search_path='' as $$declare v_user uuid:=(select auth.uid());begin if v_user is null or not exists(select 1 from public.arena_admins where user_id=v_user) then raise exception 'administrator required';end if;return jsonb_build_object(
 'negative_wallets',(select count(*) from public.arena_player_wallets where coins<0 or gems<0),
 'stale_pending_receipts',(select count(*) from public.arena_purchase_receipts where status='pending' and created_at<now()-interval '24 hours'),
 'paid_without_provider_reference',(select count(*) from public.arena_purchase_receipts where status='paid' and(provider_checkout_session_id is null or provider_payment_intent_id is null)),
 'orphan_inventory',(select count(*) from public.arena_player_inventory i where not exists(select 1 from public.arena_shop_products p where p.id=i.product_id)),
 'invalid_inventory_quantity',(select count(*) from public.arena_player_inventory where quantity<1),
 'stale_refund_requests',(select count(*) from public.arena_refund_requests where status='under_review' and created_at<now()-interval '7 days'),
 'checked_at',now());end;$$;
revoke all on function public.arena_admin_launch_audit() from public;grant execute on function public.arena_admin_launch_audit() to authenticated;
commit;
