// Supabase Edge Function: fix-notif-rls
// Uses service_role key (bypasses RLS) to:
// 1. Verify/apply all notification RLS fixes
// 2. Seed sample notifications
// 3. Return verification results

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    )

    const results: any[] = []

    // 1. Check current policies
    const { data: policies, error: polErr } = await supabase.rpc('exec_sql', {
      sql: `SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'notifications' ORDER BY policyname;`,
    }).single()
    results.push({ step: 'policies', data: policies, error: polErr?.message })

    // 2. Ensure sent_by is nullable
    await supabase.rpc('exec_sql', { sql: `ALTER TABLE notifications ALTER COLUMN sent_by DROP NOT NULL;` }).catch(() => {})

    // 3. Drop all existing notification policies
    const existing = ['Admins manage notifications', 'Admins insert notifications',
      'Read targeted notifications', 'Admins update notifications']
    for (const p of existing) {
      await supabase.rpc('exec_sql', { sql: `DROP POLICY IF EXISTS "${p}" ON notifications;` }).catch(() => {})
    }

    // 4. Create clean INSERT policy (admin role check only, no sent_by dependency)
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Admins insert notifications" ON notifications
            FOR INSERT WITH CHECK (
              exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin'))
            );`,
    })

    // 5. Create SELECT policy (role in target_roles)
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Read targeted notifications" ON notifications
            FOR SELECT USING (
              exists (select 1 from profiles where id = auth.uid() and role = any(target_roles))
            );`,
    })

    // 6. Create UPDATE policy
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Admins update notifications" ON notifications
            FOR UPDATE USING (
              exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin'))
            );`,
    })

    // 7. Create DELETE policy
    await supabase.rpc('exec_sql', {
      sql: `CREATE POLICY "Admins delete notifications" ON notifications
            FOR DELETE USING (
              exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin'))
            );`,
    })

    // 8. Fix notification_reads policy
    await supabase.rpc('exec_sql', {
      sql: `CREATE OR REPLACE POLICY "Manage own notification reads" ON notification_reads
            FOR ALL USING (profile_id = auth.uid());`,
    })

    // 9. Seed 4 real notifications (no sent_by - will be NULL)
    const seedNotifs = [
      {
        title: '📚 New Study Resources Uploaded',
        message: 'Mathematics and Science notes for all standards have been uploaded to the Resource Hub. Check your Resources page!',
        type: 'resource',
        target_roles: ['student', 'parent'],
      },
      {
        title: '💰 Fee Payment Reminder',
        message: 'Kindly clear any pending fee dues before the end of this month. Contact the office for installment plans.',
        type: 'fee',
        target_roles: ['parent'],
      },
      {
        title: '📝 Upcoming Test Announcement',
        message: 'A new test has been scheduled for next week. Prepare your revision notes and check the Course Mapping page for weak topics.',
        type: 'exam',
        target_roles: ['student', 'parent'],
      },
      {
        title: '✅ App Launch - Welcome!',
        message: 'Welcome to the new Dipesh Tutorials digital platform! You can now view attendance, test scores, fee status, and study resources from your phone.',
        type: 'general',
        target_roles: ['student', 'parent', 'admin', 'superadmin'],
      },
    ]

    for (const n of seedNotifs) {
      const { error: insErr } = await supabase.from('notifications').insert(n)
      if (insErr) results.push({ seed_error: insErr.message })
    }

    // 10. Read back all notifications
    const { data: allNotifs, error: selErr } = await supabase
      .from('notifications')
      .select('id, title, type, target_roles, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    results.push({ step: 'verify_notifications', count: allNotifs?.length, data: allNotifs, error: selErr?.message })

    // 11. Create trigger function to auto-set sent_by
    await supabase.rpc('exec_sql', {
      sql: `CREATE OR REPLACE FUNCTION set_notification_sent_by()
            RETURNS TRIGGER AS $$
            BEGIN
              IF NEW.sent_by IS NULL THEN
                NEW.sent_by = auth.uid();
              END IF;
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql SECURITY DEFINER;`,
    })
    await supabase.rpc('exec_sql', {
      sql: `DROP TRIGGER IF EXISTS set_notification_sent_by ON notifications;
            CREATE TRIGGER set_notification_sent_by
            BEFORE INSERT ON notifications
            FOR EACH ROW EXECUTE FUNCTION set_notification_sent_by();`,
    })

    results.push({ step: 'trigger', status: 'created set_notification_sent_by trigger' })

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
