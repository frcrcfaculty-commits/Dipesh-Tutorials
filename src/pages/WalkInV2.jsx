import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getStandards, getStudentWalkInData, createWalkInVisit, getWalkInVisits, addWalkInNote, getWalkInNotes } from '../lib/api';
import { Search, Loader2, Plus, Clock, BarChart3, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { showToast } from '../utils';

function pct(m, mx) { return mx > 0 ? Math.round((m / mx) * 100) : 0; }
function avgColor(p) { return p >= 75 ? '#10B981' : p >= 50 ? '#F59E0B' : '#EF4444'; }

export default function WalkIn() {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [selected, setSelected] = useState(null);
    const [data, setData] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [standards, setStandards] = useState([]);
    const [visits, setVisits] = useState([]);
    const [loadingVisits, setLoadingVisits] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [noteType, setNoteType] = useState('general');
    const [savingNote, setSavingNote] = useState(false);
    const [visitNotes, setVisitNotes] = useState({});
    const [creatingVisit, setCreatingVisit] = useState(false);
    const [expandedVisit, setExpandedVisit] = useState(null);

    const sidebarSections = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'marks', label: 'Test Marks', icon: '📝' },
        { id: 'compare', label: 'Compare', icon: '📈' },
        { id: 'notes', label: 'Visit Notes', icon: '📋' },
    ];
    const noteTypeColors = {
        academic: '#3B82F6', fee: '#10B981', attendance: '#F59E0B',
        behavioral: '#EF4444', general: '#6B7280', other: '#8B5CF6',
    };

    useEffect(() => { getStandards().then(s => setStandards(s || [])); }, []);

    async function handleSearch(e) {
        e.preventDefault();
        if (!query.trim()) return;
        setLoadingSearch(true);
        try {
            const { getStudents } = await import('../lib/api');
            const results = await getStudents({ search: query });
            setStudents(results || []);
        } catch { showToast('Search failed', 'error'); }
        setLoadingSearch(false);
    }

    async function selectStudent(student) {
        setSelected(student);
        setLoadingData(true);
        setData(null);
        setActiveTab('overview');
        try {
            const d = await getStudentWalkInData(student.id);
            setData(d);
        } catch { showToast('Failed to load student data', 'error'); }
        setLoadingData(false);
        loadVisits(student.id);
    }

    async function loadVisits(studentId) {
        setLoadingVisits(true);
        try { setVisits(await getWalkInVisits(studentId)); }
        catch { setVisits([]); }
        setLoadingVisits(false);
    }

    async function startNewVisit() {
        if (!selected) return;
        setCreatingVisit(true);
        try {
            await createWalkInVisit({ studentId: selected.id, visitedBy: user.id, summary: 'Walk-in session' });
            showToast('Visit started!');
            loadVisits(selected.id);
        } catch { showToast('Failed to start visit', 'error'); }
        setCreatingVisit(false);
    }

    async function handleAddNote(visitId) {
        if (!noteText.trim()) return;
        setSavingNote(true);
        try {
            await addWalkInNote({ visitId, noteText: noteText.trim(), noteType, createdBy: user.id });
            setNoteText('');
            const notes = await getWalkInNotes(visitId);
            setVisitNotes(prev => ({ ...prev, [visitId]: notes }));
            showToast('Note added!');
        } catch { showToast('Failed to add note', 'error'); }
        setSavingNote(false);
    }

    async function toggleVisit(visitId) {
        setExpandedVisit(prev => prev === visitId ? null : visitId);
        if (!visitNotes[visitId]) {
            const notes = await getWalkInNotes(visitId);
            setVisitNotes(prev => ({ ...prev, [visitId]: notes }));
        }
    }

    const recentAtt = (data?.attendance || []).slice(0, 30);
    const attPct = recentAtt.length > 0 ? Math.round(recentAtt.filter(a => a.status === 'present' || a.status === 'late').length / recentAtt.length * 100) : 0;
    const allTestResults = data?.allTestResults || [];
    const subjectMarks = {};
    allTestResults.forEach(r => {
        const sub = r.subjects?.name || 'Unknown';
        if (!subjectMarks[sub]) subjectMarks[sub] = [];
        subjectMarks[sub].push({ marks: r.marks_obtained, max: r.max_marks, grade: r.grade });
    });
    const subjectAverages = Object.entries(subjectMarks).map(([subject, marks]) => ({
        subject, avg: Math.round(marks.reduce((s, m) => s + pct(m.marks, m.max), 0) / marks.length), count: marks.length
    })).sort((a, b) => b.avg - a.avg);

    const classMarksData = data?.classMarks || [];
    const classAvgData = {};
    classMarksData.forEach(r => {
        const sub = r.subjects?.name || 'Unknown';
        if (!classAvgData[sub]) classAvgData[sub] = [];
        classAvgData[sub].push({ m: r.marks_obtained, mx: r.max_marks });
    });
    Object.keys(classAvgData).forEach(sub => {
        const pairs = classAvgData[sub];
        classAvgData[sub] = pairs.length > 0 ? Math.round(pairs.reduce((s, p) => s + pct(p.m, p.mx), 0) / pairs.length) : 0;
    });

    const weakSubjects = subjectAverages.slice(0, 2);
    const strongSubjects = [...subjectAverages].reverse().slice(0, 2);
    const chartData = subjectAverages.map(sa => ({ subject: sa.subject, yourAvg: sa.avg, classAvg: classAvgData[sa.subject] || 0 }));

    const noteTypes = ['general', 'academic', 'fee', 'attendance', 'behavioral', 'other'];

    return (
        <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0 }}>Walk-In</h2>
                <div style={{ display: 'flex', gap: 8 }}>
                    {selected && (
                        <button className='btn-secondary btn-small' onClick={() => { setSelected(null); setData(null); setVisits([]); }}>Back to Search</button>
                    )}
                </div>
            </div>

            {!selected ? (
                <div className='card'>
                    <div className='card-header'><h3>Find Student</h3></div>
                    <form onSubmit={handleSearch} style={{display:'flex',gap:8,padding:'0 16px 16px'}}>
                        <div style={{flex:1,position:'relative'}}>
                            <Search size={16} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-muted)'}} />
                            <input value={query} onChange={e => setQuery(e.target.value)} placeholder='Search by name or roll number...' style={{width:'100%',padding:'10px 12px 10px 36px',borderRadius:8,border:'1px solid var(--border)',fontSize:'0.9rem'}} />
                        </div>
                        <button type='submit' className='btn-primary' disabled={loadingSearch}>{loadingSearch ? <Loader2 size={14} className='spin' /> : 'Search'}</button>
                    </form>
                    {students.length > 0 && (
                        <div style={{padding:'0 16px 16px'}}>
                            {students.map(s => (
                                <div key={s.id} onClick={() => selectStudent(s)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 8px',borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
                                    <div><div style={{fontWeight:600}}>{s.name}</div><div style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{s.standards?.name} — Roll {s.roll_no}</div></div>
                                    <ArrowRight size={16} style={{color:'var(--text-muted)'}} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>

                    <div style={{display:'flex',gap:24,alignItems:'flex-start'}}>
                        <div style={{width:200,flexShrink:0}}>
                            <div style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Sections</div>
                            {sidebarSections.map(sec => (
                                <button key={sec.id} onClick={() => setActiveTab(sec.id)}
                                    style={{width:'100%',padding:'10px 14px',border:'none',borderRadius:8,
                                        background:activeTab===sec.id?'var(--navy)':'var(--surface-raised)',
                                        color:activeTab===sec.id?'white':'inherit',
                                        textAlign:'left',cursor:'pointer',fontSize:'0.85rem',marginBottom:4,
                                        fontWeight:activeTab===sec.id?600:400,transition:'all 0.15s',
                                        display:'flex',alignItems:'center',gap:8}}>
                                    <span>{sec.icon}</span><span>{sec.label}</span>
                                </button>
                            ))}
                            <div style={{marginTop:16,padding:12,background:'linear-gradient(135deg,#f8f6f3,#f0ede8)',borderRadius:10,border:'1px solid var(--border)'}}>
                                <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--navy)',marginBottom:4}}>{selected?.name}</div>
                                <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{selected?.standards?.name}</div>
                                <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>Roll #{selected?.roll_no}</div>
                            </div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>

                            {activeTab === 'overview' && (
                                <div>
                                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
                                        <div style={{background:'linear-gradient(135deg,#0A2351,#1a4a8a)',borderRadius:12,padding:'16px 20px',color:'white'}}>
                                            <div style={{fontSize:'0.75rem',opacity:0.85,marginBottom:4}}>Attendance</div>
                                            <div style={{fontSize:'2rem',fontWeight:700}}>{attPct}%</div>
                                        </div>
                                        <div style={{background:'linear-gradient(135deg,#B6922E,#d4aa4a)',borderRadius:12,padding:'16px 20px',color:'white'}}>
                                            <div style={{fontSize:'0.75rem',opacity:0.85,marginBottom:4}}>Tests Taken</div>
                                            <div style={{fontSize:'2rem',fontWeight:700}}>{allTestResults.length}</div>
                                        </div>
                                        <div style={{background:'linear-gradient(135deg,#10B981,#22c55e)',borderRadius:12,padding:'16px 20px',color:'white'}}>
                                            <div style={{fontSize:'0.75rem',opacity:0.85,marginBottom:4}}>Visits</div>
                                            <div style={{fontSize:'2rem',fontWeight:700}}>{visits.length}</div>
                                        </div>
                                        <div style={{background:'linear-gradient(135deg,#3B82F6,#60a5fa)',borderRadius:12,padding:'16px 20px',color:'white'}}>
                                            <div style={{fontSize:'0.75rem',opacity:0.85,marginBottom:4}}>Subjects</div>
                                            <div style={{fontSize:'2rem',fontWeight:700}}>{subjectAverages.length}</div>
                                        </div>
                                    </div>
                                    <div className='card'>
                                        <div className='card-header'><h3>Student Info</h3></div>
                                        <div className='card-body' style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,fontSize:'0.9rem'}}>
                                            <div><strong>Parent:</strong> {selected?.parent_name || '—'}</div>
                                            <div><strong>Phone:</strong> {selected?.parent_phone || '—'}</div>
                                            <div><strong>Email:</strong> {selected?.parent_email || '—'}</div>
                                            <div><strong>DOB:</strong> {selected?.date_of_birth || '—'}</div>
                                            <div><strong>Enrolled:</strong> {selected?.enrollment_date || '—'}</div>
                                            <div><strong>Standard:</strong> {selected?.standards?.name || '—'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'marks' && (
                                <div className='card'>
                                    <div className='card-header'><h3>All Test Results</h3></div>
                                    <div className='card-body' style={{overflowX:'auto'}}>
                                        <table className='data-table'>
                                            <thead><tr><th>Test</th><th>Subject</th><th>Marks</th><th>Max</th><th>%</th><th>Grade</th><th>Class Avg</th></tr></thead>
                                            <tbody>
                                                {allTestResults.map(r => {
                                                    const ca = classAvgData[r.subjects?.name || ''] || 0;
                                                    const p = pct(r.marks_obtained, r.max_marks);
                                                    return (
                                                        <tr key={r.id}>
                                                            <td style={{fontWeight:500}}>{r.tests?.name || '—'}</td>
                                                            <td>{r.subjects?.name || '—'}</td>
                                                            <td style={{fontWeight:600}}>{r.marks_obtained}</td>
                                                            <td>{r.max_marks}</td>
                                                            <td style={{color:avgColor(p),fontWeight:700}}>{p}%</td>
                                                            <td><span className='badge' style={{background:avgColor(p),color:'white'}}>{r.grade || '—'}</span></td>
                                                            <td style={{color:'var(--text-muted)'}}>{ca > 0 ? ca+'%' : '—'}</td>
                                                        </tr>
                                                    );
                                                })}
                                                {allTestResults.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',padding:24,color:'var(--text-muted)'}}>No test results found</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'compare' && (
                                <div className='card'>
                                    <div className='card-header'><h3>Your Avg vs Class Avg</h3></div>
                                    <div className='card-body'>
                                        <ResponsiveContainer width='100%' height={300}>
                                            <BarChart data={chartData} layout='vertical'>
                                                <CartesianGrid strokeDasharray='3 3' />
                                                <XAxis type='number' domain={[0,100]} tickFormatter={v => v+'%'} />
                                                <YAxis type='category' dataKey='subject' width={90} fontSize={11} />
                                                <Tooltip formatter={v => [v+'%']} />
                                                <Bar dataKey='yourAvg' name='Your Avg' fill='#0A2351' radius={[0,4,4,0]} />
                                                <Bar dataKey='classAvg' name='Class Avg' fill='#B6922E' radius={[0,4,4,0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div>
                                    <div style={{background:'white',borderRadius:12,padding:16,marginBottom:16,border:'1px solid var(--border)'}}>
                                        <div style={{fontSize:'0.85rem',fontWeight:600,marginBottom:12,color:'var(--navy)'}}>+ New Visit</div>
                                        <button className='btn-primary' onClick={startNewVisit} disabled={creatingVisit}>
                                            {creatingVisit ? <Loader2 size={14} className='spin' /> : <><Plus size={14} /> Start New Visit</>}
                                        </button>
                                    </div>
                                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                                        {visits.length === 0 && <p style={{textAlign:'center',color:'var(--text-muted)',padding:24}}>No visits yet</p>}
                                        {visits.map(visit => (
                                            <div key={visit.id} style={{background:'white',borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
                                                <div onClick={() => toggleVisit(visit.id)} style={{padding:'14px 16px',background:'linear-gradient(135deg,#f8f6f3,#f0ede8)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                                        <Clock size={14} style={{color:'var(--text-muted)'}} />
                                                        <span style={{fontWeight:600,fontSize:'0.9rem'}}>{new Date(visit.visited_at).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</span>
                                                        <span style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{visit.profiles?.name || ''}</span>
                                                    </div>
                                                    <span style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{expandedVisit === visit.id ? '▲' : '▼'}</span>
                                                </div>
                                                {expandedVisit === visit.id && (
                                                    <div style={{padding:16}}>
                                                        <div style={{display:'flex',gap:8,marginBottom:12}}>
                                                            <select value={noteType} onChange={e => setNoteType(e.target.value)} style={{padding:'6px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:'0.85rem'}}>
                                                                {noteTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                                                            </select>
                                                            <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder='Add a note...' style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid var(--border)',fontSize:'0.85rem'}} />
                                                            <button className='btn-primary btn-small' onClick={() => handleAddNote(visit.id)} disabled={savingNote}>
                                                                {savingNote ? <Loader2 size={12} className='spin' /> : <Plus size={12} />}
                                                            </button>
                                                        </div>
                                                        <div style={{display:'flex',flexDirection:'column',gap:6}}>
                                                            {(visitNotes[visit.id] || []).map(note => (
                                                                <div key={note.id} style={{padding:'8px 10px',background:'var(--surface-raised)',borderRadius:6,fontSize:'0.85rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                                                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                                                                        <span style={{fontSize:'0.7rem',fontWeight:700,padding:'2px 8px',borderRadius:12,background:noteTypeColors[note.note_type]||'#6B7280',color:'white'}}>{note.note_type}</span>
                                                                        <span>{note.note_text}</span>
                                                                    </div>
                                                                    <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>{note.profiles?.name || ''}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
