import { PremiumCheckbox } from "../common/PremiumCheckbox";
import React, { useState, useEffect } from "react";
import { PremiumInput } from "../common/PremiumInput";
import { PremiumButton } from "../common/PremiumButton";
import { FiX, FiUser, FiSmartphone, FiMail, FiTarget, FiDollarSign, FiShare2 } from "react-icons/fi";
import { PremiumTabs } from "../common/PremiumTabs";

const REQUIREMENTS = ["1BHK Flat", "2BHK Flat", "3BHK Flat", "Villa", "Plot", "Office Space", "Commercial Shop", "Penthouse", "Studio Flat"];
const SOURCES = ["Facebook", "Instagram", "Google Ads", "Website", "Walk-in", "Referral", "Personal"];
const AGENTS = ["Rahul Sharma", "Priya Verma", "Amit Patel", "Neha Singh", "Vikas Gupta", "Rohit Jain", "Arjun Mehta", "Karan Kapoor", "Sanjay Rao", "Deepika Nair"];
const CLIENT_TYPES = ["Rent", "Buying", "Investing"];

const EditLeadModal = ({ isOpen, onClose, onUpdate, lead }) => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        requirements: [],
        otherRequirement: "",
        budget: "",
        isCustomBudget: false,
        source: "",
        assignedAgents: [],
        priority: "",
        status: "",
        clientType: "Buying",
    });

    useEffect(() => {
        if (lead && isOpen) {
            // Parse existing requirements string
            const existingReqs = lead.requirement ? lead.requirement.split(", ").map(r => r.trim()) : [];
            const standardReqs = existingReqs.filter(r => REQUIREMENTS.includes(r));
            const otherReqs = existingReqs.filter(r => !REQUIREMENTS.includes(r)).join(", ");

            // Parse existing agents string
            const existingAgents = lead.assignedTo ? lead.assignedTo.split(", ").map(a => a.trim()) : [];
            const standardAgents = existingAgents.filter(a => AGENTS.includes(a));

            // Check if budget is one of the standard options
            const standardBudgets = ["₹20L - ₹50L", "₹50L - ₹1Cr", "₹1Cr - ₹2Cr", "₹2Cr - ₹5Cr", "₹5Cr+"];
            const isCustomBudget = lead.budget && !standardBudgets.includes(lead.budget);

            setFormData({
                name: lead.name || "",
                phone: lead.phone || "",
                email: lead.email || "",
                requirements: standardReqs,
                otherRequirement: otherReqs,
                budget: lead.budget || "",
                isCustomBudget: isCustomBudget,
                source: lead.source || SOURCES[0],
                assignedAgents: standardAgents.length > 0 ? standardAgents : [AGENTS[0]],
                priority: lead.priority || "Medium",
                status: lead.status || "New",
                clientType: lead.clientType || "Buying",
            });
        }
    }, [lead, isOpen]);

    if (!isOpen) return null;

    const toggleRequirement = (req) => {
        setFormData(prev => {
            const requirements = prev.requirements.includes(req)
                ? prev.requirements.filter(r => r !== req)
                : [...prev.requirements, req];
            return { ...prev, requirements };
        });
    };

    const toggleAgent = (agent) => {
        setFormData(prev => {
            const assignedAgents = prev.assignedAgents.includes(agent)
                ? prev.assignedAgents.filter(a => a !== agent)
                : [...prev.assignedAgents, agent];
            return { ...prev, assignedAgents };
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let finalRequirements = [...formData.requirements];
        if (formData.otherRequirement.trim()) {
            finalRequirements.push(formData.otherRequirement.trim());
        }

        onUpdate({ 
            ...lead, 
            ...formData,
            requirement: finalRequirements.join(", ") || "Not Specified",
            budget: formData.isCustomBudget ? formData.budget : (formData.budget || "Not Specified"),
            assignedTo: formData.assignedAgents.join(", ") || "Unassigned"
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">Edit Lead Details</h2>
                        <p className="text-xs text-zinc-500 mt-1">Update information for {lead?.name}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                        
                        {/* Section: Status & Client Type */}
                        <div className="space-y-4 pb-4 border-b border-zinc-900">
                            <PremiumTabs 
                                label="Pipeline Status"
                                options={["New", "Follow-up", "Closed", "Lost", "Wasted"]}
                                value={formData.status}
                                onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                            />
                            
                            <PremiumTabs 
                                label="Inquiry For"
                                options={CLIENT_TYPES}
                                value={formData.clientType}
                                onChange={(val) => setFormData(prev => ({ ...prev, clientType: val }))}
                                variant="indigo"
                            />
                        </div>

                        {/* Section: Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <PremiumInput 
                                label="Lead Name" 
                                value={formData.name} 
                                onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value }})}
                                icon={<FiUser />}
                            />
                            <PremiumInput 
                                label="Phone Number" 
                                value={formData.phone} 
                                onChange={(e) => handleChange({ target: { name: 'phone', value: e.target.value }})}
                                icon={<FiSmartphone />}
                            />
                        </div>

                        <PremiumInput 
                            label="Email Address" 
                            type="email"
                            value={formData.email} 
                            onChange={(e) => handleChange({ target: { name: 'email', value: e.target.value }})}
                            icon={<FiMail />}
                        />

                        {/* Section: Requirements */}
                        <div className="pt-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Property Requirement (Select Multiple)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {REQUIREMENTS.map(req => (
                                    <button
                                        key={req}
                                        type="button"
                                        onClick={() => toggleRequirement(req)}
                                        className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all duration-200 ${
                                            formData.requirements.includes(req) 
                                            ? "bg-blue-600/20 border-blue-500/50 text-blue-400" 
                                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                        }`}
                                    >
                                        {req}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3">
                                <PremiumInput 
                                    label="Other Requirement / Manual Add" 
                                    placeholder="Enter custom requirement..." 
                                    value={formData.otherRequirement} 
                                    onChange={(e) => handleChange({ target: { name: 'otherRequirement', value: e.target.value }})}
                                    icon={<FiTarget />}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Budget Range</label>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isCustomBudget: !prev.isCustomBudget, budget: "" }))}
                                        className="text-[10px] text-blue-500 font-bold hover:underline"
                                    >
                                        {formData.isCustomBudget ? "Use Dropdown" : "Custom Budget"}
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                        <FiDollarSign size={14} />
                                    </div>
                                    {formData.isCustomBudget ? (
                                        <input 
                                            type="text"
                                            name="budget"
                                            placeholder="e.g. ₹75L Or Custom Range"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    ) : (
                                        <select 
                                            name="budget"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                        >
                                            <option value="">Select Budget</option>
                                            <option value="₹20L - ₹50L">₹20L - ₹50L</option>
                                            <option value="₹50L - ₹1Cr">₹50L - ₹1Cr</option>
                                            <option value="₹1Cr - ₹2Cr">₹1Cr - ₹2Cr</option>
                                            <option value="₹2Cr - ₹5Cr">₹2Cr - ₹5Cr</option>
                                            <option value="₹5Cr+">₹5Cr+</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Lead Source</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                        <FiShare2 size={14} />
                                    </div>
                                    <select 
                                        name="source"
                                        value={formData.source}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                    >
                                        {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Assign to Agents (Select Multiple)</label>
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 max-h-[120px] overflow-y-auto custom-scrollbar space-y-2">
                                    {AGENTS.map(agent => (
                                        <PremiumCheckbox 
                                            key={agent}
                                            label={agent}
                                            checked={formData.assignedAgents.includes(agent)}
                                            onChange={() => toggleAgent(agent)}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <PremiumTabs 
                                    label="Priority Level"
                                    options={["Low", "Medium", "High"]}
                                    value={formData.priority}
                                    onChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                                    variant="priority"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex gap-3">
                        <div className="flex-1">
                            <PremiumButton 
                                text="Cancel" 
                                variant="secondary" 
                                onClick={onClose}
                            />
                        </div>
                        <div className="flex-1">
                            <PremiumButton 
                                text="Update Lead" 
                                type="submit"
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditLeadModal;
