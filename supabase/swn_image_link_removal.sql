alter table public.swn_image_links add column deleted_at timestamptz;
alter table public.swn_image_links add constraint swn_deleted_link_inactive check (deleted_at is null or active=false);
