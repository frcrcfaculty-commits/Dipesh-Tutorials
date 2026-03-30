# Dipesh Tutorials

Education management platform for coaching classes.

**Tech Stack:** React + Vite + Supabase + Capacitor (Android/iOS)

## Features
- Student management (add, edit, delete)
- Attendance marking & calendar view
- Test marks entry with auto-grading
- Fee tracking & payment recording
- Notifications (targeted by role/standard)
- Resource hub with file uploads
- Analytics dashboards
- User account management
- 4 roles: Super Admin, Admin, Student, Parent

## Quick Start

1. Clone this repo
2. `npm install`
3. Copy `.env.example` to `.env` and fill in Supabase credentials
4. `npm run dev`

## Deployment

See [SETUP-TONIGHT.md](SETUP-TONIGHT.md) for full deployment instructions.

## Database

Run `supabase/schema.sql` then `supabase/seed.sql` in your Supabase SQL Editor.

## Mobile

```bash
npm run build
npx cap sync android
npx cap open android
```
