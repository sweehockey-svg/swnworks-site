alter table public.swn_image_submissions alter column link_id drop not null;
alter table public.swn_image_submissions add column source_label text;
