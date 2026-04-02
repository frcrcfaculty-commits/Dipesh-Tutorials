import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getResources, uploadResource, getStandards, getSubjects } from '../lib/api';
import { BookOpen, Upload, FileText, Video, FileSpreadsheet, Presentation, X, RefreshCw, AlertCircle } from 'lucide-react';
import { showToast } from '../utils';

const TYPE_ICONS = { 'PDF Notes': FileText, 'Video': Video, 'MCQ Set': FileSpreadsheet, 'PPT': Presentation, 'Notes': BookOpen };
const TYPE_COLORS = { 'PDF Notes': 'navy', 'Video': 'red', 'MCQ Set': 'green', 'PPT': 'gold', 'Notes': 'blue' };
const TYPE_OPTIONS = ['PDF Notes', 'Video', 'MCQ Set', 'PPT', 'Notes'];

export default function Resources() {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [standards, setStandards] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [filterType, setFilterType] = useState('All');
    const [filterStd, setFilterStd] = useState('all');
    const [showUpload, setShowUpload] = useState(false);
    const [form, setForm] = useState({ title: '', type: 'PDF Notes', standard_id: '', subject_id: '', file: null });
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const isStudent = user?.role === 'student';
    const studentStandardId = user?.students?.[0]?.standard_id;

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        setFetchError(null);
        try {
            const [r, stds, subs] = await Promise.all([getResources(), getStandards(), getSubjects()]);
            setResources(r||[]);
            setStandards(stds||[]);
            setSubjects(subs||[]);
        } catch(e) {
            setFetchError(e.message || 'Failed to load resources');
            showToast('Failed to load resources', 'error');
        }
        setLoading(false);
    }

    async function handleUpload(e) {
        e.preventDefault();
        if (!form.title || !form.standard_id) { showToast('Fill all required fields', 'error'); return; }
        setUploading(true);
        try {
            await uploadResource({ ...form, uploaded_by: user.id });
            showToast('Resource uploaded!');
            setShowUpload(false);
            setForm({ title: '', type: 'PDF Notes', standard_id: '', subject_id: '', file: null });
            loadAll();
        } catch(err) { showToast('Upload failed', 'error'); }
        setUploading(false);
    }

    const effectiveStdFilter = isStudent && studentStandardId ? String(studentStandardId) : filterStd;

    const filtered = resources.filter(r => {
        if (filterType !== 'All' && r.type !== filterType) return false;
        if (effectiveStdFilter !== 'all' && String(r.standard_id) !== effectiveStdFilter) return false;
        return true;
    });
    const types = ['All', ...new Set(resources.map(r => r.type).filter(Boolean))];

    return (
        <>
            <div className="page-header">
                <h2>Study Resources</h2>
                {isAdmin && (
                    <button className="btn-primary" onClick={() => setShowUpload(s => !s)}>
                        <Upload size={16} /> Upload Resource
                    </button>
                )}
            </div>

            {showUpload && (
                <div className="card card-spaced">
                    <div className="card-header"><h3>Upload Resource</h3>
                        <button className="icon-btn" onClick={() => setShowUpload(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleUpload} className="card-body form-stack">
                        <div className="form-row">
                            <div className="form-group"><label>Title *</label>
                                <input required value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="Resource title" /></div>
                            <div className="form-group"><label>Type</label>
                                <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Standard *</label>
                                <select required value={form.standard_id} onChange={e => setForm(p => ({...p, standard_id: e.target.value}))}>
                                    <option value="">Select standard</option>
                                    {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select></div>
                            <div className="form-group"><label>Subject</label>
                                <select value={form.subject_id} onChange={e => setForm(p => ({...p, subject_id: e.target.value}))}>
                                    <option value="">All subjects</option>
                                    {subjects.filter(s => s.standard_id === form.standard_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select></div>
                        </div>
                        <div className="form-group"><label>File</label>
                            <input type="file" onChange={e => setForm(p => ({...p, file: e.target.files[0]}))} /></div>
                        <div className="btn-group-right">
                            <button type="button" className="btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="filter-bar">
                <div className="filter-chips">
                    {types.map(t => <button key={t} className={`filter-chip ${filterType===t?'active':''}`} onClick={() => setFilterType(t)}>{t}</button>)}
                </div>
                {isStudent && studentStandardId && (
                    <div className="filter-info-badge">
                        Showing resources for {standards.find(s => String(s.id) === String(studentStandardId))?.name || 'your'} Standard
                    </div>
                )}
                {!isStudent && (
                    <select value={filterStd} onChange={e => setFilterStd(e.target.value)} className="inline-select">
                        <option value="all">All Standards</option>
                        {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}
            </div>

            {loading ? <div className="loading-spinner" /> : fetchError ? (
                <div className="empty-state empty-state-padded">
                    <AlertCircle size={40} className="text-danger-icon" />
                    <h3 className="empty-state-title">{fetchError}</h3>
                    <button className="btn-primary btn-small empty-state-action" onClick={loadAll}>
                        <RefreshCw size={14} /> Try Again
                    </button>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state"><BookOpen /><h3>No resources found</h3></div>
            ) : (
                <div className="resource-grid">
                    {filtered.map(r => {
                        const Icon = TYPE_ICONS[r.type] || BookOpen;
                        return (
                            <div key={r.id} className="card resource-card">
                                <div className="resource-card-header">
                                    <div className={`resource-type-icon resource-type-${TYPE_COLORS[r.type]||'navy'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="resource-card-info">
                                        <div className="resource-card-title">{r.title}</div>
                                        <span className={`badge ${TYPE_COLORS[r.type]||'navy'} badge-sm`}>{r.type}</span>
                                    </div>
                                </div>
                                {r.file_url && (
                                    <a href={r.file_url} target="_blank" rel="noreferrer" className="btn-secondary btn-small resource-download-btn">
                                        Download
                                    </a>
                                )}
                                <div className="resource-meta">
                                    {r.subjects?.name} · {r.standards?.name} · {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`
                .card-spaced {
                    margin-bottom: 24px;
                }
                .form-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .btn-group-right {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }
                .filter-bar {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .filter-info-badge {
                    background: rgba(33,167,208,0.1);
                    color: var(--navy);
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }
                .inline-select {
                    padding: 6px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: var(--surface-raised);
                }
                .empty-state-padded {
                    padding: 48px;
                }
                .text-danger-icon {
                    color: var(--danger);
                    margin-bottom: 12px;
                }
                .empty-state-title {
                    margin-bottom: 8px;
                }
                .empty-state-action {
                    margin-top: 8px;
                }
                .resource-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }
                .resource-card {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .resource-card-header {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                }
                .resource-type-icon {
                    color: white;
                    padding: 10px;
                    border-radius: 8px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .resource-type-navy { background: var(--navy); }
                .resource-type-red { background: var(--danger, #EF4444); }
                .resource-type-green { background: var(--success, #10B981); }
                .resource-type-gold { background: var(--gold); }
                .resource-type-blue { background: #3B82F6; }
                .resource-card-info {
                    flex: 1;
                    min-width: 0;
                }
                .resource-card-title {
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 4px;
                }
                .badge-sm {
                    font-size: 0.7rem;
                }
                .resource-download-btn {
                    text-align: center;
                }
                .resource-meta {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
            `}</style>
        </>
    );
}