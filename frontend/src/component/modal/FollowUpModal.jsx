import React, { useState, useEffect } from "react";
import { PremiumInput } from "../common/PremiumInput";
import { PremiumButton } from "../common/PremiumButton";
import { PremiumTabs } from "../common/PremiumTabs";
import { PremiumTextarea } from "../common/PremiumTextarea";
import { FiX, FiMessageSquare, FiCalendar, FiClock, FiUser, FiSmartphone, FiMail, FiTarget, FiDollarSign, FiShare2, FiHome } from "react-icons/fi";

const FOLLOWUP_PRESETS = [
    { label: "Yesterday", value: -1 },
    { label: "Today", value: 0 },
    { label: "Tomorrow", value: 1 },
    { label: "5 Days", value: 5 },
    { label: "7 Days", value: 7 },
    { label: "1 Month", value: 30 },
    { label: "3 Month", value: 90 },
    { label: "Custom", value: null }
];

const PRESET_LABELS = FOLLOWUP_PRESETS.map(p => p.label);
const AGENTS = ["Admin", "Agent 1", "Agent 2", "Agent 3"];
const STATUSES = ["Pending", "Done"];

const FollowUpModal = ({ isOpen, onClose, onSave, lead }) => {
    const [formData, setFormData] = useState({
        remarks: "",
        followUpPreset: "",
        followUpDate: "",
        followedBy: AGENTS[0],
        status: "Pending",
        isCustomFollowUp: false
    });

    useEffect(() => {
        if (lead && isOpen) {
            queueMicrotask(() => {
                setFormData({
                    remarks: lead.remarks || "",
                    followUpPreset: "",
                    followUpDate: lead.followUpDate || "",
                    followedBy: lead.followedBy || AGENTS[0],
                    status: lead.followUpStatus || "Pending",
                    isCustomFollowUp: false
                });
            });
        }
    }, [lead, isOpen]);

    if (!isOpen || !lead) return null;

    const handleFollowUpPreset = (presetLabel) => {
        const preset = FOLLOWUP_PRESETS.find(p => p.label === presetLabel);
        if (presetLabel === "Custom") {
            setFormData(prev => ({
                ...prev,
                followUpPreset: presetLabel,
                isCustomFollowUp: true
            }));
            return;
        }

        const date = new Date();
        date.setDate(date.getDate() + preset.value);
        const dateString = date.toISOString().split('T')[0];

        setFormData(prev => ({
            ...prev,
            followUpPreset: presetLabel,
            followUpDate: dateString,
            isCustomFollowUp: false
        }));
    };

    const handleSave = (e) => {
        if (e) e.preventDefault();
        onSave(lead.id, {
            remarks: formData.remarks,
            followUpDate: formData.followUpDate,
            followedBy: formData.followedBy,
            followUpStatus: formData.status
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-lg shadow-blue-500/5">
                            <FiClock size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight leading-none mb-1.5">Lead Interaction & Follow-up</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wider">ID: {lead.id}</span>
                                <p className="text-sm text-zinc-500 font-medium">{lead.name}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
                        <FiX size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
                        {/* Left Pane: Lead Context (2/5) */}
                        <div className="lg:col-span-2 bg-zinc-950/40 border-r border-zinc-800/50 p-8 space-y-8">
                            <div className="space-y-6">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] block">Client Information</label>
                                
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 group transition-all hover:bg-zinc-900 hover:border-zinc-700/50">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-blue-400 group-hover:bg-blue-600/10 transition-all shrink-0">
                                            <FiSmartphone size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Contact Number</p>
                                            <p className="text-sm font-semibold text-zinc-200">{lead.phone || "Not Provided"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 group transition-all hover:bg-zinc-900 hover:border-zinc-700/50">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-blue-400 group-hover:bg-blue-600/10 transition-all shrink-0">
                                            <FiMail size={18} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-0.5">Email Address</p>
                                            <p className="text-sm font-semibold text-zinc-200 truncate">{lead.email || "Not Provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] block">Inquiry Details</label>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
                                        <div className="flex items-center gap-3">
                                            <FiTarget className="text-zinc-500" size={14} />
                                            <span className="text-xs font-medium text-zinc-400">Requirement</span>
                                        </div>
                                        <span className="text-xs font-bold text-blue-400">{lead.requirement}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
                                        <div className="flex items-center gap-3">
                                            <FiDollarSign className="text-zinc-500" size={14} />
                                            <span className="text-xs font-medium text-zinc-400">Budget Range</span>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-400">{lead.budget}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
                                        <div className="flex items-center gap-3">
                                            <FiShare2 className="text-zinc-500" size={14} />
                                            <span className="text-xs font-medium text-zinc-400">Leads Source</span>
                                        </div>
                                        <span className="text-[10px] font-bold bg-zinc-800 text-zinc-300 px-2 py-1 rounded uppercase">{lead.source}</span>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/30 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <FiHome className="text-zinc-500" size={14} />
                                            <span className="text-xs font-medium text-zinc-400">Interested Properties</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(lead.properties || "").split(",").map((prop, idx) => (
                                                <span key={idx} className="text-[10px] font-bold bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 px-2.5 py-1 rounded-lg">
                                                    {prop.trim() || "None"}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Pane: Form (3/5) */}
                        <div className="lg:col-span-3 p-8">
                            <form onSubmit={handleSave} className="space-y-8 h-full flex flex-col">
                                <div className="space-y-8 flex-1">
                                    {/* Performed By Section */}
                                    <PremiumTabs
                                        label="Task Performed By"
                                        options={AGENTS}
                                        value={formData.followedBy}
                                        onChange={(val) => setFormData(prev => ({ ...prev, followedBy: val }))}
                                    />

                                    {/* Interaction Remarks */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] block">Interaction Details</label>
                                        <PremiumTextarea
                                            label=""
                                            placeholder="Write interaction summary, client feedback or next steps..."
                                            value={formData.remarks}
                                            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                            icon={<FiMessageSquare />}
                                            minHeight="120px"
                                        />
                                    </div>

                                    {/* Follow-up Date Section */}
                                    <div className="space-y-4">
                                        <PremiumTabs
                                            label="Next Follow-up Reminder"
                                            options={PRESET_LABELS}
                                            value={formData.followUpPreset}
                                            onChange={handleFollowUpPreset}
                                        />
                                        
                                        <div className="relative mt-4 group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-blue-500 transition-colors">
                                                <FiCalendar size={18} />
                                            </div>
                                            <input
                                                type="date"
                                                name="followUpDate"
                                                value={formData.followUpDate}
                                                onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value, followUpPreset: 'Custom', isCustomFollowUp: true }))}
                                                readOnly={!formData.isCustomFollowUp && formData.followUpPreset !== 'Custom'}
                                                className={`w-full bg-zinc-950 border border-zinc-800 text-white text-base rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${formData.isCustomFollowUp || formData.followUpPreset === 'Custom' ? "focus:border-blue-500/50 cursor-text shadow-lg shadow-blue-500/5" : "opacity-60 cursor-not-allowed"
                                                    }`}
                                            />
                                            {!formData.isCustomFollowUp && formData.followUpPreset && (
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500 uppercase tracking-[0.1em] pointer-events-none bg-blue-500/10 px-2 py-1 rounded">Auto-calculated</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Follow-up Status */}
                                    <PremiumTabs
                                        label="Interaction Status"
                                        options={STATUSES}
                                        value={formData.status}
                                        onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                        variant="priority"
                                    />
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-8 border-t border-zinc-800 flex items-center justify-end gap-4 mt-auto">
                                    <div className="flex-1">
                                        <PremiumButton
                                            text="Cancel"
                                            type="button"
                                            variant="secondary"
                                            onClick={onClose}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <PremiumButton
                                            text="Set Follow-up"
                                            type="submit"
                                            variant="primary"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FollowUpModal;
