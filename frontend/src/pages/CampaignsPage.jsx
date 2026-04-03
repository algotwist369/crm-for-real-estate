import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCampaigns } from '../hooks/useCampaignHooks';
import { RefreshButton } from '../component/common/RefreshButton';
import AppLayout from '../component/layout/AppLayout';
import { FiPlus, FiMessageSquare, FiMail, FiExternalLink, FiBookOpen, FiShield, FiZap, FiInfo, FiCheckCircle, FiAlertTriangle, FiClock } from 'react-icons/fi';

const CampaignsPage = () => {
    const navigate = useNavigate();
    const { data, isLoading, refetch } = useCampaigns();
    const [activeTab, setActiveTab] = useState('campaigns');

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

            <div className="flex items-center gap-1 mb-6 border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab('campaigns')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all relative ${
                        activeTab === 'campaigns' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <FiMessageSquare size={14} />
                        Active Campaigns
                    </div>
                    {activeTab === 'campaigns' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                </button>
                <button
                    onClick={() => setActiveTab('how-to-use')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all relative ${
                        activeTab === 'how-to-use' ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <FiBookOpen size={14} />
                        How to Use
                    </div>
                    {activeTab === 'how-to-use' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                </button>
            </div>

            {activeTab === 'campaigns' ? (
                isLoading ? (
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
                                                        row.status === 'queued' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                    }`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 min-w-[150px]">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex justify-between text-[10px] text-zinc-500">
                                                            <span>{row.processedLeads} / {row.totalLeads}</span>
                                                            <span>{row.totalLeads > 0 ? Math.round((row.processedLeads / row.totalLeads) * 100) : 0}%</span>
                                                        </div>
                                                        <div className="w-full bg-zinc-900 rounded-full h-1.5 border border-zinc-800 overflow-hidden flex">
                                                            {/* Success portion */}
                                                            <div 
                                                                className="h-full bg-green-500 transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                                                style={{ width: `${row.totalLeads > 0 ? (row.sentLeads / row.totalLeads) * 100 : 0}%` }}
                                                            ></div>
                                                            {/* Failed portion */}
                                                            <div 
                                                                className="h-full bg-red-500 transition-all duration-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                                                style={{ width: `${row.totalLeads > 0 ? (row.failedLeads / row.totalLeads) * 100 : 0}%` }}
                                                            ></div>
                                                            {/* Remaining (Queue) portion */}
                                                            {row.status === 'queued' && row.processedLeads === 0 && (
                                                                <div className="h-full w-full bg-yellow-500/20 animate-pulse"></div>
                                                            )}
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
                )
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                                    <FiBookOpen size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Campaign Quick Start</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-400">01</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-200 mb-1">Setup Your Channel</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">Go to <span className="text-yellow-500/80">Settings</span> to link your WhatsApp (via QR Scan) or configure your SMTP for Email campaigns.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-400">02</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-200 mb-1">Create Campaign</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">Click <span className="text-yellow-500/80">New Campaign</span>, give it a name, and select your target leads from the CRM database.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-400">03</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-200 mb-1">Personalize Template</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">Write your message using placeholders like <code className="text-yellow-500/80">{"{{name}}"}</code>. Use <span className="text-yellow-500/80">AI Optimization</span> to rewrite for better engagement.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-400">04</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-200 mb-1">Launch & Monitor</h4>
                                        <p className="text-xs text-zinc-500 leading-relaxed">The system will process messages with intelligent delays to mimic human behavior. Monitor success rates in <span className="text-yellow-500/80">Analytics</span>.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <FiZap size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Dynamic Variables</h3>
                            </div>
                            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">Use these placeholders in your message templates to automatically personalize content for each lead:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {[
                                    { k: 'name', d: 'Lead Full Name' },
                                    { k: 'phone', d: 'Contact Number' },
                                    { k: 'city', d: 'Lead Location' },
                                    { k: 'project_name', d: 'Inquired Project' },
                                    { k: 'agent_name', d: 'Assigned Agent' }
                                ].map(item => (
                                    <div key={item.k} className="p-3 bg-zinc-950 border border-zinc-800 rounded group hover:border-blue-500/30 transition-colors">
                                        <code className="text-[10px] font-mono text-blue-400 font-bold block mb-1">{`{{${item.k}}}`}</code>
                                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">{item.d}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <FiShield size={80} className="text-red-500" />
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
                                    <FiShield size={20} />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">WhatsApp Anti-Ban Rules</h3>
                            </div>
                            
                            <div className="space-y-4 relative z-10">
                                <div className="flex gap-3">
                                    <FiAlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                                    <p className="text-[11px] text-zinc-400 leading-relaxed"><span className="text-zinc-200 font-bold">Avoid Bulk Blasting:</span> Never send messages to thousands of unknown numbers at once. WhatsApp detects and bans bulk senders instantly.</p>
                                </div>
                                <div className="flex gap-3">
                                    <FiClock className="text-yellow-500 mt-0.5 flex-shrink-0" size={14} />
                                    <p className="text-[11px] text-zinc-400 leading-relaxed"><span className="text-zinc-200 font-bold">Use High Delays:</span> Set <span className="text-yellow-500/80">Min Delay {'>'} 30s</span> and <span className="text-yellow-500/80">Max Delay {'>'} 60s</span>. The more "human" the timing, the safer your account.</p>
                                </div>
                                <div className="flex gap-3">
                                    <FiZap className="text-blue-400 mt-0.5 flex-shrink-0" size={14} />
                                    <p className="text-[11px] text-zinc-400 leading-relaxed"><span className="text-zinc-200 font-bold">AI Randomization:</span> Use <span className="text-blue-400/80">AI Optimization</span>. It creates unique variations of your message for each lead, preventing "Copy-Paste Detection".</p>
                                </div>
                                <div className="flex gap-3">
                                    <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={14} />
                                    <p className="text-[11px] text-zinc-400 leading-relaxed"><span className="text-zinc-200 font-bold">Warmup Account:</span> Don't use a fresh WhatsApp number for campaigns. Use an account that already has regular incoming and outgoing chats.</p>
                                </div>
                                <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-400 italic text-center">
                                    Warning: Excessive reports or blocks from recipients will lead to a permanent WhatsApp ban. Always ensure your leads expect your message.
                                </div>
                            </div>
                        </section>

                        <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <FiInfo className="text-zinc-500" size={16} />
                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Need Support?</h4>
                            </div>
                            <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">Our documentation covers most use cases. If you encounter technical issues with QR scanning or message delivery, please contact our support team.</p>
                            <button 
                                onClick={() => window.open('https://wa.me/917388480128?text=Hello, I need support with Algotwist CRM outreach features.', '_blank')}
                                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                            >
                                Contact Developer
                            </button>
                        </section>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

export default CampaignsPage;
