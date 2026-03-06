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
    { title: "Pending Follow-Ups", value: "19", icon: <MdPendingActions />, color: "text-red-400" },
    { title: "Revenue", value: "$124K", icon: <FiDollarSign /> }
];

const Dashboard = () => {
    return (
        <AppLayout>

            {/* Page Title */}
            <h1 className="text-2xl font-semibold mb-6">
                CRM Dashboard
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

                {stats.map((item, index) => (
                    <div
                        key={index}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 flex justify-between items-center"
                    >
                        <div>
                            <p className="text-zinc-400 text-sm">
                                {item.title}
                            </p>

                            <h2 className="text-xl font-semibold">
                                {item.value}
                            </h2>
                        </div>

                        <div className={`p-3 rounded-full bg-zinc-800 text-white ${item.color || "text-zinc-400"}`}>
                            {item.icon}
                        </div>
                    </div>
                ))}

            </div>

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">

                {/* Recent Leads */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Recent Leads
                    </h2>

                    <div className="space-y-3">

                        {[
                            { name: "John Carter", property: "2BHK Apartment", agent: "Rahul" },
                            { name: "Sarah Smith", property: "Villa", agent: "Priya" },
                            { name: "David Lee", property: "Office Space", agent: "Amit" }
                        ].map((lead, i) => (
                            <div
                                key={i}
                                className="flex justify-between border-b border-zinc-800 pb-2"
                            >
                                <div>
                                    <p className="text-sm">{lead.name}</p>
                                    <p className="text-xs text-zinc-400">
                                        {lead.property}
                                    </p>
                                </div>

                                <span className="text-xs text-zinc-400">
                                    {lead.agent}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

                {/* Pending Followups */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">

                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FiPhoneCall /> Pending Follow Ups
                    </h2>

                    <div className="space-y-3">

                        {[
                            { name: "Robert", time: "Today 3:00 PM" },
                            { name: "Emma Watson", time: "Tomorrow" },
                            { name: "Chris Evans", time: "Today 6:30 PM" }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex justify-between border-b border-zinc-800 pb-2"
                            >
                                <span className="text-sm">
                                    {item.name}
                                </span>

                                <span className="text-xs text-zinc-400">
                                    {item.time}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

                {/* Property Status */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">

                    <h2 className="text-lg font-semibold mb-4">
                        Property Status
                    </h2>

                    <div className="space-y-4">

                        <div className="flex justify-between text-sm">
                            <span>Available</span>
                            <span className="text-zinc-400">45</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span>Sold</span>
                            <span className="text-zinc-400">28</span>
                        </div>

                        <div className="flex justify-between text-sm">
                            <span>Under Negotiation</span>
                            <span className="text-zinc-400">13</span>
                        </div>

                    </div>

                </div>

            </div>

            {/* Agents Section */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 mt-6">

                <h2 className="text-lg font-semibold mb-4">
                    Agent Performance
                </h2>

                <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">

                    {[
                        { name: "Rahul Sharma", deals: 12, leads: 32 },
                        { name: "Priya Verma", deals: 9, leads: 21 },
                        { name: "Amit Patel", deals: 7, leads: 18 },
                        { name: "Neha Singh", deals: 5, leads: 14 }
                    ].map((agent, i) => (
                        <div
                            key={i}
                            className="bg-zinc-900 p-4 rounded-md"
                        >
                            <p className="text-sm font-medium">
                                {agent.name}
                            </p>

                            <p className="text-xs text-zinc-400">
                                Deals Closed: {agent.deals}
                            </p>

                            <p className="text-xs text-zinc-400">
                                Leads Managed: {agent.leads}
                            </p>
                        </div>
                    ))}

                </div>

            </div>

        </AppLayout>
    );
};

export default Dashboard;