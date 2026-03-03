import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { RESOURCES, STANDARDS, SUBJECTS_BY_STANDARD } from '../data';
import {
    Search, FileText, Video, HelpCircle, Presentation, StickyNote, Upload, Download, Play, X, Plus
} from 'lucide-react';

const TYPE_ICONS = { 'PDF Notes': FileText, 'Video': Video, 'MCQ Set': HelpCircle, 'PPT': Presentation, 'Notes': StickyNote };
const TYPE_FILTERS = ['All Types', 'PDF Notes', 'Video', 'MCQ Set', 'PPT', 'Notes'];

export default function Resources() {
    const { user } = useAuth();
    const isStudent = user.role === 'student';
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    // For students: lock standard to their own
    const studentStandard = user.student?.standard || user.standard || '8th';

    const [search, setSearch] = useState('');
    const [type, setType] = useState('All Types');
    const [standard, setStandard] = useState(isStudent ? studentStandard : 'All');
    const [selfLearning, setSelfLearning] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [uploadStandard, setUploadStandard] = useState(STANDARDS[0]);

    const uploadSubjects = SUBJECTS_BY_STANDARD[uploadStandard] || [];

    const filtered = useMemo(() => {
        let items = RESOURCES;

        // Students only see their standard's resources
        if (isStudent) {
            items = items.filter(r => r.standard === studentStandard);
        } else if (standard !== 'All') {
            items = items.filter(r => r.standard === standard);
        }

        if (type !== 'All Types') items = items.filter(r => r.type === type);
        if (selfLearning) items = items.filter(r => r.missedLecture);
        if (search) items = items.filter(r =>
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.subject.toLowerCase().includes(search.toLowerCase()) ||
            r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
        );
        return items;
    }, [search, type, standard, selfLearning, isStudent, studentStandard]);

    const getActionLabel = (t) => {
        if (t === 'Video') return 'Watch';
        if (t === 'MCQ Set') return 'Start Quiz';
        return 'Download';
    };

    return (
        <>
            {/* Search and Controls */}
            <div className="search-bar">
                <div className="search-input">
                    <Search />
                    <input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {isAdmin && (
                    <button className="btn-gold btn-small" onClick={() => setShowUpload(true)}>
                        <Upload size={16} /> Upload Resource
                    </button>
                )}
            </div>

            {/* Student standard info */}
            {isStudent && (
                <div style={{
                    padding: '10px 16px', marginBottom: 16, background: 'rgba(10,35,81,0.05)',
                    borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--navy)',
                    display: 'flex', alignItems: 'center', gap: 8
                }}>
                    <FileText size={16} />
                    <span>Showing resources for <strong>{studentStandard} Standard</strong> only</span>
                </div>
            )}

            {/* Filter Chips */}
            <div className="filter-chips" style={{ marginBottom: 12 }}>
                {TYPE_FILTERS.map(f => (
                    <button key={f} className={`filter-chip ${type === f ? 'active' : ''}`}
                        onClick={() => setType(f)}>{f}</button>
                ))}
            </div>

            {/* Standard chips (admin/superadmin only) */}
            {isAdmin && (
                <div className="filter-chips" style={{ marginBottom: 12 }}>
                    <button className={`filter-chip ${standard === 'All' ? 'active' : ''}`}
                        onClick={() => setStandard('All')}>All Standards</button>
                    {STANDARDS.map(s => (
                        <button key={s} className={`filter-chip ${standard === s ? 'active' : ''}`}
                            onClick={() => setStandard(s)}>{s}</button>
                    ))}
                </div>
            )}

            {/* Self-Learning Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <label className="toggle-switch">
                    <input type="checkbox" checked={selfLearning} onChange={e => setSelfLearning(e.target.checked)} />
                    <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: selfLearning ? 'var(--navy)' : 'var(--text-muted)' }}>
                    Self-Learning (Missed Lectures)
                </span>
            </div>

            {/* Resource Cards */}
            <div className="resource-grid">
                {filtered.map(r => {
                    const Icon = TYPE_ICONS[r.type] || FileText;
                    return (
                        <div key={r.id} className="card resource-card">
                            <div className="card-body">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <div className="stat-icon navy" style={{ width: 40, height: 40, minWidth: 40, borderRadius: 8 }}>
                                        <Icon size={18} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontSize: '0.95rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.subject} — {r.standard}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                    <span className="resource-tag">{r.type}</span>
                                    {r.missedLecture && <span className="resource-tag missed">Missed</span>}
                                    {r.tags.map(t => <span key={t} className="resource-tag" style={{ opacity: 0.7 }}>{t}</span>)}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>{r.uploadedBy} · {r.date}</span>
                                    <button className="btn-gold btn-small" style={{ fontSize: '0.75rem', padding: '4px 12px' }}>
                                        {r.type === 'Video' ? <Play size={12} /> : <Download size={12} />}
                                        {getActionLabel(r.type)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="empty-state">
                    <FileText /><h3>No resources found</h3><p>Try adjusting your filters or search term.</p>
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="modal-overlay" onClick={() => setShowUpload(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h3>Upload Resource</h3>
                            <button onClick={() => setShowUpload(false)} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" placeholder="Resource title..." style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Type</label>
                                    <div className="select-wrapper">
                                        <select>
                                            {['PDF Notes', 'Video', 'MCQ Set', 'PPT', 'Notes'].map(t => <option key={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Standard</label>
                                    <div className="select-wrapper">
                                        <select value={uploadStandard} onChange={e => setUploadStandard(e.target.value)}>
                                            {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <div className="select-wrapper">
                                    <select>
                                        {uploadSubjects.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Tags (comma-separated)</label>
                                <input type="text" placeholder="algebra, equations, practice..." style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" />
                                    <span>This is for a missed lecture (Self-Learning)</span>
                                </label>
                            </div>
                            <div className="upload-area" style={{ marginBottom: 16 }}>
                                <Upload size={28} style={{ color: 'var(--navy)', marginBottom: 8 }} />
                                <h4>Drop file here or click to browse</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF, PPTX, DOC, MP4 · Max 50MB</p>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, background: 'rgba(10,35,81,0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                                📌 This resource will only be visible to <strong>{uploadStandard}</strong> students and admin staff.
                            </p>
                            <button className="btn-primary">
                                <Upload size={16} /> Upload Resource
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
