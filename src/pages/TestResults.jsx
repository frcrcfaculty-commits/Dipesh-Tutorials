import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useData } from '../App';
import { getTests, createTest, getTestResults, upsertTestResults, getStudents } from '../lib/api';
import { Upload, FileSpreadsheet, FileText, Search, Download, Plus, X, CheckCircle, AlertCircle, Eye, Save } from 'lucide-react';
import { exportCSV, showToast } from '../utils';
import { generateTestResultReportPDF } from '../reports';

export default function TestResults() {
    const { user } = useAuth();
    const { standards, subjects, getSubjectsForStandard } = useData();

    const [tab, setTab] = useState('view');
    const [tests, setTests] = useState([]);
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedTest, setSelectedTest] = useState('');
    const [selectedStandard, setSelectedStandard] = useState('All');
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Entry mode
    const [entryStandard, setEntryStandard] = useState('');
    const [entrySubject, setEntrySubject] = useState('');
    const [entryTest, setEntryTest] = useState('');
    const [entryMaxMarks, setEntryMaxMarks] = useState(100);
    const [marksMap, setMarksMap] = useState({});
    const [saving, setSaving] = useState(false);

    // New test form
    const [showNewTest, setShowNewTest] = useState(false);
    const [newTestName, setNewTestName] = useState('');
    const [newTestDate, setNewTestDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTestStandard, setNewTestStandard] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [t, s] = await Promise.all([getTests(), getStudents()]);
            setTests(t || []);
            setStudents(s || []);
            if (t?.length > 0) {
                setSelectedTest(t[0].id);
                const r = await getTestResults({ testId: t[0].id });
                setResults(r || []);
            }
        } catch (err) { showToast(err.message, 'error'); }
        setLoading(false);
    }

    async function loadResults(testId) {
        try {
            const r = await getTestResults({ testId });
            setResults(r || []);
        } catch (err) { showToast(err.message, 'error'); }
    }

    const handleTestChange = async (testId) => {
        setSelectedTest(testId);
        await loadResults(testId);
    };

    const filteredStudents = useMemo(() => {
        const stdId = selectedStandard !== 'All' ? parseInt(selectedStandard) : null;
        return results.filter(r => {
            if (stdId && r.students?.standard_id !== stdId) return false;
            if (selectedSubject !== 'All' && r.subjects?.name !== selectedSubject) return false;
            if (search && !r.students?.name?.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [results, selectedStandard, selectedSubject, search]);

    // Student summaries grouped
    const studentSummaries = useMemo(() => {
        const map = {};
        for (const r of filteredStudents) {
            const sid = r.student_id;
            if (!map[sid]) map[sid] = { id: sid, name: r.students?.name, standard: r.students?.standards?.name, subjects: [] };
            const pct = r.max_marks > 0 ? Math.round((r.marks_obtained / r.max_marks) * 100) : 0;
            map[sid].subjects.push({ subject: r.subjects?.name, percentage: pct, grade: r.grade, marks: r.marks_obtained, max: r.max_marks });
        }
        return Object.values(map).map(s => ({
            ...s,
            average: s.subjects.length > 0 ? Math.round(s.subjects.reduce((sum, sub) => sum + sub.percentage, 0) / s.subjects.length) : 0,
        })).sort((a, b) => b.average - a.average);
    }, [filteredStudents]);

    // Entry mode students
    const entryStudents = useMemo(() => {
        if (!entryStandard) return [];
        return students.filter(s => s.standard_id === parseInt(entryStandard));
    }, [students, entryStandard]);

    const handleCreateTest = async () => {
        if (!newTestName || !newTestStandard) { showToast('Fill test name and standard', 'error'); return; }
        try {
            const test = await createTest({
                name: newTestName,
                standard_id: parseInt(newTestStandard),
                test_date: newTestDate,
                created_by: user.id,
            });
            setTests(prev => [test, ...prev]);
            setEntryTest(test.id);
            setShowNewTest(false);
            setNewTestName('');
            showToast('Test created!');
        } catch (err) { showToast(err.message, 'error'); }
    };

    const handleSaveMarks = async () => {
        if (!entryTest || !entrySubject) { showToast('Select test and subject', 'error'); return; }
        setSaving(true);
        try {
            const records = Object.entries(marksMap)
                .filter(([_, marks]) => marks !== '' && marks !== undefined)
                .map(([studentId, marks]) => ({
                    test_id: entryTest,
                    student_id: studentId,
                    subject_id: parseInt(entrySubject),
                    marks_obtained: parseFloat(marks) || 0,
                    max_marks: entryMaxMarks,
                    entered_by: user.id,
                }));
            await upsertTestResults(records);
            showToast(`Marks saved for ${records.length} students`);
            setMarksMap({});
        } catch (err) { showToast(err.message, 'error'); }
        setSaving(false);
    };

    const classAvg = filteredStudents.length > 0
        ? Math.round(filteredStudents.reduce((s, r) => s + (r.max_marks > 0 ? (r.marks_obtained / r.max_marks) * 100 : 0), 0) / filteredStudents.length)
        : 0;

    return (
        <>
            <div className="tabs">
                <button className={`tab ${tab === 'view' ? 'active' : ''}`} onClick={() => setTab('view')}>
                    <Eye size={16} style={{ marginRight: 6 }} />View Results
                </button>
                <button className={`tab ${tab === 'entry' ? 'active' : ''}`} onClick={() => setTab('entry')}>
                    <Upload size={16} style={{ marginRight: 6 }} />Enter Marks
                </button>
            </div>

            {tab === 'view' && (
                <>
                    <div className="search-bar">
                        <div className="search-input"><Search /><input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <div className="select-wrapper">
                            <select value={selectedTest} onChange={e => handleTestChange(e.target.value)}>
                                {tests.map(t => <option key={t.id} value={t.id}>{t.name} ({t.test_date})</option>)}
                            </select>
                        </div>
                        <div className="select-wrapper">
                            <select value={selectedStandard} onChange={e => { setSelectedStandard(e.target.value); setSelectedSubject('All'); }}>
                                <option value="All">All Standards</option>
                                {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card navy"><div className="stat-icon navy"><FileText size={24} /></div><div className="stat-info"><h4>Records</h4><div className="stat-value">{filteredStudents.length}</div></div></div>
                        <div className="stat-card green"><div className="stat-icon green"><CheckCircle size={24} /></div><div className="stat-info"><h4>Students</h4><div className="stat-value">{studentSummaries.length}</div></div></div>
                        <div className="stat-card gold"><div className="stat-icon gold"><FileSpreadsheet size={24} /></div><div className="stat-info"><h4>Class Average</h4><div className="stat-value">{classAvg}%</div></div></div>
                        <div className="stat-card red"><div className="stat-icon red"><AlertCircle size={24} /></div><div className="stat-info"><h4>Below 35%</h4><div className="stat-value">{filteredStudents.filter(r => r.max_marks > 0 && (r.marks_obtained / r.max_marks) * 100 < 35).length}</div></div></div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3>Results ({studentSummaries.length} students)</h3>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn-secondary btn-small" onClick={() => {
                                    exportCSV('test_results', ['Student', 'Standard', 'Subjects', 'Average'],
                                        studentSummaries.map(s => [s.name, s.standard, s.subjects.map(sub => `${sub.subject}:${sub.grade}`).join('; '), s.average]));
                                    showToast('CSV exported!');
                                }}><Download size={14} /> CSV</button>
                                <button className="btn-gold btn-small" onClick={() => {
                                    generateTestResultReportPDF(studentSummaries.flatMap(s =>
                                        s.subjects.map(sub => ({
                                            studentName: s.name, testName: tests.find(t => t.id === selectedTest)?.name || '',
                                            subject: sub.subject, score: sub.marks, maxScore: sub.max, percentage: sub.percentage
                                        }))
                                    ), selectedStandard !== 'All' ? standards.find(st => st.id === parseInt(selectedStandard))?.name : 'All');
                                    showToast('PDF report generated!');
                                }}><FileText size={14} /> PDF</button>
                            </div>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {loading ? <div className="empty-state"><div className="spinner" /></div> : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Student</th><th>Standard</th><th>Subjects</th><th>Average</th></tr></thead>
                                        <tbody>
                                            {studentSummaries.slice(0, 50).map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                    <td>{s.standard}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                            {s.subjects.map(sub => (
                                                                <span key={sub.subject} className="resource-tag" style={{ fontSize: '0.65rem' }}>
                                                                    {sub.subject}: {sub.grade} ({sub.marks}/{sub.max})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`co-cell ${s.average >= 75 ? 'high' : s.average >= 50 ? 'medium' : 'low'}`}
                                                            style={{ display: 'inline-block', minWidth: 50 }}>{s.average}%</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {!loading && studentSummaries.length === 0 && (
                                <div className="empty-state"><FileText /><h3>No results found</h3><p>Enter marks in the "Enter Marks" tab.</p></div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {tab === 'entry' && (
                <div className="card">
                    <div className="card-header"><h3>Enter Marks</h3></div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                            <div className="form-group">
                                <label>Standard *</label>
                                <div className="select-wrapper">
                                    <select value={entryStandard} onChange={e => { setEntryStandard(e.target.value); setEntrySubject(''); }}>
                                        <option value="">Select Standard</option>
                                        {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Test *</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <div className="select-wrapper" style={{ flex: 1 }}>
                                        <select value={entryTest} onChange={e => setEntryTest(e.target.value)}>
                                            <option value="">Select Test</option>
                                            {tests.filter(t => !entryStandard || t.standard_id === parseInt(entryStandard)).map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button className="btn-secondary btn-small" onClick={() => { setShowNewTest(true); setNewTestStandard(entryStandard); }}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Subject *</label>
                                <div className="select-wrapper">
                                    <select value={entrySubject} onChange={e => setEntrySubject(e.target.value)}>
                                        <option value="">Select Subject</option>
                                        {(entryStandard ? getSubjectsForStandard(parseInt(entryStandard)) : []).map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ maxWidth: 200, marginBottom: 24 }}>
                            <label>Max Marks</label>
                            <input type="number" value={entryMaxMarks} onChange={e => setEntryMaxMarks(parseInt(e.target.value) || 100)}
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        </div>

                        {entryStudents.length > 0 && entrySubject && entryTest ? (
                            <>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead><tr><th>Roll No</th><th>Student</th><th>Marks (out of {entryMaxMarks})</th></tr></thead>
                                        <tbody>
                                            {entryStudents.map(s => (
                                                <tr key={s.id}>
                                                    <td>{s.roll_no}</td>
                                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                    <td>
                                                        <input type="number" min="0" max={entryMaxMarks}
                                                            value={marksMap[s.id] ?? ''}
                                                            onChange={e => setMarksMap(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                            placeholder="—"
                                                            style={{ width: 80, padding: '6px 10px', border: '2px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button className="btn-primary" style={{ marginTop: 20 }} onClick={handleSaveMarks} disabled={saving}>
                                    <Save size={16} /> {saving ? 'Saving...' : `Save Marks (${Object.values(marksMap).filter(v => v !== '').length} students)`}
                                </button>
                            </>
                        ) : (
                            <div className="empty-state" style={{ padding: 32 }}>
                                <FileSpreadsheet size={36} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
                                <p>Select standard, test, and subject to enter marks</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* New Test Modal */}
            {showNewTest && (
                <div className="modal-overlay" onClick={() => setShowNewTest(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Create New Test</h3><button onClick={() => setShowNewTest(false)} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Test Name *</label>
                                <input type="text" value={newTestName} onChange={e => setNewTestName(e.target.value)}
                                    placeholder="e.g. Unit Test 1, Mid-Term, Prelim..."
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" value={newTestDate} onChange={e => setNewTestDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div className="form-group">
                                <label>Standard</label>
                                <div className="select-wrapper">
                                    <select value={newTestStandard} onChange={e => setNewTestStandard(e.target.value)}>
                                        <option value="">Select</option>
                                        {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button className="btn-primary" onClick={handleCreateTest} disabled={!newTestName || !newTestStandard}>
                                <Plus size={16} /> Create Test
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
