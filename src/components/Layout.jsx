import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import {
    LayoutDashboard, Users, CalendarCheck, BookOpen, IndianRupee, Bell, BarChart3,
    GraduationCap, Settings, LogOut, Menu, X, ChevronRight, Map
} from 'lucide-react';
import { showToast, withTimeout, playNotificationTone } from '../utils';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const [offline, setOffline] = useState(!navigator.onLine);
    const prevNotifRef = useRef(null);

    // Page title
    useEffect(() => {
        const titles = {
            '/': 'Dashboard',
            '/students': 'Students',
            '/attendance': 'Attendance',
            '/test-results': 'Test Results',
            '/billing': 'Billing & Fees',
            '/notifications': 'Notifications',
            '/resources': 'Resources',
            '/course-mapping': 'Course Mapping',
            '/analytics': 'Analytics',
            '/user-management': 'User Management',
        };
        document.title = `${titles[location.pathname] || 'Dashboard'} — Dipesh Tutorials`;
    }, [location.pathname]);

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
                const { count: totalCount, error: nErr } = await supabase
                    .from('notifications')
                    .select('*', { count: 'exact', head: true })
                    .contains('target_roles', [user.role]);

                const { count: readCount, error: rErr } = await supabase
                    .from('notification_reads')
                    .select('*', { count: 'exact', head: true })
                    .eq('profile_id', user.id);

                if (!nErr && !rErr) {
                    const newCount = Math.max(0, (totalCount || 0) - (readCount || 0));
                    
                    // Trigger sound if count went up and it's not the first load
                    if (prevNotifRef.current !== null && newCount > prevNotifRef.current) {
                        const soundEnabled = localStorage.getItem('dt_notif_sound') !== 'false';
                        if (soundEnabled) {
                            playNotificationTone();
                        }
                    }
                    
                    prevNotifRef.current = newCount;
                    setNotifCount(newCount);
                }
            } catch (_) {}
        };
        fetchNotifCount();
        const interval = setInterval(fetchNotifCount, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'superadmin', 'student', 'parent'] },
        { path: '/students', label: 'Students', icon: Users, roles: ['admin', 'superadmin'] },
        { path: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['admin', 'superadmin'] },
        { path: '/test-results', label: 'Tests & Results', icon: GraduationCap, roles: ['admin', 'superadmin'] },
        { path: '/billing', label: 'Billing & Fees', icon: IndianRupee, roles: ['parent', 'admin', 'superadmin'] },
        { path: '/resources', label: 'Resources', icon: BookOpen, roles: ['student', 'admin', 'superadmin'] },
        { path: '/course-mapping', label: 'Course Mapping', icon: Map, roles: ['student', 'admin', 'superadmin'] },
        { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin', 'superadmin'] },
        { path: '/notifications', label: 'Notifications', icon: Bell, dynamicBadge: true, roles: ['admin', 'superadmin', 'student', 'parent'] },
        { path: '/user-management', label: 'Users', icon: Settings, roles: ['superadmin'] },
    ];

    const visibleItems = navItems.filter(item => item.roles.includes(user?.role));
    const isActive = (path) => location.pathname === path;

    return (
        <div className="app-shell">
            {/* Mobile overlay */}
            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
                {/* Logo */}
                <div className="sidebar-brand">
                    <div className="sidebar-brand-inner">
                        <div className="sidebar-logo">DT</div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-heading)' }}>Dipesh Tutorials</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'capitalize' }}>{user?.role}</div>
                        </div>
                    </div>
                    <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
                </div>

                {/* Nav items */}
                <nav className="sidebar-nav">
                    {visibleItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <item.icon size={18} />
                            <span style={{ flex: 1 }}>{item.label}</span>
                            {item.dynamicBadge && notifCount > 0 && (
                                <span className="notif-badge">{notifCount}</span>
                            )}
                            {isActive(item.path) && <ChevronRight size={14} style={{ opacity: 0.5 }} />}
                        </button>
                    ))}
                </nav>

                {/* User info & logout */}
                <div className="sidebar-user">
                    <div className="sidebar-user-info">
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.name}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{user?.email}</div>
                    </div>
                    <button onClick={logout} className="sidebar-logout-btn">
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="main-wrapper">
                {/* Mobile header */}
                <div className="mobile-header">
                    <button onClick={() => setSidebarOpen(true)} className="mobile-hamburger"><Menu size={22} /></button>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--navy)' }}>Dipesh Tutorials</span>
                </div>

                {/* Page content */}
                <main className="page-content">
                    {offline && (
                        <div className="offline-banner">
                            You appear to be offline. Data may not load until connection is restored.
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
