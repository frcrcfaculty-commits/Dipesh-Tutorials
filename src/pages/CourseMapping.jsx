import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import {
    STANDARDS, SUBJECTS_BY_STANDARD, COURSE_OUTCOMES,
    TEST_RESULTS, TESTS, TOPICS_BY_SUBJECT, RESOURCES,
    getWeakTopics, getImprovementSuggestions
} from '../data';
import {
    Target, AlertTriangle, TrendingUp, BookOpen, ArrowRight,
    Lightbulb, AlertCircle, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

// ─── Student Weakness View ───────────────────
function StudentWeaknessView({ user }) {
    const navigate = useNavigate();
    const studentId = user.student?.id || user.studentId || 'STU0001';
    const studentName = user.student?.name || user.name;
    const standard = user.student?.standard || user.standard || '8th';
    const [expandedIdx, setExpandedIdx] = useState(null);

    const subjects = SUBJECTS_BY_STANDARD[standard] || [];
    const latestTest = TESTS[TESTS.length - 1];
    const myResults = TEST_RESULTS.filter(r => r.studentId === studentId && r.testId === latestTest.id);
    const weakTopics = getWeakTopics(studentId);
    const suggestions = getImprovementSuggestions(studentId);

    // Resources for this standard, indexed by subject
    const stdResources = RESOURCES.filter(r => r.standard === standard);

    // Subject-wise weak topic grouping
    const subjectWeakness = useMemo(() => {
        const map = {};
        for (const wt of weakTopics) {
            if (!map[wt.subject]) map[wt.subject] = [];
            map[wt.subject].push(wt);
        }
        return Object.entries(map).sort((a, b) => a[1][0].percentage - b[1][0].percentage);
    }, [weakTopics]);

    return (
        <>
            <div className="analytics-hero" style={{ marginBottom: 24 }}>
                <h2>Topics to Improve</h2>
                <p>Based on your latest test ({latestTest.name}), here are topics that need attention</p>
            </div>

            {/* Overall Stats */}
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><Target size={24} /></div>
                    <div className="stat-info"><h4>Subjects Tested</h4><div className="stat-value">{myResults.length}</div></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><AlertTriangle size={24} /></div>
                    <div className="stat-info"><h4>Weak Topics</h4><div className="stat-value">{weakTopics.length}</div></div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><Lightbulb size={24} /></div>
                    <div className="stat-info"><h4>Suggestions</h4><div className="stat-value">{suggestions.length}</div></div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><BookOpen size={24} /></div>
                    <div className="stat-info"><h4>Resources Available</h4><div className="stat-value">{stdResources.length}</div></div>
                </div>
            </div>

            {/* Subject-wise Weakness Summary */}
            {subjectWeakness.length > 0 ? (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3><AlertTriangle size={18} style={{ marginRight: 8, color: 'var(--danger)' }} />Subjects Needing Improvement</h3></div>
                    <div className="card-body">
                        {subjectWeakness.map(([subject, topics]) => {
                            const result = myResults.find(r => r.subject === subject);
                            return (
                                <div key={subject} style={{ marginBottom: 20, padding: 16, background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div>
                                            <h4 style={{ fontSize: '1rem', color: 'var(--navy)' }}>{subject}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Overall: {result?.percentage || 0}% ({result?.grade || '-'}) · {topics.length} weak topic{topics.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <span className={`badge ${(result?.percentage || 0) >= 50 ? 'late' : 'absent'}`}>
                                            {result?.percentage || 0}%
                                        </span>
                                    </div>

                                    {topics.map((wt, i) => (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '8px 12px', background: 'white', borderRadius: 'var(--radius-sm)',
                                            marginBottom: 4, border: '1px solid var(--border)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <AlertCircle size={14} color={wt.percentage < 30 ? 'var(--danger)' : 'var(--warning)'} />
                                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{wt.topic}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress-bar" style={{ width: 60, height: 6 }}>
                                                    <div className={`progress-fill ${wt.percentage >= 50 ? 'gold' : 'red'}`}
                                                        style={{ width: `${wt.percentage}%` }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: wt.percentage < 30 ? 'var(--danger)' : 'var(--warning)' }}>
                                                    {wt.marks}/{wt.maxMarks}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-body" style={{ textAlign: 'center', padding: 48 }}>
                        <TrendingUp size={36} style={{ color: 'var(--success)', marginBottom: 12 }} />
                        <h3 style={{ color: 'var(--success)', marginBottom: 8 }}>Excellent work! 🎉</h3>
                        <p style={{ color: 'var(--text-muted)' }}>No weak topics identified. Keep up the great performance!</p>
                    </div>
                </div>
            )}

            {/* Detailed Suggestions */}
            {suggestions.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h3><Lightbulb size={18} style={{ marginRight: 8, color: 'var(--gold)' }} />Improvement Suggestions</h3>
                    </div>
                    <div className="card-body">
                        {suggestions.map((sg, i) => (
                            <div key={i} className="suggestion-card" onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}>
                                <div className="suggestion-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <AlertCircle size={16} color={sg.percentage < 30 ? 'var(--danger)' : 'var(--warning)'} />
                                        <span style={{ fontWeight: 600 }}>{sg.subject} — {sg.topic}</span>
                                        <span className={`badge ${sg.percentage < 30 ? 'absent' : 'late'}`} style={{ fontSize: '0.7rem' }}>
                                            {sg.marks}/{sg.maxMarks}
                                        </span>
                                    </div>
                                    {expandedIdx === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                                {expandedIdx === i && (
                                    <div className="suggestion-body">
                                        {sg.suggestions.map((tip, j) => (
                                            <div key={j} className="suggestion-tip">
                                                <ArrowRight size={14} />
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                        {sg.relatedResources.length > 0 && (
                                            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(10,35,81,0.04)', borderRadius: 'var(--radius-sm)' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy)' }}>📚 Recommended Resources:</span>
                                                {sg.relatedResources.slice(0, 3).map(r => (
                                                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                                        <ExternalLink size={12} color="var(--info)" />
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--info)' }}>{r.title} ({r.type})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: 24, textAlign: 'center' }}>
                <button className="btn-gold" onClick={() => navigate('/analytics')}>
                    <Target size={16} style={{ marginRight: 6 }} /> View Full Analytics <ArrowRight size={14} />
                </button>
            </div>
        </>
    );
}

// ─── Admin CO Mapping View (unchanged) ───────────────────
function AdminCOView() {
    const [selectedStandard, setSelectedStandard] = useState('8th');
    const [selectedSubject, setSelectedSubject] = useState('');

    const subjects = SUBJECTS_BY_STANDARD[selectedStandard] || [];
    const activeSubject = selectedSubject || subjects[0] || '';
    const standardCOs = COURSE_OUTCOMES[selectedStandard] || {};
    const outcomes = standardCOs[activeSubject] || [];

    return (
        <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="select-wrapper" style={{ minWidth: 180 }}>
                    <select value={selectedStandard} onChange={e => { setSelectedStandard(e.target.value); setSelectedSubject(''); }}>
                        {STANDARDS.filter(s => COURSE_OUTCOMES[s]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="filter-chips">
                    {subjects.filter(s => standardCOs[s]).map(s => (
                        <button key={s} className={`filter-chip ${activeSubject === s ? 'active' : ''}`}
                            onClick={() => setSelectedSubject(s)}>{s}</button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><Target size={24} /></div><div className="stat-info"><h4>Course Outcomes</h4><div className="stat-value">{outcomes.length}</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><TrendingUp size={24} /></div><div className="stat-info"><h4>Avg Attainment</h4><div className="stat-value">{outcomes.length > 0 ? Math.round(outcomes.reduce((s, o) => s + o.attainment, 0) / outcomes.length) : 0}%</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><Target size={24} /></div><div className="stat-info"><h4>Above 75%</h4><div className="stat-value">{outcomes.filter(o => o.attainment >= 75).length}</div></div></div>
                <div className="stat-card red"><div className="stat-icon red"><AlertTriangle size={24} /></div><div className="stat-info"><h4>Below 50%</h4><div className="stat-value">{outcomes.filter(o => o.attainment < 50).length}</div></div></div>
            </div>

            {/* CO Cards */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header"><h3>{activeSubject} — Course Outcomes</h3></div>
                <div className="card-body">
                    {outcomes.map(co => (
                        <div key={co.id} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <div>
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)', marginRight: 8 }}>{co.id}</span>
                                    <span style={{ fontSize: '0.9rem' }}>{co.description}</span>
                                </div>
                                <span style={{
                                    fontWeight: 700, fontSize: '0.9rem',
                                    color: co.attainment >= 75 ? 'var(--success)' : co.attainment >= 50 ? 'var(--gold)' : 'var(--danger)'
                                }}>{co.attainment}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className={`progress-fill ${co.attainment >= 75 ? 'green' : co.attainment >= 50 ? 'gold' : 'red'}`}
                                    style={{ width: `${co.attainment}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Heatmap */}
            <div className="card">
                <div className="card-header"><h3>Attainment Heatmap — {selectedStandard}</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    {['CO1', 'CO2', 'CO3', 'CO4'].map(co => <th key={co}>{co}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(standardCOs).map(([subject, cos]) => (
                                    <tr key={subject}>
                                        <td style={{ fontWeight: 600 }}>{subject}</td>
                                        {['CO1', 'CO2', 'CO3', 'CO4'].map(coId => {
                                            const co = cos.find(c => c.id === coId);
                                            return (
                                                <td key={coId}>
                                                    {co ? (
                                                        <span className={`co-cell ${co.attainment >= 75 ? 'high' : co.attainment >= 50 ? 'medium' : 'low'}`}>
                                                            {co.attainment}%
                                                        </span>
                                                    ) : <span className="co-cell">—</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function CourseMapping() {
    const { user } = useAuth();
    if (user.role === 'student') return <StudentWeaknessView user={user} />;
    return <AdminCOView />;
}
