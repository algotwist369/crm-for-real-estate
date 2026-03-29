import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../component/alert/ErrorMessage";
import SuccessMessage from "../../component/alert/SuccessMessage";
import { FiUpload, FiLink, FiCamera, FiMail, FiLock, FiUser, FiSmartphone, FiCheck } from "react-icons/fi";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [profilePicMode, setProfilePicMode] = useState("url"); // 'url' or 'upload'
    const [profilePic, setProfilePic] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const fileInputRef = useRef(null);

    const { register, isAuthenticated, isRegistering } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && !isSuccess) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, navigate, isSuccess]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError("Image size must be less than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result); // Base64
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!name.trim() || name.length < 2) {
            setError("Full name must be at least 2 characters");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address");
            return;
        }
        if (!/^\d{10,15}$/.test(phone.replace(/\D/g, ""))) {
            setError("Phone number must be between 10-15 digits");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (!acceptTerms) {
            setError("Please accept the Terms & Conditions");
            return;
        }

        try {
            const userData = { 
                user_name: name, 
                email, 
                phone_number: phone, 
                password,
                profile_pic: profilePic,
                remember
            };
            
            await register(userData);
            setIsSuccess(true);
            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please check your details.");
            console.error("Registration component error:", err);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center px-6 bg-black">
                <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded p-8">
                    <SuccessMessage 
                        message="Account created successfully! Redirecting..." 
                        onAction={() => navigate("/dashboard")}
                        actionText="Go to Dashboard"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-black py-12">
            <div className="w-full max-w-md">
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-yellow-600 text-white font-bold text-xl mb-4">LR</div>
                    <h1 className="text-xl font-medium text-white">AlgoTwist CRM</h1>
                </div>

                <form 
                    onSubmit={handleSubmit}
                    className="bg-zinc-950/20 border border-zinc-800 rounded p-8 space-y-6"
                >
                    <div className="space-y-1 text-center">
                        <h2 className="text-lg font-medium text-white">Create Account</h2>
                        <p className="text-sm text-zinc-500">Join the AlgoTwist platform</p>
                    </div>

                    {error && (
                        <div className="p-3 rounded bg-red-500/10 border border-red-500/20">
                            <ErrorMessage message={error} onRetry={() => setError(null)} />
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400">Full Name</label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded p-2.5 pl-10 focus:outline-none focus:border-zinc-700 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400">Email Address</label>
                                <div className="relative">
                                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded p-2.5 pl-10 focus:outline-none focus:border-zinc-700 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-400">Phone</label>
                                <div className="relative">
                                    <FiSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                    <input
                                        type="text"
                                        placeholder="+91..."
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded p-2.5 pl-10 focus:outline-none focus:border-zinc-700 transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-400">Create Password</label>
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

                        {/* Profile Picture */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-400">Profile Image</label>
                            <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex items-center gap-4">
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-12 h-12 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden group cursor-pointer hover:border-zinc-600 transition-colors"
                                >
                                    {profilePic ? (
                                        <img src={profilePic} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <FiCamera size={18} className="text-zinc-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex gap-2">
                                        <button 
                                            type="button" 
                                            onClick={() => setProfilePicMode("upload")}
                                            className={`text-[10px] px-2 py-1 rounded border transition-colors ${profilePicMode === 'upload' ? 'bg-zinc-800 border-zinc-700 text-white' : 'text-zinc-500 border-zinc-800 hover:text-zinc-400'}`}
                                        >
                                            Upload
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setProfilePicMode("url")}
                                            className={`text-[10px] px-2 py-1 rounded border transition-colors ${profilePicMode === 'url' ? 'bg-zinc-800 border-zinc-700 text-white' : 'text-zinc-500 border-zinc-800 hover:text-zinc-400'}`}
                                        >
                                            URL
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        {profilePicMode === 'upload' ? (
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current.click()}
                                                className="text-xs text-yellow-500 hover:text-yellow-400"
                                            >
                                                Select system file
                                            </button>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder="Paste image link..."
                                                value={profilePic.startsWith('data:') ? '' : profilePic}
                                                onChange={(e) => setProfilePic(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 rounded p-1.5 focus:outline-none"
                                            />
                                        )}
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${acceptTerms ? 'bg-yellow-600 border-yellow-600 text-white' : 'bg-zinc-900 border-zinc-800 group-hover:border-zinc-700'}`}>
                                    {acceptTerms && <FiCheck size={12} strokeWidth={4} />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="hidden"
                                />
                                <span className="text-xs text-zinc-400">I agree to the <span className="text-yellow-500">Terms & Conditions</span></span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${remember ? 'bg-yellow-600 border-yellow-600 text-white' : 'bg-zinc-900 border-zinc-800 group-hover:border-zinc-700'}`}>
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
                        </div>

                        <button
                            type="submit"
                            disabled={isRegistering}
                            className="w-full py-2.5 px-4 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRegistering ? "Creating..." : "Create Account"}
                        </button>

                        <div className="text-center">
                            <p className="text-xs text-zinc-500">
                                Already have an account?{" "}
                                <Link to="/login" className="text-yellow-500 hover:text-yellow-400 font-medium">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;