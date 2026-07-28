-- RPC: get_top_sellers
-- Replaces the client-side aggregation (500-row fetch + JS loop) with a
-- single server-side GROUP BY that returns only 3 rows.
-- Apply via Supabase Studio → SQL Editor, or: supabase db push

CREATE OR REPLACE FUNCTION get_top_sellers(limit_count int DEFAULT 3)
RETURNS TABLE(user_id uuid, full_name text, location text, listing_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.user_id,
    p.full_name::text,
    p.location::text,
    count(*)::bigint AS listing_count
  FROM listings l
  JOIN profiles p ON p.id = l.user_id
  WHERE l.status = 'active'
  GROUP BY l.user_id, p.full_name, p.location
  ORDER BY listing_count DESC
  LIMIT limit_count;
$$;
