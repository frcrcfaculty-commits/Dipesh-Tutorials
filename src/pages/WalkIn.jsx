import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getStudents, getStandards, getStudentWalkInData } from '../lib/api';
import { Search, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { showToast } from '../utils';

export default function WalkIn() {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [standards, setStandards] = useState([]);
    const [selectedStd, setSelectedStd] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [walkInData, setWalkInData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => { Promise.all([getStudents(), getStandards()]).then(([s, stds]) => { setStudents(s||[]); setStandards(stds||[]); }).catch(()=>{}); }, []);

    function pct(a, b) { if (!b) return 0; return Math.round((a / b) * 100); }
    function avgColor(p) { return p >= 75 ? '#10B981' : p >= 50 ? '#F59E0B' : '#EF4444'; }

    function handleSearch(e) {
        e.preventDefault();
        if (!search.trim()) { showToast('Enter a name or roll number', 'error'); return; }
        const stdId = selectedStd === 'all' ? null : Number(selectedStd);
        const found = students.find(s => { if (stdId && s.standard_id !== stdId) return false; return s.name.toLowerCase().includes(search.toLowerCase()) || String(s.roll_no) === search.trim(); });
        if (!found) { showToast('Student not found', 'error'); return; }
        setSelectedStudent(found);
        loadData(found.id);
    }

    async function loadData(id) { setLoading(true); try { const data = await getStudentWalkInData(id); setWalkInData(data); } catch(e) { showToast('Failed to load', 'error'); } finally { setLoading(false); } }

    if (!selectedStudent) { return (
        <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 48 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}><h2 style={{ marginBottom: 8 }}>Walk-In Student Lookup</h2><p style={{ color: 'var(--text-muted)' }}>Search by name or roll number to open a detailed student dashboard</p></div>
            <form onSubmit={handleSearch} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select value={selectedStd} onChange={e => setSelectedStd(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }}><option value="all">All Standards</option>{standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or Roll No" style={{ flex: 2, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)' }} />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}><Search size={16} /> {loading ? 'Searching...' : 'Search Student'}</button>
            </form>
        </div>); }

    if (loading && !walkInData) return <div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>;
    const d = walkInData; if (!d) return null;

    const studentMarks = (d.allTestResults||[]).filter(r => r.student_id === selectedStudent.id);
    const subjectMap = {}; studentMarks.forEach(r => { const sn = r.subjects ? r.subjects.name : 'Unknown'; if (!subjectMap[sn]) subjectMap[sn] = []; subjectMap[sn].push({ pct: pct(r.marks_obtained, r.max_marks), grade: r.grade, test: r.tests ? r.tests.name : 'Test' }); });
    const subjectAverages = Object.entries(subjectMap).map(([sub, scores]) => ({ subject: sub, avg: Math.round(scores.reduce((a,b)=>a+b.pct,0)/scores.length) }));
    const classSubjectMap = {}; (d.classMarks||[]).forEach(r => { const sn = r.subjects ? r.subjects.name : 'Unknown'; if (!classSubjectMap[sn]) classSubjectMap[sn] = []; classSubjectMap[sn].push(pct(r.marks_obtained, r.max_marks)); });
    const classAvgData = Object.entries(classSubjectMap).map(([sub, scores]) => ({ subject: sub, classAvg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) }));
    const testTrendRaw = {}; studentMarks.slice(0,12).forEach(r => { const name = r.tests ? r.tests.name : 'Test'; if (!testTrendRaw[name]) testTrendRaw[name] = []; testTrendRaw[name].push(pct(r.marks_obtained, r.max_marks)); });
    const testTrendData = Object.entries(testTrendRaw).map(([name, scores]) => ({ name, avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) })).reverse();
    const attPct = d.attendance.length > 0 ? Math.round(d.attendance.filter(a => a.status==='present'||a.status==='late').length / d.attendance.length * 100) : 0;
    const classAttPct = d.classAttendance.length > 0 ? Math.round(d.classAttendance.filter(a => a.status==='present'||a.status==='late').length / d.classAttendance.length * 100) : 0;
    const weakSubjects = [...subjectAverages].sort((a,b) => a.avg - b.avg).slice(0,3);
    const strongSubjects = [...subjectAverages].sort((a,b) => b.avg - a.avg).slice(0,3);
    const overallAvg = subjectAverages.length > 0 ? Math.round(subjectAverages.reduce((s,r) => s + r.avg, 0) / subjectAverages.length) : 0;
    const recentAtt = d.attendance.slice(0,14).reverse();
    return (
        <div style={{ paddingBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h2 style={{ margin: 0 }}>{selectedStudent.name}</h2>
                        <span style={{ background: 'var(--navy)', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem' }}>{selectedStudent.standards ? selectedStudent.standards.name : ''}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.85rem' }}>Roll No: {selectedStudent.roll_no} | Parent: {selectedStudent.parent_name} | {selectedStudent.parent_phone}</p>
                </div>
                <button onClick={() => { setSelectedStudent(null); setWalkInData(null); }} className="btn-secondary">Search Another</button>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
                {[['overview','Overview'],['marks','Marks'],['attendance','Attendance'],['compare','Class Compare']].map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab===tab?700:400, borderBottom: activeTab===tab?'3px solid var(--navy)':'3px solid transparent', color: activeTab===tab?'var(--navy)':'var(--text-muted)' }}>{label}</button>
                ))}
            </div>
            {activeTab === 'overview' ? (
                <>
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card" style={{ background: 'linear-gradient(135deg,#0A2351,#1a3d7a)', color: 'white' }}><div className="stat-info"><h4>Overall Average</h4><div className="stat-value" style={{fontSize:'2rem'}}>{overallAvg}%</div></div></div>
                        <div className="stat-card gold"><div className="stat-info"><h4>Attendance</h4><div className="stat-value">{attPct}%</div></div></div>
                        <div className="stat-card green"><div className="stat-info"><h4>Strongest</h4><div className="stat-value" style={{fontSize:'1rem'}}>{strongSubjects[0] ? strongSubjects[0].subject : '—'}</div></div></div>
                        <div className="stat-card red"><div className="stat-info"><h4>Needs Focus</h4><div className="stat-value" style={{fontSize:'1rem'}}>{weakSubjects[0] ? weakSubjects[0].subject : '—'}</div></div></div>
                    </div>
                    <div className="grid-2">
                        <div className="card"><div className="card-header"><h3>Subject Averages</h3></div><div className="card-body"><ResponsiveContainer width="100%" height={250}><BarChart data={subjectAverages} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" domain={[0,100]} tickFormatter={v => v+'%'} /><YAxis type="category" dataKey="subject" width={90} fontSize={11} /><Tooltip formatter={v => [v+'%','Avg']} /><Bar dataKey="avg" radius={[0,4,4,0]}>{subjectAverages.map((e,i) => <stop key={i} offset="0" stopColor={avgColor(e.avg)} />)}</Bar></BarChart></ResponsiveContainer></div></div>
                        <div className="card"><div className="card-header"><h3>Performance Trend</h3></div><div className="card-body"><ResponsiveContainer width="100%" height={250}><LineChart data={testTrendData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis domain={[0,100]} tickFormatter={v => v+'%'} /><Tooltip formatter={v => [v+'%','Avg']} /><Line type="monotone" dataKey="avg" stroke="#B6922E" strokeWidth={2} dot={{r:4}} /></LineChart></ResponsiveContainer></div></div>
                    </div>
                    {weakSubjects.length > 0 ? (<div className="card" style={{ marginTop: 24 }}><div className="card-header"><h3><AlertCircle size={16} style={{marginRight:6}} />Areas to Focus On</h3></div><div className="card-body" style={{ display:'flex', flexDirection:'column', gap:12 }}>{weakSubjects.map((ws,i) => (<div key={i}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontWeight:600}}>{ws.subject}</span><span style={{color:avgColor(ws.avg),fontWeight:700}}>{ws.avg}%</span></div><div style={{height:8,background:'var(--border)',borderRadius:4}}><div style={{height:'100%',width:ws.avg+'%',background:avgColor(ws.avg),borderRadius:4}} /></div></div>))}</div></div>) : null}
                </>
            ) : null}
            {activeTab === 'marks' ? (
                <div className="card"><div className="card-header"><h3>All Test Results</h3></div><div className="card-body" style={{padding:0}}><div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>%</th><th>Grade</th><th>Class Avg</th></tr></thead><tbody>
                                    {studentMarks.map(r => { const p2 = pct(r.marks_obtained, r.max_marks); const ca = classAvgData.find(c => c.subject === (r.subjects ? r.subjects.name : 'Unknown')); return (<tr key={r.id}><td style={{fontWeight:600}}>{r.tests ? r.tests.name : '—'}</td><td>{r.subjects ? r.subjects.name : '—'}</td><td>{r.marks_obtained}/{r.max_marks}</td><td><span style={{color:avgColor(p2),fontWeight:700}}>{p2}%</span></td><td><span className="badge" style={{background:avgColor(p2),color:'white'}}>{r.grade || '—'}</span></td><td style={{color:'var(--text-muted)'}}>{ca ? ca.classAvg : 0}%</td></tr>); })}
                                    {studentMarks.length === 0 ? <tr><td colSpan={6} style={{textAlign:'center',padding:32,color:'var(--text-muted)'}}>No test results yet</td></tr> : null}
                                </tbody></table></div></div></div>
            ) : null}
            {activeTab === 'attendance' ? (
                <>
                    <div className="stats-grid" style={{marginBottom:24}}>
                        <div className="stat-card gold"><div className="stat-info"><h4>Your Attendance</h4><div className="stat-value">{attPct}%</div></div></div>
                        <div className="stat-card navy"><div className="stat-info"><h4>Class Average</h4><div className="stat-value">{classAttPct}%</div></div></div>
                    </div>
                    <div className="card"><div className="card-header"><h3>Recent Attendance</h3></div><div className="card-body" style={{display:'flex',flexWrap:'wrap',gap:8}}>
                        {recentAtt.map(a => (<div key={a.id} style={{ padding: '6px 12px', borderRadius: 8, background: a.status==='present'?'#10B981':a.status==='late'?'#3B82F6':'#EF4444', color: 'white', fontSize: '0.78rem', fontWeight: 600 }} title={a.date}>{a.date ? a.date.slice(5) : ''}</div>))}
                        {recentAtt.length === 0 ? <p style={{color:'var(--text-muted)'}}>No attendance records</p> : null}
                    </div></div>
                </>
            ) : null}
            {activeTab === 'compare' ? (
                <div className="grid-2">
                    <div className="card"><div className="card-header"><h3>Your Avg vs Class Avg</h3></div><div className="card-body"><ResponsiveContainer width="100%" height={300}><BarChart data={subjectAverages.map(sa => { const ca = classAvgData.find(c => c.subject === sa.subject); return { subject: sa.subject, yourAvg: sa.avg, classAvg: ca ? ca.classAvg : 0 }; })} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" domain={[0,100]} tickFormatter={v => v+'%'} /><YAxis type="category" dataKey="subject" width={90} fontSize={11} /><Tooltip formatter={v => [v+'%']} /><Bar dataKey="yourAvg" name="Your Avg" fill="#0A2351" radius={[0,4,4,0]} /><Bar dataKey="classAvg" name="Class Avg" fill="#B6922E" radius={[0,4,4,0]} /></BarChart></ResponsiveContainer></div></div>
                    <div className="card"><div className="card-header"><h3>Weak vs Strong Subjects</h3></div><div className="card-body" style={{display:'flex',flexDirection:'column',gap:16}}>
                        {weakSubjects.map((ws,i) => (<div key={'w'+i}><div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:4}}>Weakest</div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontWeight:600}}>{ws.subject}</span><span style={{color:avgColor(ws.avg),fontWeight:700}}>{ws.avg}%</span></div><div style={{height:8,background:'var(--border)',borderRadius:4}}><div style={{height:'100%',width:ws.avg+'%',background:avgColor(ws.avg),borderRadius:4}} /></div></div>))}
                        {strongSubjects.map((ss,i) => (<div key={'s'+i}><div style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:4}}>Strongest</div><div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontWeight:600}}>{ss.subject}</span><span style={{color:avgColor(ss.avg),fontWeight:700}}>{ss.avg}%</span></div><div style={{height:8,background:'var(--border)',borderRadius:4}}><div style={{height:'100%',width:ss.avg+'%',background:avgColor(ss.avg),borderRadius:4}} /></div></div>))}
                    </div></div>
                </div>
            ) : null}
        </div>
    );
}
