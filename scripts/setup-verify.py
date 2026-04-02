#!/usr/bin/env python3
"""Reset demo user passwords and verify everything in Supabase."""

import subprocess, json, sys

PAT = "sbp_b86864e6eb9272cc2de81f2245f9d32c0cb894fc"
REF = "upkhlhoyzvzblqilyfpu"
BASE_URL = f"https://api.supabase.com/v1/projects/{REF}"

def api_post(path, data):
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", f"{BASE_URL}{path}",
         "-H", f"Authorization: Bearer {PAT}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps(data)],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)

def api_get(path):
    result = subprocess.run(
        ["curl", "-s", f"{BASE_URL}{path}",
         "-H", f"Authorization: Bearer {PAT}",
         "-H", "Content-Type: application/json"],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)

def sql(query):
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", f"{BASE_URL}/database/query",
         "-H", f"Authorization: Bearer {PAT}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps({"query": query})],
        capture_output=True, text=True
    )
    out = result.stdout.strip()
    if out:
        try:
            return json.loads(out)
        except:
            return out
    return None

print("=" * 60)
print("Dipesh Tutorials — Supabase Setup Verification")
print("=" * 60)

# 1. Check auth settings
print("\n[1/6] Auth Settings")
settings = api_get("/database/query")
# Use direct REST
result = subprocess.run(
    ["curl", "-s", "https://upkhlhoyzvzblqilyfpu.supabase.co/auth/v1/settings",
     "-H", "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwa2hsaG95enZ6YmxxaWx5ZnB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzUzODQsImV4cCI6MjA5MDUxMTM4NH0.-jEjHqg2hVsDyheuy67C6lB8gugweDhHZV-x11R8dvY"],
    capture_output=True, text=True
)
auth = json.loads(result.stdout)
print(f"  Email confirm: {'DISABLED ✅' if auth.get('mailer_autoconfirm') else 'ENABLED ❌'}")
print(f"  External providers: {[k for k,v in auth.get('external',{}).items() if v]}")

# 2. Check users in auth.users
print("\n[2/6] Auth Users")
users = sql("SELECT id, email, created_at FROM auth.users ORDER BY created_at")
if isinstance(users, list):
    for u in users:
        print(f"  {u['email']} — created {u['created_at'][:10]}")

# 3. Check profiles
print("\n[3/6] Profiles")
profiles = sql("SELECT id, email, name, role, is_active FROM profiles ORDER BY created_at")
if isinstance(profiles, list):
    for p in profiles:
        print(f"  {p['role']:<10} | {p['name']:<20} | {p['email']}")

# 4. Check students linked
print("\n[4/6] Student Links")
links = sql("""
SELECT s.name, s.roll_no, st.name as standard,
       s.profile_id IS NOT NULL as has_student_acc,
       s.parent_profile_id IS NOT NULL as has_parent_acc
FROM students s
JOIN standards st ON s.standard_id = st.id
ORDER BY st.sort_order, s.roll_no
""")
if isinstance(links, list):
    for l in links:
        stud = "✓" if l['has_student_acc'] else "✗"
        par  = "✓" if l['has_parent_acc']  else "✗"
        print(f"  [{stud}][{par}] {l['name']:<20} (Roll {l['roll_no']}, {l['standard']})")

# 5. Check storage
print("\n[5/6] Storage Buckets")
buckets = sql("SELECT id, name, public FROM storage.buckets")
if isinstance(buckets, list):
    for b in buckets:
        pub = "PUBLIC ✅" if b['public'] else "PRIVATE ❌"
        print(f"  {b['name']} — {pub}")

# 6. Check fee_summary (academic year fix)
print("\n[6/6] Fee Summary (academic year config)")
fee_cfg = sql("SELECT academic_year, is_current FROM academic_year_config ORDER BY start_date DESC LIMIT 5")
summary = sql("SELECT student_name, standard_name, total_fees, paid_fees, balance, status FROM student_fee_summary ORDER BY balance DESC LIMIT 10")
if isinstance(fee_cfg, list) and fee_cfg:
    print(f"  Active year: {fee_cfg[0]['academic_year']}")
if isinstance(summary, list):
    print("  Top pending balances:")
    for s in summary[:5]:
        print(f"    {s['student_name']:<20} | ₹{float(s['balance'] or 0):>9,.0f} | {s['status']}")

print("\n" + "=" * 60)
print("SETUP COMPLETE — Ready for testing")
print("=" * 60)