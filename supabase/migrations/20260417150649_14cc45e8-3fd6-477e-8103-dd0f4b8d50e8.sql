-- Realtime hardening: protect realtime.messages so only authorized users
-- can subscribe to broadcasts for sensitive topics (security_alerts, notifications).
-- Topic convention used by clients: 'notifications:<user_id>' and 'security_alerts:admin'.

-- Ensure RLS is enabled on realtime.messages (Supabase already enables it, this is idempotent)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop legacy permissive policies if they exist
DROP POLICY IF EXISTS "realtime_messages_select_authenticated" ON realtime.messages;
DROP POLICY IF EXISTS "realtime_messages_insert_authenticated" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read own notification topic" ON realtime.messages;
DROP POLICY IF EXISTS "Admins can read security alert topic" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can publish to own notification topic" ON realtime.messages;
DROP POLICY IF EXISTS "Admins can publish to security alert topic" ON realtime.messages;

-- SELECT: a user may only read realtime messages on their own notifications topic
CREATE POLICY "Authenticated can read own notification topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'notifications:%' AND realtime.topic() = 'notifications:' || auth.uid()::text)
  OR (realtime.topic() LIKE 'security_alerts%' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  OR (realtime.topic() NOT LIKE 'notifications:%' AND realtime.topic() NOT LIKE 'security_alerts%')
);

-- INSERT (broadcast publish): same restriction
CREATE POLICY "Authenticated can publish to scoped topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE 'notifications:%' AND realtime.topic() = 'notifications:' || auth.uid()::text)
  OR (realtime.topic() LIKE 'security_alerts%' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  OR (realtime.topic() NOT LIKE 'notifications:%' AND realtime.topic() NOT LIKE 'security_alerts%')
);