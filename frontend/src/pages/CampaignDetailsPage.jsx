import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignStats } from '../hooks/useCampaignHooks';
import AppLayout from '../component/layout/AppLayout';
import { 
    FiChevronLeft, 
    FiUsers, 
    FiCheckCircle, 
    FiAlertCircle, 
    FiClock, 
    FiActivity, 
    FiZap,
    FiSearch,
    FiEye,
    FiX 
} from 'react-icons/fi';

const CampaignDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: statsData, isLoading, isFetching } = useCampaignStats(id);
    
    // Search and filter states for the recipient delivery log
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeMessage, setActiveMessage] = useState(null);

    const stats = statsData?.stats || {};
    const processed = stats.processed || 0;
    const total = stats.total || 0;
    const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
    const successRate = processed > 0 ? Math.round((stats.sent / processed) * 100) : 0;
    const failureRate = processed > 0 ? Math.round((stats.failed / processed) * 100) : 0;

    const statCards = [
        { 
            label: 'Total Leads', 
            value: isLoading ? (
                <span className="h-8 w-16 bg-zinc-800 rounded animate-pulse inline-block mt-1"></span>
            ) : stats.total, 
            icon: <FiUsers className="text-blue-400" />, 
            bg: 'bg-blue-500/5 border-blue-500/20' 
        },
        { 
            label: 'Sent Successfully', 
            value: isLoading ? (
                <span className="h-8 w-16 bg-zinc-800 rounded animate-pulse inline-block mt-1"></span>
            ) : stats.sent, 
            icon: <FiCheckCircle className="text-green-400" />, 
            bg: 'bg-green-500/5 border-green-500/20' 
        },
        { 
            label: 'Failed / Bounced', 
            value: isLoading ? (
                <span className="h-8 w-16 bg-zinc-800 rounded animate-pulse inline-block mt-1"></span>
            ) : stats.failed, 
            icon: <FiAlertCircle className="text-red-400" />, 
            bg: 'bg-red-500/5 border-red-500/20' 
        },
        { 
            label: 'In Queue', 
            value: isLoading ? (
                <span className="h-8 w-16 bg-zinc-800 rounded animate-pulse inline-block mt-1"></span>
            ) : stats.total - processed, 
            icon: <FiClock className="text-yellow-400" />, 
            bg: 'bg-yellow-500/5 border-yellow-500/20' 
        }
    ];

    // Filtered recipient messages calculation
    const messages = stats.messages || [];
    const filteredMessages = messages.filter(msg => {
        const leadName = msg.lead?.name || 'Unknown Lead';
        const contact = msg.recipient || '';
        const status = msg.status || '';
        const msgText = msg.renderedMessage || '';

        const matchesSearch = 
            leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
            msgText.toLowerCase().includes(searchTerm.toLowerCase());

        let normalizedGroup = 'queued';
        if (status === 'sent') {
            normalizedGroup = 'sent';
        } else if (['failed', 'invalid_number', 'session_disconnected', 'rate_limited', 'blocked', 'ai_generation_failed'].includes(status)) {
            normalizedGroup = 'failed';
        } else if (['queued', 'pending', 'processing', 'retrying'].includes(status)) {
            normalizedGroup = 'queued';
        }

        const matchesStatus = statusFilter === 'all' || normalizedGroup === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto">
                <button 
                    onClick={() => navigate('/campaigns')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm"
                >
                    <FiChevronLeft /> Back to Campaigns
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Campaign Analytics</h1>
                        <p className="text-zinc-400 text-sm flex items-center gap-2">
                            <FiActivity className="text-yellow-500" /> Real-time delivery tracking and performance metrics
                        </p>
                    </div>
                    <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Ref: {id.slice(-8)}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {statCards.map((card, idx) => (
                        <div key={idx} className={`${card.bg} p-6 rounded-xl border`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                                    {card.icon}
                                </div>
                            </div>
                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{card.label}</h3>
                            {typeof card.value === 'object' ? card.value : <p className="text-3xl font-bold text-white mt-1">{card.value || 0}</p>}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Progress & Rates */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl">
                            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-8">Delivery Progress</h2>
                            
                            {isLoading ? (
                                <div className="space-y-10 animate-pulse">
                                    <div>
                                        <div className="flex justify-between mb-3">
                                            <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                                            <div className="h-4 bg-zinc-800 rounded w-1/6"></div>
                                        </div>
                                        <div className="h-4 bg-zinc-800/50 border border-zinc-850 rounded-full w-full"></div>
                                        <div className="flex justify-between mt-3">
                                            <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
                                            <div className="h-3 bg-zinc-800 rounded w-1/12"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="h-20 bg-zinc-950/50 border border-zinc-850 rounded-xl"></div>
                                        <div className="h-20 bg-zinc-950/50 border border-zinc-850 rounded-xl"></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    <div>
                                        <div className="flex justify-between text-xs font-medium mb-3">
                                            <span className="text-zinc-400">Campaign Delivery Progress</span>
                                            <span className="text-zinc-500">{processed} / {total} Leads</span>
                                        </div>
                                        <div className="w-full bg-zinc-950 rounded-full h-4 border border-zinc-800 p-0.5 overflow-hidden flex">
                                            {/* Success Bar */}
                                            <div 
                                                className="bg-green-500 h-full rounded-l-full" 
                                                style={{ width: `${total > 0 ? (stats.sent / total) * 100 : 0}%` }}
                                            ></div>
                                            {/* Failure Bar */}
                                            <div 
                                                className="bg-red-500 h-full" 
                                                style={{ width: `${total > 0 ? (stats.failed / total) * 100 : 0}%` }}
                                            ></div>
                                            {/* Queue/Remaining portion */}
                                            {total > processed && (
                                                <div className="flex-1 h-full bg-zinc-900"></div>
                                            )}
                                        </div>
                                        <div className="flex justify-between mt-3">
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Sent: {stats.sent}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Failed: {stats.failed}</span>
                                                </div>
                                            </div>
                                            <span className="text-yellow-500 text-xs font-bold">{progress}% Total</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/50">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Success Rate</p>
                                            <p className="text-3xl font-bold text-green-500">{successRate}%</p>
                                        </div>
                                        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/50">
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Failure Rate</p>
                                            <p className="text-3xl font-bold text-red-500">{failureRate}%</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl">
                            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6">Execution Log</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                                    <span className="text-zinc-500 text-xs">Status</span>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                        processed === total 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                        {processed === total ? 'Completed' : 'Processing'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-zinc-800/50">
                                    <span className="text-zinc-500 text-xs">Worker Node</span>
                                    <span className="text-zinc-300 text-xs font-medium">Primary-Cluster-01</span>
                                </div>
                            </div>
                            
                            <div className="mt-8 p-4 bg-yellow-500/5 rounded-lg border border-yellow-500/10 flex gap-3">
                                <FiZap className="text-yellow-500 shrink-0 mt-0.5" size={14} />
                                <p className="text-[10px] text-yellow-500/80 leading-relaxed uppercase font-bold tracking-tight">
                                    Live updates every 5 seconds. Failed messages will automatically retry 3 times before terminal failure.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recipient Message & Delivery Log Section */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2.5">
                                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                                    Recipient Delivery Log ({isLoading ? '...' : filteredMessages.length})
                                </h2>
                                {isFetching && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse">
                                        <span className="w-1 h-1 rounded-full bg-yellow-500 animate-ping"></span>
                                        Syncing
                                    </span>
                                )}
                            </div>
                            <p className="text-zinc-500 text-xs">Track message content and delivery status for each target lead</p>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            {/* Search Box */}
                            <div className="relative w-full sm:w-60">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <FiSearch className="text-zinc-500 text-sm" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by name, contact..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500/50 transition-colors"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Status Filter Pills */}
                            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-stretch sm:self-auto">
                                {['all', 'sent', 'failed', 'queued'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setStatusFilter(tab)}
                                        disabled={isLoading}
                                        className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${
                                            statusFilter === tab
                                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                : 'text-zinc-500 hover:text-zinc-300 border border-transparent disabled:text-zinc-700'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Delivery Log Table */}
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between py-4 border-b border-zinc-900 animate-pulse">
                                    <div className="w-1/4 space-y-2">
                                        <div className="h-3.5 bg-zinc-800 rounded w-3/4"></div>
                                        <div className="h-2 bg-zinc-800 rounded w-1/2"></div>
                                    </div>
                                    <div className="w-1/4 h-3 bg-zinc-800 rounded"></div>
                                    <div className="w-1/6 h-5 bg-zinc-800 rounded-md"></div>
                                    <div className="w-1/6 h-3 bg-zinc-800 rounded"></div>
                                    <div className="w-1/12 h-6 bg-zinc-800 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-950/20 rounded-lg border border-zinc-850 border-dashed">
                            <FiUsers className="text-zinc-600 mb-3 text-2xl animate-pulse" />
                            <p className="text-zinc-400 text-xs font-semibold">No delivery logs found</p>
                            <p className="text-zinc-600 text-[10px] mt-1 uppercase tracking-wider font-bold">Try adjusting your filters or search term</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                        <th className="py-4 px-4">Lead / Name</th>
                                        <th className="py-4 px-4">Outreach Target</th>
                                        <th className="py-4 px-4">Status</th>
                                        <th className="py-4 px-4">Time Sent</th>
                                        <th className="py-4 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {filteredMessages.map((msg) => {
                                        const leadName = msg.lead?.name || 'Unknown Lead';
                                        const contact = msg.recipient || '';
                                        
                                        // Dynamic status badges matching theme
                                        let statusColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                                        if (msg.status === 'sent') {
                                            statusColor = 'bg-green-500/10 text-green-400 border-green-500/20';
                                        } else if (['failed', 'invalid_number', 'session_disconnected', 'rate_limited', 'blocked', 'ai_generation_failed'].includes(msg.status)) {
                                            statusColor = 'bg-red-500/10 text-red-400 border-red-500/20';
                                        }

                                        return (
                                            <tr key={msg._id} className="hover:bg-zinc-900/20 group transition-colors text-xs">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{leadName}</div>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-zinc-400 text-[11px]">{contact}</td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor}`}>
                                                        {msg.status}
                                                    </span>
                                                    {msg.failedReason && (
                                                        <div className="text-[10px] text-red-500/70 mt-1 max-w-xs truncate" title={msg.failedReason}>
                                                            {msg.failedReason}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                                                    {msg.sentAt ? new Date(msg.sentAt).toLocaleString() : new Date(msg.createdAt).toLocaleString()}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={() => setActiveMessage(msg)}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 hover:bg-yellow-500/10 text-[10px] text-zinc-400 hover:text-yellow-500 font-bold uppercase tracking-wider rounded border border-zinc-800 hover:border-yellow-500/20 transition-all active:scale-95"
                                                    >
                                                        <FiEye size={12} /> View Message
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: View Rendered Message Body */}
            {activeMessage && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
                    <div 
                        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-850 bg-zinc-900/30">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                                    Message Details
                                </h3>
                                <p className="text-zinc-500 text-[10px] mt-0.5">
                                    Recipient: <span className="text-zinc-300 font-semibold">{activeMessage.lead?.name || 'Unknown Lead'}</span> ({activeMessage.recipient})
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveMessage(null)}
                                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg border border-zinc-850 hover:border-zinc-750 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Rendered Message Content</div>
                                <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-xl font-sans text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto selection:bg-yellow-500/20">
                                    {activeMessage.renderedMessage}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-zinc-900/30 border border-zinc-850/50 rounded-lg">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Status</div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                        activeMessage.status === 'sent'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : ['failed', 'invalid_number', 'session_disconnected', 'rate_limited', 'blocked', 'ai_generation_failed'].includes(activeMessage.status)
                                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                    }`}>
                                        {activeMessage.status}
                                    </span>
                                </div>
                                <div className="p-3 bg-zinc-900/30 border border-zinc-850/50 rounded-lg">
                                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Logged / Sent At</div>
                                    <p className="text-[11px] font-mono text-zinc-300 mt-0.5">
                                        {activeMessage.sentAt ? new Date(activeMessage.sentAt).toLocaleString() : new Date(activeMessage.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {activeMessage.failedReason && (
                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                                    <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1">Failure Log Reason</div>
                                    <p className="text-xs text-red-400/80 leading-relaxed font-sans">{activeMessage.failedReason}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-zinc-850 bg-zinc-900/30 flex justify-end">
                            <button
                                onClick={() => setActiveMessage(null)}
                                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-xs text-zinc-300 font-bold uppercase tracking-wider rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

export default CampaignDetailsPage;
