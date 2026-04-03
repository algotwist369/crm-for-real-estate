import React, { useState } from "react";
import {
    FiX, FiUser, FiSmartphone, FiMail, FiTarget, FiShare2, FiHome,
    FiDollarSign, FiMapPin, FiPhone, FiChevronLeft, FiChevronRight
} from "react-icons/fi";
import { MdOutlineApartment } from "react-icons/md";
import { useCreateLead } from "../../hooks/useLeadHooks";
import { useProperties } from "../../hooks/usePropertyHooks";

// ─── Constants ───────────────────────────────────────────────────────────────
const LEAD_TYPES = ["buyer", "seller", "owner", "tenant", "investor", "listing", "broker", "other"];
const CLIENT_TYPES = ["buying", "renting", "investing", "selling", "other"];
const SOURCES = [
    { label: "Website", value: "website" }, { label: "Facebook", value: "facebook" },
    { label: "Instagram", value: "instagram" }, { label: "LinkedIn", value: "linkedin" },
    { label: "WhatsApp", value: "whatsapp" }, { label: "Google Ads", value: "google_ads" },
    { label: "Referral", value: "referral" }, { label: "Advertisement", value: "advertisement" },
    { label: "Walk-in", value: "walk_in" }, { label: "Personal", value: "personal" },
    { label: "Broker", value: "broker" }, { label: "Owner", value: "owner" },
    { label: "Manual Entry", value: "manual_entry" }, { label: "Other", value: "other" }
];
const PROPERTY_TYPES = ["villa", "townhouse", "apartment", "penthouse", "plot", "commercial", "office", "shop", "warehouse", "other"];
const FURNISHED_STATUSES = [
    { label: "Furnished", value: "furnished" }, { label: "Semi-Furnished", value: "semi_furnished" },
    { label: "Unfurnished", value: "unfurnished" }, { label: "Unknown", value: "unknown" }
];
const AREA_UNITS = ["sq.ft", "sq.m", "sqm", "acre", "hectare", "other"];
const CURRENCIES = ["AED", "₹", "$"];
const BEDROOMS = ["Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR", "5+ BR", "4 BR + Maid", "5 BR + Maid"];
const PRIORITIES = ["low", "medium", "high"];

const getBudgetOptions = (currency) => {
    switch (currency) {
        case "$": return ["$50k-$200k", "$200k-$500k", "$500k-$1M", "$1M-$5M", "$5M+"];
        case "AED": return ["AED 500k-1M", "AED 1M-2M", "AED 2M-5M", "AED 5M-10M", "AED 10M+"];
        default: return ["₹20L-₹50L", "₹50L-₹1Cr", "₹1Cr-₹2Cr", "₹2Cr-₹5Cr", "₹5Cr+"];
    }
};

const TABS = [
    { id: "client", label: "Client Info", icon: FiUser },
    { id: "property", label: "Requirement", icon: MdOutlineApartment },
    { id: "pricing", label: "Pricing", icon: FiDollarSign },
    { id: "ownership", label: "Ownership / Broker", icon: FiHome },
    { id: "crm", label: "CRM & Source", icon: FiShare2 },
];

const DEFAULT_STATE = {
    // Client
    lead_type: "buyer",
    name: "",
    phone: "",
    alternate_phone: "",
    whatsapp_number: "",
    email: "",
    // Property
    property_type: "apartment",
    bedrooms: "",
    bathrooms: "",
    furnished_status: "unknown",
    maid_room: false,
    address: "",
    plot_size_value: "",
    plot_size_unit: "sq.ft",
    built_up_area_value: "",
    built_up_area_unit: "sq.ft",
    requirement: "",
    // Pricing
    currency: "AED",
    budget: "",
    isCustomBudget: false,
    asking_price: "",
    price_label: "",
    price_negotiable: false,
    budget_min: "",
    budget_max: "",
    // Ownership
    owner_name: "",
    broker_name: "",
    broker_phone: "",
    shared_details: "",
    // CRM
    client_type: "buying",
    inquiry_for: "",
    source: "website",
    priority: "low",
    properties: [],
    comments: "",
    tags: "",
};

const InputField = ({ label, icon: Icon, required, children, className = "" }) => (
    <div className={`space-y-1.5 ${className}`}>
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
            {Icon && <Icon size={10} />} {label} {required && <span className="text-yellow-400">*</span>}
        </label>
        {children}
    </div>
);

const inputCls = "w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700";
const selectCls = "w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded px-3 py-2.5 focus:outline-none focus:border-zinc-600 cursor-pointer transition-colors";

const AddLeadModal = ({ isOpen, onClose, onAdd }) => {
    const [activeTab, setActiveTab] = useState("client");
    const [formData, setFormData] = useState(DEFAULT_STATE);
    const createLeadMutation = useCreateLead();

    const { data: propertiesResponse } = useProperties({ limit: 10000 });
    const availableProperties = propertiesResponse?.data || [];

    if (!isOpen) return null;

    const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
    const handleChange = (e) => set(e.target.name, e.target.value);
    const handleCheck = (e) => set(e.target.name, e.target.checked);

    const handleAddProperty = (e) => {
        const propId = e.target.value;
        if (!propId || formData.properties.includes(propId)) return;
        set("properties", [...formData.properties, propId]);
    };

    const handleRemoveProperty = (propId) => {
        set("properties", formData.properties.filter(id => id !== propId));
    };

    const tabIndex = TABS.findIndex(t => t.id === activeTab);
    const isLastTab = tabIndex === TABS.length - 1;
    const isFirstTab = tabIndex === 0;

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            // Required
            name: formData.name,
            phone: formData.phone,
            source: formData.source,
            // Optional contact
            email: formData.email || undefined,
            alternate_phone: formData.alternate_phone || undefined,
            whatsapp_number: formData.whatsapp_number || undefined,
            // Lead category
            lead_type: formData.lead_type,
            client_type: formData.client_type,
            inquiry_for: formData.inquiry_for || undefined,
            requirement: formData.requirement || undefined,
            // Property
            property_type: formData.property_type,
            bedrooms: formData.bedrooms || undefined,
            bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
            furnished_status: formData.furnished_status,
            maid_room: formData.maid_room,
            address: formData.address || undefined,
            plot_size: formData.plot_size_value ? { value: Number(formData.plot_size_value), unit: formData.plot_size_unit } : undefined,
            built_up_area: formData.built_up_area_value ? { value: Number(formData.built_up_area_value), unit: formData.built_up_area_unit } : undefined,
            // Pricing
            currency: formData.currency,
            budget: formData.budget || undefined,
            asking_price: formData.asking_price ? Number(formData.asking_price) : undefined,
            price_label: formData.price_label || undefined,
            price_negotiable: formData.price_negotiable,
            budget_min: formData.budget_min ? Number(formData.budget_min) : undefined,
            budget_max: formData.budget_max ? Number(formData.budget_max) : undefined,
            // Ownership
            owner_name: formData.owner_name || undefined,
            broker_name: formData.broker_name || undefined,
            broker_phone: formData.broker_phone || undefined,
            shared_details: formData.shared_details || undefined,
            // CRM
            priority: formData.priority,
            properties: formData.properties,
            comments: formData.comments || undefined,
            tags: formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        };

        createLeadMutation.mutate(payload, {
            onSuccess: () => {
                setFormData(DEFAULT_STATE);
                setActiveTab("client");
                if (onAdd) onAdd();
                onClose();
            }
        });
    };

    // ─── Tab Content ──────────────────────────────────────────────────────────
    const renderClientTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <InputField label="Full Name" icon={FiUser} required>
                        <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Ahmed Al Rashidi" className={inputCls} />
                    </InputField>
                    <InputField label="Phone Number" icon={FiSmartphone} required>
                        <input name="phone" value={formData.phone} onChange={handleChange} required placeholder="+971 50 XXX XXXX" className={inputCls} />
                    </InputField>
                    <InputField label="Email Address" icon={FiMail}>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="client@email.com (optional)" className={inputCls} />
                    </InputField>
                </div>
                <div className="space-y-4">
                    <InputField label="Alternate Phone" icon={FiPhone}>
                        <input name="alternate_phone" value={formData.alternate_phone} onChange={handleChange} placeholder="Secondary contact" className={inputCls} />
                    </InputField>
                    <InputField label="WhatsApp Number" icon={FiPhone}>
                        <input name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} placeholder="+971 50 XXX XXXX" className={inputCls} />
                    </InputField>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Lead Type</label>
                        <div className="flex flex-wrap gap-1.5">
                            {LEAD_TYPES.map(t => (
                                <button key={t} type="button" onClick={() => set("lead_type", t)}
                                    className={`px-3 py-1.5 text-[10px] font-semibold rounded border capitalize transition-all ${formData.lead_type === t
                                            ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-300"
                                            : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                                        }`}>{t}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPropertyTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <InputField label="Property Type" icon={MdOutlineApartment}>
                        <select name="property_type" value={formData.property_type} onChange={handleChange} className={selectCls}>
                            {PROPERTY_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </select>
                    </InputField>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Bedrooms">
                            <select name="bedrooms" value={formData.bedrooms} onChange={handleChange} className={selectCls}>
                                <option value="">Any</option>
                                {BEDROOMS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </InputField>
                        <InputField label="Bathrooms">
                            <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} min={0} placeholder="0" className={inputCls} />
                        </InputField>
                    </div>
                    <div className="grid grid-cols-2 gap-3 items-end">
                        <InputField label="Furnished">
                            <select name="furnished_status" value={formData.furnished_status} onChange={handleChange} className={selectCls}>
                                {FURNISHED_STATUSES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                        </InputField>
                        <div className="pb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" name="maid_room" checked={formData.maid_room} onChange={handleCheck} className="w-4 h-4 rounded border border-zinc-700 bg-zinc-950 checked:accent-yellow-500" />
                                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Maid Room</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Plot Size">
                                <div className="flex w-full items-center bg-zinc-950 border border-zinc-800 rounded focus-within:border-zinc-600 transition-colors">
                                    <input type="number" name="plot_size_value" value={formData.plot_size_value} onChange={handleChange} placeholder="0" className="bg-transparent border-none text-white text-sm px-3 py-2.5 focus:outline-none flex-1 min-w-0" />
                                    <div className="w-[1px] h-4 bg-zinc-800 flex-shrink-0" />
                                    <select name="plot_size_unit" value={formData.plot_size_unit} onChange={handleChange} className="bg-transparent border-none text-zinc-400 text-xs px-2 py-2.5 focus:outline-none cursor-pointer flex-shrink-0 appearance-none text-right">
                                        {AREA_UNITS.map(u => <option key={u} value={u} className="bg-zinc-950">{u}</option>)}
                                    </select>
                                    <div className="pr-2 pointer-events-none text-zinc-600">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </InputField>
                            <InputField label="Built-Up Area">
                                <div className="flex w-full items-center bg-zinc-950 border border-zinc-800 rounded focus-within:border-zinc-600 transition-colors">
                                    <input type="number" name="built_up_area_value" value={formData.built_up_area_value} onChange={handleChange} placeholder="0" className="bg-transparent border-none text-white text-sm px-3 py-2.5 focus:outline-none flex-1 min-w-0" />
                                    <div className="w-[1px] h-4 bg-zinc-800 flex-shrink-0" />
                                    <select name="built_up_area_unit" value={formData.built_up_area_unit} onChange={handleChange} className="bg-transparent border-none text-zinc-400 text-xs px-2 py-2.5 focus:outline-none cursor-pointer flex-shrink-0 appearance-none text-right">
                                        {AREA_UNITS.map(u => <option key={u} value={u} className="bg-zinc-950">{u}</option>)}
                                    </select>
                                    <div className="pr-2 pointer-events-none text-zinc-600">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </InputField>
                        </div>
                        <InputField label="Property Address" icon={FiMapPin}>
                        <input name="address" value={formData.address} onChange={handleChange} placeholder="e.g. Downtown Dubai" className={inputCls} />
                    </InputField>
                </div>
            </div>
            <InputField label="Requirement / Detailed Notes" icon={FiTarget}>
                <textarea name="requirement" value={formData.requirement} onChange={handleChange} rows={3} placeholder="Describe client requirement..." className={`${inputCls} resize-none`} />
            </InputField>
        </div>
    );

    const renderPricingTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Currency</label>
                        <div className="flex gap-1.5">
                            {CURRENCIES.map(c => (
                                <button key={c} type="button" onClick={() => { set("currency", c); set("budget", ""); }}
                                    className={`px-4 py-2 text-xs font-bold rounded border transition-all ${formData.currency === c ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-300" : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                        }`}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Budget Range</label>
                            <button type="button" onClick={() => { set("isCustomBudget", !formData.isCustomBudget); set("budget", ""); }}
                                className="text-[10px] text-yellow-400 hover:text-yellow-300 transition-colors">
                                {formData.isCustomBudget ? "Use Dropdown" : "Custom"}
                            </button>
                        </div>
                        {formData.isCustomBudget ? (
                            <input name="budget" value={formData.budget} onChange={handleChange} placeholder={`e.g. ${formData.currency} 2.5M`} className={inputCls} />
                        ) : (
                            <select name="budget" value={formData.budget} onChange={handleChange} className={selectCls}>
                                <option value="">Select range...</option>
                                {getBudgetOptions(formData.currency).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        )}
                    </div>
                    <InputField label="Asking / Listing Price">
                        <input type="number" name="asking_price" value={formData.asking_price} onChange={handleChange} min={0} placeholder={`${formData.currency} 0`} className={inputCls} />
                    </InputField>
                </div>
                <div className="space-y-4">
                    <InputField label="Price Label (display text)">
                        <input name="price_label" value={formData.price_label} onChange={handleChange} placeholder='e.g. "3.5 M", "2.3 to 2.4 M"' className={inputCls} />
                    </InputField>
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Budget Min">
                            <input type="number" name="budget_min" value={formData.budget_min} onChange={handleChange} min={0} placeholder="0" className={inputCls} />
                        </InputField>
                        <InputField label="Budget Max">
                            <input type="number" name="budget_max" value={formData.budget_max} onChange={handleChange} min={0} placeholder="0" className={inputCls} />
                        </InputField>
                    </div>
                    <div className="pb-2">
                        <label className="flex items-center gap-2 cursor-pointer pt-2">
                            <input type="checkbox" name="price_negotiable" checked={formData.price_negotiable} onChange={handleCheck} className="w-4 h-4 rounded border border-zinc-700 bg-zinc-950 checked:accent-yellow-500" />
                            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Price Negotiable</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOwnershipTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <InputField label="Owner Name">
                        <input name="owner_name" value={formData.owner_name} onChange={handleChange} placeholder="Property owner's name" className={inputCls} />
                    </InputField>
                    <InputField label="Broker Name">
                        <input name="broker_name" value={formData.broker_name} onChange={handleChange} placeholder="Broker's name" className={inputCls} />
                    </InputField>
                </div>
                <div className="space-y-4">
                    <InputField label="Broker Phone" icon={FiPhone}>
                        <input name="broker_phone" value={formData.broker_phone} onChange={handleChange} placeholder="Broker contact number" className={inputCls} />
                    </InputField>
                    <InputField label="Shared / Deal Details">
                        <textarea name="shared_details" value={formData.shared_details} onChange={handleChange} rows={3} placeholder="Commission details, co-broker terms..." className={`${inputCls} resize-none`} />
                    </InputField>
                </div>
            </div>
        </div>
    );

    const renderCRMTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <InputField label="Client Category">
                            <select name="client_type" value={formData.client_type} onChange={handleChange} className={selectCls}>
                                {CLIENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                            </select>
                        </InputField>
                        <InputField label="Priority">
                            <select name="priority" value={formData.priority} onChange={handleChange} className={selectCls}>
                                {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                            </select>
                        </InputField>
                    </div>
                    <InputField label="Inquiry For" icon={FiTarget}>
                        <input name="inquiry_for" value={formData.inquiry_for} onChange={handleChange} placeholder="e.g. 3BHK Villa for Investment" className={inputCls} />
                    </InputField>
                    <InputField label="Lead Source" icon={FiShare2} required>
                        <select name="source" value={formData.source} onChange={handleChange} className={selectCls}>
                            {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </InputField>
                </div>
                <div className="space-y-4">
                    <InputField label="Link Properties" icon={FiHome}>
                        <select onChange={handleAddProperty} value="" className={selectCls}>
                            <option value="">Select a property to link...</option>
                            {availableProperties.map(p => (
                                <option key={p._id} value={p._id}>{p.property_title} – {p.property_location?.city || "?"}</option>
                            ))}
                        </select>
                        {formData.properties.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {formData.properties.map(propId => {
                                    const p = availableProperties.find(x => x._id === propId);
                                    return (
                                        <span key={propId} className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-300 px-2 py-1 rounded text-[10px]">
                                            <span className="truncate max-w-[120px]">{p?.property_title || propId}</span>
                                            <button type="button" onClick={() => handleRemoveProperty(propId)} className="text-zinc-500 hover:text-white"><FiX size={12} /></button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </InputField>
                    <InputField label="Tags (comma-separated)">
                        <input name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g. hot-lead, offplan, uae" className={inputCls} />
                    </InputField>
                    <InputField label="Internal Comments">
                        <textarea name="comments" value={formData.comments} onChange={handleChange} rows={2} placeholder="Internal comments..." className={`${inputCls} resize-none`} />
                    </InputField>
                </div>
            </div>
        </div>
    );

    const tabContent = {
        client: renderClientTab,
        property: renderPropertyTab,
        pricing: renderPricingTab,
        ownership: renderOwnershipTab,
        crm: renderCRMTab,
    };

    return (
        <div className="fixed inset-0 bg-zinc-950/85 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex-shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-white">Create New Lead</h2>
                        <p className="text-[11px] text-zinc-500 mt-0.5">International Real-Estate CRM - capture complete lead data</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800 transition-colors"><FiX size={18} /></button>
                </div>

                {/* Tab Bar */}
                <div className="flex border-b border-zinc-800 bg-zinc-900/50 overflow-x-auto no-scrollbar flex-shrink-0">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${isActive ? "text-yellow-400 border-yellow-500 bg-yellow-500/5" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5"
                                    }`}>
                                <Icon size={13} /> {tab.label}
                                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-0.5" />}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                        {tabContent[activeTab]?.()}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => !isFirstTab && setActiveTab(TABS[tabIndex - 1].id)}
                            disabled={isFirstTab}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-colors ${isFirstTab ? "text-zinc-700 cursor-not-allowed" : "bg-zinc-800 text-white hover:bg-zinc-700"}`}
                        >
                            <FiChevronLeft size={16} /> Back
                        </button>

                        <div className="flex items-center gap-1.5">
                            {TABS.map((t, i) => (
                                <div key={t.id} className={`w-1.5 h-1.5 rounded-full transition-colors ${activeTab === t.id ? "bg-yellow-400" : "bg-zinc-700"}`} />
                            ))}
                        </div>

                        {isLastTab ? (
                            <button
                                type="submit"
                                disabled={createLeadMutation.isPending}
                                className="flex items-center gap-1.5 px-5 py-2 rounded bg-yellow-600 text-sm font-semibold text-white hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setActiveTab(TABS[tabIndex + 1].id)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 transition-colors"
                            >
                                Next <FiChevronRight size={16} />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddLeadModal;
