-- ============================================================
-- Dipesh Tutorials – Complete Production Database Schema
-- Supabase (PostgreSQL) with Row Level Security
-- ============================================================
--
-- IMPORTANT: After running this schema, do these steps:
--
-- 1. Go to Authentication > Providers > Email:
--    - DISABLE "Confirm email" toggle (so admin-created users can login immediately)
--    - DISABLE "Secure email change" if you want simpler UX
--
-- 2. Go to Storage > New Bucket:
--    - Create bucket named "resources" with Public access
--
-- 3. Create superadmin user: Authentication > Users > Add User
--    Then run: UPDATE profiles SET role='superadmin', name='Dipesh Sir' WHERE email='your@email.com';
--
-- 4. Run seed.sql for sample data (optional but recommended for POC demo)
--
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ─── ENUMS ─────────────────────────────────────────────────
create type user_role as enum ('superadmin', 'admin', 'student', 'parent');
create type fee_status as enum ('paid', 'pending', 'overdue');
create type attendance_status as enum ('present', 'late', 'absent');
create type notification_type as enum ('general', 'fee', 'attendance', 'resource', 'exam');
create type resource_type as enum ('PDF Notes', 'Video', 'MCQ Set', 'PPT', 'Notes');

-- ─── PROFILES (extends Supabase auth.users) ────────────────
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique not null,
    name text not null,
    phone text,
    role user_role not null default 'student',
    avatar_url text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ─── STANDARDS ─────────────────────────────────────────────
create table standards (
    id serial primary key,
    name text unique not null,
    sort_order int default 0
);

insert into standards (name, sort_order) values
    ('8th', 1), ('9th', 2), ('10th', 3),
    ('11th Commerce', 4), ('12th Commerce', 5),
    ('11th Science', 6), ('12th Science', 7);

-- ─── SUBJECTS ──────────────────────────────────────────────
create table subjects (
    id serial primary key,
    name text not null,
    standard_id int references standards(id) on delete cascade,
    unique(name, standard_id)
);

insert into subjects (name, standard_id)
select s.name, st.id from (values
    ('Mathematics'), ('Science'), ('English'), ('Hindi'), ('Marathi'), ('Social Studies')
) as s(name), standards st where st.name in ('8th','9th','10th');

insert into subjects (name, standard_id)
select s.name, st.id from (values
    ('Accountancy'), ('Economics'), ('Business Studies'), ('English'), ('Maths/SP')
) as s(name), standards st where st.name in ('11th Commerce','12th Commerce');

insert into subjects (name, standard_id)
select s.name, st.id from (values
    ('Physics'), ('Chemistry'), ('Mathematics'), ('Biology'), ('English')
) as s(name), standards st where st.name in ('11th Science','12th Science');

-- ─── STUDENTS ──────────────────────────────────────────────
create table students (
    id uuid primary key default uuid_generate_v4(),
    profile_id uuid references profiles(id) on delete set null,
    roll_no int not null,
    name text not null,
    gender text check (gender in ('Male','Female','Other')),
    standard_id int references standards(id) on delete restrict,
    date_of_birth date,
    address text,
    parent_name text,
    parent_phone text,
    parent_email text,
    parent_profile_id uuid references profiles(id) on delete set null,
    enrollment_date date default current_date,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(roll_no, standard_id)
);

-- ─── FEES ──────────────────────────────────────────────────
create table fee_structures (
    id serial primary key,
    standard_id int references standards(id) on delete cascade,
    academic_year text not null default '2025-26',
    total_amount numeric(10,2) not null,
    unique(standard_id, academic_year)
);

create table fee_payments (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references students(id) on delete cascade,
    amount numeric(10,2) not null,
    payment_date date default current_date,
    payment_method text default 'cash',
    receipt_no text,
    notes text,
    recorded_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- ─── FEE CONFIG ───────────────────────────────────────────
-- Controls which academic year the student_fee_summary uses
create table if not exists academic_year_config (
    id serial primary key,
    academic_year text not null default '2025-26',
    is_active boolean default true
);

-- Seed default if empty
insert into academic_year_config (academic_year, is_active)
select '2025-26', true
where not exists (select 1 from academic_year_config);

create or replace view student_fee_summary as
select
    s.id as student_id,
    s.name as student_name,
    st.name as standard_name,
    fs.total_amount as total_fees,
    coalesce(sum(fp.amount), 0)::numeric as paid_fees,
    coalesce(fs.total_amount, 0)::numeric - coalesce(sum(fp.amount), 0)::numeric as balance,
    case
        when coalesce(fs.total_amount, 0) = 0 then 'pending'::text
        when coalesce(sum(fp.amount), 0) >= coalesce(fs.total_amount, 0) then 'paid'::text
        when coalesce(sum(fp.amount), 0) > 0 then 'pending'::text
        else 'overdue'::text
    end as status
from students s
join standards st on s.standard_id = st.id
left join fee_structures fs on s.standard_id = fs.standard_id
    and fs.academic_year = (select academic_year from academic_year_config where is_active = true limit 1)
left join fee_payments fp on s.id = fp.student_id
where s.is_active = true
group by s.id, s.name, st.name, fs.total_amount;

-- ─── ATTENDANCE ────────────────────────────────────────────
create table attendance (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references students(id) on delete cascade,
    date date not null default current_date,
    status attendance_status not null default 'present',
    arrival_time time,
    method text default 'manual',
    marked_by uuid references profiles(id),
    created_at timestamptz default now(),
    unique(student_id, date)
);

-- ─── TESTS & RESULTS ──────────────────────────────────────
create table tests (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    standard_id int references standards(id) on delete cascade,
    test_date date not null,
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

create table test_results (
    id uuid primary key default uuid_generate_v4(),
    test_id uuid references tests(id) on delete cascade,
    student_id uuid references students(id) on delete cascade,
    subject_id int references subjects(id) on delete cascade,
    marks_obtained numeric(5,2) not null default 0,
    max_marks numeric(5,2) not null default 100,
    grade text,
    entered_by uuid references profiles(id),
    created_at timestamptz default now(),
    unique(test_id, student_id, subject_id)
);

-- Auto-compute grade
create or replace function compute_grade()
returns trigger as $$
begin
    new.grade := case
        when (new.marks_obtained / nullif(new.max_marks,0)) * 100 >= 90 then 'A+'
        when (new.marks_obtained / nullif(new.max_marks,0)) * 100 >= 75 then 'A'
        when (new.marks_obtained / nullif(new.max_marks,0)) * 100 >= 60 then 'B+'
        when (new.marks_obtained / nullif(new.max_marks,0)) * 100 >= 50 then 'B'
        when (new.marks_obtained / nullif(new.max_marks,0)) * 100 >= 35 then 'C'
        when (new.marks_obtained / nullif(new.max_marks,0)) * 100 >= 20 then 'D'
        else 'F'
    end;
    return new;
end;
$$ language plpgsql;

create trigger trg_compute_grade
    before insert or update on test_results
    for each row execute function compute_grade();

-- ─── NOTIFICATIONS ─────────────────────────────────────────
create table notifications (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    message text not null,
    type notification_type default 'general',
    target_roles user_role[] not null default '{student,parent}',
    target_standard_id int references standards(id) on delete set null,
    sent_by uuid references profiles(id),
    created_at timestamptz default now()
);

create table notification_reads (
    id uuid primary key default uuid_generate_v4(),
    notification_id uuid references notifications(id) on delete cascade,
    profile_id uuid references profiles(id) on delete cascade,
    read_at timestamptz default now(),
    unique(notification_id, profile_id)
);

-- ─── RESOURCES ─────────────────────────────────────────────
create table resources (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    type resource_type not null,
    subject_id int references subjects(id) on delete set null,
    standard_id int references standards(id) on delete cascade,
    file_url text,
    tags text[] default '{}',
    is_missed_lecture boolean default false,
    uploaded_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
alter table profiles enable row level security;
alter table students enable row level security;
alter table attendance enable row level security;
alter table tests enable row level security;
alter table test_results enable row level security;
alter table notifications enable row level security;
alter table notification_reads enable row level security;
alter table fee_payments enable row level security;
alter table resources enable row level security;

-- Profiles: users can read all profiles, update own
create policy "Profiles are viewable by authenticated" on profiles
    for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on profiles
    for update using (auth.uid() = id);

-- Students: admins can CRUD, parents/students can read relevant
create policy "Admins manage students" on students
    for all using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );
create policy "Parents read own children" on students
    for select using (parent_profile_id = auth.uid());
create policy "Students read self" on students
    for select using (profile_id = auth.uid());

-- Attendance: admins insert/update, all authenticated read
create policy "Admins manage attendance" on attendance
    for all using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );
create policy "Read own attendance" on attendance
    for select using (
        student_id in (select id from students where profile_id = auth.uid() or parent_profile_id = auth.uid())
    );

-- Tests: admins manage, all read
create policy "Admins manage tests" on tests
    for all using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );
create policy "All read tests" on tests
    for select using (auth.role() = 'authenticated');

-- Test Results: admins manage, relevant users read
create policy "Admins manage results" on test_results
    for all using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );
create policy "Read own results" on test_results
    for select using (
        student_id in (select id from students where profile_id = auth.uid() or parent_profile_id = auth.uid())
    );

-- Notifications: admins create (INSERT), all targeted roles read (SELECT), admins update/delete
-- sent_by auto-defaults to auth.uid() so admins don't need to pass it from the app
create policy "Admins insert notifications" on notifications
    for insert with check (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );
create policy "Read targeted notifications" on notifications
    for select using (
        exists (select 1 from profiles where id = auth.uid() and role = any(target_roles))
    );
create policy "Admins update notifications" on notifications
    for update using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );
create policy "Admins delete notifications" on notifications
    for delete using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );

-- Notification Reads: users manage only their own read status
create policy "Manage own notification reads" on notification_reads
    for all using (profile_id = auth.uid());

-- Fee Payments: admins manage, parents/students read own
create policy "Admins manage fees" on fee_payments
    for all using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );
create policy "Read own fees" on fee_payments
    for select using (
        student_id in (select id from students where profile_id = auth.uid() or parent_profile_id = auth.uid())
    );

-- Resources: admins manage, students read by standard
create policy "Admins manage resources" on resources
    for all using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
    );
create policy "Students read resources" on resources
    for select using (auth.role() = 'authenticated');

-- ─── HELPER FUNCTIONS ──────────────────────────────────────

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
    insert into profiles (id, email, name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles for each row execute function update_updated_at();
create trigger trg_students_updated_at before update on students for each row execute function update_updated_at();

-- ─── INDEXES ───────────────────────────────────────────────
create index idx_students_standard on students(standard_id);
create index idx_students_parent on students(parent_profile_id);
create index idx_attendance_student_date on attendance(student_id, date);
create index idx_attendance_date on attendance(date);
create index idx_test_results_test on test_results(test_id);
create index idx_test_results_student on test_results(student_id);
create index idx_notifications_created on notifications(created_at desc);
create index idx_fee_payments_student on fee_payments(student_id);
create index idx_resources_standard on resources(standard_id);

-- ─── SEED DEFAULT ADMIN ────────────────────────────────────
-- After running this schema, create the superadmin user via Supabase Auth,
-- then update their profile role:
-- update profiles set role = 'superadmin' where email = 'dipesh@dipeshtutorials.com';

-- Default fee structures
insert into fee_structures (standard_id, academic_year, total_amount)
select id, '2025-26', case
    when name in ('11th Commerce','11th Science','12th Commerce','12th Science') then 35000
    else 25000
end from standards;

-- ─── ADDITIONAL RLS POLICIES ──────────────────────────────
-- Allow authenticated users to read student IDs for RLS subquery resolution
-- (prevents circular dependency when attendance/test_results/fees policies
-- reference students table via subqueries)
create policy "Authenticated read student ids for RLS" on students
    for select using (auth.role() = 'authenticated');

-- Reference tables: enable RLS with open read for clarity
alter table standards enable row level security;
create policy "Anyone can read standards" on standards
    for select using (true);

alter table subjects enable row level security;
create policy "Anyone can read subjects" on subjects
    for select using (true);

alter table fee_structures enable row level security;
create policy "Anyone can read fee structures" on fee_structures
    for select using (true);


-- ============================================================
-- Additional constraints (added for data integrity sprint)
-- Run separately if database already has data
-- ============================================================
DO $$ BEGIN
    ALTER TABLE students ADD CONSTRAINT chk_roll_no_positive CHECK (roll_no > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE test_results ADD CONSTRAINT chk_marks_valid CHECK (marks_obtained >= 0 AND marks_obtained <= max_marks);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE test_results ADD CONSTRAINT chk_max_marks_positive CHECK (max_marks > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE fee_payments ADD CONSTRAINT chk_payment_positive CHECK (amount > 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── WALK-IN VISITS (Step 4) ────────────────────────────────
-- Tracks every walk-in session for a student
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
-- Individual notes taken during a walk-in session
create table if not exists walk_in_notes (
    id uuid primary key default uuid_generate_v4(),
    visit_id uuid references walk_in_visits(id) on delete cascade not null,
    note_text text not null,
    note_type text default 'general' check (note_type in ('general','academic','fee','attendance','behavioral','other')),
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- RLS for walk-in tables
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

-- ─── PARENT REPLIES (Step 2) ──────────────────────────────
create table notification_replies (
    id uuid primary key default uuid_generate_v4(),
    notification_id uuid references notifications(id) on delete cascade,
    profile_id uuid references profiles(id),
    reply_text text not null,
    created_at timestamptz default now(),
    unique(notification_id, profile_id)
);
alter table notification_replies enable row level security;
create policy "Parents can reply to own notifications" on notification_replies
    for insert with check (profile_id = auth.uid());
create policy "Admins can read all replies" on notification_replies
    for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')));
create policy "Parents can read own replies" on notification_replies
    for select using (profile_id = auth.uid());

-- ─── MILESTONES (Step 5) ─────────────────────────────────
create table milestones (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references students(id) on delete cascade,
    profile_id uuid references profiles(id),
    type text not null, -- 'attendance_streak_30', 'first_a_plus', 'first_payment', etc.
    title text not null,
    description text,
    acknowledged boolean default false,
    created_at timestamptz default now()
);
alter table milestones enable row level security;
create policy "Students/parents see own milestones" on milestones
    for select using (
        profile_id = auth.uid() or
        exists (select 1 from students where id = student_id and (profile_id = auth.uid() or parent_profile_id = auth.uid()))
    );
create policy "Admins manage milestones" on milestones
    for all using (exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')));

-- ─── MOOD CHECK-INS (Step 4) ─────────────────────────────
create table mood_checkins (
    id uuid primary key default uuid_generate_v4(),
    student_id uuid references students(id) on delete cascade,
    mood text not null check (mood in ('great', 'good', 'okay', 'struggling')),
    note text,
    created_at timestamptz default now()
);
alter table mood_checkins enable row level security;
create policy "Students submit own mood" on mood_checkins
    for insert with check (student_id in (select id from students where profile_id = auth.uid()));
create policy "Students read own mood history" on mood_checkins
    for select using (student_id in (select id from students where profile_id = auth.uid()));
create policy "Admins read all mood data" on mood_checkins
    for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')));
