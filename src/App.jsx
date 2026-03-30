import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { getStudentByProfileId, getStudentsByParentProfileId } from './lib/api';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
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

// ─── Data Context (standards, subjects cached) ──────────
const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [standards, setStandards] = useState([]);
    const [subjects, setSubjects] = useState([]);

    useEffect(() => {
        // Load session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                await loadUserProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                await loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
            }
        });

        // Load reference data
        loadReferenceData();

        return () => subscription.unsubscribe();
    }, []);

    async function loadReferenceData() {
        const [stdRes, subRes] = await Promise.all([
            supabase.from('standards').select('*').order('sort_order'),
            supabase.from('subjects').select('*, standards(name)').order('name'),
        ]);
        setStandards(stdRes.data || []);
        setSubjects(subRes.data || []);
    }

    async function loadUserProfile(userId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!profile) return;

        let studentData = null;
        let children = [];

        if (profile.role === 'student') {
            studentData = await getStudentByProfileId(userId);
        } else if (profile.role === 'parent') {
            children = await getStudentsByParentProfileId(userId);
        }

        setUser({
            ...profile,
            student: studentData,
            children,
            child: children[0] || null, // backward compat
        });
    }

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        await loadUserProfile(data.user.id);
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    // Helper to get subjects for a standard
    const getSubjectsForStandard = (standardId) => {
        return subjects.filter(s => s.standard_id === standardId);
    };

    const getStandardName = (standardId) => {
        return standards.find(s => s.id === standardId)?.name || '';
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'var(--bg)',
                fontFamily: 'var(--font-heading)', color: 'var(--navy)',
                fontSize: '1.2rem', gap: 12
            }}>
                <div className="spinner" />
                Loading Dipesh Tutorials...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            <DataContext.Provider value={{ standards, subjects, getSubjectsForStandard, getStandardName }}>
                {children}
            </DataContext.Provider>
        </AuthContext.Provider>
    );
}

function ProtectedRoute({ children, roles }) {
    const { user } = useAuth();
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
            <Route path="/user-management" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <HashRouter>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </HashRouter>
        </ErrorBoundary>
    );
}
