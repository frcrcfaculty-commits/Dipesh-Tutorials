import React, { useState, useEffect } from 'react';
import { useAuth, useData } from '../App';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getStudents, getStudentAttendance, getTestResults, getTests, getNotifications, getFeeStructureByStandard, getFeePayments, getAllFeePayments, getFeeStructures } from '../lib/api';
import { Users, CalendarCheck, IndianRupee, TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight, BarChart3, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

function ParentDashboard({ user }) {
    const navigate = useNavigate();
    const child = user.child;
    const [attendance, setAttendance] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [latestTest, setLatestTest] = useState(null);
    const [feeInfo, setFeeInfo] = useState({ total: 0, paid: 0 });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!child) return;
        Promise.all([
            getStudentAttendance(child.id, 7),
            getTests(child.standard_id),
            getTestResults({ studentId: child.id }),
            getFeeStructureByStandard(child.standard_id),
            getFeePayments(child.id),
            getNotifications('parent', 5),
        ]).then(([att, tests, results, feeSt, pays, notifs]) => {
            setAttendance(att || []);
            const lt = (tests || [])[0] || null;
            setLatestTest(lt);
            setTestResults(lt ? (results || []).filter(r => r.test_id === lt.id) : []);
            const totalFees = feeSt?.total_amount || 0;
            const paidFees = (pays || []).reduce((s, p) => s + parseFloat(p.amount), 0);
            setFeeInfo({ total: totalFees, paid: paidFees });
            setNotifications(notifs || []);
            setLoading(false);
        });
    }, [child]);

    if (!child) return <div className="empty-state"><h3>No student linked to your account</h3><p>Contact admin to link your child's profile.</p></div>;

    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const total = attendance.length || 1;
    const testAvg = testResults.length > 0
        ? Math.round(testResults.reduce((s, r) => s + (r.max_marks > 0 ? (r.marks_obtained / r.max_marks) * 100 : 0), 0) / testResults.length)
        : null;
    const feeDue = feeInfo.total - feeInfo.paid;

    const last7 = attendance.map(a => ({
        date: a.date?.slice(5),
        status: a.status === 'present' ? 1 : a.status === 'late' ? 0.5 : 0,
    }));

    return (
        <>
            <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>Welcome, {user.name}!</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Your child <strong>{child.name}</strong> is in <strong>{child.standards?.name || ''} Standard</strong></p>
            </div>

            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><CalendarCheck size={24} /></div>
                    <div className="stat-info"><h4>Attendance (7d)</h4><div className="stat-value">{Math.round((present + late) / total * 100)}%</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-info"><h4>Present Days</h4><div className="stat-value">{present}</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><BarChart3 size={24} /></div>
                    <div className="stat-info"><h4>Latest Test Avg</h4><div className="stat-value">{testAvg !== null ? `${testAvg}%` : '—'}</div>
                    {latestTest && <span className="stat-change up">{latestTest.name}</span>}</div></div>
                <div className="stat-card red"><div className="stat-icon red"><IndianRupee size={24} /></div>
                    <div className="stat-info"><h4>Fees Due</h4><div className="stat-value">₹{feeDue > 0 ? feeDue.toLocaleString('en-IN') : '0'}</div></div></div>
            </div>

            {last7.length > 0 && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>Weekly Attendance</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={last7}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="date" fontSize={12} />
                                <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} tickFormatter={v => v === 1 ? 'P' : v === 0.5 ? 'L' : 'A'} fontSize={12} />
                                <Tooltip formatter={v => v === 1 ? 'Present' : v === 0.5 ? 'Late' : 'Absent'} />
                                <Bar dataKey="status" fill="#0A2351" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="grid-2">
                {testResults.length > 0 && (
                    <div className="card">
                        <div className="card-header"><h3>Latest Test: {latestTest?.name || ''}</h3></div>
                        <div className="card-body">
                            {testResults.map(r => {
                                const pct = r.max_marks > 0 ? Math.round((r.marks_obtained / r.max_marks) * 100) : 0;
                                return (
                                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.subjects?.name || 'Subject'}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.marks_obtained}/{r.max_marks}</span>
                                            <span className={`badge ${pct >= 75 ? 'present' : pct >= 50 ? 'late' : 'absent'}`}>{r.grade}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            <button className="btn-gold btn-small" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/analytics')}>
                                View Detailed Analysis <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
                <div className="card">
                    <div className="card-header"><h3>Recent Notifications</h3></div>
                    <div className="card-body">
                        {notifications.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No notifications yet.</p> :
                            notifications.map(n => (
                                <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                    <div><strong style={{ fontSize: '0.9rem' }}>{n.title}</strong><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p></div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', marginLeft: 16 }}>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </>
    );
}

function StudentDashboard({ user }) {
    const navigate = useNavigate();
    const student = user.student;
    const [attendance, setAttendance] = useState([]);
    const [testResults, setTestResults] = useState([]);
    const [latestTest, setLatestTest] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!student) return;
        Promise.all([
            getStudentAttendance(student.id, 28),
            getTests(student.standard_id),
            getTestResults({ studentId: student.id }),
            getNotifications('student', 5),
        ]).then(([att, tests, results, notifs]) => {
            setAttendance(att || []);
            const lt = (tests || [])[0] || null;
            setLatestTest(lt);
            setTestResults(lt ? (results || []).filter(r => r.test_id === lt.id) : []);
            setNotifications(notifs || []);
            setLoading(false);
        });
    }, [student]);

    if (!student) return <div className="empty-state"><h3>Student profile not found</h3></div>;

    const present = attendance.filter(a => a.status === 'present').length;
    const total = attendance.length || 1;
    const testAvg = testResults.length > 0
        ? Math.round(testResults.reduce((s, r) => s + (r.max_marks > 0 ? (r.marks_obtained / r.max_marks) * 100 : 0), 0) / testResults.length)
        : null;

    return (
        <>
            <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>Hello, {student.name}!</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{student.standards?.name || ''} Standard — Roll No. {student.roll_no}</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><CalendarCheck size={24} /></div><div className="stat-info"><h4>Attendance</h4><div className="stat-value">{Math.round(present / total * 100)}%</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><CheckCircle size={24} /></div><div className="stat-info"><h4>Present (28d)</h4><div className="stat-value">{present}</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><BarChart3 size={24} /></div><div className="stat-info"><h4>Latest Test Avg</h4><div className="stat-value">{testAvg !== null ? `${testAvg}%` : '—'}</div>
                    {latestTest && <span className="stat-change up">{latestTest.name}</span>}</div></div>
            </div>

            <div className="grid-2">
                {testResults.length > 0 && (
                    <div className="card">
                        <div className="card-header"><h3>Latest Test: {latestTest?.name}</h3></div>
                        <div className="card-body">
                            {testResults.map(r => {
                                const pct = r.max_marks > 0 ? Math.round((r.marks_obtained / r.max_marks) * 100) : 0;
                                return (
                                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.subjects?.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="progress-bar" style={{ width: 60, height: 6 }}>
                                                <div className={`progress-fill ${pct >= 75 ? 'green' : pct >= 50 ? 'gold' : 'red'}`} style={{ width: `${pct}%` }} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{pct}%</span>
                                            <span className={`badge ${pct >= 75 ? 'present' : pct >= 50 ? 'late' : 'absent'}`}>{r.grade}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            <button className="btn-gold btn-small" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/analytics')}>
                                View Full Analysis <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
                <div className="card">
                    <div className="card-header"><h3>Notifications</h3></div>
                    <div className="card-body">
                        {notifications.length === 0 ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No notifications.</p> :
                            notifications.map(n => (
                                <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                                    <div><strong style={{ fontSize: '0.9rem' }}>{n.title}</strong><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p></div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', marginLeft: 16 }}>{new Date(n.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {testResults.length === 0 && !loading && (
                <div className="card" style={{ marginTop: 24 }}><div className="card-body empty-state"><FileText /><h3>No test results yet</h3><p>Your scores will appear here after your first test.</p></div></div>
            )}
        </>
    );
}

function AdminDashboard() {
    const { standards } = useData();
    const [stats, setStats] = useState({ totalStudents: 0, attendancePercent: 0, totalNotifications: 0 });
    const [students, setStudents] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [allPayments, setAllPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getDashboardStats(),
            getStudents(),
            getFeeStructures(),
            getAllFeePayments(),
        ]).then(([s, studs, fees, pays]) => {
            setStats(s);
            setStudents(studs || []);
            setFeeStructures(fees || []);
            setAllPayments(pays || []);
            setLoading(false);
        });
    }, []);

    const stdData = standards.map(std => ({
        name: std.name.length > 6 ? std.name.slice(0, 6) + '..' : std.name,
        students: students.filter(s => s.standard_id === std.id).length,
    }));

    // Fee stats
    const studentFees = students.map(s => {
        const st = feeStructures.find(f => f.standard_id === s.standard_id);
        const totalFees = st ? parseFloat(st.total_amount) : 0;
        const paid = allPayments.filter(p => p.student_id === s.id).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        return { status: paid >= totalFees ? 'paid' : paid > 0 ? 'pending' : 'overdue' };
    });

    const feeChartData = [
        { name: 'Paid', value: studentFees.filter(s => s.status === 'paid').length },
        { name: 'Pending', value: studentFees.filter(s => s.status === 'pending').length },
        { name: 'Overdue', value: studentFees.filter(s => s.status === 'overdue').length },
    ].filter(d => d.value > 0);

    const totalCollected = allPayments.reduce((s, p) => s + parseFloat(p.amount), 0);

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><Users size={24} /></div><div className="stat-info"><h4>Total Students</h4><div className="stat-value">{stats.totalStudents}</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><CalendarCheck size={24} /></div><div className="stat-info"><h4>Today's Attendance</h4><div className="stat-value">{stats.attendancePercent}%</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><IndianRupee size={24} /></div><div className="stat-info"><h4>Total Collected</h4><div className="stat-value">₹{(totalCollected / 1000).toFixed(0)}K</div></div></div>
                <div className="stat-card blue"><div className="stat-icon blue"><AlertCircle size={24} /></div><div className="stat-info"><h4>Notifications</h4><div className="stat-value">{stats.totalNotifications}</div></div></div>
            </div>

            {!loading && (
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
                                        <Bar dataKey="students" fill="#0A2351" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <div className="empty-state"><Users /><h3>No students yet</h3></div>}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><h3>Fee Collection Status</h3></div>
                        <div className="card-body">
                            {feeChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie data={feeChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}>
                                            {feeChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <div className="empty-state"><IndianRupee /><h3>No fee data yet</h3></div>}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    switch (user.role) {
        case 'parent': return <ParentDashboard user={user} />;
        case 'student': return <StudentDashboard user={user} />;
        case 'superadmin':
        case 'admin':
        default: return <AdminDashboard />;
    }
}
