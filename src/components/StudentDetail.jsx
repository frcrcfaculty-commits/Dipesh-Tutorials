import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, BookOpen } from 'lucide-react';

export default function StudentDetail({ student, onClose }) {
    if (!student) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                <div className="modal-header">
                    <h3>Student Details</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>
                <div className="modal-body" style={{ padding: '8px 24px 24px' }}>

                    {/* Name & Basic Info */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #0A2351, #B6922E)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontSize: '1.4rem', fontWeight: 700
                            }}>
                                {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{student.name || '—'}</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0' }}>
                                    Roll No: {student.roll_no || '—'} &nbsp;|&nbsp; {student.standards?.name || student.standard_name || '—'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <span className="badge" style={{ background: 'var(--navy)', color: 'white' }}>{student.gender || '—'}</span>
                            <span className="badge" style={{ background: 'var(--gold)', color: 'white' }}>{student.standards?.name || '—'}</span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gap: 12 }}>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <Calendar size={16} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date of Birth</div>
                                <div style={{ fontSize: '0.9rem' }}>{formatDate(student.date_of_birth)}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <BookOpen size={16} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrollment Date</div>
                                <div style={{ fontSize: '0.9rem' }}>{formatDate(student.enrollment_date)}</div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <User size={16} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parent / Guardian Name</div>
                                <div style={{ fontSize: '0.9rem' }}>{student.parent_name || '—'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <Phone size={16} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parent Phone</div>
                                <div style={{ fontSize: '0.9rem' }}>{student.parent_phone || '—'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <Mail size={16} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Parent Email</div>
                                <div style={{ fontSize: '0.9rem' }}>{student.parent_email || '—'}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <MapPin size={16} style={{ color: 'var(--gold)', marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Address</div>
                                <div style={{ fontSize: '0.9rem' }}>{student.address || '—'}</div>
                            </div>
                        </div>

                    </div>

                    <div style={{ marginTop: 20 }}>
                        <button className="btn-secondary" style={{ width: '100%' }} onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
