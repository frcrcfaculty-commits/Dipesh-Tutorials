// Supabase Edge Function: notification-rls-fix
// URL: https://upkhlhoyzvzblqilyfpu.supabase.co/functions/v1/notification-rls-fix
// This function applies the notification RLS fix using service_role key
// Can be called once from the app or manually

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
    // Use service_role key from env (set in Supabase dashboard for this function)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const results = []

    // Step 1: Drop old policy
    const dropOld = await supabaseAdmin.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Admins manage notifications" ON notifications;`
    })
    results.push({ step: 'drop_old_policy', ok: !dropOld.error, error: dropOld.error?.message })

    // Step 2: Create INSERT policy
    const createInsert = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY "Admins insert notifications" ON notifications
        FOR INSERT WITH CHECK (
          exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin'))
        );`
    })
    results.push({ step: 'create_insert_policy', ok: !createInsert.error, error: createInsert.error?.message })

    // Step 3: Create SELECT policy
    const createSelect = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE OR REPLACE POLICY "Read targeted notifications" ON notifications
        FOR SELECT USING (
          exists (select 1 from profiles where id = auth.uid() and role = any(target_roles))
        );`
    })
    results.push({ step: 'create_select_policy', ok: !createSelect.error, error: createSelect.error?.message })

    // Step 4: Create UPDATE policy
    const createUpdate = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY "Admins update notifications" ON notifications
        FOR UPDATE USING (
          exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin'))
        );`
    })
    results.push({ step: 'create_update_policy', ok: !createUpdate.error, error: createUpdate.error?.message })

    // Step 5: Create DELETE policy
    const createDelete = await supabaseAdmin.rpc('exec_sql', {
      sql: `CREATE POLICY "Admins delete notifications" ON notifications
        FOR DELETE USING (
          exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'superadmin'))
        );`
    })
    results.push({ step: 'create_delete_policy', ok: !createDelete.error, error: createDelete.error?.message })

    // Step 6: Fix notification_reads
    const fixReads = await supabaseAdmin.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "Manage own notification reads" ON notification_reads;
        CREATE POLICY "Manage own notification reads" ON notification_reads
        FOR ALL USING (profile_id = auth.uid());`
    })
    results.push({ step: 'fix_notification_reads', ok: !fixReads.error, error: fixReads.error?.message })

    // Step 7: Seed notifications
    const seed = await supabaseAdmin.from('notifications').insert([
      { title: '📚 New Study Resources', message: 'Mathematics and Science notes uploaded. Check Resource Hub!', type: 'resource', target_roles: ['student', 'parent'] },
      { title: '💰 Fee Reminder', message: 'Clear pending dues before month end.', type: 'fee', target_roles: ['parent'] },
      { title: '📝 Test Scheduled', message: 'New test next week. Check Course Mapping.', type: 'exam', target_roles: ['student', 'parent'] },
      { title: '✅ App Launch!', message: 'View attendance, scores, fees from your phone.', type: 'general', target_roles: ['student', 'parent', 'admin', 'superadmin'] },
    ])
    results.push({ step: 'seed_notifications', ok: !seed.error, error: seed.error?.message })

    // Step 8: Verify
    const { data: notifs } = await supabaseAdmin.from('notifications').select('id, title')
    results.push({ step: 'verify_notifications', count: notifs?.length || 0, notifications: notifs })

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})