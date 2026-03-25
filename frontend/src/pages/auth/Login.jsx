import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { PremiumInput } from "../../component/common/PremiumInput";
import { PremiumButton } from "../../component/common/PremiumButton";
import { PremiumCheckbox } from "../../component/common/PremiumCheckbox";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../component/alert/ErrorMessage";

const Login = () => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState(null);
    
    const { login, isAuthenticated, isLoggingIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get the page the user was trying to access, or default to dashboard
    const from = location.state?.from?.pathname || "/dashboard";

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
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

            {/* Card */}
            <form 
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-8 space-y-6 shadow-lg"
            >

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-white">
                        Welcome Back
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Enter your credentials to continue
                    </p>
                </div>

                {/* Custom Error Display */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg overflow-hidden">
                        <ErrorMessage 
                            message={error} 
                            onRetry={() => setError(null)} 
                        />
                    </div>
                )}

                {/* Form */}
                <div className="space-y-5">

                    <PremiumInput
                        label="Email or Phone"
                        type="text"
                        placeholder="7388480128"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                    />

                    <PremiumInput
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <div className="flex items-center justify-between">
                        <PremiumCheckbox
                            label="Remember me"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                        />
                        <Link to="/forgot-password" disabled className="text-xs text-blue-500 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 pt-2">
                        <PremiumButton
                            text={isLoggingIn ? "Logging in..." : "Login"}
                            variant="primary"
                            type="submit"
                            disabled={isLoggingIn}
                        />
                        
                        <p className="text-center text-sm text-zinc-400">
                            Don't have an account?{" "}
                            <Link to="/register" className="text-blue-500 hover:underline font-medium">
                                Register
                            </Link>
                        </p>
                    </div>

                </div>

            </form>

        </div>
    );
};

export default Login;