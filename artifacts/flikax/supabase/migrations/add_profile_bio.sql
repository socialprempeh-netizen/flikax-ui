-- Adds a short seller bio field, editable by the profile owner via Settings
-- and shown on the public seller-store page (/seller/[id]). Length capped
-- the same way profile_feedback.message already is, to keep the column
-- itself from being abused as an unbounded text dump.
alter table public.profiles
  add column if not exists bio text
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500);

-- get_public_seller_profile's return columns are changing (adding bio), so
-- the function has to be dropped and recreated rather than just replaced --
-- Postgres doesn't allow CREATE OR REPLACE to change a function's return
-- type/column list.
drop function if exists public.get_public_seller_profile(uuid);

create function public.get_public_seller_profile(p_user_id uuid)
returns table(id uuid, full_name text, location text, verified boolean, member_since timestamptz, bio text)
language sql
stable security definer
set search_path to 'public'
as $function$
  select p.id, p.full_name, p.location, p.verified, p.created_at as member_since, p.bio
  from public.profiles p
  where p.id = p_user_id
    and exists (
      select 1 from public.listings l
      where l.user_id = p.id and l.status = 'active'
    );
$function$;
