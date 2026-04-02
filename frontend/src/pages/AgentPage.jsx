import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { FiEdit, FiEye, FiTrash2, FiUser, FiX, FiSearch, FiMessageSquare } from "react-icons/fi";
import { CopyButton } from "../component/common/CopyButton";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import { SearchFilter } from "../component/common/SearchFilter";
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

    const [rowsPerPage, setRowsPerPage] = useState(10);

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
    const totalPages = Math.ceil(filteredAgents.length / rowsPerPage) || 1;

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

    return (
        <AppLayout>

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Agents</h2>
                    <p className="text-sm text-zinc-400">Manage your team and track their performance</p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={handleRefresh} isRefreshing={isLoading} />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded flex items-center gap-2 transition-colors"
                    >
                        <FiUser size={16} /> Add Agent
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="border border-zinc-800 rounded p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 max-w-lg">
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={(e) => handleSearchChange(e.target.value)}
                        searchPlaceholder="Search by name, phone, email..."
                    />
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-400">Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none cursor-pointer"
                    >
                        {statusOptions.map(opt => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Agents Table */}
            <div className="border border-zinc-800 rounded overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-zinc-400 text-sm">Loading agents data...</div>
                    ) : filteredAgents.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">No agents found matching your criteria.</div>
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
                            {paginatedAgents.map((agent, index) => {
                                const details = agent.agent_details || {};
                                const isInactive = !agent.is_active;
                                return (
                                <tr
                                    key={agent._id}
                                    className={`${isInactive ? "opacity-60 bg-zinc-900/40" : ""}`}
                                >
                                    <td className="p-3 text-zinc-500">
                                        {(page - 1) * rowsPerPage + index + 1}
                                    </td>
                                    
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center font-medium text-zinc-300 overflow-hidden shrink-0">
                                                {details.profile_pic ? (
                                                    <img src={details.profile_pic} alt={details.user_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    (details.user_name || "A").charAt(0)
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${isInactive ? "text-zinc-500" : "text-zinc-100"}`}>{details.user_name}</span>
                                                <span className="text-xs text-zinc-500 capitalize">{agent.agent_role || "Agent"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="p-3">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <CopyButton text={details.phone_number} />
                                            </div>
                                            <span className="text-xs text-zinc-500 truncate max-w-[140px]" title={details.email}>{details.email}</span>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        {agent.assigned_properties?.length || 0}
                                    </td>

                                    <td className="p-3 font-medium text-yellow-500">{agent.total_leads || 0}</td>
                                    <td className="p-3 font-medium text-emerald-500">{agent.total_converted_leads || 0}</td>
                                    
                                    <td className="p-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={agent.is_active}
                                                onChange={() => toggleStatus(agent._id, agent.is_active)}
                                            />
                                            <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-gray-500 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
                                        </label>
                                    </td>

                                    <td className="p-3">
                                        <div className="max-w-[150px] truncate" title={agent.remark}>
                                            <span className="text-xs text-zinc-500 italic">
                                                {agent.remark || "-"}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="text-zinc-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-white transition-colors"
                                                onClick={() => setSelectedAgent(agent)}
                                                title="View Profile"
                                            >
                                                <FiEye size={14} />
                                            </button>
                                            <button
                                                className="text-indigo-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-indigo-300 transition-colors"
                                                onClick={() => {
                                                    setRemarkingAgent(agent);
                                                    setIsRemarkModalOpen(true);
                                                }}
                                                title="Add/Edit Remark"
                                            >
                                                <FiMessageSquare size={14} />
                                            </button>
                                            <button
                                                className="text-yellow-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-yellow-300 transition-colors"
                                                onClick={() => {
                                                    setEditingAgent(agent);
                                                    setIsEditModalOpen(true);
                                                }}
                                                title="Edit Agent"
                                            >
                                                <FiEdit size={14} />
                                            </button>
                                            <button
                                                className="text-red-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-red-300 transition-colors"
                                                onClick={() => handleDeleteAgent(agent._id)}
                                                title="Delete Agent"
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
                {filteredAgents.length > 0 && (
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 mt-auto">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleRowsPerPageChange}
                    />
                </div>
                )}
            </div>

            {/* View Agent Modal */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                            <h2 className="text-xl font-medium text-white">Agent Profile</h2>
                            <button onClick={() => setSelectedAgent(null)} className="text-zinc-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800">
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-zinc-800/50">
                                <div className="w-20 h-20 rounded bg-zinc-800 flex items-center justify-center font-medium text-zinc-300 text-2xl overflow-hidden shrink-0">
                                    {selectedAgent.agent_details?.profile_pic ? (
                                        <img src={selectedAgent.agent_details.profile_pic} alt={selectedAgent.agent_details.user_name} className="w-full h-full object-cover" />
                                    ) : (
                                        (selectedAgent.agent_details?.user_name || "A").charAt(0)
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-medium text-white">{selectedAgent.agent_details?.user_name}</h2>
                                    <p className="text-sm text-zinc-400 capitalize mb-1">{selectedAgent.agent_role || "Agent"}</p>
                                    <div className="flex gap-2 text-xs">
                                        <span className={`px-2 py-0.5 rounded border ${selectedAgent.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                            {selectedAgent.is_active ? 'Active Status' : 'Inactive Status'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded">
                                    <p className="text-xs text-zinc-500 mb-1">Contact Phone</p>
                                    <p className="text-sm font-medium text-white">+{selectedAgent.agent_details?.phone_number}</p>
                                </div>
                                <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded">
                                    <p className="text-xs text-zinc-500 mb-1">Email Address</p>
                                    <p className="text-sm font-medium text-white truncate">{selectedAgent.agent_details?.email}</p>
                                </div>
                                <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded">
                                    <p className="text-xs text-zinc-500 mb-1">Security PIN</p>
                                    <p className="text-sm font-mono text-yellow-400 font-bold">{selectedAgent.agent_pin}</p>
                                </div>
                                <div className="border border-zinc-800 bg-zinc-950/20 p-4 rounded">
                                    <p className="text-xs text-zinc-500 mb-1">System ID</p>
                                    <p className="text-xs font-mono text-zinc-300 truncate">{selectedAgent._id}</p>
                                </div>
                            </div>

                            <h3 className="text-sm font-medium text-zinc-300 mt-8 mb-4">Performance Metrics</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="border border-zinc-800 bg-zinc-900/30 p-4 rounded text-center">
                                    <p className="text-xl font-medium text-yellow-500 mb-1">{selectedAgent.total_leads || 0}</p>
                                    <p className="text-xs text-zinc-500">Total Leads</p>
                                </div>
                                <div className="border border-zinc-800 bg-zinc-900/30 p-4 rounded text-center">
                                    <p className="text-xl font-medium text-yellow-400 mb-1">{selectedAgent.total_follow_ups || 0}</p>
                                    <p className="text-xs text-zinc-500">Follow-ups</p>
                                </div>
                                <div className="border border-zinc-800 bg-zinc-900/30 p-4 rounded text-center">
                                    <p className="text-xl font-medium text-emerald-500 mb-1">{selectedAgent.total_converted_leads || 0}</p>
                                    <p className="text-xs text-zinc-500">Converted Deals</p>
                                </div>
                            </div>

                            {selectedAgent.remark && (
                                <div className="mt-6 border border-zinc-800 bg-zinc-950/20 p-4 rounded">
                                    <p className="text-xs text-zinc-500 mb-2">Internal Remark</p>
                                    <p className="text-sm text-zinc-300 italic">"{selectedAgent.remark}"</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-zinc-800 bg-zinc-900 flex justify-end">
                            <button onClick={() => setSelectedAgent(null)} className="px-5 py-2 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700">
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals - Conditionally rendered to prevent background API calls */}
            {isAddModalOpen && (
                <AddAgentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                />
            )}

            {isEditModalOpen && (
                <EditAgentModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingAgent(null);
                    }}
                    agent={editingAgent}
                />
            )}

            {isRemarkModalOpen && (
                <AgentRemarkModal
                    isOpen={isRemarkModalOpen}
                    onClose={() => {
                        setIsRemarkModalOpen(false);
                        setRemarkingAgent(null);
                    }}
                    agent={remarkingAgent}
                />
            )}

        </AppLayout>
    );
};

export default Agents;
