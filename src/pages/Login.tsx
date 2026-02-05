import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from 'lucide-react';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { loginAsGuest } = useAuth();
    const [isLoggingIn, setIsLoggingIn] = React.useState(false);

    const handleGoogleLogin = async () => {
        if (isLoggingIn) return;
        setIsLoggingIn(true);
        try {
            console.log("Starting Google Login...");
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            console.log("Google Login Success:", user.uid);

            console.log("Navigating to dashboard...");
            navigate('/dashboard');

            const userRef = doc(db, 'users', user.uid);
            console.log("Saving user profile in background...");

            getDoc(userRef).then(userSnap => {
                if (!userSnap.exists()) {
                    console.log("User not found, creating new user doc...");
                    return setDoc(userRef, {
                        uid: user.uid,
                        displayName: user.displayName,
                        email: user.email,
                        photoURL: user.photoURL,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                } else {
                    console.log("User already exists.");
                }
            }).catch(error => console.warn("Firestore error:", error));

        } catch (error) {
            console.error("Login logic failed:", error);
            alert(`Login failed: ${(error as Error).message}`);
            setIsLoggingIn(false);
        }
    };

    const handleGuestLogin = () => {
        loginAsGuest();
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors duration-300">
            {/* Visual Side */}
            <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 bg-slate-900 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/20 blur-[120px] rounded-full mix-blend-screen -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[100px] rounded-full mix-blend-screen -ml-20 -mb-20" />

                <div className="relative z-10 max-w-lg text-center">
                    <h2 className="text-4xl font-bold text-white mb-6">Experience the flow.</h2>
                    <p className="text-lg text-blue-200 leading-relaxed">
                        Join thousands of students managing their projects with effortless precision and clarity.
                    </p>
                </div>
            </div>

            {/* Login Form Side */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="text-white text-3xl font-bold">A</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
                        <p className="text-slate-500 dark:text-slate-400">Sign in to continue your progress</p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoggingIn}
                            className={`w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-white font-semibold py-4 px-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoggingIn ? (
                                <span className="animate-pulse">Signing in...</span>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continue with Google
                                </>
                            )}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-slate-950 text-slate-400">Or continue with</span></div>
                        </div>

                        <button
                            onClick={handleGuestLogin}
                            className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 px-6 rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-slate-900/10"
                        >
                            <Layout className="w-5 h-5" />
                            Guest Access
                        </button>
                    </div>

                    <p className="text-center text-sm text-slate-400 mt-8">
                        By continuing, you agree to our Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
