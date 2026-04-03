import React from "react";
import { NavLink } from "react-router-dom";
import {
    FiHome,
    FiUsers,
    FiPhone,
    FiBarChart2,
    FiSettings,
    FiBell,
    FiSend,
} from "react-icons/fi";
import { MdOutlineRealEstateAgent } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

const menuItems = [
    { name: "Dashboard", icon: <FiHome />, path: "/dashboard" },
    { name: "Properties", icon: <MdOutlineRealEstateAgent />, path: "/properties" },
    { name: "Leads", icon: <FiPhone />, path: "/leads" },
    { name: "Outreach", icon: <FiSend />, path: "/campaigns" },
    { name: "Agents", icon: <FiUsers />, path: "/agents" },
    { name: "Reports", icon: <FiBarChart2 />, path: "/reports" },
    { name: "Notifications", icon: <FiBell />, path: "/notifications" },
    { name: "Settings", icon: <FiSettings />, path: "/settings" },
];

const Sidebar = ({ collapsed, mobileOpen }) => {
    const { user } = useAuth();
    const isAgent = user?.role === "agent";

    const filteredMenuItems = menuItems.filter(item => {
        if (isAgent && item.name === "Agents") return false;
        return true;
    });

    return (
        <aside
            className={`
                border-r border-zinc-800
                h-screen fixed top-0 left-0 z-50
                transition-all duration-300
                ${collapsed ? "w-20" : "w-64"}
                ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                lg:translate-x-0
                bg-zinc-950
            `}
        >
            <div className="flex flex-col h-full">

                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-zinc-800 mb-6">
                    {!collapsed && (
                        <span className="ml-3 text-sm font-semibold text-white tracking-widest uppercase">AlgoTwist CRM</span>
                    )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-4 space-y-1">
                    {filteredMenuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2 rounded transition-all duration-200 group
                                ${isActive
                                    ? "bg-zinc-900 border border-zinc-800 text-yellow-400 font-medium"
                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50"}
                            `}
                        >
                            <span className={`text-lg transition-colors ${collapsed ? "mx-auto" : ""}`}>
                                {item.icon}
                            </span>

                            {!collapsed && (
                                <span className="text-sm">{item.name}</span>
                            )}
                            
                            {/* Active Indicator on right */}
                            {!collapsed && (
                                <div className={`ml-auto w-1 h-1 rounded-full bg-yellow-500 opacity-0 group-[.active]:opacity-100 transition-opacity`}></div>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Metadata */}
                <div className="p-6 border-t border-zinc-800 mt-auto">
                    {!collapsed ? (
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                                Version 1.2.4-stable
                            </p>
                            <p className="text-[9px] text-zinc-700 font-medium">
                                © {new Date().getFullYear()} AlgoTwist CRM
                            </p>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <span className="text-[10px] text-zinc-700 font-bold">V1.2</span>
                        </div>
                    )}
                </div>

            </div>
        </aside>
    );
};

export default Sidebar;
