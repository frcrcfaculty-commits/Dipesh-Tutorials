import React, { useState } from 'react';
import { useAuth } from '../App';
import { STUDENTS, FINANCIAL_DATA, INVENTORY, STANDARDS } from '../data';
import { IndianRupee, TrendingUp, TrendingDown, Package, Search, Download, Plus, X, AlertCircle, BookOpen, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { exportCSV, showToast } from '../utils';

const COLORS = ['#0A2351', '#B6922E', '#10B981', '#3B82F6', '#EF4444'];

function ParentBilling({ user }) {
    const child = user.child || STUDENTS[0];
    const installments = [
        { term: 'Term 1 (Jun–Sep)', amount: Math.floor(child.totalFees / 3), status: 'paid', date: '2025-06-15' },
        { term: 'Term 2 (Oct–Jan)', amount: Math.floor(child.totalFees / 3), status: child.feeStatus === 'paid' ? 'paid' : 'pending', date: '2025-10-15' },
        { term: 'Term 3 (Feb–May)', amount: child.totalFees - 2 * Math.floor(child.totalFees / 3), status: child.feeStatus === 'overdue' ? 'overdue' : child.feeStatus === 'pending' ? 'pending' : 'paid', date: '2026-02-15' },
    ];

    return (
        <>
            <div className="fee-summary">
                <div className="fee-card">
                    <div className="fee-label">Total Fees</div>
                    <div className="fee-amount" style={{ color: 'var(--navy)' }}>₹{child.totalFees.toLocaleString('en-IN')}</div>
                    <div className="fee-label">{child.standard} Standard</div>
                </div>
                <div className="fee-card">
                    <div className="fee-label">Amount Paid</div>
                    <div className="fee-amount" style={{ color: 'var(--success)' }}>₹{child.paidFees.toLocaleString('en-IN')}</div>
                    <div className="progress-bar" style={{ marginTop: 8, height: 8 }}>
                        <div className="progress-fill green" style={{ width: `${child.paidFees / child.totalFees * 100}%` }} />
                    </div>
                </div>
                <div className="fee-card">
                    <div className="fee-label">Balance Due</div>
                    <div className="fee-amount" style={{ color: child.totalFees - child.paidFees > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{(child.totalFees - child.paidFees).toLocaleString('en-IN')}</div>
                    <span className={`badge ${child.feeStatus}`}>{child.feeStatus}</span>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>Payment History</h3></div>
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead><tr><th>Installment</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
                        <tbody>
                            {installments.map((inst, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{inst.term}</td>
                                    <td>₹{inst.amount.toLocaleString('en-IN')}</td>
                                    <td>{inst.date}</td>
                                    <td><span className={`badge ${inst.status}`}>{inst.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function AdminBilling() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [standardFilter, setStandardFilter] = useState('All');

    const filteredStudents = STUDENTS.filter(s => {
        if (statusFilter !== 'All' && s.feeStatus !== statusFilter) return false;
        if (standardFilter !== 'All' && s.standard !== standardFilter) return false;
        if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }).slice(0, 50);

    const pendingCount = STUDENTS.filter(s => s.feeStatus === 'pending').length;
    const overdueCount = STUDENTS.filter(s => s.feeStatus === 'overdue').length;
    const totalPending = STUDENTS.filter(s => s.feeStatus !== 'paid').reduce((sum, s) => sum + (s.totalFees - s.paidFees), 0);

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card gold"><div className="stat-icon gold"><IndianRupee size={24} /></div><div className="stat-info"><h4>Collected (This Month)</h4><div className="stat-value">₹{(FINANCIAL_DATA.collectedThisMonth / 1000).toFixed(0)}K</div></div></div>
                <div className="stat-card red"><div className="stat-icon red"><AlertCircle size={24} /></div><div className="stat-info"><h4>Total Pending</h4><div className="stat-value">₹{(totalPending / 1000).toFixed(0)}K</div></div></div>
                <div className="stat-card navy"><div className="stat-icon navy"><TrendingDown size={24} /></div><div className="stat-info"><h4>Pending Students</h4><div className="stat-value">{pendingCount}</div></div></div>
                <div className="stat-card blue"><div className="stat-icon blue"><AlertCircle size={24} /></div><div className="stat-info"><h4>Overdue</h4><div className="stat-value">{overdueCount}</div></div></div>
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
                        {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>Student Fee Records</h3><button className="btn-secondary btn-small" onClick={() => {
                    exportCSV('fee_records', ['Student', 'ID', 'Standard', 'Total Fees', 'Paid', 'Balance', 'Status'],
                        filteredStudents.map(s => [s.name, s.id, s.standard, s.totalFees, s.paidFees, s.totalFees - s.paidFees, s.feeStatus]));
                    showToast('Fee records exported!');
                }}><Download size={14} /> Export</button></div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>Student</th><th>Standard</th><th>Total Fees</th><th>Paid</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                {filteredStudents.map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.name}<br /><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.id}</span></td>
                                        <td>{s.standard}</td>
                                        <td>₹{s.totalFees.toLocaleString('en-IN')}</td>
                                        <td style={{ color: 'var(--success)' }}>₹{s.paidFees.toLocaleString('en-IN')}</td>
                                        <td style={{ color: s.totalFees - s.paidFees > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>₹{(s.totalFees - s.paidFees).toLocaleString('en-IN')}</td>
                                        <td><span className={`badge ${s.feeStatus}`}>{s.feeStatus}</span></td>
                                        <td>
                                            {s.feeStatus !== 'paid' && <button className="btn-gold btn-small" style={{ fontSize: '0.7rem', padding: '4px 10px' }} onClick={(e) => { e.stopPropagation(); showToast(`Fee reminder sent to ${s.parentName}!`); }}>Send Reminder</button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

function SuperAdminBilling() {
    const [tab, setTab] = useState('overview');

    const totalInventoryRevenue = INVENTORY.reduce((s, i) => s + i.sold * i.price, 0);
    const totalInventoryCost = INVENTORY.reduce((s, i) => s + i.sold * i.cost, 0);
    const inventoryProfit = totalInventoryRevenue - totalInventoryCost;

    return (
        <>
            <div className="tabs">
                <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>P&L Overview</button>
                <button className={`tab ${tab === 'fees' ? 'active' : ''}`} onClick={() => setTab('fees')}>Fee Management</button>
                <button className={`tab ${tab === 'inventory' ? 'active' : ''}`} onClick={() => setTab('inventory')}>Inventory</button>
            </div>

            {tab === 'overview' && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card green"><div className="stat-icon green"><TrendingUp size={24} /></div><div className="stat-info"><h4>Total Revenue</h4><div className="stat-value">₹{(FINANCIAL_DATA.totalRevenue / 100000).toFixed(1)}L</div></div></div>
                        <div className="stat-card red"><div className="stat-icon red"><TrendingDown size={24} /></div><div className="stat-info"><h4>Total Expenses</h4><div className="stat-value">₹{(FINANCIAL_DATA.totalExpenses / 100000).toFixed(1)}L</div></div></div>
                        <div className="stat-card navy"><div className="stat-icon navy"><IndianRupee size={24} /></div><div className="stat-info"><h4>Net Profit</h4><div className="stat-value">₹{(FINANCIAL_DATA.netProfit / 100000).toFixed(1)}L</div><span className="stat-change up">↑ Healthy</span></div></div>
                        <div className="stat-card gold"><div className="stat-icon gold"><Package size={24} /></div><div className="stat-info"><h4>Inventory Profit</h4><div className="stat-value">₹{(inventoryProfit / 1000).toFixed(0)}K</div></div></div>
                    </div>

                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header"><h3>Monthly Revenue vs Expenses</h3></div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={FINANCIAL_DATA.monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="month" fontSize={12} />
                                        <YAxis fontSize={12} tickFormatter={v => `₹${v / 1000}K`} />
                                        <Tooltip formatter={v => `₹${v.toLocaleString('en-IN')}`} />
                                        <Bar dataKey="revenue" fill="#0A2351" radius={[4, 4, 0, 0]} name="Revenue" />
                                        <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="card">
                            <div className="card-header"><h3>Expense Breakdown</h3></div>
                            <div className="card-body">
                                {FINANCIAL_DATA.expenses.map((exp, i) => (
                                    <div key={i} style={{ marginBottom: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{exp.category}</span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>₹{exp.amount.toLocaleString('en-IN')} ({exp.percentage}%)</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill navy" style={{ width: `${exp.percentage}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {tab === 'fees' && <AdminBilling />}

            {tab === 'inventory' && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card navy"><div className="stat-icon navy"><Package size={24} /></div><div className="stat-info"><h4>Total Items</h4><div className="stat-value">{INVENTORY.length}</div></div></div>
                        <div className="stat-card green"><div className="stat-icon green"><ShoppingBag size={24} /></div><div className="stat-info"><h4>Items Sold</h4><div className="stat-value">{INVENTORY.reduce((s, i) => s + i.sold, 0)}</div></div></div>
                        <div className="stat-card gold"><div className="stat-icon gold"><IndianRupee size={24} /></div><div className="stat-info"><h4>Revenue</h4><div className="stat-value">₹{(totalInventoryRevenue / 1000).toFixed(0)}K</div></div></div>
                        <div className="stat-card blue"><div className="stat-icon blue"><TrendingUp size={24} /></div><div className="stat-info"><h4>Profit</h4><div className="stat-value">₹{(inventoryProfit / 1000).toFixed(0)}K</div></div></div>
                    </div>

                    <div className="card">
                        <div className="card-header"><h3>Inventory Items</h3><button className="btn-gold btn-small" onClick={() => showToast('Add Item feature — connect to your inventory system', 'info')}><Plus size={14} /> Add Item</button></div>
                        <div className="card-body" style={{ padding: 0 }}>
                            <table className="data-table">
                                <thead><tr><th>Item</th><th>Category</th><th>Stock</th><th>Sold</th><th>Price</th><th>Cost</th><th>Profit</th></tr></thead>
                                <tbody>
                                    {INVENTORY.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                                            <td><span className="resource-tag">{item.category}</span></td>
                                            <td>{item.quantity - item.sold}</td>
                                            <td>{item.sold}</td>
                                            <td>₹{item.price}</td>
                                            <td>₹{item.cost}</td>
                                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>₹{((item.price - item.cost) * item.sold).toLocaleString('en-IN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

export default function Billing() {
    const { user } = useAuth();
    if (user.role === 'parent') return <ParentBilling user={user} />;
    if (user.role === 'superadmin') return <SuperAdminBilling />;
    return <AdminBilling />;
}
