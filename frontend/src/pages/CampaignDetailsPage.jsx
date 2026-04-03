import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCampaignStats } from '../hooks/useCampaignHooks';
import AppLayout from '../component/layout/AppLayout';
import { FiChevronLeft, FiUsers, FiCheckCircle, FiAlertCircle, FiClock, FiActivity, FiZap } from 'react-icons/fi';

const CampaignDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: statsData, isLoading } = useCampaignStats(id);

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
                </div>
            </AppLayout>
        );
    }

    const stats = statsData?.stats || {};
    const processed = stats.processed || 0;
    const total = stats.total || 0;
    const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
    const successRate = processed > 0 ? Math.round((stats.sent / processed) * 100) : 0;
    const failureRate = processed > 0 ? Math.round((stats.failed / processed) * 100) : 0;

    const statCards = [
        { label: 'Total Leads', value: stats.total, icon: <FiUsers className="text-blue-400" />, bg: 'bg-blue-500/5 border-blue-500/20' },
        { label: 'Sent Successfully', value: stats.sent, icon: <FiCheckCircle className="text-green-400" />, bg: 'bg-green-500/5 border-green-500/20' },
        { label: 'Failed / Bounced', value: stats.failed, icon: <FiAlertCircle className="text-red-400" />, bg: 'bg-red-500/5 border-red-500/20' },
        { label: 'In Queue', value: stats.total - processed, icon: <FiClock className="text-yellow-400" />, bg: 'bg-yellow-500/5 border-yellow-500/20' }
    ];

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
                        <div key={idx} className={`${card.bg} p-6 rounded-xl border transition-all hover:scale-[1.02] duration-300`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 bg-zinc-950 rounded-lg border border-zinc-800">
                                    {card.icon}
                                </div>
                            </div>
                            <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{card.label}</h3>
                            <p className="text-3xl font-bold text-white mt-1">{card.value || 0}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Progress & Rates */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-xl">
                            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-8">Delivery Progress</h2>
                            
                            <div className="space-y-10">
                                <div>
                                    <div className="flex justify-between text-xs font-medium mb-3">
                                        <span className="text-zinc-400">Campaign Completion</span>
                                        <span className="text-yellow-500">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800 p-0.5">
                                        <div 
                                            className="bg-yellow-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(234,179,8,0.3)]" 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/50 group hover:border-green-500/30 transition-colors">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Success Rate</p>
                                        <p className="text-3xl font-bold text-green-500 group-hover:scale-110 transition-transform origin-left">{successRate}%</p>
                                    </div>
                                    <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-950/50 group hover:border-red-500/30 transition-colors">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Failure Rate</p>
                                        <p className="text-3xl font-bold text-red-500 group-hover:scale-110 transition-transform origin-left">{failureRate}%</p>
                                    </div>
                                </div>
                            </div>
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
            </div>
        </AppLayout>
    );
};

export default CampaignDetailsPage;
