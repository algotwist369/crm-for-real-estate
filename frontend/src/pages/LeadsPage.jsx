import React, { useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../component/layout/AppLayout";
import {
    FiEdit,
    FiTrash2,
    FiEye,
    FiMessageSquare,
    FiTrendingUp,
    FiDownload,
    FiMapPin,
    FiUploadCloud
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
import ExportLeadsModal from "../component/modal/ExportLeadsModal";
import { useLeads, useUpdateLead, useDeleteLead, useBulkDeleteLeads } from "../hooks/useLeadHooks";
import { useImportLeads } from "../hooks/useCampaignHooks";
import campaignService from "../api/campaign.service";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/* ─── Table Columns ─── */
const tableColumns = ["Select", "#", "Lead Info", "Lead / Prop Type", "Contact", "Location", "Requirement", "Budget", "Source", "Properties", "Priority", "Next Follow-up", "Status", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = ["All", "New", "Contacted", "Qualified", "Follow_up", "Site_visit", "Negotiation", "Booked", "Converted", "Closed", "Lost", "Wasted", "Archived"];
const priorityOptions = ["All", "High", "Medium", "Low"];
const leadTypeOptions = ["All", "Buyer", "Seller", "Owner", "Tenant", "Investor", "Listing", "Broker", "Other"];

const LeadsPage = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [leadTypeFilter, setLeadTypeFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [isMarkLostModalOpen, setIsMarkLostModalOpen] = useState(false);
    const [leadToMarkLost, setLeadToMarkLost] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedLeadIds, setSelectedLeadIds] = useState([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [bulkDeleteRange, setBulkDeleteRange] = useState({ startDate: "", endDate: "" });
    const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");
    const excelInputRef = useRef(null);
    const navigate = useNavigate();

    // Prepare filters for API with memoization to prevent object literal instability
    const filters = useMemo(() => ({
        page,
        limit: rowsPerPage,
        search,
        status: statusFilter === "All" ? "" : statusFilter.toLowerCase(),
        priority: priorityFilter === "All" ? "" : priorityFilter.toLowerCase(),
        lead_type: leadTypeFilter === "All" ? "" : leadTypeFilter.toLowerCase()
    }), [page, rowsPerPage, search, statusFilter, priorityFilter, leadTypeFilter]);

    const { user } = useAuth();
    const isAdmin = ['admin', 'super_admin'].includes(user?.role);
    const visibleTableColumns = useMemo(
        () => isAdmin ? tableColumns : tableColumns.filter(col => col !== "Select"),
        [isAdmin]
    );

    const { data: leadsData, isLoading, refetch } = useLeads(filters);

    const updateLeadMutation = useUpdateLead();
    const deleteLeadMutation = useDeleteLead();
    const bulkDeleteMutation = useBulkDeleteLeads();
    const importLeadsMutation = useImportLeads();

    const leads = leadsData?.data || [];
    const totalPages = leadsData?.pagination?.pages || 1;
    const leadsStats = leadsData?.stats || { 
        total: 0, new: 0, contacted: 0, qualified: 0, 
        follow_up: 0, site_visit: 0, negotiation: 0, booked: 0, converted: 0, lost: 0, wasted: 0 
    };
    const currentPageLeadIds = useMemo(() => leads.map(lead => lead._id), [leads]);
    const allCurrentPageSelected = currentPageLeadIds.length > 0 && currentPageLeadIds.every(id => selectedLeadIds.includes(id));

    /* ─── Refresh Handler ─── */
    const handleRefresh = () => {
        setSearch("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setLeadTypeFilter("All");
        setSelectedLeadIds([]);
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

    const handleDeleteLead = (id, name) => {
        if (window.confirm(`Are you sure you want to delete lead "${name}"? This action cannot be undone.`)) {
            deleteLeadMutation.mutate(id);
        }
    };

    const handleToggleLeadSelection = (id) => {
        setSelectedLeadIds(prev => (
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        ));
    };

    const handleToggleCurrentPageSelection = () => {
        setSelectedLeadIds(prev => {
            if (allCurrentPageSelected) {
                return prev.filter(id => !currentPageLeadIds.includes(id));
            }
            const next = new Set(prev);
            currentPageLeadIds.forEach(id => next.add(id));
            return Array.from(next);
        });
    };

    const handleBulkDelete = async (e) => {
        e.preventDefault();

        const payload = {
            leadIds: selectedLeadIds,
            startDate: bulkDeleteRange.startDate || undefined,
            endDate: bulkDeleteRange.endDate || undefined,
            confirmPermanent: bulkDeleteConfirmText === "DELETE"
        };

        if (selectedLeadIds.length === 0 && (!payload.startDate || !payload.endDate)) {
            toast.error("Select leads or choose both start and end dates.");
            return;
        }

        if (bulkDeleteConfirmText !== "DELETE") {
            toast.error('Type DELETE to confirm permanent deletion.');
            return;
        }

        const scope = selectedLeadIds.length > 0
            ? `${selectedLeadIds.length} selected lead${selectedLeadIds.length === 1 ? "" : "s"}`
            : "all matching leads in the selected date interval";

        if (!window.confirm(`Permanently delete ${scope}? This cannot be undone.`)) {
            return;
        }

        await bulkDeleteMutation.mutateAsync(payload);
        setSelectedLeadIds([]);
        setBulkDeleteRange({ startDate: "", endDate: "" });
        setBulkDeleteConfirmText("");
        setIsBulkDeleteModalOpen(false);
        setPage(1);
        refetch();
    };

    const handleExcelTemplateDownload = async () => {
        try {
            toast.loading("Downloading template...", { id: "download-template" });
            const blob = await campaignService.downloadTemplate();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "leads_import_template.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Template downloaded successfully", { id: "download-template" });
        } catch (error) {
            toast.error("Failed to download template", { id: "download-template" });
        }
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        if (!["xlsx", "xls"].includes(fileExtension)) {
            toast.error("Please upload an Excel file (.xlsx or .xls)");
            if (excelInputRef.current) excelInputRef.current.value = "";
            return;
        }

        const formDataExcel = new FormData();
        formDataExcel.append("file", file);

        try {
            await importLeadsMutation.mutateAsync(formDataExcel);
            setPage(1);
            refetch();
        } finally {
            if (excelInputRef.current) excelInputRef.current.value = "";
        }
    };

    return (
        <AppLayout>
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Lead Pipeline</h2>
                    <p className="text-sm text-zinc-400">Track and manage your potential property leads by location and status</p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={handleRefresh} />
                    <button
                        onClick={handleExcelTemplateDownload}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-medium rounded flex items-center gap-2 transition-colors h-10"
                        title="Download Excel import template"
                    >
                        <FiDownload size={16} /> Template
                    </button>
                    <input
                        ref={excelInputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls"
                        onChange={handleExcelUpload}
                    />
                    <button
                        onClick={() => excelInputRef.current?.click()}
                        disabled={importLeadsMutation.isPending}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-medium rounded flex items-center gap-2 transition-colors h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiUploadCloud size={16} /> {importLeadsMutation.isPending ? "Importing..." : "Import Excel"}
                    </button>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-medium rounded flex items-center gap-2 transition-colors h-10"
                    >
                        <FiDownload size={16} /> Export
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 text-sm font-medium rounded flex items-center gap-2 transition-colors h-10"
                            title="Bulk delete selected leads or leads in a date interval"
                        >
                            <FiTrash2 size={16} /> Bulk Delete
                            {selectedLeadIds.length > 0 && (
                                <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-red-500/20 text-[10px] flex items-center justify-center">
                                    {selectedLeadIds.length}
                                </span>
                            )}
                        </button>
                    )}
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
                    <FiTrendingUp size={20} className="text-purple-500" />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Negotiating</p>
                        <h3 className="text-lg font-bold text-white mt-1 leading-none">{leadsStats.negotiation}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[180px] flex items-center gap-3 h-12">
                    <FiMessageSquare size={20} className="text-orange-500" />
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest leading-none">Site Visits / Follow Up</p>
                        <h3 className="text-lg font-bold text-white mt-1 leading-none">{leadsStats.site_visit + leadsStats.follow_up}</h3>
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
                        searchPlaceholder="Search leads by name, phone, location or requirement..."
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden xl:block">Type</span>
                        <div className="flex bg-zinc-900 border border-zinc-800 rounded p-1">
                            {leadTypeOptions.slice(0, 4).map(p => (
                                <button key={p} onClick={() => { setLeadTypeFilter(p); setPage(1); }}
                                    className={`px-2 py-1 text-xs font-medium rounded transition-colors ${leadTypeFilter === p ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden xl:block">Priority</span>
                        <div className="flex bg-zinc-900 border border-zinc-800 rounded p-1">
                            {priorityOptions.map(p => (
                                <button key={p} onClick={() => { setPriorityFilter(p); setPage(1); }}
                                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${priorityFilter === p ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}>
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
                    <table className="w-full text-left border-collapse min-w-[1250px]">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 text-xs text-left">
                                {visibleTableColumns.map((col, idx) => (
                                    <th key={idx} className="p-3 font-medium tracking-wide whitespace-nowrap">
                                        {col === "Select" ? (
                                            <input
                                                type="checkbox"
                                                checked={allCurrentPageSelected}
                                                onChange={handleToggleCurrentPageSelection}
                                                disabled={!isAdmin}
                                                title="Select all leads on this page"
                                                className="w-4 h-4 rounded border border-zinc-700 bg-zinc-950 checked:accent-red-500 disabled:opacity-40"
                                            />
                                        ) : col}
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
                                    {isAdmin && (
                                        <td className="p-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedLeadIds.includes(lead._id)}
                                                onChange={() => handleToggleLeadSelection(lead._id)}
                                                className="w-4 h-4 rounded border border-zinc-700 bg-zinc-950 checked:accent-red-500"
                                            />
                                        </td>
                                    )}

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
                                        <div className="flex flex-col gap-1.5 align-start">
                                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider w-fit inline-block bg-yellow-500/10 text-yellow-400 border-yellow-500/20`}>
                                                {lead.lead_type || "Buyer"}
                                            </span>
                                            <span className="text-xs text-zinc-400 capitalize whitespace-nowrap">
                                                {lead.property_type || "Villa"}
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
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 max-w-[150px]" title={lead.location || lead.address || ""}>
                                            <FiMapPin size={13} className="text-zinc-600 shrink-0" />
                                            <span className="truncate">{lead.location || lead.address || "Not set"}</span>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className={`${isWasted ? "line-through text-zinc-500" : ""}`}>
                                            <span className="truncate max-w-[150px] inline-block">{lead.requirement}</span>
                                        </div>
                                    </td>

                                    <td className="p-3 font-medium text-zinc-200">
                                        <span className={`${isWasted ? "line-through text-zinc-500" : ""}`}>
                                            {lead.asking_price ? `${lead.currency || "AED"} ${lead.asking_price?.toLocaleString()}` : (lead.budget || "TBD")}
                                        </span>
                                    </td>

                                    <td className="p-3 capitalize">
                                        {lead.source.replace("_", " ")}
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
                                                    {lead.remarks}
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
                                                    lead.status === 'follow_up' ? 'text-blue-400 border-blue-500/30' :
                                                    lead.status === 'site_visit' ? 'text-orange-400 border-orange-500/30' :
                                                    lead.status === 'negotiation' ? 'text-purple-400 border-purple-500/30' :
                                                    lead.status === 'booked' ? 'text-emerald-300 border-emerald-400/30' :
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
                                                className={`p-1.5 rounded transition-colors border border-zinc-800 ${
                                                    isAdmin 
                                                    ? "text-red-400 bg-zinc-900 hover:text-red-300 hover:bg-red-500/10" 
                                                    : "text-zinc-600 bg-zinc-900 cursor-not-allowed"
                                                }`}
                                                title={isAdmin ? "Delete Lead" : "Deletion Restricted to Admins"}
                                                disabled={!isAdmin || deleteLeadMutation.isPending}
                                                onClick={() => isAdmin && handleDeleteLead(lead._id, lead.name)}
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

            {isExportModalOpen && (
                <ExportLeadsModal
                    isOpen={isExportModalOpen}
                    onClose={() => setIsExportModalOpen(false)}
                    activeFilters={filters}
                />
            )}

            {isBulkDeleteModalOpen && isAdmin && (
                <div className="fixed inset-0 bg-zinc-950/85 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                            <div>
                                <h2 className="text-base font-semibold text-white">Bulk Delete Leads</h2>
                                <p className="text-[11px] text-zinc-500 mt-0.5">Permanently delete selected leads or every lead added in a date interval.</p>
                            </div>
                            <button onClick={() => setIsBulkDeleteModalOpen(false)} className="text-zinc-500 hover:text-white">
                                <FiTrash2 size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleBulkDelete} className="p-6 space-y-5">
                            <div className="rounded border border-zinc-800 bg-zinc-950/40 p-4">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Selected Leads</p>
                                    <p className="text-sm text-zinc-300">
                                    {selectedLeadIds.length > 0
                                        ? `${selectedLeadIds.length} manually selected lead${selectedLeadIds.length === 1 ? "" : "s"}`
                                        : "No manual selection. Date interval will decide the delete scope."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={bulkDeleteRange.startDate}
                                        onChange={(e) => setBulkDeleteRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-zinc-600"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={bulkDeleteRange.endDate}
                                        onChange={(e) => setBulkDeleteRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-zinc-600"
                                    />
                                </div>
                            </div>

                            <p className="text-xs text-zinc-500 leading-relaxed">
                                This permanently removes lead records and related follow-up reminders/campaign lead messages from the database. With selected leads, dates are optional and will narrow the selected set. Without selected leads, both dates are required.
                            </p>

                            <div>
                                <label className="text-[10px] text-red-400 tracking-widest font-bold block mb-2">Type DELETE to confirm</label>
                                <input
                                    value={bulkDeleteConfirmText}
                                    onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full bg-zinc-950 border border-red-500/20 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-red-500"
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsBulkDeleteModalOpen(false);
                                        setBulkDeleteConfirmText("");
                                    }}
                                    disabled={bulkDeleteMutation.isPending}
                                    className="flex-1 px-4 py-2 border border-zinc-800 text-zinc-400 text-xs font-medium rounded hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={bulkDeleteMutation.isPending || bulkDeleteConfirmText !== "DELETE"}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50"
                                >
                                    {bulkDeleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

export default LeadsPage;
