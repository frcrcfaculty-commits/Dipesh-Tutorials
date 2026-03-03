import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { STUDENTS, STANDARDS, SUBJECTS_BY_STANDARD, TEST_RESULTS, TESTS, TOPICS_BY_SUBJECT } from '../data';
import {
    Upload, FileSpreadsheet, FileText, Search, Filter, Download,
    Plus, X, CheckCircle, AlertCircle, Eye
} from 'lucide-react';

export default function TestResults() {
    const { user } = useAuth();
    const [tab, setTab] = useState('view');
    const [selectedTest, setSelectedTest] = useState(TESTS[TESTS.length - 1].id);
    const [selectedStandard, setSelectedStandard] = useState('All');
    const [selectedSubject, setSelectedSubject] = useState('All');
    const [search, setSearch] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [uploadStandard, setUploadStandard] = useState(STANDARDS[0]);
    const [uploadTest, setUploadTest] = useState(TESTS[0].id);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const subjects = selectedStandard !== 'All' ? (SUBJECTS_BY_STANDARD[selectedStandard] || []) : [];
    const uploadSubjects = SUBJECTS_BY_STANDARD[uploadStandard] || [];

    const filteredResults = useMemo(() => {
        let results = TEST_RESULTS.filter(r => r.testId === selectedTest);
        if (selectedStandard !== 'All') results = results.filter(r => r.standard === selectedStandard);
        if (selectedSubject !== 'All') results = results.filter(r => r.subject === selectedSubject);
        if (search) results = results.filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()) || r.studentId.toLowerCase().includes(search.toLowerCase()));
        return results;
    }, [selectedTest, selectedStandard, selectedSubject, search]);

    // Group by student for summary view
    const studentSummaries = useMemo(() => {
        const map = {};
        for (const r of filteredResults) {
            if (!map[r.studentId]) map[r.studentId] = { id: r.studentId, name: r.studentName, standard: r.standard, subjects: [] };
            map[r.studentId].subjects.push({ subject: r.subject, percentage: r.percentage, grade: r.grade, totalMarks: r.totalMarks, maxTotal: r.maxTotal });
        }
        return Object.values(map).map(s => ({
            ...s,
            average: s.subjects.length > 0 ? Math.round(s.subjects.reduce((sum, sub) => sum + sub.percentage, 0) / s.subjects.length) : 0,
        })).sort((a, b) => b.average - a.average);
    }, [filteredResults]);

    const handleSimulateUpload = () => {
        setUploadSuccess(true);
        setTimeout(() => { setUploadSuccess(false); setShowUpload(false); }, 2000);
    };

    return (
        <>
            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'view' ? 'active' : ''}`} onClick={() => setTab('view')}>
                    <Eye size={16} style={{ marginRight: 6 }} />View Results
                </button>
                <button className={`tab ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>
                    <Upload size={16} style={{ marginRight: 6 }} />Upload Results
                </button>
            </div>

            {tab === 'view' && (
                <>
                    {/* Filters */}
                    <div className="search-bar">
                        <div className="search-input">
                            <Search />
                            <input placeholder="Search student name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="select-wrapper">
                            <select value={selectedTest} onChange={e => setSelectedTest(e.target.value)}>
                                {TESTS.map(t => <option key={t.id} value={t.id}>{t.name} ({t.date})</option>)}
                            </select>
                        </div>
                        <div className="select-wrapper">
                            <select value={selectedStandard} onChange={e => { setSelectedStandard(e.target.value); setSelectedSubject('All'); }}>
                                <option value="All">All Standards</option>
                                {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {subjects.length > 0 && (
                            <div className="select-wrapper">
                                <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                                    <option value="All">All Subjects</option>
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Summary Stats */}
                    <div className="stats-grid">
                        <div className="stat-card navy">
                            <div className="stat-icon navy"><FileText size={24} /></div>
                            <div className="stat-info"><h4>Total Records</h4><div className="stat-value">{filteredResults.length}</div></div>
                        </div>
                        <div className="stat-card green">
                            <div className="stat-icon green"><CheckCircle size={24} /></div>
                            <div className="stat-info"><h4>Students</h4><div className="stat-value">{studentSummaries.length}</div></div>
                        </div>
                        <div className="stat-card gold">
                            <div className="stat-icon gold"><FileSpreadsheet size={24} /></div>
                            <div className="stat-info"><h4>Class Average</h4>
                                <div className="stat-value">
                                    {filteredResults.length > 0 ? Math.round(filteredResults.reduce((s, r) => s + r.percentage, 0) / filteredResults.length) : 0}%
                                </div></div>
                        </div>
                        <div className="stat-card red">
                            <div className="stat-icon red"><AlertCircle size={24} /></div>
                            <div className="stat-info"><h4>Below 35%</h4>
                                <div className="stat-value">{filteredResults.filter(r => r.percentage < 35).length}</div></div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Test Results ({studentSummaries.length} students)</h3>
                            <button className="btn-secondary btn-small"><Download size={14} /> Export</button>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Student</th>
                                            <th>Standard</th>
                                            {selectedSubject !== 'All' ? (
                                                <>
                                                    <th>Marks</th>
                                                    <th>Percentage</th>
                                                    <th>Grade</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th>Subjects</th>
                                                    <th>Average</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedSubject !== 'All' ? (
                                            filteredResults.slice(0, 50).map(r => (
                                                <tr key={r.id}>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.studentId}</td>
                                                    <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                                                    <td>{r.standard}</td>
                                                    <td>{r.totalMarks}/{r.maxTotal}</td>
                                                    <td>
                                                        <span className={`co-cell ${r.percentage >= 75 ? 'high' : r.percentage >= 50 ? 'medium' : 'low'}`}
                                                            style={{ display: 'inline-block', minWidth: 50 }}>{r.percentage}%</span>
                                                    </td>
                                                    <td><span style={{ fontWeight: 700, color: r.percentage >= 75 ? 'var(--success)' : r.percentage >= 50 ? 'var(--gold)' : 'var(--danger)' }}>{r.grade}</span></td>
                                                </tr>
                                            ))
                                        ) : (
                                            studentSummaries.slice(0, 50).map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.id}</td>
                                                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                    <td>{s.standard}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                            {s.subjects.map(sub => (
                                                                <span key={sub.subject} className={`resource-tag`} style={{ fontSize: '0.65rem' }}>
                                                                    {sub.subject}: {sub.grade}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`co-cell ${s.average >= 75 ? 'high' : s.average >= 50 ? 'medium' : 'low'}`}
                                                            style={{ display: 'inline-block', minWidth: 50 }}>{s.average}%</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {filteredResults.length === 0 && (
                                <div className="empty-state">
                                    <FileText /><h3>No results found</h3><p>Try adjusting your filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {tab === 'upload' && (
                <>
                    <div className="card">
                        <div className="card-header"><h3>Upload Test Results</h3></div>
                        <div className="card-body">
                            <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
                                Upload test results for students in Word (.docx) or Excel (.xlsx) format. Select the standard and test before uploading.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div className="form-group">
                                    <label>Select Standard</label>
                                    <div className="select-wrapper">
                                        <select value={uploadStandard} onChange={e => setUploadStandard(e.target.value)}>
                                            {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Select Test</label>
                                    <div className="select-wrapper">
                                        <select value={uploadTest} onChange={e => setUploadTest(e.target.value)}>
                                            {TESTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            <option value="new">+ Create New Test</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: 8 }}>Subjects for {uploadStandard}</label>
                                <div className="filter-chips">
                                    {uploadSubjects.map(s => (
                                        <span key={s} className="filter-chip active" style={{ cursor: 'default' }}>{s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* File Upload Areas */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div className="upload-area">
                                    <FileSpreadsheet size={36} style={{ color: 'var(--success)', marginBottom: 8 }} />
                                    <h4>Upload Excel File (.xlsx)</h4>
                                    <p>Spreadsheet with student marks</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 8 }}>
                                        Format: Student ID | Name | Subject | Topic 1 | Topic 2 | ...
                                    </p>
                                    <button className="btn-primary" style={{ width: 'auto', marginTop: 12, padding: '8px 20px', fontSize: '0.85rem' }}
                                        onClick={handleSimulateUpload}>
                                        <Upload size={16} /> Choose .xlsx File
                                    </button>
                                </div>
                                <div className="upload-area">
                                    <FileText size={36} style={{ color: 'var(--info)', marginBottom: 8 }} />
                                    <h4>Upload Word File (.docx)</h4>
                                    <p>Document with formatted results</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 8 }}>
                                        Format: Tables with student-wise marks
                                    </p>
                                    <button className="btn-primary" style={{ width: 'auto', marginTop: 12, padding: '8px 20px', fontSize: '0.85rem' }}
                                        onClick={handleSimulateUpload}>
                                        <Upload size={16} /> Choose .docx File
                                    </button>
                                </div>
                            </div>

                            {uploadSuccess && (
                                <div style={{
                                    padding: '16px 20px', background: 'rgba(16,185,129,0.08)', border: '1px solid var(--success)',
                                    borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16
                                }}>
                                    <CheckCircle size={20} color="var(--success)" />
                                    <span style={{ fontWeight: 600, color: 'var(--success)' }}>Results uploaded successfully for {uploadStandard} — {TESTS.find(t => t.id === uploadTest)?.name}</span>
                                </div>
                            )}

                            {/* Template Download */}
                            <div className="card" style={{ background: 'var(--bg)', border: '1px dashed var(--border)', marginTop: 8 }}>
                                <div className="card-body" style={{ padding: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <h4 style={{ fontSize: '0.9rem', marginBottom: 4 }}>📋 Download Template</h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Download a pre-formatted template with student names for {uploadStandard} ({STUDENTS.filter(s => s.standard === uploadStandard).length} students)
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button className="btn-secondary btn-small"><FileSpreadsheet size={14} /> .xlsx</button>
                                            <button className="btn-secondary btn-small"><FileText size={14} /> .docx</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
