import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PremiumInput } from "../../component/common/PremiumInput";
import { PremiumButton } from "../../component/common/PremiumButton";
import { PremiumCheckbox } from "../../component/common/PremiumCheckbox";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../component/alert/ErrorMessage";
import SuccessMessage from "../../component/alert/SuccessMessage";
import { FiUpload, FiLink, FiCamera } from "react-icons/fi";

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
                <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-8 shadow-lg">
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
        <div className="min-h-screen flex items-center justify-center px-6 bg-black py-10">

            {/* Card */}
            <form 
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-8 space-y-6 shadow-lg"
            >

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-semibold text-white">
                        Create Account
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Join Admin Leads today
                    </p>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg overflow-hidden">
                        <ErrorMessage 
                            message={error} 
                            onRetry={() => setError(null)} 
                        />
                    </div>
                )}

                {/* Form */}
                <div className="space-y-4">

                    <PremiumInput
                        label="Full Name"
                        placeholder="Ankit Pathak"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <PremiumInput
                        label="Email Address"
                        type="email"
                        placeholder="ankit@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <PremiumInput
                        label="Phone Number"
                        type="text"
                        placeholder="Enter your phone"
                    />

                    <PremiumInput
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {/* Profile Pic Section */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-300">
                            Profile Picture (Optional)
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setProfilePicMode("url")}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 border transition-all ${
                                    profilePicMode === "url" 
                                    ? "bg-blue-600 border-blue-500 text-white" 
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                }`}
                            >
                                <FiLink size={14} /> URL
                            </button>
                            <button
                                type="button"
                                onClick={() => setProfilePicMode("upload")}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 border transition-all ${
                                    profilePicMode === "upload" 
                                    ? "bg-blue-600 border-blue-500 text-white" 
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                }`}
                            >
                                <FiUpload size={14} /> Upload
                            </button>
                        </div>

                        {profilePicMode === "url" ? (
                            <PremiumInput
                                placeholder="https://example.com/photo.jpg"
                                value={profilePic.startsWith("data:") ? "" : profilePic}
                                onChange={(e) => setProfilePic(e.target.value)}
                            />
                        ) : (
                            <div className="flex items-center gap-4">
                                <div 
                                    onClick={() => fileInputRef.current.click()}
                                    className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-zinc-600 transition-all"
                                >
                                    {profilePic.startsWith("data:") ? (
                                        <img src={profilePic} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <FiCamera className="text-zinc-500 group-hover:text-zinc-300" size={24} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden" 
                                        accept="image/*"
                                    />
                                    <PremiumButton 
                                        text="Choose Image" 
                                        variant="secondary"
                                        onClick={() => fileInputRef.current.click()}
                                        className="w-full text-xs py-2"
                                        type="button"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <PremiumCheckbox
                        label="I agree to the Terms & Conditions"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                    />

                    <PremiumCheckbox
                        label="Remember me"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                    />

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 pt-2">
                        <PremiumButton
                            text={isRegistering ? "Creating account..." : "Create Account"}
                            variant="primary"
                            type="submit"
                            disabled={isRegistering}
                        />
                        
                        <p className="text-center text-sm text-zinc-400">
                            Already have an account?{" "}
                            <Link to="/login" className="text-blue-500 hover:underline font-medium">
                                Login
                            </Link>
                        </p>
                    </div>

                </div>

            </form>

        </div>
    );
};

export default Register;