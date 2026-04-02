#!/usr/bin/env python3
"""
Dipesh Tutorials - Notification Fix Script
Applies via Supabase Management API with retries.
"""
import subprocess, json, time

PAT = "sbp_b86864e6eb9272cc2de81f2245f9d32c0cb894fc"
REF = "upkhlhoyzvzblqilyfpu"
BASE_URL = f"https://api.supabase.com/v1/projects/{REF}"
MANAGE_URL = f"https://api.supabase.com/v1/projects/{REF}/database/query"

def sql(query, retries=3):
    """Execute SQL via Management API with retry."""
    payload = {"query": query}
    for attempt in range(retries):
        cmd = [
            "curl", "-s", "-X", "POST", MANAGE_URL,
            "-H", f"Authorization: Bearer {PAT}",
            "-H", "Content-Type: application/json",
            "-d", json.dumps(payload)
        ]
        r = subprocess.run(cmd, capture_output=True, text=True)
        try:
            result = json.loads(r.stdout)
            if isinstance(result, dict) and result.get("message") == "Unauthorized":
                print(f"  [Attempt {attempt+1}] Unauthorized, waiting 5s...")
                time.sleep(5)
                continue
            return result
        except:
            print(f"  [Attempt {attempt+1}] Parse error: {r.stdout[:100]}")
            time.sleep(2)
            continue
    return {"error": "All retries failed", "query": query[:50]}

def fmt(r):
    """Format SQL result for display."""
    if isinstance(r, list):
        if not r:
            return "  (empty result)"
        if isinstance(r[0], dict):
            cols = list(r[0].keys())
            lines = ["  " + " | ".join(cols)]
            lines.append("  " + "-" * (len(lines[0])-2))
            for row in r[:5]:
                lines.append("  " + " | ".join(str(row.get(c,"")) for c in cols))
            return "\n".join(lines)
        return "  " + str(r[:3])
    if isinstance(r, dict):
        if "message" in r:
            return f"  ❌ {r['message'][:100]}"
        return f"  {str(r)[:200]}"
    return f"  {r}"

print("=" * 60)
print("Notification System Fix")
print("=" * 60)

# Step 1: Fix sent_by column
print("\n[1] Making sent_by nullable...")
r = sql("ALTER TABLE notifications ALTER COLUMN sent_by DROP NOT NULL;")
print(f"    Result: {r.get('message') or 'OK' if isinstance(r, dict) and 'message' not in r else r}")

# Step 2: Drop old policy
print("\n[2] Dropping old 'Admins manage notifications' policy...")
r = sql('DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;')
print(f"    Result: {fmt(r)}")

# Step 3: Create INSERT policy
print("\n[3] Creating INSERT policy (admin role check only)...")
r = sql("""CREATE POLICY "Admins insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );""")
print(f"    Result: {fmt(r)}")

# Step 4: Create SELECT policy
print("\n[4] Creating SELECT policy (role-based target_roles)...")
r = sql("""CREATE OR REPLACE POLICY "Read targeted notifications" ON notifications
    FOR SELECT USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role = any(target_roles)
        )
    );""")
print(f"    Result: {fmt(r)}")

# Step 5: Create UPDATE policy
print("\n[5] Creating UPDATE policy...")
r = sql("""CREATE POLICY "Admins update notifications" ON notifications
    FOR UPDATE USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );""")
print(f"    Result: {fmt(r)}")

# Step 6: Create DELETE policy
print("\n[6] Creating DELETE policy...")
r = sql("""CREATE POLICY "Admins delete notifications" ON notifications
    FOR DELETE USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );""")
print(f"    Result: {fmt(r)}")

# Step 7: Fix notification_reads policy
print("\n[7] Fixing notification_reads policy...")
r = sql("""CREATE OR REPLACE POLICY "Manage own notification reads" ON notification_reads
    FOR ALL USING (profile_id = auth.uid());""")
print(f"    Result: {fmt(r)}")

# Step 8: Create trigger to auto-set sent_by
print("\n[8] Creating trigger to auto-set sent_by on insert...")
r = sql("""CREATE OR REPLACE FUNCTION set_notification_sent_by()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.sent_by IS NULL THEN
            NEW.sent_by := auth.uid();
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;""")
print(f"    Result: {fmt(r)}")

r = sql("""DROP TRIGGER IF EXISTS set_notification_sent_by ON notifications;
    CREATE TRIGGER set_notification_sent_by
    BEFORE INSERT ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_notification_sent_by();""")
print(f"    Result: {fmt(r)}")

# Step 9: Verify policies exist
print("\n[9] Verifying notification policies...")
r = sql("""SELECT policyname, cmd FROM pg_policies
    WHERE tablename = 'notifications' ORDER BY policyname;""")
print(f"    {fmt(r)}")

# Step 10: Seed 4 real notifications
print("\n[10] Seeding sample notifications...")
notifs = [
    ("📚 New Study Resources", "Mathematics and Science notes uploaded for all standards. Check the Resource Hub!", "resource", "['student','parent']"),
    ("💰 Fee Payment Reminder", "Kindly clear pending fee dues before month end. Contact office for installment plans.", "fee", "['parent']"),
    ("📝 Test Announcement", "New test scheduled for next week. Check Course Mapping for weak topics to revise.", "exam", "['student','parent']"),
    ("✅ App Launch - Welcome!", "Welcome to the new Dipesh Tutorials platform! View attendance, scores, fees and resources from your phone.", "general", "['student','parent','admin','superadmin']"),
]
for title, msg, ntype, roles in notifs:
    r = sql(f"""INSERT INTO notifications (title, message, type, target_roles)
        VALUES ('{title}', '{msg}', '{ntype}', {roles});""")
    status = "✅" if not isinstance(r, dict) or "message" not in r else "❌"
    print(f"    {status} {title[:40]}")

# Step 11: Verify notifications
print("\n[11] Verifying notifications...")
r = sql("SELECT id, title, target_roles::text FROM notifications ORDER BY created_at DESC LIMIT 5;")
print(f"    {fmt(r)}")

r = sql("SELECT count(*) as cnt FROM notifications;")
print(f"\n    Total notifications: {fmt(r)}")

print("\n" + "=" * 60)
print("✅ Fix complete! Reload the app and test sending notifications.")
print("=" * 60)
