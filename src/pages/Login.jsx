import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) return;
        setError('');
        setLoading(true);
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error || 'Login failed. Check your credentials.');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-v2">
            {/* Left panel — Brand story */}
            <div className="login-v2-brand">
                <div className="login-v2-brand-inner">
                    <div className="login-v2-orb login-v2-orb-1" />
                    <div className="login-v2-orb login-v2-orb-2" />
                    <div className="login-v2-brand-content">
                        <div className="login-v2-logo-wrap">
                            <div className="login-v2-logo">
                                <svg viewBox="0 0 40 40" fill="none">
                                    <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.15)" />
                                    <path d="M12 28L20 12L28 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M14.5 23H25.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                                    <circle cx="20" cy="10" r="2" fill="#f4bf00"/>
                                </svg>
                            </div>
                        </div>
                        <h1 className="login-v2-title">Dipesh Tutorials</h1>
                        <p className="login-v2-tagline">Where potential meets precision.</p>
                        <div className="login-v2-pillars">
                            {[
                                { icon: "🎯", label: "Track progress", sub: "Live test scores & attendance" },
                                { icon: "💬", label: "Stay connected", sub: "Direct parent communication" },
                                { icon: "📊", label: "Smart insights", sub: "AI-powered performance data" },
                            ].map(p => (
                                <div key={p.label} className="login-v2-pillar">
                                    <span className="login-v2-pillar-icon">{p.icon}</span>
                                    <div>
                                        <div className="login-v2-pillar-label">{p.label}</div>
                                        <div className="login-v2-pillar-sub">{p.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel — Form */}
            <div className="login-v2-form-panel">
                <div className="login-v2-form-inner">
                    <div className="login-v2-form-header">
                        <h2>Welcome back</h2>
                        <p>Sign in to continue to your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-v2-form">
                        <div className="login-v2-field">
                            <label>Email address</label>
                            <div className="login-v2-input-wrap">
                                <svg className="login-v2-input-icon" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                </svg>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                    className="login-v2-input"
                                />
                            </div>
                        </div>

                        <div className="login-v2-field">
                            <label>
                                Password
                                <button type="button" className="login-v2-forgot">Forgot?</button>
                            </label>
                            <div className="login-v2-input-wrap">
                                <svg className="login-v2-input-icon" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                                </svg>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    className="login-v2-input"
                                />
                                <button type="button" className="login-v2-eye" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="login-v2-error">
                                <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                {error}
                            </div>
                        )}

                        <button type="submit" className={`login-v2-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                            {loading ? (
                                <span className="login-v2-spinner" />
                            ) : 'Sign In →'}
                        </button>
                    </form>

                    <div className="login-v2-footer">
                        <span>Need access?</span>
                        <a href="mailto:dipesh@dipeshtutorials.com">Contact Dipesh Tutorials</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
