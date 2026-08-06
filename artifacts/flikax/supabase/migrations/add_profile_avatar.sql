-- Seller-uploaded profile photo, shown wherever seller identity renders
-- (falls back to initials when null). See its own migration comment in
-- add_profile_bio.sql for the same reasoning re: get_public_seller_profile
-- needing drop+recreate rather than a plain replace.
alter table public.profiles
  add column if not exists avatar_url text;

-- Public bucket, same as listing-images/homepage-slides: avatars are meant
-- to be publicly visible, so there's no SELECT policy needed -- Storage
-- serves public-bucket objects via their public URL without going through
-- RLS at all. file_size_limit is a hard server-side cap (5MB) independent
-- of the app's own client-side validation. INSERT/DELETE are scoped to the
-- uploader's own folder, mirroring listing-images' existing policies
-- exactly ("Authenticated users can upload their own listing images").
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Authenticated users can upload their own avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- get_public_seller_profile gains avatar_url alongside the bio field added
-- in add_profile_bio.sql.
drop function if exists public.get_public_seller_profile(uuid);

create function public.get_public_seller_profile(p_user_id uuid)
returns table(id uuid, full_name text, location text, verified boolean, member_since timestamptz, bio text, avatar_url text)
language sql
stable security definer
set search_path to 'public'
as $function$
  select p.id, p.full_name, p.location, p.verified, p.created_at as member_since, p.bio, p.avatar_url
  from public.profiles p
  where p.id = p_user_id
    and exists (
      select 1 from public.listings l
      where l.user_id = p.id and l.status = 'active'
    );
$function$;

-- get_top_sellers (the homepage "Top sellers this week" widget) also only
-- ever showed initials -- extending it the same way keeps that surface
-- consistent with everywhere else seller identity renders.
drop function if exists public.get_top_sellers(integer);

create function public.get_top_sellers(limit_count integer default 3)
returns table(user_id uuid, full_name text, location text, listing_count bigint, avatar_url text)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    l.user_id,
    p.full_name::text,
    p.location::text,
    count(*)::bigint as listing_count,
    p.avatar_url::text
  from listings l
  join profiles p on p.id = l.user_id
  where l.status = 'active'
  group by l.user_id, p.full_name, p.location, p.avatar_url
  order by listing_count desc
  limit limit_count;
$function$;
