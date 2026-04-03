import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getNotifications, addParentReply, getParentReplies } from '../lib/api';
import { Bell, MessageSquare, Loader2, Send, ChevronDown } from 'lucide-react';
import { showToast } from '../utils';

export default function ParentMessaging() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [replies, setReplies] = useState({});
    const [replyText, setReplyText] = useState({});
    const [sending, setSending] = useState({});
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const n = await getNotifications(isAdmin ? 'admin' : user.role, 50);
            setNotifications(n || []);
        } catch { showToast('Failed to load', 'error'); }
        setLoading(false);
    }

    async function toggleExpand(notifId) {
        if (expandedId === notifId) { setExpandedId(null); return; }
        setExpandedId(notifId);
        if (!replies[notifId]) {
            try {
                const r = await getParentReplies(notifId);
                setReplies(prev => ({ ...prev, [notifId]: r || [] }));
            } catch { setReplies(prev => ({ ...prev, [notifId]: [] })); }
        }
    }

    async function handleReply(e, notifId) {
        e.preventDefault();
        const text = replyText[notifId]?.trim();
        if (!text) return;
        setSending(prev => ({ ...prev, [notifId]: true }));
        try {
            const r = await addParentReply(notifId, user.id, text);
            setReplies(prev => ({ ...prev, [notifId]: [...(prev[notifId] || []), r] }));
            setReplyText(prev => ({ ...prev, [notifId]: '' }));
            showToast('Reply sent!');
        } catch { showToast('Failed to send reply', 'error'); }
        setSending(prev => ({ ...prev, [notifId]: false }));
    }

    return (
        <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Notifications</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>{isAdmin ? 'Parent replies appear here' : 'Reply to any notification to start a conversation'}</p>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: 48 }}><Loader2 size={32} className="spin" /></div> : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔔</div>
                    <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>No notifications yet</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {notifications.map(n => {
                        const isOpen = expandedId === n.id;
                        const notifReplies = replies[n.id] || [];
                        return (
                            <div key={n.id} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', border: isOpen ? '2px solid var(--navy)' : '1px solid var(--border)' }}>
                                <div onClick={() => toggleExpand(n.id)} style={{ padding: '16px 20px', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <span style={{ fontSize: '0.65rem', background: '#0A2351', color: 'white', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{n.type}</span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</span>
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy)', marginBottom: 4 }}>{n.title}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                                            {notifReplies.length > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0F9FF', padding: '2px 8px', borderRadius: 99 }}>
                                                    <MessageSquare size={12} style={{ color: '#0A2351' }}/>
                                                    <span style={{ fontSize: '0.72rem', color: '#0A2351', fontWeight: 600 }}>{notifReplies.length}</span>
                                                </div>
                                            )}
                                            <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
                                        </div>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div style={{ borderTop: '1px solid var(--border)', background: '#FAFAFA' }}>
                                        {/* Existing replies */}
                                        {notifReplies.length > 0 && (
                                            <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {notifReplies.map(r => (
                                                    <div key={r.id} style={{ display: 'flex', gap: 10, justifyContent: r.profile_id === user.id ? 'flex-end' : 'flex-start' }}>
                                                        <div style={{ maxWidth: '75%', background: r.profile_id === user.id ? '#0A2351' : 'white', color: r.profile_id === user.id ? 'white' : 'var(--text)', padding: '10px 14px', borderRadius: 16, fontSize: '0.85rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                                            <div style={{ fontSize: '0.72rem', opacity: 0.7, marginBottom: 2 }}>{r.profiles?.name || 'Parent'}</div>
                                                            {r.reply_text}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Reply form */}
                                        {!isAdmin && (
                                            <form onSubmit={(e) => handleReply(e, n.id)} style={{ padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <input value={replyText[n.id] || ''} onChange={e => setReplyText(prev => ({ ...prev, [n.id]: e.target.value }))}
                                                    placeholder="Reply or ask a question..."
                                                    style={{ flex: 1, padding: '10px 14px', borderRadius: 99, border: '1px solid var(--border)', fontSize: '0.88rem', background: 'white', outline: 'none' }}/>
                                                <button type="submit" disabled={sending[n.id]} style={{ background: '#0A2351', color: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sending[n.id] ? 'default' : 'pointer' }}>
                                                    {sending[n.id] ? <Loader2 size={14} className="spin"/> : <Send size={14}/>}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
