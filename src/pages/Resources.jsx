import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { getResources, uploadResource, getStandards, getSubjects } from '../lib/api';
import { BookOpen, Upload, FileText, Video, FileSpreadsheet, Presentation, X } from 'lucide-react';
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
    const [uploading, setUploading] = useState(false);
    const [filterType, setFilterType] = useState('All');
    const [filterStd, setFilterStd] = useState('all');
    const [showUpload, setShowUpload] = useState(false);
    const [form, setForm] = useState({ title: '', type: 'PDF Notes', standard_id: '', subject_id: '', file: null });
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

    useEffect(() => { loadAll(); }, []);

    async function loadAll() {
        setLoading(true);
        try {
            const [r, stds, subs] = await Promise.all([getResources(), getStandards(), getSubjects()]);
            setResources(r||[]);
            setStandards(stds||[]);
            setSubjects(subs||[]);
        } catch(e) { showToast('Failed to load resources', 'error'); }
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

    const filtered = resources.filter(r => {
        if (filterType !== 'All' && r.type !== filterType) return false;
        if (filterStd !== 'all' && r.standard_id !== filterStd) return false;
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
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="card-header"><h3>Upload Resource</h3>
                        <button className="icon-btn" onClick={() => setShowUpload(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleUpload} className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <div className="filter-chips">
                    {types.map(t => <button key={t} className={`filter-chip ${filterType===t?'active':''}`} onClick={() => setFilterType(t)}>{t}</button>)}
                </div>
                <select value={filterStd} onChange={e => setFilterStd(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                    <option value="all">All Standards</option>
                    {standards.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>

            {loading ? <div className="loading-spinner" /> : filtered.length === 0 ? (
                <div className="empty-state"><BookOpen /><h3>No resources found</h3></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                    {filtered.map(r => {
                        const Icon = TYPE_ICONS[r.type] || BookOpen;
                        return (
                            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ background: `var(--${TYPE_COLORS[r.type]||'navy'})`, color: 'white', padding: 10, borderRadius: 8, flexShrink: 0 }}>
                                        <Icon size={20} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{r.title}</div>
                                        <span className={`badge ${TYPE_COLORS[r.type]||'navy'}`} style={{ fontSize: '0.7rem' }}>{r.type}</span>
                                    </div>
                                </div>
                                {r.file_url && (
                                    <a href={r.file_url} target="_blank" rel="noreferrer" className="btn-secondary btn-small" style={{ textAlign: 'center' }}>
                                        Download
                                    </a>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {r.subjects?.name} · {r.standards?.name} · {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}