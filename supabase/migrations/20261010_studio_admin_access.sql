create or replace function public.swn_studio_admin_access()
returns boolean language sql stable security invoker set search_path = ''
as $function$
  select exists (
    select 1 from public.seh_current_writer() w
    where lower(w.role) = 'admin' and lower(w.display_name) = 'eswahn'
  );
$function$;
revoke all on function public.swn_studio_admin_access() from public;
grant execute on function public.swn_studio_admin_access() to anon, authenticated;
alter policy "broadcast studio state public insert studios" on public.broadcast_studio_state
to authenticated with check (
  channel = any(array['sec21-bronze-test','broadcast-en','broadcast-fi','broadcast-de']::text[])
  and public.swn_studio_admin_access()
);
alter policy "broadcast studio state public update studios" on public.broadcast_studio_state
to authenticated using (
  channel = any(array['sec21-bronze-test','broadcast-en','broadcast-fi','broadcast-de']::text[])
  and public.swn_studio_admin_access()
) with check (
  channel = any(array['sec21-bronze-test','broadcast-en','broadcast-fi','broadcast-de']::text[])
  and public.swn_studio_admin_access()
);
revoke insert, update, delete on public.broadcast_studio_state from anon;
revoke execute on function public.broadcast_studio_set_scene(text,text,text) from public, anon;
grant execute on function public.broadcast_studio_set_scene(text,text,text) to authenticated;
