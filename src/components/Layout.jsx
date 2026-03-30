import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';
import {
    GraduationCap, LayoutDashboard, CalendarCheck, FolderOpen, IndianRupee,
    Bell, GitBranch, Users, LogOut, Menu, X, Search, ChevronRight,
    BarChart3, FileText, Lightbulb, Shield
} from 'lucide-react';

const NAV_ITEMS = [
    {
        section: 'Main', items: [
            { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['parent', 'student', 'admin', 'superadmin'] },
            { path: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['parent', 'student', 'admin', 'superadmin'] },
            { path: '/students', label: 'Students', icon: Users, roles: ['admin', 'superadmin'] },
        ]
    },
    {
        section: 'Learning', items: [
            { path: '/resources', label: 'Resource Hub', icon: FolderOpen, roles: ['student', 'admin', 'superadmin'] },
            { path: '/course-mapping', label: 'Course Outcomes', icon: GitBranch, roles: ['admin', 'superadmin'] },
            { path: '/course-mapping', label: 'Topics to Improve', icon: Lightbulb, roles: ['student'] },
            { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['parent', 'student', 'admin', 'superadmin'] },
        ]
    },
    {
        section: 'Management', items: [
            { path: '/test-results', label: 'Test Results', icon: FileText, roles: ['admin', 'superadmin'] },
            { path: '/billing', label: 'Billing & Fees', icon: IndianRupee, roles: ['parent', 'admin', 'superadmin'] },
            { path: '/notifications', label: 'Notifications', icon: Bell, dynamicBadge: true, roles: ['parent', 'student', 'admin', 'superadmin'] },
            { path: '/user-management', label: 'User Accounts', icon: Shield, roles: ['admin', 'superadmin'] },
        ]
    },
];

const ROLE_LABELS = { parent: 'Parent', student: 'Student', admin: 'Admin Staff', superadmin: 'Super Admin' };

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Notification badge - fetch unread count from Supabase
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        if (!user) return;
        async function fetchUnread() {
            try {
                const [notifsRes, readsRes] = await Promise.all([
                    supabase.from('notifications').select('id', { count: 'exact', head: false }).contains('target_roles', [user.role]),
                    supabase.from('notification_reads').select('notification_id').eq('profile_id', user.id),
                ]);
                const totalNotifs = (notifsRes.data || []).length;
                const readCount = (readsRes.data || []).length;
                setUnreadCount(Math.max(0, totalNotifs - readCount));
            } catch { /* silent */ }
        }
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getPageTitle = () => {
        const titles = {
            '/': 'Dashboard', '/attendance': 'Attendance', '/resources': 'Resource Hub',
            '/billing': 'Billing & Fees', '/notifications': 'Notifications',
            '/course-mapping': user.role === 'student' ? 'Topics to Improve' : 'Course Outcomes',
            '/students': 'Students', '/analytics': 'Analytics', '/test-results': 'Test Results',
            '/user-management': 'User Accounts'
        };
        return titles[location.pathname] || 'Dashboard';
    };

    return (
        <div className="app-shell">
            {/* Sidebar Overlay */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-icon"><GraduationCap /></div>
                    <div>
                        <h2>Dipesh Tutorials</h2>
                        <span>Education with Perfection</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(section => {
                        const visibleItems = section.items.filter(item => item.roles.includes(user.role));
                        if (visibleItems.length === 0) return null;
                        return (
                            <div key={section.section} className="nav-section">
                                <div className="nav-section-title">{section.section}</div>
                                {visibleItems.map(item => (
                                    <div
                                        key={item.label}
                                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                        onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                        {item.dynamicBadge && unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar-user">
                    <div className="avatar">{user.name.charAt(0)}</div>
                    <div className="user-info">
                        <div className="name">{user.name}</div>
                        <div className="role-tag">{ROLE_LABELS[user.role]}</div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="main-content">
                <header className="top-bar">
                    <div className="top-bar-left">
                        <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
                            <Menu size={22} />
                        </button>
                        <h1>{getPageTitle()}</h1>
                    </div>
                    <div className="top-bar-right">
                        <button className="icon-btn" onClick={() => navigate('/notifications')}>
                            <Bell size={18} />
                            {unreadCount > 0 && <span className="dot" />}
                        </button>
                    </div>
                </header>
                <div className="page-content">
                    {children}
                </div>
            </main>
        </div>
    );
}
