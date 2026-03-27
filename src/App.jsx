import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { DEMO_USERS, STUDENTS } from './data';
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

// ─── Auth Context ──────────────────────────
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('dt_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Listen to Firebase auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (fu) => {
            setFirebaseUser(fu);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = (email, password) => {
        // Demo login fallback
        const u = DEMO_USERS[email];
        if (!u || u.password !== password) return { success: false, error: 'Invalid email or password' };

        const userData = { email, ...u };
        if (u.role === 'parent') {
            const child = STUDENTS.find(s => s.id === u.childId);
            if (child) userData.child = child;
        }
        if (u.role === 'student') {
            const student = STUDENTS.find(s => s.id === u.studentId);
            if (student) userData.student = student;
        }
        setUser(userData);
        localStorage.setItem('dt_user', JSON.stringify(userData));
        return { success: true };
    };

    const firebaseLogin = async (email, password) => {
        try {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const fu = credential.user;

            // Get user role from Firestore
            const { getUserProfile } = await import('./firebase');
            const profile = await getUserProfile(fu.uid);

            const userData = {
                uid: fu.uid,
                email: fu.email,
                displayName: profile?.displayName || fu.displayName || email.split('@')[0],
                role: profile?.role || 'admin',
                photoURL: fu.photoURL,
                firebaseUser: true,
            };
            setUser(userData);
            localStorage.setItem('dt_user', JSON.stringify(userData));
            return { success: true };
        } catch (err) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                return { success: false, error: 'Invalid email or password' };
            }
            if (err.code === 'auth/network-request-failed') {
                return { success: false, error: 'Network error — check Firebase configuration' };
            }
            return { success: false, error: err.message };
        }
    };

    const logout = async () => {
        if (firebaseUser) {
            try {
                const { logout } = await import('./firebase');
                await logout();
            } catch (_) {}
        }
        setUser(null);
        localStorage.removeItem('dt_user');
    };

    // Sync: if Firebase logged in but no local user, create local user from Firebase
    useEffect(() => {
        if (firebaseUser && !user) {
            (async () => {
                try {
                    const { getUserProfile } = await import('./firebase');
                    const profile = await getUserProfile(firebaseUser.uid);
                    const userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: profile?.displayName || firebaseUser.displayName || firebaseUser.email.split('@')[0],
                        role: profile?.role || 'admin',
                        photoURL: firebaseUser.photoURL,
                        firebaseUser: true,
                    };
                    setUser(userData);
                    localStorage.setItem('dt_user', JSON.stringify(userData));
                } catch (_) {}
            })();
        }
    }, [firebaseUser, user]);

    return (
        <AuthContext.Provider value={{ user, login, firebaseLogin, logout, loading }}>
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
