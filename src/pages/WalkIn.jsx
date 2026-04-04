import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import {
  getStudents, getStudentAttendance, getTestResults,
  getFeePayments, getFeeStructureByStandard,
  createWalkInVisit, getWalkInVisits
} from '../lib/api';
import {
  Search, User, CalendarCheck, GraduationCap,
  IndianRupee, Clock, Plus, Loader2
} from 'lucide-react';
import { showToast } from '../utils';

const GRADE_COLOR = {
  'A+': '#0c8b51', 'A': '#10B981', 'B+': '#3B82F6',
  'B': '#6366F1', 'C': '#F59E0B', 'D': '#EF4444', 'F': '#DC2626'
};

export default function WalkIn() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setStudents([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const all = await getStudents();
        const q = search.toLowerCase();
        const filtered = (all || []).filter(s =>
          s.name?.toLowerCase().includes(q) ||
          s.parent_name?.toLowerCase().includes(q) ||
          s.parent_phone?.includes(q) ||
          String(s.roll_no).includes(q)
        );
        setStudents(filtered);
      } catch { setStudents([]); }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function selectStudent(student) {
    setSelected(student);
    setLoading(true);
    setProfile(null);
    try {
      const [attendance, results, feeStructure, payments, visits] = await Promise.all([
        getStudentAttendance(student.id, 30),
        getTestResults({ studentId: student.id }),
        getFeeStructureByStandard(student.standard_id),
        getFeePayments(student.id),
        getWalkInVisits(student.id),
      ]);

      const att = (attendance || []).filter(a => a.status === 'present' || a.status === 'late').length;
      const abs = (attendance || []).filter(a => a.status === 'absent').length;
      const late = (attendance || []).filter(a => a.status === 'late').length;
      const present = (attendance || []).filter(a => a.status === 'present').length;
      const total = (attendance || []).length;

      const totalFees = feeStructure?.total_amount || 0;
      const totalPaid = (payments || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

      setProfile({
        student,
        attendance: { present, late, absent: abs, total, pct: total > 0 ? Math.round((att / total) * 100) : 0 },
        results: (results || []).slice(0, 10),
        fees: { total: totalFees, paid: totalPaid, balance: totalFees - totalPaid },
        visits: visits || [],
      });
    } catch (e) {
      showToast('Failed to load: ' + e.message, 'error');
    }
    setLoading(false);
  }

  async function logVisit() {
    if (!selected) return;
    try {
      await createWalkInVisit({ studentId: selected.id, visitedBy: user?.id || null, summary: 'Walk-in session' });
      showToast('Visit logged!');
      const visits = await getWalkInVisits(selected.id);
      setProfile(prev => prev ? { ...prev, visits: visits || [] } : prev);
    } catch (e) {
      showToast('Failed: ' + e.message, 'error');
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Walk-In Dashboard</h2>
        {selected && (
          <button className="btn-secondary" onClick={() => { setSelected(null); setProfile(null); setSearch(''); }}>
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Search sidebar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
            <div className="search-input" style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, roll, phone..."
                style={{ width: '100%', paddingLeft: 36, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem' }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {searchLoading && (
              <div style={{ padding: 24, textAlign: 'center' }}><Loader2 size={20} className="spin" /></div>
            )}
            {!searchLoading && students.length === 0 && search && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students found</div>
            )}
            {!searchLoading && students.length === 0 && !search && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Type to search</div>
            )}
            {students.map(s => (
              <div
                key={s.id}
                onClick={() => selectStudent(s)}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: selected?.id === s.id ? 'rgba(10,35,81,0.05)' : 'transparent',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {s.standards?.name} | Roll {s.roll_no}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile area */}
        <div>
          {!selected && (
            <div className="card" style={{ textAlign: 'center', padding: 64, color: 'var(--text-muted)' }}>
              <Search size={48} style={{ opacity: 0.25, marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8, color: 'var(--text)' }}>Search for a student</h3>
              <p style={{ fontSize: '0.875rem' }}>Type a name, roll number, or parent's name to view their complete profile</p>
            </div>
          )}

          {selected && loading && (
            <div style={{ textAlign: 'center', padding: 64 }}><Loader2 size={32} className="spin" /></div>
          )}

          {selected && !loading && profile && (
            <>
              {/* Student header */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, flexShrink: 0 }}>
                    {profile.student.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px' }}>{profile.student.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {profile.student.standards?.name} | Roll {profile.student.roll_no}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Parent: {profile.student.parent_name || '—'} | {profile.student.parent_phone || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary btn-small" onClick={logVisit}>
                      <Clock size={13} /> Log Visit
                    </button>
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 12, fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Attendance (Last 30 Days)</h4>
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {[
                    { label: 'Present', val: profile.attendance.present, color: '#0c8b51' },
                    { label: 'Late', val: profile.attendance.late, color: '#3B82F6' },
                    { label: 'Absent', val: profile.attendance.absent, color: '#EF4444' },
                    { label: 'Attendance %', val: profile.attendance.pct + '%', color: profile.attendance.pct >= 75 ? '#0c8b51' : '#F59E0B' },
                  ].map(item => (
                    <div key={item.label} className="stat-card" style={{ background: item.color, color: 'white', textAlign: 'center', padding: '16px 12px' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{item.val}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: 4 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Test results */}
                <div className="card" style={{ padding: 0 }}>
                  <div className="card-header"><h3><GraduationCap size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Recent Tests</h3></div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
                      <tbody>
                        {profile.results.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 16 }}>No test results</td></tr>}
                        {profile.results.map(r => (
                          <tr key={r.id}>
                            <td style={{ fontWeight: 500 }}>{r.tests?.name || '—'}</td>
                            <td>{r.subjects?.name || '—'}</td>
                            <td style={{ fontWeight: 600 }}>{r.marks_obtained}/{r.max_marks}</td>
                            <td>
                              <span className="badge" style={{ background: GRADE_COLOR[r.grade] || '#666', color: 'white' }}>
                                {r.grade || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Fee summary */}
                <div className="card">
                  <div className="card-header"><h3><IndianRupee size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Fee Summary</h3></div>
                  <div className="card-body">
                    {[
                      { label: 'Total Fees', val: '₹' + Number(profile.fees.total || 0).toLocaleString('en-IN') },
                      { label: 'Amount Paid', val: '₹' + Number(profile.fees.paid || 0).toLocaleString('en-IN'), color: '#0c8b51' },
                      { label: 'Balance Due', val: '₹' + Number(profile.fees.balance || 0).toLocaleString('en-IN'), color: profile.fees.balance > 0 ? '#EF4444' : '#0c8b51' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{item.label}</span>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: item.color || 'var(--text)' }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visit history */}
              <div className="card">
                <div className="card-header"><h3><Clock size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Visit History ({profile.visits.length})</h3></div>
                <div className="card-body">
                  {profile.visits.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No visits logged yet</p>}
                  {profile.visits.map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.summary || 'Walk-in session'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(v.visited_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.profiles?.name || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
