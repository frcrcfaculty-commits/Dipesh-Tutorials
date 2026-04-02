#!/usr/bin/env python3
"""Notification RLS fix - single batched API call."""
import subprocess, json, time

PAT = "sbp_b86864e6eb9272cc2de81f2245f9d32c0cb894fc"
MANAGE_URL = "https://api.supabase.com/v1/projects/upkhlhoyzvzblqilyfpu/database/query"

def sql(query, retries=5, delay=3):
    for attempt in range(retries):
        cmd = [
            "curl", "-s", "-X", "POST", MANAGE_URL,
            "-H", f"Authorization: Bearer {PAT}",
            "-H", "Content-Type: application/json",
            "-d", json.dumps({"query": query})
        ]
        r = subprocess.run(cmd, capture_output=True, text=True)
        try:
            result = json.loads(r.stdout)
            if isinstance(result, dict) and result.get("message") == "Unauthorized":
                print(f"  [Attempt {attempt+1}] 401 Unauthorized, waiting {delay}s...")
                time.sleep(delay)
                continue
            return result
        except Exception as e:
            print(f"  [Attempt {attempt+1}] Parse error: {r.stdout[:80]}")
            time.sleep(delay)
            continue
    return {"error": "All retries failed"}

print("=" * 60)
print("Notification Fix - Batched Approach")
print("=" * 60)

# ALL fixes in ONE SQL batch
batch = """
-- 1. Drop all old notification policies
DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;
DROP POLICY IF EXISTS "Admins insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admins update notifications" ON notifications;
DROP POLICY IF EXISTS "Admins delete notifications" ON notifications;

-- 2. Create clean INSERT policy (role check only, no sent_by restriction)
CREATE POLICY "Admins insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );

-- 3. Create SELECT policy (role matches target_roles)
CREATE POLICY "Read targeted notifications" ON notifications
    FOR SELECT USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role = any(target_roles)
        )
    );

-- 4. Create UPDATE policy
CREATE POLICY "Admins update notifications" ON notifications
    FOR UPDATE USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );

-- 5. Create DELETE policy
CREATE POLICY "Admins delete notifications" ON notifications
    FOR DELETE USING (
        exists (
            select 1 from profiles
            where id = auth.uid()
            and role in ('admin', 'superadmin')
        )
    );

-- 6. Fix notification_reads policy
DROP POLICY IF EXISTS "Manage own reads" ON notification_reads;
DROP POLICY IF EXISTS "Manage own notification reads" ON notification_reads;
CREATE POLICY "Manage own notification reads" ON notification_reads
    FOR ALL USING (profile_id = auth.uid());

-- 7. Create trigger to auto-set sent_by
CREATE OR REPLACE FUNCTION set_notification_sent_by()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.sent_by IS NULL THEN
            NEW.sent_by := auth.uid();
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_notification_sent_by ON notifications;
CREATE TRIGGER set_notification_sent_by
    BEFORE INSERT ON notifications
    FOR EACH ROW EXECUTE FUNCTION set_notification_sent_by();

-- 8. Return success marker
SELECT 'ALL_FIXES_APPLIED' as status;
"""

print("\nApplying all notification RLS fixes in one batch...")
print("(This may take 10-20 seconds due to rate limiting)")
r = sql(batch, retries=8, delay=5)

if isinstance(r, dict) and r.get("error"):
    print(f"❌ Failed: {r}")
elif isinstance(r, list) and any(row.get("status") == "ALL_FIXES_APPLIED" for row in r if isinstance(row, dict)):
    print("✅ All RLS policies applied successfully!")
else:
    print(f"Result: {str(r)[:200]}")

# Verify policies
print("\n[Verify] Checking notification policies...")
verify = sql("""SELECT policyname, cmd FROM pg_policies
    WHERE tablename = 'notifications' ORDER BY policyname;""", retries=3, delay=3)
if isinstance(verify, list):
    for pol in verify:
        print(f"  ✅ {pol.get('policyname')} ({pol.get('cmd')})")
elif isinstance(verify, dict) and verify.get("message"):
    print(f"  ⚠️  Verify query: {verify.get('message')}")

# Check notifications exist
print("\n[Verify] Checking notifications...")
check = sql("SELECT count(*) as cnt FROM notifications;", retries=3, delay=3)
if isinstance(check, list) and check:
    cnt = check[0].get("cnt", "?")
    print(f"  ✅ {cnt} notifications in database")
elif isinstance(check, dict) and check.get("message"):
    print(f"  ⚠️  {check.get('message')}")

print("\n" + "=" * 60)
print("Done! Reload the app → login as admin → send notification")
print("=" * 60)
