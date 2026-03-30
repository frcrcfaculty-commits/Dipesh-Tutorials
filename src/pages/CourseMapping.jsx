import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getTests, getTestResults, getStandards } from '../lib/api';
import { AlertTriangle, Lightbulb } from 'lucide-react';
import { showToast } from '../utils';

export default function CourseMapping() {
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

    const weakTopics = (results||[])
        .filter(r => r.max_marks > 0 && (r.marks_obtained/r.max_marks)*100 < 50)
        .map(r => ({ subject: r.subjects?.name||'', pct: Math.round((r.marks_obtained/r.max_marks)*100), marks: r.marks_obtained, max: r.max_marks }))
        .sort((a,b) => a.pct - b.pct);

    const subjectGroups = {};
    weakTopics.forEach(w => {
        if (!subjectGroups[w.subject]) subjectGroups[w.subject] = [];
        subjectGroups[w.subject].push(w);
    });

    if (loading) return <div className="loading-spinner" />;

    return (
        <>
            <div className="page-header">
                <h2>Course Mapping</h2>
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

            {weakTopics.length === 0 ? (
                <div className="empty-state"><Lightbulb /><h3>Great performance!</h3><p>No weak topics identified for this test.</p></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {Object.entries(subjectGroups).map(([subject, items]) => (
                        <div key={subject} className="card">
                            <div className="card-header">
                                <h3>{subject}</h3>
                                <span className="badge absent">{items.length} weak</span>
                            </div>
                            <div className="card-body">
                                {items.map((item, i) => (
                                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <AlertTriangle size={14} color={item.pct < 30 ? 'var(--danger)' : 'var(--warning)'} />
                                            <span style={{ fontSize: '0.85rem' }}>{item.marks}/{item.max}</span>
                                        </div>
                                        <span className={`badge ${item.pct < 30 ? 'absent' : 'late'}`}>{item.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}