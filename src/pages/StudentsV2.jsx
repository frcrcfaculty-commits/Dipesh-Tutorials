import React, { useState, useEffect, useMemo } from 'react';
import { getStudents, getStandards, addStudent, updateStudent, deleteStudent, getStudentStats, getFeeSummary, bulkUpsertStudents } from '../lib/api';
import { Search, Users, Download, Plus, X, Edit2, Trash2, Loader2, Upload, ArrowRight } from 'lucide-react';
import { exportCSV, showToast } from '../utils';
import { SkeletonStatGrid, SkeletonTable } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { generateStudentReportPDF } from '../reports';

// TODO: Fee status is computed client-side by fetching all payments + structures.
// For 500+ students, move this to a Supabase database view (student_fee_summary already exists).
// Use getFeeSummary() which queries the view instead of computing in JS.

export default function Students() {
    const [students, setStudents] = useState([]);
    const [standards, setStandards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attendanceStats, setAttendanceStats] = useState({});
    const [feeSummary, setFeeSummary] = useState([]);
    const [search, setSearch] = useState('');
    const [standardFilter, setStandardFilter] = useState('All');
    const [feeFilter, setFeeFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [page, setPage] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const PER_PAGE = 50;
    const [form, setForm] = useState({
        name: '', roll_no: '', gender: 'Male', standard_id: '',
        parent_name: '', parent_phone: '', parent_email: '',
        date_of_birth: '', address: '', enrollment_date: '',
    });
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkStandardId, setBulkStandardId] = useState('');
    const [bulkFile, setBulkFile] = useState(null);
    const [bulkPreview, setBulkPreview] = useState([]);
    const [bulkImporting, setBulkImporting] = useState(false);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const [studs, stds, stats, fees] = await Promise.all([
                getStudents(), getStandards(), getStudentStats(), getFeeSummary()
            ]);
            setStudents(studs || []);
            setStandards(stds || []);
            setAttendanceStats(stats || {});
            setFeeSummary(fees || []);
        } catch (err) {
            setError('Failed to load students: ' + err.message);
            showToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);
    useEffect(() => { setPage(1); }, [search, standardFilter, feeFilter]);

    const feeStatusMap = useMemo(() => {
        const map = {};
        (feeSummary || []).forEach(f => { map[f.student_id] = f.status || 'pending'; });
        return map;
    }, [feeSummary]);

    const filtered = useMemo(() => {
        return (students || []).filter(s => {
            if (standardFilter !== 'All' && s.standards?.name !== standardFilter) return false;
            if (feeFilter !== 'All' && (feeStatusMap[s.id] || 'pending') !== feeFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                const nameMatch = s.name?.toLowerCase().includes(q);
                const rollMatch = String(s.roll_no || '').includes(q);
                const parentMatch = s.parent_name?.toLowerCase().includes(q);
                const phoneMatch = s.parent_phone?.includes(q);
                if (!nameMatch && !rollMatch && !parentMatch && !phoneMatch) return false;
            }
            return true;
        });
    }, [students, search, standardFilter, feeFilter, feeStatusMap]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const openAdd = () => {
        setForm({ name: '', roll_no: '', gender: 'Male', standard_id: standards[0]?.id || '', parent_name: '', parent_phone: '', parent_email: '', date_of_birth: '', address: '', enrollment_date: new Date().toISOString().split('T')[0] });
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (s) => {
        setForm({ name: s.name || '', roll_no: s.roll_no || '', gender: s.gender || 'Male', standard_id: s.standard_id || '', parent_name: s.parent_name || '', parent_phone: s.parent_phone || '', parent_email: s.parent_email || '', date_of_birth: s.date_of_birth || '', address: s.address || '', enrollment_date: s.enrollment_date || '' });
        setEditingId(s.id);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form };
            // Sanitize optional fields so empty strings don't break Postgres types
            if (!payload.roll_no) payload.roll_no = null;
            if (!payload.date_of_birth) payload.date_of_birth = null;
            if (!payload.enrollment_date) payload.enrollment_date = null;
            if (!payload.parent_email) payload.parent_email = null;
            if (!payload.address) payload.address = null;

            if (editingId) {
                await updateStudent(editingId, payload);
                showToast('Student updated!');
            } else {
                await addStudent(payload);
                showToast('Student added!');
            }
            setShowModal(false);
            loadData();
        } catch (err) {
            showToast(err.message || 'Save failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await deleteStudent(id);
            showToast('Student deleted');
            loadData();
        } catch (err) {
            showToast(err.message || 'Delete failed', 'error');
        } finally {
            setDeleting(null);
            setConfirmDelete(null);
        }
    };

    const handleExportPDF = () => {
        if (filtered.length === 0) { showToast('No data to export'); return; }
        const feeMap = {};
        (feeSummary || []).forEach(f => { feeMap[f.student_id] = f.status || 'pending'; });
        const pdfData = filtered.map(s => {
            const stats = attendanceStats[s.id];
            const attPct = stats && stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : '--';
            return { id: (s.id || '').slice(0, 8), name: s.name || '--', standard: s.standards?.name || '--', rollNo: s.roll_no || '--', attendancePercent: attPct, feeStatus: feeMap[s.id] || 'pending', parentPhone: s.parent_phone || '--' };
        });
        generateStudentReportPDF(pdfData);
        showToast('PDF exported!');
    };

    const handleExportCSV = () => {
        if (filtered.length === 0) { showToast('No data to export'); return; }
        exportCSV('students', ['ID', 'Name', 'Standard', 'Roll', 'Gender', 'Parent', 'Phone', 'Status'],
            filtered.map(s => [s.id, s.name, s.standards?.name, s.roll_no, s.gender, s.parent_name, s.parent_phone, s.status || 'pending']));
        showToast('CSV exported!');
    };

    const openBulkUpload = () => {
        setBulkStandardId(standards[0]?.id || '');
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
            const required = ['name', 'roll_no'];
            const missing = required.filter(r => !headers.some(h => h.toLowerCase() === r.toLowerCase()));
            if (missing.length > 0) { showToast(`Missing columns: ${missing.join(', ')}`, 'error'); setBulkFile(null); return; }
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
        if (!bulkFile || !bulkStandardId) { showToast('Select a file and standard', 'error'); return; }
        setBulkImporting(true);
        try {
            const text = await bulkFile.text();
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            const students = lines.slice(1).filter(l => l.trim()).map(line => {
                const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {}; headers.forEach((h, i) => { row[h] = vals[i] || ''; });
                return {
                    name: row.name || row.Name || '',
                    roll_no: parseInt(row.roll_no || row.Roll_No || row.rollno || 0),
                    gender: row.gender || row.Gender || 'Male',
                    standard_id: parseInt(bulkStandardId),
                    parent_name: row.parent_name || row.Parent_Name || row.parent || '',
                    parent_phone: row.parent_phone || row.Parent_Phone || row.phone || '',
                    parent_email: row.parent_email || row.Parent_Email || row.email || '',
                    date_of_birth: row.date_of_birth || row.Date_of_Birth || row.dob || '',
                    address: row.address || row.Address || '',
                    enrollment_date: row.enrollment_date || row.Enrollment_Date || new Date().toISOString().split('T')[0],
                    is_active: true,
                };
            }).filter(s => s.name && s.roll_no);
            if (students.length === 0) { showToast('No valid students found in CSV', 'error'); return; }
            await bulkUpsertStudents(students);
            showToast(`${students.length} students imported!`);
            setShowBulkModal(false);
            loadData();
        } catch (err) {
            showToast('Bulk import failed: ' + err.message, 'error');
        } finally {
            setBulkImporting(false);
        }
    };

    if (loading) return <><SkeletonStatGrid count={4} /><div style={{ marginTop: 24 }}><SkeletonTable rows={8} cols={5} /></div></>;

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><Users size={24} /></div><div className="stat-info"><h4>Total</h4><div className="stat-value">{students.length}</div></div></div>
                {standards.slice(0, 3).map(std => (
                    <div key={std.id} className="stat-card gold"><div className="stat-icon gold"><Users size={24} /></div><div className="stat-info"><h4>{std.name}</h4><div className="stat-value">{(students || []).filter(s => s.standard_id === std.id).length}</div></div></div>
                ))}
            </div>
            <div className="hero-card" onClick={openBulkUpload} style={{marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                    <div style={{background:'linear-gradient(135deg,#0A2351,#1a4a8a)',borderRadius:12,padding:12}}><Upload size={24} color="white" /></div>
                    <div style={{flex:1}}><h3 style={{margin:0,fontSize:'1rem'}}>Bulk Upload Students</h3><p style={{margin:0,fontSize:'0.85rem',opacity:0.8}}>Upload a CSV to add multiple students at once — fast and error-free</p></div>
                    <ArrowRight size={20} />
                </div>
            </div>
            <div className="search-bar">
                <div className="search-input"><Search /><input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <div className="select-wrapper"><select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}><option value="All">All Standards</option>{standards.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                <div className="filter-chips">{['All', 'paid', 'pending', 'overdue'].map(f => (<button key={f} className={`filter-chip ${feeFilter === f ? 'active' : ''}`} onClick={() => setFeeFilter(f)}>{f === 'All' ? 'All Fees' : f.charAt(0).toUpperCase() + f.slice(1)}</button>))}</div>
            </div>
            {error && <div style={{ color: 'var(--danger)', padding: '8px 16px', marginBottom: 16 }}>{error} <button onClick={loadData} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Retry</button></div>}
            <div className="card">
                <div className="card-header"><h3>Students ({filtered.length})</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary btn-small" onClick={handleExportCSV} aria-label="Export CSV"><Download size={14} /> CSV</button>
                        <button className="btn-secondary btn-small" onClick={handleExportPDF} aria-label="Export PDF"><Download size={14} /> PDF</button>
                        <button className="btn-secondary btn-small" onClick={openBulkUpload} aria-label="Bulk upload"><Upload size={14} /> Bulk Upload</button>
                        <button className="btn-primary btn-small" onClick={openAdd} aria-label="Add student"><Plus size={14} /> Add Student</button>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr>
                                {!isMobile && <th>ID</th>}
                                <th>Name</th>
                                {!isMobile && <th>Standard</th>}
                                {!isMobile && <th>Roll</th>}
                                {!isMobile && <th>Gender</th>}
                                {!isMobile && <th>Parent</th>}
                                {!isMobile && <th>Phone</th>}
                                <th>Status</th>
                                <th>Actions</th>
                            </tr></thead>
                            <tbody>
                                {paginated.map(s => (
                                    <tr key={s.id}>
                                        {!isMobile && <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.id?.slice(0, 8)}</td>}
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        {!isMobile && <td>{s.standards?.name}</td>}
                                        {!isMobile && <td>{s.roll_no}</td>}
                                        {!isMobile && <td>{s.gender}</td>}
                                        {!isMobile && <td style={{ fontSize: '0.85rem' }}>{s.parent_name}</td>}
                                        {!isMobile && <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.parent_phone}</td>}
                                        <td><span className={`badge ${feeStatusMap[s.id] || 'pending'}`}>{feeStatusMap[s.id] || 'pending'}</span></td>
                                        <td><div style={{ display: 'flex', gap: 6 }}>
                                            <button className="icon-btn" onClick={() => openEdit(s)} aria-label="Edit student" title="Edit"><Edit2 size={14} /></button>
                                            <button className="icon-btn danger" onClick={() => setConfirmDelete(s)} disabled={deleting === s.id} aria-label="Delete student" title="Delete">{deleting === s.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}</button>
                                        </div></td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !search && standardFilter === 'All' ? (
                                <tr><td colSpan={9}><EmptyState type="students" onAction={openAdd} /></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={9}><EmptyState type="search" /></td></tr>
                            ) : null}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16 }}><button className="btn-secondary btn-small" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span><button className="btn-secondary btn-small" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button></div>)}
                </div>
            </div>
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3 id="delete-modal-title">Confirm Delete</h3><button className="icon-btn" onClick={() => setConfirmDelete(null)} aria-label="Close"><X size={18} /></button></div>
                        <div className="modal-body">
                            <p>Are you sure you want to remove <strong>{confirmDelete.name}</strong>?</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>This action cannot be undone.</p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                                <button className="btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={() => handleDelete(confirmDelete.id)}>{deleting === confirmDelete.id ? <><Loader2 size={14} className="spin" /> Deleting...</> : 'Delete'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editingId ? 'Edit Student' : 'Add Student'}</h3><button className="icon-btn" onClick={() => setShowModal(false)} aria-label="Close"><X size={18} /></button></div>
                        <form onSubmit={handleSave} className="modal-body">
                            <div className="form-row">
                                <div className="form-group"><label>Student Name *</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" /></div>
                                <div className="form-group"><label>Standard *</label><select required value={form.standard_id} onChange={e => setForm(p => ({ ...p, standard_id: Number(e.target.value) }))}><option value="">Select...</option>{standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Roll No</label><input type="number" value={form.roll_no} onChange={e => setForm(p => ({ ...p, roll_no: Number(e.target.value) }))} placeholder="Class roll" /></div>
                                <div className="form-group"><label>Gender</label><select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}><option>Male</option><option>Female</option><option>Other</option></select></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Parent Name *</label><input required value={form.parent_name} onChange={e => setForm(p => ({ ...p, parent_name: e.target.value }))} placeholder="Mr. / Mrs. Name" /></div>
                                <div className="form-group"><label>Phone *</label><input required value={form.parent_phone} onChange={e => setForm(p => ({ ...p, parent_phone: e.target.value }))} placeholder="+919..." /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Parent Email</label><input type="email" value={form.parent_email} onChange={e => setForm(p => ({ ...p, parent_email: e.target.value }))} placeholder="parent@email.com" /></div>
                                <div className="form-group"><label>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} /></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Enrollment Date</label><input type="date" value={form.enrollment_date} onChange={e => setForm(p => ({ ...p, enrollment_date: e.target.value }))} /></div>
                                <div className="form-group"><label>Address</label><input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" /></div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? <><Loader2 size={14} className="spin" /> Saving...</> : (editingId ? 'Update' : 'Add Student')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showBulkModal && (
                <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div className="modal-header"><h3>Bulk Upload Students</h3><button className="icon-btn" onClick={() => setShowBulkModal(false)} aria-label="Close"><X size={18} /></button></div>
                        <div className="modal-body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                Upload a CSV file with columns: <strong>name</strong>, <strong>roll_no</strong> (required), and optionally: gender, parent_name, parent_phone, parent_email, date_of_birth, address, enrollment_date.
                            </p>
                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label>Standard *</label>
                                <select value={bulkStandardId} onChange={e => setBulkStandardId(e.target.value)}>
                                    <option value="">Select Standard...</option>
                                    {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                                <button className="btn-primary" onClick={handleBulkImport} disabled={bulkImporting || !bulkFile || !bulkStandardId}>
                                    {bulkImporting ? <><Loader2 size={14} className="spin" /> Importing...</> : 'Import Students'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
