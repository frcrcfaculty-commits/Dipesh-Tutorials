import React, { useState, useEffect } from 'react';
import { getAttendanceByDate, getStandards, markAttendance, getStudents } from '../lib/api';
import { Calendar, Loader2 } from 'lucide-react';
import { showToast } from '../utils';

function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr() {
    return formatDate(new Date());
}

export default function Attendance() {
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [students, setStudents] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [standardFilter, setStandardFilter] = useState('All');
    const [standards, setStandards] = useState([]);
    const [selectedStandardId, setSelectedStandardId] = useState(null);

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
            for (const s of filteredStudents) {
                await markAttendance(s.id, selectedDate, status);
                setAttendanceMap(prev => ({ ...prev, [s.id]: status }));
            }
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
                        <table className="data-table">
                            <thead><tr><th>Roll</th><th>Name</th><th>Standard</th><th>P</th><th>L</th><th>A</th><th>Saved</th></tr></thead>
                            <tbody>
                                {filteredStudents.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.roll_no}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.standards?.name}</td>
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
                                {filteredStudents.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No students found</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}
