import React, { useState } from "react";
import { FiX, FiUser, FiSmartphone, FiMail, FiTarget, FiDollarSign, FiShare2, FiHome } from "react-icons/fi";
import { useCreateLead } from "../../hooks/useLeadHooks";
import { useProperties } from "../../hooks/usePropertyHooks";

const REQUIREMENTS = ["1BHK Flat", "2BHK Flat", "3BHK Flat", "Villa", "Plot", "Office Space", "Commercial Shop", "Penthouse", "Studio Flat"];
const SOURCES = ["Website", "Facebook", "Instagram", "LinkedIn", "WhatsApp", "Google Ads", "Referral", "Advertisement", "Walk-in", "Personal", "Other"];
const CLIENT_TYPES = ["Buying", "Rent", "Investing", "Selling", "Other"];

const getBudgetOptions = (currency) => {
    switch(currency) {
        case "$": return ["", "$50k - $200k", "$200k - $500k", "$500k - $1M", "$1M - $5M", "$5M+"];
        case "AED": return ["", "AED 500k - 1M", "AED 1M - 2M", "AED 2M - 5M", "AED 5M+"];
        default: return ["", "₹20L - ₹50L", "₹50L - ₹1Cr", "₹1Cr - ₹2Cr", "₹2Cr - ₹5Cr", "₹5Cr+"];
    }
};

const DEFAULT_STATE = {
    name: "",
    phone: "",
    email: "",
    requirements: [],
    otherRequirement: "",
    budget: "",
    currency: "₹",
    isCustomBudget: false,
    source: SOURCES[0],
    properties: [], // Array of property object Ids
    priority: "Medium",
    clientType: "Buying",
};

const AddLeadModal = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState(DEFAULT_STATE);
    const createLeadMutation = useCreateLead();
    
    // Fetch properties for the dropdown
    const { data: propertiesResponse } = useProperties({ limit: 10000 }); 
    const availableProperties = propertiesResponse?.data || [];

    if (!isOpen) return null;

    const toggleRequirement = (req) => {
        setFormData(prev => {
            const requirements = prev.requirements.includes(req)
                ? prev.requirements.filter(r => r !== req)
                : [...prev.requirements, req];
            return { ...prev, requirements };
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddProperty = (e) => {
        const propId = e.target.value;
        if (!propId) return;
        if (!formData.properties.includes(propId)) {
            setFormData(prev => ({ ...prev, properties: [...prev.properties, propId] }));
        }
    };

    const handleRemoveProperty = (propId) => {
        setFormData(prev => ({ ...prev, properties: prev.properties.filter(id => id !== propId) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Combine standard and other requirements
        let finalRequirements = [...formData.requirements];
        if (formData.otherRequirement.trim()) {
            finalRequirements.push(formData.otherRequirement.trim());
        }

        let budgetVal = formData.budget || "Not Specified";
        if (formData.isCustomBudget && formData.budget && !formData.budget.startsWith(formData.currency)) {
            budgetVal = `${formData.currency} ${formData.budget}`;
        }

        const payload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            requirement: finalRequirements.join(", ") || "Not Specified",
            budget: budgetVal,
            currency: formData.currency,
            inquiry_for: formData.clientType,
            client_type: formData.clientType.toLowerCase() === "rent" ? "renting" : formData.clientType.toLowerCase(),
            source: formData.source.toLowerCase().replace("-", "_").replace(" ", "_"),
            priority: formData.priority.toLowerCase(),
            properties: formData.properties // Direct array of IDs
        };

        createLeadMutation.mutate(payload, {
            onSuccess: () => {
                setFormData(DEFAULT_STATE);
                if (onAdd) onAdd(); 
                onClose();
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded w-full max-w-xl overflow-hidden shadow-lg flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div>
                        <h2 className="text-lg font-medium text-white">Create New Lead</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Capture potential client interest and requirements</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800">
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                        {/* Section: Client Type */}
                        <div className="space-y-3 pb-6 border-b border-zinc-800/50">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Inquiry For</label>
                            <select
                                value={formData.clientType}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientType: e.target.value }))}
                                className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded p-3 focus:outline-none focus:border-zinc-700 cursor-pointer"
                            >
                                {CLIENT_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Section: Basic Info */}
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Lead Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                            <FiUser size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Enter full name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-9 pr-3 py-3 focus:outline-none focus:border-zinc-700"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Phone Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                            <FiSmartphone size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            name="phone"
                                            placeholder="98765-XXXXX"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-9 pr-3 py-3 focus:outline-none focus:border-zinc-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                        <FiMail size={14} />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="client@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-9 pr-3 py-3 focus:outline-none focus:border-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Requirements */}
                        <div className="pt-2">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 block">Property Requirement (Select Multiple)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {REQUIREMENTS.map(req => (
                                    <button
                                        key={req}
                                        type="button"
                                        onClick={() => toggleRequirement(req)}
                                        className={`px-3 py-2 text-[10px] rounded border ${formData.requirements.includes(req)
                                                ? "bg-zinc-800 border-zinc-600 text-white"
                                                : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                            }`}
                                    >
                                        {req}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 space-y-2">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Other Requirement</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                        <FiTarget size={14} />
                                    </div>
                                    <input
                                        type="text"
                                        name="otherRequirement"
                                        placeholder="Enter custom requirement..."
                                        value={formData.otherRequirement}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-9 pr-3 py-3 focus:outline-none focus:border-zinc-700"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Budget Range</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, isCustomBudget: !prev.isCustomBudget, budget: "" }))}
                                        className="text-[10px] text-blue-400 hover:text-blue-300"
                                    >
                                        {formData.isCustomBudget ? "Use Dropdown" : "Custom Budget"}
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800 w-fit">
                                    {["₹", "$", "AED"].map(curr => (
                                        <button
                                            key={curr}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, currency: curr, budget: "" }))}
                                            className={`px-3 py-1 text-[10px] font-medium rounded ${formData.currency === curr ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                                        >
                                            {curr}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 text-sm font-medium">
                                        {formData.currency}
                                    </div>
                                    {formData.isCustomBudget ? (
                                        <input
                                            type="text"
                                            name="budget"
                                            placeholder="e.g. 75L Or Custom Range"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-9 pr-3 py-3 focus:outline-none focus:border-zinc-700"
                                        />
                                    ) : (
                                        <select
                                            name="budget"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-9 pr-3 py-3 focus:outline-none focus:border-zinc-700 cursor-pointer"
                                        >
                                            <option value="">Select Budget</option>
                                            {getBudgetOptions(formData.currency).slice(1).map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Lead Source</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                                        <FiShare2 size={14} />
                                    </div>
                                    <select
                                        name="source"
                                        value={formData.source}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded pl-9 pr-3 py-3 focus:outline-none focus:border-zinc-700 cursor-pointer"
                                    >
                                        {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <FiHome size={14} /> Interested Properties
                                </label>
                                <select 
                                    onChange={handleAddProperty}
                                    value=""
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded px-3 py-3 focus:outline-none focus:border-zinc-700 cursor-pointer"
                                >
                                    <option value="">Select a property...</option>
                                    {availableProperties.map(p => (
                                        <option key={p._id} value={p._id}>
                                            {p.property_title} - {p.property_location?.city || "Unspecified"}
                                        </option>
                                    ))}
                                </select>
                                
                                {/* Selected Properties Chips */}
                                {formData.properties.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {formData.properties.map(propId => {
                                            const p = availableProperties.find(x => x._id === propId);
                                            return (
                                                <div key={propId} className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1 rounded text-xs">
                                                    <span className="truncate max-w-[120px]">{p ? p.property_title : propId}</span>
                                                    <button type="button" onClick={() => handleRemoveProperty(propId)} className="text-zinc-400 hover:text-white">
                                                        <FiX size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block">Priority Level</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded p-3 focus:outline-none focus:border-zinc-700 cursor-pointer"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-3 bg-zinc-900">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createLeadMutation.isPending}
                            className="px-4 py-2 rounded bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;
