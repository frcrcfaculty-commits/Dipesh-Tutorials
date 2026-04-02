import React from 'react';
import { Plus, Users, CalendarCheck, FileText, Bell, BarChart3 } from 'lucide-react';

const ILLUSTRATIONS = {
    students: { icon: Users, title: 'No students yet', subtitle: 'Add your first student to get started', action: 'Add Student', color: '#0A2351' },
    attendance: { icon: CalendarCheck, title: 'No attendance records', subtitle: "Mark today's attendance to see data here", action: 'Mark Attendance', color: '#10B981' },
    results: { icon: FileText, title: 'No test results', subtitle: 'Enter marks after conducting a test', action: 'Enter Marks', color: '#B6922E' },
    notifications: { icon: Bell, title: 'No notifications', subtitle: 'Send your first notification to parents or students', action: 'Compose', color: '#0A2351' },
    analytics: { icon: BarChart3, title: 'Not enough data', subtitle: 'Charts will appear after students have test scores and attendance records', action: null, color: '#0A2351' },
    chart: { icon: BarChart3, title: 'No data to display', subtitle: 'This chart needs more data to render', action: null, color: '#9CA3AF' },
    search: { icon: Users, title: 'No matches found', subtitle: 'Try a different search term or clear filters', action: null, color: '#9CA3AF' },
};

export default function EmptyState({ type = 'students', onAction, customTitle, customSubtitle }) {
    const config = ILLUSTRATIONS[type] || ILLUSTRATIONS.students;
    const Icon = config.icon;

    return (
        <div style={{
            textAlign: 'center', padding: '48px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
            <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `${config.color}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
            }}>
                <Icon size={36} style={{ color: config.color, opacity: 0.7 }} />
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 6, fontFamily: 'var(--font-heading)' }}>
                {customTitle || config.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 320, lineHeight: 1.5, marginBottom: onAction && config.action ? 20 : 0 }}>
                {customSubtitle || config.subtitle}
            </p>

            {onAction && config.action && (
                <button className="btn-primary btn-small" onClick={onAction} style={{ gap: 6 }}>
                    <Plus size={14} /> {config.action}
                </button>
            )}
        </div>
    );
}
