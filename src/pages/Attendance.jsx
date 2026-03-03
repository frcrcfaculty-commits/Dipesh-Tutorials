import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { ATTENDANCE_RECORDS, STUDENTS, STANDARDS } from '../data';
import { CalendarCheck, Search, Filter, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { exportCSV, showToast } from '../utils';

export default function Attendance() {
    const { user } = useAuth();
    const [selectedStandard, setSelectedStandard] = useState('All');
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [searchQuery, setSearchQuery] = useState('');

    const isParent = user.role === 'parent';
    const isStudent = user.role === 'student';

    // Filter records
    const filteredRecords = useMemo(() => {
        let records = ATTENDANCE_RECORDS;

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

    // Calendar view for parent/student
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
            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card green">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-info"><h4>Present</h4><div className="stat-value">{presentCount}</div>
                        <span className="stat-change up">{Math.round(presentCount / total * 100)}%</span>
                    </div>
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

            {/* Calendar view for Parent/Student */}
            {(isParent || isStudent) && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>Attendance Calendar (Last 28 Days)</h3></div>
                    <div className="card-body">
                        <div className="attendance-grid">
                            {calendarData.map((d, i) => (
                                <div key={i} className={`attendance-day ${d.status}`} title={`${d.day} ${d.date} — ${d.status}`}>
                                    {d.date}
                                </div>
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

            {/* Admin filters */}
            {!isParent && !isStudent && (
                <div className="search-bar">
                    <div className="search-input">
                        <Search />
                        <input
                            type="text"
                            placeholder="Search student..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="select-wrapper">
                        <select value={selectedStandard} onChange={(e) => setSelectedStandard(e.target.value)}>
                            <option value="All">All Standards</option>
                            {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                    />
                </div>
            )}

            {/* Table View */}
            <div className="card">
                <div className="card-header">
                    <h3>Attendance Records</h3>
                    {(user.role === 'admin' || user.role === 'superadmin') && (
                        <button className="btn-secondary btn-small" onClick={() => {
                            exportCSV('attendance', ['Date', 'Student', 'Standard', 'Status'],
                                filtered.map(r => [r.date, STUDENTS.find(s => s.id === r.studentId)?.name || r.studentId, STUDENTS.find(s => s.id === r.studentId)?.standard || '', r.status]));
                            showToast('Attendance data exported!');
                        }}><Download size={14} /> Export</button>
                    )}
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Standard</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Arrival</th>
                                    <th>Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.slice(0, 50).map((r, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                                        <td>{r.standard}</td>
                                        <td>{r.date}</td>
                                        <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                                        <td>{r.arrivalTime || '—'}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {r.method === 'face_detection' ? '🤖 Face Detection' : '✍️ Manual'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredRecords.length === 0 && (
                        <div className="empty-state">
                            <CalendarCheck /><h3>No attendance records found</h3><p>Try changing your filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
