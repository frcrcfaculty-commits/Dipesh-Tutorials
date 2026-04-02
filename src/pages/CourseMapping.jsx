import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getTests, getTestResults, getStandards } from '../lib/api';
import { AlertTriangle, Lightbulb, RefreshCw, AlertCircle } from 'lucide-react';
import { showToast, withTimeout } from '../utils';

export default function CourseMapping() {
    const { user } = useAuth();
    const [tests, setTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const [results, setResults] = useState([]);
    const [standards, setStandards] = useState([]);
    const [selectedStd, setSelectedStd] = useState('all');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        setFetchError(null);
        try {
            const [t, stds] = await withTimeout(Promise.all([getTests(), getStandards()]), 15000);
            setStandards(stds||[]);
            setTests(t||[]);
            if ((t||[]).length > 0) setSelectedTest((t||[])[0]);
        } catch(e) {
            setFetchError(e.message || 'Failed to load course mapping data');
            showToast(e.message || 'Failed to load course mapping data', 'error');
        }
        setLoading(false);
    }

    useEffect(() => {
        if (!selectedTest) return;
        getTestResults({
            testId: selectedTest.id,
            standardId: selectedStd !== 'all' ? Number(selectedStd) : undefined,
        })
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
    if (fetchError) return (
        <div className="empty-state empty-state-padded">
            <AlertCircle size={40} className="text-danger-icon" />
            <h3 className="empty-state-title">{fetchError}</h3>
            <button className="btn-primary btn-small empty-state-action" onClick={loadAll}>
                <RefreshCw size={14} /> Try Again
            </button>
        </div>
    );

    return (
        <>
            <div className="page-header">
                <h2>Course Mapping</h2>
                <div className="btn-group">
                    <select value={selectedStd} onChange={e => setSelectedStd(e.target.value)} className="inline-select">
                        <option value="all">All Standards</option>
                        {(standards||[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={selectedTest?.id||''} onChange={e => setSelectedTest(tests.find(t => t.id === e.target.value))} className="inline-select">
                        {(tests||[]).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </div>

            {weakTopics.length === 0 ? (
                <div className="empty-state"><Lightbulb /><h3>Great performance!</h3><p>No weak topics identified for this test.</p></div>
            ) : (
                <div className="weak-topics-grid">
                    {Object.entries(subjectGroups).map(([subject, items]) => (
                        <div key={subject} className="card">
                            <div className="card-header">
                                <h3>{subject}</h3>
                                <span className="badge absent">{items.length} weak</span>
                            </div>
                            <div className="card-body">
                                {items.map((item, i) => (
                                    <div key={i} className="weak-topic-row">
                                        <div className="weak-topic-info">
                                            <AlertTriangle size={14} color={item.pct < 30 ? 'var(--danger)' : 'var(--warning)'} />
                                            <span className="weak-topic-marks">{item.marks}/{item.max}</span>
                                        </div>
                                        <span className={`badge ${item.pct < 30 ? 'absent' : 'late'}`}>{item.pct}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .btn-group {
                    display: flex;
                    gap: 12px;
                }
                .inline-select {
                    padding: 6px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: var(--surface-raised, #fff);
                }
                .empty-state-padded {
                    padding: 48px;
                }
                .text-danger-icon {
                    color: var(--danger);
                    margin-bottom: 12px;
                }
                .empty-state-title {
                    margin-bottom: 8px;
                }
                .empty-state-action {
                    margin-top: 8px;
                }
                .weak-topics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 16px;
                }
                .weak-topic-row {
                    padding: 8px 0;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .weak-topic-row:last-child {
                    border-bottom: none;
                }
                .weak-topic-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .weak-topic-marks {
                    font-size: 0.85rem;
                }
            `}</style>
        </>
    );
}