import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getTests, getTestResults, getStandards, getStudents } from '../lib/api';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function Analytics() {
    const { user } = useAuth();
    const [tests, setTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const [results, setResults] = useState([]);
    const [standards, setStandards] = useState([]);
    const [selectedStd, setSelectedStd] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [t, stds] = await Promise.all([getTests(), getStandards()]);
            setStandards(stds||[]);
            setTests(t||[]);
            if ((t||[]).length > 0) setSelectedTest((t||[])[0]);
        } catch(e) {}
        setLoading(false);
    }

    useEffect(() => {
        if (!selectedTest) return;
        getTestResults({ testId: selectedTest.id, standardId: selectedStd !== 'all' ? selectedStd : undefined })
            .then(r => setResults(r||[])).catch(() => setResults([]));
    }, [selectedTest, selectedStd]);

    const subjectAverages = {};
    (results||[]).forEach(r => {
        const sub = r.subjects?.name || 'Unknown';
        if (!subjectAverages[sub]) subjectAverages[sub] = [];
        subjectAverages[sub].push(r.max_marks > 0 ? (r.marks_obtained/r.max_marks)*100 : 0);
    });
    const radarData = Object.entries(subjectAverages).map(([subject, scores]) => ({
        subject,
        avg: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),
    })).sort((a,b) => b.avg - a.avg);

    const gradeDist = { 'A+':0, 'A':0, 'B+':0, 'B':0, 'C':0, 'D':0, 'F':0 };
    (results||[]).forEach(r => { if (r.grade && gradeDist.hasOwnProperty(r.grade)) gradeDist[r.grade]++; });

    const total = results.length || 1;
    const barData = Object.entries(gradeDist).filter(([_,v]) => v > 0).map(([grade, count]) => ({ grade, count, percent: Math.round(count/total*100) }));

    if (loading) return <div className="loading-spinner" />;

    return (
        <>
            <div className="page-header">
                <h2>Analytics</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select value={selectedStd} onChange={e => setSelectedStd(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <option value="all">All Standards</option>
                        {(standards||[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={selectedTest?.id||''} onChange={e => setSelectedTest(tests.find(t => t.id === e.target.value))}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        {(tests||[]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </div>

            {results.length === 0 ? (
                <div className="empty-state"><BarChart3 /><h3>No data available</h3><p>Results will appear here after tests are conducted.</p></div>
            ) : (
                <>
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card navy"><div className="stat-info"><h4>Total Students</h4><div className="stat-value">{results.length}</div></div></div>
                        <div className="stat-card gold"><div className="stat-info"><h4>Class Average</h4><div className="stat-value">{Math.round(radarData.reduce((s,r)=>s+r.avg,0)/(radarData.length||1))}%</div></div></div>
                        <div className="stat-card green"><div className="stat-info"><h4>Highest</h4><div className="stat-value">{radarData[0]?.subject || '—'}</div></div></div>
                        <div className="stat-card red"><div className="stat-info"><h4>Needs Work</h4><div className="stat-value">{radarData[radarData.length-1]?.subject || '—'}</div></div></div>
                    </div>
                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header"><h3>Subject Performance</h3></div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={radarData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0,100]} tickFormatter={v => `${v}%`} />
                                        <YAxis type="category" dataKey="subject" width={100} fontSize={12} />
                                        <Tooltip formatter={v => `${v}%`} />
                                        <Bar dataKey="avg" fill="#0A2351" radius={[0,4,4,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3>Grade Distribution</h3></div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="grade" />
                                        <YAxis />
                                        <Tooltip formatter={(v,name) => [`${v} students`, name]} />
                                        <Bar dataKey="count" fill="#B6922E" radius={[4,4,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="card" style={{ marginTop: 24 }}>
                        <div className="card-header"><h3>Subject Radar</h3></div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" fontSize={12} />
                                    <PolarRadiusAxis domain={[0,100]} />
                                    <Radar name="Avg %" dataKey="avg" stroke="#0A2351" fill="#0A2351" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}