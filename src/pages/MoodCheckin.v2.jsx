import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { recordMood, getMoodHistory, getClassMoodByDate } from '../lib/api';
import { Loader2 } from 'lucide-react';
import { showToast } from '../utils';

const MOODS = [
    { key: 'great', emoji: '😄', label: 'Great', color: '#10B981', bg: '#D1FAE5' },
    { key: 'good', emoji: '🙂', label: 'Good', color: '#22C55E', bg: '#DCFCE7' },
    { key: 'okay', emoji: '😐', label: 'Okay', color: '#F59E0B', bg: '#FEF3C7' },
    { key: 'struggling', emoji: '😟', label: 'Struggling', color: '#EF4444', bg: '#FEE2E2' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MoodCheckin() {
    const { user } = useAuth();
    const [selectedMood, setSelectedMood] = useState(null);
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    useEffect(() => { loadHistory(); }, []);

    async function loadHistory() {
        setLoading(true);
        try {
            if (isAdmin) {
                const today = new Date().toISOString().split('T')[0];
                const moods = await getClassMoodByDate(today);
                setHistory(moods);
            } else {
                const h = await getMoodHistory(user.students?.[0]?.id, 30);
                setHistory(h);
            }
        } catch { showToast('Failed to load moods', 'error'); }
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedMood) return;
        setSaving(true);
        try {
            await recordMood(user.students?.[0]?.id, selectedMood, note);
            showToast('Mood logged — thanks for sharing!');
            setSelectedMood(null);
            setNote('');
            loadHistory();
        } catch { showToast('Failed to save', 'error'); }
        setSaving(false);
    }

    // Build last 7 days grid
    const today = new Date();
    const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today); d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });
    const moodByDate = {};
    history.forEach(m => {
        const d = (m.created_at || '').slice(0, 10);
        if (!moodByDate[d]) moodByDate[d] = [];
        moodByDate[d].push(m);
    });

    const emojiCount = {};
    history.forEach(m => { emojiCount[m.mood] = (emojiCount[m.mood] || 0) + 1; });

    if (isAdmin) {
        return (
            <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Class Mood Today</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>How students are feeling right now</p>
                {loading ? <div style={{ textAlign: 'center', padding: 48 }}><Loader2 size={32} className="spin" /></div> : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                            {MOODS.map(m => {
                                const count = Object.values(moodByDate).flat().filter(e => e.mood === m.key).length;
                                return (
                                    <div key={m.key} style={{ background: m.bg, borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid ' + m.color + '33' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: 4 }}>{m.emoji}</div>
                                        <div style={{ fontWeight: 700, color: m.color, fontSize: '1.4rem' }}>{count}</div>
                                        <div style={{ fontSize: '0.75rem', color: m.color }}>{m.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.9rem' }}>Individual Students</div>
                            {Object.entries(moodByDate).map(([date, entries]) => (
                                <div key={date} style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{date}</div>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {entries.map((e, i) => {
                                            const mood = MOODS.find(m => m.key === e.mood) || MOODS[2];
                                            return (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: mood.bg, padding: '4px 10px', borderRadius: 99 }}>
                                                    <span>{mood.emoji}</span>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: mood.color }}>{e.students?.name || 'Student'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {Object.keys(moodByDate).length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No mood data yet today</div>}
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4 }}>How are you feeling?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 32 }}>Two seconds. Completely private.</p>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
                    {MOODS.map(m => (
                        <button type="button" key={m.key} onClick={() => setSelectedMood(m.key)}
                            style={{ padding: '24px 16px', borderRadius: 20, border: '2px solid ' + (selectedMood === m.key ? m.color : 'var(--border)'),
                                background: selectedMood === m.key ? m.bg : 'white', cursor: 'pointer', transition: 'all 0.2s', boxShadow: selectedMood === m.key ? '0 4px 16px ' + m.color + '33' : 'none' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{m.emoji}</div>
                            <div style={{ fontWeight: 700, color: selectedMood === m.key ? m.color : 'var(--text)', fontSize: '1rem' }}>{m.label}</div>
                        </button>
                    ))}
                </div>

                {selectedMood && (
                    <div style={{ marginBottom: 20, animation: 'fadeSlideUp 0.3s ease' }}>
                        <textarea value={note} onChange={e => setNote(e.target.value)}
                            placeholder="Anything to share? (optional)"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '0.9rem', minHeight: 80, resize: 'none', boxSizing: 'border-box' }}/>
                    </div>
                )}

                <button type="submit" className="btn-primary" disabled={!selectedMood || saving}
                    style={{ padding: '14px 40px', fontSize: '1rem', borderRadius: 12 }}>
                    {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : 'Submit'}
                </button>
            </form>

            {history.length > 0 && (
                <div style={{ marginTop: 40, textAlign: 'left' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-muted)' }}>YOUR LAST 7 DAYS</h3>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {last7.map(d => {
                            const entries = moodByDate[d] || [];
                            const latest = entries[0];
                            const mood = latest ? MOODS.find(m => m.key === latest.mood) : null;
                            const dayName = WEEKDAYS[new Date(d + 'T12:00:00').getDay()];
                            return (
                                <div key={d} style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{dayName}</div>
                                    <div style={{ height: 40, background: mood ? mood.bg : '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                        {mood ? mood.emoji : '—'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
