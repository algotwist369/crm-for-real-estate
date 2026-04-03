import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaignHooks';
import { RefreshButton } from '../component/common/RefreshButton';
import AppLayout from '../component/layout/AppLayout';
import { FiPlus, FiMessageSquare, FiMail, FiExternalLink } from 'react-icons/fi';

const CampaignsPage = () => {
    const navigate = useNavigate();
    const { data, isLoading, refetch } = useCampaigns();

    const campaigns = data?.campaigns || [];

    return (
        <AppLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-medium text-white mb-1">Outreach Campaigns</h2>
                    <p className="text-sm text-zinc-400">Automate your lead communication via WhatsApp and Email</p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={refetch} />
                    <button 
                        onClick={() => navigate('/campaigns/settings')}
                        className="px-4 py-2 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded text-sm font-medium hover:bg-zinc-800 transition-colors h-10"
                    >
                        Settings
                    </button>
                    <button 
                        onClick={() => navigate('/campaigns/create')}
                        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded flex items-center justify-center transition-colors h-10 gap-2"
                    >
                        <FiPlus size={18} /> New Campaign
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500"></div>
                </div>
            ) : (
                <div className="bg-zinc-950/20 border border-zinc-800 rounded overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-900/50 text-zinc-400 text-xs border-b border-zinc-800">
                                    <th className="p-4 font-medium tracking-wide">Campaign Name</th>
                                    <th className="p-4 font-medium tracking-wide">Channel</th>
                                    <th className="p-4 font-medium tracking-wide">Status</th>
                                    <th className="p-4 font-medium tracking-wide">Progress</th>
                                    <th className="p-4 font-medium tracking-wide">Created Date</th>
                                    <th className="p-4 font-medium tracking-wide text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-sm">
                                {campaigns.length > 0 ? (
                                    campaigns.map((row) => (
                                        <tr key={row._id} className="hover:bg-zinc-900/10 transition-colors text-zinc-300">
                                            <td className="p-4 font-medium text-zinc-200">{row.name}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {row.channel === 'whatsapp' ? (
                                                        <FiMessageSquare className="text-green-500" size={16} />
                                                    ) : (
                                                        <FiMail className="text-blue-500" size={16} />
                                                    )}
                                                    <span className="capitalize text-xs">{row.channel}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 text-[10px] rounded border uppercase tracking-wider ${
                                                    row.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    row.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    row.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                }`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="p-4 min-w-[150px]">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between text-[10px] text-zinc-500">
                                                        <span>{row.processedLeads} / {row.totalLeads}</span>
                                                        <span>{Math.round((row.processedLeads / row.totalLeads) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-900 rounded-full h-1 border border-zinc-800">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                row.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                                                            }`}
                                                            style={{ width: `${(row.processedLeads / row.totalLeads) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-zinc-500">
                                                {new Date(row.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => navigate(`/campaigns/${row._id}`)}
                                                    className="p-2 text-zinc-500 hover:text-yellow-500 transition-colors"
                                                    title="View Analytics"
                                                >
                                                    <FiExternalLink size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-zinc-600 italic">
                                            No campaigns found. Start by creating your first outreach campaign.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

export default CampaignsPage;
