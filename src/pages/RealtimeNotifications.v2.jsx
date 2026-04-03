import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import { Bell, Check, CheckCircle, Clock, MessageSquare, AlertTriangle, Info, Radio } from 'lucide-react';
import { showToast } from '../utils';

const TYPE_CONFIG = {
  general: { icon: Bell, color: '#21a7d0', bg: 'rgba(33,167,208,0.1)' },
  fee: { icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  attendance: { icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  academic: { icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  exam: { icon: MessageSquare, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  resource: { icon: Info, color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
};

function NotifCard({ notif, onMarkRead }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general;
  const Icon = cfg.icon;
  const timeAgo = notif.created_at ? new Date(notif.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
  return (
    <div style={{
      background: notif.is_read ? 'white' : 'rgba(33,167,208,0.04)',
      border: '1px solid var(--border)',
      borderLeft: notif.is_read ? '1px solid var(--border)' : '3px solid ' + cfg.color,
      borderRadius: 12,
      padding: '14px 16px',
      marginBottom: 10,
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      transition: 'all 0.2s'
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
        <Icon size={18} color={cfg.color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h4 style={{ margin: 0, fontSize: '0.9rem', color: notif.is_read ? 'var(--text-muted)' : 'var(--text)', fontWeight: notif.is_read ? 400 : 600 }}>{notif.title}</h4>
          {!notif.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 6 }} />}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{notif.message}</p>
        <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: 'var(--text-light)' }}>{timeAgo}</p>
      </div>
      {!notif.is_read && (
        <button onClick={() => onMarkRead(notif.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', flexShrink: 0 }}>
          <Check size={12} /> Read
        </button>
      )}
    </div>
  );
}

export default function RealtimeNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [live] = useState(true);
  const channelRef = useRef(null);

  async function loadNotifications() {
    const { getNotifications, getReadNotificationIds } = await import('../lib/api');
    const [notifs, readIds] = await Promise.all([
      getNotifications(user?.role, 50),
      getReadNotificationIds(user?.id)
    ]);
    setNotifications((notifs||[]).map(n => ({ ...n, is_read: readIds.includes(n.id) })));
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
    if (!user) return;
    const channel = supabase.channel('notif-realtime').on(
      'postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' },
      (payload) => {
        const newNotif = { ...payload.new, is_read: false };
        setNotifications(prev => [newNotif, ...prev]);
        showToast(payload.new.title, 'info');
      }
    ).subscribe();
    channelRef.current = channel;
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [user?.role, user?.id]);

  async function markRead(id) {
    const { markNotificationRead } = await import('../lib/api');
    await markNotificationRead(id, user?.id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    const { markNotificationRead } = await import('../lib/api');
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => markNotificationRead(n.id, user?.id)));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    showToast('All marked as read');
  }

  const filters = ['all', 'general', 'fee', 'attendance', 'academic', 'exam'];
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Bell size={26} color="var(--navy)" />
            {unread > 0 && <div style={{ position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)', border: '2px solid white' }} />}
          </div>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Notifications</h2>
            {unread > 0 && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>{unread} unread</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {live && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s infinite' }} /> LIVE</span>}
          {unread > 0 && <button onClick={markAllRead} className="btn-secondary btn-small">Mark all read</button>}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
            border: '1px solid var(--border)', background: filter === f ? 'var(--navy)' : 'white',
            color: filter === f ? 'white' : 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'capitalize'
          }}>{f}</button>
        ))}
      </div>
      {loading && <div style={{ textAlign: 'center', padding: 48 }}><div className="loading-spinner" /></div>}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No notifications yet.</p>
        </div>
      )}
      {!loading && filtered.map(n => <NotifCard key={n.id} notif={n} onMarkRead={markRead} />)}
      
    </div>
  );
}
