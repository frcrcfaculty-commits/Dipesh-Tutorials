# Supabase Auth — User Setup

Since seed.sql only creates database records (not Auth accounts), you need to create the Supabase Auth users before anyone can log in.

---

## Option 1: Create Users Manually (Quickest)

Go to **Supabase Dashboard → Authentication → Users → Add User** for each:

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Super Admin | `dipesh@dipeshtutorials.com` | `Dipesh@123` | Set role = `superadmin` in DB after |
| Admin | `admin@dipeshtutorials.com` | `Admin@123` | Set role = `admin` in DB after |
| Student | `student1@dipeshtutorials.com` | `Student@123` | Link to student record in DB |
| Parent | `parent1@dipeshtutorials.com` | `Parent@123` | Link to parent profile in DB |

After creating each user, go to **Supabase Dashboard → Table Editor → profiles** and set their correct `role` (`superadmin`, `admin`, `student`, `parent`).

---

## Option 2: Disable Sign Up + Create via Invites (Recommended)

1. **Supabase Dashboard → Authentication → Providers → Email**
   - Disable "Confirm email" (for POC — so admin-created users login immediately)
   - Disable "Secure email change"

2. **Supabase Dashboard → Authentication → Users → Invite User**
   - Invite `dipesh@dipeshtutorials.com` — they'll get an email invite
   - Accept invite and set password

---

## Option 3: Public Sign Up (For Testing)

Let users register themselves:

1. Supabase Dashboard → Authentication → Providers → Email → Enable "Allow new users to sign up"
2. Visit the app → Sign Up page → Register
3. Then manually set their `role` in the `profiles` table

---

## After Users Are Created

Update each user's profile role in **Supabase Table Editor → profiles**:

```sql
UPDATE profiles SET role = 'superadmin' WHERE email = 'dipesh@dipeshtutorials.com';
UPDATE profiles SET role = 'admin' WHERE email = 'admin@dipeshtutorials.com';
UPDATE profiles SET role = 'student' WHERE email = 'student1@dipeshtutorials.com';
UPDATE profiles SET role = 'parent' WHERE email = 'parent1@dipeshtutorials.com';
```

Run these in **Supabase Dashboard → SQL Editor**.

---

## Quickest Path for POC Demo

1. Go to Supabase Dashboard → Authentication → Users
2. Click **"Add User"** → enter `dipesh@dipeshtutorials.com` / `Dipesh@123`
3. Click **"Add User"** → enter `admin@dipeshtutorials.com` / `Admin@123`
4. Open SQL Editor and run:

```sql
INSERT INTO profiles (id, email, name, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'dipesh@dipeshtutorials.com', 'Dipesh Sir', 'superadmin'),
  ('00000000-0000-0000-0000-000000000002', 'admin@dipeshtutorials.com', 'Admin', 'admin');
```

*(Note: The UUIDs above are placeholders — Supabase will auto-generate real ones. Use actual IDs from the auth.users table)*

---

## Finding User UUIDs

After creating users in Authentication, their UUID is shown in the user list. Use that UUID when setting up the `profiles` and `students`/`parents` tables.

