import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import { 
    FiPlus, 
    FiSearch, 
    FiEdit, 
    FiTrash2, 
    FiEye, 
    FiPhone, 
    FiMail,
    FiMessageSquare,
    FiTrendingUp
} from "react-icons/fi";
import { MdOutlineFactCheck } from "react-icons/md";
import { PremiumButton } from "../component/common/PremiumButton";
import { PremiumToggle } from "../component/common/PremiumToggle";
import { CopyButton } from "../component/common/CopyButton";
import { SearchFilter } from "../component/common/SearchFilter";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import AddLeadModal from "../component/modal/AddLeadModal";
import EditLeadModal from "../component/modal/EditLeadModal";
import { PremiumTabs } from "../component/common/PremiumTabs";

/* ─── Initial Lead Data (25+ records) ─── */
const initialLeads = [
    { id: 1, name: "Arjun Khanna", phone: "9876543210", email: "arjun.k@example.com", requirement: "3BHK Flat", budget: "₹1.5Cr", source: "Facebook", assignedTo: "Rahul Sharma, Priya Verma", priority: "High", status: "New", date: "2026-03-01", clientType: "Buying" },
    { id: 2, name: "Sneha Patel", phone: "9898989898", email: "sneha.p@example.com", requirement: "Villa", budget: "₹4.2Cr", source: "Walk-in", assignedTo: "Priya Verma", priority: "High", status: "Follow-up", date: "2026-03-02", clientType: "Investing" },
    { id: 3, name: "Michael Smith", phone: "9771122334", email: "mike.s@example.com", requirement: "Office Space", budget: "₹85L", source: "Website", assignedTo: "Amit Patel, Neha Singh", priority: "Medium", status: "Closed", date: "2026-03-01", clientType: "Rent" },
    { id: 4, name: "Pooja Hegde", phone: "9988776655", email: "pooja.h@example.com", requirement: "1BHK Flat", budget: "₹45L", source: "Google Ads", assignedTo: "Neha Singh", priority: "Low", status: "Lost", date: "2026-02-28", clientType: "Buying" },
    { id: 5, name: "Vikram Rathore", phone: "9811223344", email: "vikram.r@example.com", requirement: "2BHK Flat", budget: "₹95L", source: "Instagram", assignedTo: "Vikas Gupta, Rahul Sharma", priority: "Medium", status: "New", date: "2026-03-03", clientType: "Buying" },
    { id: 6, name: "Ananya Roy", phone: "9998887776", email: "ananya.r@example.com", requirement: "Penthouse", budget: "₹6.5Cr", source: "Referral", assignedTo: "Rohit Jain", priority: "High", status: "Follow-up", date: "2026-03-02", clientType: "Buying" },
    { id: 7, name: "Suresh Raina", phone: "9887766554", email: "suresh.r@example.com", requirement: "Shops", budget: "₹2.1Cr", source: "Website", assignedTo: "Arjun Mehta", priority: "Medium", status: "New", date: "2026-03-04", clientType: "Investing" },
    { id: 8, name: "Kirti Sanon", phone: "9776655443", email: "kirti.s@example.com", requirement: "2BHK Flat", budget: "₹1.1Cr", source: "Facebook", assignedTo: "Karan Kapoor", priority: "Low", status: "Lost", date: "2026-03-01", clientType: "Rent" },
    { id: 9, name: "Sanjay Dutt", phone: "9865432100", email: "sanjay.d@example.com", requirement: "Farm House", budget: "₹8.0Cr", source: "Personal", assignedTo: "Sanjay Rao", priority: "High", status: "Follow-up", date: "2026-03-03", clientType: "Buying" },
    { id: 10, name: "David Warner", phone: "9754321098", email: "david.w@example.com", requirement: "Office", budget: "₹3.5Cr", source: "Google Ads", assignedTo: "Deepika Nair", priority: "High", status: "New", date: "2026-03-05", clientType: "Investing" },
    { id: 11, name: "Manish Paul", phone: "9643210987", email: "manish.p@example.com", requirement: "1BHK Flat", budget: "₹55L", source: "Walk-in", assignedTo: "Manish Tiwari", priority: "Low", status: "New", date: "2026-03-02", clientType: "Rent" },
    { id: 12, name: "Isha Ambani", phone: "9532109876", email: "isha.a@example.com", requirement: "Villa", budget: "₹15Cr", source: "Referral", assignedTo: "Pooja Deshmukh", priority: "High", status: "Follow-up", date: "2026-03-04", clientType: "Buying" },
    { id: 13, name: "Rishabh Pant", phone: "9421098765", email: "rishabh.p@example.com", requirement: "Plot", budget: "₹4.0Cr", source: "Instagram", assignedTo: "Raj Malhotra", priority: "Medium", status: "New", date: "2026-03-01", clientType: "Investing" },
    { id: 14, name: "Smriti Mandhana", phone: "9310987654", email: "smriti.m@example.com", requirement: "Studio Flat", budget: "₹65L", source: "Website", assignedTo: "Sneha Iyer", priority: "Medium", status: "Closed", date: "2026-03-02", clientType: "Rent" },
    { id: 15, name: "Hardik Pandya", phone: "9209876543", email: "hardik.p@example.com", requirement: "Land", budget: "₹2.5Cr", source: "Facebook", assignedTo: "Aakash Dubey", priority: "High", status: "New", date: "2026-03-05", clientType: "Investing" },
    { id: 16, name: "Tara Sutaria", phone: "9109876532", email: "tara.s@example.com", requirement: "2BHK Flat", budget: "₹1.3Cr", source: "Google Ads", assignedTo: "Kavita Reddy", priority: "Low", status: "Lost", date: "2026-03-01", clientType: "Buying" },
    { id: 17, name: "Varun Dhawan", phone: "9098765421", email: "varun.d@example.com", requirement: "Duplex", budget: "₹2.2Cr", source: "Walk-in", assignedTo: "Suresh Pandey", priority: "Medium", status: "Follow-up", date: "2026-03-03", clientType: "Investing" },
    { id: 18, name: "Kiara Advani", phone: "8987654310", email: "kiara.a@example.com", requirement: "3BHK Flat", budget: "₹1.8Cr", source: "Facebook", assignedTo: "Anita Bose", priority: "High", status: "New", date: "2026-03-04", clientType: "Buying" },
    { id: 19, name: "Ranbir Kapoor", phone: "8876543209", email: "ranbir.k@example.com", requirement: "Luxury Villa", budget: "₹12Cr", source: "Referral", assignedTo: "Vikram Chauhan", priority: "High", status: "Follow-up", date: "2026-03-02", clientType: "Buying" },
    { id: 20, name: "Alia Bhatt", phone: "8765432198", email: "alia.b@example.com", requirement: "Apartment", budget: "₹5.5Cr", source: "Personal", assignedTo: "Megha Kulkarni", priority: "High", status: "Closed", date: "2026-03-05", clientType: "Buying" },
    { id: 21, name: "KL Rahul", phone: "8654321097", email: "kl.r@example.com", requirement: "Office", budget: "₹1.2Cr", source: "Website", assignedTo: "Rahul Sharma", priority: "Medium", status: "New", date: "2026-03-04", clientType: "Investing" },
    { id: 22, name: "Shikhar Dhawan", phone: "8543210986", email: "shikhar.d@example.com", requirement: "Plot", budget: "₹1.5Cr", source: "Walk-in", assignedTo: "Priya Verma", priority: "Low", status: "New", date: "2026-03-03", clientType: "Rent" },
    { id: 23, name: "Jasprit Bumrah", phone: "8432109875", email: "jasprit.b@example.com", requirement: "Villa", budget: "₹3.8Cr", source: "Facebook", assignedTo: "Amit Patel", priority: "High", status: "Follow-up", date: "2026-03-02", clientType: "Investing" },
    { id: 24, name: "Mithali Raj", phone: "8321098764", email: "mithali.r@example.com", requirement: "Farm Land", budget: "₹90L", source: "Referral", assignedTo: "Neha Singh", priority: "Medium", status: "New", date: "2026-03-01", clientType: "Investing" },
    { id: 25, name: "PV Sindhu", phone: "8210987653", email: "pv.s@example.com", requirement: "2BHK Flat", budget: "₹1.15Cr", source: "Google Ads", assignedTo: "Vikas Gupta", priority: "Medium", status: "Follow-up", date: "2026-03-05", clientType: "Buying" },
];

/* ─── Table Columns ─── */
const tableColumns = ["#", "Lead Info", "Contact", "Requirement", "Budget", "Inquiry For", "Source", "Assigned To", "Priority", "Status", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = ["All", "New", "Follow-up", "Closed", "Lost", "Wasted"];
const priorityOptions = ["All", "High", "Medium", "Low"];

const LeadsPage = () => {
    const [leads, setLeads] = useState(initialLeads);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [selectedLead, setSelectedLead] = useState(null);

    /* ─── Refresh Handler ─── */
    const handleRefresh = () => {
        setLeads(initialLeads);
        setSearch("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setPage(1);
    };

    /* ─── CRUD Handlers ─── */
    const handleAddLead = (newLeadData) => {
        const newLead = {
            id: Date.now(),
            ...newLeadData,
            status: "New",
            date: new Date().toISOString().split('T')[0]
        };
        setLeads(prev => [newLead, ...prev]);
        setIsAddModalOpen(false);
    };

    const handleUpdateLead = (updatedLead) => {
        setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        setIsEditModalOpen(false);
        setEditingLead(null);
    };

    const handleDeleteLead = (id) => {
        if (window.confirm("Are you sure you want to delete this lead?")) {
            setLeads(prev => prev.filter(l => l.id !== id));
        }
    };

    const handleUpdateField = (id, field, value) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    /* ─── Filters & Search ─── */
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = 
            lead.name.toLowerCase().includes(search.toLowerCase()) ||
            lead.phone.includes(search) ||
            lead.requirement.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
        const matchesPriority = priorityFilter === "All" || lead.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    /* ─── Pagination Logic ─── */
    const totalPages = Math.ceil(filteredLeads.length / rowsPerPage);
    const paginatedLeads = filteredLeads.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    /* ─── Style Helpers ─── */
    const getPriorityColor = (priority) => {
        switch (priority) {
            case "High": return "bg-red-500/10 text-red-500 border-red-500/20";
            case "Medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "Low": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "New": return "text-blue-400";
            case "Follow-up": return "text-orange-400";
            case "Closed": return "text-green-400";
            case "Lost": return "text-red-400";
            case "Wasted": return "text-purple-400";
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
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Closed Deals</p>
                        <h3 className="text-xl font-black text-white">{leads.filter(l => l.status === "Closed").length}</h3>
                    </div>
                </div>
                
                <div className="flex-1 min-w-[280px] bg-zinc-950/40 border border-blue-500/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                        <MdOutlineFactCheck size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Active Requirements</p>
                        <h3 className="text-xl font-black text-white">{leads.filter(l => l.status !== "Lost" && l.status !== "Closed" && l.status !== "Wasted").length}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[280px] bg-zinc-950/40 border border-orange-500/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl flex items-center justify-center">
                        <FiMessageSquare size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Pending Action</p>
                        <h3 className="text-xl font-black text-white">{leads.filter(l => l.status === "New" || l.status === "Follow-up").length}</h3>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center gap-6 shadow-xl">
                <div className="flex-1">
                    <SearchFilter 
                        searchValue={search}
                        onSearchChange={(e) => setSearch(e.target.value)}
                        searchPlaceholder="Search leads by name, phone or requirement..."
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-6 lg:gap-8 lg:w-fit">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-fit">Status:</span>
                        <div className="flex-1 sm:w-[400px]">
                            <PremiumTabs 
                                options={statusOptions}
                                value={statusFilter}
                                onChange={(val) => { setStatusFilter(val); setPage(1); }}
                                showLabel={false}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-fit">Priority:</span>
                        <div className="flex-1 sm:w-[300px]">
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

            {/* Leads Table */}
            <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                                {tableColumns.map((col, idx) => (
                                    <th key={idx} className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {paginatedLeads.map((lead, index) => (
                                <tr 
                                    key={lead.id} 
                                    className={`group hover:bg-zinc-900/50 transition-all duration-200 ${
                                        lead.status === "Wasted" ? "opacity-50 grayscale-[0.3]" : ""
                                    }`}
                                >
                                    <td className="p-4 text-xs font-bold text-zinc-600">
                                        #{(page - 1) * rowsPerPage + index + 1}
                                    </td>
                                    
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-semibold text-white group-hover:text-blue-400 transition-colors ${
                                                lead.status === "Wasted" ? "line-through" : ""
                                            }`}>
                                                {lead.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-medium">
                                                Created: {lead.date}
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
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                                                    <FiMail size={12} />
                                                </div>
                                                <button className="text-[11px] text-zinc-400 hover:text-blue-400 truncate max-w-[140px]">
                                                    {lead.email}
                                                </button>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4 text-xs font-medium text-zinc-300">
                                        <div className={`flex items-center gap-2 max-w-[180px] ${
                                            lead.status === "Wasted" ? "line-through text-zinc-600" : ""
                                        }`} title={lead.requirement}>
                                            <MdOutlineFactCheck size={14} className={`shrink-0 ${lead.status === "Wasted" ? "text-zinc-600" : "text-blue-400"}`} />
                                            <span className="truncate">{lead.requirement}</span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span className={`text-sm font-black text-white px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg ${
                                            lead.status === "Wasted" ? "line-through text-zinc-600 border-zinc-900 opacity-60" : ""
                                        }`}>
                                            {lead.budget}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <div className={`flex items-center gap-1.5 ${lead.status === "Wasted" ? "opacity-40" : ""}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                lead.clientType === "Rent" ? "bg-amber-400" :
                                                lead.clientType === "Buying" ? "bg-emerald-400" :
                                                "bg-indigo-400"
                                            }`} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                                {lead.clientType || "Buying"}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800">
                                            {lead.source}
                                        </span>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center group/agents relative min-w-[120px]" title={lead.assignedTo}>
                                            <div className="flex -space-x-2 mr-2">
                                                {lead.assignedTo.split(", ").map((agent, i) => (
                                                    <div 
                                                        key={i}
                                                        className={`w-7 h-7 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold transition-transform group-hover/agents:translate-x-1 ${
                                                            i % 3 === 0 ? "bg-blue-600 text-white" :
                                                            i % 3 === 1 ? "bg-indigo-600 text-white" :
                                                            "bg-violet-600 text-white"
                                                        }`}
                                                        style={{ zIndex: 10 - i }}
                                                    >
                                                        {agent.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[11px] font-semibold text-zinc-300 truncate max-w-[80px]">
                                                {lead.assignedTo}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4 relative">
                                        <select
                                            value={lead.priority}
                                            onChange={(e) => handleUpdateField(lead.id, 'priority', e.target.value)}
                                            className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getPriorityColor(lead.priority)} uppercase tracking-widest bg-zinc-950/20 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all appearance-none text-center min-w-[80px]`}
                                        >
                                            <option value="High" className="bg-zinc-900 text-red-500">HIGH</option>
                                            <option value="Medium" className="bg-zinc-900 text-yellow-500">MEDIUM</option>
                                            <option value="Low" className="bg-zinc-900 text-blue-500">LOW</option>
                                        </select>
                                    </td>

                                    <td className="p-4">
                                        <div className={`flex items-center gap-2 group/status`}>
                                            <div className={`w-2 h-2 rounded-full ${
                                                lead.status === "Closed" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : 
                                                lead.status === "Follow-up" ? "bg-orange-500" :
                                                lead.status === "Lost" ? "bg-red-500" : 
                                                lead.status === "Wasted" ? "bg-purple-500" : "bg-blue-500"
                                            }`} />
                                            <select
                                                value={lead.status}
                                                onChange={(e) => handleUpdateField(lead.id, 'status', e.target.value)}
                                                className={`text-xs font-bold bg-transparent cursor-pointer focus:outline-none hover:bg-zinc-800/50 px-1 rounded transition-colors appearance-none ${getStatusColor(lead.status)}`}
                                            >
                                                {statusOptions.slice(1).map(s => (
                                                    <option key={s} value={s} className="bg-zinc-900 text-zinc-300">{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 cursor-pointer transition-all">
                                                <FiEye size={16} />
                                            </div>
                                            <div 
                                                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:border-blue-400/30 cursor-pointer transition-all"
                                                onClick={() => {
                                                    setEditingLead(lead);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <FiEdit size={16} />
                                            </div>
                                            <div 
                                                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-400/30 cursor-pointer transition-all"
                                                onClick={() => handleDeleteLead(lead.id)}
                                            >
                                                <FiTrash2 size={16} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Section */}
                <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/10">
                    <Pagination 
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(val) => { setRowsPerPage(val); setPage(1); }}
                    />
                </div>
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
            
            
        </AppLayout>
    );
};

export default LeadsPage;
