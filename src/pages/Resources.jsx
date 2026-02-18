import React, { useState, useMemo } from 'react';
import { useAuth } from '../App';
import { RESOURCES, STANDARDS, SUBJECTS_BY_STANDARD } from '../data';
import { Search, FileText, Video, HelpCircle, Presentation, BookOpen, Upload, Plus, Filter, Clock, X } from 'lucide-react';

const TYPE_ICONS = { pdf: FileText, video: Video, mcq: HelpCircle, ppt: Presentation, notes: BookOpen };
const TYPE_LABELS = { pdf: 'PDF Notes', video: 'Video', mcq: 'MCQ Set', ppt: 'Presentation', notes: 'Written Notes' };

export default function Resources() {
    const { user } = useAuth();
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [standardFilter, setStandardFilter] = useState('All');
    const [selfLearning, setSelfLearning] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    const filtered = useMemo(() => {
        let items = [...RESOURCES];
        if (selfLearning) items = items.filter(r => r.missedLecture);
        if (typeFilter !== 'All') items = items.filter(r => r.type === typeFilter);
        if (standardFilter !== 'All') items = items.filter(r => r.standard === standardFilter);
        if (search) items = items.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || r.subject.toLowerCase().includes(search.toLowerCase()));
        return items;
    }, [search, typeFilter, standardFilter, selfLearning]);

    return (
        <>
            {/* Self-learning toggle */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                    className={`filter-chip ${!selfLearning ? 'active' : ''}`}
                    onClick={() => setSelfLearning(false)}
                >All Resources</button>
                <button
                    className={`filter-chip ${selfLearning ? 'active' : ''}`}
                    onClick={() => setSelfLearning(true)}
                    style={selfLearning ? {} : {}}
                >
                    <Clock size={12} style={{ marginRight: 4 }} />
                    Self-Learning (Missed Lectures)
                </button>
                {isAdmin && (
                    <button className="btn-gold btn-small" style={{ marginLeft: 'auto' }} onClick={() => setShowUpload(true)}>
                        <Plus size={14} /> Upload Resource
                    </button>
                )}
            </div>

            {/* Search & Filters */}
            <div className="search-bar">
                <div className="search-input">
                    <Search />
                    <input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-chips">
                    {['All', 'pdf', 'video', 'mcq', 'ppt', 'notes'].map(t => (
                        <button key={t} className={`filter-chip ${typeFilter === t ? 'active' : ''}`} onClick={() => setTypeFilter(t)}>
                            {t === 'All' ? 'All Types' : TYPE_LABELS[t]}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: 20 }}>
                <div className="filter-chips">
                    <button className={`filter-chip ${standardFilter === 'All' ? 'active' : ''}`} onClick={() => setStandardFilter('All')}>All Standards</button>
                    {STANDARDS.map(s => (
                        <button key={s} className={`filter-chip ${standardFilter === s ? 'active' : ''}`} onClick={() => setStandardFilter(s)}>{s}</button>
                    ))}
                </div>
            </div>

            {/* Resource Grid */}
            <div className="resource-grid">
                {filtered.map(r => {
                    const Icon = TYPE_ICONS[r.type] || FileText;
                    return (
                        <div key={r.id} className="resource-card">
                            <div className={`resource-type ${r.type}`}>
                                <Icon size={22} />
                            </div>
                            <h4>{r.title}</h4>
                            <div className="resource-meta">
                                {r.subject} • {r.standard} • {r.uploadDate}
                                {r.size && ` • ${r.size}`}
                                {r.questions && ` • ${r.questions} questions`}
                            </div>
                            {r.missedLecture && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, marginBottom: 8 }}>
                                    📚 Missed Lecture — {r.lectureDate}
                                </div>
                            )}
                            <div className="resource-tags">
                                {r.tags.map(t => <span key={t} className="resource-tag">{t}</span>)}
                            </div>
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                <button className="btn-primary" style={{ width: 'auto', flex: 1, padding: '8px 14px', fontSize: '0.8rem', marginTop: 0 }}>
                                    {r.type === 'video' ? '▶ Watch' : r.type === 'mcq' ? '📝 Start Quiz' : '📥 Download'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="empty-state">
                    <BookOpen /><h3>No resources found</h3><p>Try adjusting your filters.</p>
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="modal-overlay" onClick={() => setShowUpload(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload Resource</h2>
                            <button onClick={() => setShowUpload(false)} style={{ background: 'none', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Resource Title</label>
                                <div className="input-wrapper">
                                    <FileText />
                                    <input placeholder="e.g., Algebra Chapter 3 Notes" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <div className="select-wrapper">
                                    <select>
                                        <option>PDF Notes</option><option>Video Tutorial</option><option>MCQ Set</option><option>PPT Presentation</option><option>Written Notes</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group">
                                    <label>Standard</label>
                                    <div className="select-wrapper">
                                        <select>{STANDARDS.map(s => <option key={s}>{s}</option>)}</select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Subject</label>
                                    <div className="select-wrapper">
                                        <select><option>Mathematics</option><option>Science</option><option>English</option></select>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Missed Lecture?</label>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button className="filter-chip active">No</button>
                                    <button className="filter-chip">Yes — Tag for Self-Learning</button>
                                </div>
                            </div>
                            <div className="upload-area">
                                <Upload />
                                <h4>Drop files here or click to upload</h4>
                                <p>PDF, PPT, DOCX, MP4, or YouTube link</p>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                            <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }}>Upload Resource</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
