import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100vh', background: '#F5F6FA', padding: 32, textAlign: 'center',
                    fontFamily: "'Inter', sans-serif"
                }}>
                    <AlertCircle size={48} style={{ color: '#EF4444', marginBottom: 16 }} />
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", color: '#0A2351', marginBottom: 8 }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#6B7280', marginBottom: 24, maxWidth: 400 }}>
                        An unexpected error occurred. Please refresh the page or contact admin if this persists.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '12px 24px', background: '#0A2351', color: 'white',
                            border: 'none', borderRadius: 10, cursor: 'pointer',
                            fontWeight: 600, fontSize: '0.95rem'
                        }}
                    >
                        <RefreshCw size={16} /> Reload Page
                    </button>
                    {this.state.error && (
                        <details style={{ marginTop: 24, fontSize: '0.75rem', color: '#9CA3AF', maxWidth: 500 }}>
                            <summary style={{ cursor: 'pointer' }}>Error details</summary>
                            <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap', marginTop: 8 }}>
                                {this.state.error.toString()}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}
