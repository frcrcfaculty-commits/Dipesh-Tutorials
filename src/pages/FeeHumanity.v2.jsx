import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getFeeSummary, getFeePayments, getFeeStructureByStandard, recordPayment } from '../lib/api';
import { IndianRupee, Calendar, Info, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { showToast } from '../utils';

export default function FeeHumanity() {
    const { user } = useAuth();
    const [summary, setSummary] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPayModal, setShowPayModal] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [paying, setPaying] = useState(false);

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [s, p] = await Promise.all([
                getFeeSummary(),
                user.role === 'parent' || user.role === 'student'
                    ? getFeePayments(user.students?.[0]?.id)
                    : Promise.resolve([]),
            ]);
            setSummary(s || []);
            setPayments(p || []);
        } catch { showToast('Failed to load', 'error'); }
        setLoading(false);
    }

    async function handlePay(e) {
        e.preventDefault();
        if (!showPayModal || !payAmount) return;
        setPaying(true);
        try {
            await recordPayment({
                student_id: showPayModal.student_id,
                amount: parseFloat(payAmount),
                payment_date: new Date().toISOString().split('T')[0],
                recorded_by: user.id,
            });
            showToast('Payment recorded!');
            setShowPayModal(null);
            setPayAmount('');
            loadAll();
        } catch (err) { showToast(err.message, 'error'); }
        setPaying(false);
    }

    const totalDemand = summary.reduce((s, f) => s + parseFloat(f.total_fees || 0), 0);
    const totalPaid = summary.reduce((s, f) => s + parseFloat(f.paid_fees || 0), 0);
    const totalBalance = totalDemand - totalPaid;
    const collectedPct = totalDemand > 0 ? Math.round((totalPaid / totalDemand) * 100) : 0;

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: 4 }}>Fee Humanity</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>Fees with context, not just numbers</p>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: 48 }}><Loader2 size={32} className="spin" /></div> : (
                <>
                    {/* Progress Ring */}
                    <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24, textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', position: 'relative', width: 140, height: 140, marginBottom: 16 }}>
                            <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="70" cy="70" r="56" fill="none" stroke="#E5E7EB" strokeWidth="12"/>
                                <circle cx="70" cy="70" r="56" fill="none" stroke="#10B981" strokeWidth="12"
                                    strokeDasharray={`${collectedPct * 3.52} 352`} strokeLinecap="round"/>
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--navy)' }}>{collectedPct}%</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>collected</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 8 }}>
                            <div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)' }}>₹{(totalPaid/1000).toFixed(0)}K</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Collected</div></div>
                            <div><div style={{ fontSize: '1.4rem', fontWeight: 700, color: totalBalance > 0 ? '#EF4444' : '#10B981' }}>₹{(totalBalance/1000).toFixed(0)}K</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</div></div>
                        </div>
                    </div>

                    {/* Context Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div style={{ background: 'linear-gradient(135deg, #F0F9FF, #EBF8FF)', borderRadius: 16, padding: 20, border: '1px solid #BFDBFE' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>👨‍🏫</div>
                            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.9rem' }}>Where fees go</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Teacher salaries, classroom materials, rent, and infrastructure that keeps daily classes running.</div>
                        </div>
                        <div style={{ background: 'linear-gradient(135deg, #FEF9EF, #FFF7E6)', borderRadius: 16, padding: 20, border: '1px solid #FDE68A' }}>
                            <div style={{ fontSize: '1.2rem', marginBottom: 6 }}>🤝</div>
                            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.9rem' }}>Can't pay right now?</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>No shame. Click "I'll pay later" to acknowledge without pressure. We'll follow up gently.</div>
                        </div>
                    </div>

                    {/* Student Breakdown */}
                    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <IndianRupee size={16} style={{ color: 'var(--navy)' }}/>
                            <h3 style={{ margin: 0, fontSize: '0.95rem' }}>Student Breakdown</h3>
                        </div>
                        {summary.length === 0 ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No fee records</div> : (
                            <div>
                                {summary.map(f => {
                                    const paid = parseFloat(f.paid_fees || 0);
                                    const total = parseFloat(f.total_fees || 0);
                                    const bal = total - paid;
                                    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
                                    const statusColor = pct >= 100 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
                                    return (
                                        <div key={f.student_id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.student_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.standard_name}</div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: bal > 0 ? '#EF4444' : '#10B981' }}>₹{bal.toLocaleString('en-IN')}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>of ₹{total.toLocaleString('en-IN')}</div>
                                                </div>
                                            </div>
                                            <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                                                <div style={{ height: '100%', width: pct + '%', background: statusColor, borderRadius: 3, transition: 'width 0.5s' }}/>
                                            </div>
                                            {bal > 0 && (
                                                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
                                                    <button className="btn-secondary btn-small" onClick={() => { showToast('Acknowledged — we will follow up soon', 'success'); }}>I'll pay later</button>
                                                    <button className="btn-gold btn-small" onClick={() => { setShowPayModal(f); setPayAmount(String(bal)); }}>Record Payment</button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {showPayModal && (
                <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Record Payment</h3></div>
                        <form onSubmit={handlePay} className="modal-body">
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>{showPayModal.student_name} — Balance: ₹{parseFloat(showPayModal.total_fees - showPayModal.paid_fees).toLocaleString('en-IN')}</div>
                                <div className="form-group"><label>Amount (₹)</label><input type="number" required value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="0" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.9rem' }}/></div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowPayModal(null)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={paying}>{paying ? 'Saving...' : 'Record'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
