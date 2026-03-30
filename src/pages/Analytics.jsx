import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import {
    STUDENTS, STANDARDS, SUBJECTS_BY_STANDARD, TEST_RESULTS, TESTS,
    TOPICS_BY_SUBJECT, RESOURCES, getWeakTopics, getImprovementSuggestions
} from '../data';
import {
    BarChart3, TrendingUp, TrendingDown, Target, AlertTriangle, Award,
    BookOpen, ArrowRight, ChevronDown, ChevronUp, Lightbulb, AlertCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const COLORS = ['#0A2351', '#B6922E', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];
const GRADE_COLORS = { 'A+': '#10B981', 'A': '#10B981', 'B+': '#3B82F6', 'B': '#3B82F6', 'C': '#F59E0B', 'D': '#EF4444', 'F': '#EF4444' };

// ─── Parent / Student Analytics ───────────────────
function StudentAnalytics({ studentId, studentName, standard, isParent }) {
    const [selectedSubject, setSelectedSubject] = useState('');
    const [expandedSuggestion, setExpandedSuggestion] = useState(null);

    const subjects = SUBJECTS_BY_STANDARD[standard] || [];
    const activeSubject = selectedSubject || subjects[0] || '';

    // Get all test results for this student
    const studentResults = useMemo(() =>
        TEST_RESULTS.filter(r => r.studentId === studentId),
        [studentId]
    );

    // Subject-wise performance across tests
    const subjectTrends = useMemo(() => {
        return subjects.map(subject => {
            const subjectResults = studentResults.filter(r => r.subject === subject);
            const data = {};
            for (const test of TESTS) {
                const result = subjectResults.find(r => r.testId === test.id);
                data[test.name] = result ? result.percentage : 0;
                data[`${test.name}_grade`] = result ? result.grade : '-';
            }
            const avg = subjectResults.length > 0
                ? Math.round(subjectResults.reduce((s, r) => s + r.percentage, 0) / subjectResults.length)
                : 0;
            return { subject, ...data, average: avg };
        });
    }, [studentResults, subjects]);

    // Chart data for line chart
    const trendChartData = useMemo(() => {
        return TESTS.map(test => {
            const row = { name: test.name };
            for (const subject of subjects) {
                const result = studentResults.find(r => r.testId === test.id && r.subject === subject);
                row[subject] = result ? result.percentage : 0;
            }
            return row;
        });
    }, [studentResults, subjects]);

    // Topic-wise breakdown for selected subject
    const topicBreakdown = useMemo(() => {
        const results = studentResults.filter(r => r.subject === activeSubject);
        const topics = TOPICS_BY_SUBJECT[activeSubject] || [];
        return topics.map(topic => {
            const testScores = {};
            for (const test of TESTS) {
                const result = results.find(r => r.testId === test.id);
                const tm = result?.topicMarks.find(t => t.topic === topic);
                testScores[test.name] = tm ? Math.round((tm.marks / tm.maxMarks) * 100) : 0;
            }
            const values = Object.values(testScores);
            const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
            return { topic, ...testScores, average: avg };
        });
    }, [studentResults, activeSubject]);

    // Radar chart data
    const radarData = useMemo(() => {
        const latestTest = TESTS[TESTS.length - 1];
        return subjects.map(subject => {
            const result = studentResults.find(r => r.testId === latestTest.id && r.subject === subject);
            return { subject: subject.length > 8 ? subject.slice(0, 8) + '..' : subject, score: result ? result.percentage : 0 };
        });
    }, [studentResults, subjects]);

    // Improvement suggestions
    const suggestions = useMemo(() => getImprovementSuggestions(studentId), [studentId]);

    // Overall stats
    const latestTestResults = studentResults.filter(r => r.testId === TESTS[TESTS.length - 1].id);
    const overallAvg = latestTestResults.length > 0
        ? Math.round(latestTestResults.reduce((s, r) => s + r.percentage, 0) / latestTestResults.length)
        : 0;
    const bestSubject = latestTestResults.reduce((best, r) => r.percentage > (best?.percentage || 0) ? r : best, null);
    const worstSubject = latestTestResults.reduce((worst, r) => r.percentage < (worst?.percentage || 100) ? r : worst, null);

    const label = isParent ? `${studentName}'s` : 'Your';

    return (
        <>
            <div className="analytics-hero">
                <h2>{label} Academic Performance</h2>
                <p>{standard} Standard — Latest: {TESTS[TESTS.length - 1].name}</p>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><Target size={24} /></div>
                    <div className="stat-info"><h4>Overall Average</h4><div className="stat-value">{overallAvg}%</div></div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><TrendingUp size={24} /></div>
                    <div className="stat-info"><h4>Best Subject</h4><div className="stat-value" style={{ fontSize: '1.1rem' }}>{bestSubject?.subject || '-'}</div>
                        <span className="stat-change up">{bestSubject?.percentage || 0}%</span></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><TrendingDown size={24} /></div>
                    <div className="stat-info"><h4>Needs Work</h4><div className="stat-value" style={{ fontSize: '1.1rem' }}>{worstSubject?.subject || '-'}</div>
                        <span className="stat-change down">{worstSubject?.percentage || 0}%</span></div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><AlertTriangle size={24} /></div>
                    <div className="stat-info"><h4>Weak Topics</h4><div className="stat-value">{suggestions.length}</div></div>
                </div>
            </div>

            {/* Performance Trend Chart + Radar */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Score Trend Across Tests</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={trendChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis domain={[0, 100]} fontSize={12} tickFormatter={v => `${v}%`} />
                                <Tooltip formatter={v => `${v}%`} />
                                {subjects.slice(0, 6).map((sub, i) => (
                                    <Line key={sub} type="monotone" dataKey={sub} stroke={COLORS[i % COLORS.length]}
                                        strokeWidth={2} dot={{ r: 4 }} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Subject Strength (Latest Test)</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={280}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#E5E7EB" />
                                <PolarAngleAxis dataKey="subject" fontSize={11} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} />
                                <Radar name="Score" dataKey="score" stroke="#0A2351" fill="#0A2351" fillOpacity={0.15} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Subject-wise Marks Table */}
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Subject-wise Performance</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    {TESTS.map(t => <th key={t.id}>{t.name}</th>)}
                                    <th>Average</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjectTrends.map(row => (
                                    <tr key={row.subject}>
                                        <td style={{ fontWeight: 600 }}>{row.subject}</td>
                                        {TESTS.map(t => {
                                            const pct = row[t.name];
                                            const grade = row[`${t.name}_grade`];
                                            return (
                                                <td key={t.id}>
                                                    <span className={`co-cell ${pct >= 75 ? 'high' : pct >= 50 ? 'medium' : 'low'}`}
                                                        style={{ display: 'inline-block', minWidth: 50 }}>
                                                        {pct}%
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', marginLeft: 4, color: GRADE_COLORS[grade] || '#6B7280', fontWeight: 700 }}>{grade}</span>
                                                </td>
                                            );
                                        })}
                                        <td><span style={{ fontWeight: 700, color: 'var(--navy)' }}>{row.average}%</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Topic-wise Breakdown */}
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header">
                    <h3>Topic-wise Breakdown</h3>
                    <div className="filter-chips">
                        {subjects.map(sub => (
                            <button key={sub} className={`filter-chip ${activeSubject === sub ? 'active' : ''}`}
                                onClick={() => setSelectedSubject(sub)}>{sub}</button>
                        ))}
                    </div>
                </div>
                <div className="card-body">
                    {topicBreakdown.map(row => (
                        <div key={row.topic} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{row.topic}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: row.average >= 75 ? 'var(--success)' : row.average >= 50 ? 'var(--gold)' : 'var(--danger)' }}>
                                    {row.average}%
                                </span>
                            </div>
                            <div className="progress-bar" style={{ height: 10 }}>
                                <div className={`progress-fill ${row.average >= 75 ? 'green' : row.average >= 50 ? 'gold' : 'red'}`}
                                    style={{ width: `${row.average}%` }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                {TESTS.map(t => (
                                    <span key={t.id} style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {t.name.replace('Unit Test ', 'UT').replace('Mid-Term Exam', 'Mid')}: {row[t.name]}%
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Improvement Suggestions */}
            {suggestions.length > 0 && (
                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header">
                        <h3><Lightbulb size={18} style={{ marginRight: 8, color: 'var(--gold)' }} />Improvement Suggestions</h3>
                    </div>
                    <div className="card-body">
                        {suggestions.map((sg, i) => (
                            <div key={i} className="suggestion-card" onClick={() => setExpandedSuggestion(expandedSuggestion === i ? null : i)}>
                                <div className="suggestion-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <AlertCircle size={16} color={sg.percentage < 30 ? 'var(--danger)' : 'var(--warning)'} />
                                        <span style={{ fontWeight: 600 }}>{sg.subject} — {sg.topic}</span>
                                        <span className={`badge ${sg.percentage < 30 ? 'absent' : 'late'}`} style={{ fontSize: '0.7rem' }}>
                                            {sg.marks}/{sg.maxMarks}
                                        </span>
                                    </div>
                                    {expandedSuggestion === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </div>
                                {expandedSuggestion === i && (
                                    <div className="suggestion-body">
                                        {sg.suggestions.map((tip, j) => (
                                            <div key={j} className="suggestion-tip">
                                                <ArrowRight size={14} />
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Admin / Superadmin Analytics ───────────────────
function AdminAnalytics({ isSuperAdmin }) {
    const [selectedStandard, setSelectedStandard] = useState('All');
    const [selectedTest, setSelectedTest] = useState(TESTS[TESTS.length - 1].id);

    // Filter results
    const filteredResults = useMemo(() => {
        let results = TEST_RESULTS.filter(r => r.testId === selectedTest);
        if (selectedStandard !== 'All') results = results.filter(r => r.standard === selectedStandard);
        return results;
    }, [selectedStandard, selectedTest]);

    // Standard-wise averages
    const standardAverages = useMemo(() => {
        return STANDARDS.map(std => {
            const stdResults = filteredResults.filter(r => r.standard === std);
            const avg = stdResults.length > 0
                ? Math.round(stdResults.reduce((s, r) => s + r.percentage, 0) / stdResults.length)
                : 0;
            return { name: std.length > 8 ? std.slice(0, 8) + '..' : std, fullName: std, average: avg };
        });
    }, [filteredResults]);

    // Subject-wise pass rates for selected standard
    const subjectStats = useMemo(() => {
        const subjects = selectedStandard !== 'All' ? (SUBJECTS_BY_STANDARD[selectedStandard] || []) : ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry'];
        return subjects.map(sub => {
            const subResults = filteredResults.filter(r => r.subject === sub);
            const total = subResults.length || 1;
            const passed = subResults.filter(r => r.percentage >= 35).length;
            const avg = subResults.length > 0 ? Math.round(subResults.reduce((s, r) => s + r.percentage, 0) / subResults.length) : 0;
            return { subject: sub, passRate: Math.round((passed / total) * 100), average: avg, total: subResults.length };
        }).filter(s => s.total > 0);
    }, [filteredResults, selectedStandard]);

    // At-risk students (bottom 20% or below 35%)
    const atRiskStudents = useMemo(() => {
        const studentAverages = {};
        for (const r of filteredResults) {
            if (!studentAverages[r.studentId]) studentAverages[r.studentId] = { id: r.studentId, name: r.studentName, standard: r.standard, scores: [], total: 0, count: 0 };
            studentAverages[r.studentId].total += r.percentage;
            studentAverages[r.studentId].count++;
        }
        return Object.values(studentAverages)
            .map(s => ({ ...s, average: Math.round(s.total / s.count) }))
            .filter(s => s.average < 45)
            .sort((a, b) => a.average - b.average)
            .slice(0, 20);
    }, [filteredResults]);

    // Top performers
    const topPerformers = useMemo(() => {
        const studentAverages = {};
        for (const r of filteredResults) {
            if (!studentAverages[r.studentId]) studentAverages[r.studentId] = { id: r.studentId, name: r.studentName, standard: r.standard, total: 0, count: 0 };
            studentAverages[r.studentId].total += r.percentage;
            studentAverages[r.studentId].count++;
        }
        return Object.values(studentAverages)
            .map(s => ({ ...s, average: Math.round(s.total / s.count) }))
            .sort((a, b) => b.average - a.average)
            .slice(0, 10);
    }, [filteredResults]);

    const overallAvg = filteredResults.length > 0 ? Math.round(filteredResults.reduce((s, r) => s + r.percentage, 0) / filteredResults.length) : 0;
    const passRate = filteredResults.length > 0 ? Math.round((filteredResults.filter(r => r.percentage >= 35).length / filteredResults.length) * 100) : 0;

    return (
        <>
            {isSuperAdmin && (
                <div className="analytics-hero">
                    <h2>Institute Performance Analytics</h2>
                    <p>Comprehensive test analysis across all standards</p>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="select-wrapper" style={{ minWidth: 180 }}>
                    <select value={selectedTest} onChange={e => setSelectedTest(e.target.value)}>
                        {TESTS.map(t => <option key={t.id} value={t.id}>{t.name} ({t.date})</option>)}
                    </select>
                </div>
                <div className="filter-chips">
                    <button className={`filter-chip ${selectedStandard === 'All' ? 'active' : ''}`}
                        onClick={() => setSelectedStandard('All')}>All Standards</button>
                    {STANDARDS.map(s => (
                        <button key={s} className={`filter-chip ${selectedStandard === s ? 'active' : ''}`}
                            onClick={() => setSelectedStandard(s)}>{s}</button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><BarChart3 size={24} /></div>
                    <div className="stat-info"><h4>Overall Average</h4><div className="stat-value">{overallAvg}%</div></div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><Award size={24} /></div>
                    <div className="stat-info"><h4>Pass Rate</h4><div className="stat-value">{passRate}%</div></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><AlertTriangle size={24} /></div>
                    <div className="stat-info"><h4>At-Risk Students</h4><div className="stat-value">{atRiskStudents.length}</div></div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><TrendingUp size={24} /></div>
                    <div className="stat-info"><h4>Top Performers</h4><div className="stat-value">{topPerformers.filter(s => s.average >= 80).length}</div></div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Average by Standard</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={standardAverages}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="name" fontSize={11} angle={-20} textAnchor="end" height={60} />
                                <YAxis domain={[0, 100]} fontSize={12} tickFormatter={v => `${v}%`} />
                                <Tooltip formatter={v => `${v}%`} />
                                <Bar dataKey="average" fill="#0A2351" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Subject Pass Rates</h3></div>
                    <div className="card-body">
                        {subjectStats.map(sub => (
                            <div key={sub.subject} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{sub.subject}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Avg: {sub.average}% | Pass: {sub.passRate}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className={`progress-fill ${sub.passRate >= 80 ? 'green' : sub.passRate >= 60 ? 'gold' : 'red'}`}
                                        style={{ width: `${sub.passRate}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tables */}
            <div className="grid-2" style={{ marginTop: 24 }}>
                {/* At-risk */}
                <div className="card">
                    <div className="card-header"><h3>⚠️ Students At Risk</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead><tr><th>Student</th><th>Standard</th><th>Average</th></tr></thead>
                            <tbody>
                                {atRiskStudents.slice(0, 10).map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.name}<br /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.id}</span></td>
                                        <td>{s.standard}</td>
                                        <td><span className={`badge ${s.average < 35 ? 'absent' : 'late'}`}>{s.average}%</span></td>
                                    </tr>
                                ))}
                                {atRiskStudents.length === 0 && (
                                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No at-risk students found 🎉</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Top performers */}
                <div className="card">
                    <div className="card-header"><h3>🏆 Top Performers</h3></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead><tr><th>#</th><th>Student</th><th>Standard</th><th>Average</th></tr></thead>
                            <tbody>
                                {topPerformers.map((s, i) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 700, color: i < 3 ? 'var(--gold)' : 'var(--text-muted)' }}>{i + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.standard}</td>
                                        <td><span className={`badge ${s.average >= 80 ? 'present' : 'late'}`}>{s.average}%</span></td>
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

// ─── Main Analytics Component ───────────────────
export default function Analytics() {
    const { user } = useAuth();

    if (user.role === 'parent') {
        const childId = user.child?.id || user.childId || 'STU0001';
        const childName = user.child?.name || 'Your Child';
        const standard = user.child?.standard || '8th';
        return <StudentAnalytics studentId={childId} studentName={childName} standard={standard} isParent={true} />;
    }

    if (user.role === 'student') {
        const studentId = user.student?.id || user.studentId || 'STU0001';
        const studentName = user.student?.name || user.name;
        const standard = user.student?.standard || user.standard || '8th';
        return <StudentAnalytics studentId={studentId} studentName={studentName} standard={standard} isParent={false} />;
    }

    return <AdminAnalytics isSuperAdmin={user.role === 'superadmin'} />;
}
