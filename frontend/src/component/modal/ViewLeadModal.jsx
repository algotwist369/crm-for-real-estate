import React from "react";
import { FiX, FiUser, FiSmartphone, FiMail, FiTarget, FiDollarSign, FiShare2, FiHome, FiCalendar, FiClock, FiMessageSquare } from "react-icons/fi";

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
            new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            contacted: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
            qualified: "bg-violet-500/10 text-violet-400 border-violet-500/20",
            follow_up: "bg-orange-500/10 text-orange-400 border-orange-500/20",
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
                        <div className="w-10 h-10 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                            <FiUser size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-white">{lead.name}</h2>
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
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Client Type</p>
                            <span className="text-sm font-medium text-white capitalize">{lead.client_type || "Buying"}</span>
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
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                    <p className="text-[10px] text-zinc-500 mb-1">Email Address</p>
                                    <p className="text-sm text-white font-medium truncate">{lead.email || "Not Provided"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <FiTarget size={14} /> Requirement & Budget
                            </h3>
                            <div className="space-y-3">
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                    <p className="text-[10px] text-zinc-500 mb-1">Budget</p>
                                    <p className="text-sm text-emerald-400 font-bold flex items-center gap-1">
                                        <FiDollarSign size={14} /> {lead.budget || "Not Specified"}
                                    </p>
                                </div>
                                <div className="p-3 bg-zinc-900/30 border border-zinc-800 rounded">
                                    <p className="text-[10px] text-zinc-500 mb-1">Property Requirements</p>
                                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">{lead.requirement || "General Inquiry"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                    <span className="text-xs font-medium text-blue-400">{formatDate(lead.next_follow_up_date)}</span>
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
                            <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded min-h-[85px]">
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
