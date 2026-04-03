import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiLogOut, FiBell } from "react-icons/fi";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { NotificationSidebar } from "../common/NotificationSidebar";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";

const AppLayout = ({ children }) => {
    const { user, logout, isLoggingOut } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllRead, clearAll, deleteOne } = useNotification();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const getTitle = (path) => {
        switch (path) {
            case "/dashboard": return "CRM Dashboard";
            case "/agents": return "Agent Management";
            case "/properties": return "Property Inventory";
            case "/leads": return "Lead Pipeline";
            case "/reports": return "Analytics Reports";
            case "/settings": return "System Settings";
            case "/notifications": return "Activity Center";
            case "/documentation": return "Help & Documentation";
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
                            {unreadCount > 0 && (
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
                <main className="p-6 lg:p-8 flex-1 pb-24">
                    {children}
                </main>

                {/* Footer */}
                <footer className="w-full py-4 px-8 border-t border-zinc-900 bg-black/50 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-auto">
                    <div className="flex items-center gap-2">
                        <span>© 2026 SpaAdvisor CRM</span>
                        <span className="text-zinc-800">•</span>
                        <span>Version 1.0.0</span>
                    </div>
                    
                    <button 
                        onClick={() => window.open('https://wa.me/917388480128?text=Hello, I need support with SpaAdvisor CRM.', '_blank')}
                        className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:text-yellow-500 transition-all active:scale-95"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        Support
                    </button>
                </footer>

                <NotificationSidebar
                    isOpen={notifOpen}
                    onClose={() => setNotifOpen(false)}
                    notifications={notifications}
                    onMarkAllRead={markAllRead}
                    onClearAll={clearAll}
                    onReadItem={markAsRead}
                    onViewItem={(id) => {
                        markAsRead(id);
                        setNotifOpen(false);
                    }}
                    onClearItem={deleteOne}
                />

            </div>

        </div>
    );
};

export default AppLayout;
