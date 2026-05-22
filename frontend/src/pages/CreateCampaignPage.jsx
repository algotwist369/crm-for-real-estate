import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCampaign, useUploadCampaignMedia, useImportLeads } from '../hooks/useCampaignHooks';
import { useLeadsMinimal } from '../hooks/useLeadHooks';
import { PremiumInput } from '../component/common/PremiumInput';
import { PremiumTextarea } from '../component/common/PremiumTextarea';
import { PremiumToggle } from '../component/common/PremiumToggle';
import { SearchFilter } from '../component/common/SearchFilter';
import AppLayout from '../component/layout/AppLayout';
import { FiMessageSquare, FiMail, FiChevronLeft, FiZap, FiCheck, FiImage, FiVideo, FiX, FiUploadCloud, FiDownload } from 'react-icons/fi';
import campaignService from '../api/campaign.service';
import toast from 'react-hot-toast';

const CreateCampaignPage = () => {
    const navigate = useNavigate();
    const createCampaignMutation = useCreateCampaign();
    const uploadMediaMutation = useUploadCampaignMedia();
    const importLeadsMutation = useImportLeads();
    const { data: leadsData, isLoading: leadsLoading } = useLeadsMinimal();
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const excelInputRef = useRef(null);

    const handleExcelTemplateDownload = async () => {
        try {
            toast.loading('Downloading template...', { id: 'download-template' });
            const blob = await campaignService.downloadTemplate();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'campaign_leads_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('Template downloaded successfully', { id: 'download-template' });
        } catch (error) {
            toast.error('Failed to download template', { id: 'download-template' });
        }
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Verify it is an Excel file
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
            toast.error('Please upload an Excel file (.xlsx or .xls)');
            return;
        }

        const formDataExcel = new FormData();
        formDataExcel.append('file', file);

        try {
            const res = await importLeadsMutation.mutateAsync(formDataExcel);
            console.log('Import response:', res);
            
            if (res.success && res.data && res.data.length > 0) {
                // Collect imported lead IDs
                const importedIds = res.data.map(lead => lead._id.toString());
                
                // Add them to selectedLeads
                setSelectedLeads(prev => {
                    const nextSelection = [...prev];
                    importedIds.forEach(id => {
                        if (!nextSelection.includes(id)) {
                            nextSelection.push(id);
                        }
                    });
                    return nextSelection;
                });

                toast.success(`Successfully imported and pre-selected ${res.data.length} leads!`);
            }
        } catch (err) {
            // Error toast handled by hook
        } finally {
            // Reset input file value to allow uploading same file again
            if (excelInputRef.current) {
                excelInputRef.current.value = '';
            }
        }
    };
    
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
            minDelay: 45,
            maxDelay: 210,
            batchSize: 20,
            batchPause: 300
        },
        aiRewriteEnabled: false
    });
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [useExistingLeads, setUseExistingLeads] = useState(true);
    const [useExcelLeads, setUseExcelLeads] = useState(false);

    const leads = leadsData?.data || [];
    console.log("leads ", leads);
    
    const filteredLeads = useMemo(() => {
        if (!useExistingLeads) return [];
        return leads.filter(lead => {
            const matchesSearch = 
                !searchTerm ||
                lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.inquiry_for?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = 
                typeFilter === 'All' ||
                lead.type?.toLowerCase() === typeFilter.toLowerCase();

            return matchesSearch && matchesType;
        });
    }, [leads, searchTerm, typeFilter, useExistingLeads]);

    const visibleLeadIds = useMemo(() => filteredLeads.map(l => l._id.toString()), [filteredLeads]);
    const allVisibleSelected = useMemo(() => {
        return visibleLeadIds.length > 0 && visibleLeadIds.every(id => selectedLeads.includes(id));
    }, [visibleLeadIds, selectedLeads]);

    const handleLeadSelection = (leadId) => {
        setSelectedLeads(prev => 
            prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]
        );
    };

    const handleSelectAll = () => {
        if (allVisibleSelected) {
            setSelectedLeads(prev => prev.filter(id => !visibleLeadIds.includes(id)));
        } else {
            setSelectedLeads(prev => {
                const nextSelection = [...prev];
                visibleLeadIds.forEach(id => {
                    if (!nextSelection.includes(id)) {
                        nextSelection.push(id);
                    }
                });
                return nextSelection;
            });
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

                            <div className="mt-4 pt-4 border-t border-zinc-800/60 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* Left column: Variables */}
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">Variables</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { label: 'Name', key: 'name' },
                                            { label: 'Phone', key: 'phone' },
                                            { label: 'Project Name', key: 'inquiry_for' },
                                            { label: 'Agent Name', key: 'agent_name' }
                                        ].map(v => (
                                            <button
                                                key={v.key}
                                                type="button"
                                                onClick={() => insertVariable(v.key)}
                                                className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-mono text-yellow-500 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all duration-200"
                                            >
                                                {`{{${v.key}}}`}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-zinc-500 mt-2.5 uppercase tracking-wider">Click a variable to insert it at cursor position</p>
                                </div>

                                {/* Right column: Media Attachment Card */}
                                {formData.channel === 'whatsapp' && (
                                    <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between min-h-[90px]">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="block text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Media Attachment</label>
                                            <span className="text-[8px] bg-zinc-850 px-1.5 py-0.5 rounded text-zinc-500 uppercase font-bold tracking-widest">Optional</span>
                                        </div>

                                        {!formData.template.mediaUrl ? (
                                            <div className="relative">
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
                                                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-dashed text-left transition-all group ${
                                                        uploadMediaMutation.isPending 
                                                        ? 'border-zinc-800 bg-zinc-900/50 cursor-not-allowed' 
                                                        : 'border-zinc-800 bg-zinc-950 hover:border-yellow-600/50 hover:bg-yellow-600/5'
                                                    }`}
                                                >
                                                    {uploadMediaMutation.isPending ? (
                                                        <div className="flex items-center gap-2 py-0.5">
                                                            <div className="w-3.5 h-3.5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Uploading...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2.5">
                                                                <FiUploadCloud className="text-zinc-500 group-hover:text-yellow-500 transition-colors" size={16} />
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-zinc-300">Add Image/Video</p>
                                                                    <p className="text-[8px] text-zinc-600 uppercase tracking-widest">JPG, PNG, MP4</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] text-yellow-500 font-bold group-hover:underline">Browse</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center gap-3 group">
                                                <div className="w-10 h-10 rounded-md bg-zinc-900 flex items-center justify-center border border-zinc-800 overflow-hidden shrink-0">
                                                    {formData.template.mediaType === 'image' ? (
                                                        <img src={formData.template.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center">
                                                            <FiVideo className="text-yellow-500" size={16} />
                                                            <span className="text-[6px] font-bold text-zinc-600 mt-0.5">MP4</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                        <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">
                                                            {formData.template.mediaType === 'image' ? 'Image Ready' : 'Video Ready'}
                                                        </p>
                                                    </div>
                                                    <p className="text-[9px] text-zinc-500 truncate">{formData.template.mediaUrl}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, template: { ...formData.template, mediaUrl: '', mediaType: null } });
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    className="p-1.5 bg-zinc-900 hover:bg-red-500/20 hover:border-red-500/50 border border-zinc-800 text-zinc-500 hover:text-red-500 rounded-lg transition-all"
                                                    title="Remove Media"
                                                >
                                                    <FiX size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                                    Target Leads ({selectedLeads.length})
                                </h2>
                                {useExistingLeads && (
                                    <button 
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-[10px] uppercase tracking-widest text-yellow-500 font-bold hover:text-yellow-400 transition-colors"
                                    >
                                        {allVisibleSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                )}
                            </div>

                            {/* Lead Source Options Checkboxes */}
                            <div className="flex flex-wrap items-center gap-6 mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
                                <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Outreach Sources:</div>
                                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none group">
                                    <input 
                                        type="checkbox"
                                        checked={useExistingLeads}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setUseExistingLeads(checked);
                                            if (!checked) {
                                                // Clear selected leads when turning off DB leads
                                                setSelectedLeads([]);
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-yellow-600 focus:ring-0 focus:ring-offset-0 accent-yellow-600 cursor-pointer"
                                    />
                                    <span className="group-hover:text-white transition-colors">Use Existing Leads</span>
                                </label>
                                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none group">
                                    <input 
                                        type="checkbox"
                                        checked={useExcelLeads}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setUseExcelLeads(checked);
                                            if (!checked && !useExistingLeads) {
                                                // Clear selected leads if both are off
                                                setSelectedLeads([]);
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-yellow-600 focus:ring-0 focus:ring-offset-0 accent-yellow-600 cursor-pointer"
                                    />
                                    <span className="group-hover:text-white transition-colors">Upload from Excel</span>
                                </label>
                            </div>

                            {/* Premium Excel Import Area */}
                            {useExcelLeads && (
                                <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                                        <h3 className="text-xs font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                                            Import Campaign Leads from Excel
                                        </h3>
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                                            Upload an Excel sheet to bulk-populate target leads
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleExcelTemplateDownload}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-white transition-all duration-200"
                                            title="Download Example Spreadsheet Template"
                                        >
                                            <FiDownload size={12} className="text-yellow-500" />
                                            Template
                                        </button>
                                        
                                        <input 
                                            type="file"
                                            ref={excelInputRef}
                                            className="hidden"
                                            accept=".xlsx, .xls"
                                            onChange={handleExcelUpload}
                                        />
                                        <button
                                            type="button"
                                            disabled={importLeadsMutation.isPending}
                                            onClick={() => excelInputRef.current?.click()}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded border font-bold text-[10px] uppercase tracking-widest transition-all duration-200 shadow-md ${
                                                importLeadsMutation.isPending
                                                ? 'border-zinc-800 bg-zinc-900 text-zinc-500 cursor-not-allowed'
                                                : 'border-yellow-600/50 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 hover:text-yellow-400'
                                            }`}
                                        >
                                            {importLeadsMutation.isPending ? (
                                                <>
                                                    <div className="w-3 h-3 border border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                                                    Importing...
                                                </>
                                            ) : (
                                                <>
                                                    <FiUploadCloud size={12} />
                                                    Upload Excel
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {useExistingLeads && (
                                <>
                                    <SearchFilter 
                                        searchValue={searchTerm}
                                        onSearchChange={(e) => setSearchTerm(e.target.value)}
                                        searchPlaceholder="Search leads by name, phone..."
                                        filterValue={typeFilter}
                                        onFilterChange={(e) => setTypeFilter(e.target.value)}
                                        filterOptions={['All', 'Buyer', 'Seller', 'Owner', 'Tenant', 'Investor', 'Listing', 'Broker', 'Other']}
                                    />
                                    
                                    <div className="max-h-80 overflow-y-auto border border-zinc-800 rounded scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent mt-4">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800">
                                                <tr>
                                                    <th className="p-3 w-10"></th>
                                                    <th className="p-3 text-zinc-500 font-medium">Lead Name</th>
                                                    <th className="p-3 text-zinc-500 font-medium">Contact</th>
                                                    <th className="p-3 text-zinc-500 font-medium">Type</th>
                                                    <th className="p-3 text-zinc-500 font-medium">Outreach Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800/50">
                                                {leadsLoading ? (
                                                    <tr><td colSpan="5" className="p-10 text-center text-zinc-500">Loading leads...</td></tr>
                                                ) : filteredLeads.length > 0 ? (
                                                    filteredLeads.map((lead) => (
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
                                                            <td className="p-3 text-zinc-400">{lead.type || '—'}</td>
                                                            <td className="p-3">
                                                                {lead.messageSentCount && lead.messageSentCount > 0 ? (
                                                                    <span 
                                                                        title={`Campaigns: ${lead.campaignNames?.join(', ') || 'None'}`}
                                                                        className="relative group inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-semibold bg-green-500/10 text-green-400 border-green-500/20 cursor-help"
                                                                    >
                                                                        <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                                                                        Sent ({lead.messageSentCount}x)
                                                                        
                                                                        {lead.campaignNames && lead.campaignNames.length > 0 && (
                                                                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] p-2 rounded-lg shadow-xl backdrop-blur-md z-50 text-center pointer-events-none transition-all duration-200">
                                                                                <span className="font-bold text-yellow-500 block mb-1">Campaigns:</span>
                                                                                <span className="block break-words">{lead.campaignNames.join(', ')}</span>
                                                                                <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-950"></span>
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-semibold bg-zinc-500/5 text-zinc-500 border-zinc-800">
                                                                        <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                                                                        Not Sent
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan="5" className="p-10 text-center text-zinc-500 italic">No leads match filter criteria</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {!useExistingLeads && !useExcelLeads && (
                                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-800/80 rounded-xl bg-zinc-950/20 backdrop-blur-sm">
                                    <FiUploadCloud className="text-zinc-600 mb-3 animate-bounce" size={32} />
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">No Outreach Sources Selected</p>
                                    <p className="text-[10px] text-zinc-500 max-w-[280px]">Select "Use Existing Leads" or "Upload from Excel" above to start populating your outreach target list.</p>
                                </div>
                            )}
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
