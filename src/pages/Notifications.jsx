import React, { useState, useEffect } from 'react';
import { useAuth, useData } from '../App';
import { getNotifications, createNotification, markNotificationRead, getReadNotificationIds } from '../lib/api';
import { Bell, CalendarCheck, IndianRupee, BookOpen, Megaphone, FileText, Send, X, Plus, CheckCircle, Check } from 'lucide-react';
import { showToast } from '../utils';

const TYPE_ICONS = { fee: IndianRupee, attendance: CalendarCheck, resource: BookOpen, exam: FileText, general: Megaphone };
const TYPE_COLORS = { fee: 'gold', attendance: 'green', resource: 'blue', exam: 'navy', general: 'navy' };

const TYPE_MAP = {
    'General Announcement': 'general',
    'Fee Reminder': 'fee',
    'Attendance Alert': 'attendance',
    'Resource Update': 'resource',
    'Exam Notification': 'exam',
};

const AUDIENCE_OPTIONS = ['All Parents', 'All Students', 'Specific Standard', 'All Staff'];
const AUDIENCE_ROLE_MAP = {
    'All Parents': ['parent'],
    'All Students': ['student'],
    'Specific Standard': ['student', 'parent'],
    'All Staff': ['admin'],
};

export default function Notifications() {
    const { user } = useAuth();
    const { standards } = useData();
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    const [notifications, setNotifications] = useState([]);
    const [readIds, setReadIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [showCompose, setShowCompose] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    const [sending, setSending] = useState(false);

    // Compose form
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState('All Parents');
    const [type, setType] = useState('General Announcement');
    const [targetStandard, setTargetStandard] = useState('');

    useEffect(() => { loadNotifications(); }, []);

    async function loadNotifications() {
        setLoading(true);
        try {
            const [notifs, reads] = await Promise.all([
                getNotifications(user.role),
                getReadNotificationIds(user.id),
            ]);
            setNotifications(notifs || []);
            setReadIds(new Set(reads));
        } catch (err) {
            showToast(err.message, 'error');
        }
        setLoading(false);
    }

    async function handleMarkRead(notifId) {
        try {
            await markNotificationRead(notifId, user.id);
            setReadIds(prev => new Set([...prev, notifId]));
        } catch (err) { /* silent fail ok */ }
    }

    async function handleSend() {
        if (!title.trim() || !message.trim()) {
            showToast('Please fill in title and message', 'error');
            return;
        }
        setSending(true);
        try {
            const targetRoles = AUDIENCE_ROLE_MAP[audience] || ['student', 'parent'];
            await createNotification({
                title: title.trim(),
                message: message.trim(),
                type: TYPE_MAP[type] || 'general',
                target_roles: targetRoles,
                target_standard_id: audience === 'Specific Standard' && targetStandard ? parseInt(targetStandard) : null,
                sent_by: user.id,
            });
            setSentSuccess(true);
            setTimeout(() => {
                setSentSuccess(false);
                setShowCompose(false);
                setTitle('');
                setMessage('');
                loadNotifications();
            }, 1500);
        } catch (err) {
            showToast(err.message, 'error');
        }
        setSending(false);
    }

    const unread = notifications.filter(n => !readIds.has(n.id));
    const read = notifications.filter(n => readIds.has(n.id));

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><Bell size={24} /></div>
                    <div className="stat-info"><h4>Total</h4><div className="stat-value">{notifications.length}</div></div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><Megaphone size={24} /></div>
                    <div className="stat-info"><h4>Unread</h4><div className="stat-value">{unread.length}</div></div>
                </div>
            </div>

            {isAdmin && (
                <div style={{ marginBottom: 24 }}>
                    <button className="btn-gold" onClick={() => setShowCompose(true)}>
                        <Plus size={16} /> Compose Notification
                    </button>
                </div>
            )}

            {/* Notification List */}
            {loading ? (
                <div className="empty-state"><div className="spinner" /><p>Loading notifications...</p></div>
            ) : (
                <>
                    {unread.length > 0 && (
                        <div className="card" style={{ marginBottom: 24 }}>
                            <div className="card-header"><h3>Unread ({unread.length})</h3></div>
                            <div className="card-body">
                                {unread.map(n => {
                                    const Icon = TYPE_ICONS[n.type] || Megaphone;
                                    return (
                                        <div key={n.id} style={{
                                            padding: '14px 0', borderBottom: '1px solid var(--border)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                                        }}>
                                            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                                                <div className={`stat-icon ${TYPE_COLORS[n.type] || 'navy'}`} style={{ width: 36, height: 36, minWidth: 36, borderRadius: 8 }}>
                                                    <Icon size={16} />
                                                </div>
                                                <div>
                                                    <strong style={{ fontSize: '0.95rem' }}>{n.title}</strong>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                                                        {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        {n.profiles?.name && ` · by ${n.profiles.name}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="btn-secondary btn-small" style={{ padding: '4px 10px', minHeight: 32 }}
                                                onClick={() => handleMarkRead(n.id)}>
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header"><h3>{unread.length > 0 ? 'Read' : 'All Notifications'}</h3></div>
                        <div className="card-body">
                            {(unread.length > 0 ? read : notifications).length === 0 ? (
                                <div className="empty-state"><Bell /><h3>No notifications</h3></div>
                            ) : (
                                (unread.length > 0 ? read : notifications).map(n => {
                                    const Icon = TYPE_ICONS[n.type] || Megaphone;
                                    return (
                                        <div key={n.id} style={{
                                            padding: '12px 0', borderBottom: '1px solid var(--border)',
                                            display: 'flex', gap: 12, opacity: 0.7,
                                        }}>
                                            <div className={`stat-icon ${TYPE_COLORS[n.type] || 'navy'}`} style={{ width: 32, height: 32, minWidth: 32, borderRadius: 8 }}>
                                                <Icon size={14} />
                                            </div>
                                            <div>
                                                <strong style={{ fontSize: '0.9rem' }}>{n.title}</strong>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                                    {new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Compose Modal */}
            {showCompose && (
                <div className="modal-overlay" onClick={() => !sending && setShowCompose(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3>Compose Notification</h3>
                            <button onClick={() => setShowCompose(false)} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            {sentSuccess ? (
                                <div style={{ textAlign: 'center', padding: 32 }}>
                                    <CheckCircle size={48} color="var(--success)" />
                                    <h3 style={{ marginTop: 12, color: 'var(--success)' }}>Notification Sent!</h3>
                                </div>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Title *</label>
                                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                            placeholder="Notification title..."
                                            style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                                    </div>
                                    <div className="form-group">
                                        <label>Message *</label>
                                        <textarea value={message} onChange={e => setMessage(e.target.value)}
                                            placeholder="Write your notification message..."
                                            rows={4}
                                            style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)', fontFamily: 'inherit', resize: 'vertical' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div className="form-group">
                                            <label>Type</label>
                                            <div className="select-wrapper">
                                                <select value={type} onChange={e => setType(e.target.value)}>
                                                    {Object.keys(TYPE_MAP).map(t => <option key={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Audience</label>
                                            <div className="select-wrapper">
                                                <select value={audience} onChange={e => setAudience(e.target.value)}>
                                                    {AUDIENCE_OPTIONS.map(a => <option key={a}>{a}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    {audience === 'Specific Standard' && (
                                        <div className="form-group">
                                            <label>Select Standard</label>
                                            <div className="select-wrapper">
                                                <select value={targetStandard} onChange={e => setTargetStandard(e.target.value)}>
                                                    <option value="">All Standards</option>
                                                    {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    <button className="btn-primary" onClick={handleSend} disabled={sending} style={{ marginTop: 12 }}>
                                        <Send size={16} /> {sending ? 'Sending...' : 'Send Notification'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
