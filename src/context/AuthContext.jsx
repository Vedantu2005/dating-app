import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
// Import 'app' from your firebaseConfig to initialize auth
import app from '../firebaseConfig'; // Ensure this path is correct if firebaseConfig.js exports 'app'

// Initialize Firebase Auth
const auth = getAuth(app); 

// Create the Context
const AuthContext = createContext();

// Custom Hook to use the Auth Context
export const useAuth = () => {
    return useContext(AuthContext);
};

// Provider Component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This is the core Firebase functionality to listen for login/logout
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    const value = {
        currentUser, // null or the logged-in user object (contains uid, displayName, etc.)
        loading,     // true while checking auth status, false otherwise
    };

    // Only render children when loading is complete, preventing components from running with null user/uid
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};