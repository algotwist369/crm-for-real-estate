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
import { SearchFilter } from "../component/common/SearchFilter";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import AddPropertiesModel from "../component/modal/AddPropertiesModel";
import EditPropertiesModel from "../component/modal/EditPropertiesModel";
import { useProperties, useUpdatePropertyStatus, useDeleteProperty } from "../hooks/usePropertyHooks";

/* ─── Table Columns ─── */
const tableColumns = ["#", "Property Info", "Type", "Price", "Location", "Specifications", "Agent", "Status", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = [
    "All", "available", "under_offer", "reserved", "booked", "sold", "rented", 
    "leased", "blocked", "under_negotiation", "hold", "unavailable", 
    "withdrawn", "expired", "inactive", "other"
];
const typeOptions = ["All", "Apartment", "Villa", "Office", "Plot", "Warehouse", "Studio", "Penthouse", "Townhouse", "Shop", "Industrial"];

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
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Property Inventory</h2>
                    <p className="text-sm text-zinc-400">Manage and track real-time property listings</p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={handleRefresh} isRefreshing={isFetching} />
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded flex items-center gap-2 transition-colors"
                    >
                        <FiPlus size={16} /> Add Property
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="border border-zinc-800 rounded p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 max-w-lg">
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        searchPlaceholder="Search properties..."
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-400">Type:</span>
                        <select
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                            className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none cursor-pointer"
                        >
                            <option value="All">All Types</option>
                            {typeOptions.slice(1).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-400">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none cursor-pointer capitalize"
                        >
                            <option value="All">All Status</option>
                            {statusOptions.slice(1).map(opt => (
                                <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Properties Table */}
            <div className="border border-zinc-800 rounded overflow-hidden flex flex-col relative min-h-[400px]">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-zinc-400 text-sm">Loading properties data...</div>
                    ) : properties.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">No properties found matching your criteria.</div>
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
                            {properties.map((prop, index) => {
                                const isInactive = prop.is_active === false || prop.property_status === "inactive";
                                return (
                                <tr
                                    key={prop._id}
                                    className={`${isInactive ? "opacity-60 bg-zinc-900/40" : ""}`}
                                >
                                    <td className="p-3 text-zinc-500">
                                        {(page - 1) * limit + index + 1}
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span className={`font-medium truncate max-w-[200px] ${isInactive ? "line-through text-zinc-500" : "text-zinc-100"}`} title={prop.property_title}>
                                                {prop.property_title}
                                            </span>
                                            <span className="text-xs text-zinc-500 mt-0.5">
                                                ID: {prop._id.slice(-8).toUpperCase()} | Added: {new Date(prop.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="capitalize">
                                                {prop.property_type || "N/A"}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                                For {prop.listing_type}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-3 font-medium text-zinc-200">
                                        <div className="flex flex-col">
                                            <span>
                                                {formatPrice(prop.asking_price, prop.currency)}
                                            </span>
                                            {prop.price_sqft && (
                                                <span className="text-xs text-zinc-500">
                                                    {prop.price_sqft} / sqft
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-col text-sm truncate max-w-[150px]" title={prop.property_location?.line2 || prop.property_location?.city}>
                                            <span>{prop.property_location?.line2 || prop.property_location?.city}</span>
                                            <span className="text-xs text-zinc-500">
                                                {prop.property_location?.city}, {prop.property_location?.state}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex flex-col gap-0.5 text-xs">
                                            <div className="text-zinc-400">
                                                {prop.bedroom_label || `${prop.total_bedrooms || "0"} Beds`} / {prop.total_bathrooms || "0"} Baths
                                            </div>
                                            <div className="text-zinc-500">
                                                {prop.total_area || prop.plot_area || "0"} {prop.area_unit || "sqft"}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-3">
                                        {prop.assign_agent && prop.assign_agent.length > 0 ? (
                                            <div className="flex flex-col gap-1">
                                                {prop.assign_agent.map((agent) => (
                                                    <span key={agent._id} className="text-xs text-zinc-400">
                                                        {agent.agent_details?.user_name || "Agent"}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-zinc-500">Unassigned</span>
                                        )}
                                    </td>

                                    <td className="p-3">
                                        <select
                                            value={prop.property_status}
                                            onChange={(e) => handleUpdateStatus(prop._id, e.target.value)}
                                            className="text-xs p-1.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 capitalize cursor-pointer focus:outline-none"
                                        >
                                            {statusOptions.slice(1).map(s => (
                                                <option key={s} value={s}>{s.replace("_", " ")}</option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="text-zinc-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-white transition-colors"
                                                onClick={() => handleViewProperty(prop._id)}
                                                title="View Full Details"
                                            >
                                                <FiEye size={14} />
                                            </button>
                                            <button
                                                className="text-yellow-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-yellow-300 transition-colors"
                                                onClick={() => {
                                                    setEditingProperty(prop);
                                                    setIsEditModalOpen(true);
                                                }}
                                                title="Edit Listing"
                                            >
                                                <FiEdit size={14} />
                                            </button>
                                            <button
                                                className="text-red-400 bg-zinc-900 border border-zinc-800 p-1.5 rounded hover:text-red-300 transition-colors"
                                                onClick={() => handleDeleteProperty(prop._id)}
                                                title="Delete Listing"
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
                {properties.length > 0 && (
                <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                    <Pagination
                        currentPage={page}
                        totalPages={pagination.pages}
                        onPageChange={setPage}
                        rowsPerPage={limit}
                        onRowsPerPageChange={(val) => { setLimit(val); setPage(1); }}
                    />
                </div>
                )}
            </div>

            {/* Modals - Conditionally rendered to prevent background API calls */}
            {isAddModalOpen && (
                <AddPropertiesModel
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                />
            )}

            {isEditModalOpen && (
                <EditPropertiesModel
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setEditingProperty(null);
                    }}
                    property={editingProperty}
                />
            )}
        </AppLayout>
    );
};

export default PropertiesPage;
