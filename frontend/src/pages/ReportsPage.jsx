import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { 
    FiTrendingUp, 
    FiUsers, 
    FiHome, 
    FiDollarSign, 
    FiPieChart, 
    FiBarChart2, 
    FiDownload,
    FiArrowUpRight,
    FiArrowDownRight,
    FiClock
} from "react-icons/fi";

const ReportsPage = () => {
    const [activeTab, setActiveTab] = useState("Overview");

    const kpis = [
        { 
            title: "Total Revenue", 
            value: "₹8.42 Cr", 
            trend: "+12.5%", 
            up: true, 
            icon: <FiDollarSign />, 
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        { 
            title: "Conversion Rate", 
            value: "24.8%", 
            trend: "+4.2%", 
            up: true, 
            icon: <FiTrendingUp />, 
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        { 
            title: "Active Inventory", 
            value: "142", 
            trend: "-2.1%", 
            up: false, 
            icon: <FiHome />, 
            color: "text-violet-500",
            bg: "bg-violet-500/10"
        },
        { 
            title: "Response Time", 
            value: "1.2 hrs", 
            trend: "-15m", 
            up: true, 
            icon: <FiClock />, 
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        }
    ];

    const agentPerformance = [
        { name: "Rahul Sharma", deals: 14, revenue: "₹2.1 Cr", conversion: "32%", status: "Top Performer" },
        { name: "Priya Verma", deals: 11, revenue: "₹1.8 Cr", conversion: "28%", status: "Consistent" },
        { name: "Amit Patel", deals: 9, revenue: "₹1.4 Cr", conversion: "24%", status: "Growing" },
        { name: "Neha Singh", deals: 7, revenue: "₹1.1 Cr", conversion: "21%", status: "On Track" },
        { name: "Suresh Reddy", deals: 5, revenue: "₹0.9 Cr", conversion: "18%", status: "Need Focus" }
    ];

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <FiBarChart2 className="text-zinc-500" /> Lead Conversion Funnel
                        </h3>
                        <span className="text-xs text-zinc-500">Last 30 Days</span>
                    </div>
                    
                    <div className="space-y-5">
                        {[
                            { label: "Total Leads", value: "2,450", percentage: "100%", color: "bg-zinc-500" },
                            { label: "Qualified", value: "1,820", percentage: "74%", color: "bg-blue-500" },
                            { label: "Site Visits", value: "940", percentage: "38%", color: "bg-violet-500" },
                            { label: "Negotiation", value: "420", percentage: "17%", color: "bg-orange-500" },
                            { label: "Closed Deals", value: "124", percentage: "5%", color: "bg-emerald-500" }
                        ].map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-zinc-400">{item.label}</span>
                                    <span className="text-white font-medium">{item.value} <span className="text-zinc-500">({item.percentage})</span></span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${item.color} rounded-full`}
                                        style={{ width: item.percentage }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Requirement Distribution */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <FiPieChart className="text-zinc-500" /> Property Requirement Mix
                        </h3>
                        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Full Report</button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-10">
                        {/* Custom Radial Chart (Mock) */}
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 transform">
                                <circle 
                                    cx="80" cy="80" r="64" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    className="text-zinc-900" 
                                />
                                <circle 
                                    cx="80" cy="80" r="64" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray="402" strokeDashoffset="120"
                                    className="text-blue-500" 
                                />
                                <circle 
                                    cx="80" cy="80" r="64" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray="402" strokeDashoffset="280"
                                    className="text-violet-500" 
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-xl font-medium text-white">72%</span>
                                <span className="text-xs text-zinc-500">Residential</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 space-y-3 w-full">
                            {[
                                { label: "2BHK / 3BHK Flats", val: "45%", color: "bg-blue-500" },
                                { label: "Luxury Villas", val: "22%", color: "bg-violet-500" },
                                { label: "Plots / Lands", val: "18%", color: "bg-zinc-500" },
                                { label: "Commercial Space", val: "15%", color: "bg-zinc-700" }
                            ].map((l, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${l.color}`}></div>
                                        <span className="text-sm text-zinc-400">{l.label}</span>
                                    </div>
                                    <span className="text-sm font-medium text-white">{l.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAgents = () => (
        <div className="bg-zinc-950/20 border border-zinc-800 rounded flex flex-col overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-4 bg-zinc-900/10">
                <div>
                    <h3 className="text-sm font-medium text-white">Agent Performance Ranking</h3>
                    <p className="text-xs text-zinc-500 mt-1">Comparative analytics based on revenue and conversion</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none cursor-pointer">
                        <option>Current Quarter</option>
                        <option>Last Quarter</option>
                        <option>Year to Date</option>
                    </select>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-zinc-900/50 text-zinc-400 text-xs border-b border-zinc-800">
                            <th className="p-4 font-medium tracking-wide">Agent Name</th>
                            <th className="p-4 font-medium tracking-wide">Deals Closed</th>
                            <th className="p-4 font-medium tracking-wide">Revenue Generated</th>
                            <th className="p-4 font-medium tracking-wide">Conversion Rate</th>
                            <th className="p-4 font-medium tracking-wide">Performance Status</th>
                            <th className="p-4 font-medium tracking-wide text-right">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                        {agentPerformance.map((a, i) => (
                            <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-300 shrink-0">
                                            {a.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="font-medium text-zinc-100">{a.name}</span>
                                    </div>
                                </td>
                                <td className="p-4">{a.deals}</td>
                                <td className="p-4">{a.revenue}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-900/50 px-2 py-1 rounded w-fit">
                                        <span className="text-xs font-medium">{a.conversion}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs capitalize px-2 py-1 rounded border ${
                                        a.status === "Top Performer" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                        a.status === "Need Focus" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                        "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    }`}>
                                        {a.status}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="inline-flex items-center gap-1 text-emerald-500 text-xs font-medium">
                                        <FiArrowUpRight size={14} /> 5%
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const tabs = ["Overview", "Agent Performance", "Lead Insights"];

    return (
        <AppLayout>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Analytical Reports</h2>
                    <p className="text-sm text-zinc-400">Comprehensive business intelligence for your real estate operations</p>
                </div>
                
                <button 
                    onClick={() => alert("Report Export Initialized...")}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors w-full md:w-auto"
                >
                    <FiDownload size={16} /> Export Report
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-zinc-950/20 border border-zinc-800 rounded p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-zinc-400">
                                {kpi.icon}
                            </div>
                            <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${kpi.up ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                                {kpi.up ? <FiArrowUpRight size={12} /> : <FiArrowDownRight size={12} />} {kpi.trend}
                            </div>
                        </div>
                        
                        <div>
                            <p className="text-xs text-zinc-500 mb-1">{kpi.title}</p>
                            <h3 className="text-2xl font-medium text-white tracking-tight">{kpi.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs Container */}
            <div className="bg-zinc-900 border border-zinc-800 p-1 rounded inline-flex mb-6 w-full sm:w-auto overflow-x-auto scrollbar-hide">
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

            {/* Tab Content */}
            <div className="pb-12">
                {activeTab === "Overview" && renderOverview()}
                {activeTab === "Agent Performance" && renderAgents()}
                {activeTab === "Lead Insights" && (
                    <div className="flex flex-col items-center justify-center py-24 bg-zinc-950/20 border border-zinc-800 border-dashed rounded text-center px-4">
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-zinc-500 mb-4">
                            <FiUsers size={20} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Lead Insights Coming Soon</h3>
                        <p className="text-sm text-zinc-500 max-w-md">We are finalizing the deep-dive analytics for lead sourcing and behavioral patterns. Stay tuned!</p>
                    </div>
                )}
            </div>

        </AppLayout>
    );
};

export default ReportsPage;
