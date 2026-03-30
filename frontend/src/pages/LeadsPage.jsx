import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../component/layout/AppLayout";
import {
    FiEdit,
    FiTrash2,
    FiEye,
    FiMessageSquare,
    FiTrendingUp,
  
} from "react-icons/fi";
import { MdOutlineFactCheck } from "react-icons/md";
import { CopyButton } from "../component/common/CopyButton";
import { SearchFilter } from "../component/common/SearchFilter";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import AddLeadModal from "../component/modal/AddLeadModal";
import EditLeadModal from "../component/modal/EditLeadModal";
import FollowUpModal from "../component/modal/FollowUpModal";
import MarkLostModal from "../component/modal/MarkLostModal";
import { useLeads, useUpdateLead, useAgentDashboardSummary } from "../hooks/useLeadHooks";

/* ─── Table Columns ─── */
const tableColumns = ["#", "Lead Info", "Contact", "Requirement", "Budget", "Inquiry For", "Source", "Properties", "Priority", "Next Follow-up", "Status", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = ["All", "New", "Contacted", "Qualified", "Follow_up", "Converted", "Closed", "Lost", "Wasted", "Archived"];
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
    const [isMarkLostModalOpen, setIsMarkLostModalOpen] = useState(false);
    const [leadToMarkLost, setLeadToMarkLost] = useState(null);
    const navigate = useNavigate();

    // React Query Hooks
    const { data: dashboardData } = useAgentDashboardSummary();
    const stats = dashboardData?.data || { total_leads: 0, total_converted_leads: 0, total_lost_leads: 0, followups_today: 0 };

    // Prepare filters for API with memoization to prevent object literal instability
    const filters = useMemo(() => ({
        page,
        limit: rowsPerPage,
        search,
        status: statusFilter === "All" ? "" : statusFilter.toLowerCase(),
        priority: priorityFilter === "All" ? "" : priorityFilter.toLowerCase()
    }), [page, rowsPerPage, search, statusFilter, priorityFilter]);

    const { data: leadsData, isLoading, refetch } = useLeads(filters);

    const updateLeadMutation = useUpdateLead();

    const leads = leadsData?.data || [];
    const totalPages = leadsData?.pagination?.pages || 1;
    const leadsStats = leadsData?.stats || { 
        total: 0, new: 0, contacted: 0, qualified: 0, 
        follow_up: 0, converted: 0, lost: 0, wasted: 0 
    };

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
    };

    const handleUpdateLead = () => {
        setIsEditModalOpen(false);
        setEditingLead(null);
    };

    const handleUpdateField = (id, field, value) => {
        if (field === 'status' && value === 'lost') {
            const lead = leads.find(l => l._id === id);
            setLeadToMarkLost(lead);
            setIsMarkLostModalOpen(true);
            return;
        }
        updateLeadMutation.mutate({ id, data: { [field]: value } });
    };

    const handleMarkLostSuccess = () => {
        setIsMarkLostModalOpen(false);
        setLeadToMarkLost(null);
        refetch();
    };

    const handleSaveFollowUp = () => {
        setIsFollowUpModalOpen(false);
        setSelectedLead(null);
    };

    return (
        <AppLayout>
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Lead Pipeline</h2>
                    <p className="text-sm text-zinc-400">Track and manage your potential property buyers</p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={handleRefresh} />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded flex items-center justify-center transition-colors h-10"
                    >
                        Add New Lead
                    </button>
                </div>
            </div>

            {/* Analytics Summary - Filtered Stats */}
            <div className="mb-6 flex flex-wrap gap-4 border border-zinc-800 rounded p-4 bg-zinc-900/10">
                <div className="flex-1 min-w-[180px] flex items-center gap-3 border-r border-zinc-800 last:border-0 h-12">
                    <FiTrendingUp size={20} className="text-green-500" />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Total / Search</p>
                        <h3 className="text-lg font-bold text-white mt-1 leading-none">{leadsStats.total}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[180px] flex items-center gap-3 border-r border-zinc-800 last:border-0 h-12">
                    <MdOutlineFactCheck size={20} className="text-yellow-500" />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">New Leads</p>
                        <h3 className="text-lg font-bold text-white mt-1 leading-none">{leadsStats.new}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[180px] flex items-center gap-3 border-r border-zinc-800 h-12">
                    <FiTrendingUp size={20} className="text-emerald-500" />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Converted</p>
                        <h3 className="text-lg font-bold text-white mt-1 leading-none">{leadsStats.converted}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[180px] flex items-center gap-3 h-12">
                    <FiMessageSquare size={20} className="text-orange-500" />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Pending Follow-ups</p>
                        <h3 className="text-lg font-bold text-white mt-1 leading-none">{leadsStats.follow_up}</h3>
                    </div>
                </div>
            </div>

            {/* Status Tabs Bar */}
            <div className="mb-6 border-b border-zinc-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
                {statusOptions.map(s => {
                    const statusKey = s.toLowerCase();
                    const count = statusKey === "all" ? leadsStats.total : leadsStats[statusKey] || 0;
                    const isActive = statusFilter === s;
                    
                    return (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px-4 py-3 text-sm font-medium transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
                                isActive 
                                ? "bg-yellow-600/10 text-yellow-400 border-yellow-500" 
                                : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5"
                            }`}
                        >
                            {s.replace("_", " ")}
                            <span className={`w-5 h-5 flex items-center justify-center text-[10px] rounded-full transition-colors ${
                                isActive ? "bg-yellow-500/20 text-yellow-400" : "bg-zinc-800 text-zinc-500"
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Filters Bar */}
            <div className="border border-zinc-800 rounded p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/20">
                <div className="flex-1 max-w-lg">
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        searchPlaceholder="Search leads by name, phone or requirement..."
                    />
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Priority</span>
                        <div className="flex bg-zinc-900 border border-zinc-800 rounded p-1">
                            {priorityOptions.map(p => (
                                <button
                                    key={p}
                                    onClick={() => { setPriorityFilter(p); setPage(1); }}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                        priorityFilter === p 
                                        ? "bg-zinc-800 text-white shadow-lg" 
                                        : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leads Table */}
            <div className="border border-zinc-800 rounded overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-zinc-400 text-sm">Loading leads data...</div>
                    ) : leads.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">No leads found matching your criteria.</div>
                    ) : (
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs text-left">
                                {tableColumns.map((col, idx) => (
                                    <th key={idx} className="p-3 font-medium tracking-wide whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-sm text-zinc-300 bg-zinc-950/20">
                            {leads.map((lead, index) => {
                                const isWasted = lead.status === "wasted";
                                return (
                                <tr
                                    key={lead._id}
                                    className={isWasted ? "opacity-60 bg-zinc-900/40" : ""}
                                >
                                    <td className="p-3 text-zinc-500">
                                        {(page - 1) * rowsPerPage + index + 1}
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${isWasted ? "line-through text-zinc-500" : "text-zinc-100"}`}>
                                                {lead.name}
                                            </span>
                                            <span className="text-xs text-zinc-500 mt-0.5">
                                                Added: {new Date(lead.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <CopyButton text={lead.phone} />
                                            </div>
                                            {lead.email && lead.email !== "" && (
                                                <div className="text-xs text-zinc-400 truncate max-w-[140px]" title={lead.email}>
                                                    {lead.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className={`${isWasted ? "line-through text-zinc-500" : ""}`}>
                                            <span className="truncate max-w-[150px] inline-block">{lead.requirement}</span>
                                        </div>
                                    </td>

                                    <td className="p-3 font-medium text-zinc-200">
                                        <span className={`${isWasted ? "line-through text-zinc-500" : ""}`}>
                                            {lead.budget}
                                        </span>
                                    </td>

                                    <td className="p-3 capitalize">
                                        {lead.client_type || "buying"}
                                    </td>

                                    <td className="p-3 capitalize">
                                        {lead.source}
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                                            {Array.isArray(lead.properties) && lead.properties.length > 0 ? (
                                                lead.properties.map((p, i) => (
                                                    <span key={i} className="text-[10px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 truncate max-w-[120px]" title={p.property_title || p._id || p}>
                                                        {p.property_title || "Property"}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-zinc-600 italic text-[10px]">None</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <select
                                            value={lead.priority}
                                            onChange={(e) => handleUpdateField(lead._id, 'priority', e.target.value)}
                                            className={`text-[10px] p-1 rounded border bg-zinc-900 uppercase cursor-pointer focus:outline-none font-bold tracking-tight ${
                                                lead.priority === 'high' ? 'text-red-400 border-red-500/30' :
                                                lead.priority === 'medium' ? 'text-orange-400 border-orange-500/30' :
                                                'text-emerald-400 border-emerald-500/30'
                                            }`}
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-col items-start max-w-[180px]">
                                            <button 
                                                onClick={() => {
                                                    setSelectedLead(lead);
                                                    setIsFollowUpModalOpen(true);
                                                }}
                                                className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors"
                                            >
                                                {lead.next_follow_up_date 
                                                    ? new Date(lead.next_follow_up_date).toLocaleString([], { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    }) 
                                                    : "Set Date"}
                                            </button>
                                            <div className="text-[10px] text-zinc-500 mb-1 mt-0.5">
                                                {lead.followed_by ? 'By ' + lead.followed_by.user_name : ''}
                                                {lead.follow_up_status && ` (${lead.follow_up_status})`}
                                            </div>
                                            {lead.remarks && (
                                                <p className="text-xs text-zinc-400 italic truncate w-full" title={lead.remarks}>
                                                    "{lead.remarks}"
                                                </p>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-col gap-1.5">
                                            <select
                                                value={lead.status || "new"}
                                                onChange={(e) => handleUpdateField(lead._id, 'status', e.target.value)}
                                                className={`text-xs p-1.5 rounded border bg-zinc-900 capitalize cursor-pointer focus:outline-none w-full font-medium ${
                                                    lead.status === 'new' ? 'text-yellow-400 border-yellow-500/30' :
                                                    lead.status === 'contacted' ? 'text-zinc-300 border-zinc-700/30' :
                                                    lead.status === 'qualified' ? 'text-violet-400 border-violet-500/30' :
                                                    lead.status === 'follow_up' ? 'text-orange-400 border-orange-500/30' :
                                                    lead.status === 'converted' ? 'text-teal-400 border-teal-500/30' :
                                                    lead.status === 'closed' ? 'text-emerald-400 border-emerald-500/30' :
                                                    lead.status === 'lost' ? 'text-red-400 border-red-500/30' :
                                                    'text-zinc-500 border-zinc-800'
                                                }`}
                                            >
                                                {statusOptions.slice(1).map(s => (
                                                    <option key={s} value={s.toLowerCase()} className="bg-zinc-900 text-zinc-300">{s.replace("_", "-")}</option>
                                                ))}
                                            </select>
                                            <span className="text-[10px] text-zinc-500 whitespace-nowrap">
                                                {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="text-zinc-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-white transition-colors"
                                                title="View Details"
                                                onClick={() => navigate(`/leads/${lead._id}`)}
                                            >
                                                <FiEye size={14} />
                                            </button>
                                            <button
                                                className="text-yellow-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-yellow-300 transition-colors"
                                                title="Edit Lead"
                                                onClick={() => {
                                                    setEditingLead(lead);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <FiEdit size={14} />
                                            </button>
                                            <button
                                                className="text-zinc-600 bg-zinc-900 border border-zinc-800 p-1.5 rounded cursor-not-allowed"
                                                title="Delete"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
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
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
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

            {/* Modals - Conditionally rendered to prevent background API calls when closed */}
            {isAddModalOpen && (
                <AddLeadModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onAdd={handleAddLead}
                />
            )}

            {isEditModalOpen && (
                <EditLeadModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingLead(null);
                    }}
                    onUpdate={handleUpdateLead}
                    lead={editingLead}
                />
            )}

            {isFollowUpModalOpen && (
                <FollowUpModal
                    isOpen={isFollowUpModalOpen}
                    onClose={() => {
                        setIsFollowUpModalOpen(false);
                        setSelectedLead(null);
                    }}
                    onSave={handleSaveFollowUp}
                    lead={selectedLead}
                />
            )}

            {isMarkLostModalOpen && (
                <MarkLostModal
                    isOpen={isMarkLostModalOpen}
                    onClose={() => setIsMarkLostModalOpen(false)}
                    lead={leadToMarkLost}
                    onStatusUpdated={handleMarkLostSuccess}
                />
            )}
        </AppLayout>
    );
};

export default LeadsPage;
