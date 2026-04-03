import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCampaign, useUploadCampaignMedia } from '../hooks/useCampaignHooks';
import { useLeadsMinimal } from '../hooks/useLeadHooks';
import { PremiumInput } from '../component/common/PremiumInput';
import { PremiumTextarea } from '../component/common/PremiumTextarea';
import { PremiumToggle } from '../component/common/PremiumToggle';
import AppLayout from '../component/layout/AppLayout';
import { FiMessageSquare, FiMail, FiChevronLeft, FiZap, FiCheck, FiImage, FiVideo, FiX, FiUploadCloud } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreateCampaignPage = () => {
    const navigate = useNavigate();
    const createCampaignMutation = useCreateCampaign();
    const uploadMediaMutation = useUploadCampaignMedia();
    const { data: leadsData, isLoading: leadsLoading } = useLeadsMinimal();
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        name: '',
        channel: 'whatsapp',
        template: {
            subject: '',
            body: '',
            mediaUrl: '',
            mediaType: null
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

    const insertVariable = (variable) => {
        const textarea = textareaRef.current?.querySelector('textarea');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.template.body;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const variableText = `{{${variable}}}`;
        
        const newBody = before + variableText + after;
        
        setFormData({
            ...formData,
            template: { ...formData.template, body: newBody }
        });

        // Set focus back and move cursor after the variable
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variableText.length, start + variableText.length);
        }, 0);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        const isImage = file.mimetype ? file.mimetype.startsWith('image/') : file.type.startsWith('image/');
        const isVideo = file.mimetype ? file.mimetype.startsWith('video/') : file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            toast.error('Please upload an image or video file');
            return;
        }

        const formDataMedia = new FormData();
        formDataMedia.append('media', file);

        try {
            const res = await uploadMediaMutation.mutateAsync(formDataMedia);
            console.log('Upload response:', res);
            
            if (res.url) {
                setFormData(prev => ({
                    ...prev,
                    template: { 
                        ...prev.template, 
                        mediaUrl: res.url, 
                        mediaType: res.mediaType 
                    }
                }));
                toast.success('Media uploaded successfully');
            } else {
                toast.error('Upload failed: No URL returned');
            }
        } catch (err) {
            // Error handled by hook
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
                                        enabled={formData.aiRewriteEnabled}
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
                            
                            {formData.channel === 'whatsapp' && formData.template.mediaUrl && (
                                <div className="mb-6 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950/50 aspect-video flex items-center justify-center relative group">
                                    {formData.template.mediaType === 'image' ? (
                                        <img 
                                            src={formData.template.mediaUrl} 
                                            alt="Campaign Media" 
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <video 
                                            src={formData.template.mediaUrl} 
                                            controls 
                                            className="w-full h-full"
                                        />
                                    )}
                                    <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                                        {formData.template.mediaType === 'image' ? <FiImage size={10} /> : <FiVideo size={10} />}
                                        {formData.template.mediaType} Preview
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, template: { ...formData.template, mediaUrl: '', mediaType: null } });
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="absolute top-2 right-2 p-1.5 rounded bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-500 backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                                        title="Remove Media"
                                    >
                                        <FiX size={14} />
                                    </button>
                                </div>
                            )}

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

                            <div ref={textareaRef}>
                                <PremiumTextarea 
                                    label="Message Template"
                                    placeholder="Hi {{name}}, I wanted to follow up regarding your interest in {{inquiry_for}}..."
                                    rows={6}
                                    value={formData.template.body}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        template: { ...formData.template, body: e.target.value } 
                                    })}
                                    required
                                />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {[
                                    { label: 'Name', key: 'name' },
                                    { label: 'Phone', key: 'phone' },
                                    { label: 'Address', key: 'address' },
                                    { label: 'Project Name', key: 'inquiry_for' },
                                    { label: 'Agent Name', key: 'agent_name' }
                                ].map(v => (
                                    <button
                                        key={v.key}
                                        type="button"
                                        onClick={() => insertVariable(v.key)}
                                        className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[10px] font-mono text-yellow-500 hover:border-yellow-500/50 transition-colors"
                                    >
                                        {`{{${v.key}}}`}
                                    </button>
                                ))}
                            </div>

                            {formData.channel === 'whatsapp' && (
                                 <div className="mt-8 pt-8 border-t border-zinc-800">
                                     <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Media Attachment (Optional)</h3>
                                     
                                     {!formData.template.mediaUrl ? (
                                         <div className="flex flex-col gap-4">
                                             <input 
                                                 type="file" 
                                                 ref={fileInputRef}
                                                 className="hidden" 
                                                 accept="image/*,video/*"
                                                 onChange={handleFileChange}
                                             />
                                             <button
                                                 type="button"
                                                 disabled={uploadMediaMutation.isPending}
                                                 onClick={() => fileInputRef.current?.click()}
                                                 className={`flex flex-col items-center justify-center gap-4 p-10 rounded-xl border-2 border-dashed transition-all group ${
                                                     uploadMediaMutation.isPending 
                                                     ? 'border-zinc-800 bg-zinc-900/50 cursor-not-allowed' 
                                                     : 'border-zinc-800 bg-zinc-950 hover:border-yellow-600/50 hover:bg-yellow-600/5'
                                                 }`}
                                             >
                                                 {uploadMediaMutation.isPending ? (
                                                     <div className="flex flex-col items-center gap-3">
                                                         <div className="w-8 h-8 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                                                         <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Uploading Media...</span>
                                                     </div>
                                                 ) : (
                                                     <>
                                                         <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                             <FiUploadCloud className="text-zinc-500 group-hover:text-yellow-500" size={24} />
                                                         </div>
                                                         <div className="text-center">
                                                             <p className="text-sm font-bold text-zinc-300 mb-1">Click to upload media</p>
                                                             <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Support Image (JPG, PNG) or Video (MP4)</p>
                                                         </div>
                                                     </>
                                                 )}
                                             </button>
                                         </div>
                                     ) : (
                                         <div className="relative p-5 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center gap-5 group">
                                             <div className="w-16 h-16 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-800 overflow-hidden">
                                                 {formData.template.mediaType === 'image' ? (
                                                     <img src={formData.template.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                                 ) : (
                                                     <div className="flex flex-col items-center gap-1">
                                                         <FiVideo className="text-yellow-500" size={20} />
                                                         <span className="text-[8px] font-bold text-zinc-500">VIDEO</span>
                                                     </div>
                                                 )}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <div className="flex items-center gap-2 mb-1">
                                                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                                     <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                                                         {formData.template.mediaType === 'image' ? 'Image Ready' : 'Video Ready'}
                                                     </p>
                                                 </div>
                                                 <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{formData.template.mediaUrl}</p>
                                             </div>
                                             <button
                                                 type="button"
                                                 onClick={() => {
                                                     setFormData({ ...formData, template: { ...formData.template, mediaUrl: '', mediaType: null } });
                                                     if (fileInputRef.current) fileInputRef.current.value = '';
                                                 }}
                                                 className="p-2.5 bg-zinc-900 rounded-lg text-zinc-500 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 border border-zinc-800 transition-all active:scale-95"
                                                 title="Remove Media"
                                             >
                                                 <FiX size={18} />
                                             </button>
                                         </div>
                                     )}
                                 </div>
                             )}
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
                                                    <td className="p-3 text-zinc-400">{lead.phone}</td>
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
