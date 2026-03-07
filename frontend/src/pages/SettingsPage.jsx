import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { PremiumTabs } from "../component/common/PremiumTabs";
import { PremiumInput } from "../component/common/PremiumInput";
import { PremiumToggle } from "../component/common/PremiumToggle";
import { PremiumButton } from "../component/common/PremiumButton";
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
    FiTrendingUp
} from "react-icons/fi";

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState("Profile");
    const [isSaving, setIsSaving] = useState(false);

    // Form States
    const [profileData, setProfileData] = useState({
        name: "Admin User",
        email: "admin@leadreal.com",
        phone: "+91 98765-43210",
        role: "Main Agency Admin",
        bio: "Experienced real estate consultant managing lead flows and agent performance."
    });

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

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert("Settings updated successfully!");
        }, 1500);
    };

    const renderProfile = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row gap-10">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all duration-300">
                                <span className="text-3xl font-black text-blue-500">AU</span>
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiCamera className="text-white" size={24} />
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full border-4 border-zinc-950 flex items-center justify-center text-white shadow-lg">
                                <FiCamera size={14} />
                            </div>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Change Photo</p>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PremiumInput 
                            label="Full Name" 
                            placeholder="John Doe" 
                            value={profileData.name} 
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            icon={<FiUser />}
                        />
                        <PremiumInput 
                            label="Email Address" 
                            type="email"
                            placeholder="john@example.com" 
                            value={profileData.email} 
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            icon={<FiMail />}
                        />
                        <PremiumInput 
                            label="Phone Number" 
                            placeholder="+91 00000-00000" 
                            value={profileData.phone} 
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            icon={<FiPhone />}
                        />
                        <PremiumInput 
                            label="Position / Role" 
                            placeholder="Agency Admin" 
                            value={profileData.role} 
                            disabled
                            icon={<FiBriefcase />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAgency = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FiBriefcase className="text-blue-500" /> Agency Identity
                        </h3>
                        <p className="text-xs text-zinc-500">How your brand appears to agents and leads.</p>
                    </div>
                    
                    <div className="space-y-6">
                        <PremiumInput 
                            label="Company Name" 
                            value={agencyData.agencyName} 
                            onChange={(e) => setAgencyData({...agencyData, agencyName: e.target.value})}
                        />
                        <PremiumInput 
                            label="REA License Number" 
                            value={agencyData.license} 
                            onChange={(e) => setAgencyData({...agencyData, license: e.target.value})}
                        />
                        <PremiumInput 
                            label="Official Website" 
                            value={agencyData.website} 
                            icon={<FiGlobe />}
                            onChange={(e) => setAgencyData({...agencyData, website: e.target.value})}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <FiBell className="text-blue-500" /> Lead Alerts
                </h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-all">
                        <div>
                            <p className="text-sm font-bold text-white mb-1">Email Notifications</p>
                            <p className="text-xs text-zinc-500">Receive instant email when a new lead is assigned.</p>
                        </div>
                        <PremiumToggle 
                            enabled={notifications.leadEmail} 
                            onChange={() => setNotifications({...notifications, leadEmail: !notifications.leadEmail})} 
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-all">
                        <div>
                            <p className="text-sm font-bold text-white mb-1">SMS Alerts</p>
                            <p className="text-xs text-zinc-500">Emergency SMS for high-priority lead escalations.</p>
                        </div>
                        <PremiumToggle 
                            enabled={notifications.leadSMS} 
                            onChange={() => setNotifications({...notifications, leadSMS: !notifications.leadSMS})} 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <FiTrendingUp className="text-purple-500" /> Business Intelligence
                </h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-zinc-900/40 rounded-xl border border-zinc-800/50 hover:border-zinc-700 transition-all">
                        <div>
                            <p className="text-sm font-bold text-white mb-1">Agent Performance Reports</p>
                            <p className="text-xs text-zinc-500">Weekly digest of top-performing realtors.</p>
                        </div>
                        <PremiumToggle 
                            enabled={notifications.agentPerformance} 
                            onChange={() => setNotifications({...notifications, agentPerformance: !notifications.agentPerformance})} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 mb-6">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                        <FiShield size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Security & Access</h3>
                        <p className="text-xs text-zinc-500">Manage your credentials and API access</p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <PremiumInput 
                        label="Current Password" 
                        type="password" 
                        placeholder="••••••••" 
                        icon={<FiLock />} 
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({...securityData, currentPassword: e.target.value})}
                    />
                    <PremiumInput 
                        label="New Password" 
                        type="password" 
                        placeholder="Min 8 characters" 
                        icon={<FiLock />} 
                        value={securityData.newPassword}
                        onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
                    />
                    <PremiumInput 
                        label="Confirm New Password" 
                        type="password" 
                        placeholder="Confirm" 
                        icon={<FiLock />} 
                        value={securityData.confirmPassword}
                        onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    />
                    
                    <div className="pt-4">
                        <PremiumButton text="Update Security" variant="secondary" />
                    </div>
                </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-red-400 mb-1 italic flex items-center gap-2">
                         Deactivate System Account
                    </h4>
                    <p className="text-[10px] text-zinc-600">This action is irreversible and hides all associated agency data.</p>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 py-2 px-4 rounded-lg border border-red-500/20 transition-all">
                    Initiate Exit
                </button>
            </div>
        </div>
    );

    return (
        <AppLayout>
            <div className="max-w-[1200px] mx-auto pb-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-2">
                    <div>
                        <h2 className="text-3xl font-black text-white mb-2">System Settings</h2>
                        <p className="text-sm text-zinc-500 font-medium italic">Configure your agency profile and global preferences</p>
                    </div>
                    
                    <div className="w-48">
                        <PremiumButton 
                            text={isSaving ? "Saving..." : "Save Changes"} 
                            variant="primary" 
                            disabled={isSaving}
                            onClick={handleSave}
                        />
                    </div>
                </div>

                {/* Tabs Wrapper */}
                <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 mb-8">
                    <div className="max-w-2xl mx-auto">
                        <PremiumTabs 
                            options={["Profile", "Agency", "Notifications", "Security"]}
                            value={activeTab}
                            onChange={(val) => setActiveTab(val)}
                            variant="indigo"
                            showLabel={false}
                        />
                    </div>
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
