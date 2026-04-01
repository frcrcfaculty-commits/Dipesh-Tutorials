import React, { useState, useEffect, useMemo } from 'react';
import { getStudents, getStandards, addStudent, updateStudent, deleteStudent, getStudentStats, getFeeSummary } from '../lib/api';
import { Search, Users, Download, Plus, X, Edit2, Trash2, Loader2 } from 'lucide-react';
import { exportCSV, showToast } from '../utils';
import { generateStudentReportPDF } from '../reports';

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

    const [form, setForm] = useState({
        name: '', roll_no: '', gender: 'Male', standard_id: '',
        parent_name: '', parent_phone: '', parent_email: '',
        date_of_birth: '', address: '', enrollment_date: '',
    });

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

    const feeStatusMap = useMemo(() => {
        const map = {};
        (feeSummary || []).forEach(f => { map[f.student_id] = f.status || 'pending'; });
        return map;
    }, [feeSummary]);

    const filtered = useMemo(() => {
        return (students || []).filter(s => {
            // Standard filter: compare standard name strings
            if (standardFilter !== 'All' && s.standards?.name !== standardFilter) return false;
            // Fee filter: lookup from fee summary, default to 'pending' if not found
            if (feeFilter !== 'All' && (feeStatusMap[s.id] || 'pending') !== feeFilter) return false;
            // Search: match name (case-insensitive), roll_no (as string), or parent name
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

    const openAdd = () => {
        setForm({ name: '', roll_no: '', gender: 'Male', standard_id: standards[0]?.id || '', parent_name: '', parent_phone: '', parent_email: '', date_of_birth: '', address: '', enrollment_date: new Date().toISOString().split('T')[0] });
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (s) => {
        setForm({
            name: s.name || '', roll_no: s.roll_no || '', gender: s.gender || 'Male',
            standard_id: s.standard_id || '', parent_name: s.parent_name || '',
            parent_phone: s.parent_phone || '', parent_email: s.parent_email || '',
            date_of_birth: s.date_of_birth || '', address: s.address || '',
            enrollment_date: s.enrollment_date || '',
        });
        setEditingId(s.id);
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await updateStudent(editingId, form);
                showToast('Student updated!');
            } else {
                await addStudent(form);
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
        if (!confirm('Delete this student? This cannot be undone.')) return;
        setDeleting(id);
        try {
            await deleteStudent(id);
            showToast('Student deleted');
            loadData();
        } catch (err) {
            showToast(err.message || 'Delete failed', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const handleExportPDF = () => {
        if (filtered.length === 0) { showToast('No data to export'); return; }
        // Build fee status lookup from feeSummary
        const feeMap = {};
        (feeSummary || []).forEach(f => { feeMap[f.student_id] = f.status || 'pending'; });

        const pdfData = filtered.map(s => {
            const stats = attendanceStats[s.id];
            const attPct = stats && stats.total > 0
                ? Math.round((stats.present / stats.total) * 100)
                : '—';
            return {
                id: (s.id || '').slice(0, 8),
                name: s.name || '—',
                standard: s.standards?.name || '—',
                rollNo: s.roll_no || '—',
                attendancePercent: attPct,
                feeStatus: feeMap[s.id] || 'pending',
                parentPhone: s.parent_phone || '—',
            };
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

    const attendancePercent = (s) => {
        const stats = attendanceStats[s.id];
        if (stats && stats.total > 0) return Math.round((stats.present / stats.total) * 100);
        return '—';
    };

    if (loading) return <div className="loading-spinner" />;

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><Users size={24} /></div>
                    <div className="stat-info"><h4>Total</h4><div className="stat-value">{students.length}</div></div>
                </div>
                {standards.slice(0, 3).map(std => (
                    <div key={std.id} className="stat-card gold">
                        <div className="stat-icon gold"><Users size={24} /></div>
                        <div className="stat-info"><h4>{std.name}</h4><div className="stat-value">{(students || []).filter(s => s.standard_id === std.id).length}</div></div>
                    </div>
                ))}
            </div>

            <div className="search-bar">
                <div className="search-input"><Search /><input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <div className="select-wrapper">
                    <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}>
                        <option value="All">All Standards</option>
                        {standards.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <div className="filter-chips">
                    {['All', 'paid', 'pending', 'overdue'].map(f => (
                        <button key={f} className={`filter-chip ${feeFilter === f ? 'active' : ''}`} onClick={() => setFeeFilter(f)}>
                            {f === 'All' ? 'All Fees' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div style={{ color: 'var(--danger)', padding: '8px 16px', marginBottom: 16 }}>{error} <button onClick={loadData} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Retry</button></div>}

            <div className="card">
                <div className="card-header">
                    <h3>Students ({filtered.length})</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary btn-small" onClick={handleExportCSV}><Download size={14} /> CSV</button>
                        <button className="btn-secondary btn-small" onClick={handleExportPDF}><Download size={14} /> PDF</button>
                        <button className="btn-primary btn-small" onClick={openAdd}><Plus size={14} /> Add Student</button>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>ID</th><th>Name</th><th>Standard</th><th>Roll</th><th>Gender</th><th>Parent</th><th>Phone</th><th>Fee Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.id?.slice(0, 8)}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.standards?.name}</td>
                                        <td>{s.roll_no}</td>
                                        <td>{s.gender}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{s.parent_name}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.parent_phone}</td>
                                        <td><span className={`badge ${feeStatusMap[s.id] || 'pending'}`}>{feeStatusMap[s.id] || 'pending'}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="icon-btn" onClick={() => openEdit(s)} title="Edit"><Edit2 size={14} /></button>
                                                <button className="icon-btn danger" onClick={() => handleDelete(s.id)} disabled={deleting === s.id} title="Delete">
                                                    {deleting === s.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No students found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Student' : 'Add Student'}</h3>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-body">
                            <div className="form-row">
                                <div className="form-group"><label>Student Name *</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" /></div>
                                <div className="form-group"><label>Standard *</label>
                                    <select required value={form.standard_id} onChange={e => setForm(p => ({ ...p, standard_id: Number(e.target.value) }))}>
                                        <option value="">Select...</option>
                                        {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Roll No</label><input type="number" value={form.roll_no} onChange={e => setForm(p => ({ ...p, roll_no: Number(e.target.value) }))} placeholder="Class roll" /></div>
                                <div className="form-group"><label>Gender</label>
                                    <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
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
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? <><Loader2 size={14} className="spin" /> Saving...</> : (editingId ? 'Update' : 'Add Student')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
