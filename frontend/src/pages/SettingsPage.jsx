import React, { useState, useEffect, useRef } from "react";
import AppLayout from "../component/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
import { useUpdateProfile } from "../hooks/useAuthHooks";
import { 
    FiUser, 
    FiSettings, 
    FiBell, 
    FiShield, 
    FiBriefcase, 
    FiMail, 
    FiPhone, 
    FiCamera,
    FiGlobe,
    FiLock,
    FiLogOut,
    FiCreditCard,
    FiTrendingUp,
    FiCalendar,
    FiActivity,
    FiCheckCircle,
    FiXCircle,
    FiLink,
    FiUpload,
    FiCheck,
    FiEye,
    FiEyeOff
} from "react-icons/fi";

const SettingsInput = ({ label, type = "text", value, onChange, placeholder, icon, disabled, className = "" }) => (
    <div className={`space-y-1.5 ${className}`}>
        {label && <label className="block text-xs font-medium text-zinc-400">{label}</label>}
        <div className="relative flex items-center group">
            <div className="absolute left-3 text-zinc-500 group-focus-within:text-zinc-300 transition-colors">
                {icon}
            </div>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-zinc-900 border border-zinc-800 text-sm text-white rounded p-2.5 pl-10 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-zinc-600"
            />
        </div>
    </div>
);

const SettingsToggle = ({ enabled, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none ${enabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
    >
        <span className="sr-only">Use setting</span>
        <span
            aria-hidden="true"
            className={`pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
        />
    </button>
);

const SettingsPage = () => {
    const { user, isLoading: isUserLoading } = useAuth();
    const { mutateAsync: updateProfile, isPending: isUpdating } = useUpdateProfile();
    const [activeTab, setActiveTab] = useState("Profile");
    const [isSaving, setIsSaving] = useState(false);
    const [profilePicMode, setProfilePicMode] = useState("url"); // 'url' or 'upload'
    const fileInputRef = useRef(null);

    // Form States
    const [profileData, setProfileData] = useState({
        name: "",
        email: "",
        phone: "",
        role: "",
        profile_pic: "",
        bio: "Experienced real estate consultant managing lead flows and agent performance."
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.user_name || "",
                email: user.email || "",
                phone: user.phone_number || "",
                role: user.role || "Admin",
                profile_pic: user.profile_pic || "",
                bio: profileData.bio
            });
        }
    }, [user]);

    const [agencyData, setAgencyData] = useState({
        agencyName: "LeadReal Solutions",
        license: "REA-2024-0012",
        website: "https://leadreal.com",
        address: "123, Business District, Metro City, 400001"
    });

    const [notifications, setNotifications] = useState({
        leadEmail: true,
        leadSMS: false,
        systemAlerts: true,
        agentPerformance: true
    });

    const [securityData, setSecurityData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Image size must be less than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData({ ...profileData, profile_pic: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                user_name: profileData.name,
                email: profileData.email,
                phone_number: profileData.phone,
                profile_pic: profileData.profile_pic
            });
        } catch (err) {
            console.error("Update error:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const tabs = user?.role === "agent" 
        ? ["Profile", "Agency"] 
        : ["Profile", "Agency", "Notifications", "Security"];

    const renderProfile = () => (
        <div className="space-y-6 max-w-4xl">
            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className="relative group">
                            <div 
                                onClick={() => profilePicMode === 'upload' && fileInputRef.current.click()}
                                className="w-24 h-24 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all text-zinc-500 hover:text-white"
                            >
                                {profileData.profile_pic ? (
                                    <img src={profileData.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-medium text-white">
                                        {profileData?.name?.substring(0, 2).toUpperCase() || "A"}
                                    </span>
                                )}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiCamera size={20} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => setProfilePicMode("url")}
                                className={`w-10 h-10 flex items-center justify-center text-zinc-400 rounded border transition-colors ${profilePicMode === 'url' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 hover:text-white'}`}
                                title="Use Image URL"
                            >
                                <FiLink size={14} />
                            </button>
                            <button
                                onClick={() => setProfilePicMode("upload")}
                                className={`w-10 h-10 flex items-center justify-center text-zinc-400 rounded border transition-colors ${profilePicMode === 'upload' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-900 border-zinc-800 hover:text-white'}`}
                                title="Upload File"
                            >
                                <FiUpload size={14} />
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SettingsInput 
                                label="Full Name" 
                                placeholder="John Doe" 
                                value={profileData.name} 
                                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                icon={<FiUser />}
                            />
                            <SettingsInput 
                                label="Email Address" 
                                type="email"
                                placeholder="john@example.com" 
                                value={profileData.email} 
                                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                icon={<FiMail />}
                            />
                            <SettingsInput 
                                label="Phone Number" 
                                placeholder="+91 00000-00000" 
                                value={profileData.phone} 
                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                icon={<FiPhone />}
                            />
                            <SettingsInput 
                                label="Account Role" 
                                placeholder="Agency Admin" 
                                value={profileData.role} 
                                disabled
                                icon={<FiShield />}
                            />
                        </div>

                        {profilePicMode === 'url' && (
                             <SettingsInput 
                                label="Profile Picture URL" 
                                placeholder="https://example.com/photo.jpg" 
                                value={profileData.profile_pic.startsWith('data:') ? '' : profileData.profile_pic} 
                                onChange={(e) => setProfileData({...profileData, profile_pic: e.target.value})}
                                icon={<FiLink />}
                            />
                        )}

                        {/* System Metadata Section */}
                        <div className="pt-6 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
                                    <FiCreditCard size={14} className="text-zinc-400" /> Subscription
                                </p>
                                <div className="flex items-center gap-2">
                                    {user?.is_paid ? (
                                        <span className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                                            <FiCheckCircle size={14} /> Premium Plan
                                        </span>
                                    ) : (
                                        <span className="text-sm text-zinc-400 flex items-center gap-1.5">
                                            <FiXCircle size={14} /> Free Tier
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
                                    <FiActivity size={14} className="text-zinc-400" /> System Status
                                </p>
                                <span className={`text-sm font-medium flex items-center gap-1.5 ${user?.is_active ? 'text-blue-400' : 'text-red-400'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${user?.is_active ? 'bg-blue-400' : 'bg-red-400'}`}></div> {user?.is_active ? 'Active Account' : 'Inactive'}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs text-zinc-500 flex items-center gap-1.5 mb-1">
                                    <FiCalendar size={14} className="text-zinc-400" /> Member Since
                                </p>
                                <p className="text-sm text-zinc-300 font-medium">
                                    {formatDate(user?.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                             <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
                                <p className="text-xs text-zinc-500 mb-1">Last Activity</p>
                                <p className="text-sm text-zinc-300 font-medium">{formatDate(user?.last_login_at)}</p>
                            </div>
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded">
                                <p className="text-xs text-zinc-500 mb-1">UUID</p>
                                <p className="text-xs text-zinc-400 font-mono truncate">{user?._id || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAgency = () => (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                <div className="space-y-2 mb-6 border-b border-zinc-800 pb-4">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <FiBriefcase className="text-zinc-500" /> Agency Identity
                    </h3>
                    <p className="text-xs text-zinc-500">How your brand appears to agents and leads.</p>
                </div>
                
                <div className="space-y-4">
                    <SettingsInput 
                        label="Company Name" 
                        value={agencyData.agencyName} 
                        onChange={(e) => setAgencyData({...agencyData, agencyName: e.target.value})}
                        icon={<FiBriefcase />}
                    />
                    <SettingsInput 
                        label="REA License Number" 
                        value={agencyData.license} 
                        onChange={(e) => setAgencyData({...agencyData, license: e.target.value})}
                        icon={<FiShield />}
                    />
                    <SettingsInput 
                        label="Official Website" 
                        value={agencyData.website} 
                        icon={<FiGlobe />}
                        onChange={(e) => setAgencyData({...agencyData, website: e.target.value})}
                    />
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="space-y-6 max-w-2xl">
            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <FiBell className="text-zinc-500" /> Lead Alerts
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded transition-colors">
                        <div>
                            <p className="text-sm font-medium text-white mb-0.5">Email Notifications</p>
                            <p className="text-xs text-zinc-500">Receive instant email when a new lead is assigned.</p>
                        </div>
                        <SettingsToggle 
                            enabled={notifications.leadEmail} 
                            onChange={() => setNotifications({...notifications, leadEmail: !notifications.leadEmail})} 
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded transition-colors">
                        <div>
                            <p className="text-sm font-medium text-white mb-0.5">SMS Alerts</p>
                            <p className="text-xs text-zinc-500">Emergency SMS for high-priority lead escalations.</p>
                        </div>
                        <SettingsToggle 
                            enabled={notifications.leadSMS} 
                            onChange={() => setNotifications({...notifications, leadSMS: !notifications.leadSMS})} 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <FiTrendingUp className="text-zinc-500" /> Business Intelligence
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded transition-colors">
                        <div>
                            <p className="text-sm font-medium text-white mb-0.5">Agent Performance Reports</p>
                            <p className="text-xs text-zinc-500">Weekly digest of top-performing realtors.</p>
                        </div>
                        <SettingsToggle 
                            enabled={notifications.agentPerformance} 
                            onChange={() => setNotifications({...notifications, agentPerformance: !notifications.agentPerformance})} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-6 max-w-xl">
            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                <div className="flex items-center gap-4 mb-6 border-b border-zinc-800 pb-4">
                    <div className="w-10 h-10 border border-zinc-800 bg-zinc-900 text-zinc-400 rounded flex items-center justify-center">
                        <FiShield size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-white mb-1">Security & Access</h3>
                        <p className="text-xs text-zinc-500">Manage your credentials and API access</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <SettingsInput 
                        label="Current Password" 
                        type="password" 
                        placeholder="••••••••" 
                        icon={<FiLock />} 
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                    />
                    <SettingsInput 
                        label="New Password" 
                        type="password" 
                        placeholder="Min 8 characters" 
                        icon={<FiLock />} 
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                    />
                    <SettingsInput 
                        label="Confirm New Password" 
                        type="password" 
                        placeholder="Confirm password" 
                        icon={<FiLock />} 
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    />
                    
                    <div className="pt-4">
                        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium rounded transition-colors">
                            Update Password
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h4 className="text-sm font-medium text-red-500 mb-1 flex items-center gap-2">
                         Deactivate System Account
                    </h4>
                    <p className="text-xs text-zinc-500">This action is irreversible and hides all associated agency data.</p>
                </div>
                <button className="text-sm font-medium text-red-500 hover:bg-red-500/10 py-2 px-4 rounded border border-red-500/20 transition-colors whitespace-nowrap">
                    Initiate Exit
                </button>
            </div>
        </div>
    );

    return (
        <AppLayout>
            <div className="max-w-6xl w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pt-2">
                    <div>
                        <h2 className="text-xl font-medium text-white mb-1">System Settings</h2>
                        <p className="text-sm text-zinc-400">Configure your agency profile and global preferences</p>
                    </div>
                    
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded flex items-center justify-center transition-colors w-full md:w-auto h-10"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                {/* Tabs Wrapper */}
                <div className="bg-zinc-900 border border-zinc-800 p-1 rounded inline-flex mb-8 overflow-x-auto max-w-full scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab 
                                ? 'bg-zinc-800 text-white shadow-sm' 
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Section */}
                <div className="min-h-[400px]">
                    {activeTab === "Profile" && renderProfile()}
                    {activeTab === "Agency" && renderAgency()}
                    {activeTab === "Notifications" && renderNotifications()}
                    {activeTab === "Security" && renderSecurity()}
                </div>
            </div>
        </AppLayout>
    );
};

export default SettingsPage;
