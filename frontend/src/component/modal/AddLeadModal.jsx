import React, { useState } from "react";
import { PremiumInput } from "../common/PremiumInput";
import { PremiumButton } from "../common/PremiumButton";
import { FiX, FiUser, FiSmartphone, FiMail, FiTarget, FiDollarSign, FiShare2, FiHome } from "react-icons/fi";
import { PremiumTabs } from "../common/PremiumTabs";
import { useCreateLead } from "../../hooks/useLeadHooks";
import { useProperties } from "../../hooks/usePropertyHooks";

const REQUIREMENTS = ["1BHK Flat", "2BHK Flat", "3BHK Flat", "Villa", "Plot", "Office Space", "Commercial Shop", "Penthouse", "Studio Flat"];
const SOURCES = ["Facebook", "Instagram", "Google Ads", "Website", "Walk-in", "Referral", "Personal"];
const CLIENT_TYPES = ["Rent", "Buying", "Investing"];

const DEFAULT_STATE = {
    name: "",
    phone: "",
    email: "",
    requirements: [],
    otherRequirement: "",
    budget: "",
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
    const { data: propertiesResponse } = useProperties({ limit: 100 }); 
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

        const payload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            requirement: finalRequirements.join(", ") || "Not Specified",
            budget: formData.isCustomBudget ? formData.budget : (formData.budget || "Not Specified"),
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">Create New Lead</h2>
                        <p className="text-xs text-zinc-500 mt-1">Capture potential client interest and requirements</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">

                        {/* Section: Client Type */}
                        <div className="pb-2 border-b border-zinc-900">
                            <PremiumTabs
                                label="Inquiry For"
                                options={CLIENT_TYPES}
                                value={formData.clientType}
                                onChange={(val) => setFormData(prev => ({ ...prev, clientType: val }))}
                            />
                        </div>

                        {/* Section: Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <PremiumInput
                                label="Lead Name"
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={(e) => handleChange({ target: { name: 'name', value: e.target.value } })}
                                icon={<FiUser />}
                                required
                            />
                            <PremiumInput
                                label="Phone Number"
                                placeholder="98765-XXXXX"
                                value={formData.phone}
                                onChange={(e) => handleChange({ target: { name: 'phone', value: e.target.value } })}
                                icon={<FiSmartphone />}
                                required
                            />
                        </div>

                        <PremiumInput
                            label="Email Address"
                            type="email"
                            placeholder="client@email.com"
                            value={formData.email}
                            onChange={(e) => handleChange({ target: { name: 'email', value: e.target.value } })}
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
                                        className={`px-3 py-2 text-[10px] font-bold rounded-lg border transition-all duration-200 ${formData.requirements.includes(req)
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
                                    onChange={(e) => handleChange({ target: { name: 'otherRequirement', value: e.target.value } })}
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
                                            required
                                            className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    ) : (
                                        <select
                                            name="budget"
                                            value={formData.budget}
                                            onChange={handleChange}
                                            required
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
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <FiHome size={14} /> Interested Properties
                                </label>
                                <select 
                                    onChange={handleAddProperty}
                                    value=""
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 appearance-none"
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
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {formData.properties.map(propId => {
                                            const p = availableProperties.find(x => x._id === propId);
                                            return (
                                                <div key={propId} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 pl-3 py-1.5 rounded-lg text-xs font-medium">
                                                    <span className="truncate max-w-[150px]">{p ? p.property_title : propId}</span>
                                                    <button type="button" onClick={() => handleRemoveProperty(propId)} className="text-zinc-500 hover:text-red-400 transition-colors p-0.5 ml-1">
                                                        <FiX size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                                text="Discard"
                                variant="secondary"
                                type="button"
                                onClick={onClose}
                            />
                        </div>
                        <div className="flex-1">
                            <PremiumButton
                                text={createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                                type="submit"
                                disabled={createLeadMutation.isPending}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;
