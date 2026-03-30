import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, useData } from '../App';
import { getResources, uploadResource, uploadFile } from '../lib/api';
import { Search, FileText, Video, HelpCircle, Presentation, StickyNote, Upload, Download, Play, X, Plus } from 'lucide-react';
import { showToast } from '../utils';

const TYPE_ICONS = { 'PDF Notes': FileText, 'Video': Video, 'MCQ Set': HelpCircle, 'PPT': Presentation, 'Notes': StickyNote };
const TYPE_FILTERS = ['All Types', 'PDF Notes', 'Video', 'MCQ Set', 'PPT', 'Notes'];

export default function Resources() {
    const { user } = useAuth();
    const { standards, getSubjectsForStandard } = useData();
    const isStudent = user.role === 'student';
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    const studentStandardId = user.student?.standard_id;

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('All Types');
    const [standard, setStandard] = useState(isStudent ? String(studentStandardId || '') : 'All');
    const [selfLearning, setSelfLearning] = useState(false);
    const [showUpload, setShowUpload] = useState(false);

    // Upload form
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadType, setUploadType] = useState('PDF Notes');
    const [uploadStd, setUploadStd] = useState(standards[0]?.id || '');
    const [uploadSubject, setUploadSubject] = useState('');
    const [uploadTags, setUploadTags] = useState('');
    const [uploadMissed, setUploadMissed] = useState(false);
    const [uploadFileRef, setUploadFileRef] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadResources(); }, []);

    async function loadResources() {
        setLoading(true);
        try {
            const data = await getResources(isStudent && studentStandardId ? { standardId: studentStandardId } : {});
            setResources(data || []);
        } catch (err) { showToast(err.message, 'error'); }
        setLoading(false);
    }

    const filtered = useMemo(() => {
        return resources.filter(r => {
            if (!isStudent && standard !== 'All' && r.standard_id !== parseInt(standard)) return false;
            if (type !== 'All Types' && r.type !== type) return false;
            if (selfLearning && !r.is_missed_lecture) return false;
            if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [resources, search, type, standard, selfLearning, isStudent]);

    const handleUpload = async () => {
        if (!uploadTitle || !uploadStd) { showToast('Fill required fields', 'error'); return; }
        setSaving(true);
        try {
            let fileUrl = null;
            if (uploadFileRef) {
                const path = `resources/${Date.now()}_${uploadFileRef.name}`;
                fileUrl = await uploadFile('resources', path, uploadFileRef);
            }
            await uploadResource({
                title: uploadTitle,
                type: uploadType,
                standard_id: parseInt(uploadStd),
                subject_id: uploadSubject ? parseInt(uploadSubject) : null,
                file_url: fileUrl,
                tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
                is_missed_lecture: uploadMissed,
                uploaded_by: user.id,
            });
            showToast('Resource uploaded!');
            setShowUpload(false);
            setUploadTitle('');
            setUploadFileRef(null);
            loadResources();
        } catch (err) { showToast(err.message, 'error'); }
        setSaving(false);
    };

    return (
        <>
            <div className="search-bar">
                <div className="search-input"><Search /><input placeholder="Search resources..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                {isAdmin && (
                    <button className="btn-gold btn-small" onClick={() => setShowUpload(true)}>
                        <Upload size={16} /> Upload Resource
                    </button>
                )}
            </div>

            {isStudent && (
                <div style={{ padding: '10px 16px', marginBottom: 16, background: 'rgba(10,35,81,0.05)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={16} /><span>Showing resources for <strong>{user.student?.standards?.name || ''} Standard</strong> only</span>
                </div>
            )}

            <div className="filter-chips" style={{ marginBottom: 12 }}>
                {TYPE_FILTERS.map(f => (
                    <button key={f} className={`filter-chip ${type === f ? 'active' : ''}`} onClick={() => setType(f)}>{f}</button>
                ))}
            </div>

            {isAdmin && (
                <div className="filter-chips" style={{ marginBottom: 12 }}>
                    <button className={`filter-chip ${standard === 'All' ? 'active' : ''}`} onClick={() => setStandard('All')}>All Standards</button>
                    {standards.map(s => (
                        <button key={s.id} className={`filter-chip ${standard === String(s.id) ? 'active' : ''}`} onClick={() => setStandard(String(s.id))}>{s.name}</button>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <label className="toggle-switch">
                    <input type="checkbox" checked={selfLearning} onChange={e => setSelfLearning(e.target.checked)} />
                    <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: selfLearning ? 'var(--navy)' : 'var(--text-muted)' }}>
                    Self-Learning (Missed Lectures)
                </span>
            </div>

            {loading ? <div className="empty-state"><div className="spinner" /><p>Loading...</p></div> : (
                <div className="resource-grid">
                    {filtered.map(r => {
                        const Icon = TYPE_ICONS[r.type] || FileText;
                        return (
                            <div key={r.id} className="card resource-card">
                                <div className="card-body">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div className="stat-icon navy" style={{ width: 40, height: 40, minWidth: 40, borderRadius: 8 }}><Icon size={18} /></div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h4 style={{ fontSize: '0.95rem', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.subjects?.name || ''} — {r.standards?.name || ''}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                        <span className="resource-tag">{r.type}</span>
                                        {r.is_missed_lecture && <span className="resource-tag missed">Missed</span>}
                                        {(r.tags || []).map(t => <span key={t} className="resource-tag" style={{ opacity: 0.7 }}>{t}</span>)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <span>{r.profiles?.name || ''} · {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                        {r.file_url && (
                                            <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="btn-gold btn-small" style={{ fontSize: '0.75rem', padding: '4px 12px', textDecoration: 'none' }}>
                                                {r.type === 'Video' ? <Play size={12} /> : <Download size={12} />}
                                                {r.type === 'Video' ? 'Watch' : 'Download'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="empty-state"><FileText /><h3>No resources found</h3><p>Try adjusting your filters.</p></div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="modal-overlay" onClick={() => !saving && setShowUpload(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header"><h3>Upload Resource</h3><button onClick={() => setShowUpload(false)} className="icon-btn" style={{ width: 32, height: 32 }}><X size={16} /></button></div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Title *</label>
                                <input type="text" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Resource title..."
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="form-group"><label>Type</label><div className="select-wrapper"><select value={uploadType} onChange={e => setUploadType(e.target.value)}>
                                    {['PDF Notes', 'Video', 'MCQ Set', 'PPT', 'Notes'].map(t => <option key={t}>{t}</option>)}
                                </select></div></div>
                                <div className="form-group"><label>Standard</label><div className="select-wrapper"><select value={uploadStd} onChange={e => { setUploadStd(e.target.value); setUploadSubject(''); }}>
                                    {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select></div></div>
                            </div>
                            <div className="form-group"><label>Subject</label><div className="select-wrapper"><select value={uploadSubject} onChange={e => setUploadSubject(e.target.value)}>
                                <option value="">Select subject</option>
                                {(uploadStd ? getSubjectsForStandard(parseInt(uploadStd)) : []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select></div></div>
                            <div className="form-group"><label>Tags (comma-separated)</label>
                                <input type="text" value={uploadTags} onChange={e => setUploadTags(e.target.value)} placeholder="algebra, equations..."
                                    style={{ width: '100%', padding: '10px 14px', border: '2px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={uploadMissed} onChange={e => setUploadMissed(e.target.checked)} />
                                    <span>Missed lecture (Self-Learning)</span>
                                </label>
                            </div>
                            <div className="form-group">
                                <label>File</label>
                                <input type="file" onChange={e => setUploadFileRef(e.target.files[0])}
                                    accept=".pdf,.pptx,.doc,.docx,.mp4,.jpg,.png"
                                    style={{ width: '100%', padding: '10px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)' }} />
                            </div>
                            <button className="btn-primary" onClick={handleUpload} disabled={saving || !uploadTitle}>
                                <Upload size={16} /> {saving ? 'Uploading...' : 'Upload Resource'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
