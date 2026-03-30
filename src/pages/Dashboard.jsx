import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getDashboardStats, getStudents, getStudentAttendance, getTests, getTestResults, getNotifications, getFeeSummary } from '../lib/api';
import { Users, CalendarCheck, IndianRupee, BarChart3, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0A2351', '#B6922E', '#10B981', '#3B82F6', '#EF4444'];

function ParentDashboard({ user }) {
    const [att, setAtt] = useState([]);
    const [testAvg, setTestAvg] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user.profile?.student_id) { setLoading(false); return; }
        Promise.all([
            getStudentAttendance(user.profile.student_id, 7),
            getTests(),
            getTestResults({ studentId: user.profile.student_id }),
            getNotifications('parent', 5),
        ]).then(([attendance, tests, results, notifs]) => {
            const present = (attendance||[]).filter(a => a.status === 'present').length;
            setAtt(attendance||[]);
            const latest = (tests||[])[0];
            if (latest) {
                const latestResults = (results||[]).filter(r => r.test_id === latest.id);
                const avg = latestResults.length > 0
                    ? Math.round(latestResults.reduce((s,r) => s + (r.marks_obtained/r.max_marks)*100, 0) / latestResults.length) : 0;
                setTestAvg(avg);
            }
            setNotifications(notifs||[]);
            setLoading(false);
        });
    }, [user]);

    const present = att.filter(a => a.status === 'present').length;
    const total = att.length || 1;
    const last7 = att.slice(-7).map(a => ({ date: (a.date||'').slice(5), status: a.status === 'present' ? 1 : a.status === 'late' ? 0.5 : 0 }));

    if (loading) return <div className="loading-spinner" />;
    if (!user.profile?.student_id) return <div className="empty-state"><h3>No student linked to your account</h3></div>;

    return (
        <>
            <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>Welcome, {user.name}!</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Parent Dashboard</p>
            </div>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><CalendarCheck size={24} /></div><div className="stat-info"><h4>Attendance (7d)</h4><div className="stat-value">{Math.round(present/total*100)}%</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><BarChart3 size={24} /></div><div className="stat-info"><h4>Latest Test</h4><div className="stat-value">{testAvg !== null ? `${testAvg}%` : '—'}</div></div></div>
            </div>
            {last7.length > 0 && (
                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header"><h3>Weekly Attendance</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={last7}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="date" fontSize={12} />
                                <YAxis domain={[0,1]} ticks={[0,0.5,1]} tickFormatter={v => v===1?'P':v===0.5?'L':'A'} fontSize={12} />
                                <Tooltip formatter={v => v===1?'Present':v===0.5?'Late':'Absent'} />
                                <Bar dataKey="status" fill="#0A2351" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Notifications</h3></div>
                <div className="card-body">
                    {(notifications||[]).slice(0,5).map(n => (
                        <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                            <strong style={{ fontSize: '0.9rem' }}>{n.title}</strong>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 2 }}>{n.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function StudentDashboard({ user }) {
    const [att, setAtt] = useState([]);
    const [testAvg, setTestAvg] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user.profile?.id) { setLoading(false); return; }
        Promise.all([
            getStudentAttendance(user.profile.id, 28),
            getTests(),
            getTestResults({ studentId: user.profile.id }),
        ]).then(([attendance, tests, results]) => {
            setAtt(attendance||[]);
            const latest = (tests||[])[0];
            if (latest) {
                const latestResults = (results||[]).filter(r => r.test_id === latest.id);
                const avg = latestResults.length > 0
                    ? Math.round(latestResults.reduce((s,r) => s + (r.marks_obtained/r.max_marks)*100, 0) / latestResults.length) : 0;
                setTestAvg(avg);
            }
            setLoading(false);
        });
    }, [user]);

    const present = att.filter(a => a.status === 'present').length;
    const total = att.length || 1;
    if (loading) return <div className="loading-spinner" />;

    return (
        <>
            <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>Hello, {user.name}!</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Student Dashboard</p>
            </div>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><CalendarCheck size={24} /></div><div className="stat-info"><h4>Attendance</h4><div className="stat-value">{Math.round(present/total*100)}%</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><BarChart3 size={24} /></div><div className="stat-info"><h4>Latest Test</h4><div className="stat-value">{testAvg !== null ? `${testAvg}%` : '—'}</div></div></div>
            </div>
            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Notifications</h3></div>
                <div className="card-body">
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Log in to see notifications.</p>
                </div>
            </div>
        </>
    );
}

function AdminDashboard() {
    const [stats, setStats] = useState({ totalStudents: 0, attendancePercent: 0, totalCollected: 0, pendingFees: 0 });
    const [stdData, setStdData] = useState([]);
    const [feeData, setFeeData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getDashboardStats(),
            getStudents(),
            getFeeSummary(),
        ]).then(([s, students, fees]) => {
            setStats({
                totalStudents: s?.totalStudents || 0,
                attendancePercent: s?.attendancePercent || 0,
                totalCollected: s?.totalCollected || 0,
                pendingFees: s?.pendingFees || 0,
            });
            const byStd = {};
            (students||[]).forEach(st => {
                const name = st.standards?.name || st.standard_id || 'Unknown';
                byStd[name] = (byStd[name]||0) + 1;
            });
            setStdData(Object.entries(byStd).map(([name, students]) => ({ name, students })));
            const paid = (fees||[]).filter(f => f.status === 'paid').length;
            const pending = (fees||[]).filter(f => f.status === 'pending').length;
            const overdue = (fees||[]).filter(f => f.status === 'overdue').length;
            setFeeData([
                { name: 'Paid', value: paid },
                { name: 'Pending', value: pending },
                { name: 'Overdue', value: overdue },
            ].filter(d => d.value > 0));
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="loading-spinner" />;

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><Users size={24} /></div><div className="stat-info"><h4>Total Students</h4><div className="stat-value">{stats.totalStudents}</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><CalendarCheck size={24} /></div><div className="stat-info"><h4>Attendance</h4><div className="stat-value">{stats.attendancePercent}%</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><IndianRupee size={24} /></div><div className="stat-info"><h4>Collected</h4><div className="stat-value">₹{(stats.totalCollected/1000).toFixed(0)}K</div></div></div>
                <div className="stat-card red"><div className="stat-icon red"><AlertCircle size={24} /></div><div className="stat-info"><h4>Pending Fees</h4><div className="stat-value">₹{(stats.pendingFees/1000).toFixed(0)}K</div></div></div>
            </div>
            <div className="grid-2" style={{ marginTop: 24 }}>
                <div className="card">
                    <div className="card-header"><h3>Students by Standard</h3></div>
                    <div className="card-body">
                        {stdData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stdData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="name" fontSize={11} angle={-30} textAnchor="end" height={60} />
                                    <YAxis fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="students" fill="#0A2351" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="empty-state"><Users /><h3>No data</h3></div>}
                    </div>
                </div>
                <div className="card">
                    <div className="card-header"><h3>Fee Collection Status</h3></div>
                    <div className="card-body">
                        {feeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={feeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}>
                                        {feeData.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="empty-state"><IndianRupee /><h3>No fee data</h3></div>}
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    switch (user?.role) {
        case 'parent': return <ParentDashboard user={user} />;
        case 'student': return <StudentDashboard user={user} />;
        default: return <AdminDashboard user={user} />;
    }
}