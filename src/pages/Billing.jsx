import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useData } from '../App';
import { getStudents, getFeePayments, recordPayment, getAllFeePayments, getFeeStructures, getFeeStructureByStandard } from '../lib/api';
import { IndianRupee, AlertCircle, Search, Download, Plus, X, Save, CheckCircle, FileText } from 'lucide-react';
import { exportCSV, showToast } from '../utils';
import { generateFeeReportPDF } from '../reports';

function ParentBilling({ user }) {
    const child = user.child;
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feeInfo, setFeeInfo] = useState(null);

    useEffect(() => {
        if (!child) return;
        Promise.all([
            getFeePayments(child.id),
            getFeeStructureByStandard(child.standard_id),
        ]).then(([pays, feeData]) => {
            setPayments(pays || []);
            setFeeInfo(feeData);
            setLoading(false);
        });
    }, [child]);

    if (!child) return <div className="empty-state"><h3>No student linked</h3></div>;

    const totalFees = feeInfo?.total_amount || 0;
    const paidFees = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const balance = totalFees - paidFees;

    return (
        <>
            <div className="fee-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Fees</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>₹{totalFees.toLocaleString('en-IN')}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Paid</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>₹{paidFees.toLocaleString('en-IN')}</div>
                </div>
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{balance.toLocaleString('en-IN')}</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>Payment History</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? <div className="empty-state"><div className="spinner" /></div> : (
                        <table className="data-table">
                            <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Receipt</th></tr></thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p.id}>
                                        <td>{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                                        <td>{p.payment_method}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.receipt_no || '—'}</td>
                                    </tr>
                                ))}
                                {payments.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No payments recorded yet.</td></tr>}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

function AdminBilling() {
    const { standards } = useData();
    const [students, setStudents] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [allPayments, setAllPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [standardFilter, setStandardFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showPayment, setShowPayment] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState('cash');
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [studs, fees, pays] = await Promise.all([
                getStudents(),
                getFeeStructures(),
                getAllFeePayments(),
            ]);
            setStudents(studs || []);
            setFeeStructures(fees || []);
            setAllPayments(pays || []);
        } catch (err) { showToast(err.message, 'error'); }
        setLoading(false);
    }

    const studentFees = useMemo(() => {
        return students.map(s => {
            const structure = feeStructures.find(f => f.standard_id === s.standard_id);
            const totalFees = structure ? parseFloat(structure.total_amount) : 0;
            const payments = allPayments.filter(p => p.student_id === s.id);
            const paidFees = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
            const balance = totalFees - paidFees;
            const status = paidFees >= totalFees ? 'paid' : paidFees > 0 ? 'pending' : 'overdue';
            return { ...s, totalFees, paidFees, balance, feeStatus: status };
        });
    }, [students, feeStructures, allPayments]);

    const filtered = useMemo(() => {
        return studentFees.filter(s => {
            if (standardFilter !== 'All' && s.standard_id !== parseInt(standardFilter)) return false;
            if (statusFilter !== 'All' && s.feeStatus !== statusFilter) return false;
            if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [studentFees, standardFilter, statusFilter, search]);

    const totalPending = filtered.filter(s => s.feeStatus !== 'paid').reduce((sum, s) => sum + s.balance, 0);

    const handleRecordPayment = async () => {
        if (!payAmount || parseFloat(payAmount) <= 0) { showToast('Enter valid amount', 'error'); return; }
        setSaving(true);
        try {
            await recordPayment({
                student_id: showPayment.id,
                amount: parseFloat(payAmount),
                payment_method: payMethod,
                receipt_no: `RCP-${Date.now()}`,
                recorded_by: user.id,
            });
            showToast(`₹${payAmount} payment recorded for ${showPayment.name}`);
            setShowPayment(null);
            setPayAmount('');
            loadData();
        } catch (err) { showToast(err.message, 'error'); }
        setSaving(false);
    };

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card gold"><div className="stat-icon gold"><IndianRupee size={24} /></div><div className="stat-info"><h4>Total Students</h4><div className="stat-value">{studentFees.length}</div></div></div>
                <div className="stat-card red"><div className="stat-icon red"><AlertCircle size={24} /></div><div className="stat-info"><h4>Pending Amount</h4><div className="stat-value">₹{(totalPending / 1000).toFixed(0)}K</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><CheckCircle size={24} /></div><div className="stat-info"><h4>Fully Paid</h4><div className="stat-value">{studentFees.filter(s => s.feeStatus === 'paid').length}</div></div></div>
                <div className="stat-card navy"><div className="stat-icon navy"><AlertCircle size={24} /></div><div className="stat-info"><h4>Overdue</h4><div className="stat-value">{studentFees.filter(s => s.feeStatus === 'overdue').length}</div></div></div>
            </div>

            <div className="search-bar">
                <div className="search-input"><Search /><input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <div className="filter-chips">
                    {['All', 'paid', 'pending', 'overdue'].map(s => (
                        <button key={s} className={`filter-chip ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                            {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="select-wrapper">
                    <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}>
                        <option value="All">All Standards</option>
                        {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Fee Records ({filtered.length})</h3>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary btn-small" onClick={() => {
                            exportCSV('fees', ['Student', 'Standard', 'Total', 'Paid', 'Balance', 'Status'],
                                filtered.map(s => [s.name, s.standards?.name, s.totalFees, s.paidFees, s.balance, s.feeStatus]));
                            showToast('CSV exported!');
                        }}><Download size={14} /> CSV</button>
                        <button className="btn-gold btn-small" onClick={() => {
                            generateFeeReportPDF(filtered.map(s => ({
                                name: s.name, standard: s.standards?.name || '', totalFees: s.totalFees,
                                paidFees: s.paidFees, feeStatus: s.feeStatus
                            })));
                            showToast('PDF report generated!');
                        }}><FileText size={14} /> PDF</button>
                    </div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? <div className="empty-state"><div className="spinner" /></div> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead><tr><th>Student</th><th>Standard</th><th>Total</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {filtered.slice(0, 50).map(s => (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>{s.name}</td>
                                            <td>{s.standards?.name}</td>
                                            <td>₹{s.totalFees.toLocaleString('en-IN')}</td>
                                            <td style={{ color: 'var(--success)' }}>₹{s.paidFees.toLocaleString('en-IN')}</td>
                                            <td style={{ color: s.balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>₹{s.balance.toLocaleString('en-IN')}</td>
                                            <td><span className={`badge ${s.feeStatus}`}>{s.feeStatus}</span></td>
                                            <td>
                                                {s.feeStatus !== 'paid' && (
                                                    <button className="btn-gold btn-small" style={{ fontSize: '0.7rem', padding: '4px 10px' }}
                                                        onClick={() => { setShowPayment(s); setPayAmount(''); }}>
                                                        <Plus size={12} /> Record Payment
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="modal-overlay" onClick={() => setShowPayment(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header"><h3>Record Payment</h3><button onClick={() => setShowPayment(null)} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button></div>
                        <div className="modal-body">
                            <p style={{ marginBottom: 16 }}>Recording payment for <strong>{showPayment.name}</strong> (Balance: ₹{showPayment.balance.toLocaleString('en-IN')})</p>
                            <div className="form-group">
                                <label>Amount (₹) *</label>
                                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                    placeholder="Enter amount" min="1" max={showPayment.balance}
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div className="form-group">
                                <label>Payment Method</label>
                                <div className="select-wrapper">
                                    <select value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                                        {['cash', 'upi', 'bank_transfer', 'cheque'].map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button className="btn-primary" onClick={handleRecordPayment} disabled={saving}>
                                <Save size={16} /> {saving ? 'Saving...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function Billing() {
    const { user } = useAuth();
    if (user.role === 'parent') return <ParentBilling user={user} />;
    return <AdminBilling />;
}
