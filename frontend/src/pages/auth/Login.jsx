import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../component/alert/ErrorMessage";
import { FiMail, FiLock, FiCheck } from "react-icons/fi";

const Login = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState(null);
    
    const { login, isAuthenticated, isLoggingIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const from = location.state?.from?.pathname || "/dashboard";

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!identifier.trim()) {
            setError("Email or Phone Number is required");
            return;
        }
        if (!password) {
            setError("Password is required");
            return;
        }

        try {
            await login({ 
                phone_or_email: identifier, 
                password,
                remember 
            });
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please check your details.");
            console.error("Login component error:", err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-black">
            <div className="w-full max-w-md">
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-blue-600 text-white font-bold text-xl mb-4">LR</div>
                    <h1 className="text-xl font-medium text-white">LeadReal CRM</h1>
                </div>

                <form 
                    onSubmit={handleSubmit}
                    className="bg-zinc-950/20 border border-zinc-800 rounded p-8 space-y-6"
                >
                    <div className="space-y-1">
                        <h2 className="text-lg font-medium text-white">Welcome Back</h2>
                        <p className="text-sm text-zinc-500">Sign in to manage your leads</p>
                    </div>

                    {error && (
                        <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                            <ErrorMessage message={error} onRetry={() => setError(null)} />
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400">Email or Phone</label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                <input
                                    type="text"
                                    placeholder="Enter your email or phone"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded p-2.5 pl-10 focus:outline-none focus:border-zinc-700 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400">Password</label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded p-2.5 pl-10 focus:outline-none focus:border-zinc-700 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${remember ? 'bg-blue-600 border-blue-600 text-white' : 'bg-zinc-900 border-zinc-800 group-hover:border-zinc-700'}`}>
                                    {remember && <FiCheck size={12} strokeWidth={4} />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="hidden"
                                />
                                <span className="text-xs text-zinc-400">Remember me</span>
                            </label>
                            <Link to="/forgot-password" px-2 className="text-xs text-blue-500 hover:text-blue-400">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoggingIn ? "Signing in..." : "Login"}
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-xs text-zinc-500">
                                Don't have an account?{" "}
                                <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium">
                                    Register
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;