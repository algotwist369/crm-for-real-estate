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
import { CopyButton } from "../component/common/CopyButton";
import { SearchFilter } from "../component/common/SearchFilter";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import AddLeadModal from "../component/modal/AddLeadModal";
import EditLeadModal from "../component/modal/EditLeadModal";
import FollowUpModal from "../component/modal/FollowUpModal";
import { useLeads, useUpdateLead, useAgentDashboardSummary } from "../hooks/useLeadHooks";

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
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded flex items-center justify-center transition-colors h-10"
                    >
                        Add New Lead
                    </button>
                </div>
            </div>

            {/* Analytics Summary */}
            <div className="mb-6 flex flex-wrap gap-4 border border-zinc-800 rounded p-4">
                <div className="flex-1 min-w-[200px] flex items-center gap-3 border-r border-zinc-800 last:border-0">
                    <FiTrendingUp size={20} className="text-green-500" />
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Closed / Converted</p>
                        <h3 className="text-lg font-bold text-white mt-1">{stats.total_converted_leads}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px] flex items-center gap-3 border-r border-zinc-800 last:border-0">
                    <MdOutlineFactCheck size={20} className="text-blue-500" />
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Total Leads</p>
                        <h3 className="text-lg font-bold text-white mt-1">{stats.total_leads}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px] flex items-center gap-3">
                    <FiMessageSquare size={20} className="text-orange-500" />
                    <div>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest">Follow-ups Today</p>
                        <h3 className="text-lg font-bold text-white mt-1">{stats.followups_today}</h3>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="border border-zinc-800 rounded p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 max-w-lg">
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        searchPlaceholder="Search leads by name, phone or requirement..."
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-400">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none cursor-pointer"
                        >
                            {statusOptions.map(s => (
                                <option key={s} value={s}>{s.replace("_", " ")}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-400">Priority:</span>
                        <select
                            value={priorityFilter}
                            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                            className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none cursor-pointer"
                        >
                            {priorityOptions.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
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
                                                <span>{lead.phone}</span>
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
                                        {Array.isArray(lead.properties) && lead.properties.length > 0 
                                            ? `${lead.properties.length} Props` 
                                            : "None"}
                                    </td>

                                    <td className="p-3">
                                        <select
                                            value={lead.priority}
                                            onChange={(e) => handleUpdateField(lead._id, 'priority', e.target.value)}
                                            className="text-xs p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 uppercase cursor-pointer focus:outline-none"
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
                                                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                {lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleDateString() : "Set Date"}
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
                                        <select
                                            value={lead.status || "new"}
                                            onChange={(e) => handleUpdateField(lead._id, 'status', e.target.value)}
                                            className="text-xs p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 capitalize cursor-pointer focus:outline-none"
                                        >
                                            {statusOptions.slice(1).map(s => (
                                                <option key={s} value={s.toLowerCase()}>{s.replace("_", "-")}</option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="text-zinc-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-white transition-colors"
                                                title="View Details"
                                            >
                                                <FiEye size={14} />
                                            </button>
                                            <button
                                                className="text-blue-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-blue-300 transition-colors"
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
