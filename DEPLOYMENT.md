# Dipesh Tutorials - Production Deployment Guide

## What You Get

A complete coaching class management platform with:
- Website (React + Vite) hosted free on Vercel
- Android APK (Capacitor) - sideload directly
- iOS app (Capacitor) - needs Mac + Apple account
- Backend (Supabase free tier) - PostgreSQL, auth, storage

### All Features Working:
- Real email/password authentication with 4 roles
- Add/edit/delete students with parent details
- Mark attendance by date and standard (P/L/A)
- Enter test marks per subject, auto-grade computation
- Record fee payments with receipt tracking
- Send targeted notifications to parents/students/staff
- Upload resources with file storage
- Analytics dashboards with charts
- Course outcome tracking
- CSV export everywhere

---

## STEP 1: Supabase Setup (15 min)

1. Go to supabase.com, create free account
2. New Project: name=dipesh-tutorials, region=South Asia (Mumbai)
3. Wait 2 min, then go to SQL Editor
4. Paste ENTIRE contents of supabase/schema.sql, click Run
5. Go to Settings > API, copy Project URL and anon key
6. Go to Storage, create public bucket called "resources"

### Create Super Admin:
1. Authentication > Users > Add User
   - Email: dipesh@dipeshtutorials.com, set password
2. SQL Editor, run:
   ```sql
   UPDATE profiles SET role='superadmin', name='Dipesh Sir'
   WHERE email='dipesh@dipeshtutorials.com';
   ```

---

## STEP 2: Deploy Website (10 min)

1. Push to GitHub
2. Go to vercel.com, import repo
3. Add env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
4. Deploy - live at https://your-project.vercel.app

---

## STEP 3: Android APK (20 min)

```bash
npm install
cp .env.example .env  # fill in Supabase credentials
npm run build
npx cap sync android
npx cap open android
```
In Android Studio: Build > Generate Signed APK

---

## STEP 4: iOS (requires Mac + Xcode)

```bash
npm run build
npx cap sync ios
npx cap open ios
```

---

## Monthly Cost: Rs 0

Supabase free: 500MB DB, 50K users
Vercel free: 100GB bandwidth
Android sideload: free
