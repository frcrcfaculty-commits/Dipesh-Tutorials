import React, { useState } from 'react';
import { useAuth } from '../App';
import { getStudents, getTestResults, getStudentAttendance, getFeeSummary, getStandards } from '../lib/api';
import { generateProgressReport } from '../reports';
import { Search, Download, Loader2, FileText, CheckCircle } from 'lucide-react';
import { showToast } from '../utils';

export default function ProgressReport() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [standards, setStandards] = useState([]);
  const [stdFilter, setStdFilter] = useState('all');

  async function search() {
    if (!query.trim() && stdFilter === 'all') { showToast('Search or select a standard', 'error'); return; }
    setLoading(true);
    try {
      const [stds, tests] = await Promise.all([getStandards(), getTests()]);
      setStandards(stds||[]);
      let students = [];
      if (stdFilter !== 'all') {
        const { getStudents } = await import('../lib/api');
        students = await getStudents({ standardId: Number(stdFilter) });
      }
      setResults(students);
    } catch { showToast('Search failed', 'error'); }
    setLoading(false);
  }

  async function selectStudent(student) {
    setSelected(student);
    setGenerating(true);
    try {
      const [att, results, fees] = await Promise.all([
        getStudentAttendance(student.id, 180),
        getTestResults({ studentId: student.id }),
        getFeeSummary({ studentIds: [student.id] })
      ]);
      setAttendance(att||[]);
      setResults(results||[]);
      const fee = fees && fees.length > 0 ? fees[0] : null;
      setFeeSummary(fee);
      const reportData = {
        student: { name: student.name, standard: student.standards?.name, roll_no: student.roll_no, date_of_birth: student.date_of_birth, parent_name: student.parent_name, parent_phone: student.parent_phone, parent_email: student.parent_email },
        results: (results||[]).map(r => ({ test_name: r.tests?.name, subject_name: r.subjects?.name, marks_obtained: r.marks_obtained, max_marks: r.max_marks, grade: r.grade })),
        attendance: att||[],
        feeSummary: fee
      };
      generateProgressReport(reportData);
      showToast('Report downloaded!');
    } catch { showToast('Failed to generate report', 'error'); }
    setGenerating(false);
  }

  async function downloadAll() {
    if (stdFilter === 'all') { showToast('Select a standard first', 'error'); return; }
    setGenerating(true);
    try {
      const { getStudents } = await import('../lib/api');
      const students = await getStudents({ standardId: Number(stdFilter) });
      for (const s of (students||[]).slice(0,20)) {
        await selectStudent(s);
        await new Promise(r => setTimeout(r, 800));
      }
      showToast('All reports downloaded!');
    } catch { showToast('Bulk download failed', 'error'); }
    setGenerating(false);
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <FileText size={28} color="var(--navy)" />
        <div><h2 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Progress Reports</h2><p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generate branded PDF report cards for students</p></div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>Select Student or Standard</h3></div>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="select-wrapper" style={{ flex: 1, minWidth: 180 }}>
            <select value={stdFilter} onChange={e => setStdFilter(e.target.value)}>
              <option value="all">All Standards</option>
              {(standards||[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 2, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search student name..." style={{ width: '100%', padding: '10px 12px 10px 36px', border: '2px solid var(--border)', borderRadius: 10, fontSize: '0.9rem' }} />
          </div>
          <button className="btn-primary" onClick={search} disabled={loading}>{loading ? <Loader2 size={14} className="spin" /> : <><Search size={14} /> Search</>}</button>
          <button className="btn-secondary" onClick={downloadAll} disabled={generating || stdFilter==='all'}>{generating ? <Loader2 size={14} className="spin" /> : <><Download size={14} /> Bulk (20)</>} </button>
        </div>
      </div>
      {(results||[]).length > 0 && (
        <div className="card">
          <div className="card-header"><h3>Students</h3><span style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{results.length} found</span></div>
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {(results||[]).map(s => (
              <div key={s.id} onClick={() => selectStudent(s)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,35,81,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.standards?.name} — Roll {s.roll_no}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selected?.id === s.id && generating && <Loader2 size={14} className="spin" />}
                  {selected?.id === s.id && !generating && <CheckCircle size={16} color="var(--success)" />}
                  <Download size={16} color="var(--gold)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
