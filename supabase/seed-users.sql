-- ============================================================
-- Dipesh Tutorials – POC Test User Accounts
-- ============================================================
-- 
-- PREREQUISITES:
--   1. schema.sql has been run
--   2. seed.sql has been run  
--   3. "Confirm email" is DISABLED in Supabase Auth settings
--      (Authentication > Providers > Email > disable "Confirm email")
--
-- HOW TO USE:
--   You CANNOT create auth users via SQL alone. You must create them
--   via the Supabase Dashboard or API. Follow these steps:
--
--   STEP 1: Create users in Supabase Dashboard > Authentication > Users > Add User
--           (or use the app's User Management page as superadmin)
--
--   STEP 2: After creating each user, run the matching UPDATE below
--           to set their role and name in the profiles table.
--
--   STEP 3: For parent/student accounts, link them to student records
--           using the UPDATE statements at the bottom.
--
-- ============================================================

-- ─── SUPERADMIN (create this user first) ────────────────────
-- Email: dipesh@dipeshtutorials.com | Password: DipeshSir2026!
-- Create via Dashboard, then run:
UPDATE profiles SET role = 'superadmin', name = 'Dipesh Sir'
    WHERE email = 'dipesh@dipeshtutorials.com';

-- ─── ADMIN STAFF ────────────────────────────────────────────
-- Email: admin@dipeshtutorials.com | Password: Admin2026!
-- Create via Dashboard, then run:
UPDATE profiles SET role = 'admin', name = 'Admin Staff'
    WHERE email = 'admin@dipeshtutorials.com';

-- ─── TEST PARENT ────────────────────────────────────────────
-- Email: parent@test.com | Password: Parent2026!
-- Create via Dashboard, then run:
UPDATE profiles SET role = 'parent', name = 'Mr. Rajesh Sharma'
    WHERE email = 'parent@test.com';

-- Link parent to Aarav Sharma (8th std, roll 1):
UPDATE students SET parent_profile_id = (
    SELECT id FROM profiles WHERE email = 'parent@test.com'
) WHERE name = 'Aarav Sharma' AND standard_id = 1;

-- ─── TEST STUDENT ───────────────────────────────────────────
-- Email: student@test.com | Password: Student2026!
-- Create via Dashboard, then run:
UPDATE profiles SET role = 'student', name = 'Aarav Sharma'
    WHERE email = 'student@test.com';

-- Link student account to Aarav Sharma:
UPDATE students SET profile_id = (
    SELECT id FROM profiles WHERE email = 'student@test.com'
) WHERE name = 'Aarav Sharma' AND standard_id = 1;

-- ============================================================
-- QUICK REFERENCE: POC Test Accounts
-- ============================================================
-- | Role       | Email                        | Password        |
-- |------------|------------------------------|-----------------|
-- | Superadmin | dipesh@dipeshtutorials.com    | DipeshSir2026!  |
-- | Admin      | admin@dipeshtutorials.com     | Admin2026!      |
-- | Parent     | parent@test.com               | Parent2026!     |
-- | Student    | student@test.com              | Student2026!    |
-- ============================================================
--
-- TESTING FLOW:
-- 1. Login as superadmin → full access to all 11 pages
-- 2. Login as admin → same as superadmin but no User Management
-- 3. Login as parent → sees Dashboard (child's attendance/test),
--    Billing (child's fees), Analytics, Notifications
-- 4. Login as student → sees Dashboard (own attendance/test),
--    Resources, Analytics, Course Mapping, Notifications
-- ============================================================
