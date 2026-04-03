import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { getTests, getTestResults, createTest, upsertTestResults, getStandards, getSubjects, bulkUpsertTestResults } from '../lib/api';
import { FileText, Plus, Loader2, Upload, X } from 'lucide-react';
import { showToast } from '../utils';

export default function TestResults() {
    const { user } = useAuth();
    const [tests, setTests] = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const [results, setResults] = useState([]);
    const [standards, setStandards] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [savingMarks, setSavingMarks] = useState(false);
    const [newTest, setNewTest] = useState({ name: '', standard_id: '', test_date: '' });
    const [marksMap, setMarksMap] = useState({});
    const [editingMarks, setEditingMarks] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkSubjectId, setBulkSubjectId] = useState('');
    const [bulkPreview, setBulkPreview] = useState([]);
    const [bulkImporting, setBulkImporting] = useState(false);
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [t, stds, subs] = await Promise.all([getTests(), getStandards(), getSubjects()]);
            setTests(t||[]);
            setStandards(stds||[]);
            setSubjects(subs||[]);
            if ((t||[]).length > 0 && !selectedTest) setSelectedTest((t||[])[0]);
        } catch(e) { showToast('Failed to load tests', 'error'); }
        setLoading(false);
    }

    useEffect(() => {
        if (!selectedTest) return;
        getTestResults({ testId: selectedTest.id }).then(r => {
            setResults(r||[]);
            // Initialize marks map from existing results
            const m = {};
            (r||[]).forEach(res => { m[res.student_id] = { marks: String(res.marks_obtained), subject_id: res.subject_id }; });
            setMarksMap(m);
        }).catch(() => setResults([]));
    }, [selectedTest]);

    async function handleCreate(e) {
        e.preventDefault();
        setCreating(true);
        try {
            await createTest({ ...newTest, created_by: user.id });
            showToast('Test created!');
            setShowCreate(false);
            loadAll();
        } catch(e) { showToast('Failed to create test', 'error'); }
        setCreating(false);
    }

    async function handleSaveMarks() {
        const records = [];
        const testStudents = results.map(r => ({ student_id: r.student_id, subject_id: r.subjects?.id || marksMap[r.student_id]?.subject_id, max_marks: r.max_marks || 100 }));
        for (const r of results) {
            const entry = marksMap[r.student_id];
            if (!entry || entry.marks === '') continue;
            const marks = parseFloat(entry.marks);
            const max = r.max_marks || 100;
            if (marks < 0 || marks > max) {
                showToast(`Marks for ${r.students?.name} must be between 0 and ${max}`, 'error');
                return;
            }
            records.push({ test_id: selectedTest.id, student_id: r.student_id, subject_id: r.subjects?.id || entry.subject_id || null, marks_obtained: marks, max_marks: max, entered_by: user.id });
        }
        const invalid = records.filter(r => r.marks_obtained < 0 || r.marks_obtained > r.max_marks);
        if (invalid.length > 0) {
            showToast(`${invalid.length} entries have invalid marks. Fix before saving.`, 'error');
            return;
        }
        setSavingMarks(true);
        try {
            await upsertTestResults(records);
            showToast('Marks saved!');
            setEditingMarks(false);
            const updated = await getTestResults({ testId: selectedTest.id });
            setResults(updated||[]);
        } catch(e) { showToast('Failed to save marks: ' + e.message, 'error'); }
        setSavingMarks(false);
    }

    const gradeColors = { 'A+': '#10B981', 'A': '#22C55E', 'B+': '#3B82F6', 'B': '#6366F1', 'C': '#F59E0B', 'D': '#EF4444', 'F': '#DC2626' };

    const openBulkUpload = () => {
        if (!selectedTest) { showToast('Select a test first', 'error'); return; }
        setBulkSubjectId(subjects[0]?.id || '');
        setBulkFile(null);
        setBulkPreview([]);
        setShowBulkModal(true);
    };

    const handleBulkFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setBulkFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const lines = text.trim().split('\n');
            if (lines.length < 2) { showToast('CSV must have header + at least 1 data row', 'error'); return; }
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const preview = lines.slice(1, 6).map(line => {
                const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {}; headers.forEach((h, i) => { row[h] = vals[i] || ''; });
                return row;
            });
            setBulkPreview(preview);
        };
        reader.readAsText(file);
    };

    const handleBulkImport = async () => {
        if (!bulkFile || !bulkSubjectId || !selectedTest) { showToast('Select a file, test, and subject', 'error'); return; }
        setBulkImporting(true);
        try {
            const text = await bulkFile.text();
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const records = [];
            for (const line of lines.slice(1).filter(l => l.trim())) {
                const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {}; headers.forEach((h, i) => { row[h] = vals[i] || ''; });
                const rollNo = parseInt(row.roll_no || row.rollno || row.roll_no || 0);
                const marks = parseFloat(row.marks || row.marks_obtained || 0);
                if (!rollNo || isNaN(marks)) continue;
                const student = results.find(r => r.students?.roll_no === rollNo);
                if (!student) continue;
                records.push({
                    test_id: selectedTest.id,
                    student_id: student.student_id,
                    subject_id: parseInt(bulkSubjectId),
                    marks_obtained: marks,
                    max_marks: student.max_marks || 100,
                    entered_by: user.id,
                });
            }
            if (records.length === 0) { showToast('No valid entries found in CSV', 'error'); return; }
            await bulkUpsertTestResults(records);
            showToast(`${records.length} results imported!`);
            setShowBulkModal(false);
            const updated = await getTestResults({ testId: selectedTest.id });
            setResults(updated||[]);
        } catch(err) { showToast('Bulk import failed: ' + err.message, 'error'); }
        setBulkImporting(false);
    };

    const testSubjects = useMemo(() => {
        if (!selectedTest?.standard_id) return subjects;
        return subjects.filter(s => s.standard_id === selectedTest.standard_id);
    }, [selectedTest, subjects]);

    return (
        <>
            <div className="page-header"><h2>Test Results</h2>
                {isAdmin && (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" onClick={() => setShowCreate(s => !s)}><Plus size={16} /> Create Test</button>
                        <button className="btn-secondary" onClick={openBulkUpload}><Upload size={16} /> Bulk Upload Results</button>
                    </div>
                )}
            </div>

            {showCreate && (
                <div className="card card-spaced">
                    <div className="card-header"><h3>New Test</h3></div>
                    <form onSubmit={handleCreate} className="card-body form-stack">
                        <div className="form-row">
                            <div className="form-group"><label>Test Name *</label><input required value={newTest.name} onChange={e => setNewTest(p => ({...p, name: e.target.value}))} placeholder="e.g. Unit Test 3" /></div>
                            <div className="form-group"><label>Standard *</label><select required value={newTest.standard_id} onChange={e => setNewTest(p => ({...p, standard_id: e.target.value}))}><option value="">Select</option>{(standards||[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div className="form-group"><label>Date *</label><input type="date" required value={newTest.test_date} onChange={e => setNewTest(p => ({...p, test_date: e.target.value}))} /></div>
                        </div>
                        <div className="btn-group-right">
                            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <select value={selectedTest?.id||''} onChange={e => setSelectedTest(tests.find(t => t.id === e.target.value))} className="inline-select">
                        {(tests||[]).map(t => <option key={t.id} value={t.id}>{t.name} -- {t.test_date}</option>)}
                    </select>
                    {results.length > 0 && <span className="text-muted-sm">{results.length} students</span>}
                    {isAdmin && results.length > 0 && (
                        editingMarks ? (
                            <div className="btn-group">
                                <button className="btn-primary btn-small" onClick={handleSaveMarks} disabled={savingMarks}>{savingMarks ? 'Saving...' : 'Save Marks'}</button>
                                <button className="btn-secondary btn-small" onClick={() => { setEditingMarks(false); setMarksMap({}); }}>Cancel</button>
                            </div>
                        ) : (
                            <button className="btn-secondary btn-small" onClick={() => setEditingMarks(true)}>Edit Marks</button>
                        )
                    )}
                </div>
                <div className="card-body card-body-flush">
                    {results.length === 0 ? (<p className="empty-message">No results for this test yet.</p>) : (
                        <div className="table-scroll">
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Subject</th><th>Marks</th><th>Max</th><th>%</th><th>Grade</th></tr></thead>
                                <tbody>
                                    {results.map(r => {
                                        const maxMarks = r.max_marks || 100;
                                        const pct = maxMarks > 0 ? Math.round((r.marks_obtained/maxMarks)*100) : 0;
                                        const entry = marksMap[r.student_id];
                                        const displayMarks = entry && editingMarks ? entry.marks : String(r.marks_obtained);
                                        return (
                                            <tr key={r.id}>
                                                <td className="td-bold">{r.students?.name || r.student_id}</td>
                                                <td>{r.subjects?.name || r.subject_id}</td>
                                                <td>
                                                    {editingMarks ? (
                                                        <input type="number" min="0" max={maxMarks} value={displayMarks} onChange={e => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val) && val > maxMarks) { showToast(`Maximum marks is ${maxMarks}`, 'error'); return; }
                                                            setMarksMap(prev => ({ ...prev, [r.student_id]: { ...prev[r.student_id], marks: e.target.value } }));
                                                        }} className="marks-input" />
                                                    ) : (<span>{r.marks_obtained}</span>)}
                                                </td>
                                                <td>{maxMarks}</td>
                                                <td><span className="td-bold">{pct}%</span></td>
                                                <td><span className="badge grade-badge" style={{ background: gradeColors[r.grade]||'#666' }}>{r.grade || '--'}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header"><h3>Bulk Upload Test Results</h3><button className="icon-btn" onClick={() => setShowBulkModal(false)} aria-label="Close"><X size={18} /></button></div>
                        <div className="modal-body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                Upload a CSV with <strong>roll_no</strong> and <strong>marks</strong> columns. The subject and test are pre-selected.
                            </p>
                            <div style={{ background: 'var(--surface-raised)', padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
                                <div><strong>Test:</strong> {selectedTest?.name} ({selectedTest?.test_date})</div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label>Subject *</label>
                                <select value={bulkSubjectId} onChange={e => setBulkSubjectId(e.target.value)}>
                                    <option value="">Select Subject...</option>
                                    {(testSubjects||[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label>CSV File *</label>
                                <input type="file" accept=".csv" onChange={handleBulkFileChange} />
                            </div>
                            {bulkPreview.length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Preview (first 5 rows):</p>
                                    <div style={{ overflowX: 'auto', fontSize: '0.8rem' }}>
                                        <table className="data-table" style={{ fontSize: '0.75rem' }}>
                                            <thead><tr>{Object.keys(bulkPreview[0]).map(k => <th key={k}>{k}</th>)}</tr></thead>
                                            <tbody>
                                                {bulkPreview.map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{v}</td>)}</tr>)}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleBulkImport} disabled={bulkImporting || !bulkFile || !bulkSubjectId}>
                                    {bulkImporting ? <><Loader2 size={14} className="spin" /> Importing...</> : 'Import Results'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .card-spaced {
                    margin-bottom: 24px;
                }
                .form-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .btn-group {
                    display: flex;
                    gap: 8px;
                }
                .btn-group-right {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }
                .inline-select {
                    max-width: 280px;
                    padding: 6px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: var(--surface-raised);
                }
                .text-muted-sm {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                .card-body-flush {
                    padding: 0;
                }
                .table-scroll {
                    overflow-x: auto;
                }
                .empty-message {
                    text-align: center;
                    padding: 40px;
                    color: var(--text-muted);
                }
                .td-bold {
                    font-weight: 600;
                }
                .marks-input {
                    width: 70px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: var(--bg-secondary, #f5f5f5);
                }
                .grade-badge {
                    color: white;
                }
            `}</style>
        </>
    );
}
