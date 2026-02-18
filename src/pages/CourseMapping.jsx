import React, { useState } from 'react';
import { useAuth } from '../App';
import { COURSE_OUTCOMES, STANDARDS, SUBJECTS_BY_STANDARD } from '../data';
import { GitBranch, BarChart3, Target, Award } from 'lucide-react';

export default function CourseMapping() {
    const { user } = useAuth();
    const availableStandards = Object.keys(COURSE_OUTCOMES);
    const [selectedStandard, setSelectedStandard] = useState(availableStandards[0] || '10th');
    const [selectedSubject, setSelectedSubject] = useState('');

    const standardCOs = COURSE_OUTCOMES[selectedStandard] || {};
    const subjects = Object.keys(standardCOs);
    const activeSubject = selectedSubject || subjects[0] || '';
    const outcomes = standardCOs[activeSubject] || [];

    const avgAttainment = outcomes.length > 0 ? Math.round(outcomes.reduce((s, o) => s + o.attainment, 0) / outcomes.length) : 0;

    const getLevel = (val) => val >= 75 ? 'high' : val >= 50 ? 'medium' : 'low';
    const getLevelLabel = (val) => val >= 75 ? 'Achieved' : val >= 50 ? 'Partially' : 'Below Target';

    return (
        <>
            {/* Standard & Subject Selector */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div className="select-wrapper" style={{ minWidth: 200 }}>
                    <select value={selectedStandard} onChange={e => { setSelectedStandard(e.target.value); setSelectedSubject(''); }}>
                        {availableStandards.map(s => <option key={s} value={s}>{s} Standard</option>)}
                    </select>
                </div>
                <div className="filter-chips">
                    {subjects.map(sub => (
                        <button key={sub} className={`filter-chip ${(activeSubject === sub) ? 'active' : ''}`}
                            onClick={() => setSelectedSubject(sub)}>
                            {sub}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="stats-grid">
                <div className="stat-card navy">
                    <div className="stat-icon navy"><GitBranch size={24} /></div>
                    <div className="stat-info">
                        <h4>Course Outcomes</h4>
                        <div className="stat-value">{outcomes.length}</div>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green"><Target size={24} /></div>
                    <div className="stat-info">
                        <h4>Avg Attainment</h4>
                        <div className="stat-value">{avgAttainment}%</div>
                    </div>
                </div>
                <div className="stat-card gold">
                    <div className="stat-icon gold"><Award size={24} /></div>
                    <div className="stat-info">
                        <h4>Above 75%</h4>
                        <div className="stat-value">{outcomes.filter(o => o.attainment >= 75).length}</div>
                    </div>
                </div>
                <div className="stat-card red">
                    <div className="stat-icon red"><BarChart3 size={24} /></div>
                    <div className="stat-info">
                        <h4>Below 50%</h4>
                        <div className="stat-value">{outcomes.filter(o => o.attainment < 50).length}</div>
                    </div>
                </div>
            </div>

            {/* CO Details */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header"><h3>{activeSubject} — Course Outcome Attainment</h3></div>
                <div className="card-body">
                    {outcomes.map((co) => (
                        <div key={co.id} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div>
                                    <span style={{
                                        display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)',
                                        background: 'rgba(10,35,81,0.08)', color: 'var(--navy)', fontSize: '0.75rem',
                                        fontWeight: 700, marginRight: 8
                                    }}>
                                        {co.id}
                                    </span>
                                    <span style={{ fontWeight: 600 }}>{co.description}</span>
                                </div>
                                <span className={`badge ${getLevel(co.attainment) === 'high' ? 'present' : getLevel(co.attainment) === 'medium' ? 'late' : 'absent'}`}>
                                    {getLevelLabel(co.attainment)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="progress-bar" style={{ flex: 1, height: 12 }}>
                                    <div className={`progress-fill ${getLevel(co.attainment) === 'high' ? 'green' : getLevel(co.attainment) === 'medium' ? 'gold' : 'red'}`}
                                        style={{ width: `${co.attainment}%` }} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--navy)', fontFamily: 'var(--font-heading)', minWidth: 45, textAlign: 'right' }}>
                                    {co.attainment}%
                                </span>
                            </div>
                        </div>
                    ))}

                    {outcomes.length === 0 && (
                        <div className="empty-state">
                            <GitBranch /><h3>No course outcomes defined</h3><p>Select a different standard or subject.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Heatmap Overview */}
            {subjects.length > 0 && (
                <div className="card">
                    <div className="card-header"><h3>Attainment Heatmap — {selectedStandard} Standard</h3></div>
                    <div className="card-body">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        {[...Array(4)].map((_, i) => <th key={i}>CO{i + 1}</th>)}
                                        <th>Average</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map(sub => {
                                        const cos = standardCOs[sub] || [];
                                        const avg = cos.length > 0 ? Math.round(cos.reduce((s, c) => s + c.attainment, 0) / cos.length) : 0;
                                        return (
                                            <tr key={sub}>
                                                <td style={{ fontWeight: 600 }}>{sub}</td>
                                                {[...Array(4)].map((_, i) => {
                                                    const co = cos[i];
                                                    return (
                                                        <td key={i}>
                                                            {co ? (
                                                                <span className={`co-cell ${getLevel(co.attainment)}`} style={{ display: 'inline-block', minWidth: 50 }}>
                                                                    {co.attainment}%
                                                                </span>
                                                            ) : <span style={{ color: 'var(--text-light)' }}>—</span>}
                                                        </td>
                                                    );
                                                })}
                                                <td>
                                                    <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{avg}%</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
