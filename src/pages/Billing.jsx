import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getFeeSummary, getFeeStructures, recordPayment, getStandards } from '../lib/api';
import { IndianRupee, Download, Plus, X, Loader2 } from 'lucide-react';
import { exportCSV, showToast } from '../utils';
import { generateFeeReportPDF } from '../reports';

export default function Billing() {
    const { user } = useAuth();
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [saving, setSaving] = useState(false);
    const [standardFilter, setStandardFilter] = useState('All');
    const [standards, setStandards] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const [feeData, stds] = await Promise.all([
                getFeeSummary(standardFilter !== 'All' ? { standardName: standardFilter } : {}),
                getStandards(),
            ]);
            setFees(feeData || []);
            setStandards(stds || []);
        } catch (err) {
            showToast('Failed to load: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        // Re-fetch fees when standard filter changes
        load();
    }, [standardFilter]);

    const filtered = standardFilter === 'All' ? fees : fees.filter(f => f.standard_name === standardFilter);
    const totalDemand = filtered.reduce((s, f) => s + parseFloat(f.total_fees || 0), 0);
    const totalCollected = filtered.reduce((s, f) => s + parseFloat(f.paid_fees || 0), 0);
    const totalPending = totalDemand - totalCollected;

    const openPay = (f) => {
        setSelectedStudent({ ...f, payment_amount: '' });
        setShowModal(true);
    };

    const handlePay = async (e) => {
        e.preventDefault();
        const amount = parseFloat(selectedStudent.payment_amount);
        if (!amount || amount <= 0) return;
        if (amount > selectedStudent.balance) {
            showToast(`Amount cannot exceed balance of ₹${parseFloat(selectedStudent.balance || 0).toLocaleString('en-IN')}`, 'error');
            return;
        }
        setSaving(true);
        try {
            await recordPayment({
                student_id: selectedStudent.student_id,
                amount,
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'cash',
                recorded_by: user.id,
            });
            showToast('Payment recorded!');
            setShowModal(false);
            load();
        } catch (err) {
            showToast(err.message || 'Failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleExportPDF = () => {
        if (filtered.length === 0) { showToast('No data'); return; }
        generateFeeReportPDF(filtered);
    };

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy"><div className="stat-icon navy"><IndianRupee size={24} /></div><div className="stat-info"><h4>Total Demand</h4><div className="stat-value">Rs.{totalDemand.toLocaleString('en-IN')}</div></div></div>
                <div className="stat-card green"><div className="stat-icon green"><IndianRupee size={24} /></div><div className="stat-info"><h4>Collected</h4><div className="stat-value">Rs.{totalCollected.toLocaleString('en-IN')}</div></div></div>
                <div className="stat-card red"><div className="stat-icon red"><IndianRupee size={24} /></div><div className="stat-info"><h4>Pending</h4><div className="stat-value">Rs.{totalPending.toLocaleString('en-IN')}</div></div></div>
            </div>
            <div className="card">
                <div className="card-header"><h3>Fee Collection ({filtered.length})</h3>
                    <button className="btn-secondary btn-small" onClick={handleExportPDF} aria-label="Export PDF"><Download size={14} /> PDF Report</button>
                </div>
                <div className="card-filter-bar">
                    <div className="select-wrapper"><select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}><option value="All">All Standards</option>{standards.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                </div>
                <div className="card-body card-body-flush">
                    <div className="table-scroll">
                        <table className="data-table">
                            <thead><tr>
                                <th>Name</th>
                                {!isMobile && <th>Standard</th>}
                                {!isMobile && <th>Total</th>}
                                {!isMobile && <th>Paid</th>}
                                <th>Balance</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr></thead>
                            <tbody>
                                {filtered.map(f => (
                                    <tr key={f.student_id}>
                                        <td className="td-bold">{f.student_name}</td>
                                        {!isMobile && <td>{f.standard_name}</td>}
                                        {!isMobile && <td>Rs.{parseFloat(f.total_fees || 0).toLocaleString('en-IN')}</td>}
                                        {!isMobile && <td className="text-success">Rs.{parseFloat(f.paid_fees || 0).toLocaleString('en-IN')}</td>}
                                        <td className={`td-bold ${f.balance > 0 ? 'text-danger' : 'text-success'}`}>Rs.{parseFloat(f.balance || 0).toLocaleString('en-IN')}</td>
                                        <td><span className={`badge ${f.status || 'pending'}`}>{f.status || 'pending'}</span></td>
                                        <td><button className="btn-gold btn-small" onClick={() => openPay(f)} aria-label="Record payment"><Plus size={12} /> Record Payment</button></td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && <tr><td colSpan={7} className="td-empty">No records found</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {showModal && selectedStudent && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Record Payment — {selectedStudent.student_name}</h3><button className="icon-btn" onClick={() => setShowModal(false)} aria-label="Close"><X size={18} /></button></div>
                        <form onSubmit={handlePay} className="modal-body">
                            <div className="balance-display">
                                <div className="balance-label">Balance Due</div>
                                <div className="balance-amount">Rs.{parseFloat(selectedStudent.balance || 0).toLocaleString('en-IN')}</div>
                            </div>
                            <div className="form-group"><label>Amount (Rs.) *</label><input type="number" required min="1" max={selectedStudent.balance || 999999} value={selectedStudent.payment_amount} onChange={e => setSelectedStudent(p => ({ ...p, payment_amount: e.target.value }))} placeholder="Enter amount" /></div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .card-filter-bar {
                    padding: 12px 20px;
                    border-bottom: 1px solid var(--border);
                }
                .card-body-flush {
                    padding: 0;
                }
                .table-scroll {
                    overflow-x: auto;
                }
                .td-bold {
                    font-weight: 600;
                }
                .text-success {
                    color: var(--success);
                }
                .text-danger {
                    color: var(--danger);
                }
                .td-empty {
                    text-align: center;
                    padding: 32px;
                    color: var(--text-muted);
                }
                .balance-display {
                    background: var(--surface-raised, #f8f9fa);
                    border-radius: var(--radius-md, 10px);
                    padding: 16px;
                    margin-bottom: 16px;
                }
                .balance-label {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    margin-bottom: 4px;
                }
                .balance-amount {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--danger);
                }
            `}</style>
        </>
    );
}
