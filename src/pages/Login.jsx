import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { GraduationCap, Mail, Lock, Users, BookOpen, Shield, Crown, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

const ROLES = [
    { id: 'parent', label: 'Parent', icon: Users, email: 'parent@demo.com' },
    { id: 'student', label: 'Student', icon: BookOpen, email: 'student@demo.com' },
    { id: 'admin', label: 'Admin Staff', icon: Shield, email: 'admin@demo.com' },
    { id: 'superadmin', label: 'Super Admin', icon: Crown, email: 'superadmin@demo.com' },
];

export default function Login() {
    const { login, firebaseLogin } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState('parent');
    const [email, setEmail] = useState('parent@demo.com');
    const [password, setPassword] = useState('parent123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRoleSelect = (role) => {
        setSelectedRole(role.id);
        setEmail(role.email);
        const passwords = { parent: 'parent123', student: 'student123', admin: 'admin123', superadmin: 'super123' };
        setPassword(passwords[role.id]);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Try Firebase auth first, fall back to demo login
        if (firebaseLogin) {
            try {
                const result = await firebaseLogin(email, password);
                if (result.success) {
                    navigate('/');
                    return;
                } else {
                    // Fall back to demo login if Firebase not configured
                    const demoResult = login(email, password);
                    if (demoResult.success) {
                        navigate('/');
                        return;
                    } else {
                        setError(result.error || 'Login failed');
                    }
                }
            } catch (err) {
                // Firebase not configured — use demo login
                const result = login(email, password);
                if (result.success) {
                    navigate('/');
                    return;
                } else {
                    setError(result.error || 'Login failed');
                }
            }
        } else {
            // Demo mode
            const result = login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error);
            }
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <div className="brand-icon">
                        <GraduationCap />
                    </div>
                    <h1>Dipesh Tutorials</h1>
                    <p className="tagline">Education with Perfection</p>
                    <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#6B7280' }}>
                        Sign in to your account
                    </p>
                </div>

                <div className="role-selector">
                    {ROLES.map(role => (
                        <button
                            key={role.id}
                            className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                            onClick={() => handleRoleSelect(role)}
                            type="button"
                        >
                            <role.icon />
                            {role.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <AlertCircle size={14} /> {error}
                        </p>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spin" /> Signing in...
                            </>
                        ) : (
                            <>Sign In <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.75rem', color: '#9CA3AF' }}>
                    <p>Demo Credentials — Select a role above to auto-fill</p>
                    <p style={{ marginTop: 4, color: '#6B7280' }}>
                        Configure Firebase in <code>.env</code> for real authentication
                    </p>
                </div>
            </div>
        </div>
    );
}
