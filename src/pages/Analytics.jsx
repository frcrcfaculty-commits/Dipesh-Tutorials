import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useData } from '../App';
import { getTestResults, getTests } from '../lib/api';
import { BarChart3, TrendingUp, Target, AlertTriangle, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const COLORS = ['#0A2351', '#B6922E', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

export default function Analytics() {
    const { user } = useAuth();
    const { standards, getSubjectsForStandard } = useData();
    const [tests, setTests] = useState([]);
    const [results, setResults] = useState([]);
    const [selectedTest, setSelectedTest] = useState('');
    const [selectedStandard, setSelectedStandard] = useState('All');
    const [loading, setLoading] = useState(true);

    const isStudent = user.role === 'student';
    const isParent = user.role === 'parent';
    const studentId = isStudent ? user.student?.id : isParent ? user.child?.id : null;

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const t = await getTests();
            setTests(t || []);
            if (t?.length > 0) {
                setSelectedTest(t[0].id);
                const filters = { testId: t[0].id };
                if (studentId) filters.studentId = studentId;
                const r = await getTestResults(filters);
                setResults(r || []);
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    }

    async function handleTestChange(testId) {
        setSelectedTest(testId);
        try {
            const filters = { testId };
            if (studentId) filters.studentId = studentId;
            const r = await getTestResults(filters);
            setResults(r || []);
        } catch (err) { console.error(err); }
    }

    const subjectAverages = useMemo(() => {
        const map = {};
        for (const r of results) {
            const subName = r.subjects?.name || 'Unknown';
            if (!map[subName]) map[subName] = { total: 0, count: 0 };
            map[subName].total += r.max_marks > 0 ? (r.marks_obtained / r.max_marks) * 100 : 0;
            map[subName].count++;
        }
        return Object.entries(map).map(([subject, { total, count }]) => ({
            subject: subject.length > 10 ? subject.slice(0, 10) + '..' : subject,
            average: Math.round(total / count),
        }));
    }, [results]);

    const overallAvg = results.length > 0
        ? Math.round(results.reduce((s, r) => s + (r.max_marks > 0 ? (r.marks_obtained / r.max_marks) * 100 : 0), 0) / results.length)
        : 0;

    const bestSubject = subjectAverages.reduce((b, s) => s.average > (b?.average || 0) ? s : b, null);
    const weakSubject = subjectAverages.reduce((w, s) => s.average < (w?.average || 100) ? s : w, null);

    return (
        <>
            {(isStudent || isParent) && (
                <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>
                        {isParent ? `${user.child?.name || ''}'s` : 'Your'} Performance Analytics
                    </h2>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Track progress across tests and subjects</p>
                </div>
            )}

            <div className="search-bar" style={{ marginBottom: 24 }}>
                <div className="select-wrapper">
                    <select value={selectedTest} onChange={e => handleTestChange(e.target.value)}>
                        {tests.map(t => <option key={t.id} value={t.id}>{t.name} ({t.test_date})</option>)}
                    </select>
                </div>
                {!studentId && (
                    <div className="select-wrapper">
                        <select value={selectedStandard} onChange={e => setSelectedStandard(e.target.value)}>
                            <option value="All">All Standards</option>
                            {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {loading ? <div className="empty-state"><div className="spinner" /><p>Loading analytics...</p></div> : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card navy"><div className="stat-icon navy"><BarChart3 size={24} /></div><div className="stat-info"><h4>Overall Average</h4><div className="stat-value">{overallAvg}%</div></div></div>
                        <div className="stat-card green"><div className="stat-icon green"><Award size={24} /></div><div className="stat-info"><h4>Best Subject</h4><div className="stat-value">{bestSubject?.subject || '—'}</div><span className="stat-change up">{bestSubject?.average || 0}%</span></div></div>
                        <div className="stat-card red"><div className="stat-icon red"><AlertTriangle size={24} /></div><div className="stat-info"><h4>Needs Improvement</h4><div className="stat-value">{weakSubject?.subject || '—'}</div><span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{weakSubject?.average || 0}%</span></div></div>
                        <div className="stat-card gold"><div className="stat-icon gold"><Target size={24} /></div><div className="stat-info"><h4>Subjects</h4><div className="stat-value">{subjectAverages.length}</div></div></div>
                    </div>

                    {subjectAverages.length > 0 && (
                        <div className="grid-2" style={{ marginTop: 24 }}>
                            <div className="card">
                                <div className="card-header"><h3>Subject Performance</h3></div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={subjectAverages}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis dataKey="subject" fontSize={11} />
                                            <YAxis domain={[0, 100]} fontSize={12} />
                                            <Tooltip formatter={v => `${v}%`} />
                                            <Bar dataKey="average" radius={[4, 4, 0, 0]}>
                                                {subjectAverages.map((_, i) => (
                                                    <React.Fragment key={i}>
                                                        {/* color based on performance */}
                                                    </React.Fragment>
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header"><h3>Strength Radar</h3></div>
                                <div className="card-body">
                                    <ResponsiveContainer width="100%" height={280}>
                                        <RadarChart data={subjectAverages}>
                                            <PolarGrid stroke="#E5E7EB" />
                                            <PolarAngleAxis dataKey="subject" fontSize={11} />
                                            <PolarRadiusAxis domain={[0, 100]} fontSize={10} />
                                            <Radar dataKey="average" stroke="#0A2351" fill="#0A2351" fillOpacity={0.2} strokeWidth={2} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {subjectAverages.length === 0 && (
                        <div className="empty-state" style={{ marginTop: 24 }}><BarChart3 /><h3>No test data yet</h3><p>Results will appear here after marks are entered.</p></div>
                    )}
                </>
            )}
        </>
    );
}
