import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getNotifications, createNotification, markNotificationRead } from '../lib/api';
import { Bell, Send, CheckCircle } from 'lucide-react';
import { showToast } from '../utils';

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [sending, setSending] = useState(false);
    const [form, setForm] = useState({ title: '', message: '', type: 'general', target_roles: ['student', 'parent'] });

    const load = async () => {
        setLoading(true);
        try {
            const data = await getNotifications(user.role, 50);
            setNotifications(data || []);
        } catch (err) {
            showToast('Failed to load: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await createNotification({ ...form, sent_by: user.id });
            showToast('Notification sent!');
            setShowForm(false);
            setForm({ title: '', message: '', type: 'general', target_roles: ['student', 'parent'] });
            load();
        } catch (err) {
            showToast(err.message || 'Failed to send', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleRead = async (id) => {
        try {
            await markNotificationRead(id, user.id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (_) {}
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><Bell size={24} /></div>
                    <div className="stat-info"><h4>Total</h4><div className="stat-value">{notifications.length}</div></div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><Bell size={24} /></div>
                    <div className="stat-info"><h4>Unread</h4><div className="stat-value">{notifications.filter(n => !n.read).length}</div></div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Notifications</h3>
                    {isAdmin && (
                        <button className="btn-primary btn-small" onClick={() => setShowForm(!showForm)}>
                            <Send size={14} /> Send Notification
                        </button>
                    )}
                </div>

                {showForm && isAdmin && (
                    <div className="card-body" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 16 }}>
                        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="form-row">
                                <div className="form-group"><label>Title *</label><input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Notification title" /></div>
                                <div className="form-group"><label>Type</label>
                                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                                        <option value="general">General</option><option value="fee">Fee</option><option value="attendance">Attendance</option><option value="resource">Resource</option><option value="exam">Exam</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group"><label>Message *</label><textarea required rows={3} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Write your message..." /></div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" className="btn-primary btn-small" disabled={sending}>{sending ? 'Sending...' : 'Send'}</button>
                                <button type="button" className="btn-secondary btn-small" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? <div style={{ textAlign: 'center', padding: 48 }}><div className="loading-spinner" /></div> :
                        notifications.length === 0 ? <p style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No notifications yet.</p> :
                            notifications.map(n => (
                                <div key={n.id} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, background: n.read ? 'transparent' : 'rgba(182,146,46,0.04)' }} onClick={() => handleRead(n.id)}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span className={`badge ${n.type || 'general'}`}>{n.type || 'general'}</span>
                                            {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />}
                                        </div>
                                        <strong style={{ fontSize: '0.95rem' }}>{n.title}</strong>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{n.message}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>{n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                                    </div>
                                </div>
                            ))
                    }
                </div>
            </div>
        </>
    );
}
