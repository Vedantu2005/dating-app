import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Auth Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import AuthPage from './components/Auth';
import ForgotPasswordPage from './components/ForgotPassword'; // *** CORRECT IMPORT ADDED ***
import DiscoverPage from './pages/Discover';
import ConfessionsPage from './pages/Confession';
import ChatPage from './pages/Chat';
import ProfilePage from './pages/Profile';
import { usePresence } from './usePresence';

// Components
import Navbar from './components/Navbar';
import Loading from './components/Loading'; // Use custom Loading component

// Protected Route Component (Simplified using AuthContext)
const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth(); // Use context here

    // NOTE: Loading component is used here.
    if (loading) return <Loading />;
    if (!currentUser) return <Navigate to="/" replace />;

    return children;
};

// Main Layout for Authenticated Users
const AppLayout = () => {
    // Navbar components now correctly derive active status from useLocation internally
    return (
        <div className="min-h-screen bg-[#E6E6FA] text-[#3730A3]">
            {/* Navbar reads its own location for active state */}
            <Navbar /> 
            {/* Adjusted padding for mobile (h-16 Navbar) and desktop (h-20 Navbar) */}
            <main className="pt-16 pb-20 md:pb-0 md:pt-20 transition-all duration-300 min-h-[calc(100vh-140px)]"> 
                <Routes>
                    <Route path="/discover" element={<DiscoverPage />} />
                    <Route path="/confessions" element={<ConfessionsPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="*" element={<Navigate to="/discover" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default function App() {
    usePresence();
    // The main App component only provides the BrowserRouter wrapper.
    return (
        <BrowserRouter>
            {/* WRAP THE ENTIRE APPLICATION WITH AuthProvider */}
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

// Inner component to access context and handle top-level routing
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
        <Routes>
            {/* Public Route - Auth. Redirects if user is logged in. */}
            <Route
                path="/"
                element={currentUser ? <Navigate to="/discover" replace /> : <AuthPage />}
            />
            
            {/* *** FIX: NEW PUBLIC ROUTE FOR PASSWORD RESET *** */}
            <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
            />

            {/* Protected Routes - App Layout */}
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <AppLayout />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}