#!/usr/bin/env python3
"""Verify notification RLS fix using subprocess curl (same method that worked for fix script)."""
import subprocess, json

PAT = "sbp_b86864e6eb9272cc2de81f2245f9d32c0cb894fc"
REF = "upkhlhoyzvzblqilyfpu"
BASE_URL = f"https://api.supabase.com/v1/projects/{REF}"

def sql(query):
    cmd = [
        "curl", "-s", "-X", "POST",
        f"{BASE_URL}/database/query",
        "-H", f"Authorization: Bearer {PAT}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"query": query})
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except:
        return {"raw": r.stdout[:300]}

print("=" * 60)
print("Notification Fix Verification")
print("=" * 60)

print("\n[1] Notification RLS Policies")
policies = sql("""
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;
""")
if isinstance(policies, list):
    for p in policies:
        print(f"  {p['cmd']}: {p['policyname']}")
elif isinstance(policies, dict):
    print(f"  Response: {policies}")

print("\n[2] notification_reads RLS Policies")
reads_pol = sql("""
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'notification_reads';
""")
if isinstance(reads_pol, list):
    for p in reads_pol:
        print(f"  {p['cmd']}: {p['policyname']}")

print("\n[3] Sample Notifications (as service_role)")
notifs = sql("SELECT id, title, target_roles::text, sent_by FROM notifications ORDER BY created_at DESC LIMIT 5;")
if isinstance(notifs, list):
    for n in notifs:
        print(f"  [{n['id'][:8]}] {n['title'][:50]}")
        print(f"      target_roles: {n['target_roles']}")
elif isinstance(notifs, dict):
    print(f"  Response: {notifs}")

print("\n[4] All Notifications Count")
cnt = sql("SELECT count(*) as cnt FROM notifications;")
print(f"  {cnt}")

print("\n[5] Try INSERT as admin (should succeed now)")
ins = sql("""
INSERT INTO notifications (title, message, type, target_roles)
VALUES ('Test From DB', 'This notification was inserted via direct SQL', 'general', '{student,parent,admin,superadmin}')
RETURNING id, title;
""")
print(f"  Insert result: {ins}")

print("\n[6] SELECT after insert (should show notifications)")
sel = sql("SELECT id, title, target_roles::text FROM notifications ORDER BY created_at DESC LIMIT 5;")
if isinstance(sel, list):
    for n in sel:
        print(f"  [{n['id'][:8]}] {n['title']}")
        print(f"      target_roles: {n['target_roles']}")

print("\n✅ Verification complete")
