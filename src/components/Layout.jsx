import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard, Users, CalendarCheck, BookOpen, IndianRupee, Bell, BarChart3,
    GraduationCap, Settings, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [offline, setOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const goOffline = () => setOffline(true);
        const goOnline = () => setOffline(false);
        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);
        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        const fetchNotifCount = async () => {
            try {
                const { count } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .contains('target_roles', [user.role]);
                setNotifCount(count || 0);
            } catch (_) {}
        };
        fetchNotifCount();
    }, [user]);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'superadmin', 'student', 'parent'] },
        { path: '/students', label: 'Students', icon: Users, roles: ['admin', 'superadmin'] },
        { path: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'superadmin'] },
        { path: '/test-results', label: 'Tests & Results', icon: GraduationCap, roles: ['admin', 'superadmin'] },
        { path: '/billing', label: 'Billing & Fees', icon: IndianRupee, roles: ['parent', 'admin', 'superadmin'] },
        { path: '/resources', label: 'Resources', icon: BookOpen, roles: ['student', 'admin', 'superadmin'] },
        { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'superadmin', 'student', 'parent'] },
        { path: '/notifications', label: 'Notifications', icon: Bell, dynamicBadge: true, roles: ['admin', 'superadmin', 'student', 'parent'] },
        { path: '/user-management', label: 'Users', icon: Settings, roles: ['superadmin'] },
    ];

    const visibleItems = navItems.filter(item => item.roles.includes(user?.role));
    const isActive = (path) => location.pathname === path;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile overlay */}
            {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside style={{
                width: 240,
                background: 'var(--navy)',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                zIndex: 50,
                transform: sidebarOpen ? 'translateX(0)' : undefined,
                transition: 'transform 0.3s',
                flexShrink: 0,
            }}>
                {/* Logo */}
                <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #B6922E, #D4AF37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: 'var(--navy)' }}>DT</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>Dipesh Tutorials</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'capitalize' }}>{user?.role}</div>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}><X size={18} /></button>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
                    {visibleItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: 'none',
                                background: isActive(item.path) ? 'rgba(182,146,46,0.2)' : 'transparent',
                                color: isActive(item.path) ? 'var(--gold)' : 'rgba(255,255,255,0.75)',
                                cursor: 'pointer',
                                marginBottom: 2,
                                fontSize: '0.875rem',
                                fontWeight: isActive(item.path) ? 600 : 400,
                                textAlign: 'left',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!isActive(item.path)) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                            onMouseLeave={e => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <item.icon size={18} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.dynamicBadge && notifCount > 0 && (
                                <span style={{ background: '#EF4444', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>{notifCount}</span>
                            )}
                            {isActive(item.path) && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                        </button>
                    ))}
                </nav>

                {/* User info & logout */}
                <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.name}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{user?.email}</div>
                    </div>
                    <button
                        onClick={logout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#FCA5A5', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column' }}>
                {/* Mobile header */}
                <div style={{ display: 'none', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', alignItems: 'center', gap: 12 }} className="mobile-header">
                    <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex' }}><Menu size={22} /></button>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--navy)' }}>Dipesh Tutorials</span>
                </div>

                {/* Page content */}
                <main style={{ flex: 1, padding: 24, background: 'var(--bg)' }}>
                    {offline && (
                        <div style={{ background: '#EF4444', color: 'white', padding: '8px 16px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, borderRadius: 8, marginBottom: 16 }}>
                            You appear to be offline. Data may not load until connection is restored.
                        </div>
                    )}
                    {children}
                </main>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    aside { transform: translateX(-100%); }
                    aside.mobile-open { transform: translateX(0); }
                    .mobile-header { display: flex !important; }
                    main { margin-left: 0 !important; padding: 16px !important; }
                }
            `}</style>
        </div>
    );
}
