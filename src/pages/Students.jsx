import React, { useState, useMemo, useEffect } from 'react';
import { STUDENTS as MOCK_STUDENTS, STANDARDS, SUBJECTS_BY_STANDARD } from '../data';
import { addStudent, updateStudent, deleteStudent, subscribeStudents } from '../firebase';
import { Search, Users, Download, Plus, X, Edit2, Trash2, Loader2 } from 'lucide-react';
import { exportCSV, showToast } from '../utils';

const INITIAL_FORM = {
    name: '', standard: '8th', rollNo: '', gender: 'Male',
    parentName: '', parentPhone: '', email: '', dateOfBirth: '',
    address: '', enrollmentDate: '', totalFees: 25000,
};

export default function Students() {
    const [students, setStudents] = useState(MOCK_STUDENTS);
    const [search, setSearch] = useState('');
    const [standardFilter, setStandardFilter] = useState('All');
    const [feeFilter, setFeeFilter] = useState('All');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // Try to use Firebase, fall back to mock data
    useEffect(() => {
        let unsubscribe;
        try {
            unsubscribe = subscribeStudents((data) => {
                if (data && data.length > 0) setStudents(data);
            });
        } catch (_) {}
        return () => { if (unsubscribe) unsubscribe(); };
    }, []);

    const filtered = useMemo(() => {
        return students.filter(s => {
            if (standardFilter !== 'All' && s.standard !== standardFilter) return false;
            if (feeFilter !== 'All' && s.feeStatus !== feeFilter) return false;
            if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) && !s.id?.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [students, search, standardFilter, feeFilter]);

    const openAdd = () => { setForm({ ...INITIAL_FORM, standard: standardFilter !== 'All' ? standardFilter : '8th' }); setEditingId(null); setShowModal(true); };
    const openEdit = (s) => {
        setForm({
            name: s.name || '', standard: s.standard || '8th', rollNo: s.rollNo || '',
            gender: s.gender || 'Male', parentName: s.parentName || '', parentPhone: s.parentPhone || '',
            email: s.email || '', dateOfBirth: s.dateOfBirth || '', address: s.address || '',
            enrollmentDate: s.enrollmentDate || '', totalFees: s.totalFees || 25000,
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
                setStudents(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
                showToast('Student updated!');
            } else {
                const docRef = await addStudent(form);
                setStudents(prev => [...prev, { id: docRef.id, ...form }]);
                showToast('Student added!');
            }
            setShowModal(false);
        } catch (err) {
            console.error(err);
            // Demo fallback: update local state
            if (editingId) {
                setStudents(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
            } else {
                const newId = `STU${String(students.length + 1).padStart(4, '0')}`;
                setStudents(prev => [...prev, { id: newId, ...form }]);
            }
            showToast(editingId ? 'Student updated (demo)!' : 'Student added (demo)!');
            setShowModal(false);
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this student? This cannot be undone.')) return;
        setDeleting(id);
        try {
            await deleteStudent(id);
            setStudents(prev => prev.filter(s => s.id !== id));
            showToast('Student deleted!');
        } catch (err) {
            // Demo fallback
            setStudents(prev => prev.filter(s => s.id !== id));
            showToast('Student deleted (demo)!');
        }
        setDeleting(null);
    };

    const exportStudents = () => {
        exportCSV('students', ['ID', 'Name', 'Standard', 'Roll No', 'Attendance %', 'Fee Status', 'Parent', 'Contact', 'Email'],
            filtered.map(s => [s.id, s.name, s.standard, s.rollNo, s.attendancePercent, s.feeStatus, s.parentName, s.parentPhone, s.email]));
        showToast('Student data exported!');
    };

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><Users size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Students</h4>
                        <div className="stat-value">{students.length}</div>
                    </div>
                </div>
                {STANDARDS.slice(0, 3).map((std) => (
                    <div key={std} className="stat-card gold">
                        <div className="stat-icon gold"><Users size={24} /></div>
                        <div className="stat-info">
                            <h4>{std}</h4>
                            <div className="stat-value">{students.filter(s => s.standard === std).length}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="search-bar">
                <div className="search-input">
                    <Search />
                    <input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="select-wrapper">
                    <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}>
                        <option value="All">All Standards</option>
                        {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="filter-chips">
                    {['All', 'paid', 'pending', 'overdue'].map(s => (
                        <button key={s} className={`filter-chip ${feeFilter === s ? 'active' : ''}`} onClick={() => setFeeFilter(s)}>
                            {s === 'All' ? 'All Fees' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Students ({filtered.length})</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary btn-small" onClick={exportStudents}><Download size={14} /> Export</button>
                        <button className="btn-primary btn-small" onClick={openAdd}><Plus size={14} /> Add Student</button>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th><th>Name</th><th>Standard</th><th>Roll No</th>
                                    <th>Attendance</th><th>Fee Status</th><th>Parent</th><th>Contact</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, 50).map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.id}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.standard}</td>
                                        <td>{s.rollNo}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress-bar" style={{ width: 60, height: 6 }}>
                                                    <div className={`progress-fill ${(s.attendancePercent || 75) >= 80 ? 'green' : (s.attendancePercent || 75) >= 60 ? 'gold' : 'red'}`}
                                                        style={{ width: `${s.attendancePercent || 75}%` }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.attendancePercent || 75}%</span>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${s.feeStatus || 'pending'}`}>{s.feeStatus || 'pending'}</span></td>
                                        <td style={{ fontSize: '0.85rem' }}>{s.parentName}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.parentPhone}</td>
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
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <p style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No students found.</p>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Student' : 'Add New Student'}</h3>
                            <button className="icon-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Student Name *</label>
                                    <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" />
                                </div>
                                <div className="form-group">
                                    <label>Standard *</label>
                                    <select required value={form.standard} onChange={e => setForm(p => ({ ...p, standard: e.target.value }))}>
                                        {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Roll Number</label>
                                    <input type="number" value={form.rollNo} onChange={e => setForm(p => ({ ...p, rollNo: e.target.value }))} placeholder="Class roll no." />
                                </div>
                                <div className="form-group">
                                    <label>Gender</label>
                                    <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                                        <option>Male</option><option>Female</option><option>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Parent/Guardian Name *</label>
                                    <input required value={form.parentName} onChange={e => setForm(p => ({ ...p, parentName: e.target.value }))} placeholder="Mr. / Mrs. Name" />
                                </div>
                                <div className="form-group">
                                    <label>Phone *</label>
                                    <input required value={form.parentPhone} onChange={e => setForm(p => ({ ...p, parentPhone: e.target.value }))} placeholder="+919..." />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="parent@email.com" />
                                </div>
                                <div className="form-group">
                                    <label>Date of Birth</label>
                                    <input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Enrollment Date</label>
                                    <input type="date" value={form.enrollmentDate} onChange={e => setForm(p => ({ ...p, enrollmentDate: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label>Total Fees (₹)</label>
                                    <input type="number" value={form.totalFees} onChange={e => setForm(p => ({ ...p, totalFees: Number(e.target.value) }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Address</label>
                                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" rows={2} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? <><Loader2 size={14} className="spin" /> Saving...</> : (editingId ? 'Update Student' : 'Add Student')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
