import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import {
    FiHome,
    FiEdit,
    FiTrash2,
    FiEye,
    FiPhone,
    FiMail,
    FiMessageSquare,
    FiTrendingUp,
    FiCalendar,
    FiUser
} from "react-icons/fi";
import { MdOutlineFactCheck } from "react-icons/md";
import { PremiumButton } from "../component/common/PremiumButton";
import { CopyButton } from "../component/common/CopyButton";
import { SearchFilter } from "../component/common/SearchFilter";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import AddLeadModal from "../component/modal/AddLeadModal";
import EditLeadModal from "../component/modal/EditLeadModal";
import FollowUpModal from "../component/modal/FollowUpModal";
import { PremiumTabs } from "../component/common/PremiumTabs";
import { useLeads, useUpdateLead, useAgentDashboardSummary } from "../hooks/useLeadHooks";
import toast from "react-hot-toast";

/* ─── Table Columns ─── */
const tableColumns = ["#", "Lead Info", "Contact", "Requirement", "Budget", "Inquiry For", "Source", "Properties", "Priority", "Next Follow-up", "Status", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = ["All", "New", "Contacted", "Qualified", "Follow_up", "Closed", "Converted", "Lost", "Wasted"];
const priorityOptions = ["All", "High", "Medium", "Low"];

const LeadsPage = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    // React Query Hooks
    const { data: dashboardData } = useAgentDashboardSummary();
    const stats = dashboardData?.data || { total_leads: 0, total_converted_leads: 0, total_lost_leads: 0, followups_today: 0 };

    const { data: leadsData, isLoading, refetch } = useLeads({
        page,
        limit: rowsPerPage,
        search,
        status: statusFilter === "All" ? "" : statusFilter.toLowerCase(),
        priority: priorityFilter === "All" ? "" : priorityFilter.toLowerCase()
    });

    const updateLeadMutation = useUpdateLead();

    const leads = leadsData?.data || [];
    const totalPages = leadsData?.pagination?.pages || 1;

    /* ─── Refresh Handler ─── */
    const handleRefresh = () => {
        setSearch("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setPage(1);
        refetch();
    };

    /* ─── Handlers ─── */
    const handleAddLead = () => {
        setIsAddModalOpen(false);
        refetch();
    };

    const handleUpdateLead = () => {
        setIsEditModalOpen(false);
        setEditingLead(null);
        refetch();
    };

    const handleUpdateField = (id, field, value) => {
        updateLeadMutation.mutate({ id, data: { [field]: value } });
    };

    const handleSaveFollowUp = () => {
        setIsFollowUpModalOpen(false);
        setSelectedLead(null);
    };

    /* ─── Style Helpers ─── */
    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "low": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case "new": return "text-blue-400";
            case "contacted": return "text-indigo-400";
            case "qualified": return "text-teal-400";
            case "follow_up": return "text-orange-400";
            case "converted": return "text-green-400";
            case "closed": return "text-green-500";
            case "lost": return "text-red-400";
            case "wasted": return "text-purple-400";
            default: return "text-zinc-500";
        }
    };

    return (
        <AppLayout>
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Lead Pipeline</h2>
                    <p className="text-sm text-zinc-500 font-medium italic">Track and manage your potential property buyers</p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={handleRefresh} />
                    <div className="w-44">
                        <PremiumButton
                            text="Add New Lead"
                            variant="primary"
                            onClick={() => setIsAddModalOpen(true)}
                        />
                    </div>
                </div>
            </div>

            {/* Analytics Summary */}
            <div className="mb-6 flex flex-wrap gap-6">
                <div className="flex-1 min-w-[280px] bg-zinc-950/40 border border-green-500/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl flex items-center justify-center">
                        <FiTrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Closed / Converted</p>
                        <h3 className="text-xl font-black text-white">{stats.total_converted_leads}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[280px] bg-zinc-950/40 border border-blue-500/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                        <MdOutlineFactCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Leads</p>
                        <h3 className="text-xl font-black text-white">{stats.total_leads}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[280px] bg-zinc-950/40 border border-orange-500/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl flex items-center justify-center">
                        <FiMessageSquare size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Follow-ups Today</p>
                        <h3 className="text-xl font-black text-white">{stats.followups_today}</h3>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center gap-6 shadow-xl">
                <div className="flex-1">
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        searchPlaceholder="Search leads by name, phone or requirement..."
                    />
                </div>

                <div className="flex flex-wrap items-center gap-6 lg:gap-8 lg:w-fit">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-fit">Status:</span>
                        <div className="flex-1 sm:w-[400px]">
                            <div className="sm:hidden">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                >
                                    {statusOptions.map(s => (
                                        <option key={s} value={s} className="bg-zinc-900 text-zinc-300">{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="hidden sm:block">
                                <PremiumTabs
                                    options={statusOptions}
                                    value={statusFilter}
                                    onChange={(val) => { setStatusFilter(val); setPage(1); }}
                                    showLabel={false}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-fit">Priority:</span>
                        <div className="flex-1 sm:w-[300px]">
                            <div className="sm:hidden">
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                                >
                                    {priorityOptions.map(p => (
                                        <option key={p} value={p} className="bg-zinc-900 text-zinc-300">{p}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="hidden sm:block">
                                <PremiumTabs
                                    options={priorityOptions}
                                    value={priorityFilter}
                                    onChange={(val) => { setPriorityFilter(val); setPage(1); }}
                                    showLabel={false}
                                    variant="indigo"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="overflow-x-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center bg-zinc-900/10">
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-500 border-t-white animate-spin mb-4"></div>
                            <p className="text-zinc-400 font-medium">Loading leads data...</p>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center bg-zinc-900/10">
                            <FiUser size={48} className="mb-4 text-zinc-700" />
                            <p className="text-zinc-500 font-medium">No leads found matching your criteria.</p>
                        </div>
                    ) : (
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                                {tableColumns.map((col, idx) => (
                                    <th key={idx} className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {leads.map((lead, index) => {
                                const isWasted = lead.status === "wasted";
                                return (
                                <tr
                                    key={lead._id}
                                    className={`group hover:bg-zinc-900/50 transition-all duration-200 ${isWasted ? "opacity-50 grayscale-[0.3]" : ""}`}
                                >
                                    <td className="p-4 text-xs font-bold text-zinc-600">
                                        #{(page - 1) * rowsPerPage + index + 1}
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-semibold text-white group-hover:text-blue-400 transition-colors ${isWasted ? "line-through text-zinc-500" : ""}`}>
                                                {lead.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-medium">
                                                Added: {new Date(lead.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                                                    <FiPhone size={12} />
                                                </div>
                                                <CopyButton text={lead.phone} />
                                            </div>
                                            {lead.email && lead.email !== "" && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                                                        <FiMail size={12} />
                                                    </div>
                                                    <button className="text-[11px] text-zinc-400 hover:text-blue-400 truncate max-w-[140px]" title={lead.email}>
                                                        {lead.email}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4 text-xs font-medium text-zinc-300">
                                        <div className={`flex items-center gap-2 max-w-[180px] ${isWasted ? "line-through text-zinc-600" : ""}`} title={lead.requirement}>
                                            <MdOutlineFactCheck size={14} className={`shrink-0 ${isWasted ? "text-zinc-600" : "text-blue-400"}`} />
                                            <span className="truncate">{lead.requirement}</span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span className={`text-sm font-black text-white px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg whitespace-nowrap ${isWasted ? "line-through text-zinc-600 border-zinc-900 opacity-60" : ""}`}>
                                            {lead.budget}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <div className={`flex items-center gap-1.5 ${isWasted ? "opacity-40" : ""}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${lead.client_type === "renting" ? "bg-amber-400" : lead.client_type === "buying" ? "bg-emerald-400" : "bg-indigo-400"}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                {lead.client_type || "buying"}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800">
                                            {lead.source}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 min-w-[100px]">
                                            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
                                                <FiHome size={12} className="text-emerald-400" />
                                                <span className="text-[11px] font-semibold text-zinc-300 whitespace-nowrap">
                                                    {Array.isArray(lead.properties) && lead.properties.length > 0 
                                                        ? `${lead.properties.length} Props` 
                                                        : "None"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 relative">
                                        <select
                                            value={lead.priority}
                                            onChange={(e) => handleUpdateField(lead._id, 'priority', e.target.value)}
                                            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getPriorityColor(lead.priority)} uppercase tracking-widest bg-zinc-950/20 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all appearance-none text-center min-w-[80px]`}
                                        >
                                            <option value="high" className="bg-zinc-900 text-red-500">HIGH</option>
                                            <option value="medium" className="bg-zinc-900 text-yellow-500">MEDIUM</option>
                                            <option value="low" className="bg-zinc-900 text-blue-500">LOW</option>
                                        </select>
                                    </td>

                                    <td className="p-4">
                                        <button 
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                setIsFollowUpModalOpen(true);
                                            }}
                                            className="flex flex-col gap-1 items-center bg-zinc-900/40 border border-zinc-800 px-2 py-2 rounded-xl min-w-[120px] hover:border-blue-500/30 hover:bg-blue-600/5 transition-all group/followup"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FiCalendar size={12} className="text-blue-400 group-hover/followup:text-blue-300" />
                                                <span className="text-[11px] font-bold text-white tracking-tight group-hover/followup:text-blue-100 uppercase whitespace-nowrap">
                                                    {lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleDateString() : "Set Date"}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 items-center justify-center">
                                                {lead.followed_by && (
                                                    <div className="flex items-center gap-1 opacity-50 group-hover/followup:opacity-100 transition-opacity">
                                                        <FiUser size={10} className="text-zinc-500" />
                                                        <span className="text-[9px] font-bold text-zinc-400 tracking-tighter uppercase whitespace-nowrap">
                                                            By {lead.followed_by.user_name || 'Agent'}
                                                        </span>
                                                    </div>
                                                )}
                                                {lead.follow_up_status && (
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                                                        lead.follow_up_status === "done" 
                                                        ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" 
                                                        : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                                                    }`}>
                                                        {lead.follow_up_status}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    </td>

                                    <td className="p-4">
                                        <div className={`flex items-center gap-2 group/status`}>
                                            <div className={`w-2 h-2 rounded-full ${lead.status === "closed" || lead.status === "converted" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" :
                                                lead.status === "follow_up" ? "bg-orange-500" :
                                                    lead.status === "lost" ? "bg-red-500" :
                                                        lead.status === "wasted" ? "bg-purple-500" : "bg-blue-500"
                                                }`} />
                                            <select
                                                value={lead.status || "new"}
                                                onChange={(e) => handleUpdateField(lead._id, 'status', e.target.value)}
                                                className={`text-xs font-bold bg-transparent cursor-pointer focus:outline-none hover:bg-zinc-800/50 px-1 rounded transition-colors appearance-none ${getStatusColor(lead.status)} capitalize`}
                                            >
                                                {statusOptions.slice(1).map(s => (
                                                    <option key={s} value={s.toLowerCase()} className="bg-zinc-900 text-zinc-300">{s.replace("_", "-")}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div 
                                                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 cursor-pointer transition-all"
                                                title="View Details"
                                            >
                                                <FiEye size={16} />
                                            </div>
                                            <div
                                                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:border-blue-400/30 cursor-pointer transition-all"
                                                title="Edit Lead"
                                                onClick={() => {
                                                    setEditingLead(lead);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <FiEdit size={16} />
                                            </div>
                                            <div
                                                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 opacity-30 cursor-not-allowed"
                                                title="Soft Delete not yet fully implemented"
                                            >
                                                <FiTrash2 size={16} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    )}
                </div>

                {/* Pagination Section */}
                {leads.length > 0 && (
                <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/10">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(val) => { setRowsPerPage(val); setPage(1); }}
                    />
                </div>
                )}
            </div>

            {/* Modals */}
            <AddLeadModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddLead}
            />

            <EditLeadModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingLead(null);
                }}
                onUpdate={handleUpdateLead}
                lead={editingLead}
            />

            <FollowUpModal
                isOpen={isFollowUpModalOpen}
                onClose={() => {
                    setIsFollowUpModalOpen(false);
                    setSelectedLead(null);
                }}
                onSave={handleSaveFollowUp}
                lead={selectedLead}
            />
        </AppLayout>
    );
};

export default LeadsPage;
