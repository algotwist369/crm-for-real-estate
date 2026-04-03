import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCampaign } from '../hooks/useCampaignHooks';
import { useLeads } from '../hooks/useLeadHooks';
import { PremiumInput } from '../component/common/PremiumInput';
import { PremiumTextarea } from '../component/common/PremiumTextarea';
import { PremiumToggle } from '../component/common/PremiumToggle';
import AppLayout from '../component/layout/AppLayout';
import { FiMessageSquare, FiMail, FiChevronLeft, FiZap, FiCheck } from 'react-icons/fi';

const CreateCampaignPage = () => {
    const navigate = useNavigate();
    const createCampaignMutation = useCreateCampaign();
    const { data: leadsData, isLoading: leadsLoading } = useLeads();
    
    const [formData, setFormData] = useState({
        name: '',
        channel: 'whatsapp',
        template: {
            subject: '',
            body: ''
        },
        leadIds: [],
        delayConfig: {
            minDelay: 30,
            maxDelay: 60,
            batchSize: 20,
            batchPause: 300
        },
        aiRewriteEnabled: false
    });

    const [selectedLeads, setSelectedLeads] = useState([]);

    const leads = leadsData?.data || [];

    const handleLeadSelection = (leadId) => {
        setSelectedLeads(prev => 
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const handleSelectAll = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l._id.toString()) || []);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Campaign Name is required.');
            return;
        }
        if (!formData.template.body.trim()) {
            alert('Message Template is required.');
            return;
        }
        if (formData.channel === 'email' && !formData.template.subject.trim()) {
            alert('Email Subject is required for Email campaigns.');
            return;
        }
        if (selectedLeads.length === 0) {
            alert('Please select at least one lead.');
            return;
        }

        const payload = {
            ...formData,
            leadIds: selectedLeads.map(id => id.toString()) // Ensure all lead IDs are strings
        };

        createCampaignMutation.mutate(payload, {
            onSuccess: () => navigate('/campaigns'),
            onError: (error) => {
                console.error('Campaign creation failed:', error.response?.data || error.message);
            }
        });
    };

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto">
                <button 
                    onClick={() => navigate('/campaigns')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6 transition-colors text-sm"
                >
                    <FiChevronLeft /> Back to Campaigns
                </button>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Create New Campaign</h1>
                    <p className="text-zinc-400">Set up your automated outreach sequence</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Config (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
                            <h2 className="text-sm font-semibold mb-6 text-zinc-300 uppercase tracking-wider">Campaign Settings</h2>
                            
                            <div className="space-y-5">
                                <PremiumInput 
                                    label="Campaign Name"
                                    placeholder="e.g. Follow-up - Burj Khalifa Leads"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />

                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Channel</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, channel: 'whatsapp' })}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded border transition-all text-xs font-medium ${
                                                formData.channel === 'whatsapp' 
                                                ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                        >
                                            <FiMessageSquare /> WhatsApp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, channel: 'email' })}
                                            className={`flex items-center justify-center gap-2 py-2.5 rounded border transition-all text-xs font-medium ${
                                                formData.channel === 'email' 
                                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                        >
                                            <FiMail /> Email
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-800">
                                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-4">Delay Rules (Seconds)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <PremiumInput 
                                            label="Min Delay"
                                            type="number"
                                            value={formData.delayConfig.minDelay}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                delayConfig: { ...formData.delayConfig, minDelay: Number(e.target.value) } 
                                            })}
                                        />
                                        <PremiumInput 
                                            label="Max Delay"
                                            type="number"
                                            value={formData.delayConfig.maxDelay}
                                            onChange={(e) => setFormData({ 
                                                ...formData, 
                                                delayConfig: { ...formData.delayConfig, maxDelay: Number(e.target.value) } 
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-800">
                                    <PremiumToggle 
                                        label="AI Optimization"
                                        description="Paraphrase messages with AI"
                                        checked={formData.aiRewriteEnabled}
                                        onChange={(checked) => setFormData({ ...formData, aiRewriteEnabled: checked })}
                                        icon={<FiZap className="text-yellow-500" />}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Template & Leads (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
                            <h2 className="text-sm font-semibold mb-6 text-zinc-300 uppercase tracking-wider">Message Content</h2>
                            
                            {formData.channel === 'email' && (
                                <div className="mb-5">
                                    <PremiumInput 
                                        label="Email Subject"
                                        placeholder="Regarding your inquiry for {{project_name}}"
                                        value={formData.template.subject}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            template: { ...formData.template, subject: e.target.value } 
                                        })}
                                        required
                                    />
                                </div>
                            )}

                            <PremiumTextarea 
                                label="Message Template"
                                placeholder="Hi {{name}}, I wanted to follow up regarding your interest in {{project_name}}..."
                                rows={6}
                                value={formData.template.body}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    template: { ...formData.template, body: e.target.value } 
                                })}
                                required
                            />

                            <div className="mt-3 flex flex-wrap gap-2">
                                {['name', 'project_name', 'city', 'agent_name'].map(v => (
                                    <span key={v} className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[10px] font-mono text-yellow-500">
                                        {`{{${v}}}`}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                                    Target Leads ({selectedLeads.length})
                                </h2>
                                <button 
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold hover:text-yellow-400 transition-colors"
                                >
                                    {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>
                            
                            <div className="max-h-80 overflow-y-auto border border-zinc-800 rounded scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800">
                                        <tr>
                                            <th className="p-3 w-10"></th>
                                            <th className="p-3 text-zinc-500 font-medium">Lead Name</th>
                                            <th className="p-3 text-zinc-500 font-medium">Contact</th>
                                            <th className="p-3 text-zinc-500 font-medium">City</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800/50">
                                        {leadsLoading ? (
                                            <tr><td colSpan="4" className="p-10 text-center text-zinc-500">Loading leads...</td></tr>
                                        ) : leads.length > 0 ? (
                                            leads.map((lead) => (
                                                <tr 
                                                    key={lead._id} 
                                                    className={`hover:bg-zinc-800/20 transition-colors cursor-pointer ${selectedLeads.includes(lead._id) ? 'bg-yellow-500/5' : ''}`}
                                                    onClick={() => handleLeadSelection(lead._id)}
                                                >
                                                    <td className="p-3">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                            selectedLeads.includes(lead._id) 
                                                            ? 'bg-yellow-600 border-yellow-600 text-white' 
                                                            : 'border-zinc-700 bg-zinc-950'
                                                        }`}>
                                                            {selectedLeads.includes(lead._id) && <FiCheck size={10} />}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-zinc-200 font-medium">{lead.name}</td>
                                                    <td className="p-3 text-zinc-400">{formData.channel === 'whatsapp' ? lead.phone : lead.email}</td>
                                                    <td className="p-3 text-zinc-500">{lead.address || '—'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" className="p-10 text-center text-zinc-500 italic">No leads available</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={createCampaignMutation.isPending || selectedLeads.length === 0}
                                className={`px-10 py-3 rounded font-bold text-sm shadow-lg transition-all active:transform active:scale-95 ${
                                    createCampaignMutation.isPending || selectedLeads.length === 0
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' 
                                    : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                }`}
                            >
                                {createCampaignMutation.isPending ? 'Launching...' : 'Start Outreach Campaign'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default CreateCampaignPage;
