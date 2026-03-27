import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../component/alert/ErrorMessage";
import { FiMail, FiLock, FiCheck, FiSmartphone, FiShield, FiUsers } from "react-icons/fi";

const Login = () => {
    const [loginRole, setLoginRole] = useState("admin"); // "admin" or "agent"
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState(null);
    
    const { login, loginAgent, isAuthenticated, isLoggingIn, isAgentLoggingIn } = useAuth();
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
            setError(loginRole === "admin" ? "Email or Phone Number is required" : "Phone or email ID is required");
            return;
        }
        if (!password) {
            setError(loginRole === "admin" ? "Password is required" : "Agent PIN is required");
            return;
        }

        try {
            if (loginRole === "admin") {
                await login({ 
                    phone_or_email: identifier, 
                    password,
                    remember 
                });
            } else {
                await loginAgent({
                    phone_or_email: identifier,
                    agent_pin: password,
                    remember
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please check your details.");
            console.error("Login component error:", err);
        }
    };

    const isPending = isLoggingIn || isAgentLoggingIn;

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-black">
            <div className="w-full max-w-md">
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-blue-600 text-white font-bold text-xl mb-4 shadow-lg shadow-blue-500/20">LR</div>
                    <h1 className="text-xl font-medium text-white tracking-tight">LeadReal CRM</h1>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded overflow-hidden shadow-2xl">
                    {/* Role Switcher Tabs */}
                    <div className="flex border-b border-zinc-900 bg-zinc-900/10">
                        <button
                            onClick={() => { setLoginRole("admin"); setError(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${loginRole === "admin" 
                                ? "text-blue-500 bg-transparent border-b-2 border-blue-500" 
                                : "text-zinc-500 hover:text-zinc-300 bg-transparent"}`}
                        >
                            <FiShield size={14} />
                            Admin Console
                        </button>
                        <button
                            onClick={() => { setLoginRole("agent"); setError(null); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${loginRole === "agent" 
                                ? "text-blue-500 bg-transparent border-b-2 border-blue-500" 
                                : "text-zinc-500 hover:text-zinc-300 bg-transparent"}`}
                        >
                            <FiUsers size={14} />
                            Agent Portal
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-1">
                            <h2 className="text-lg font-medium text-white">
                                {loginRole === "admin" ? "Systems Login" : "Agent Access"}
                            </h2>
                            <p className="text-sm text-zinc-500">
                                {loginRole === "admin" ? "Access secure administrative controls" : "Sign in with your assigned phone & PIN"}
                            </p>
                        </div>

                        {error && (
                            <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                                <ErrorMessage message={error} onRetry={() => setError(null)} />
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400">
                                    {loginRole === "admin" ? "Admin Identifier" : "Agent ID (Phone/Email)"}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                                        {loginRole === "admin" ? <FiMail size={16} /> : <FiSmartphone size={16} />}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={loginRole === "admin" ? "Email or Phone Number" : "Assigned Phone or Email"}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded p-3 pl-10 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-800 transition-all placeholder:text-zinc-700"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400">
                                    {loginRole === "admin" ? "Security Password" : "Secure Agent PIN"}
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                    <input
                                        type="password"
                                        placeholder={loginRole === "admin" ? "••••••••" : "Agent PIN Code"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded p-3 pl-10 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-800 transition-all placeholder:text-zinc-700"
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
                                    <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">Keep me signed in</span>
                                </label>
                                {loginRole === "admin" && (
                                    <Link to="/forgot-password" px-2 className="text-xs text-blue-500 hover:text-blue-400 font-medium">
                                        Forgot?
                                    </Link>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/10"
                            >
                                {isPending ? "Validating..." : `Sign In as ${loginRole === "admin" ? "Admin" : "Agent"}`}
                            </button>

                            {loginRole === "admin" && (
                                <div className="text-center pt-2">
                                    <p className="text-xs text-zinc-500">
                                        New to the platform?{" "}
                                        <Link to="/register" className="text-blue-500 hover:text-blue-400 font-semibold">
                                            Create Admin Account
                                        </Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;