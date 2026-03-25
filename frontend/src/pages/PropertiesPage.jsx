import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../component/layout/AppLayout";
import {
    FiPlus,
    FiSearch,
    FiEdit,
    FiTrash2,
    FiEye,
    FiMapPin,
    FiHome,
    FiTrendingUp,
    FiUser,
    FiLoader
} from "react-icons/fi";
import { PremiumButton } from "../component/common/PremiumButton";
import { PremiumToggle } from "../component/common/PremiumToggle";
import { CopyButton } from "../component/common/CopyButton";
import { SearchFilter } from "../component/common/SearchFilter";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import { PremiumTabs } from "../component/common/PremiumTabs";
import AddPropertiesModel from "../component/modal/AddPropertiesModel";
import EditPropertiesModel from "../component/modal/EditPropertiesModel";
import { useProperties, useUpdatePropertyStatus, useDeleteProperty } from "../hooks/usePropertyHooks";

/* ─── Table Columns ─── */
const tableColumns = ["#", "Property Info", "Type", "Price", "Location", "Specifications", "Agent", "Status", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = ["All", "available", "under_offer", "sold", "rented", "inactive"];
const typeOptions = ["All", "Apartment", "Villa", "Office", "Plot", "Warehouse", "Studio", "Penthouse"];

const PropertiesPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);

    // Prepare filters for API
    const filters = useMemo(() => {
        const params = { page, limit };
        if (search) params.search = search;
        if (statusFilter !== "All") params.property_status = statusFilter;
        if (typeFilter !== "All") params.property_type = typeFilter;
        return params;
    }, [page, limit, search, statusFilter, typeFilter]);

    const { data: propertiesData, isLoading, refetch, isFetching } = useProperties(filters);
    const updateStatusMutation = useUpdatePropertyStatus();
    const deleteMutation = useDeleteProperty();

    const properties = propertiesData?.data || [];
    const pagination = propertiesData?.pagination || { total: 0, pages: 1 };

    /* ─── Refresh Handler ─── */
    const handleRefresh = () => {
        setSearch("");
        setStatusFilter("All");
        setTypeFilter("All");
        setPage(1);
        refetch();
    };

    /* ─── CRUD Handlers ─── */
    const handleDeleteProperty = async (id) => {
        if (window.confirm("Are you sure you want to permanently delete this property?")) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleUpdateStatus = (id, status) => {
        updateStatusMutation.mutate({ id, statusData: { property_status: status } });
    };

    const handleViewProperty = (id) => {
        navigate(`/properties/${id}`);
    };

    /* ─── Style Helpers ─── */
    const getStatusColor = (status) => {
        switch (status) {
            case "available": return "text-emerald-400";
            case "inactive": return "text-zinc-500";
            case "sold": return "text-blue-400";
            case "under_offer": return "text-orange-400";
            case "rented": return "text-violet-400";
            default: return "text-zinc-500";
        }
    };

    const formatPrice = (price, currency) => {
        if (!price) return "TBD";
        if (currency === "INR") {
            if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
            if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
            return `₹${Number(price).toLocaleString()}`;
        }
        return `${currency || "USD"} ${Number(price).toLocaleString()}`;
    };

    return (
        <AppLayout>
            {/* Minimalist Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pt-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-light text-white tracking-tight">Property Inventory</h2>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-[0.2em] opacity-80">Real-time listing management</p>
                </div>

                <div className="flex items-center gap-4">
                    <RefreshButton onClick={handleRefresh} isRefreshing={isFetching} />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-zinc-100 hover:bg-white text-black text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full transition-all shadow-lg hover:shadow-white/5 active:scale-95 flex items-center gap-2"
                    >
                        <FiPlus size={14} /> Add Property
                    </button>
                </div>
            </div>

            {/* Minimalist Filters Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
                <div className="flex-1 relative group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search listings..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full bg-zinc-900/50 border border-zinc-800 text-sm py-3 pl-12 pr-4 rounded-2xl focus:outline-none focus:border-zinc-700 focus:bg-zinc-900 transition-all placeholder:text-zinc-600"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-2xl focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer hover:bg-zinc-900 transition-all min-w-[120px]"
                    >
                        <option value="All">All Types</option>
                        {typeOptions.slice(1).map(opt => (
                            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="bg-zinc-900/50 border border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-2xl focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer hover:bg-zinc-900 transition-all min-w-[120px]"
                    >
                        <option value="All">All Status</option>
                        {statusOptions.slice(1).map(opt => (
                            <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>


            {/* Properties Table */}
            <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative min-h-[400px]">
                {isLoading && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <FiLoader size={40} className="text-emerald-500 animate-spin" />
                            <span className="text-xs font-bold text-zinc-400 animate-pulse uppercase tracking-[0.2em]">Synchronizing Inventory...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse min-w-[1000px] sm:min-w-[1100px] lg:min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                                {tableColumns.map((col, idx) => (
                                    <th key={idx} className="p-3 sm:p-4 text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {properties.length > 0 ? (
                                properties.map((prop, index) => (
                                    <tr
                                        key={prop._id}
                                        className={`group hover:bg-zinc-900/50 transition-all duration-200 ${prop.is_active === false ? "opacity-50 grayscale-[0.3]" : ""
                                            }`}
                                    >
                                        <td className="p-3 sm:p-4 text-xs font-bold text-zinc-600">
                                            #{(page - 1) * limit + index + 1}
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <div className="flex flex-col max-w-[220px] sm:max-w-[280px]">
                                                <span className={`text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate ${prop.is_active === false || prop.property_status === "sold" ? "opacity-60" : ""
                                                    }`} title={prop.property_title}>
                                                    {prop.property_title}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-medium lowercase">
                                                    ID: {prop._id.slice(-8).toUpperCase()} | Added: {new Date(prop.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                                    {prop.property_type || "N/A"}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded w-fit border ${prop.listing_type === 'sale'
                                                    ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                                    : prop.listing_type === 'rent' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-violet-500/10 border-violet-500/20 text-violet-400"
                                                    }`}>
                                                    For {prop.listing_type}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-white">
                                                    {formatPrice(prop.asking_price, prop.currency)}
                                                </span>
                                                {prop.price_sqft && (
                                                    <span className="text-[10px] text-zinc-500 font-bold">
                                                        {prop.price_sqft} / sqft
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1 text-zinc-300">
                                                    <FiMapPin size={12} className="text-emerald-500" />
                                                    <span className="text-xs font-semibold">{prop.property_location?.line2 || prop.property_location?.city}</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-500 font-medium ml-4">
                                                    {prop.property_location?.city}, {prop.property_location?.state}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-x-3 text-[10px] font-bold text-zinc-400">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-zinc-500">BD:</span> {prop.total_bedrooms || "0"}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-zinc-500">BA:</span> {prop.total_bathrooms || "0"}
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-semibold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded w-fit">
                                                    {prop.total_area} {prop.area_unit || "Sq.ft"}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {prop.assign_agent && prop.assign_agent.length > 0 ? (
                                                    prop.assign_agent.map((agent) => (
                                                        <span
                                                            key={agent._id}
                                                            className="text-[10px] font-bold bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1"
                                                        >
                                                            <FiUser size={10} /> {agent.agent_details?.user_name || "Agent"}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-zinc-500 italic">Unassigned</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${prop.property_status === "available" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" :
                                                    prop.property_status === "sold" ? "bg-blue-500" : "bg-zinc-500"
                                                    }`} />
                                                <select
                                                    value={prop.property_status}
                                                    onChange={(e) => handleUpdateStatus(prop._id, e.target.value)}
                                                    className={`text-[10px] font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-emerald-500/50 px-2 py-1.5 rounded-lg transition-all appearance-none cursor-alias ${getStatusColor(prop.property_status)}`}
                                                >
                                                    {statusOptions.slice(1).map(s => (
                                                        <option key={s} value={s} className="bg-zinc-900 text-zinc-300 font-bold">{s.toUpperCase()}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 cursor-pointer transition-all"
                                                    onClick={() => handleViewProperty(prop._id)}
                                                    title="View Full Details"
                                                >
                                                    <FiEye size={16} />
                                                </div>
                                                <div
                                                    className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:border-emerald-400/30 cursor-pointer transition-all"
                                                    onClick={() => {
                                                        setEditingProperty(prop);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    title="Edit Listing"
                                                >
                                                    <FiEdit size={16} />
                                                </div>
                                                <div
                                                    className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-400/30 cursor-pointer transition-all"
                                                    onClick={() => handleDeleteProperty(prop._id)}
                                                    title="Delete Listing"
                                                >
                                                    <FiTrash2 size={16} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-zinc-600">
                                            <FiHome size={48} className="opacity-10" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold uppercase tracking-widest">No listings found</p>
                                                <p className="text-xs italic">Adjust your search parameters or check filters</p>
                                            </div>
                                            <PremiumButton 
                                                text="Clear Filters" 
                                                variant="secondary" 
                                                onClick={handleRefresh} 
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Section */}
                <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/10 mt-auto">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.pages}
                        onPageChange={setPage}
                        rowsPerPage={limit}
                        onRowsPerPageChange={(val) => { setLimit(val); setPage(1); }}
                    />
                </div>
            </div>

            {/* Modals */}
            <AddPropertiesModel
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            <EditPropertiesModel
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingProperty(null);
                }}
                property={editingProperty}
            />
        </AppLayout>
    );
};

export default PropertiesPage;
