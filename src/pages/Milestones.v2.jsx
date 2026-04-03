import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getStudentMilestones, acknowledgeMilestone, checkAndCreateMilestones } from '../lib/api';
import { Trophy, Star, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { showToast } from '../utils';

const MILESTONE_ICONS = {
    attendance_streak_30: { emoji: '🔥', label: '30-Day Streak!', bg: '#FFF7ED', border: '#FED7AA', color: '#EA580C' },
    first_a_plus: { emoji: '🏆', label: 'First A+!', bg: '#FEF9EF', border: '#FDE68A', color: '#D97706' },
    first_payment: { emoji: '💰', label: 'First Payment', bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A' },
    perfect_test: { emoji: '💯', label: 'Perfect Score!', bg: '#EFF6FF', border: '#BFDBFE', color: '#2563EB' },
    default: { emoji: '⭐', label: 'Milestone!', bg: '#F5F3FF', border: '#DDD6FE', color: '#7C3AED' },
};

export default function Milestones() {
    const { user } = useAuth();
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [celebrating, setCelebrating] = useState(null);
    const studentId = user?.students?.[0]?.id;

    useEffect(() => { loadMilestones(); }, [studentId]);

    async function loadMilestones() {
        if (!studentId) { setLoading(false); return; }
        setLoading(true);
        try {
            const existing = await getStudentMilestones(studentId);
            setMilestones(existing || []);
            // Check for new milestones
            const newOnes = await checkAndCreateMilestones(studentId, user.id);
            if (newOnes.length > 0) {
                setMilestones(prev => [...newOnes, ...prev]);
                setCelebrating(newOnes[0]);
            }
        } catch { showToast('Failed to load', 'error'); }
        setLoading(false);
    }

    async function handleAcknowledge(id) {
        try {
            await acknowledgeMilestone(id);
            setMilestones(prev => prev.map(m => m.id === id ? { ...m, acknowledged: true } : m));
            setCelebrating(null);
        } catch { showToast('Failed', 'error'); }
    }

    const unacknowledged = milestones.filter(m => !m.acknowledged);
    const acknowledged = milestones.filter(m => m.acknowledged);

    return (
        <div style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏆</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Milestones</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Achievements your child has earned</p>
            </div>

            {/* Confetti Celebration Modal */}
            {celebrating && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: 'white', borderRadius: 24, padding: 40, maxWidth: 400, width: '90%', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.3)', animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎉</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>New Milestone!</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#B6922E', marginBottom: 8 }}>{celebrating.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>{celebrating.description}</div>
                        <button className="btn-gold" onClick={() => handleAcknowledge(celebrating.id)} style={{ padding: '12px 32px', fontSize: '1rem', borderRadius: 12 }}>
                            <Sparkles size={16} style={{ marginRight: 8 }} /> Awesome!
                        </button>
                    </div>
                </div>
            )}

            {loading ? <div style={{ textAlign: 'center', padding: 48 }}><Loader2 size={32} className="spin" /></div> : (
                <>
                    {unacknowledged.length > 0 && (
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>Unlocked</div>
                            <div style={{ display: 'grid', gap: 12 }}>
                                {unacknowledged.map(m => {
                                    const info = MILESTONE_ICONS[m.type] || MILESTONE_ICONS.default;
                                    return (
                                        <div key={m.id} style={{ background: info.bg, border: '1px solid ' + info.border, borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                                            onClick={() => handleAcknowledge(m.id)}>
                                            <div style={{ fontSize: '2.5rem' }}>{info.emoji}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: info.color, marginBottom: 2 }}>{m.title}</div>
                                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.description}</div>
                                            </div>
                                            <div style={{ color: info.color, fontSize: '0.75rem', fontWeight: 600, background: 'white', padding: '4px 10px', borderRadius: 99, border: '1px solid ' + info.border }}>
                                                NEW
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {acknowledged.length > 0 && (
                        <div>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>Hall of Fame</div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {acknowledged.map(m => {
                                    const info = MILESTONE_ICONS[m.type] || MILESTONE_ICONS.default;
                                    return (
                                        <div key={m.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7 }}>
                                            <div style={{ fontSize: '1.6rem' }}>{info.emoji}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)' }}>{m.title}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.description}</div>
                                            </div>
                                            <CheckCircle size={16} color="#10B981"/>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {milestones.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
                            <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 4, fontSize: '1.1rem' }}>No milestones yet</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Keep attending, keep studying — your first milestone is coming!</div>
                        </div>
                    )}
                </>
            )}

            <style>{`
                @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
}
