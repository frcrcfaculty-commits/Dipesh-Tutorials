import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { NOTIFICATIONS } from '../data';
import {
    GraduationCap, LayoutDashboard, CalendarCheck, FolderOpen, IndianRupee,
    Bell, GitBranch, Users, LogOut, Menu, X, Search, ChevronRight,
    BarChart3, FileText, Lightbulb
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
        ]
    },
];

const ROLE_LABELS = { parent: 'Parent', student: 'Student', admin: 'Admin Staff', superadmin: 'Super Admin' };

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Compute dynamic notification badge (static + localStorage sent)
    const unreadCount = useMemo(() => {
        const staticCount = NOTIFICATIONS.filter(n => n.for.includes(user.role) && !n.read).length;
        let sentCount = 0;
        try {
            const stored = localStorage.getItem('dipesh_sent_notifications');
            if (stored) {
                const sent = JSON.parse(stored);
                sentCount = sent.filter(n => n.for.includes(user.role) && !n.read).length;
            }
        } catch { }
        return staticCount + sentCount;
    }, [user.role]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getPageTitle = () => {
        const titles = {
            '/': 'Dashboard', '/attendance': 'Attendance', '/resources': 'Resource Hub',
            '/billing': 'Billing & Fees', '/notifications': 'Notifications',
            '/course-mapping': user.role === 'student' ? 'Topics to Improve' : 'Course Outcomes',
            '/students': 'Students', '/analytics': 'Analytics', '/test-results': 'Test Results'
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
