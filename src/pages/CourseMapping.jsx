import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useData } from '../App';
import { getTestResults, getTests } from '../lib/api';
import { Target, AlertTriangle, TrendingUp, BookOpen, Lightbulb } from 'lucide-react';

export default function CourseMapping() {
    const { user } = useAuth();
    const { standards, getSubjectsForStandard } = useData();
    if (user.role === 'student') return <StudentWeaknessView user={user} />;
    return <AdminCOView standards={standards} getSubjectsForStandard={getSubjectsForStandard} />;
}

function StudentWeaknessView({ user }) {
    const student = user.student;
    const [tests, setTests] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!student) return;
        Promise.all([getTests(), getTestResults({ studentId: student.id })])
            .then(([t, r]) => { setTests(t || []); setResults(r || []); setLoading(false); });
    }, [student]);

    if (!student) return <div className="empty-state"><h3>Student profile not found</h3></div>;

    const latestTest = tests[0];
    const latestResults = latestTest ? results.filter(r => r.test_id === latestTest.id) : [];
    const weakResults = latestResults.filter(r => r.max_marks > 0 && (r.marks_obtained / r.max_marks) * 100 < 50);
    const strongResults = latestResults.filter(r => r.max_marks > 0 && (r.marks_obtained / r.max_marks) * 100 >= 75);

    return (
        <>
            <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>Topics to Improve</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Based on your latest test{latestTest ? ` (${latestTest.name})` : ''}</p>
            </div>
            {loading ? <div className="empty-state"><div className="spinner" /></div> : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card navy"><div className="stat-icon navy"><Target size={24} /></div><div className="stat-info"><h4>Tested</h4><div className="stat-value">{latestResults.length}</div></div></div>
                        <div className="stat-card red"><div className="stat-icon red"><AlertTriangle size={24} /></div><div className="stat-info"><h4>Weak</h4><div className="stat-value">{weakResults.length}</div></div></div>
                        <div className="stat-card green"><div className="stat-icon green"><TrendingUp size={24} /></div><div className="stat-info"><h4>Strong</h4><div className="stat-value">{strongResults.length}</div></div></div>
                    </div>
                    {weakResults.length > 0 ? (
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div className="card-header"><h3><AlertTriangle size={18} style={{ marginRight: 8, color: 'var(--danger)' }} />Needs Improvement</h3></div>
                            <div className="card-body">
                                {weakResults.map(r => {
                                    const pct = Math.round((r.marks_obtained / r.max_marks) * 100);
                                    return (
                                        <div key={r.id} style={{ marginBottom: 16, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <div><h4 style={{ fontSize: '1rem', color: 'var(--navy)' }}>{r.subjects?.name}</h4><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.marks_obtained}/{r.max_marks} · {r.grade}</span></div>
                                                <span className={`badge ${pct < 35 ? 'absent' : 'late'}`}>{pct}%</span>
                                            </div>
                                            <div className="progress-bar"><div className={`progress-fill ${pct < 35 ? 'red' : 'gold'}`} style={{ width: `${pct}%` }} /></div>
                                            <div style={{ marginTop: 10, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                <Lightbulb size={14} style={{ marginRight: 4, color: 'var(--gold)' }} />
                                                Practice more and check the Resource Hub for study materials.
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: 48 }}><TrendingUp size={36} style={{ color: 'var(--success)', marginBottom: 12 }} /><h3 style={{ color: 'var(--success)' }}>Great work!</h3><p style={{ color: 'var(--text-muted)' }}>No weak subjects.</p></div></div>
                    )}
                    {latestResults.length === 0 && <div className="empty-state"><BookOpen /><h3>No results yet</h3></div>}
                </>
            )}
        </>
    );
}

function AdminCOView({ standards, getSubjectsForStandard }) {
    const [selectedStandard, setSelectedStandard] = useState(standards[0]?.id || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const subjects = selectedStandard ? getSubjectsForStandard(parseInt(selectedStandard)) : [];

    useEffect(() => { loadData(); }, [selectedStandard]);

    async function loadData() {
        setLoading(true);
        try {
            const t = await getTests(parseInt(selectedStandard));
            if (t?.length > 0) { const r = await getTestResults({ testId: t[0].id }); setResults(r || []); }
            else setResults([]);
        } catch (err) { console.error(err); }
        setLoading(false);
    }

    const subjectAttainment = useMemo(() => {
        return subjects.map(sub => {
            const subResults = results.filter(r => r.subject_id === sub.id);
            const avg = subResults.length > 0 ? Math.round(subResults.reduce((s, r) => s + (r.max_marks > 0 ? (r.marks_obtained / r.max_marks) * 100 : 0), 0) / subResults.length) : 0;
            return { ...sub, attainment: avg, studentCount: subResults.length };
        });
    }, [subjects, results]);

    const overallAttainment = subjectAttainment.length > 0 ? Math.round(subjectAttainment.reduce((s, sa) => s + sa.attainment, 0) / subjectAttainment.length) : 0;

    return (
        <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div className="select-wrapper" style={{ minWidth: 180 }}>
                    <select value={selectedStandard} onChange={e => setSelectedStandard(e.target.value)}>
                        {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><Target size={24} /></div><div className="stat-info"><h4>Subjects</h4><div className="stat-value">{subjects.length}</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><TrendingUp size={24} /></div><div className="stat-info"><h4>Avg Attainment</h4><div className="stat-value">{overallAttainment}%</div></div></div>
                <div className="stat-card red"><div className="stat-icon red"><AlertTriangle size={24} /></div><div className="stat-info"><h4>Below 50%</h4><div className="stat-value">{subjectAttainment.filter(s => s.attainment < 50).length}</div></div></div>
            </div>
            {loading ? <div className="empty-state"><div className="spinner" /></div> : (
                <div className="card">
                    <div className="card-header"><h3>Subject Attainment</h3></div>
                    <div className="card-body">
                        {subjectAttainment.length === 0 ? <div className="empty-state"><Target /><h3>No data</h3></div> :
                            subjectAttainment.map(sa => (
                                <div key={sa.id} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy)' }}>{sa.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>({sa.studentCount} results)</span></span>
                                        <span style={{ fontWeight: 700, color: sa.attainment >= 75 ? 'var(--success)' : sa.attainment >= 50 ? 'var(--gold)' : 'var(--danger)' }}>{sa.attainment}%</span>
                                    </div>
                                    <div className="progress-bar"><div className={`progress-fill ${sa.attainment >= 75 ? 'green' : sa.attainment >= 50 ? 'gold' : 'red'}`} style={{ width: `${sa.attainment}%` }} /></div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </>
    );
}
