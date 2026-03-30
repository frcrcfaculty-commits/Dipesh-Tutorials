import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useData } from '../App';
import { getAttendanceByDate, markAttendance, getStudentAttendance } from '../lib/api';
import { CalendarCheck, Search, CheckCircle, XCircle, Clock, Download, Save, Check } from 'lucide-react';
import { exportCSV, showToast } from '../utils';

export default function Attendance() {
    const { user } = useAuth();
    const { standards } = useData();
    const todayStr = new Date().toISOString().split('T')[0];

    const [selectedStandard, setSelectedStandard] = useState('All');
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [searchQuery, setSearchQuery] = useState('');
    const [studentsWithAttendance, setStudentsWithAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [localStatus, setLocalStatus] = useState({});

    // Student/parent calendar data
    const [calendarData, setCalendarData] = useState([]);

    const isParent = user.role === 'parent';
    const isStudent = user.role === 'student';
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    useEffect(() => {
        if (isParent || isStudent) {
            loadStudentCalendar();
        } else {
            loadAttendance();
        }
    }, [selectedDate, selectedStandard]);

    async function loadAttendance() {
        setLoading(true);
        try {
            const data = await getAttendanceByDate(
                selectedDate,
                selectedStandard !== 'All' ? parseInt(selectedStandard) : null
            );
            setStudentsWithAttendance(data || []);
            // Initialize local status from existing records
            const statusMap = {};
            (data || []).forEach(s => {
                const att = s.attendance?.[0];
                if (att) statusMap[s.id] = att.status;
            });
            setLocalStatus(statusMap);
        } catch (err) {
            showToast(err.message, 'error');
        }
        setLoading(false);
    }

    async function loadStudentCalendar() {
        setLoading(true);
        try {
            const studentId = isStudent ? user.student?.id : user.child?.id;
            if (!studentId) { setLoading(false); return; }
            const data = await getStudentAttendance(studentId, 28);
            // Build calendar
            const days = [];
            const now = new Date();
            for (let d = 27; d >= 0; d--) {
                const date = new Date(now);
                date.setDate(date.getDate() - d);
                const dateStr = date.toISOString().split('T')[0];
                const record = (data || []).find(r => r.date === dateStr);
                days.push({
                    date: date.getDate(),
                    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
                    status: date.getDay() === 0 ? 'holiday' : record ? record.status : 'holiday',
                });
            }
            setCalendarData(days);
            // Also compute stats
            const records = data || [];
            setStudentsWithAttendance(records.map(r => ({ ...r, studentName: user.student?.name || user.child?.name || '' })));
        } catch (err) {
            showToast(err.message, 'error');
        }
        setLoading(false);
    }

    const setStatus = (studentId, status) => {
        setLocalStatus(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSaveAttendance = async () => {
        setSaving(true);
        try {
            const records = Object.entries(localStatus).map(([studentId, status]) => ({
                student_id: studentId,
                date: selectedDate,
                status,
                method: 'manual',
                marked_by: user.id,
            }));
            await markAttendance(records);
            showToast(`Attendance saved for ${records.length} students`);
            setEditMode(false);
            loadAttendance();
        } catch (err) {
            showToast(err.message, 'error');
        }
        setSaving(false);
    };

    // Filtered for admin view
    const filtered = useMemo(() => {
        if (isParent || isStudent) return studentsWithAttendance;
        return studentsWithAttendance.filter(s => {
            if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [studentsWithAttendance, searchQuery, isParent, isStudent]);

    const presentCount = isAdmin
        ? filtered.filter(s => localStatus[s.id] === 'present' || s.attendance?.[0]?.status === 'present').length
        : studentsWithAttendance.filter(r => r.status === 'present').length;
    const lateCount = isAdmin
        ? filtered.filter(s => localStatus[s.id] === 'late' || s.attendance?.[0]?.status === 'late').length
        : studentsWithAttendance.filter(r => r.status === 'late').length;
    const absentCount = isAdmin
        ? filtered.filter(s => localStatus[s.id] === 'absent' || s.attendance?.[0]?.status === 'absent').length
        : studentsWithAttendance.filter(r => r.status === 'absent').length;
    const total = filtered.length || 1;

    return (
        <>
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
                    <div className="stat-info"><h4>Total</h4><div className="stat-value">{filtered.length}</div></div>
                </div>
            </div>

            {/* Student/Parent Calendar */}
            {(isParent || isStudent) && calendarData.length > 0 && (
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

            {/* Admin controls */}
            {isAdmin && (
                <>
                    <div className="search-bar">
                        <div className="search-input">
                            <Search />
                            <input type="text" placeholder="Search student..." value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div className="select-wrapper">
                            <select value={selectedStandard} onChange={(e) => setSelectedStandard(e.target.value)}>
                                <option value="All">All Standards</option>
                                {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                        {!editMode ? (
                            <button className="btn-gold btn-small" onClick={() => setEditMode(true)}>
                                <CalendarCheck size={16} /> Mark Attendance
                            </button>
                        ) : (
                            <button className="btn-primary btn-small" onClick={handleSaveAttendance} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Save All'}
                            </button>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3>Attendance — {selectedDate}</h3>
                            <button className="btn-secondary btn-small" onClick={() => {
                                exportCSV('attendance',
                                    ['Name', 'Roll No', 'Standard', 'Date', 'Status'],
                                    filtered.map(s => [s.name, s.roll_no, s.standards?.name, selectedDate, localStatus[s.id] || s.attendance?.[0]?.status || 'not marked']));
                                showToast('Attendance exported!');
                            }}><Download size={14} /> Export</button>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {loading ? (
                                <div className="empty-state"><div className="spinner" /><p>Loading...</p></div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Roll No</th>
                                                <th>Standard</th>
                                                <th>Status</th>
                                                {editMode && <th>Mark</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map(s => {
                                                const currentStatus = localStatus[s.id] || s.attendance?.[0]?.status || null;
                                                return (
                                                    <tr key={s.id}>
                                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                                        <td>{s.roll_no}</td>
                                                        <td>{s.standards?.name}</td>
                                                        <td>
                                                            {currentStatus ? (
                                                                <span className={`badge ${currentStatus}`}>{currentStatus}</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>Not marked</span>
                                                            )}
                                                        </td>
                                                        {editMode && (
                                                            <td>
                                                                <div style={{ display: 'flex', gap: 4 }}>
                                                                    {['present', 'late', 'absent'].map(status => (
                                                                        <button key={status}
                                                                            className={`filter-chip ${currentStatus === status ? 'active' : ''}`}
                                                                            style={{
                                                                                minHeight: 32, padding: '4px 10px', fontSize: '0.75rem',
                                                                                background: currentStatus === status
                                                                                    ? (status === 'present' ? 'var(--success)' : status === 'late' ? 'var(--warning)' : 'var(--danger)')
                                                                                    : undefined,
                                                                                color: currentStatus === status ? 'white' : undefined,
                                                                            }}
                                                                            onClick={() => setStatus(s.id, status)}>
                                                                            {status === 'present' ? 'P' : status === 'late' ? 'L' : 'A'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {!loading && filtered.length === 0 && (
                                <div className="empty-state">
                                    <CalendarCheck /><h3>No students found</h3><p>Try changing your filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
