import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { getStandards } from '../lib/api';
import { getProfiles, getStudents, updateStudent } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Users, UserPlus, Shield, Search, X, Save, Key, Mail, CheckCircle, AlertCircle, Link2 } from 'lucide-react';
import { showToast } from '../utils';

const ROLE_LABELS = { superadmin: 'Super Admin', admin: 'Admin Staff', student: 'Student', parent: 'Parent' };
const ROLE_COLORS = { superadmin: 'navy', admin: 'gold', student: 'green', parent: 'blue' };

export default function UserManagement() {
    const { user } = useAuth();
    const [standards, setStandards] = useState([]);
    useEffect(() => { getStandards().then(s => setStandards(s || [])).catch(() => {}); }, []);
    const [profiles, setProfiles] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [showCreate, setShowCreate] = useState(false);
    const [showLink, setShowLink] = useState(null);
    const [showResetPw, setShowResetPw] = useState(null);

    // Create form
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('student');
    const [creating, setCreating] = useState(false);

    // Link form
    const [linkStudentId, setLinkStudentId] = useState('');
    const [linking, setLinking] = useState(false);

    // Reset password
    const [newPw, setNewPw] = useState('');
    const [resetting, setResetting] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [p, s] = await Promise.all([getProfiles(), getStudents()]);
            setProfiles(p || []);
            setStudents(s || []);
        } catch (err) { showToast(err.message, 'error'); }
        setLoading(false);
    }

    const filtered = useMemo(() => {
        return profiles.filter(p => {
            if (roleFilter !== 'All' && p.role !== roleFilter) return false;
            if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
                !p.email.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [profiles, search, roleFilter]);

    const handleCreateUser = async () => {
        if (!newEmail || !newName || !newPassword) {
            showToast('Fill all fields', 'error'); return;
        }
        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error'); return;
        }
        setCreating(true);
        try {
            // Note: Supabase must have "Enable email confirmations" turned OFF
            // in Authentication > Providers > Email for this to work without email verification.
            // Go to: Supabase Dashboard > Authentication > Providers > Email > disable "Confirm email"
            const { data, error } = await supabase.auth.signUp({
                email: newEmail,
                password: newPassword,
                options: {
                    data: { name: newName, role: newRole },
                    emailRedirectTo: undefined, // no redirect needed when confirmation is off
                }
            });
            if (error) throw error;

            // If email confirmation is ON, data.user exists but data.session is null
            // Warn the admin in that case
            if (data.user && !data.session) {
                showToast(`Account created but email confirmation may be required. Disable "Confirm email" in Supabase Auth settings for instant access.`, 'info');
            }

            // The trigger handle_new_user creates the profile automatically.
            // Update the role since signUp metadata might not propagate via trigger
            if (data.user) {
                // Small delay to let the trigger fire first
                await new Promise(r => setTimeout(r, 500));
                await supabase.from('profiles')
                    .update({ role: newRole, name: newName })
                    .eq('id', data.user.id);
            }

            showToast(`Account created for ${newName} (${newRole})`);
            setShowCreate(false);
            setNewEmail(''); setNewName(''); setNewPassword('');
            loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
        setCreating(false);
    };

    const handleLinkStudent = async () => {
        if (!linkStudentId || !showLink) return;
        setLinking(true);
        try {
            const field = showLink.role === 'parent' ? 'parent_profile_id' : 'profile_id';
            await updateStudent(linkStudentId, { [field]: showLink.id });
            showToast(`Linked ${showLink.name} to student record`);
            setShowLink(null);
            setLinkStudentId('');
            loadData();
        } catch (err) { showToast(err.message, 'error'); }
        setLinking(false);
    };

    const handleResetPassword = async () => {
        if (!newPw || newPw.length < 6) {
            showToast('Password must be at least 6 characters', 'error'); return;
        }
        setResetting(true);
        try {
            // Admin password reset via Supabase admin API
            // Note: This requires the service_role key which we don't have client-side
            // Instead, send a password reset email
            const { error } = await supabase.auth.resetPasswordForEmail(showResetPw.email, {
                redirectTo: window.location.origin,
            });
            if (error) throw error;
            showToast(`Password reset email sent to ${showResetPw.email}`);
            setShowResetPw(null);
            setNewPw('');
        } catch (err) { showToast(err.message, 'error'); }
        setResetting(false);
    };

    const handleDeactivate = async (profile) => {
        try {
            await supabase.from('profiles').update({ is_active: false }).eq('id', profile.id);
            showToast(`${profile.name} deactivated`);
            loadData();
        } catch (err) { showToast(err.message, 'error'); }
    };

    // Which students are linked / unlinked
    const linkedStudentIds = new Set(students.filter(s => s.profile_id || s.parent_profile_id).map(s => s.id));
    const unlinkableStudents = students.filter(s => {
        if (!showLink) return false;
        if (showLink.role === 'parent') return !s.parent_profile_id;
        if (showLink.role === 'student') return !s.profile_id;
        return false;
    });

    const roleCounts = useMemo(() => {
        const c = { superadmin: 0, admin: 0, student: 0, parent: 0 };
        profiles.forEach(p => { if (c[p.role] !== undefined) c[p.role]++; });
        return c;
    }, [profiles]);

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><Users size={24} /></div><div className="stat-info"><h4>Total Users</h4><div className="stat-value">{profiles.length}</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><Shield size={24} /></div><div className="stat-info"><h4>Admins</h4><div className="stat-value">{roleCounts.admin + roleCounts.superadmin}</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><Users size={24} /></div><div className="stat-info"><h4>Students</h4><div className="stat-value">{roleCounts.student}</div></div></div>
                <div className="stat-card blue"><div className="stat-icon blue"><Users size={24} /></div><div className="stat-info"><h4>Parents</h4><div className="stat-value">{roleCounts.parent}</div></div></div>
            </div>

            <div className="search-bar">
                <div className="search-input"><Search /><input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <div className="filter-chips">
                    {['All', 'superadmin', 'admin', 'student', 'parent'].map(r => (
                        <button key={r} className={`filter-chip ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>
                            {r === 'All' ? 'All Roles' : ROLE_LABELS[r]}
                        </button>
                    ))}
                </div>
                <button className="btn-gold btn-small" onClick={() => setShowCreate(true)}>
                    <UserPlus size={16} /> Create User
                </button>
            </div>

            <div className="card">
                <div className="card-header"><h3>User Accounts ({filtered.length})</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? <div className="empty-state"><div className="spinner" /></div> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {filtered.map(p => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                                            <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.email}</td>
                                            <td><span className={`badge ${p.role === 'superadmin' || p.role === 'admin' ? 'present' : p.role === 'student' ? 'late' : 'pending'}`}>{ROLE_LABELS[p.role]}</span></td>
                                            <td><span className={`badge ${p.is_active ? 'present' : 'absent'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {(p.role === 'student' || p.role === 'parent') && (
                                                        <button className="btn-secondary btn-small" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                            onClick={() => { setShowLink(p); setLinkStudentId(''); }}>
                                                            <Link2 size={12} /> Link
                                                        </button>
                                                    )}
                                                    <button className="btn-secondary btn-small" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                                        onClick={() => { setShowResetPw(p); setNewPw(''); }}>
                                                        <Key size={12} /> Reset
                                                    </button>
                                                    {p.id !== user.id && p.role !== 'superadmin' && p.is_active && (
                                                        <button className="btn-secondary btn-small" style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--danger)' }}
                                                            onClick={() => handleDeactivate(p)}>
                                                            Deactivate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create User Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => !creating && setShowCreate(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal-header"><h3>Create User Account</h3><button onClick={() => setShowCreate(false)} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name"
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@email.com"
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div className="form-group">
                                <label>Password * (min 6 characters)</label>
                                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Temporary password"
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div className="form-group">
                                <label>Role *</label>
                                <div className="select-wrapper">
                                    <select value={newRole} onChange={e => setNewRole(e.target.value)}>
                                        <option value="student">Student</option>
                                        <option value="parent">Parent</option>
                                        <option value="admin">Admin Staff</option>
                                        {user.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                                    </select>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, padding: '8px 12px', background: 'rgba(10,35,81,0.04)', borderRadius: 'var(--radius-sm)' }}>
                                After creating, use "Link" to connect this account to a student record.
                            </p>
                            <button className="btn-primary" onClick={handleCreateUser} disabled={creating || !newEmail || !newName || !newPassword}>
                                <UserPlus size={16} /> {creating ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Link Student Modal */}
            {showLink && (
                <div className="modal-overlay" onClick={() => !linking && setShowLink(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                        <div className="modal-header"><h3>Link to Student</h3><button onClick={() => setShowLink(null)} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button></div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 16 }}>
                                Link <strong>{showLink.name}</strong> ({ROLE_LABELS[showLink.role]}) to a student record.
                                {showLink.role === 'parent' ? ' This will set them as the parent for the selected student.' : ' This will set them as the student account holder.'}
                            </p>
                            <div className="form-group">
                                <label>Select Student</label>
                                <div className="select-wrapper">
                                    <select value={linkStudentId} onChange={e => setLinkStudentId(e.target.value)}>
                                        <option value="">Choose student...</option>
                                        {unlinkableStudents.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} — {s.standards?.name || ''} (Roll {s.roll_no})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {unlinkableStudents.length === 0 && (
                                <p style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>
                                    <AlertCircle size={14} style={{ marginRight: 4 }} />
                                    All students already have a {showLink.role === 'parent' ? 'parent' : 'student account'} linked. Add new students first.
                                </p>
                            )}
                            <button className="btn-primary" onClick={handleLinkStudent} disabled={linking || !linkStudentId} style={{ marginTop: 12 }}>
                                <Link2 size={16} /> {linking ? 'Linking...' : 'Link Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPw && (
                <div className="modal-overlay" onClick={() => !resetting && setShowResetPw(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Reset Password</h3><button onClick={() => setShowResetPw(null)} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button></div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 16 }}>Send a password reset email to <strong>{showResetPw.email}</strong></p>
                            <button className="btn-primary" onClick={handleResetPassword} disabled={resetting}>
                                <Mail size={16} /> {resetting ? 'Sending...' : 'Send Reset Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
