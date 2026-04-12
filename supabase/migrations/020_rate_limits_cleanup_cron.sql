-- Schedule daily cleanup of rate_limits to prevent unbounded growth.
-- Uses pg_cron (available on all Supabase tiers). Rate limit windows are
-- measured in seconds/minutes, so anything older than 1 day is definitely
-- expired and safe to delete.
--
-- Note: if `create extension` fails with a permission error, enable pg_cron
-- first via Supabase Dashboard → Database → Extensions → search "pg_cron"
-- → toggle on, then re-run this migration.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotent: unschedule existing job before (re)creating.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-rate-limits') THEN
    PERFORM cron.unschedule('cleanup-rate-limits');
  END IF;
END $$;

-- Run daily at 03:00 UTC (10:00 ICT — low-traffic window for VN SMEs).
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 3 * * *',
  $$DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'$$
);
