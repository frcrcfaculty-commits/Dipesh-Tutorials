import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
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
import ProgressReport from './pages/ProgressReport.v2';
import HomeworkTracker from './pages/HomeworkTracker.v2';
import ParentDigest from './pages/ParentDigest.v2';
import RealtimeNotifications from './pages/RealtimeNotifications.v2';
import TestResults from './pages/TestResults';
import UserManagement from './pages/UserManagement';
import WalkIn from './pages/WalkIn';
import ErrorBoundary from './components/ErrorBoundary';

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
    const fetchingRef = useRef(false);
    const navigate = useNavigate(); // useNavigate must be called inside Router context

    async function fetchProfile(authUser) {
        if (fetchingRef.current) return;
        fetchingRef.current = true;
        let aborted = false;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*, as_student:students!students_profile_id_fkey(id, name, roll_no, standards(name, id), profile_id, parent_profile_id), as_parent:students!students_parent_profile_id_fkey(id, name, roll_no, standards(name, id), profile_id, parent_profile_id)')
                .eq('id', authUser.id)
                .abortSignal(controller.signal)
                .single();
            clearTimeout(timeout);
            if (aborted) return;

            if (error) {
                console.error('Profile fetch error:', error);
            }

            if (profile) {
                const linkedStudents = [...(profile.as_student || []), ...(profile.as_parent || [])];
                const userData = {
                    uid: authUser.id,
                    email: authUser.email,
                    ...profile,
                    students: linkedStudents
                };
                delete userData.as_student;
                delete userData.as_parent;
                setUser(userData);
                localStorage.setItem('dt_user', JSON.stringify(userData));
            }
        } catch (err) {
            if (err.name === 'AbortError') { aborted = true; return; }
            console.error('Error fetching profile:', err);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    }

    // Periodic session health check every 5 minutes
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session && user) {
                    setUser(null);
                    localStorage.removeItem('dt_user');
                    // Only navigate if we're not already on login
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            } catch (_) {}
        }, 300000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                fetchProfile(session.user);
            } else {
                setUser(null);
                localStorage.removeItem('dt_user');
                setLoading(false);
            }
        }).catch(() => {
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_OUT' || !session) {
                    setUser(null);
                    localStorage.removeItem('dt_user');
                    setLoading(false);
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: error.message };
            if (data?.user) {
                await fetchProfile(data.user);
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem('dt_user');
        window.location.href = '/login';
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
            <Route path="/analytics" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><Analytics /></Layout></ProtectedRoute>} />
            <Route path="/test-results" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><TestResults /></Layout></ProtectedRoute>} />
            <Route path="/progress-reports" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><ProgressReport /></Layout></ProtectedRoute>} />
            <Route path="/homework" element={<ProtectedRoute roles={['admin', 'superadmin', 'student', 'parent']}><Layout><HomeworkTracker /></Layout></ProtectedRoute>} />
            <Route path="/digest" element={<ProtectedRoute roles={['parent']}><Layout><ParentDigest /></Layout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Layout><RealtimeNotifications /></Layout></ProtectedRoute>} />
            <Route path="/walk-in" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><WalkIn /></Layout></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute roles={['superadmin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ErrorBoundary>
                    <AppRoutes />
                </ErrorBoundary>
            </AuthProvider>
            <VercelAnalytics />
        </BrowserRouter>
    );
}
