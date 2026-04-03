import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getStudentAttendance, getTestResults, getFeeSummary, getNotifications } from '../lib/api';
import { Bell, CalendarCheck, BarChart3, IndianRupee, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function DigestCard({ icon: Icon, color, title, value, sub, action }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <h4 style={{ margin: 0, color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'var(--font-heading)' }}>{title}</h4>
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>{value}</div>
      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{sub}</p>
      {action && <button onClick={() => navigate(action.path)} style={{ marginTop: 10, background: 'none', border: 'none', color, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}>
        {action.label} <ArrowRight size={12} />
      </button>}
    </div>
  );
}

export default function ParentDigest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.students?.[0]?.id;
  const [data, setData] = useState({ att: [], tests: [], fees: [], notifs: [] });
  const [loading, setLoading] = useState(true);
  const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    Promise.all([
      getStudentAttendance(studentId, 7),
      getTestResults({ studentId }),
      getFeeSummary({ studentIds: [studentId] }),
      getNotifications('parent', 5),
    ]).then(([att, tests, fees, notifs]) => {
      setData({ att: att||[], tests: tests||[], fees: fees||[], notifs: notifs||[] });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return <div style={{ textAlign: 'center', padding: 48 }}><p>No student linked to your account.</p></div>;

  const present = data.att.filter(a => a.status === 'present' || a.status === 'late').length;
  const attPct = data.att.length > 0 ? Math.round(present/data.att.length*100) : 0;
  const latestTest = data.tests[0];
  const latestPct = latestTest && latestTest.max_marks > 0 ? Math.round((latestTest.marks_obtained/latestTest.max_marks)*100) : null;
  const fee = data.fees[0];
  const pending = fee ? fee.balance : 0;

  const items = [
    { icon: CalendarCheck, color: attPct >= 75 ? '#10B981' : '#EF4444', title: 'This Week', value: attPct+'%', sub: present+' of '+data.att.length+' days', action: { label: 'View Attendance', path: '/attendance' } },
    { icon: BarChart3, color: latestPct ? (latestPct >= 75 ? '#10B981' : '#F59E0B') : '#9CA3AF', title: 'Latest Result', value: latestTest ? latestPct+'%' : '—', sub: latestTest ? latestTest.subjects?.name : 'No results yet', action: { label: 'View Results', path: '/test-results' } },
    { icon: IndianRupee, color: pending > 0 ? '#EF4444' : '#10B981', title: 'Fee Status', value: pending > 0 ? 'Rs. '+parseFloat(pending||0).toLocaleString('en-IN') : 'All Clear', sub: pending > 0 ? 'Balance outstanding' : 'No pending fees', action: { label: 'View Billing', path: '/billing' } },
    { icon: Bell, color: '#21a7d0', title: 'Updates', value: data.notifs.length, sub: 'recent notifications', action: null },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(135deg, #031a3d, #0A2351)', borderRadius: 20, padding: '24px 28px', color: 'white', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.75, marginBottom: 4 }}>{date}</p>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>Daily Digest</h2>
        <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>Your ward: <strong>{user?.students?.[0]?.name}</strong></p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {items.slice(0,2).map(item => <DigestCard key={item.title} {...item} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {items.slice(2,4).map(item => <DigestCard key={item.title} {...item} />)}
      </div>
      {data.notifs.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h4 style={{ margin: '0 0 12px', color: 'var(--navy)', fontFamily: 'var(--font-heading)' }}>Recent Updates</h4>
          {data.notifs.map(n => (
            <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{n.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
