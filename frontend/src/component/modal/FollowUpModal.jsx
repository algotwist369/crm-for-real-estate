import React, { useState, useEffect, useRef } from "react";
import { FiX, FiCalendar, FiClock, FiSmartphone, FiMail, FiTarget, FiDollarSign, FiShare2 } from "react-icons/fi";
import { useSetFollowUp, useCompleteFollowUp } from "../../hooks/useLeadHooks";

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

const toLocalDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toLocalTime = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const FollowUpModal = ({ isOpen, onClose, onSave, lead }) => {
    const dateInputRef = useRef(null);
    const timeInputRef = useRef(null);
    const [formData, setFormData] = useState({
        remarks: "",
        followUpPreset: "",
        date: "",
        time: "",
        status: "Pending",
        isCustomFollowUp: false
    });

    const setFollowUpMutation = useSetFollowUp();
    const completeFollowUpMutation = useCompleteFollowUp();

    useEffect(() => {
        if (lead && isOpen) {
            queueMicrotask(() => {
                let dStr = "";
                let tStr = "";
                if (lead.next_follow_up_date) {
                    dStr = toLocalDate(lead.next_follow_up_date);
                    tStr = toLocalTime(lead.next_follow_up_date);
                }

                setFormData({
                    remarks: lead.remarks || "",
                    followUpPreset: "",
                    date: dStr,
                    time: tStr,
                    status: (lead.follow_up_status || "Pending").charAt(0).toUpperCase() + (lead.follow_up_status || "Pending").slice(1),
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
        const dStr = toLocalDate(date);
        
        // If time is not set, default to 10:00 AM
        const tStr = formData.time || "10:00";

        setFormData(prev => ({
            ...prev,
            followUpPreset: presetLabel,
            date: dStr,
            time: tStr,
            isCustomFollowUp: false
        }));
    };

    const handleSave = (e) => {
        if (e) e.preventDefault();

        const isDone = formData.status === "Done";

        const payload = {
            remarks: formData.remarks,
        };

        if (isDone) {
            completeFollowUpMutation.mutate({ id: lead._id, data: payload }, {
                onSuccess: () => {
                    if (onSave) onSave();
                    onClose();
                }
            });
        } else {
            if (formData.date && formData.time) {
                payload.next_follow_up_date = new Date(`${formData.date}T${formData.time}`).toISOString();
            } else if (formData.date) {
                payload.next_follow_up_date = new Date(formData.date).toISOString();
            }
            payload.follow_up_status = "pending";

            setFollowUpMutation.mutate({ id: lead._id, data: payload }, {
                onSuccess: () => {
                    if (onSave) onSave();
                    onClose();
                }
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80">
            <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                            <FiClock size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-white mb-0.5">Lead Interaction & Follow-up</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 uppercase tracking-wider">ID: {lead._id.substr(-6)}</span>
                                <span className="text-zinc-700 px-1">•</span>
                                <span className="text-sm font-medium text-zinc-300">{lead.name}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                        <FiX size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
                        {/* Left Pane: Lead Context (2/5) */}
                        <div className="lg:col-span-2 bg-zinc-950/20 border-r border-zinc-800 p-6 space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Client Information</label>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-start gap-3 p-3 rounded bg-zinc-900/50 border border-zinc-800">
                                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                                            <FiSmartphone size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Contact Number</p>
                                            <p className="text-sm text-zinc-200">{lead.phone || "Not Provided"}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 rounded bg-zinc-900/50 border border-zinc-800">
                                        <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                                            <FiMail size={16} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Email Address</p>
                                            <p className="text-sm text-zinc-200 truncate">{lead.email || "Not Provided"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Inquiry Details</label>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded bg-zinc-900/50 border border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <FiTarget className="text-zinc-500" size={14} />
                                            <span className="text-sm text-zinc-400">Requirement</span>
                                        </div>
                                        <span className="text-sm text-zinc-200">{lead.requirement}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded bg-zinc-900/50 border border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <FiDollarSign className="text-zinc-500" size={14} />
                                            <span className="text-sm text-zinc-400">Budget Range</span>
                                        </div>
                                        <span className="text-sm text-zinc-200">{lead.budget}</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded bg-zinc-900/50 border border-zinc-800">
                                        <div className="flex items-center gap-2">
                                            <FiShare2 className="text-zinc-500" size={14} />
                                            <span className="text-sm text-zinc-400">Source</span>
                                        </div>
                                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wider border border-zinc-700">{lead.source}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Timeline & Schedule</label>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <FiCalendar className="text-zinc-100" size={14} />
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-tight">Lead Created At</p>
                                            <p className="text-xs text-zinc-300 font-medium">{new Date(lead.createdAt).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <FiClock className="text-zinc-100" size={14} />
                                        <div>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-tight">Active Follow-up</p>
                                            <p className="text-xs text-yellow-400 font-semibold">{lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Not Scheduled"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Pane: Form (3/5) */}
                        <div className="lg:col-span-3 p-6">
                            <form onSubmit={handleSave} className="space-y-6 h-full flex flex-col">
                                <div className="space-y-6 flex-1">
                                    {/* Interaction Remarks */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Interaction Remarks</label>
                                        <textarea
                                            placeholder="Write summary of the conversation..."
                                            value={formData.remarks}
                                            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded p-3 focus:outline-none focus:border-zinc-700 min-h-[140px] resize-none placeholder:text-zinc-700"
                                        />
                                    </div>

                                    {/* Follow-up Status */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Follow-up Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded p-3 focus:outline-none focus:border-zinc-700 cursor-pointer"
                                        >
                                            <option value="Pending">Still Pending (Next Follow-up required)</option>
                                            <option value="Done">Completed (No further follow-up)</option>
                                        </select>
                                    </div>

                                    {/* Follow-up Date Section */}
                                    {formData.status === "Pending" && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Schedule Next Follow-up</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <select
                                                    value={formData.followUpPreset || "Custom"}
                                                    onChange={(e) => handleFollowUpPreset(e.target.value)}
                                                    className="bg-zinc-950 border border-zinc-800 text-white text-sm rounded p-3 focus:outline-none focus:border-zinc-700 cursor-pointer"
                                                >
                                                    {PRESET_LABELS.map(preset => (
                                                        <option key={preset} value={preset}>{preset}</option>
                                                    ))}
                                                </select>

                                                <div className="relative">
                                                    <div 
                                                        onClick={() => {
                                                            if (!(!formData.isCustomFollowUp && formData.followUpPreset !== 'Custom') && dateInputRef.current) {
                                                                if (typeof dateInputRef.current.showPicker === 'function') dateInputRef.current.showPicker();
                                                                else dateInputRef.current.click();
                                                            }
                                                        }}
                                                        className={`absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-100 ${!formData.isCustomFollowUp && formData.followUpPreset !== 'Custom' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                    >
                                                        <FiCalendar size={14} />
                                                    </div>
                                                    <input
                                                        ref={dateInputRef}
                                                        type="date"
                                                        value={formData.date}
                                                        readOnly={!formData.isCustomFollowUp && formData.followUpPreset !== 'Custom'}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value, followUpPreset: 'Custom', isCustomFollowUp: true }))}
                                                        className={`w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-10 pr-3 py-3 focus:outline-none ${!formData.isCustomFollowUp && formData.followUpPreset !== 'Custom' ? 'opacity-60 cursor-not-allowed' : 'focus:border-zinc-700 cursor-text'}`}
                                                    />
                                                </div>

                                                <div className="relative">
                                                    <div 
                                                        onClick={() => {
                                                            if (timeInputRef.current) {
                                                                if (typeof timeInputRef.current.showPicker === 'function') timeInputRef.current.showPicker();
                                                                else timeInputRef.current.click();
                                                            }
                                                        }}
                                                        className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer text-zinc-100"
                                                    >
                                                        <FiClock size={14} />
                                                    </div>
                                                    <input
                                                        ref={timeInputRef}
                                                        type="time"
                                                        value={formData.time}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                                        className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-10 pr-3 py-3 focus:outline-none focus:border-zinc-700 cursor-text"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="pt-6 border-t border-zinc-800 flex items-center justify-end gap-3 mt-auto">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700/80 transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={setFollowUpMutation.isPending || completeFollowUpMutation.isPending}
                                        className="px-6 py-2.5 rounded bg-yellow-600 text-sm font-medium text-white hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                                    >
                                        {setFollowUpMutation.isPending || completeFollowUpMutation.isPending ? "Syncing..." : "Update Feedback"}
                                    </button>
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
