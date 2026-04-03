import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { getStandards, getSubjects, getStudents } from '../lib/api';
import { BookOpen, CheckCircle, Circle, Loader2, Plus, X, Calendar } from 'lucide-react';
import { showToast } from '../utils';

export default function HomeworkTracker() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [standards, setStandards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [std, setStd] = useState('');
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submissions, setSubmissions] = useState({});
  const [form, setForm] = useState({ title: '', description: '', standard_id: '', subject_id: '', due_date: '' });

  useEffect(() => { getStandards().then(s => setStandards(s||[])); }, []);

  useEffect(() => {
    if (!std) return;
    loadHomeworks();
    loadSubmissions();
    const ch = supabase.channel('homework-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, loadHomeworks).subscribe();
    return () => supabase.removeChannel(ch);
  }, [std]);

  async function loadHomeworks() {
    setLoading(true);
    const { data } = await supabase.from('homework').select('*, subjects(name), profiles(name), standards(name)').eq('standard_id', std).order('due_date', { ascending: false });
    setHomeworks(data||[]);
    setLoading(false);
  }

  async function loadSubmissions() {
    const { getStudents } = await import('../lib/api');
    const stds = await getStudents({ standardId: Number(std) });
    const ids = (stds||[]).map(s => s.id);
    if (!ids.length) return;
    const { data } = await supabase.from('homework_submissions').select('*, homework(title), students(name)').in('student_id', ids);
    const map = {};
    (data||[]).forEach(s => { if (!map[s.homework_id]) map[s.homework_id] = []; map[s.homework_id].push(s); });
    setSubmissions(map);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('homework').insert({ ...form, assigned_by: user.id });
      if (error) throw error;
      showToast('Homework assigned!');
      setShowForm(false);
      setForm({ title: '', description: '', standard_id: '', subject_id: '', due_date: '' });
      loadHomeworks();
    } catch { showToast('Failed to assign homework', 'error'); }
    setSaving(false);
  }

  async function toggleSubmission(homeworkId, studentId) {
    const existing = submissions[homeworkId]?.find(s => s.student_id === studentId);
    if (existing) {
      await supabase.from('homework_submissions').delete().eq('id', existing.id);
    } else {
      await supabase.from('homework_submissions').insert({ homework_id: homeworkId, student_id: studentId });
    }
    loadSubmissions();
  }

  async function markSubmitted(homeworkId) {
    const myId = user?.students?.[0]?.id;
    if (!myId) return;
    await toggleSubmission(homeworkId, myId);
  }

  const isDue = d => d && new Date(d) < new Date();
  const isToday = d => d && d === new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BookOpen size={28} color="var(--navy)" />
          <div><h2 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Homework Tracker</h2><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track assignments and completion status</p></div>
        </div>
        {isAdmin && <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Assign</>}</button>}
      </div>
      <div className="select-wrapper" style={{ marginBottom: 20 }}>
        <select value={std} onChange={e => setStd(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 10, fontSize: '0.9rem', background: 'white' }}>
          <option value="">Select a standard to view homework...</option>
          {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Assign New Homework</h3></div>
          <form onSubmit={handleSubmit} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Assignment title (e.g. Chapter 5 Exercises)" required style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 10, fontSize: '0.9rem' }} />
            <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Detailed instructions (optional)" rows={3} style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 10, fontSize: '0.9rem', resize: 'vertical' }} />
            <div className="form-row">
              <div className="form-group"><label>Due Date *</label><input type="date" value={form.due_date} onChange={e => setForm(p => ({...p, due_date: e.target.value}))} required style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 10 }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? <><Loader2 size={14} className="spin" /> Saving...</> : 'Assign Homework'}</button>
            </div>
          </form>
        </div>
      )}
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={32} className="spin" /></div>}
      {!loading && std && homeworks.length === 0 && (
        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}><BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} /><p>No homework assigned yet for this standard.</p></div></div>
      )}
      {!loading && homeworks.map(hw => {
        const subs = submissions[hw.id] || [];
        const total = user?.students?.length > 0 ? (user?.students||[]).filter(s => s.standard_id === hw.standard_id).length : subs.length;
        const completed = subs.length;
        const pct = total > 0 ? Math.round(completed/total*100) : 0;
        return (
          <div key={hw.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--navy)' }}>{hw.title}</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hw.subjects?.name} — {hw.standards?.name} — Due {hw.due_date}</p>
                  {hw.description && <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: 'var(--text)' }}>{hw.description}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isDue(hw.due_date) && !subs.find(s => s.student_id === user?.students?.[0]?.id) ? 'var(--danger)' : 'var(--success)' }}>
                    {isDue(hw.due_date) ? 'OVERDUE' : isToday(hw.due_date) ? 'DUE TODAY' : ''}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={14} color="var(--success)" />
                    <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{pct}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>done</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: pct+'%', background: pct >= 75 ? 'var(--success)' : pct >= 40 ? 'var(--gold)' : 'var(--danger)', borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
            </div>
            {isAdmin && (
              <div style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {subs.map(s => (
                  <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                    <CheckCircle size={10} />{s.students?.name}
                  </span>
                ))}
              </div>
            )}
            {!isAdmin && (
              <div style={{ padding: '12px 20px' }}>
                {user?.students?.[0]?.id && (
                  <button onClick={() => markSubmitted(hw.id)} className={subs.find(s => s.student_id === user?.students?.[0]?.id) ? 'btn-secondary btn-small' : 'btn-primary btn-small'}>
                    {subs.find(s => s.student_id === user?.students?.[0]?.id) ? <><CheckCircle size={12} /> Submitted</> : <><Circle size={12} /> Mark as Done</>}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
