import React from "react";
import { NavLink } from "react-router-dom";
import {
    FiHome,
    FiUsers,
    FiPhone,
    FiBarChart2,
    FiSettings,
    FiBell,
} from "react-icons/fi";
import { MdOutlineRealEstateAgent } from "react-icons/md";

const menuItems = [
    { name: "Dashboard", icon: <FiHome />, path: "/dashboard" },
    { name: "Properties", icon: <MdOutlineRealEstateAgent />, path: "/properties" },
    { name: "Leads", icon: <FiPhone />, path: "/leads" },
    { name: "Agents", icon: <FiUsers />, path: "/agents" },
    { name: "Reports", icon: <FiBarChart2 />, path: "/reports" },
    { name: "Notifications", icon: <FiBell />, path: "/notifications" },
    { name: "Settings", icon: <FiSettings />, path: "/settings" },
];

const Sidebar = ({ collapsed, mobileOpen }) => {
    return (
        <aside
            className={`
                                 border-r border-zinc-800
                                 h-screen fixed top-0 left-0 z-40
                                 transition-all duration-300
                                 ${collapsed ? "w-20" : "w-64"}
                                 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
                                 lg:translate-x-0
                                 bg-black
                    `}
        >
            <div className="flex flex-col h-full p-4">

                {/* Logo */}
                <div className="mb-10 text-white font-bold text-xl px-2 flex items-center gap-2 border-b border-zinc-800">
                    {!collapsed && <span>Admin Leads</span>}
                </div>

                {/* Menu */}
                <nav className="flex flex-col gap-1">

                    {menuItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                                ${isActive
                                    ? "bg-blue-600/10 text-blue-400 font-medium"
                                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"}
                            `}
                        >
                            <span className="text-lg">{item.icon}</span>

                            {!collapsed && (
                                <span className="text-sm">{item.name}</span>
                            )}
                        </NavLink>
                    ))}

                </nav>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-zinc-800 px-2 pb-2 flex flex-col gap-1">
                    {!collapsed && (
                        <>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                © {new Date().getFullYear()} Admin Leads
                            </p>
                            <p className="text-[9px] text-zinc-600 font-medium">
                                Version 1.0.1-stable
                            </p>
                        </>
                    )}
                    {collapsed && (
                        <p className="text-[10px] text-zinc-600 font-bold text-center">
                            V1.0
                        </p>
                    )}
                </div>

            </div>
        </aside>
    );
};

export default Sidebar;
