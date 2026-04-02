import React from "react";
import { FiX, FiUser, FiSmartphone, FiTarget, FiDollarSign, FiShare2, FiHome, FiCalendar, FiClock, FiMessageSquare } from "react-icons/fi";

const ViewLeadModal = ({ isOpen, onClose, lead }) => {
    if (!isOpen || !lead) return null;

    const formatDate = (date) => {
        if (!date) return "Not Scheduled";
        return new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            new: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            contacted: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
            qualified: "bg-violet-500/10 text-violet-400 border-violet-500/20",
            follow_up: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            site_visit: "bg-orange-500/10 text-orange-400 border-orange-500/20",
            negotiation: "bg-purple-500/10 text-purple-400 border-purple-500/20",
            booked: "bg-emerald-300/10 text-emerald-300 border-emerald-400/20",
            closed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            converted: "bg-teal-500/10 text-teal-400 border-teal-500/20",
            lost: "bg-red-500/10 text-red-400 border-red-500/20",
            wasted: "bg-zinc-700/10 text-zinc-500 border-zinc-700/20",
        };
        const colorClass = colors[status?.toLowerCase()] || colors.new;
        return (
            <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
                {status || "New"}
            </span>
        );
    };

    const PriorityBadge = ({ priority }) => {
        const colors = {
            high: "text-red-400 bg-red-500/10 border-red-500/20",
            medium: "text-orange-400 bg-orange-500/10 border-orange-500/20",
            low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        };
        const colorClass = colors[priority?.toLowerCase()] || colors.medium;
        return (
            <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
                {priority || "Medium"}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-yellow-600/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                            <FiUser size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-medium text-white">{lead.name}</h2>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                    {lead.lead_type || "Buyer"}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500">Lead Registry ID: {lead._id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar bg-zinc-950/20">
                    
                    {/* Status & Priority Row */}
                    <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded">
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Current Status</p>
                            <StatusBadge status={lead.status} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Priority Level</p>
                            <PriorityBadge priority={lead.priority} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Property Type</p>
                            <span className="text-sm font-medium text-white capitalize">{lead.property_type || "N/A"}</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Source</p>
                            <span className="text-sm font-medium text-zinc-300 capitalize flex items-center gap-1.5"><FiShare2 size={12} className="text-zinc-500"/> {lead.source || "Website"}</span>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <FiSmartphone size={14} /> Contact Details
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                    <p className="text-[10px] text-zinc-500 mb-1">Phone Number</p>
                                    <p className="text-sm text-white font-medium">{lead.phone}</p>
                                </div>
                                {(lead.alternate_phone || lead.whatsapp_number) && (
                                    <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                        <p className="text-[10px] text-zinc-500 mb-1">Other Numbers</p>
                                        <div className="text-sm text-zinc-300">
                                            {lead.alternate_phone && <p>Alt: {lead.alternate_phone}</p>}
                                            {lead.whatsapp_number && <p className="mt-1">WA: {lead.whatsapp_number}</p>}
                                        </div>
                                    </div>
                                )}
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                    <p className="text-[10px] text-zinc-500 mb-1">Email Address</p>
                                    <p className="text-sm text-white font-medium truncate">{lead.email || "Not Provided"}</p>
                                </div>
                                {lead.address && (
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                    <p className="text-[10px] text-zinc-500 mb-1">Location / Address</p>
                                    <p className="text-sm text-zinc-300">{lead.address}</p>
                                </div>
                                )}
                            </div>
                        </div>

                        {/* Budget & Pricing */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <FiDollarSign size={14} /> Pricing & Budget
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                    <p className="text-[10px] text-zinc-500 mb-1">Estimated Budget</p>
                                    <p className="text-sm text-emerald-400 font-bold flex items-center gap-1">
                                        {lead.currency || "AED"} {lead.budget || "Not Specified"}
                                    </p>
                                </div>
                                {lead.asking_price && (
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 mb-1">Asking / Target Price</p>
                                        <p className="text-sm text-emerald-400 font-bold">{lead.currency || "AED"} {lead.asking_price.toLocaleString()}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${lead.price_negotiable ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                                        {lead.price_negotiable ? "Negotiable" : "Fixed"}
                                    </span>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Property Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <FiTarget size={14} /> Property Details & Requirement
                        </h3>
                        <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Bedrooms</p>
                                <p className="text-sm text-white font-medium">{lead.bedrooms || "Any"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Bathrooms</p>
                                <p className="text-sm text-white font-medium">{lead.bathrooms || "Any"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Maid Room</p>
                                <p className="text-sm text-white font-medium">{lead.maid_room ? "Yes" : "No"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-zinc-500 mb-1">Furnishing</p>
                                <p className="text-sm text-white font-medium capitalize">{lead.furnished_status?.replace('_', ' ') || "Any"}</p>
                            </div>
                            {lead.built_up_area?.value && (
                                <div>
                                    <p className="text-[10px] text-zinc-500 mb-1">Built-Up Area</p>
                                    <p className="text-sm text-white font-medium">{lead.built_up_area.value} {lead.built_up_area.unit}</p>
                                </div>
                            )}
                            {lead.plot_size?.value && (
                                <div>
                                    <p className="text-[10px] text-zinc-500 mb-1">Plot Size</p>
                                    <p className="text-sm text-white font-medium">{lead.plot_size.value} {lead.plot_size.unit}</p>
                                </div>
                            )}
                            <div className="col-span-2 md:col-span-4 mt-2 border-t border-zinc-800/50 pt-2">
                                <p className="text-[10px] text-zinc-500 mb-1">Requirements / Remarks</p>
                                <p className="text-sm text-zinc-300 leading-relaxed font-medium">{lead.requirement || "General Inquiry"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Ownership & Stakeholders */}
                    {(lead.owner_name || lead.broker_name) && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <FiShare2 size={14} /> Stakeholder Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {lead.owner_name && (
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                    <p className="text-[10px] text-zinc-500 mb-1">Owner Name</p>
                                    <p className="text-sm text-zinc-300 font-medium">{lead.owner_name}</p>
                                </div>
                                )}
                                {lead.broker_name && (
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 mb-1">Broker Name</p>
                                        <p className="text-sm text-zinc-300 font-medium">{lead.broker_name}</p>
                                    </div>
                                    {lead.broker_phone && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-zinc-500 mb-1">Phone</p>
                                            <p className="text-xs text-zinc-400">{lead.broker_phone}</p>
                                        </div>
                                    )}
                                </div>
                                )}
                                {lead.shared_details && (
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded md:col-span-2">
                                    <p className="text-[10px] text-zinc-500 mb-1">Shared Comments / Commission Info</p>
                                    <p className="text-xs text-zinc-400 italic">{lead.shared_details}</p>
                                </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Interested Properties */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <FiHome size={14} /> Interested Properties
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Array.isArray(lead.properties) && lead.properties.length > 0 ? (
                                lead.properties.map((p, i) => (
                                    <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded flex flex-col gap-1">
                                        <p className="text-sm font-medium text-white truncate">{p.property_title}</p>
                                        <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                            {p.property_location?.city || "Unspecified Location"} • {p.property_type || "Type N/A"}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 p-4 border border-dashed border-zinc-800 rounded text-center">
                                    <p className="text-xs text-zinc-600">No specific properties linked yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Follow-up & Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <FiCalendar size={14} /> Schedule & Assignment
                            </h3>
                            <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <FiClock className="text-zinc-500" size={14} />
                                        <span className="text-xs text-zinc-400">Next Follow-up</span>
                                    </div>
                                    <span className="text-xs font-medium text-yellow-400">{formatDate(lead.next_follow_up_date)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FiUser className="text-zinc-500" size={14} />
                                        <span className="text-xs text-zinc-400">Assigned Agent</span>
                                    </div>
                                    <span className="text-xs font-medium text-zinc-200">{lead.followed_by?.user_name || "Unassigned"}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <FiMessageSquare size={14} /> Latest Remarks
                            </h3>
                            <div className="p-4 bg-yellow-600/5 border border-yellow-500/10 rounded min-h-[85px]">
                                <p className="text-xs text-zinc-300 italic leading-relaxed">
                                    {lead.remarks ? `"${lead.remarks}"` : "No remarks recorded for this lead."}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900">
                    <p className="text-[10px] text-zinc-600 font-medium">Record created on: {new Date(lead.createdAt).toLocaleString()}</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded transition-colors"
                    >
                        Close Registry
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ViewLeadModal;
