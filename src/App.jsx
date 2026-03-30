import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Resources from './pages/Resources';
import Billing from './pages/Billing';
import Notifications from './pages/Notifications';
import CourseMapping from './pages/CourseMapping';
import Students from './pages/Students';
import Analytics from './pages/Analytics';
import TestResults from './pages/TestResults';
import UserManagement from './pages/UserManagement';

// ─── Auth Context ──────────────────────────
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('dt_user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    await fetchProfile(session.user);
                } else {
                    setUser(null);
                    localStorage.removeItem('dt_user');
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();

        async function fetchProfile(firebaseOrSupabaseUser) {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*, students(id, name, roll_no, standards(name, id), profile_id, parent_profile_id)')
                    .eq('id', firebaseOrSupabaseUser.id)
                    .single();

                if (profile) {
                    const userData = {
                        uid: firebaseOrSupabaseUser.id,
                        email: firebaseOrSupabaseUser.email,
                        ...profile,
                    };
                    setUser(userData);
                    localStorage.setItem('dt_user', JSON.stringify(userData));
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        }
    }, []);

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('dt_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
}

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Layout><Attendance /></Layout></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute roles={['student', 'admin', 'superadmin']}><Layout><Resources /></Layout></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute roles={['parent', 'admin', 'superadmin']}><Layout><Billing /></Layout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
            <Route path="/course-mapping" element={<ProtectedRoute roles={['student', 'admin', 'superadmin']}><Layout><CourseMapping /></Layout></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><Students /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><Analytics /></Layout></ProtectedRoute>} />
            <Route path="/test-results" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><TestResults /></Layout></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute roles={['superadmin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </HashRouter>
    );
}
