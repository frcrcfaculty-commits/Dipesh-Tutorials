import React, { useState, useMemo } from 'react';
import { STUDENTS, STANDARDS } from '../data';
import { Search, Users, Download } from 'lucide-react';

export default function Students() {
    const [search, setSearch] = useState('');
    const [standardFilter, setStandardFilter] = useState('All');
    const [feeFilter, setFeeFilter] = useState('All');

    const filtered = useMemo(() => {
        return STUDENTS.filter(s => {
            if (standardFilter !== 'All' && s.standard !== standardFilter) return false;
            if (feeFilter !== 'All' && s.feeStatus !== feeFilter) return false;
            if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [search, standardFilter, feeFilter]);

    return (
        <>
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><Users size={24} /></div>
                    <div className="stat-info">
                        <h4>Total Students</h4>
                        <div className="stat-value">{STUDENTS.length}</div>
                    </div>
                </div>
                {STANDARDS.slice(0, 3).map((std) => (
                    <div key={std} className="stat-card gold">
                        <div className="stat-icon gold"><Users size={24} /></div>
                        <div className="stat-info">
                            <h4>{std} Standard</h4>
                            <div className="stat-value">{STUDENTS.filter(s => s.standard === std).length}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="search-bar">
                <div className="search-input">
                    <Search />
                    <input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="select-wrapper">
                    <select value={standardFilter} onChange={e => setStandardFilter(e.target.value)}>
                        <option value="All">All Standards</option>
                        {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="filter-chips">
                    {['All', 'paid', 'pending', 'overdue'].map(s => (
                        <button key={s} className={`filter-chip ${feeFilter === s ? 'active' : ''}`} onClick={() => setFeeFilter(s)}>
                            {s === 'All' ? 'All Fees' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>Students ({filtered.length})</h3>
                    <button className="btn-secondary btn-small"><Download size={14} /> Export</button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Standard</th>
                                    <th>Roll No</th>
                                    <th>Attendance</th>
                                    <th>Fee Status</th>
                                    <th>Parent</th>
                                    <th>Contact</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.slice(0, 50).map(s => (
                                    <tr key={s.id}>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.id}</td>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td>{s.standard}</td>
                                        <td>{s.rollNo}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="progress-bar" style={{ width: 60, height: 6 }}>
                                                    <div className={`progress-fill ${s.attendancePercent >= 80 ? 'green' : s.attendancePercent >= 60 ? 'gold' : 'red'}`}
                                                        style={{ width: `${s.attendancePercent}%` }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.attendancePercent}%</span>
                                            </div>
                                        </td>
                                        <td><span className={`badge ${s.feeStatus}`}>{s.feeStatus}</span></td>
                                        <td style={{ fontSize: '0.85rem' }}>{s.parentName}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.parentPhone}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length > 50 && (
                        <p style={{ textAlign: 'center', padding: 16, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Showing 50 of {filtered.length} students. Use search to find specific students.
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
