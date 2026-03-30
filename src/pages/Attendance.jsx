import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../App';
import { ATTENDANCE_RECORDS as MOCK_ATTENDANCE, STUDENTS as MOCK_STUDENTS, STANDARDS } from '../data';
import { subscribeAttendance, markAttendance, subscribeStudents } from '../firebase';
import { CalendarCheck, Search, CheckCircle, XCircle, Clock, Download, Save, Loader2 } from 'lucide-react';
import { exportCSV, showToast } from '../utils';

export default function Attendance() {
    const { user } = useAuth();
    const [selectedStandard, setSelectedStandard] = useState('All');
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceRecords, setAttendanceRecords] = useState({});
    const [students, setStudents] = useState(MOCK_STUDENTS);
    const [saving, setSaving] = useState(false);
    const [showMark, setShowMark] = useState(false);

    const isParent = user.role === 'parent';
    const isStudent = user.role === 'student';

    // Subscribe to real data
    useEffect(() => {
        let u1, u2;
        try {
            u1 = subscribeAttendance(selectedDate, (data) => { if (data) setAttendanceRecords(data); });
            u2 = subscribeStudents((data) => { if (data && data.length > 0) setStudents(data); });
        } catch (_) {}
        return () => { if (u1) u1(); if (u2) u2(); };
    }, [selectedDate]);

    // Current day's attendance for admin marking
    const todayStudents = useMemo(() => {
        if (isParent || isStudent) return [];
        return students.filter(s => selectedStandard === 'All' || s.standard === selectedStandard);
    }, [students, selectedStandard, isParent, isStudent]);

    const handleMark = async (studentId, status) => {
        const student = students.find(s => s.id === studentId);
        setSaving(true);
        try {
            await markAttendance(selectedDate, studentId, status, student?.standard || selectedStandard);
            setAttendanceRecords(prev => ({
                ...prev,
                [studentId]: { ...prev[studentId], status }
            }));
        } catch (err) {
            // Demo fallback
            setAttendanceRecords(prev => ({
                ...prev,
                [studentId]: { ...prev[studentId], status }
            }));
            showToast(`Marked ${status} (demo)`);
        }
        setSaving(false);
    };

    const getStatus = (studentId) => attendanceRecords[studentId]?.status || null;

    // Filter records for display
    const filteredRecords = useMemo(() => {
        let records = MOCK_ATTENDANCE;

        if (isParent) {
            const childId = user.child?.id || user.childId || 'STU0001';
            records = records.filter(r => r.studentId === childId);
        } else if (isStudent) {
            const studentId = user.student?.id || user.studentId || 'STU0001';
            records = records.filter(r => r.studentId === studentId);
        } else {
            if (selectedStandard !== 'All') {
                records = records.filter(r => r.standard === selectedStandard);
            }
            if (selectedDate) {
                records = records.filter(r => r.date === selectedDate);
            }
        }

        if (searchQuery) {
            records = records.filter(r => r.studentName.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return records;
    }, [selectedStandard, selectedDate, searchQuery, isParent, isStudent, user]);

    const presentCount = filteredRecords.filter(r => r.status === 'present').length;
    const lateCount = filteredRecords.filter(r => r.status === 'late').length;
    const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
    const total = filteredRecords.length || 1;

    // Calendar view
    const calendarData = useMemo(() => {
        if (!isParent && !isStudent) return [];
        const days = [];
        const now = new Date();
        for (let d = 27; d >= 0; d--) {
            const date = new Date(now);
            date.setDate(date.getDate() - d);
            const dateStr = date.toISOString().split('T')[0];
            const record = filteredRecords.find(r => r.date === dateStr);
            days.push({
                date: date.getDate(),
                day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
                status: date.getDay() === 0 ? 'holiday' : record ? record.status : 'holiday',
            });
        }
        return days;
    }, [filteredRecords, isParent, isStudent]);

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card green">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-info"><h4>Present</h4><div className="stat-value">{presentCount}</div><span className="stat-change up">{Math.round(presentCount / total * 100)}%</span></div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><Clock size={24} /></div>
                    <div className="stat-info"><h4>Late</h4><div className="stat-value">{lateCount}</div></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><XCircle size={24} /></div>
                    <div className="stat-info"><h4>Absent</h4><div className="stat-value">{absentCount}</div></div>
                </div>
                <div className="stat-card navy">
                    <div className="stat-icon navy"><CalendarCheck size={24} /></div>
                    <div className="stat-info"><h4>Total Records</h4><div className="stat-value">{filteredRecords.length}</div></div>
                </div>
            </div>

            {(isParent || isStudent) && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>Attendance Calendar (Last 28 Days)</h3></div>
                    <div className="card-body">
                        <div className="attendance-grid">
                            {calendarData.map((d, i) => (
                                <div key={i} className={`attendance-day ${d.status}`} title={`${d.day} ${d.date} — ${d.status}`}>{d.date}</div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(16,185,129,0.15)' }} /> Present</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(245,158,11,0.15)' }} /> Late</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(239,68,68,0.15)' }} /> Absent</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--bg)' }} /> Holiday</span>
                        </div>
                    </div>
                </div>
            )}

            {!isParent && !isStudent && (
                <div className="search-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <div className="search-input">
                        <Search />
                        <input type="text" placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <div className="select-wrapper">
                        <select value={selectedStandard} onChange={(e) => setSelectedStandard(e.target.value)}>
                            <option value="All">All Standards</option>
                            {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                    <button className="btn-primary btn-small" onClick={() => setShowMark(!showMark)}>
                        <Save size={14} /> {showMark ? 'Hide' : 'Mark'} Attendance
                    </button>
                    <button className="btn-secondary btn-small" onClick={() => {
                        exportCSV('attendance', ['Date', 'Student', 'Standard', 'Status'],
                            filteredRecords.map(r => [r.date, r.studentName, r.standard, r.status]));
                        showToast('Exported!');
                    }}><Download size={14} /> Export</button>
                </div>
            )}

            {/* Quick Mark Attendance Panel */}
            {showMark && !isParent && !isStudent && (
                <div className="card" style={{ marginTop: 16 }}>
                    <div className="card-header">
                        <h3>Mark Attendance — {selectedDate}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{todayStudents.length} students</span>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                            {todayStudents.map(s => {
                                const status = getStatus(s.id);
                                return (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.standard} · {s.id}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {['present', 'late', 'absent'].map(status => (
                                                <button key={status}
                                                    onClick={() => handleMark(s.id, status)}
                                                    disabled={saving}
                                                    title={status}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
                                                        background: getStatus(s.id) === status
                                                            ? status === 'present' ? 'rgba(16,185,129,0.2)' : status === 'late' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'
                                                            : 'var(--bg)',
                                                        color: status === 'present' ? '#10b981' : status === 'late' ? '#f59e0b' : '#ef4444',
                                                        fontSize: '0.7rem', fontWeight: 700,
                                                    }}
                                                >
                                                    {status === 'present' ? 'P' : status === 'late' ? 'L' : 'A'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header"><h3>Attendance Records</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Student</th><th>Standard</th><th>Date</th><th>Status</th><th>Arrival</th></tr>
                            </thead>
                            <tbody>
                                {filteredRecords.slice(0, 50).map((r, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                                        <td>{r.standard}</td>
                                        <td>{r.date}</td>
                                        <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                                        <td>{r.arrivalTime || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredRecords.length === 0 && (
                        <div className="empty-state"><CalendarCheck /><h3>No records found</h3><p>Try changing filters or mark attendance above.</p></div>
                    )}
                </div>
            </div>
        </>
    );
}
