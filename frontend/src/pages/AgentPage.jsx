import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { FiEdit, FiEye, FiTrash2, FiUser, FiX, FiSearch, FiMessageSquare } from "react-icons/fi";
import { PremiumButton } from "../component/common/PremiumButton";
import { PremiumToggle } from "../component/common/PremiumToggle";
import { CopyButton } from "../component/common/CopyButton";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import AddAgentModal from "../component/modal/AddAgentModal";
import EditAgentModal from "../component/modal/EditAgentModal";
import AgentRemarkModal from "../component/modal/AgentRemarkModal";
import { useAgents, useDeleteAgent, useUpdateAgentStatus } from "../hooks/useAgentHooks";

/* ─── Table Column Definitions ─── */
const tableColumns = ["#", "Agent", "Contact", "Properties", "Leads", "Deals", "Status", "Remark", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = ["All", "Active", "Inactive"];

const Agents = () => {
    const { data: agentsData, isLoading, refetch } = useAgents();
    const { mutate: deleteAgent } = useDeleteAgent();
    const { mutate: updateStatus } = useUpdateAgentStatus();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [selectedAgent, setSelectedAgent] = useState(null); // For View Popup
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // For Add Agent Popup
    const [editingAgent, setEditingAgent] = useState(null); // For Edit Agent Popup
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // For Edit Agent Popup
    const [remarkingAgent, setRemarkingAgent] = useState(null); // For Remark Modal
    const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false); // For Remark Modal

    const [rowsPerPage, setRowsPerPage] = useState(15);

    const agents = agentsData?.data || [];

    /* ─── Rows Per Page Change ─── */
    const handleRowsPerPageChange = (value) => {
        setRowsPerPage(value);
        setPage(1);
    };

    /* ─── Toggle Agent Status ─── */
    const toggleStatus = (id, currentStatus) => {
        updateStatus({ id, data: { is_active: !currentStatus } });
    };

    /* ─── Delete Agent ─── */
    const handleDeleteAgent = (id) => {
        if (window.confirm("Are you sure you want to delete this agent?")) {
            deleteAgent(id);
        }
    };

    /* ─── Refresh ─── */
    const handleRefresh = () => {
        refetch();
        setSearch("");
        setStatusFilter("All");
        setPage(1);
    };

    /* ─── Filter + Search ─── */
    const filteredAgents = agents.filter((agent) => {
        const details = agent.agent_details || {};
        const matchesSearch =
            (details.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
            (details.phone_number || "").includes(search) ||
            (details.email || "").toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "All" ||
            (statusFilter === "Active" && agent.is_active) ||
            (statusFilter === "Inactive" && !agent.is_active);

        return matchesSearch && matchesStatus;
    });

    /* ─── Pagination ─── */
    const totalPages = Math.ceil(filteredAgents.length / rowsPerPage);

    const paginatedAgents = filteredAgents.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    /* ─── Handlers for SearchFilter ─── */
    const handleSearchChange = (value) => {
        setSearch(value);
        setPage(1);
    };

    const handleFilterChange = (value) => {
        setStatusFilter(value);
        setPage(1);
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading Agents...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>

            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pt-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-light text-white tracking-tight">Agents</h2>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-[0.2em] opacity-80">Team Management & Performance</p>
                </div>

                <div className="flex items-center gap-4">
                    <RefreshButton onClick={handleRefresh} isRefreshing={isLoading} />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-zinc-100 hover:bg-white text-black text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-white/5 active:scale-95 flex items-center gap-2"
                    >
                        <FiUser size={14} /> Add Agent
                    </button>
                </div>
            </div>

            {/* Minimalist Search + Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
                <div className="flex-1 relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, email..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-sm py-3 pl-12 pr-4 rounded-2xl focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-2xl focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer hover:bg-zinc-900 transition-all min-w-[140px]"
                    >
                        {statusOptions.map(opt => (
                            <option key={opt} value={opt} className="bg-zinc-900 text-zinc-300">
                                {opt === "All" ? "ALL STATUS" : opt.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
            </div>


            {/* ── Table ── */}
            <div className="overflow-x-auto bg-zinc-950 border border-zinc-800 rounded-lg">

                <table className="w-full text-sm">

                    <thead className="border-b border-zinc-800 text-zinc-400">
                        <tr>
                            {tableColumns.map((col) => (
                                <th key={col} className="text-left p-3 uppercase text-[10px] font-black tracking-widest">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {paginatedAgents.length > 0 ? paginatedAgents.map((agent, index) => {
                            const details = agent.agent_details || {};
                            return (
                                <tr
                                    key={agent._id}
                                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                                >
                                    <td className="p-3 text-zinc-500 font-mono text-xs">{(page - 1) * rowsPerPage + index + 1}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
                                                {details.profile_pic ? (
                                                    <img
                                                        src={details.profile_pic}
                                                        alt={details.user_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-blue-500 uppercase font-black text-xs">
                                                        {(details.user_name || "A").charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-100">{details.user_name}</span>
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{agent.agent_role || "Agent"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-100 font-medium text-xs">+{details.phone_number}</span>
                                            <span className="text-[10px] text-zinc-500 font-medium">{details.email}</span>
                                            <div className="mt-1">
                                                <CopyButton text={agent.agent_pin?.toString()} />
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <span className="bg-zinc-800/50 text-[10px] font-black text-zinc-400 px-2 py-0.5 rounded tracking-widest border border-zinc-700/50">
                                            {agent.assigned_properties?.length || 0}
                                        </span>
                                    </td>

                                    <td className="p-3 text-yellow-500 font-black text-xs">{agent.total_leads || 0}</td>
                                    <td className="p-3 text-emerald-500 font-black text-xs">{agent.total_converted_leads || 0}</td>
                                    
                                    <td className="p-3">
                                        <PremiumToggle
                                            enabled={agent.is_active}
                                            onChange={() => toggleStatus(agent._id, agent.is_active)}
                                        />
                                    </td>

                                    <td className="p-3">
                                        <div className="max-w-[120px] truncate group-hover:whitespace-normal transition-all" title={agent.remark}>
                                            <p className="text-[10px] text-zinc-500 font-medium italic">
                                                {agent.remark || "—"}
                                            </p>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex gap-3">
                                            <FiEye
                                                className="cursor-pointer text-zinc-500 hover:text-white transition-colors"
                                                onClick={() => setSelectedAgent(agent)}
                                                title="View Profile"
                                            />
                                            <FiMessageSquare
                                                className="cursor-pointer text-zinc-500 hover:text-indigo-400 transition-colors"
                                                onClick={() => {
                                                    setRemarkingAgent(agent);
                                                    setIsRemarkModalOpen(true);
                                                }}
                                                title="Add/Edit Remark"
                                            />
                                            <FiEdit
                                                className="cursor-pointer text-zinc-500 hover:text-white transition-colors"
                                                onClick={() => {
                                                    setEditingAgent(agent);
                                                    setIsEditModalOpen(true);
                                                }}
                                                title="Edit Agent"
                                            />
                                            <FiTrash2
                                                className="cursor-pointer text-zinc-500 hover:text-red-500 transition-colors"
                                                onClick={() => handleDeleteAgent(agent._id)}
                                                title="Delete Agent"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={tableColumns.length} className="p-10 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-20">
                                        <FiUser size={40} />
                                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No agents found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Agent Modal */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0 ring-4 ring-zinc-900">
                                    {selectedAgent.agent_details?.profile_pic ? (
                                        <img
                                            src={selectedAgent.agent_details.profile_pic}
                                            alt={selectedAgent.agent_details.user_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-blue-500 uppercase font-black text-xl">
                                            {selectedAgent.agent_details?.user_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-zinc-100">{selectedAgent.agent_details?.user_name}</h2>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{selectedAgent.agent_role || "Agent"}</p>
                                    <p className="text-[9px] text-zinc-600 mt-1 font-mono uppercase tracking-tighter">ID: {selectedAgent._id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedAgent(null)} className="text-zinc-500 hover:text-white transition-colors">
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6 overflow-y-auto custom-scrollbar pr-1">
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Contact</p>
                                <p className="text-xs font-bold text-zinc-200">+{selectedAgent.agent_details?.phone_number}</p>
                                <p className="text-[10px] text-zinc-500 truncate">{selectedAgent.agent_details?.email}</p>
                            </div>
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Status</p>
                                <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${selectedAgent.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {selectedAgent.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Security PIN</p>
                                <p className="text-xs font-black text-blue-400 font-mono tracking-widest">{selectedAgent.agent_pin}</p>
                            </div>
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Total Leads</p>
                                <p className="text-xs font-black text-yellow-500">{selectedAgent.total_leads || 0} Items</p>
                            </div>
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Converted</p>
                                <p className="text-xs font-black text-emerald-500">{selectedAgent.total_converted_leads || 0} Deals</p>
                            </div>
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Follow-ups</p>
                                <p className="text-xs font-black text-blue-400">{selectedAgent.total_follow_ups || 0} Tasks</p>
                            </div>
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Pending</p>
                                <p className="text-xs font-black text-red-500">{selectedAgent.total_pending_leads || 0} Leads</p>
                            </div>
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Qualified</p>
                                <p className="text-xs font-black text-blue-500">{selectedAgent.total_qualified_leads || 0} Leads</p>
                            </div>
                            <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50 col-span-2">
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-black mb-1">Agent Remark</p>
                                <p className="text-xs text-zinc-400 italic">
                                    {selectedAgent.remark || "No remarks provided for this agent."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <PremiumButton text="Close Window" variant="secondary" onClick={() => setSelectedAgent(null)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddAgentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            <EditAgentModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingAgent(null);
                }}
                agent={editingAgent}
            />

            <AgentRemarkModal
                isOpen={isRemarkModalOpen}
                onClose={() => {
                    setIsRemarkModalOpen(false);
                    setRemarkingAgent(null);
                }}
                agent={remarkingAgent}
            />

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

        </AppLayout>
    );
};

export default Agents;
