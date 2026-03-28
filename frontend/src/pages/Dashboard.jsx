import React, { useMemo } from "react";
import AppLayout from "../component/layout/AppLayout";
import {
    FiUsers,
    FiHome,
    FiTrendingUp,
    FiDollarSign,
    FiPhoneCall,
    FiLoader,
    FiActivity
} from "react-icons/fi";
import { MdPendingActions } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { 
    useAgentDashboardSummary, 
    useAgentActivityTimeline, 
    useMyFollowups 
} from "../hooks/useLeadHooks";

const formatCurrency = (value) => {
    if (!value) return "₹0";
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
};

const Dashboard = () => {
    const { user } = useAuth();
    const isAgent = user?.role === "agent";

    const { data: summaryData, isLoading: isLoadingSummary } = useAgentDashboardSummary();
    
    const activityParams = useMemo(() => ({ limit: 5 }), []);
    const { data: activityData, isLoading: isLoadingActivity } = useAgentActivityTimeline(activityParams);
    
    const followupParams = useMemo(() => ({ bucket: 'today', limit: 5 }), []);
    const { data: followupsData, isLoading: isLoadingFollowups } = useMyFollowups(followupParams);

    const stats = summaryData?.data || {};
    const activities = activityData?.data || [];
    const followups = followupsData?.data || [];

    const dashboardStats = [
        { title: "Total Leads", value: stats.total_leads || "0", icon: <FiUsers /> },
        ...(user?.role !== "agent" ? [{ title: "Total Agents", value: stats.total_agents || "0", icon: <FiUsers /> }] : []),
        { title: "Properties", value: stats.total_properties || "0", icon: <FiHome /> },
        { title: "Active Deals", value: stats.active_deals || "0", icon: <FiTrendingUp /> },
        { 
            title: "Pending Follow-Ups", 
            value: stats.pending_followups || "0", 
            icon: <MdPendingActions />, 
            color: (stats.followups_overdue > 0) ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-zinc-400 bg-zinc-900 border-zinc-800" 
        },
        { title: "Revenue", value: formatCurrency(stats.total_revenue), icon: <FiDollarSign /> }
    ];

    if (isLoadingSummary) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <FiLoader className="animate-spin text-zinc-500" size={24} />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-medium text-white">
                    CRM Dashboard
                </h1>
                <div className="text-xs text-zinc-500">
                    Live updates as of {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {dashboardStats.map((item, index) => (
                    <div
                        key={index}
                        className="bg-zinc-950/20 border border-zinc-800 rounded p-4 flex justify-between items-center"
                    >
                        <div>
                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">
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

            {/* Main Content Areas */}
            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Recent Activities */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <FiActivity className="text-zinc-500" /> Recent Activity
                    </h2>
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <p className="text-xs text-zinc-600 italic">No recent activity detected.</p>
                        ) : (
                            activities.map((item, i) => (
                                <div key={i} className="flex justify-between border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                                    <div>
                                        <p className="text-sm text-zinc-300 font-medium">{item.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            {item.properties?.[0]?.property_title || "General Interest"}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${
                                            item.status === 'converted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            item.status === 'lost' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                            'bg-zinc-900 text-zinc-400 border-zinc-800'
                                        }`}>
                                            {item.status.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-zinc-600">
                                            {new Date(item.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Priority Followups */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <FiPhoneCall className="text-zinc-500" /> Today's Follow Ups
                    </h2>
                    <div className="space-y-4">
                        {followups.length === 0 ? (
                            <p className="text-xs text-zinc-600 italic">No follow-ups scheduled for today.</p>
                        ) : (
                            followups.map((item, i) => (
                                <div key={i} className="flex justify-between border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                                    <span className="text-sm text-zinc-300 font-medium">{item.name}</span>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="text-xs text-blue-400">
                                            {new Date(item.next_follow_up_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold ${
                                            item.priority === 'high' ? 'text-red-500' :
                                            item.priority === 'medium' ? 'text-orange-500' : 'text-zinc-500'
                                        }`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Property Stats Chart-like list */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <h2 className="text-sm font-medium text-white mb-4">
                        Inventory Status
                    </h2>
                    <div className="space-y-4">
                        {[
                            { label: "Available", key: "available", color: "bg-emerald-500" },
                            { label: "Under Negotiation", key: "under_offer", color: "bg-orange-500" },
                            { label: "Sold / Rented", count: (stats.property_stats?.sold || 0) + (stats.property_stats?.rented || 0), color: "bg-blue-500" },
                            { label: "Inactive", key: "inactive", color: "bg-zinc-700" }
                        ].map((item, i) => {
                            const count = item.count !== undefined ? item.count : (stats.property_stats?.[item.key] || 0);
                            return (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-3 last:border-0 last:pb-0">
                                    <span className="text-zinc-400 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${item.color}`}></div> {item.label}
                                    </span>
                                    <span className="text-zinc-300 font-medium">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Agent Leaderboard (Admin Only) */}
            {!isAgent && stats.agent_performance && (
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6 mt-6">
                    <h2 className="text-sm font-medium text-white mb-4">
                        Agent Performance Rankings
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.agent_performance.map((agent, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded flex flex-col justify-between h-full">
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-white mb-1">{agent.name}</p>
                                    {i === 0 && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded">Top Performer</span>}
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
            )}
        </AppLayout>
    );
};

export default Dashboard;