-- ============================================================
-- Dipesh Tutorials — Auth & RLS Fix
-- Run this AFTER schema.sql in Supabase SQL Editor
-- Fixes: profiles RLS, notification_reads, students extra policy
-- ============================================================

-- 1. PROFILES — make email readable by authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by authenticated" ON profiles;
CREATE POLICY "Profiles readable by authenticated"
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. PROFILES — allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users update own profile"
    FOR UPDATE USING (auth.uid() = id);

-- 3. PROFILES — allow INSERT (needed for auto-create on signup)
CREATE POLICY "Users insert own profile"
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. NOTIFICATIONS — fix notification_reads policy
-- The notification_reads table needs profile_id column to match auth.uid()
-- Check if profile_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notification_reads' AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE notification_reads ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. NOTIFICATIONS — allow authenticated users to read targeted notifications
DROP POLICY IF EXISTS "Read targeted notifications" ON notifications;
CREATE POLICY "Authenticated read targeted notifications"
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND (
            -- Check if user's profile role is in target_roles array
            (SELECT role FROM profiles WHERE id = auth.uid()) = ANY(target_roles)
            -- Or if user is admin/superadmin
            OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
        )
    );

-- 6. NOTIFICATIONS — allow authenticated to mark as read
DROP POLICY IF EXISTS "Manage own reads" ON notification_reads;
CREATE POLICY "Manage own notification reads"
    FOR ALL USING (auth.uid() = profile_id);

-- 7. ATTENDANCE — allow admins to do everything
DROP POLICY IF EXISTS "Admins manage attendance" ON attendance;
CREATE POLICY "Admins manage attendance"
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- 8. ATTENDANCE — students/parents can read own attendance
DROP POLICY IF EXISTS "Read own attendance" ON attendance;
CREATE POLICY "Read own attendance"
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM students
            WHERE profile_id = auth.uid() OR parent_profile_id = auth.uid()
        )
    );

-- 9. FEE_PAYMENTS — allow admins all access
DROP POLICY IF EXISTS "Admins manage fees" ON fee_payments;
CREATE POLICY "Admins manage fees"
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- 10. FEE_STRUCTURES — ensure readable by all authenticated
DROP POLICY IF EXISTS "Anyone can read fee structures" ON fee_structures;
CREATE POLICY "Authenticated read fee structures"
    FOR SELECT USING (auth.role() = 'authenticated');

-- 11. STANDARDS — ensure readable by all authenticated
DROP POLICY IF EXISTS "Anyone can read standards" ON standards;
CREATE POLICY "Authenticated read standards"
    FOR SELECT USING (auth.role() = 'authenticated');

-- 12. SUBJECTS — add policy if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Authenticated read subjects'
    ) THEN
        CREATE POLICY "Authenticated read subjects"
            FOR SELECT ON subjects USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 13. USERS — create additional test users for POC if they don't exist
-- Run via Supabase Dashboard > Authentication > Users > Add User
-- Or use this (one-time):
-- INSERT INTO auth.users (id, email, created_at)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'admin@demo.com', NOW())
-- ON CONFLICT (id) DO NOTHING;

PRINT 'RLS Fix applied successfully';
