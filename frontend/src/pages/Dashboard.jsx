import React from "react";
import AppLayout from "../component/layout/AppLayout";
import {
    FiUsers,
    FiHome,
    FiTrendingUp,
    FiDollarSign,
    FiPhoneCall
} from "react-icons/fi";
import { MdPendingActions } from "react-icons/md";

const stats = [
    { title: "Total Leads", value: "245", icon: <FiUsers /> },
    { title: "Total Agents", value: "3", icon: <FiUsers /> },
    { title: "Properties", value: "86", icon: <FiHome /> },
    { title: "Active Deals", value: "19", icon: <FiTrendingUp /> },
    { title: "Pending Follow-Ups", value: "19", icon: <MdPendingActions />, color: "text-red-400 border-red-500/30 bg-red-500/10" },
    { title: "Revenue", value: "$124K", icon: <FiDollarSign /> }
];

const Dashboard = () => {
    return (
        <AppLayout>

            {/* Page Title */}
            <h1 className="text-xl font-medium text-white mb-6">
                CRM Dashboard
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">

                {stats.map((item, index) => (
                    <div
                        key={index}
                        className="bg-zinc-950/20 border border-zinc-800 rounded p-4 flex justify-between items-center"
                    >
                        <div>
                            <p className="text-zinc-500 text-xs mb-1">
                                {item.title}
                            </p>

                            <h2 className="text-xl font-medium text-white">
                                {item.value}
                            </h2>
                        </div>

                        <div className={`w-10 h-10 rounded border flex items-center justify-center ${item.color || "text-zinc-400 bg-zinc-900 border-zinc-800"}`}>
                            {item.icon}
                        </div>
                    </div>
                ))}

            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* Recent Leads */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">

                    <h2 className="text-sm font-medium text-white mb-4">
                        Recent Leads
                    </h2>

                    <div className="space-y-4">

                        {[
                            { name: "John Carter", property: "2BHK Apartment", agent: "Rahul" },
                            { name: "Sarah Smith", property: "Villa", agent: "Priya" },
                            { name: "David Lee", property: "Office Space", agent: "Amit" }
                        ].map((lead, i) => (
                            <div
                                key={i}
                                className="flex justify-between border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0"
                            >
                                <div>
                                    <p className="text-sm text-zinc-300 font-medium">{lead.name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {lead.property}
                                    </p>
                                </div>

                                <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded h-fit">
                                    {lead.agent}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

                {/* Pending Followups */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">

                    <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <FiPhoneCall className="text-zinc-500" /> Pending Follow Ups
                    </h2>

                    <div className="space-y-4">

                        {[
                            { name: "Robert", time: "Today 3:00 PM" },
                            { name: "Emma Watson", time: "Tomorrow" },
                            { name: "Chris Evans", time: "Today 6:30 PM" }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex justify-between border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0 flex-wrap gap-2"
                            >
                                <span className="text-sm text-zinc-300 font-medium">
                                    {item.name}
                                </span>

                                <span className="text-xs text-red-400 flex items-center gap-1">
                                    {item.time}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

                {/* Property Status */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">

                    <h2 className="text-sm font-medium text-white mb-4">
                        Property Status
                    </h2>

                    <div className="space-y-4">

                        <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-3">
                            <span className="text-zinc-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Available</span>
                            <span className="text-zinc-300 font-medium">45</span>
                        </div>

                        <div className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-3">
                            <span className="text-zinc-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Sold</span>
                            <span className="text-zinc-300 font-medium">28</span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Under Negotiation</span>
                            <span className="text-zinc-300 font-medium">13</span>
                        </div>

                    </div>

                </div>

            </div>

            {/* Agents Section */}
            <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6 mt-6">

                <h2 className="text-sm font-medium text-white mb-4">
                    Agent Performance
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    {[
                        { name: "Rahul Sharma", deals: 12, leads: 32 },
                        { name: "Priya Verma", deals: 9, leads: 21 },
                        { name: "Amit Patel", deals: 7, leads: 18 },
                        { name: "Neha Singh", deals: 5, leads: 14 }
                    ].map((agent, i) => (
                        <div
                            key={i}
                            className="bg-zinc-900/50 border border-zinc-800 p-4 rounded flex flex-col justify-between h-full"
                        >
                            <div className="mb-4">
                                <p className="text-sm font-medium text-white mb-1">
                                    {agent.name}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-zinc-500">Deals Closed</p>
                                    <p className="text-sm text-zinc-300 font-medium">{agent.deals}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-zinc-500">Leads Managed</p>
                                    <p className="text-sm text-zinc-300 font-medium">{agent.leads}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                </div>

            </div>

        </AppLayout>
    );
};

export default Dashboard;