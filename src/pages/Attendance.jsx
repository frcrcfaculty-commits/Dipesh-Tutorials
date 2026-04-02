import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getAttendanceByDate, getStandards, markAttendance, getStudents, getStudentAttendance } from '../lib/api';
import { Calendar, Loader2 } from 'lucide-react';
import { showToast } from '../utils';

function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr() {
    return formatDate(new Date());
}

// ─── Parent / Student View ──────────────────────────────────
function ParentStudentAttendance({ user }) {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    const studentId = user.role === 'student'
        ? (user.students?.[0]?.id || user.as_student?.[0]?.id)
        : (user.students?.[0]?.id || user.as_parent?.[0]?.id);

    useEffect(() => {
        if (!studentId) { setLoading(false); return; }
        getStudentAttendance(studentId, 30)
            .then(setAttendance)
            .catch(() => setAttendance([]))
            .finally(() => setLoading(false));
    }, [studentId]);

    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const total = attendance.length || 1;

    const attMap = {};
    (attendance || []).forEach(a => { attMap[a.date] = a.status; });

    const today = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        days.push({
            date: dateStr,
            dayNum: d.getDate(),
            status: attMap[dateStr] || null,
            isToday: i === 0,
        });
    }

    if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><div className="loading-spinner" /></div>;

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card green">
                    <div className="stat-icon green"><span style={{ fontSize: '1.5rem' }}>✓</span></div>
                    <div className="stat-info"><h4>Present</h4><div className="stat-value">{present} <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ {total}</span></div></div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><span style={{ fontSize: '1.5rem' }}>◐</span></div>
                    <div className="stat-info"><h4>Late</h4><div className="stat-value">{late}</div></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><span style={{ fontSize: '1.5rem' }}>✗</span></div>
                    <div className="stat-info"><h4>Absent</h4><div className="stat-value">{absent}</div></div>
                </div>
            </div>
            <div className="card">
                <div className="card-header"><h3>Attendance — Last 30 Days</h3></div>
                <div className="card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                        {days.map(day => (
                            <div key={day.date} style={{
                                padding: '8px 4px', textAlign: 'center', borderRadius: 6, fontSize: '0.8rem',
                                background: day.status === 'present' ? 'rgba(16,185,129,0.18)'
                                    : day.status === 'late' ? 'rgba(245,158,11,0.18)'
                                    : day.status === 'absent' ? 'rgba(239,68,68,0.18)'
                                    : 'var(--bg-secondary)',
                                color: day.status === 'present' ? 'var(--success)'
                                    : day.status === 'late' ? '#B6922E'
                                    : day.status === 'absent' ? 'var(--danger)'
                                    : 'var(--text-muted)',
                                fontWeight: day.isToday ? 700 : 400,
                                border: day.isToday ? '2px solid var(--gold)' : '1px solid var(--border)',
                            }}>
                                {day.dayNum}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 16, justifyContent: 'center' }}>
                        {[['rgba(16,185,129,0.18)', 'Present'], ['rgba(245,158,11,0.18)', 'Late'], ['rgba(239,68,68,0.18)', 'Absent'], ['var(--bg-secondary)', 'No data']].map(([bg, label]) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: bg, border: '1px solid var(--border)' }} />
                                {label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

// ─── Admin View ──────────────────────────────────────────────
function AdminAttendance() {
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [standards, setStandards] = useState([]);
    const [selectedStandardId, setSelectedStandardId] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studs, stds, att] = await Promise.all([
                getStudents(),
                getStandards(),
                getAttendanceByDate(selectedDate, selectedStandardId || undefined),
            ]);
            setStudents(studs || []);
            setStandards(stds || []);

            const map = {};
            (att || []).forEach(a => {
                if (a.attendance?.[0]) {
                    map[a.id] = a.attendance[0].status;
                }
            });
            setAttendanceMap(map);
        } catch (err) {
            showToast('Failed to load: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [selectedDate, selectedStandardId]);

    const filteredStudents = selectedStandardId
        ? students.filter(s => s.standard_id === selectedStandardId)
        : students;

    const handleMark = async (studentId, status) => {
        setSaving(true);
        try {
            await markAttendance(studentId, selectedDate, status);
            setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
            showToast('Attendance saved');
        } catch (err) {
            showToast(err.message || 'Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleMarkAll = async (status) => {
        setSaving(true);
        try {
            // Parallelize all upserts — single batch network call instead of N sequential calls
            await Promise.all(filteredStudents.map(s =>
                markAttendance(s.id, selectedDate, status)
            ));
            setAttendanceMap(prev => {
                const next = { ...prev };
                filteredStudents.forEach(s => { next[s.id] = status; });
                return next;
            });
            showToast(`All marked as ${status}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const present = filteredStudents.filter(s => attendanceMap[s.id] === 'present').length;
    const late = filteredStudents.filter(s => attendanceMap[s.id] === 'late').length;
    const absent = filteredStudents.filter(s => attendanceMap[s.id] === 'absent').length;

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card green">
                    <div className="stat-icon green"><span style={{ fontSize: '1.5rem' }}>✓</span></div>
                    <div className="stat-info"><h4>Present</h4><div className="stat-value">{present}</div></div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><span style={{ fontSize: '1.5rem' }}>◐</span></div>
                    <div className="stat-info"><h4>Late</h4><div className="stat-value">{late}</div></div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><span style={{ fontSize: '1.5rem' }}>✗</span></div>
                    <div className="stat-info"><h4>Absent</h4><div className="stat-value">{absent}</div></div>
                </div>
                <div className="stat-card navy">
                    <div className="stat-icon navy"><Calendar size={24} /></div>
                    <div className="stat-info"><h4>Date</h4><div className="stat-value" style={{ fontSize: '1rem' }}>{selectedDate}</div></div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Mark Attendance — {selectedDate}</h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="select-wrapper">
                            <select value={selectedStandardId || ''} onChange={e => setSelectedStandardId(e.target.value ? Number(e.target.value) : null)}>
                                <option value="">All Standards</option>
                                {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text)' }} />
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-gold btn-small" onClick={() => handleMarkAll('present')} disabled={saving}>All Present</button>
                            <button className="btn-secondary btn-small" onClick={() => handleMarkAll('late')} disabled={saving}>All Late</button>
                            <button className="btn-secondary btn-small" style={{ color: 'var(--danger)' }} onClick={() => handleMarkAll('absent')} disabled={saving}>All Absent</button>
                        </div>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 48 }}><div className="loading-spinner" /></div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        {!isMobile && <th>Roll</th>}
                                        <th>Name</th>
                                        {!isMobile && <th>Standard</th>}
                                        <th>P</th>
                                        <th>L</th>
                                        <th>A</th>
                                        <th>Saved</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(s => (
                                        <tr key={s.id}>
                                            {!isMobile && <td>{s.roll_no}</td>}
                                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                                            {!isMobile && <td>{s.standards?.name}</td>}
                                            <td><button
                                                className={`attendance-btn ${attendanceMap[s.id] === 'present' ? 'active present' : ''}`}
                                                onClick={() => handleMark(s.id, 'present')}>P</button>
                                            </td>
                                            <td><button
                                                className={`attendance-btn ${attendanceMap[s.id] === 'late' ? 'active late' : ''}`}
                                                onClick={() => handleMark(s.id, 'late')}>L</button>
                                            </td>
                                            <td><button
                                                className={`attendance-btn ${attendanceMap[s.id] === 'absent' ? 'active absent' : ''}`}
                                                onClick={() => handleMark(s.id, 'absent')}>A</button>
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: attendanceMap[s.id] ? 'var(--success)' : 'var(--text-muted)' }}>
                                                {attendanceMap[s.id] || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStudents.length === 0 && <tr><td colSpan={isMobile ? 4 : 7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No students found</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function Attendance() {
    const { user } = useAuth();
    const role = user?.role;

    if (role === 'parent') return <ParentStudentAttendance user={user} />;
    if (role === 'student') return <ParentStudentAttendance user={user} />;
    return <AdminAttendance />;
}
