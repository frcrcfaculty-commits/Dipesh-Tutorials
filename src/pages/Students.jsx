import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useData } from '../App';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../lib/api';
import { Search, Users, Download, Plus, X, Edit2, Trash2, Save, UserPlus, FileText } from 'lucide-react';
import { exportCSV, showToast } from '../utils';
import { generateStudentReportPDF } from '../reports';

const GENDERS = ['Male', 'Female', 'Other'];

function StudentForm({ student, standards, onSave, onCancel, saving }) {
    const [form, setForm] = useState(student || {
        name: '', roll_no: '', gender: 'Male', standard_id: standards[0]?.id || '',
        date_of_birth: '', address: '', parent_name: '', parent_phone: '', parent_email: '',
    });

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <div className="modal-header">
                    <h3>{student ? 'Edit Student' : 'Add New Student'}</h3>
                    <button onClick={onCancel} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                                placeholder="Student full name" required
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        </div>
                        <div className="form-group">
                            <label>Roll No *</label>
                            <input type="number" value={form.roll_no} onChange={e => set('roll_no', parseInt(e.target.value) || '')}
                                placeholder="Roll number" required
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        </div>
                        <div className="form-group">
                            <label>Standard *</label>
                            <div className="select-wrapper">
                                <select value={form.standard_id} onChange={e => set('standard_id', parseInt(e.target.value))}>
                                    {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Gender</label>
                            <div className="select-wrapper">
                                <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input type="date" value={form.date_of_birth || ''} onChange={e => set('date_of_birth', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <input type="text" value={form.address || ''} onChange={e => set('address', e.target.value)}
                                placeholder="Home address"
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        </div>
                    </div>

                    <h4 style={{ margin: '20px 0 12px', color: 'var(--navy)', fontSize: '0.95rem' }}>Parent / Guardian Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>Parent Name</label>
                            <input type="text" value={form.parent_name || ''} onChange={e => set('parent_name', e.target.value)}
                                placeholder="Parent full name"
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        </div>
                        <div className="form-group">
                            <label>Parent Phone</label>
                            <input type="tel" value={form.parent_phone || ''} onChange={e => set('parent_phone', e.target.value)}
                                placeholder="+91 XXXXXXXXXX"
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Parent Email</label>
                            <input type="email" value={form.parent_email || ''} onChange={e => set('parent_email', e.target.value)}
                                placeholder="parent@email.com"
                                style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                        <button className="btn-primary" style={{ flex: 1 }} disabled={saving || !form.name || !form.roll_no}
                            onClick={() => onSave(form)}>
                            <Save size={16} /> {saving ? 'Saving...' : (student ? 'Update Student' : 'Add Student')}
                        </button>
                        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Students() {
    const { user } = useAuth();
    const { standards } = useData();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [standardFilter, setStandardFilter] = useState('All');
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => { loadStudents(); }, []);

    async function loadStudents() {
        setLoading(true);
        try {
            const data = await getStudents();
            setStudents(data);
        } catch (err) {
            showToast(err.message, 'error');
        }
        setLoading(false);
    }

    const filtered = useMemo(() => {
        return students.filter(s => {
            if (standardFilter !== 'All' && s.standard_id !== parseInt(standardFilter)) return false;
            if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
                !String(s.roll_no).includes(search)) return false;
            return true;
        });
    }, [students, search, standardFilter]);

    const handleSave = async (form) => {
        setSaving(true);
        try {
            if (editingStudent) {
                const updated = await updateStudent(editingStudent.id, form);
                setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
                showToast('Student updated successfully');
            } else {
                const added = await addStudent(form);
                setStudents(prev => [...prev, added]);
                showToast('Student added successfully');
            }
            setShowForm(false);
            setEditingStudent(null);
        } catch (err) {
            showToast(err.message, 'error');
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        try {
            await deleteStudent(id);
            setStudents(prev => prev.filter(s => s.id !== id));
            setConfirmDelete(null);
            showToast('Student removed');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const stdCounts = useMemo(() => {
        const counts = {};
        standards.forEach(s => { counts[s.id] = students.filter(st => st.standard_id === s.id).length; });
        return counts;
    }, [students, standards]);

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
                {standards.slice(0, 3).map(std => (
                    <div key={std.id} className="stat-card gold">
                        <div className="stat-icon gold"><Users size={24} /></div>
                        <div className="stat-info">
                            <h4>{std.name} Standard</h4>
                            <div className="stat-value">{stdCounts[std.id] || 0}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="search-bar">
                <div className="search-input">
                    <Search />
                    <input placeholder="Search by name or roll no..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="select-wrapper">
                    <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}>
                        <option value="All">All Standards</option>
                        {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <button className="btn-gold btn-small" onClick={() => { setEditingStudent(null); setShowForm(true); }}>
                    <UserPlus size={16} /> Add Student
                </button>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Students ({filtered.length})</h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary btn-small" onClick={() => {
                            exportCSV('students',
                                ['Name', 'Roll No', 'Standard', 'Gender', 'Parent', 'Phone'],
                                filtered.map(s => [s.name, s.roll_no, s.standards?.name || '', s.gender, s.parent_name, s.parent_phone]));
                            showToast('CSV exported!');
                        }}><Download size={14} /> CSV</button>
                        <button className="btn-gold btn-small" onClick={() => {
                            generateStudentReportPDF(filtered.map(s => ({
                                name: s.name, standard: s.standards?.name || '', rollNo: s.roll_no,
                                parentPhone: s.parent_phone, feeStatus: 'N/A', attendancePercent: '—'
                            })), { standard: standardFilter !== 'All' ? standards.find(st => st.id === parseInt(standardFilter))?.name : 'All' });
                            showToast('PDF report generated!');
                        }}><FileText size={14} /> PDF</button>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="empty-state"><div className="spinner" /><p>Loading students...</p></div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Roll No</th>
                                        <th>Standard</th>
                                        <th>Gender</th>
                                        <th>Parent</th>
                                        <th>Contact</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.slice(0, 100).map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                                            <td>{s.roll_no}</td>
                                            <td>{s.standards?.name || ''}</td>
                                            <td>{s.gender}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{s.parent_name || '—'}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.parent_phone || '—'}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <button className="btn-secondary btn-small" style={{ padding: '4px 8px' }}
                                                        onClick={() => { setEditingStudent(s); setShowForm(true); }}>
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button className="btn-secondary btn-small" style={{ padding: '4px 8px', color: 'var(--danger)' }}
                                                        onClick={() => setConfirmDelete(s)}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="empty-state">
                            <Users /><h3>No students found</h3><p>Add your first student or adjust filters.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <StudentForm
                    student={editingStudent}
                    standards={standards}
                    saving={saving}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingStudent(null); }}
                />
            )}

            {/* Delete Confirmation */}
            {confirmDelete && (
                <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Confirm Remove</h3></div>
                        <div className="modal-body">
                            <p>Are you sure you want to remove <strong>{confirmDelete.name}</strong> from the system?</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                This will deactivate the student record. It can be restored later.
                            </p>
                            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                                <button className="btn-primary" style={{ flex: 1, background: 'var(--danger)' }}
                                    onClick={() => handleDelete(confirmDelete.id)}>
                                    <Trash2 size={14} /> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
