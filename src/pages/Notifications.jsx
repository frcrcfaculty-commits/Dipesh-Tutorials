import React, { useState } from 'react';
import { useAuth } from '../App';
import { NOTIFICATIONS } from '../data';
import { Bell, CalendarCheck, IndianRupee, BookOpen, Megaphone, FileText, Send, X, Plus, CheckCircle } from 'lucide-react';

const TYPE_ICONS = { fee: IndianRupee, attendance: CalendarCheck, resource: BookOpen, exam: FileText, general: Megaphone, report: FileText };
const TYPE_COLORS = { fee: 'gold', attendance: 'green', resource: 'blue', exam: 'navy', general: 'navy', report: 'gold' };

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
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const [showCompose, setShowCompose] = useState(false);
    const [readState, setReadState] = useState({});
    const [localNotifications, setLocalNotifications] = useState([]);
    const [sentSuccess, setSentSuccess] = useState(false);

    // Compose form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [audience, setAudience] = useState(['All Parents']);
    const [type, setType] = useState('General Announcement');

    const allNotifications = [...localNotifications, ...NOTIFICATIONS];
    const myNotifications = allNotifications.filter(n => n.for.includes(user.role));

    const toggleRead = (id) => {
        setReadState(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleAudience = (option) => {
        setAudience(prev =>
            prev.includes(option) ? prev.filter(a => a !== option) : [...prev, option]
        );
    };

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setAudience(['All Parents']);
        setType('General Announcement');
        setSentSuccess(false);
    };

    const handleSend = () => {
        if (!title.trim() || !message.trim()) return;
        if (audience.length === 0) return;

        // Build the target roles from selected audience
        const targetRoles = new Set();
        audience.forEach(a => {
            (AUDIENCE_ROLE_MAP[a] || []).forEach(r => targetRoles.add(r));
        });
        // Admin/superadmin always see their own notifications
        targetRoles.add('admin');
        targetRoles.add('superadmin');

        const newNotification = {
            id: Date.now(),
            title: title.trim(),
            message: message.trim(),
            type: TYPE_MAP[type] || 'general',
            for: Array.from(targetRoles),
            time: 'Just now',
            read: false,
        };

        setLocalNotifications(prev => [newNotification, ...prev]);
        setSentSuccess(true);

        // Auto-close after 1.5s
        setTimeout(() => {
            setShowCompose(false);
            resetForm();
        }, 1500);
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {myNotifications.filter(n => !(readState[n.id] ?? n.read)).length} unread notifications
                    </p>
                </div>
                {isAdmin && (
                    <button className="btn-gold btn-small" onClick={() => { resetForm(); setShowCompose(true); }}>
                        <Plus size={14} /> Send Notification
                    </button>
                )}
            </div>

            <div className="notification-list">
                {myNotifications.map(n => {
                    const Icon = TYPE_ICONS[n.type] || Bell;
                    const colorClass = TYPE_COLORS[n.type] || 'navy';
                    const isRead = readState[n.id] ?? n.read;

                    return (
                        <div
                            key={n.id}
                            className={`notification-item ${isRead ? '' : 'unread'}`}
                            onClick={() => toggleRead(n.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={`notif-icon stat-icon ${colorClass}`}>
                                <Icon size={18} />
                            </div>
                            <div className="notif-content">
                                <h4>{n.title}</h4>
                                <p>{n.message}</p>
                            </div>
                            <span className="notif-time">{n.time}</span>
                        </div>
                    );
                })}
            </div>

            {myNotifications.length === 0 && (
                <div className="empty-state">
                    <Bell /><h3>No notifications</h3><p>You're all caught up!</p>
                </div>
            )}

            {/* Compose Notification Modal */}
            {showCompose && (
                <div className="modal-overlay" onClick={() => { setShowCompose(false); resetForm(); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Send Notification</h2>
                            <button onClick={() => { setShowCompose(false); resetForm(); }} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>

                        {sentSuccess ? (
                            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                                <CheckCircle size={48} color="var(--success)" style={{ marginBottom: 12 }} />
                                <h3 style={{ color: 'var(--navy)', marginBottom: 4 }}>Notification Sent!</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Sent to {audience.join(', ')}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Title</label>
                                        <div className="input-wrapper">
                                            <Bell />
                                            <input
                                                placeholder="Notification title..."
                                                value={title}
                                                onChange={e => setTitle(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Message</label>
                                        <textarea
                                            className="form-textarea"
                                            placeholder="Write your notification message..."
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Send To</label>
                                        <div className="filter-chips">
                                            {AUDIENCE_OPTIONS.map(option => (
                                                <button
                                                    key={option}
                                                    className={`filter-chip ${audience.includes(option) ? 'active' : ''}`}
                                                    onClick={() => toggleAudience(option)}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                        {audience.length === 0 && (
                                            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4 }}>
                                                Select at least one audience
                                            </p>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Type</label>
                                        <div className="select-wrapper">
                                            <select value={type} onChange={e => setType(e.target.value)}>
                                                {Object.keys(TYPE_MAP).map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button className="btn-secondary" onClick={() => { setShowCompose(false); resetForm(); }}>Cancel</button>
                                    <button
                                        className="btn-primary"
                                        style={{
                                            width: 'auto',
                                            marginTop: 0,
                                            opacity: (!title.trim() || !message.trim() || audience.length === 0) ? 0.5 : 1,
                                            cursor: (!title.trim() || !message.trim() || audience.length === 0) ? 'not-allowed' : 'pointer',
                                        }}
                                        onClick={handleSend}
                                        disabled={!title.trim() || !message.trim() || audience.length === 0}
                                    >
                                        <Send size={16} /> Send Notification
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
