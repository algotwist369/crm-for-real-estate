import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../component/layout/AppLayout";
import { 
    FiArrowLeft, 
    FiUser, 
    FiSmartphone, 
    FiMail, 
    FiTarget, 
    FiDollarSign, 
    FiShare2, 
    FiHome, 
    FiCalendar, 
    FiClock, 
    FiMessageSquare,
    FiEdit,
    FiPlus,
    FiAlertCircle
} from "react-icons/fi";
import { useLead, useUpdateLead } from "../hooks/useLeadHooks";
import EditLeadModal from "../component/modal/EditLeadModal";
import FollowUpModal from "../component/modal/FollowUpModal";
import MarkLostModal from "../component/modal/MarkLostModal";

const statusOptions = ["New", "Contacted", "Qualified", "Follow_up", "Converted", "Closed", "Lost", "Wasted", "Archived"];

const LeadDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isFollowUpModalOpen, setIsFollowUpModalOpen] = React.useState(false);
    const [isMarkLostModalOpen, setIsMarkLostModalOpen] = React.useState(false);

    const { data: leadResponse, isLoading, isError, refetch } = useLead(id);
    const updateLeadMutation = useUpdateLead();

    const handleStatusChange = (newStatus) => {
        if (newStatus === 'lost') {
            setIsMarkLostModalOpen(true);
            return;
        }
        updateLeadMutation.mutate({ id, data: { status: newStatus } }, {
            onSuccess: () => refetch()
        });
    };

    const lead = leadResponse?.data;

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

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className="text-zinc-400">Loading lead details...</p>
                </div>
            </AppLayout>
        );
    }

    if (isError || !lead) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <p className="text-red-400">Error loading lead details</p>
                    <button onClick={() => navigate('/leads')} className="text-zinc-500 hover:text-white flex items-center gap-2">
                        <FiArrowLeft /> Back to Leads
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Header / Breadcrumb */}
            <div className="mb-6 flex items-center justify-between">
                <button 
                    onClick={() => navigate('/leads')} 
                    className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
                >
                    <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Registry</span>
                </button>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsFollowUpModalOpen(true)}
                        className="px-4 py-2 bg-yellow-600/10 border border-yellow-500/20 text-yellow-500 text-xs font-medium rounded transition-colors flex items-center gap-2"
                    >
                        <FiPlus size={14} /> Schedule Follow-up
                    </button>
                    <button 
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium rounded transition-colors flex items-center gap-2"
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <FiEdit size={14} /> Edit Lead
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-2xl flex flex-col">
                
                {/* Profile Header Block */}
                <div className="px-6 py-6 border-b border-zinc-800 bg-zinc-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-yellow-600/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 overflow-hidden">
                            {lead.followed_by?.profile_pic ? (
                                <img src={lead.followed_by.profile_pic} alt="Agent" className="w-full h-full object-cover" />
                            ) : (
                                <FiUser size={28} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-white tracking-tight">{lead.name}</h2>
                            <p className="text-xs text-zinc-500 font-mono mt-1">UUID: {lead._id}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex flex-col items-end min-w-[120px]">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Status</p>
                            <select
                                value={lead.status || "new"}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className={`w-full bg-zinc-950 border rounded p-1.5 text-xs capitalize cursor-pointer focus:outline-none font-bold tracking-wide ${
                                    lead.status === 'new' ? 'text-yellow-400 border-yellow-500/30' :
                                    lead.status === 'contacted' ? 'text-zinc-300 border-zinc-700/30' :
                                    lead.status === 'qualified' ? 'text-violet-400 border-violet-500/30' :
                                    lead.status === 'follow_up' ? 'text-orange-400 border-orange-500/30' :
                                    lead.status === 'converted' ? 'text-teal-400 border-teal-500/30' :
                                    lead.status === 'closed' ? 'text-emerald-400 border-emerald-500/30' :
                                    lead.status === 'lost' ? 'text-red-400 border-red-500/30' :
                                    'text-zinc-500 border-zinc-800'
                                }`}
                            >
                                {statusOptions.map(s => (
                                    <option key={s} value={s.toLowerCase()} className="bg-zinc-950 text-zinc-300">{s.replace("_", "-")}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col items-end">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Priority</p>
                            <PriorityBadge priority={lead.priority} />
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-10 bg-zinc-950/20">
                    
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Client Type</p>
                            <p className="text-sm font-medium text-white capitalize">{lead.client_type || "Buying"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Inquiry For</p>
                            <p className="text-sm font-medium text-white">{lead.inquiry_for || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Source</p>
                            <p className="text-sm font-medium text-zinc-300 capitalize flex items-center gap-1.5">
                                <FiShare2 size={12} className="text-zinc-500"/> {lead.source || "Website"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Created On</p>
                            <p className="text-sm font-medium text-zinc-400">{new Date(lead.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Detailed Info Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        
                        {/* Left Column: Contact & Basic Requirements */}
                        <div className="lg:col-span-2 space-y-10">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Contact Details */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <FiSmartphone size={14} /> Contact Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-colors">
                                            <p className="text-[10px] text-zinc-500 mb-1">Phone Number</p>
                                            <p className="text-lg text-white font-medium tracking-wide">{lead.phone}</p>
                                        </div>
                                        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-colors">
                                            <p className="text-[10px] text-zinc-500 mb-1">Email Address</p>
                                            <p className="text-sm text-zinc-300 font-medium truncate">{lead.email || "Not Provided"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Budget & Requirement */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                        <FiTarget size={14} /> Requirement & Budget
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                                            <p className="text-[10px] text-zinc-500 mb-1">Estimated Budget</p>
                                            <p className="text-lg text-emerald-400 font-bold flex items-center gap-1">
                                                <span className="text-emerald-500/50">{lead.currency || "₹"}</span> {lead.budget || "Not Specified"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg min-h-[85px]">
                                            <p className="text-[10px] text-zinc-500 mb-1">Requirement Details</p>
                                            <p className="text-sm text-zinc-300 leading-relaxed font-medium">{lead.requirement || "General Inquiry"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lost Reason Display */}
                            {lead.status === 'lost' && (
                                <div className="space-y-4 border-t border-zinc-800 pt-8">
                                    <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                                        <FiAlertCircle size={14} /> Closure Information
                                    </h3>
                                    <div className="p-5 bg-red-500/5 border border-red-500/10 rounded-xl">
                                        <p className="text-[10px] text-red-500/70 uppercase tracking-widest font-bold mb-2">Lost Reason</p>
                                        <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                                            {lead.lost_reason || "No reason recorded for closure."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Interested Properties */}
                            <div className="space-y-4 border-t border-zinc-800 pt-8">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <FiHome size={14} /> Interested Properties
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Array.isArray(lead.properties) && lead.properties.length > 0 ? (
                                        lead.properties.map((p, i) => (
                                            <div 
                                                key={i} 
                                                className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-yellow-500/30 transition-all cursor-pointer group"
                                                onClick={() => navigate(`/properties/${p._id}`)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate flex-1">{p.property_title}</p>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 capitalize">{p.property_status}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                        {p.property_location?.city || "Unknown City"} • {p.property_type || "Type N/A"}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-emerald-500">{p.currency} {p.asking_price?.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 p-8 border border-dashed border-zinc-800 rounded-xl text-center">
                                            <p className="text-sm text-zinc-600">No specific properties linked yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Schedule & Assignment */}
                        <div className="space-y-8 lg:border-l lg:border-zinc-800 lg:pl-10">
                            
                            {/* Follow-up Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <FiCalendar size={14} /> Schedule & Timeline
                                </h3>
                                <div className="p-5 bg-zinc-900/30 border border-zinc-800 rounded-xl space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FiClock className="text-zinc-500" size={14} />
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Next Follow-up</span>
                                        </div>
                                        <p className="text-lg font-medium text-yellow-400 bg-yellow-400/5 p-3 rounded-lg border border-yellow-400/10">
                                            {formatDate(lead.next_follow_up_date)}
                                        </p>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-zinc-800/50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-500">Assigned Agent</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-zinc-200">{lead.followed_by?.user_name || "Unassigned"}</span>
                                                {lead.followed_by?.profile_pic && <img src={lead.followed_by.profile_pic} className="w-5 h-5 rounded-full object-cover" alt="" />}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-zinc-500">Last Contacted</span>
                                            <span className="text-xs font-medium text-zinc-400">
                                                {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : "Never"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assigned To Section */}
                            <div className="space-y-4 pt-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <FiUser size={14} /> Access Team
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Array.isArray(lead.assigned_to) && lead.assigned_to.map((person, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full">
                                            {person.profile_pic ? (
                                                <img src={person.profile_pic} className="w-4 h-4 rounded-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] text-zinc-500 uppercase">
                                                    {person.user_name?.charAt(0)}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-zinc-300 font-medium">{person.user_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Remarks Section */}
                            <div className="space-y-4 pt-4">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <FiMessageSquare size={14} /> Latest Remarks
                                </h3>
                                <div className="p-5 bg-yellow-600/5 border border-yellow-500/10 rounded-xl">
                                    <p className="text-xs text-zinc-300 italic leading-relaxed font-medium">
                                        {lead.remarks ? `"${lead.remarks}"` : "No remarks recorded for this lead."}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Footer Meta */}
                <div className="px-8 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <p className="text-[10px] text-zinc-600 font-medium">Record last updated: {new Date(lead.updatedAt).toLocaleString()}</p>
                    <div className="flex items-center gap-4">
                        {lead.tags?.length > 0 && (
                            <div className="flex gap-1.5">
                                {lead.tags.map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">#{t}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isEditModalOpen && (
                <EditLeadModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onUpdate={() => {
                        setIsEditModalOpen(false);
                        refetch();
                    }}
                    lead={lead}
                />
            )}

            {isFollowUpModalOpen && (
                <FollowUpModal
                    isOpen={isFollowUpModalOpen}
                    onClose={() => setIsFollowUpModalOpen(false)}
                    onSave={() => {
                        setIsFollowUpModalOpen(false);
                        refetch();
                    }}
                    lead={lead}
                />
            )}

            {isMarkLostModalOpen && (
                <MarkLostModal
                    isOpen={isMarkLostModalOpen}
                    onClose={() => setIsMarkLostModalOpen(false)}
                    lead={lead}
                    onStatusUpdated={() => {
                        setIsMarkLostModalOpen(false);
                        refetch();
                    }}
                />
            )}
        </AppLayout>
    );
};

export default LeadDetailsPage;
