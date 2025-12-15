import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Loading from './components/Loading'; 
import { usePresence } from './usePresence';

// --- LAZY LOAD PAGES ---
const AuthPage = React.lazy(() => import('./components/Auth'));
const ForgotPasswordPage = React.lazy(() => import('./components/ForgotPassword'));
const DiscoverPage = React.lazy(() => import('./pages/Discover'));
const ConfessionsPage = React.lazy(() => import('./pages/Confession'));
const ChatPage = React.lazy(() => import('./pages/Chat'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth(); 

    if (loading) return <Loading />;
    if (!currentUser) return <Navigate to="/" replace />;

    return children;
};

// --- Child Component for Routes (Accesses Context) ---
const AppRoutes = () => {
    const { currentUser } = useAuth();
    usePresence(); // Keep presence tracking active

    return (
        <div className="min-h-screen bg-[#E6E6FA] text-[#3730A3]">
            {/* Show Navbar only if logged in */}
            {currentUser && <Navbar />} 
            
            <main className={currentUser ? "pt-16 pb-20 md:pb-0 md:pt-20 transition-all duration-300 min-h-[calc(100vh-140px)]" : ""}> 
                <Suspense fallback={<Loading />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route 
                            path="/" 
                            element={!currentUser ? <AuthPage /> : <Navigate to="/profile" replace />} 
                        />
                        <Route 
                            path="/login" 
                            element={!currentUser ? <AuthPage /> : <Navigate to="/profile" replace />} 
                        />
                        <Route 
                            path="/forgot-password" 
                            element={<ForgotPasswordPage />} 
                        />

                        {/* Protected Routes */}
                        <Route 
                            path="/profile" 
                            element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
                        />
                        <Route 
                            path="/discover" 
                            element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} 
                        />
                        <Route 
                            path="/confessions" 
                            element={<ProtectedRoute><ConfessionsPage /></ProtectedRoute>} 
                        />
                        <Route 
                            path="/chat" 
                            element={<ProtectedRoute><ChatPage /></ProtectedRoute>} 
                        />

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to={currentUser ? "/profile" : "/"} replace />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
    );
};

// --- Main App Component (Wraps Everything) ---
export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}  