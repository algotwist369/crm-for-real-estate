import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { useAuth } from "../context/AuthContext";
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
    FiClock,
    FiLoader,
    FiAlertCircle,
    FiZap,
    FiThermometer,
    FiTarget,
    FiCalendar,
    FiPhoneCall,
    FiAward
} from "react-icons/fi";
import {
    useReportStats,
    useReportOverview,
    useAgentPerformanceReport,
    useLeadInsightsReport,
    useExportReport
} from "../hooks/useReportHooks";
import { RefreshButton } from "../component/common/RefreshButton";

// ── Helpers ────────────────────────────────────────────

const formatINR = (value) => {
    if (!value) return "₹0";
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const SOURCE_COLORS = {
    website: "bg-yellow-500",
    facebook: "bg-indigo-500",
    instagram: "bg-pink-500",
    linkedin: "bg-sky-500",
    google_ads: "bg-yellow-500",
    referral: "bg-emerald-500",
    advertisement: "bg-orange-500",
    whatsapp: "bg-green-500",
    personal: "bg-violet-500",
    "walk-in": "bg-teal-500",
    other: "bg-zinc-500"
};

const DAY_COLORS = ["bg-zinc-600", "bg-yellow-600", "bg-indigo-600", "bg-violet-600", "bg-purple-600", "bg-pink-600", "bg-rose-600"];

// ── Sub-components ─────────────────────────────────────

const LoadingState = () => (
    <div className="flex items-center justify-center py-24">
        <FiLoader className="animate-spin text-zinc-500" size={28} />
    </div>
);

const ErrorState = ({ message = "Failed to load data" }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
        <FiAlertCircle className="text-red-500 mb-3" size={28} />
        <p className="text-sm text-zinc-400">{message}</p>
    </div>
);

// ── Overview Tab ────────────────────────────────────────

const FUNNEL_COLOR_MAP = {
    zinc: "bg-zinc-500",
    yellow: "bg-yellow-500",
    violet: "bg-violet-500",
    orange: "bg-orange-500",
    emerald: "bg-emerald-500"
};

const OverviewTab = () => {
    const { data, isLoading, isError } = useReportOverview();
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState />;

    const { funnel = [], requirement_mix = [], total_leads = 0 } = data?.data || {};

    const mixTotal = requirement_mix.reduce((s, r) => s + r.count, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conversion Funnel */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <FiBarChart2 className="text-zinc-500" /> Lead Conversion Funnel
                        </h3>
                        <span className="text-xs text-zinc-500">All Time</span>
                    </div>
                    <div className="space-y-5">
                        {funnel.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">No lead data available.</p>
                        ) : funnel.map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-zinc-400">{item.stage}</span>
                                    <span className="text-white font-medium">
                                        {item.count.toLocaleString()} <span className="text-zinc-500">({item.percentage}%)</span>
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${FUNNEL_COLOR_MAP[item.color] || "bg-zinc-500"}`}
                                        style={{ width: `${Math.max(item.percentage, 1)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Requirement Mix */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                            <FiPieChart className="text-zinc-500" /> Client Type Mix
                        </h3>
                        <span className="text-xs text-zinc-500">{total_leads} total</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Donut */}
                        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90 transform">
                                <circle cx="72" cy="72" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-zinc-900" />
                                {requirement_mix[0] && (
                                    <circle cx="72" cy="72" r="58" stroke="currentColor" strokeWidth="12" fill="transparent"
                                        strokeDasharray="365" strokeDashoffset={Math.round(365 * (1 - (requirement_mix[0]?.percentage || 0) / 100))}
                                        className="text-yellow-500" />
                                )}
                                {requirement_mix[1] && (
                                    <circle cx="72" cy="72" r="58" stroke="currentColor" strokeWidth="12" fill="transparent"
                                        strokeDasharray="365" strokeDashoffset={Math.round(365 * (1 - (requirement_mix[1]?.percentage || 0) / 100))}
                                        className="text-violet-500" />
                                )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <span className="text-lg font-medium text-white">{requirement_mix[0]?.percentage || 0}%</span>
                                <span className="text-[10px] text-zinc-500 capitalize">{requirement_mix[0]?.label || '-'}</span>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="flex-1 space-y-2.5 w-full">
                            {requirement_mix.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${["bg-yellow-500", "bg-violet-500", "bg-orange-500", "bg-zinc-500", "bg-emerald-500"][i] || "bg-zinc-600"}`} />
                                        <span className="text-sm text-zinc-400 capitalize">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-medium text-white">{item.percentage}%</span>
                                </div>
                            ))}
                            {requirement_mix.length === 0 && <p className="text-xs text-zinc-500 italic">No data yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Agent Performance Tab ───────────────────────────────

const AgentPerformanceTab = () => {
    const [period, setPeriod] = useState(30);
    const { data, isLoading, isError } = useAgentPerformanceReport({ days: period });
    const agents = data?.data || [];

    return (
        <div className="bg-zinc-950/20 border border-zinc-800 rounded flex flex-col overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-4 bg-zinc-900/10">
                <div>
                    <h3 className="text-sm font-medium text-white">Agent Performance Ranking</h3>
                    <p className="text-xs text-zinc-500 mt-1">Revenue and conversion analytics</p>
                </div>
                <select
                    value={period}
                    onChange={e => setPeriod(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none cursor-pointer"
                >
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                    <option value={365}>Year to Date</option>
                </select>
            </div>

            {isLoading ? <LoadingState /> : isError ? <ErrorState /> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-zinc-900/50 text-zinc-400 text-xs border-b border-zinc-800">
                                <th className="p-4 font-medium">Agent</th>
                                <th className="p-4 font-medium">Leads Added</th>
                                <th className="p-4 font-medium">Leads Assigned</th>
                                <th className="p-4 font-medium">Pending Leads</th>
                                <th className="p-4 font-medium">Deals Closed</th>
                                <th className="p-4 font-medium">Revenue</th>
                                <th className="p-4 font-medium">Conversion</th>
                                <th className="p-4 font-medium">Avg Response</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300">
                            {agents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-zinc-500 italic text-xs">No agent data available.</td>
                                </tr>
                            ) : agents.map((a, i) => (
                                <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {a.profile_pic ? (
                                                <img src={a.profile_pic} alt={a.agent_name} className="w-9 h-9 rounded object-cover border border-zinc-800 shrink-0" />
                                            ) : (
                                                <div className="w-9 h-9 rounded bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-300 shrink-0 border border-zinc-700">
                                                    {a.agent_name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-zinc-100">{a.agent_name}</p>
                                                <p className="text-[10px] text-zinc-500 truncate w-32" title={a.agent_email}>{a.agent_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-yellow-400">{a.total_leads_added}</td>
                                    <td className="p-4">{a.total_leads_assigned}</td>
                                    <td className="p-4">{a.pending_leads}</td>
                                    <td className="p-4">{a.deals_closed}</td>
                                    <td className="p-4">{formatINR(a.revenue_generated)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-900/50 px-2 py-1 rounded w-fit">
                                            <span className="text-xs font-medium">{a.conversion_rate}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-zinc-400 text-xs">
                                        {a.avg_response_time != null ? `${a.avg_response_time} hrs` : "—"}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs capitalize px-2 py-1 rounded border ${
                                            a.performance_status === "High" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                            a.performance_status === "Low" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                        }`}>{a.performance_status}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={`inline-flex items-center gap-1 text-xs font-medium ${a.trend === "up" ? "text-emerald-500" : "text-red-500"}`}>
                                            {a.trend === "up" ? <FiArrowUpRight size={14} /> : <FiArrowDownRight size={14} />}
                                            {a.trend_pct}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ── Lead Insights Tab ───────────────────────────────────

const LeadInsightsTab = () => {
    const { data, isLoading, isError } = useLeadInsightsReport();
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState />;

    const insights = data?.data || {};
    const {
        leads_by_source = [],
        leads_by_location = [],
        hot_vs_cold = {},
        lost_lead_reasons = [],
        peak_days = [],
        conversion_by_source = []
    } = insights;

    const maxDay = Math.max(...peak_days.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Source */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <FiTarget className="text-zinc-500" /> Leads by Source
                    </h3>
                    <div className="space-y-3">
                        {leads_by_source.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">No data yet.</p>
                        ) : leads_by_source.map((s, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-zinc-400 capitalize">{s.source}</span>
                                    <span className="text-white font-medium">{s.count} <span className="text-zinc-500">({s.percentage}%)</span></span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${SOURCE_COLORS[s.source] || "bg-zinc-500"}`} style={{ width: `${Math.max(s.percentage, 1)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hot/Cold + Lost Reasons */}
                <div className="space-y-4">
                    <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                            <FiThermometer className="text-zinc-500" /> Hot vs Cold Leads
                        </h3>
                        <div className="flex items-center gap-4">
                            {[
                                { label: "Hot", count: hot_vs_cold.hot || 0, color: "text-red-400 bg-red-500/10 border-red-500/20" },
                                { label: "Warm", count: hot_vs_cold.warm || 0, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
                                { label: "Cold", count: hot_vs_cold.cold || 0, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" }
                            ].map((item, i) => (
                                <div key={i} className={`flex-1 rounded border px-3 py-3 text-center ${item.color}`}>
                                    <p className="text-xl font-semibold">{item.count}</p>
                                    <p className="text-[10px] uppercase tracking-wider mt-0.5 opacity-80">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                            <FiAlertCircle className="text-zinc-500" /> Lost Lead Reasons
                        </h3>
                        {lost_lead_reasons.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">No lost lead reasons recorded.</p>
                        ) : (
                            <div className="space-y-2">
                                {lost_lead_reasons.slice(0, 5).map((r, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-zinc-400 truncate mr-2">{r.reason || "Unspecified"}</span>
                                        <span className="text-zinc-200 font-medium shrink-0">{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Peak Days */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <FiZap className="text-zinc-500" /> Peak Lead Days
                    </h3>
                    <div className="flex items-end gap-2 h-24">
                        {peak_days.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className={`w-full rounded-t ${DAY_COLORS[i % DAY_COLORS.length]}`}
                                    style={{ height: `${Math.max(8, (d.count / maxDay) * 80)}px` }}
                                />
                                <span className="text-[9px] text-zinc-500">{d.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversion by Source */}
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <FiTrendingUp className="text-zinc-500" /> Conversion by Source
                    </h3>
                    <div className="space-y-2">
                        {conversion_by_source.length === 0 ? (
                            <p className="text-xs text-zinc-500 italic">No data yet.</p>
                        ) : conversion_by_source.slice(0, 6).map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-zinc-400 capitalize w-28 truncate">{s.source}</span>
                                <div className="flex-1 mx-3 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${SOURCE_COLORS[s.source] || "bg-zinc-500"}`}
                                        style={{ width: `${Math.max(s.conversion_rate, 1)}%` }} />
                                </div>
                                <span className="text-zinc-200 font-medium w-10 text-right">{s.conversion_rate}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leads by Location */}
            {leads_by_location.length > 0 && (
                <div className="bg-zinc-950/20 border border-zinc-800 rounded p-6">
                    <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <FiHome className="text-zinc-500" /> Leads by Location
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {leads_by_location.map((l, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded p-3 text-center">
                                <p className="text-sm font-medium text-white">{l.count}</p>
                                <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{l.city}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Page ───────────────────────────────────────────

const ReportsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("Overview");
    const [exporting, setExporting] = useState(null);
    const { handleExport } = useExportReport();

    const { data: statsData, isLoading: isLoadingStats, refetch: refetchStats } = useReportStats();
    const stats = statsData?.data || {};

    const onExport = async (type) => {
        setExporting(type);
        await handleExport(type);
        setExporting(null);
    };

    const kpis = [
        {
            title: "Total Leads",
            value: stats.total_leads ?? 0,
            icon: <FiUsers />,
            color: "text-zinc-300",
            bg: "bg-zinc-800/60",
            border: "border-zinc-700"
        },
        {
            title: "Total Revenue",
            value: formatINR(stats.total_revenue),
            icon: <FiDollarSign />,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/20"
        },
        {
            title: "Conversion Rate",
            value: `${stats.conversion_rate ?? 0}%`,
            icon: <FiTrendingUp />,
            color: "text-yellow-500",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/20"
        },
        {
            title: "Active Inventory",
            value: stats.active_inventory ?? 0,
            icon: <FiHome />,
            color: "text-violet-500",
            bg: "bg-violet-500/10",
            border: "border-violet-500/20"
        },
        {
            title: "Avg Response Time",
            value: stats.avg_response_time != null ? `${stats.avg_response_time} hrs` : "N/A",
            icon: <FiClock />,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20"
        },
        {
            title: "Pending Follow-ups",
            value: stats.pending_followups ?? 0,
            icon: <FiCalendar />,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-amber-500/20"
        },
        {
            title: "Contacted Leads",
            value: stats.contacted_leads ?? 0,
            icon: <FiPhoneCall />,
            color: "text-sky-500",
            bg: "bg-sky-500/10",
            border: "border-sky-500/20"
        },
        {
            title: "Closed Deals",
            value: stats.closed_deals ?? 0,
            icon: <FiAward />,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/20"
        }
    ];

    const tabs = user?.role === "agent"
        ? ["Overview", "Lead Insights"]
        : ["Overview", "Agent Performance", "Lead Insights"];

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Analytical Reports</h2>
                    <p className="text-sm text-zinc-400">Live business intelligence for your real estate operations</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <RefreshButton onClick={refetchStats} />
                    <button
                        onClick={() => onExport("excel")}
                        disabled={!!exporting}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        {exporting === "excel" ? <FiLoader size={14} className="animate-spin" /> : <FiDownload size={14} />}
                        Excel
                    </button>
                    <button
                        onClick={() => onExport("pdf")}
                        disabled={!!exporting}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        {exporting === "pdf" ? <FiLoader size={14} className="animate-spin" /> : <FiDownload size={14} />}
                        PDF
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isLoadingStats ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-zinc-950/20 border border-zinc-800 rounded p-5 h-24 animate-pulse" />
                    ))
                ) : kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-zinc-950/20 border border-zinc-800 rounded p-5 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-8 h-8 rounded flex items-center justify-center border ${kpi.bg} ${kpi.border} ${kpi.color}`}>
                                {kpi.icon}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 mb-1">{kpi.title}</p>
                            <h3 className="text-2xl font-medium text-white tracking-tight">{kpi.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-zinc-900 border border-zinc-800 p-1 rounded inline-flex mb-6 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                            activeTab === tab
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="pb-12">
                {activeTab === "Overview" && <OverviewTab />}
                {activeTab === "Agent Performance" && <AgentPerformanceTab />}
                {activeTab === "Lead Insights" && <LeadInsightsTab />}
            </div>
        </AppLayout>
    );
};

export default ReportsPage;
