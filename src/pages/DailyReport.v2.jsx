import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getDailyReportCard, getRecentDailyReports, getStudentWalkInData } from '../lib/api';
import { BookOpen, CheckCircle, Clock, BarChart3, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { showToast } from '../utils';

const MOOD_MAP = {
    great: { emoji: '😄', label: 'Great', color: '#10B981' },
    good: { emoji: '🙂', label: 'Good', color: '#22C55E' },
    okay: { emoji: '😐', label: 'Okay', color: '#F59E0B' },
    struggling: { emoji: '😟', label: 'Struggling', color: '#EF4444' },
};

export default function DailyReport() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [milestones, setMilestones] = useState([]);
    const studentId = user?.students?.[0]?.id;

    useEffect(() => {
        if (!studentId || !selectedDate) return;
        setLoading(true);
        Promise.all([
            getDailyReportCard(studentId, selectedDate),
            getStudentWalkInData(studentId),
        ]).then(([r, walkData]) => {
            setReport(r);
            setMilestones((walkData?.milestones || []).slice(0, 3));
        }).catch(() => { showToast('Failed to load report', 'error'); })
          .finally(() => setLoading(false));
    }, [studentId, selectedDate]);

    const att = report?.attendance;
    const moodEntry = report?.mood?.[0];
    const notes = report?.visitNotes || [];
    const tests = report?.dailyTests || [];
    const MoodInfo = moodEntry ? (MOOD_MAP[moodEntry.mood] || MOOD_MAP.okay) : null;
    const attBadge = att ? ({ present: { color: '#10B981', label: 'Present' }, late: { color: '#3B82F6', label: 'Late' }, absent: { color: '#EF4444', label: 'Absent' } })[att.status] : null;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const dateLabel = selectedDate === today ? 'Today' : selectedDate === yesterday ? 'Yesterday' : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

    const prevDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]); };
    const nextDay = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); if (d <= new Date()) setSelectedDate(d.toISOString().split('T')[0]); };

    return (
        <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <button onClick={prevDay} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8 }}><ChevronLeft size={20} /></button>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{dateLabel}</div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)' }}>{user?.students?.[0]?.name || user?.name}</div>
                    </div>
                    <button onClick={nextDay} disabled={selectedDate >= today} style={{ background: 'none', border: 'none', cursor: selectedDate >= today ? 'default' : 'pointer', padding: 8, borderRadius: 8, opacity: selectedDate >= today ? 0.3 : 1 }}><ChevronRight size={20} /></button>
                </div>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Loader2 size={32} className="spin" /></div> : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Attendance</div>
                            {attBadge ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: attBadge.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {att.status === 'present' ? <CheckCircle size={24} color={attBadge.color} /> : <Clock size={24} color={attBadge.color} />}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: attBadge.color }}>{attBadge.label}</span>
                                </div>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No record</span>}
                        </div>
                        <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>How They Felt</div>
                            {MoodInfo ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '2rem' }}>{MoodInfo.emoji}</span>
                                    <span style={{ fontWeight: 700, color: MoodInfo.color }}>{MoodInfo.label}</span>
                                </div>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Not logged</span>}
                        </div>
                    </div>

                    {tests.length > 0 && (
                        <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--border)', marginBottom: 20 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={16} /> Test Results — {tests[0].tests?.name}</div>
                            {tests.map(t => {
                                const pct = t.max_marks > 0 ? Math.round((t.marks_obtained / t.max_marks) * 100) : 0;
                                const col = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
                                return (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.9rem' }}>{t.subjects?.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontWeight: 700, color: col }}>{pct}%</span>
                                            <span style={{ background: col, color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{t.grade}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {notes.length > 0 && (
                        <div style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid var(--border)', marginBottom: 20 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={16} /> Notes from Today</div>
                            {notes.map(n => (
                                <div key={n.id} style={{ padding: '10px 12px', background: 'var(--surface-raised)', borderRadius: 10, marginBottom: 8, fontSize: '0.88rem' }}>
                                    <span style={{ fontSize: '0.72rem', background: '#0A2351', color: 'white', padding: '1px 8px', borderRadius: 99, marginRight: 6 }}>{n.note_type || 'note'}</span>
                                    {n.note_text}
                                </div>
                            ))}
                        </div>
                    )}

                    {milestones.length > 0 && (
                        <div style={{ background: 'linear-gradient(135deg, #FEF9EF, #FFF7E6)', borderRadius: 16, padding: 20, border: '1px solid #B6922E33', marginBottom: 20 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#B6922E', marginBottom: 12 }}>Recent Achievements</div>
                            {milestones.map(m => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <span style={{ fontSize: '1.4rem' }}>🏆</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{m.title}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {(!att && !MoodInfo && notes.length === 0 && tests.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
                            <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>No activity on {dateLabel}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Check back after classes end today</div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
