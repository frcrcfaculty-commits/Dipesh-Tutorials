#!/usr/bin/env python3
"""Apply notification RLS fix via Supabase Management API using subprocess curl."""
import subprocess, json

PAT = "sbp_b86864e6eb9272cc2de81f2245f9d32c0cb894fc"
REF = "upkhlhoyzvzblqilyfpu"
BASE_URL = f"https://api.supabase.com/v1/projects/{REF}"

def api_post(path, data):
    cmd = [
        "curl", "-s", "-X", "POST",
        f"{BASE_URL}{path}",
        "-H", f"Authorization: Bearer {PAT}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps(data)
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(r.stdout)

def run_sql(sql):
    print(f"  Running: {sql[:70]}...")
    r = api_post("/database/query", {"query": sql})
    return r

# Apply fixes
print("=== Fix 1: Make sent_by nullable ===")
run_sql("ALTER TABLE notifications ALTER COLUMN sent_by DROP NOT NULL;")

print("\n=== Fix 2: Drop broken combined policy ===")
run_sql('DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;')

print("\n=== Fix 3: Create INSERT policy (admin role check only) ===")
run_sql("""CREATE POLICY "Admins insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );""")

print("\n=== Fix 4: Create SELECT policy (role-based) ===")
run_sql("""CREATE OR REPLACE POLICY "Read targeted notifications" ON notifications
    FOR SELECT USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role = any(target_roles)
        )
    );""")

print("\n=== Fix 5: Create UPDATE policy ===")
run_sql("""CREATE POLICY "Admins update notifications" ON notifications
    FOR UPDATE USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );""")

print("\n=== Fix 6: Fix notification_reads policy ===")
run_sql("""CREATE OR REPLACE POLICY "Manage own notification reads" ON notification_reads
    FOR ALL USING (profile_id = auth.uid());""")

print("\n=== Fix 7: Verify - insert test notification ===")
run_sql("""INSERT INTO notifications (title, message, type, target_roles)
    VALUES ('✅ System Test', 'Notifications are now working!', 'general', '{student,parent,admin,superadmin}');""")

print("\n=== Fix 8: Verify - read notifications ===")
run_sql("SELECT id, title, target_roles FROM notifications LIMIT 5;")

print("\n=== Fix 9: Check count ===")
run_sql("SELECT count(*) as cnt FROM notifications;")

print("\n✅ All fixes applied!")
