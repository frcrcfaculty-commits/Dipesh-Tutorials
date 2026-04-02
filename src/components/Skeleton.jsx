import React, { useEffect } from 'react';

const shimmerStyle = {
    background: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
    borderRadius: 8,
};

export function SkeletonBlock({ width = '100%', height = 16, style = {} }) {
    return <div style={{ ...shimmerStyle, width, height, ...style }} />;
}

export function SkeletonStatGrid({ count = 4 }) {
    return (
        <div className="stats-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="stat-card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <SkeletonBlock width={40} height={40} style={{ borderRadius: 10 }} />
                        <div style={{ flex: 1 }}>
                            <SkeletonBlock width="60%" height={12} style={{ marginBottom: 8 }} />
                            <SkeletonBlock width="40%" height={24} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SkeletonBlock width={150} height={20} />
                <SkeletonBlock width={80} height={32} style={{ borderRadius: 6 }} />
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                <table className="data-table">
                    <thead>
                        <tr>{Array.from({ length: cols }).map((_, i) => <th key={i}><SkeletonBlock width="80%" height={14} /></th>)}</tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: rows }).map((_, r) => (
                            <tr key={r}>
                                {Array.from({ length: cols }).map((_, c) => (
                                    <td key={c}><SkeletonBlock width={`${60 + Math.floor(Math.random() * 30)}%`} height={14} /></td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function SkeletonChart({ height = 250 }) {
    return (
        <div className="card">
            <div className="card-header"><SkeletonBlock width={180} height={20} /></div>
            <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, padding: '20px 0' }}>
                    {Array.from({ length: 7 }).map((_, i) => (
                        <SkeletonBlock key={i} width="12%" height={`${30 + Math.floor(Math.random() * 60)}%`} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function SkeletonDashboard() {
    return (
        <>
            <div style={{ height: 80, borderRadius: 16, marginBottom: 24, background: 'var(--bg-secondary)', animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%', backgroundImage: 'linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%)' }} />
            <SkeletonStatGrid count={4} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
                <SkeletonChart height={280} />
                <SkeletonChart height={280} />
            </div>
        </>
    );
}

export function SkeletonNotifications({ rows = 5 }) {
    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <SkeletonBlock width={120} height={20} />
                <SkeletonBlock width={100} height={32} style={{ borderRadius: 6 }} />
            </div>
            <div className="card-body" style={{ padding: 0 }}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                <SkeletonBlock width={60} height={20} style={{ borderRadius: 20 }} />
                                <SkeletonBlock width={8} height={8} style={{ borderRadius: 4, marginTop: 6 }} />
                            </div>
                            <SkeletonBlock width="70%" height={16} style={{ marginBottom: 6 }} />
                            <SkeletonBlock width="90%" height={12} style={{ marginBottom: 4 }} />
                            <SkeletonBlock width="40%" height={10} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonAttendance() {
    return (
        <>
            <SkeletonStatGrid count={4} />
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <SkeletonBlock width={120} height={20} />
                    <SkeletonBlock width={140} height={32} style={{ borderRadius: 6 }} />
                    <SkeletonBlock width={120} height={32} style={{ borderRadius: 6 }} />
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: 20 }}>
                        {Array.from({ length: 28 }).map((_, i) => (
                            <SkeletonBlock key={i} height={48} style={{ borderRadius: 6 }} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
