import React, { Suspense } from 'react'; // Added Suspense
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Loading from './components/Loading'; 
import { usePresence } from './usePresence';

// --- LAZY LOAD PAGES (Performance Optimization) ---
// Instead of importing directly, we load them only when needed
const AuthPage = React.lazy(() => import('./components/Auth'));
const ForgotPasswordPage = React.lazy(() => import('./components/ForgotPassword'));
const DiscoverPage = React.lazy(() => import('./pages/Discover'));
const ConfessionsPage = React.lazy(() => import('./pages/Confession'));
const ChatPage = React.lazy(() => import('./pages/Chat'));
const ProfilePage = React.lazy(() => import('./pages/Profile'));

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth(); 

    if (loading) return <Loading />;
    if (!currentUser) return <Navigate to="/" replace />;

    return children;
};

// Main Layout
const AppLayout = () => {
    return (
        <div className="min-h-screen bg-[#E6E6FA] text-[#3730A3]">
            <Navbar /> 
            <main className="pt-16 pb-20 md:pb-0 md:pt-20 transition-all duration-300 min-h-[calc(100vh-140px)]"> 
                {/* Suspense shows the Loading component while the page code is downloading */}
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route path="/discover" element={<DiscoverPage />} />
                        <Route path="/confessions" element={<ConfessionsPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="*" element={<Navigate to="/discover" replace />} />
                    </Routes>
                </Suspense>
            </main>
        </div>
    );
};

export default function App() {
    usePresence();
    
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

const AppContent = () => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#E6E6FA] flex items-center justify-center">
                <Loading />
            </div>
        );
    }

    return (
        // Wrap public routes in Suspense as well
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route
                    path="/"
                    element={currentUser ? <Navigate to="/discover" replace /> : <AuthPage />}
                />
                
                <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                />

                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Suspense>
    );
}