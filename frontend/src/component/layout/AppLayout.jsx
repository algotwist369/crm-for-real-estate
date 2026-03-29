import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiLogOut, FiBell } from "react-icons/fi";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { NotificationSidebar } from "../common/NotificationSidebar";
import { useAuth } from "../../context/AuthContext";

const AppLayout = ({ children }) => {
    const { user, logout, isLoggingOut } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([
        { title: "New Lead Assigned", description: "Lead #245 is assigned to you", time: "2m ago", read: false },
        { title: "Property Updated", description: "PROP003 status changed to sold", time: "15m ago", read: false },
        { title: "Agent Reminder", description: "Follow-up due today for Lead #198", time: "1h ago", read: false },
        { title: "System Notice", description: "Nightly backup completed successfully", time: "3h ago", read: true }
    ]);

    const getTitle = (path) => {
        switch (path) {
            case "/dashboard": return "CRM Dashboard";
            case "/agents": return "Agent Management";
            case "/properties": return "Property Inventory";
            case "/leads": return "Lead Pipeline";
            case "/reports": return "Analytics Reports";
            case "/settings": return "System Settings";
            case "/notifications": return "Activity Center";
            default: return "AlgoTwist CRM";
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="bg-black text-white min-h-screen flex font-sans antialiased">

            {/* Sidebar */}
            <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} />

            {/* Main Section */}
            <div
                className={`flex flex-col flex-1 transition-all duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}
            >

                {/* Header */}
                <header className="sticky top-0 z-40 h-16 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md px-6 lg:px-8">

                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="lg:hidden text-zinc-400 hover:text-white transition-colors"
                        >
                            <FiMenu size={20} />
                        </button>

                        {/* Desktop Collapse */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden lg:block text-zinc-500 hover:text-white transition-colors"
                        >
                            {collapsed ? <GoSidebarCollapse size={20} /> : <GoSidebarExpand size={20} />}
                        </button>

                        <h2 className="text-sm font-medium text-white tracking-wide">
                            {getTitle(location.pathname)}
                        </h2>
                    </div>

                    <div className="flex items-center gap-5">
                        {/* Notifications */}
                        <button 
                            onClick={() => setNotifOpen(true)}
                            className="relative text-zinc-400 hover:text-white transition-colors p-1"
                        >
                            <FiBell size={20} />
                            {notifications.some(n => !n.read) && (
                                <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-600 rounded-full border-2 border-black"></span>
                            )}
                        </button>

                        {/* User Profile Mini */}
                        <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-medium text-zinc-100">{user?.user_name || "Admin"}</span>
                                <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{user?.role || "User"}</span>
                            </div>
                            
                            <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                                {user?.profile_pic ? (
                                    <img src={user.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-bold text-yellow-500">
                                        {user?.user_name?.substring(0, 1).toUpperCase() || "A"}
                                    </span>
                                )}
                            </div>

                            <button 
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                title="Sign Out"
                            >
                                <FiLogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 lg:p-8 flex-1">
                    {children}
                </main>

                <NotificationSidebar
                    isOpen={notifOpen}
                    onClose={() => setNotifOpen(false)}
                    notifications={notifications}
                    onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    onClearAll={() => setNotifications([])}
                    onReadItem={(idx) => setNotifications(prev => prev.map((n, i) => i === idx ? ({ ...n, read: true }) : n))}
                    onViewItem={(idx) => {
                        setNotifications(prev => prev.map((n, i) => i === idx ? ({ ...n, read: true }) : n));
                        setNotifOpen(false);
                    }}
                    onClearItem={(idx) => setNotifications(prev => prev.filter((_, i) => i !== idx))}
                />

            </div>

        </div>
    );
};

export default AppLayout;
