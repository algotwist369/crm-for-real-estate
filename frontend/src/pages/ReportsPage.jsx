import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { PremiumTabs } from "../component/common/PremiumTabs";
import { PremiumButton } from "../component/common/PremiumButton";
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
    FiCheckCircle,
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
            color: "text-green-500",
            bg: "bg-green-500/10"
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
            color: "text-purple-500",
            bg: "bg-purple-500/10"
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FiBarChart2 className="text-blue-500" /> Lead Conversion Funnel
                        </h3>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full">Last 30 Days</span>
                    </div>
                    
                    <div className="space-y-6">
                        {[
                            { label: "Total Leads", value: "2,450", percentage: "100%", color: "bg-blue-500" },
                            { label: "Qualified", value: "1,820", percentage: "74%", color: "bg-indigo-500" },
                            { label: "Site Visits", value: "940", percentage: "38%", color: "bg-purple-500" },
                            { label: "Negotiation", value: "420", percentage: "17%", color: "bg-pink-500" },
                            { label: "Closed Deals", value: "124", percentage: "5%", color: "bg-green-500" }
                        ].map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between text-xs font-bold mb-2">
                                    <span className="text-zinc-400 uppercase tracking-wider">{item.label}</span>
                                    <span className="text-white">{item.value} ({item.percentage})</span>
                                </div>
                                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
                                        style={{ width: item.percentage }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Requirement Distribution */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FiPieChart className="text-purple-500" /> Property Requirement Mix
                        </h3>
                        <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest">Full Report</button>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-10">
                        {/* Custom Radial Chart (Mock) */}
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 transform">
                                <circle 
                                    cx="96" cy="96" r="80" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    className="text-zinc-900" 
                                />
                                <circle 
                                    cx="96" cy="96" r="80" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray="502" strokeDashoffset="150"
                                    className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                                />
                                <circle 
                                    cx="96" cy="96" r="80" 
                                    stroke="currentColor" strokeWidth="12" fill="transparent" 
                                    strokeDasharray="502" strokeDashoffset="350"
                                    className="text-purple-500" 
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-white">72%</span>
                                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Residential</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 space-y-4 w-full">
                            {[
                                { label: "2BHK / 3BHK Flats", val: "45%", color: "bg-blue-500" },
                                { label: "Luxury Villas", val: "22%", color: "bg-purple-500" },
                                { label: "Plots / Lands", val: "18%", color: "bg-indigo-500" },
                                { label: "Commercial Space", val: "15%", color: "bg-zinc-700" }
                            ].map((l, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-sm ${l.color}`}></div>
                                        <span className="text-xs font-medium text-zinc-400">{l.label}</span>
                                    </div>
                                    <span className="text-xs font-bold text-white">{l.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAgents = () => (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Agent Performance Ranking</h3>
                    <p className="text-xs text-zinc-500">Comparative analytics based on revenue and conversion</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs py-2 px-4 rounded-xl focus:outline-none focus:border-blue-500/50">
                        <option>Current Quarter</option>
                        <option>Last Quarter</option>
                        <option>Year to Date</option>
                    </select>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-900/40 text-zinc-500 text-[10px] font-bold uppercase tracking-widest leading-none border-b border-zinc-800">
                            <th className="p-5">Agent Name</th>
                            <th className="p-5">Deals Closed</th>
                            <th className="p-5">Revenue Generated</th>
                            <th className="p-5">Conversion Rate</th>
                            <th className="p-5">Performance Status</th>
                            <th className="p-5 text-right">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                        {agentPerformance.map((a, i) => (
                            <tr key={i} className="hover:bg-zinc-900/20 transition-colors group">
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-blue-400">
                                            {a.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{a.name}</span>
                                    </div>
                                </td>
                                <td className="p-5 text-white font-bold">{a.deals}</td>
                                <td className="p-5 text-zinc-300 font-medium">{a.revenue}</td>
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 max-w-[80px] h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-500 rounded-full" 
                                                style={{ width: a.conversion }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold text-white">{a.conversion}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                        a.status === "Top Performer" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                                        a.status === "Need Focus" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                    }`}>
                                        {a.status}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="inline-flex items-center text-green-500 text-xs font-bold">
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

    return (
        <AppLayout>
            <div className="max-w-[1600px] mx-auto pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-2">
                    <div>
                        <div className="bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full w-fit mb-3 border border-blue-500/20">
                            Management Suite
                        </div>
                        <h2 className="text-3xl font-black text-white mb-2">Analytical Reports</h2>
                        <p className="text-sm text-zinc-500 font-medium italic">Comprehensive business intelligence for your real estate operations</p>
                    </div>
                    
                    <div className="w-48">
                        <PremiumButton 
                            text="Export Report" 
                            variant="primary" 
                            icon={<FiDownload />}
                            onClick={() => alert("Report Export Initialized...")}
                        />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {kpis.map((kpi, idx) => (
                        <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
                            {/* Decorative Background Gradient */}
                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-20 pointer-events-none group-hover:scale-150 transition-transform duration-700 ${kpi.bg.replace('/10', '')}`}></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center text-xl shadow-lg`}>
                                    {kpi.icon}
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${kpi.up ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                    {kpi.up ? <FiArrowUpRight /> : <FiArrowDownRight />} {kpi.trend}
                                </div>
                            </div>
                            
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{kpi.title}</p>
                            <h3 className="text-3xl font-black text-white mb-1">{kpi.value}</h3>
                            <p className="text-[10px] text-zinc-600 font-medium">vs. previous period</p>
                        </div>
                    ))}
                </div>

                {/* Report Section Controls */}
                <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 mb-8 flex items-center justify-center">
                    <div className="w-full max-w-lg">
                        <PremiumTabs 
                            options={["Overview", "Agent Performance", "Lead Insights"]}
                            value={activeTab === "Overview" ? "Overview" : activeTab === "Agent Performance" ? "Agent Performance" : "Lead Insights"}
                            onChange={(val) => setActiveTab(val)}
                            variant="indigo"
                            showLabel={false}
                        />
                    </div>
                </div>

                {/* Content Rendering */}
                {activeTab === "Overview" && renderOverview()}
                {activeTab === "Agent Performance" && renderAgents()}
                {activeTab === "Lead Insights" && (
                    <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/40 border-2 border-dashed border-zinc-800 rounded-3xl animate-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-3xl text-zinc-700 mb-6">
                            <FiUsers />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Lead Insights Coming Soon</h3>
                        <p className="text-sm text-zinc-500 max-w-md text-center">We are finalizing the deep-dive analytics for lead sourcing and behavioral patterns. Stay tuned!</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default ReportsPage;
