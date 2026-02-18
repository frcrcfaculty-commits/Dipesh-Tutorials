import React, { useState } from 'react';
import { useAuth } from '../App';
import { NOTIFICATIONS } from '../data';
import { Bell, CalendarCheck, IndianRupee, BookOpen, Megaphone, FileText, Send, X, Plus } from 'lucide-react';

const TYPE_ICONS = { fee: IndianRupee, attendance: CalendarCheck, resource: BookOpen, exam: FileText, general: Megaphone, report: FileText };
const TYPE_COLORS = { fee: 'gold', attendance: 'green', resource: 'blue', exam: 'navy', general: 'navy', report: 'gold' };

export default function Notifications() {
    const { user } = useAuth();
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const [showCompose, setShowCompose] = useState(false);
    const [readState, setReadState] = useState({});

    const myNotifications = NOTIFICATIONS.filter(n => n.for.includes(user.role));

    const toggleRead = (id) => {
        setReadState(prev => ({ ...prev, [id]: !prev[id] }));
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
                    <button className="btn-gold btn-small" onClick={() => setShowCompose(true)}>
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
                <div className="modal-overlay" onClick={() => setShowCompose(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Send Notification</h2>
                            <button onClick={() => setShowCompose(false)} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Title</label>
                                <div className="input-wrapper">
                                    <Bell />
                                    <input placeholder="Notification title..." />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea className="form-textarea" placeholder="Write your notification message..." />
                            </div>
                            <div className="form-group">
                                <label>Send To</label>
                                <div className="filter-chips">
                                    <button className="filter-chip active">All Parents</button>
                                    <button className="filter-chip">All Students</button>
                                    <button className="filter-chip">Specific Standard</button>
                                    <button className="filter-chip">All Staff</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <div className="select-wrapper">
                                    <select>
                                        <option>General Announcement</option>
                                        <option>Fee Reminder</option>
                                        <option>Attendance Alert</option>
                                        <option>Resource Update</option>
                                        <option>Exam Notification</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowCompose(false)}>Cancel</button>
                            <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>
                                <Send size={16} /> Send Notification
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
