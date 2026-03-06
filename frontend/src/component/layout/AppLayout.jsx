import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { FaBell } from "react-icons/fa";


const AppLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

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
                <header className="h-16 flex items-center justify-between border-b border-zinc-800 px-6">

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
                            />

                            <span className="
                                    absolute -top-2 -right-2
                                    min-w-[18px] h-[18px]
                                    px-1
                                    flex items-center justify-center
                                    text-[10px] font-semibold
                                    bg-red-500 text-white
                                    rounded-full
                                ">
                                9+
                            </span>

                        </div>

                        <h1 className="text-lg font-semibold">
                            Admin
                        </h1>
                        <FaUserCircle size={30} />
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 flex-1">
                    {children}
                </main>

            </div>

        </div>
    );
};

export default AppLayout;