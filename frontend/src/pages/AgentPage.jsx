import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { FiEdit, FiEye, FiTrash2 } from "react-icons/fi";
import { PremiumButton } from "../component/common/PremiumButton";
import { PremiumToggle } from "../component/common/PremiumToggle";
import { CopyButton } from "../component/common/CopyButton";
import { SearchFilter } from "../component/common/SearchFilter";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import AddAgentModal from "../component/modal/AddAgentModal";
import EditAgentModal from "../component/modal/EditAgentModal";
import { PremiumTabs } from "../component/common/PremiumTabs";

/* ─── Initial Agent Data (20 agents) ─── */
const initialAgents = [
    { id: 1, name: "Rahul Sharma", role: "Senior Agent", phone: "9876543210", email: "rahul.sharma@example.com", pin: "1234", leads: 32, deals: 12, pending: 5, status: true, remark: "Top performer this quarter, exceeded all targets comfortably.", image: "https://i.pravatar.cc/150?u=1", assignedProperties: ["1bhk", "2bhk", "villa"] },
    { id: 2, name: "Priya Verma", role: "Rental Specialist", phone: "9898989898", email: "priya.verma@example.com", pin: "5678", leads: 21, deals: 9, pending: 3, status: true, remark: "Specializes in commercial real estate and high-value properties.", image: "https://i.pravatar.cc/150?u=2", assignedProperties: ["office", "shop"] },
    { id: 3, name: "Amit Patel", role: "Sales Executive", phone: "9871122334", email: "amit.patel@example.com", pin: "9012", leads: 18, deals: 7, pending: 4, status: false, remark: "On leave till March due to personal reasons, files handed over.", image: "https://i.pravatar.cc/150?u=3", assignedProperties: [] },
    { id: 4, name: "Neha Singh", role: "Junior Agent", phone: "9988776655", email: "neha.singh@example.com", pin: "3456", leads: 14, deals: 5, pending: 2, status: true, remark: "Handling premium clients in the south zone with great feedback.", image: "https://i.pravatar.cc/150?u=4", assignedProperties: ["1bhk", "plot"] },
    { id: 5, name: "Vikas Gupta", role: "Trainer", phone: "9811223344", email: "vikas.gupta@example.com", pin: "7890", leads: 12, deals: 3, pending: 6, status: false, remark: "Training new agents on CRM tools and lead management flow.", image: "https://i.pravatar.cc/150?u=5", assignedProperties: ["office"] },
    { id: 6, name: "Rohit Jain", role: "Broker", phone: "9998887776", email: "rohit.jain@example.com", pin: "2345", leads: 22, deals: 8, pending: 1, status: true, remark: "Residential expert with deep knowledge of the western suburbs.", image: "https://i.pravatar.cc/150?u=6", assignedProperties: ["2bhk", "3bhk", "villa"] },
    { id: 7, name: "Arjun Mehta", role: "Field Agent", phone: "9887766554", email: "arjun.mehta@example.com", pin: "6789", leads: 10, deals: 2, pending: 3, status: true, remark: "New joinee, shows great promise in negotiation skills.", image: "https://i.pravatar.cc/150?u=7", assignedProperties: ["1bhk"] },
    { id: 8, name: "Karan Kapoor", role: "Consultant", phone: "9776655443", email: "karan.kapoor@example.com", pin: "0123", leads: 16, deals: 4, pending: 7, status: false, remark: "Pending performance review for the last six months.", image: "https://i.pravatar.cc/150?u=8", assignedProperties: ["plot", "shop"] },
    { id: 9, name: "Sanjay Rao", role: "Senior Consultant", phone: "9865432100", email: "sanjay.rao@example.com", pin: "4567", leads: 25, deals: 10, pending: 2, status: true, remark: "Consistent closer, very reliable for high-pressure deals.", image: "https://i.pravatar.cc/150?u=9", assignedProperties: ["villa", "office", "3bhk"] },
    { id: 10, name: "Deepika Nair", role: "Zone Manager", phone: "9754321098", email: "deepika.nair@example.com", pin: "8901", leads: 19, deals: 6, pending: 5, status: true, remark: "South zone specialist with strong local connections.", image: "https://i.pravatar.cc/150?u=10", assignedProperties: ["2bhk", "shop"] },
    { id: 11, name: "Manish Tiwari", role: "Trainee", phone: "9643210987", email: "manish.tiwari@example.com", pin: "2346", leads: 8, deals: 1, pending: 4, status: false, remark: "Needs mentorship and more field experience.", image: "https://i.pravatar.cc/150?u=11", assignedProperties: [] },
    { id: 12, name: "Pooja Deshmukh", role: "Lead Generator", phone: "9532109876", email: "pooja.deshmukh@example.com", pin: "6780", leads: 27, deals: 11, pending: 3, status: true, remark: "Best in follow-ups, never misses a lead callback.", image: "https://i.pravatar.cc/150?u=12", assignedProperties: ["1bhk", "2bhk"] },
    { id: 13, name: "Raj Malhotra", role: "Luxury Agent", phone: "9421098765", email: "raj.malhotra@example.com", pin: "1235", leads: 15, deals: 5, pending: 6, status: true, remark: "Luxury segment focus, transitioning to high-end villas.", image: "https://i.pravatar.cc/150?u=13", assignedProperties: ["villa"] },
    { id: 14, name: "Sneha Iyer", role: "Relations Manager", phone: "9310987654", email: "sneha.iyer@example.com", pin: "5679", leads: 20, deals: 8, pending: 1, status: true, remark: "Excellent client rapport, often gets referrals.", image: "https://i.pravatar.cc/150?u=14", assignedProperties: ["1bhk", "3bhk"] },
    { id: 15, name: "Aakash Dubey", role: "Valuator", phone: "9209876543", email: "aakash.dubey@example.com", pin: "9013", leads: 11, deals: 3, pending: 8, status: false, remark: "Reassigned to new zone after territory restructuring.", image: "https://i.pravatar.cc/150?u=15", assignedProperties: ["plot"] },
    { id: 16, name: "Kavita Reddy", role: "Marketing Head", phone: "9109876532", email: "kavita.reddy@example.com", pin: "3457", leads: 24, deals: 9, pending: 2, status: true, remark: "Award winner Q4 for highest customer satisfaction.", image: "https://i.pravatar.cc/150?u=16", assignedProperties: ["1bhk", "shop", "office"] },
    { id: 17, name: "Suresh Pandey", role: "Advisory", phone: "9098765421", email: "suresh.pandey@example.com", pin: "7891", leads: 13, deals: 4, pending: 5, status: false, remark: "Part-time availability on weekends only.", image: "https://i.pravatar.cc/150?u=17", assignedProperties: ["plot"] },
    { id: 18, name: "Anita Bose", role: "Negotiator", phone: "8987654310", email: "anita.bose@example.com", pin: "2347", leads: 17, deals: 6, pending: 3, status: true, remark: "East zone lead with a focus on affordable housing.", image: "https://i.pravatar.cc/150?u=18", assignedProperties: ["1bhk", "2bhk"] },
    { id: 19, name: "Vikram Chauhan", role: "Intern", phone: "8876543209", email: "vikram.chauhan@example.com", pin: "6781", leads: 9, deals: 2, pending: 4, status: true, remark: "Fast learner, moving quickly through the training module.", image: "https://i.pravatar.cc/150?u=19", assignedProperties: ["villa"] },
    { id: 20, name: "Megha Kulkarni", role: "Strategy Lead", phone: "8765432198", email: "megha.kulkarni@example.com", pin: "1236", leads: 23, deals: 10, pending: 1, status: true, remark: "Highest conversion rate in the team for the last month.", image: "https://i.pravatar.cc/150?u=20", assignedProperties: ["3bhk", "shop"] },
];

/* ─── Table Column Definitions ─── */
const tableColumns = ["#", "Agent", "Contact", "Pin", "Projects", "Leads", "Deals", "Pending", "Status", "Remark", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = ["All", "Active", "Inactive"];

const Agents = () => {

    const [agents, setAgents] = useState(initialAgents);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [selectedAgent, setSelectedAgent] = useState(null); // For View Popup
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // For Add Agent Popup
    const [editingAgent, setEditingAgent] = useState(null); // For Edit Agent Popup
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // For Edit Agent Popup

    const [rowsPerPage, setRowsPerPage] = useState(15);

    /* ─── Rows Per Page Change ─── */
    const handleRowsPerPageChange = (value) => {
        setRowsPerPage(value);
        setPage(1);
    };

    /* ─── Toggle Agent Status ─── */
    const toggleStatus = (id) => {
        setAgents((prev) =>
            prev.map((agent) =>
                agent.id === id ? { ...agent, status: !agent.status } : agent
            )
        );
    };

    /* ─── Delete Agent ─── */
    const deleteAgent = (id) => {
        setAgents((prev) => prev.filter((agent) => agent.id !== id));
    };

    /* ─── Refresh — Reset to initial data ─── */
    const handleRefresh = () => {
        setAgents(initialAgents);
        setSearch("");
        setStatusFilter("All");
        setPage(1);
    };

    /* ─── Add New Agent ─── */
    const handleAddAgent = (newAgentData) => {
        const newAgent = {
            id: agents.length + 1,
            ...newAgentData,
            leads: 0,
            deals: 0,
            pending: 0,
            status: true,
            remark: "Newly added agent.",
            pin: newAgentData.pin || "0000"
        };
        setAgents((prev) => [newAgent, ...prev]);
        setIsAddModalOpen(false);
    };

    /* ─── Update Agent ─── */
    const handleUpdateAgent = (updatedAgent) => {
        setAgents((prev) => prev.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)));
        setIsEditModalOpen(false);
        setEditingAgent(null);
    };

    /* ─── Filter + Search ─── */
    const filteredAgents = agents.filter((agent) => {
        const matchesSearch =
            agent.name.toLowerCase().includes(search.toLowerCase()) ||
            agent.phone.includes(search) ||
            agent.remark.toLowerCase().includes(search.toLowerCase());

        const matchesStatus =
            statusFilter === "All" ||
            (statusFilter === "Active" && agent.status) ||
            (statusFilter === "Inactive" && !agent.status);

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

    return (
        <AppLayout>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Agents</h1>

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={handleRefresh} />

                    <div className="w-auto">
                        <PremiumButton
                            text="Add Agent"
                            variant="secondary"
                            onClick={() => setIsAddModalOpen(true)}
                        />
                    </div>
                </div>
            </div>

            {/* ── Search + Filter ── */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/50">
                <div className="flex-1">
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={handleSearchChange}
                        searchPlaceholder="Search by name, phone, remark..."
                    />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-fit">Status:</span>
                    <div className="flex-1 sm:min-w-[250px]">
                        <div className="sm:hidden">
                            <select
                                value={statusFilter}
                                onChange={(e) => handleFilterChange(e.target.value)}
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
                                onChange={handleFilterChange}
                                showLabel={false}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto bg-zinc-950 border border-zinc-800 rounded-lg">

                <table className="w-full text-sm">

                    {/* Table Header via .map() */}
                    <thead className="border-b border-zinc-800 text-zinc-400">
                        <tr>
                            {tableColumns.map((col) => (
                                <th key={col} className="text-left p-3 uppercase">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>

                        {paginatedAgents.map((agent) => (

                            <tr
                                key={agent.id}
                                className="border-b border-zinc-800 hover:bg-zinc-900"
                            >
                                <td className="p-3">{agent.id}</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
                                            {agent.image ? (
                                                <img
                                                    src={typeof agent.image === 'string' ? agent.image : URL.createObjectURL(agent.image)}
                                                    alt={agent.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-500 uppercase font-bold text-xs">
                                                    {agent.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-zinc-100">{agent.name}</span>
                                            <span className="text-[11px] text-zinc-500">{agent.role || "Agent"}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3 min-w-[150px]">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-100">+91 {agent.phone}</span>
                                        <span className="text-xs text-zinc-500">{agent.email}</span>
                                    </div>
                                </td>

                                {/* Pin — CopyButton common component */}
                                <td className="p-3">
                                    <CopyButton text={agent.pin} />
                                </td>

                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                                            {(agent.assignedProperties || []).length}
                                        </div>
                                        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Items</span>
                                    </div>
                                </td>

                                <td className="p-3 text-yellow-500 font-bold">{agent.leads}</td>
                                <td className="p-3 text-green-500 font-bold">{agent.deals}</td>
                                <td className="p-3 text-red-500 font-bold">{agent.pending}</td>

                                {/* Status — PremiumToggle common component */}
                                <td className="p-3">
                                    <PremiumToggle
                                        enabled={agent.status}
                                        onChange={() => toggleStatus(agent.id)}
                                    />
                                </td>

                                <td className="p-3 text-zinc-400 max-w-[150px]">
                                    <p className="truncate cursor-default" title={agent.remark}>
                                        {agent.remark}
                                    </p>
                                </td>

                                {/* Actions — View, Edit, Delete */}
                                <td className="p-3">
                                    <div className="flex gap-3">
                                        <FiEye
                                            className="cursor-pointer text-zinc-400 hover:text-white transition-colors"
                                            onClick={() => setSelectedAgent(agent)}
                                        />
                                        <FiEdit 
                                            className="cursor-pointer text-zinc-400 hover:text-white transition-colors" 
                                            onClick={() => {
                                                setEditingAgent(agent);
                                                setIsEditModalOpen(true);
                                            }}
                                        />
                                        <FiTrash2
                                            className="cursor-pointer text-zinc-400 hover:text-red-400 transition-colors"
                                            onClick={() => deleteAgent(agent.id)}
                                        />
                                    </div>
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* ── Pagination (Common Component) ── */}
            {/* ── View Agent Modal ── */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                                    {selectedAgent.image ? (
                                        <img
                                            src={typeof selectedAgent.image === 'string' ? selectedAgent.image : URL.createObjectURL(selectedAgent.image)}
                                            alt={selectedAgent.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-500 uppercase font-bold text-xl">
                                            {selectedAgent.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-100">{selectedAgent.name}</h2>
                                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{selectedAgent.role || "Agent"}</p>
                                    <p className="text-[10px] text-zinc-600 mt-1">Agent ID: #{selectedAgent.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAgent(null)}
                                className="text-zinc-500 hover:text-white text-2xl leading-none"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Contact</p>
                                <p className="text-sm">+91 {selectedAgent.phone}</p>
                                <p className="text-xs text-zinc-500">{selectedAgent.email}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Status</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedAgent.status ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {selectedAgent.status ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Assigned Projects</p>
                                <p className="text-sm font-bold text-blue-400">
                                    {(selectedAgent.assignedProperties || []).length} Properties
                                </p>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Leads / Deals</p>
                                <p className="text-sm font-semibold">{selectedAgent.leads} / {selectedAgent.deals}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Pending Task</p>
                                <p className="text-sm font-semibold text-yellow-500">{selectedAgent.pending}</p>
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Internal Remark</p>
                            <p className="text-sm text-zinc-300 italic leading-relaxed">
                                "{selectedAgent.remark}"
                            </p>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setSelectedAgent(null)}
                                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Agent Modal ── */}
            <AddAgentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddAgent}
            />

            {/* ── Edit Agent Modal ── */}
            <EditAgentModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingAgent(null);
                }} 
                onUpdate={handleUpdateAgent} 
                agent={editingAgent}
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
