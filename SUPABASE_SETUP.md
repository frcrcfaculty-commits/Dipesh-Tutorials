# Walk-In Tables — Supabase Setup

## Run in Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/upkhlhoyzvzblqilyfpu/sql/new

Run this entire block:

```sql
-- ─── WALK-IN VISITS ─────────────────────────────────────────
create table if not exists walk_in_visits (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references students(id) on delete cascade not null,
    visited_at timestamptz default now() not null,
    visited_by uuid references profiles(id),
    summary text,
    is_active boolean default true,
    created_at timestamptz default now()
);

-- ─── WALK-IN NOTES ──────────────────────────────────────────
create table if not exists walk_in_notes (
    id uuid primary key default uuid_generate_v4(),
    visit_id uuid references walk_in_visits(id) on delete cascade not null,
    note_text text not null,
    note_type text default 'general' check (note_type in ('general','academic','fee','attendance','behavioral','other')),
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- RLS
alter table walk_in_visits enable row level security;
create policy "Admins manage walk_in_visits" on walk_in_visits
    for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')));
create policy "Read own visits" on walk_in_visits
    for select using (visited_by = auth.uid());

alter table walk_in_notes enable row level security;
create policy "Admins manage walk_in_notes" on walk_in_notes
    for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')));
create policy "Read own notes" on walk_in_notes
    for select using (created_by = auth.uid());

create index idx_walk_in_visits_student on walk_in_visits(student_id);
create index idx_walk_in_notes_visit on walk_in_notes(visit_id);
```

After running, the Walk-In page will be fully functional.
