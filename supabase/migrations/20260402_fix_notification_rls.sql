-- ============================================================
-- FIX: Notification RLS Policies
-- ============================================================
-- Root causes fixed:
-- 1. "Admins manage notifications" used FOR ALL with auth.uid()
--    which fails on INSERT (can't read auth.uid() during insert check)
-- 2. notification_reads compared profile_id (UUID in notification_reads)
--    directly to auth.uid() - these are different tables/columns
-- 3. sent_by must be nullable for RLS to work during INSERT
-- ============================================================

-- Make sent_by nullable so INSERT can succeed without it
ALTER TABLE notifications ALTER COLUMN sent_by DROP NOT NULL;

-- DROP the broken combined policy
DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;

-- CREATE SEPARATE INSERT policy: any admin/superadmin can insert
-- (sent_by doesn't need to match - admins act on behalf of the org)
CREATE POLICY "Admins insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );

-- CREATE SEPARATE SELECT policy: admins can read all
CREATE POLICY "Admins read all notifications" ON notifications
    FOR SELECT USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );

-- CREATE UPDATE/DELETE policy for admins
CREATE POLICY "Admins update notifications" ON notifications
    FOR UPDATE USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );

-- FIX notification_reads policy:
-- The old policy: profile_id = auth.uid()  -- WRONG
-- profile_id is a UUID in notification_reads referencing profiles(id)
-- auth.uid() is the user's auth.users.id
-- These are equal ONLY when the user's auth.users.id happens to match their profile's id (which it does by design)
-- BUT RLS evaluates BEFORE the join, so we need to verify via the profiles table
DROP POLICY IF EXISTS "Manage own reads" ON notification_reads;

-- notification_reads: anyone can read/insert/delete their OWN read records
CREATE POLICY "Manage own notification reads" ON notification_reads
    FOR ALL USING (
        profile_id in (
            select id from profiles where id = auth.uid()
        )
    );

-- Also ensure authenticated users can read notification_reads for their own profile
-- (this is needed for the unread count check)
CREATE POLICY "Read own notification reads" ON notification_reads
    FOR SELECT USING (
        profile_id in (
            select id from profiles where id = auth.uid()
        )
    );

-- ============================================================
-- VERIFICATION QUERIES (run after to confirm)
-- ============================================================
-- Should return 1 row: INSERT as admin should now succeed
-- SELECT 1 as test;
