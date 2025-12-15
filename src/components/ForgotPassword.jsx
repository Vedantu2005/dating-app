import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
// REMOVE: import { sendPasswordResetEmail } from 'firebase/auth';
// ADD: Functions imports
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebaseConfig'; // Ensure 'app' is exported from firebaseConfig
import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (!email) {
                throw new Error("Please enter your email address.");
            }
            
            // --- NEW CODE: Call Cloud Function instead of Client SDK ---
            const functions = getFunctions(app);
            const sendResetEmailFn = httpsCallable(functions, 'sendPasswordReset');
            
            await sendResetEmailFn({ email });
            // -----------------------------------------------------------
            
            setMessage("Success! Password reset link sent to your email. Please check your inbox.");

        } catch (err) {
            console.error("Password reset error:", err);
            let errorMessage = "Failed to send reset link. Try again later.";
            
            // Handle specific Cloud Function errors
            if (err.message === "User not found" || err.code === "functions/not-found") {
                errorMessage = "Email not found. Please check the address.";
            } else if (err.code === "auth/invalid-email") {
                 errorMessage = "Invalid email format.";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // ... (Rest of the UI remains exactly the same)
    return (
        // ... (Your existing JSX)
        <div className="h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#E6E6FA] to-purple-300">
            {/* ... keeping your existing UI code ... */}
             <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-12 shadow-2xl animate-[slide-in_0.5s_ease-out]">
                <div className="text-center mb-8">
                    <Mail className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Forgot Password?</h2>
                    <p className="text-gray-600">Enter your email and we'll send you a recovery link.</p>
                </div>
                
                <form onSubmit={handleReset} className="space-y-6">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-purple-50 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:bg-white transition-all outline-none"
                            required
                            disabled={loading || message}
                        />
                    </div>

                    {message && (
                        <p className="flex items-center gap-2 text-sm text-green-700 bg-green-100 p-3 rounded-xl">
                            <CheckCircle className="w-4 h-4" /> {message}
                        </p>
                    )}

                    {error && (
                        <p className="flex items-center gap-2 text-sm text-red-700 bg-red-100 p-3 rounded-xl">
                            <AlertTriangle className="w-4 h-4" /> {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || message}
                        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 cursor-pointer text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Sending Link...
                            </>
                        ) : (
                            "Send Reset Link"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}