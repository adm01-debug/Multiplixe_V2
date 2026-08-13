DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-admin-digest') THEN
    PERFORM cron.unschedule('weekly-admin-digest');
  END IF;
END $$;

SELECT cron.schedule(
  'weekly-admin-digest',
  '0 9 * * 1',
  $cron$
  SELECT net.http_post(
    url := 'https://gyqtndkjvwvtkfeaxtlv.supabase.co/functions/v1/weekly-admin-digest',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cXRuZGtqdnd2dGtmZWF4dGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzI0ODIsImV4cCI6MjA4MjE0ODQ4Mn0.rlyMsmdYyYIAjn7YSnIKgxpZJ9bYy6tzVPWw2xeaMpE"}'::jsonb,
    body := '{}'::jsonb
  );
  $cron$
);