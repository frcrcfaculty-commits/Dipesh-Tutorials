import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardV2 from './pages/DashboardV2';
import Attendance from './pages/Attendance';
import Resources from './pages/Resources';
import Billing from './pages/Billing';
import Notifications from './pages/Notifications';
import CourseMapping from './pages/CourseMapping';
import Students from './pages/Students';
import Analytics from './pages/Analytics';
import TestResults from './pages/TestResults';
import UserManagement from './pages/UserManagement';
import WalkIn from './pages/WalkIn';
import WalkInV2 from './pages/WalkInV2';
import StudentsV2 from './pages/StudentsV2';
import ErrorBoundary from './components/ErrorBoundary';
import DailyReport from './pages/DailyReport.v2';
import FeeHumanity from './pages/FeeHumanity.v2';
import MoodCheckin from './pages/MoodCheckin.v2';
import Milestones from './pages/Milestones.v2';
import ParentMessaging from './pages/ParentMessaging.v2';

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
                    navigate('/login');
                }
            } catch (_) {}
        }, 300000);
        return () => clearInterval(interval);
    }, [user, navigate]);

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
                    navigate('/login');
                }
                if (event === 'TOKEN_REFRESHED' && session?.user) {
                    console.log('Session refreshed');
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [navigate]);

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
            <Route path="/walk-in" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><WalkIn /></Layout></ProtectedRoute>} />
            <Route path="/user-management" element={<ProtectedRoute roles={['superadmin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
            <Route path="/v2" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><DashboardV2 /></Layout></ProtectedRoute>} />
            <Route path="/students-v2" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><StudentsV2 /></Layout></ProtectedRoute>} />
            <Route path="/walk-in-v2" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><WalkInV2 /></Layout></ProtectedRoute>} />
            <Route path="/daily-report" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><DailyReport /></Layout></ProtectedRoute>} />
            <Route path="/fee-humanity" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><FeeHumanity /></Layout></ProtectedRoute>} />
            <Route path="/mood-checkin" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><MoodCheckin /></Layout></ProtectedRoute>} />
            <Route path="/milestones" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><Milestones /></Layout></ProtectedRoute>} />
            <Route path="/parent-messaging" element={<ProtectedRoute roles={['admin', 'superadmin']}><Layout><ParentMessaging /></Layout></ProtectedRoute>} />
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
        </BrowserRouter>
    );
}
