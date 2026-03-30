import React from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import {
    STUDENTS, TOTAL_STUDENTS, ATTENDANCE_RECORDS, FINANCIAL_DATA, NOTIFICATIONS,
    STANDARDS, TEST_RESULTS, TESTS, RESOURCES, getTodayStr, getWeakTopics
} from '../data';
import { Users, CalendarCheck, IndianRupee, TrendingUp, BookOpen, AlertCircle, CheckCircle, Clock, ArrowRight, AlertTriangle, BarChart3, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0A2351', '#B6922E', '#10B981', '#3B82F6', '#EF4444'];

function ParentDashboard({ user }) {
    const navigate = useNavigate();
    const child = user.child || STUDENTS[0];
    const childAttendance = ATTENDANCE_RECORDS.filter(a => a.studentId === child.id);
    const present = childAttendance.filter(a => a.status === 'present').length;
    const late = childAttendance.filter(a => a.status === 'late').length;
    const absent = childAttendance.filter(a => a.status === 'absent').length;
    const total = childAttendance.length || 1;

    const last7 = childAttendance.slice(-7).map(a => ({
        date: a.date.slice(5),
        status: a.status === 'present' ? 1 : a.status === 'late' ? 0.5 : 0,
    }));

    // Child's latest test results
    const latestTest = TESTS[TESTS.length - 1];
    const childResults = TEST_RESULTS.filter(r => r.studentId === child.id && r.testId === latestTest.id);
    const childAvg = childResults.length > 0 ? Math.round(childResults.reduce((s, r) => s + r.percentage, 0) / childResults.length) : 0;
    const weakTopics = getWeakTopics(child.id);

    return (
        <>
            <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>Welcome, {user.name}!</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Your child <strong>{child.name}</strong> is in <strong>{child.standard} Standard</strong></p>
            </div>

            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><CalendarCheck size={24} /></div>
                    <div className="stat-info">
                        <h4>Attendance</h4>
                        <div className="stat-value">{Math.round((present + late) / total * 100)}%</div>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <h4>Present Days</h4>
                        <div className="stat-value">{present}</div>
                    </div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><BarChart3 size={24} /></div>
                    <div className="stat-info">
                        <h4>Latest Test Avg</h4>
                        <div className="stat-value">{childAvg}%</div>
                    </div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><IndianRupee size={24} /></div>
                    <div className="stat-info">
                        <h4>Fees Due</h4>
                        <div className="stat-value">₹{(child.totalFees - child.paidFees).toLocaleString('en-IN')}</div>
                    </div>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
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

                <div className="card">
                    <div className="card-header"><h3>Latest Test Scores</h3></div>
                    <div className="card-body">
                        {childResults.slice(0, 5).map(r => (
                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.subject}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.totalMarks}/{r.maxTotal}</span>
                                    <span className={`badge ${r.percentage >= 75 ? 'present' : r.percentage >= 50 ? 'late' : 'absent'}`}>{r.grade}</span>
                                </div>
                            </div>
                        ))}
                        <button className="btn-gold btn-small" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/analytics')}>
                            View Detailed Analysis <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Weak Topics */}
            {weakTopics.length > 0 && (
                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header">
                        <h3><Lightbulb size={18} style={{ marginRight: 8, color: 'var(--gold)' }} />Areas to Improve</h3>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {weakTopics.slice(0, 6).map((wt, i) => (
                                <div key={i} className="suggestion-card" style={{ flex: '1 1 200px', cursor: 'default' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <AlertTriangle size={14} color={wt.percentage < 30 ? 'var(--danger)' : 'var(--warning)'} />
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{wt.subject}</span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{wt.topic} — {wt.marks}/{wt.maxMarks}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Recent Notifications</h3></div>
                <div className="card-body">
                    {NOTIFICATIONS.filter(n => n.for.includes('parent')).slice(0, 4).map(n => (
                        <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong style={{ fontSize: '0.9rem' }}>{n.title}</strong>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', marginLeft: 16 }}>{n.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function StudentDashboard({ user }) {
    const navigate = useNavigate();
    const student = user.student || STUDENTS[0];
    const myAttendance = ATTENDANCE_RECORDS.filter(a => a.studentId === student.id);
    const present = myAttendance.filter(a => a.status === 'present').length;
    const total = myAttendance.length || 1;

    // Dynamic stats from test results
    const latestTest = TESTS[TESTS.length - 1];
    const myResults = TEST_RESULTS.filter(r => r.studentId === student.id && r.testId === latestTest.id);
    const myAvg = myResults.length > 0 ? Math.round(myResults.reduce((s, r) => s + r.percentage, 0) / myResults.length) : 0;
    const myResources = RESOURCES.filter(r => r.standard === student.standard);
    const missedLectures = myResources.filter(r => r.missedLecture).length;
    const weakTopics = getWeakTopics(student.id);

    return (
        <>
            <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>Hello, {student.name}! 👋</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{student.standard} Standard — Roll No. {student.rollNo}</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><CalendarCheck size={24} /></div><div className="stat-info"><h4>Attendance</h4><div className="stat-value">{Math.round(present / total * 100)}%</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><BarChart3 size={24} /></div><div className="stat-info"><h4>Latest Test Avg</h4><div className="stat-value">{myAvg}%</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><BookOpen size={24} /></div><div className="stat-info"><h4>Resources</h4><div className="stat-value">{myResources.length}</div></div></div>
                <div className="stat-card blue"><div className="stat-icon blue"><AlertCircle size={24} /></div><div className="stat-info"><h4>Missed Lectures</h4><div className="stat-value">{missedLectures}</div></div></div>
            </div>

            {/* Latest Test Scores */}
            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Latest Test: {latestTest.name}</h3></div>
                    <div className="card-body">
                        {myResults.map(r => (
                            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.subject}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="progress-bar" style={{ width: 60, height: 6 }}>
                                        <div className={`progress-fill ${r.percentage >= 75 ? 'green' : r.percentage >= 50 ? 'gold' : 'red'}`}
                                            style={{ width: `${r.percentage}%` }} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{r.percentage}%</span>
                                    <span className={`badge ${r.percentage >= 75 ? 'present' : r.percentage >= 50 ? 'late' : 'absent'}`}>{r.grade}</span>
                                </div>
                            </div>
                        ))}
                        <button className="btn-gold btn-small" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/analytics')}>
                            View Full Analysis <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Weak Topics */}
                <div className="card">
                    <div className="card-header">
                        <h3><Lightbulb size={18} style={{ marginRight: 8, color: 'var(--gold)' }} />Topics to Improve</h3>
                    </div>
                    <div className="card-body">
                        {weakTopics.length > 0 ? weakTopics.slice(0, 5).map((wt, i) => (
                            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{wt.topic}</span>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{wt.subject}</p>
                                </div>
                                <span className={`badge ${wt.percentage < 30 ? 'absent' : 'late'}`}>{wt.marks}/{wt.maxMarks}</span>
                            </div>
                        )) : (
                            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                <CheckCircle size={24} style={{ marginBottom: 8, color: 'var(--success)' }} />
                                <p>Great job! No weak topics identified.</p>
                            </div>
                        )}
                        {weakTopics.length > 0 && (
                            <button className="btn-secondary btn-small" style={{ marginTop: 12, width: '100%' }} onClick={() => navigate('/course-mapping')}>
                                See Detailed Suggestions <ArrowRight size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Upcoming & Notifications</h3></div>
                <div className="card-body">
                    {NOTIFICATIONS.filter(n => n.for.includes('student')).slice(0, 4).map(n => (
                        <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                            <div><strong style={{ fontSize: '0.9rem' }}>{n.title}</strong><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p></div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', marginLeft: 16 }}>{n.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function AdminDashboard() {
    const todayStr = getTodayStr();
    const todayAttendance = ATTENDANCE_RECORDS.filter(a => a.date === todayStr);
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const totalToday = todayAttendance.length || 1;

    // Latest test class average
    const latestTest = TESTS[TESTS.length - 1];
    const latestResults = TEST_RESULTS.filter(r => r.testId === latestTest.id);
    const classAvg = latestResults.length > 0 ? Math.round(latestResults.reduce((s, r) => s + r.percentage, 0) / latestResults.length) : 0;

    const stdData = STANDARDS.map(std => ({
        name: std.length > 6 ? std.slice(0, 6) + '..' : std,
        students: STUDENTS.filter(s => s.standard === std).length,
    }));

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><Users size={24} /></div><div className="stat-info"><h4>Total Students</h4><div className="stat-value">{TOTAL_STUDENTS}</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><CalendarCheck size={24} /></div><div className="stat-info"><h4>Today's Attendance</h4><div className="stat-value">{Math.round(presentToday / totalToday * 100)}%</div></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><BarChart3 size={24} /></div><div className="stat-info"><h4>Class Average</h4><div className="stat-value">{classAvg}%</div><span className="stat-change up">{latestTest.name}</span></div></div>
                <div className="stat-card blue"><div className="stat-icon blue"><AlertCircle size={24} /></div><div className="stat-info"><h4>Notifications</h4><div className="stat-value">{NOTIFICATIONS.filter(n => n.for.includes('admin') && !n.read).length}</div></div></div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Students by Standard</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stdData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="name" fontSize={11} angle={-30} textAnchor="end" height={60} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Bar dataKey="students" fill="#0A2351" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Fee Collection Status</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Paid', value: STUDENTS.filter(s => s.feeStatus === 'paid').length },
                                        { name: 'Pending', value: STUDENTS.filter(s => s.feeStatus === 'pending').length },
                                        { name: 'Overdue', value: STUDENTS.filter(s => s.feeStatus === 'overdue').length },
                                    ]}
                                    cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    <Cell fill="#10B981" /><Cell fill="#F59E0B" /><Cell fill="#EF4444" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </>
    );
}

function SuperAdminDashboard() {
    const latestTest = TESTS[TESTS.length - 1];
    const latestResults = TEST_RESULTS.filter(r => r.testId === latestTest.id);
    const classAvg = latestResults.length > 0 ? Math.round(latestResults.reduce((s, r) => s + r.percentage, 0) / latestResults.length) : 0;

    return (
        <>
            <div style={{ marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, #0A2351, #122D64)', borderRadius: 16, color: 'white' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 4 }}>Director's Dashboard</h2>
                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Complete overview of Dipesh Tutorials operations</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><Users size={24} /></div><div className="stat-info"><h4>Total Students</h4><div className="stat-value">{TOTAL_STUDENTS}</div><span className="stat-change up">↑ 12% vs last year</span></div></div>
                <div className="stat-card green"><div className="stat-icon green"><IndianRupee size={24} /></div><div className="stat-info"><h4>Revenue (FY)</h4><div className="stat-value">₹{(FINANCIAL_DATA.totalRevenue / 100000).toFixed(1)}L</div><span className="stat-change up">↑ 8%</span></div></div>
                <div className="stat-card gold"><div className="stat-icon gold"><BarChart3 size={24} /></div><div className="stat-info"><h4>Test Average</h4><div className="stat-value">{classAvg}%</div><span className="stat-change up">{latestTest.name}</span></div></div>
                <div className="stat-card red"><div className="stat-icon red"><AlertCircle size={24} /></div><div className="stat-info"><h4>Pending Fees</h4><div className="stat-value">₹{(FINANCIAL_DATA.pendingFees / 1000).toFixed(0)}K</div></div></div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div className="card-header"><h3>Revenue vs Expenses</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={FINANCIAL_DATA.monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="month" fontSize={12} />
                                <YAxis fontSize={12} tickFormatter={v => `₹${v / 1000}K`} />
                                <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                                <Line type="monotone" dataKey="revenue" stroke="#0A2351" strokeWidth={3} dot={{ fill: '#0A2351', r: 4 }} />
                                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444', r: 3 }} strokeDasharray="5 5" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3>Expense Breakdown</h3></div>
                    <div className="card-body">
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie data={FINANCIAL_DATA.expenses} cx="50%" cy="50%" outerRadius={90} dataKey="amount"
                                    label={({ category, percentage }) => `${category} ${percentage}%`}>
                                    {FINANCIAL_DATA.expenses.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><h3>Recent Activity</h3></div>
                <div className="card-body">
                    {NOTIFICATIONS.filter(n => n.for.includes('superadmin')).map(n => (
                        <div key={n.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                            <div><strong style={{ fontSize: '0.9rem' }}>{n.title}</strong><p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p></div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', marginLeft: 16 }}>{n.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    switch (user.role) {
        case 'parent': return <ParentDashboard user={user} />;
        case 'student': return <StudentDashboard user={user} />;
        case 'admin': return <AdminDashboard />;
        case 'superadmin': return <SuperAdminDashboard />;
        default: return <AdminDashboard />;
    }
}
