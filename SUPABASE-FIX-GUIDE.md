# Supabase Dashboard Fix Guide

**Issue:** Login works but redirect fails — browser shows "Failed to fetch"

---

## Fix 1: Add Redirect URLs (MOST LIKELY CAUSE)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **Authentication → URL Configuration**
3. In **Redirect URLs**, add these URLs (click "Add URL" for each):

```
https://dipesh-tutorials.vercel.app
https://dipesh-tutorials-git-main-yourusername.vercel.app
http://localhost
http://localhost:5173
http://localhost:4173
```

4. Click **Save**

> The deployed Vercel domain MUST be in this list, otherwise Supabase blocks the auth redirect response to the browser.

---

## Fix 2: Disable Email Confirmation

1. Go to **Authentication → Providers → Email**
2. Toggle **Confirm email** OFF
3. Save

> Without this, users created by admins can't log in until they click a confirmation link.

---

## Fix 3: Verify the Test User

1. Go to **Authentication → Users**
2. Find `dipesh@dipeshtutorials.com`
3. If status is "Pending", click "Confirm" or resend invite

---

## Fix 4: Check API Settings

1. Go to **Settings → API**
2. Confirm your Site URL matches the deployed URL
3. Confirm `VITE_SUPABASE_URL` in Vercel matches `Project URL` here
4. Confirm `VITE_SUPABASE_ANON_KEY` in Vercel matches `anon public` key here

---

After saving, clear browser cache and try logging in again.
