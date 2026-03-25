import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiLogOut } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { FaBell } from "react-icons/fa";
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
            default: return "LeadReal CRM";
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
        <div className="bg-black text-white min-h-screen flex">

            {/* Sidebar */}
            <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} />

            {/* Main Section */}
            <div
                className={`
        flex flex-col flex-1 transition-all duration-300
        ${collapsed ? "lg:ml-20" : "lg:ml-64"}
        `}
            >

                {/* Header */}
                <header className="sticky top-0 z-40 h-20 flex items-center justify-between border-b border-zinc-800/50 bg-black/40 backdrop-blur-xl px-8 transition-all duration-300">

                    <div className="flex items-center gap-4">

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="lg:hidden"
                        >
                            <FiMenu size={20} />
                        </button>

                        {/* Desktop Collapse */}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="hidden lg:block text-zinc-400 hover:text-white"
                        >
                            {collapsed ? <GoSidebarCollapse size={20} /> : <GoSidebarExpand size={20} />}
                        </button>

                        <h1 className="text-lg font-semibold text-white">
                            {getTitle(location.pathname)}
                        </h1>

                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative inline-flex mr-2">

                            <FaBell
                                size={22}
                                className="text-zinc-300 cursor-pointer"
                                onClick={() => setNotifOpen(true)}
                            />

                            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-semibold bg-red-500 text-white rounded-full">
                                {notifications.filter(n => !n.read).length}
                            </span>

                        </div>

                        <div className="flex items-center gap-3 bg-zinc-900/50 hover:bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group">
                            <div className="flex flex-col items-end mr-1">
                                <h1 className="text-[11px] font-black text-white uppercase tracking-wider leading-none">
                                    {user?.user_name || "Admin"}
                                </h1>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter leading-none mt-1">
                                    {user?.role || "User"}
                                </p>
                            </div>
                            
                            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all">
                                {user?.profile_pic ? (
                                    <img src={user.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-xs font-black text-blue-500">
                                        {user?.user_name?.substring(0, 1).toUpperCase() || "A"}
                                    </span>
                                )}
                            </div>

                            <button 
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="ml-1 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Logout"
                            >
                                <FiLogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 flex-1">
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
