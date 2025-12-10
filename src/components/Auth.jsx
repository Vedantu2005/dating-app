import React, { useState } from 'react';
import { Heart, Sparkles, Mail, Lock, User, ArrowRight, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signInWithPopup,
    getAuth,
    GoogleAuthProvider,
    FacebookAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import app, { googleProvider, facebookProvider } from '../firebaseConfig';

// Initialize Firestore and Auth instances
const db = getFirestore(app);
const auth = getAuth(app);

// --- CUSTOM STYLES & ANIMATIONS ---
const customStyles = `
    @keyframes gradient-xy {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    @keyframes pulse-heart {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
    @keyframes slide-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

// --- NAVIGATION PLACEHOLDER ---
const navigatePlaceholder = (path) => {
    window.location.href = path;
};

// --- HELPER FUNCTION TO SAVE USER DATA TO FIRESTORE ---
const saveUserData = async (user, displayName, isNewUser) => {
    // Determine avatar: Google photo, or first letter
    const avatarLetter = (displayName || user.email?.charAt(0) || 'U').toUpperCase();
    const photoURL = user.photoURL || null;

    // Only set data if it's a fresh signup to avoid overwriting existing data
    if (isNewUser) {
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            displayName: displayName || user.displayName || user.email.split('@')[0],
            email: user.email,
            // Initialize these fields so Discover.jsx doesn't crash on nulls
            photos: photoURL ? [photoURL] : [],
            avatarUrl: photoURL || `https://placehold.co/400x400/purple/white?text=${avatarLetter}`,
            age: '21', // Default
            jobTitle: 'New Member',
            company: '',
            school: '',
            city: 'Unknown',
            aboutMe: 'Just joined! Say hi.',
            prompts: [],
            interests: [],
            createdAt: new Date(),
        }, { merge: true });
    }
};

export default function AuthPage() {
    const [view, setView] = useState('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const isLoginView = view === 'login';
    const navigate = navigatePlaceholder;

    const getErrorMessage = (code) => {
        switch (code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential":
                return "Please SignUp First.";
            case "auth/email-already-in-use":
                return "Email already in use. Try logging in.";
            case "auth/weak-password":
                return "Password must be at least 6 characters.";
            case "auth/invalid-email":
                return "Please enter a valid email.";
            case "auth/popup-closed-by-user":
                return "Login cancelled by user.";
            case "auth/too-many-requests":
                return "Too many attempts. Try again later.";
            default:
                return "An unexpected error occurred. Please try again.";
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            if (isLoginView) {
                if (!email || !password) throw new Error("Please enter email and password");
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                // Check if data exists, if not (legacy users), save it
                await saveUserData(userCredential.user, userCredential.user.displayName, false);
                setSuccess(true);
                setTimeout(() => navigate("/discover"), 1500);
            } else {
                if (!name.trim() || !email || !password) throw new Error("Please fill in all fields");
                if (password.length < 6) throw new Error("Password must be at least 6 characters");

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: name.trim() });

                // Save new user data to Firestore
                await saveUserData(userCredential.user, name.trim(), true);

                setSuccess(true);
                setTimeout(() => navigate("/profile"), 1500);
            }
        } catch (err) {
            console.error("Auth error:", err);
            setError(getErrorMessage(err.code || err.message));
            setLoading(false);
        }
    };

    const handleSocialLogin = async (providerName) => {
        setLoading(true);
        setError('');
        setSuccess(false);

        const selectedProvider = providerName === 'Google' ? googleProvider : facebookProvider;

        try {
            const userCredential = await signInWithPopup(auth, selectedProvider);
            const user = userCredential.user;

            // Check if user is newly created or existing
            await saveUserData(user, user.displayName, userCredential._tokenResponse?.isNewUser || true);

            setSuccess(true);
            setTimeout(() => navigate("/discover"), 1500);
        } catch (err) {
            console.error(`${providerName} login error:`, err);
            setError(getErrorMessage(err.code || err.message));
            setLoading(false);
        }
    };

    const handleSubmit = handleAuth;

    return (
        <>
            <style>{customStyles}</style>

            {/* Main Container */}
            <div className="h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#E6E6FA] via-purple-200 to-purple-300 animate-[gradient-xy_15s_ease_infinite] [background-size:200%_200%] relative overflow-hidden font-inter">

                {/* Floating Hearts Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <Heart className="absolute top-20 left-10 text-purple-400/30 w-8 h-8 animate-[float_6s_ease-in-out_infinite]" />
                    <Heart className="absolute top-40 right-20 text-purple-300/20 w-12 h-12 animate-[float_8s_ease-in-out_infinite]" />
                    <Heart className="absolute bottom-32 left-1/4 text-purple-400/25 w-10 h-10 animate-[float_7s_ease-in-out_infinite]" />
                    <Sparkles className="absolute top-1/3 right-1/3 text-purple-400/30 w-6 h-6 animate-[float_5s_ease-in-out_infinite]" />
                </div>

                {/* Auth Card */}
                <div className="relative w-full max-w-6xl bg-white/98 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden z-10">
                    <div className="flex flex-col md:flex-row md:h-[700px]">

                        {/* Left Side - Form */}
                        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">

                            {/* Logo & Brand */}
                            <div className="text-center mb-8 animate-[slide-in_0.6s_ease-out]">
                                <h1 className="text-4xl font-extrabold md:text-5xl bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
                                    BSSS Dating
                                </h1>
                                <p className="text-gray-600 text-sm mt-2">Find Your Perfect Connection Today</p>
                            </div>

                            {/* Mobile Toggle */}
                            <div className="md:hidden flex gap-2 mb-6">
                                <button
                                    onClick={() => setView('login')}
                                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${isLoginView
                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                                            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                        }`}
                                    disabled={loading}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => setView('signup')}
                                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${!isLoginView
                                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                                            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                        }`}
                                    disabled={loading}
                                >
                                    Sign Up
                                </button>
                            </div>

                            {/* Forms Container */}
                            <div className="relative">

                                {/* --- Form Start --- */}
                                <form onSubmit={handleSubmit}>
                                    {/* Login Form Content */}
                                    {isLoginView && (
                                        <div className="animate-[slide-in_0.5s_ease-out]">
                                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
                                            <p className="text-gray-600 mb-6">Login to start meeting amazing people</p>

                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                                                    <input
                                                        type="email"
                                                        placeholder="Email Address"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-4 bg-purple-50 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:bg-white transition-all outline-none"
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                                                    <input
                                                        type="password"
                                                        placeholder="Password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-4 bg-purple-50 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:bg-white transition-all outline-none"
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-4 h-4 rounded accent-purple-600" />
                                                        <span className="text-gray-600">Remember me</span>
                                                    </label>
                                                    <Link to="/forgot-password" className="text-purple-600 cursor-pointer hover:text-purple-700 font-medium">
                                                        Forgot Password?
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Signup Form Content */}
                                    {!isLoginView && (
                                        <div className="animate-[slide-in_0.5s_ease-out]">
                                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Join Our Community!</h2>
                                            <p className="text-gray-600 mb-6">Create your account and start your journey</p>

                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Full Name"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-4 bg-purple-50 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:bg-white transition-all outline-none"
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                                                    <input
                                                        type="email"
                                                        placeholder="Email Address"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-4 bg-purple-50 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:bg-white transition-all outline-none"
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                                                    <input
                                                        type="password"
                                                        placeholder="Password (min 6 characters)"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-4 bg-purple-50 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:bg-white transition-all outline-none"
                                                        required
                                                        disabled={loading}
                                                    />
                                                </div>

                                                <label className="flex items-start gap-2 cursor-pointer text-sm">
                                                    <input type="checkbox" className="w-4 h-4 mt-0.5 rounded accent-purple-600" required disabled={loading} />
                                                    <span className="text-gray-600">
                                                        I agree to the <span className="text-purple-600 font-medium">Terms of Service</span> and <span className="text-purple-600 font-medium">Privacy Policy</span>
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status & Submit Button */}
                                    <div className={`mt-6 ${!isLoginView ? 'space-y-4' : 'space-y-6'}`}>

                                        {(error || success) && (
                                            <p className={`text-sm text-center font-medium py-3 rounded-xl shadow-md ${error ? "text-red-700 bg-red-100 border border-red-300" : "text-green-700 bg-green-100 border border-green-300"
                                                }`}>
                                                {error || (success && (isLoginView ? "Login successful! 🎉" : "Account created successfully! 🎉"))}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 cursor-pointer text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader className="w-5 h-5 animate-spin" />
                                                    {isLoginView ? 'Logging in...' : 'Creating Account...'}
                                                </>
                                            ) : (
                                                <>
                                                    {isLoginView ? 'Login' : 'Sign Up'}
                                                    <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>

                                        <div className="relative my-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-purple-300"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-4 bg-white text-gray-500">Or continue with</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handleSocialLogin('Google')}
                                                disabled={loading}
                                                className="flex items-center cursor-pointer justify-center gap-2 py-3 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all shadow-sm disabled:opacity-70"
                                            >
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                </svg>
                                                Google
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSocialLogin('Facebook')}
                                                disabled={loading}
                                                className="flex items-center cursor-pointer justify-center gap-2 py-3 border-2 border-purple-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all shadow-sm disabled:opacity-70"
                                            >
                                                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                </svg>
                                                Facebook
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Right Side - Info Panel */}
                        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <Heart className="absolute top-10 left-10 w-20 h-20 animate-[float_6s_ease-in-out_infinite]" />
                                <Heart className="absolute bottom-20 right-10 w-16 h-16 animate-[float_7s_ease-in-out_infinite]" />
                                <Sparkles className="absolute top-1/3 right-1/4 w-12 h-12 animate-[float_5s_ease-in-out_infinite]" />
                            </div>

                            <div className="relative z-10 text-center max-w-md">
                                {isLoginView ? (
                                    <div className="animate-[slide-in_0.6s_ease-out]">
                                        <Sparkles className="w-20 h-20 mx-auto mb-6" />
                                        <h2 className="text-4xl font-bold mb-4">New to BSSS Dating?</h2>
                                        <p className="text-lg mb-8 text-white/90">
                                            Join our growing community and find meaningful connections. Create your profile today and start your story!
                                        </p>
                                        <button
                                            onClick={() => setView('signup')}
                                            className="bg-white text-purple-600 cursor-pointer font-bold px-8 py-3 rounded-full hover:bg-purple-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                        >
                                            Sign Up Now
                                        </button>
                                    </div>
                                ) : (
                                    <div className="animate-[slide-in_0.6s_ease-out]">
                                        <Heart className="w-20 h-20 mx-auto mb-6 fill-white" />
                                        <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
                                        <p className="text-lg mb-8 text-white/90">
                                            Login to explore connections and find people who share your interests and values.
                                        </p>
                                        <button
                                            onClick={() => setView('login')}
                                            className="bg-white text-purple-600 cursor-pointer font-bold px-8 py-3 rounded-full hover:bg-purple-50 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                                        >
                                            Login Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}