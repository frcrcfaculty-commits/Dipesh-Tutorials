import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getTests, getTestResults, createTest, upsertTestResults, getStandards, getSubjects } from '../lib/api';
import { FileText, Plus, Loader2 } from 'lucide-react';
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

    return (
        <>
            <div className="page-header"><h2>Test Results</h2>
                {isAdmin && (<button className="btn-primary" onClick={() => setShowCreate(s => !s)}><Plus size={16} /> Create Test</button>)}
            </div>

            {showCreate && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>New Test</h3></div>
                    <form onSubmit={handleCreate} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-row">
                            <div className="form-group"><label>Test Name *</label><input required value={newTest.name} onChange={e => setNewTest(p => ({...p, name: e.target.value}))} placeholder="e.g. Unit Test 3" /></div>
                            <div className="form-group"><label>Standard *</label><select required value={newTest.standard_id} onChange={e => setNewTest(p => ({...p, standard_id: e.target.value}))}><option value="">Select</option>{(standards||[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div className="form-group"><label>Date *</label><input type="date" required value={newTest.test_date} onChange={e => setNewTest(p => ({...p, test_date: e.target.value}))} /></div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <select value={selectedTest?.id||''} onChange={e => setSelectedTest(tests.find(t => t.id === e.target.value))} style={{ maxWidth: 280, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                        {(tests||[]).map(t => <option key={t.id} value={t.id}>{t.name} -- {t.test_date}</option>)}
                    </select>
                    {results.length > 0 && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{results.length} students</span>}
                    {isAdmin && results.length > 0 && (
                        editingMarks ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn-primary btn-small" onClick={handleSaveMarks} disabled={savingMarks}>{savingMarks ? 'Saving...' : 'Save Marks'}</button>
                                <button className="btn-secondary btn-small" onClick={() => { setEditingMarks(false); setMarksMap({}); }}>Cancel</button>
                            </div>
                        ) : (
                            <button className="btn-secondary btn-small" onClick={() => setEditingMarks(true)}>Edit Marks</button>
                        )
                    )}
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {results.length === 0 ? (<p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No results for this test yet.</p>) : (
                        <div style={{ overflowX: 'auto' }}>
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
                                                <td style={{ fontWeight: 600 }}>{r.students?.name || r.student_id}</td>
                                                <td>{r.subjects?.name || r.subject_id}</td>
                                                <td>
                                                    {editingMarks ? (
                                                        <input type="number" min="0" max={maxMarks} value={displayMarks} onChange={e => {
                                                            const val = parseFloat(e.target.value);
                                                            if (!isNaN(val) && val > maxMarks) { showToast(`Maximum marks is ${maxMarks}`, 'error'); return; }
                                                            setMarksMap(prev => ({ ...prev, [r.student_id]: { ...prev[r.student_id], marks: e.target.value } }));
                                                        }} style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)' }} />
                                                    ) : (<span>{r.marks_obtained}</span>)}
                                                </td>
                                                <td>{maxMarks}</td>
                                                <td><span style={{ fontWeight: 700 }}>{pct}%</span></td>
                                                <td><span className="badge" style={{ background: gradeColors[r.grade]||'#666', color: 'white' }}>{r.grade || '--'}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
