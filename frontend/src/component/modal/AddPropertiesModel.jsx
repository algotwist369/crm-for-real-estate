import React, { useCallback, useEffect, useState } from "react";
import { PremiumInput } from "../common/PremiumInput";
import { PremiumButton } from "../common/PremiumButton";
import { 
    FiX, FiHome, FiDollarSign, FiPlus, FiMapPin, FiInfo, FiLayers, 
    FiUser, FiTrendingUp, FiUpload, FiTrash2, FiLoader, FiCalendar, FiCheckSquare, FiZap
} from "react-icons/fi";
import { PremiumTabs } from "../common/PremiumTabs";
import { PremiumCheckbox } from "../common/PremiumCheckbox";
import { useCreateProperty } from "../../hooks/usePropertyHooks";
import { useAgents } from "../../hooks/useAgentHooks";

const PROPERTY_TYPES = ["Apartment", "Villa", "Office", "Plot", "Warehouse", "Studio", "Penthouse"];
const LISTING_TYPES = ["sale", "rent"];
const CURRENCIES = ["INR", "AED", "USD", "EUR"];
const FURNISHED_STATUS = ["fully furnished", "semi furnished", "unfurnished", "NA"];

const getInitialFormData = () => ({
    property_title: "",
    property_description: "",
    property_type: PROPERTY_TYPES[0].toLowerCase(),
    listing_type: LISTING_TYPES[0],
    asking_price: "",
    currency: CURRENCIES[0],
    price_sqft: "",
    price_negotiable: false,
    property_status: "available",
    property_address: "",
    property_location: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        country: "India",
        postal_code: "",
        landmark: "",
        coordinates: {
            type: "Point",
            coordinates: [0, 0] // [longitude, latitude]
        }
    },
    total_area: "",
    area_unit: "sqft",
    carpet_area: "",
    built_up_area: "",
    total_bedrooms: "",
    total_bathrooms: "",
    furnished_status: "unfurnished",
    amenities: [],
    assign_agent: [],
    possession_date: "",
    available_from: "",
    photos_base64: [],
    is_active: true
});

const AMENITY_OPTIONS = ["Infinity Pool", "Gym", "24/7 Security", "Covered Parking", "Concierge Service", "Balcony", "Central AC", "Elevator", "Power Backup", "Clubhouse"];

const AddPropertiesModel = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState(getInitialFormData);
    const [previewImages, setPreviewImages] = useState([]);
    const [activeSection, setActiveSection] = useState("basic");

    const { data: agentsData, isLoading: isLoadingAgents } = useAgents();
    const createMutation = useCreateProperty();
    const agents = agentsData?.data || [];

    useEffect(() => {
        if (!isOpen) {
            setFormData(getInitialFormData());
            setPreviewImages([]);
            setActiveSection("basic");
        }
    }, [isOpen]);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (name.includes('.')) {
            const parts = name.split('.');
            setFormData(prev => {
                let updated = { ...prev };
                let current = updated;
                for (let i = 0; i < parts.length - 1; i++) {
                    current[parts[i]] = { ...current[parts[i]] };
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = val;
                return updated;
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: val }));
        }
    }, []);

    const handleCoordinateChange = (index, value) => {
        setFormData(prev => {
            const newCoords = [...prev.property_location.coordinates.coordinates];
            newCoords[index] = parseFloat(value) || 0;
            return {
                ...prev,
                property_location: {
                    ...prev.property_location,
                    coordinates: { ...prev.property_location.coordinates, coordinates: newCoords }
                }
            };
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    photos_base64: [...prev.photos_base64, reader.result]
                }));
                setPreviewImages(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            photos_base64: prev.photos_base64.filter((_, i) => i !== index)
        }));
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    const toggleAmenity = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const toggleAgent = (agentId) => {
        setFormData(prev => ({
            ...prev,
            assign_agent: prev.assign_agent.includes(agentId)
                ? prev.assign_agent.filter(id => id !== agentId)
                : [...prev.assign_agent, agentId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createMutation.mutateAsync(formData);
            onClose();
        } catch (error) {}
    };

    if (!isOpen) return null;

    const SectionTab = ({ id, label, icon: Icon }) => (
        <button
            type="button"
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                activeSection === id ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
        >
            <Icon size={14} /> {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]">
                
                {/* Clean Header */}
                <div className="flex items-center justify-between p-8 border-b border-zinc-900">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Add Property</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Listing Configuration Node</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Sub-navigation */}
                <div className="flex border-b border-zinc-900 px-4 overflow-x-auto scrollbar-hide">
                    <SectionTab id="basic" label="Basic" icon={FiInfo} />
                    <SectionTab id="specs" label="Specs" icon={FiLayers} />
                    <SectionTab id="location" label="Location" icon={FiMapPin} />
                    <SectionTab id="media" label="Media" icon={FiUpload} />
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                        
                        {activeSection === 'basic' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <PremiumInput label="Title" name="property_title" value={formData.property_title} onChange={handleChange} placeholder="Listing Headline" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Type</label>
                                        <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-emerald-500/50">
                                            {PROPERTY_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Listing</label>
                                        <select name="listing_type" value={formData.listing_type} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-emerald-500/50">
                                            {LISTING_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <PremiumInput label="Price" name="asking_price" type="number" value={formData.asking_price} onChange={handleChange} placeholder="0.00" required />
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Currency</label>
                                        <select name="currency" value={formData.currency} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-emerald-500/50">
                                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 pt-2">
                                    <PremiumCheckbox label="Price Negotiable" checked={formData.price_negotiable} onChange={(e) => setFormData(p => ({ ...p, price_negotiable: e.target.checked }))} />
                                    <PremiumCheckbox label="Active Listing" checked={formData.is_active} onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Description</label>
                                    <textarea name="property_description" value={formData.property_description} onChange={handleChange} placeholder="Detailed overview..." className="w-full h-32 bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 resize-none" />
                                </div>
                            </div>
                        )}

                        {activeSection === 'specs' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-3 gap-4">
                                    <PremiumInput label="Total Area" name="total_area" type="number" value={formData.total_area} onChange={handleChange} />
                                    <PremiumInput label="Carpet Area" name="carpet_area" type="number" value={formData.carpet_area} onChange={handleChange} />
                                    <PremiumInput label="Built-up" name="built_up_area" type="number" value={formData.built_up_area} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <PremiumInput label="Bedrooms" name="total_bedrooms" type="number" value={formData.total_bedrooms} onChange={handleChange} />
                                    <PremiumInput label="Bathrooms" name="total_bathrooms" type="number" value={formData.total_bathrooms} onChange={handleChange} />
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Furnishing</label>
                                        <select name="furnished_status" value={formData.furnished_status} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-emerald-500/50">
                                            {FURNISHED_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <PremiumInput label="Possession" name="possession_date" type="date" value={formData.possession_date} onChange={handleChange} />
                                    <PremiumInput label="Available From" name="available_from" type="date" value={formData.available_from} onChange={handleChange} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Amenities</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {AMENITY_OPTIONS.map(a => (
                                            <PremiumCheckbox key={a} label={a} checked={formData.amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-zinc-900">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Consultants</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {agents.map(a => (
                                            <PremiumCheckbox key={a._id} label={a.agent_details?.user_name} checked={formData.assign_agent.includes(a._id)} onChange={() => toggleAgent(a._id)} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'location' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <PremiumInput label="Property Full Address" name="property_address" value={formData.property_address} onChange={handleChange} placeholder="Searchable public address" />
                                <div className="grid grid-cols-2 gap-4">
                                    <PremiumInput label="Line 1" name="property_location.line1" value={formData.property_location.line1} onChange={handleChange} />
                                    <PremiumInput label="Line 2" name="property_location.line2" value={formData.property_location.line2} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <PremiumInput label="City" name="property_location.city" value={formData.property_location.city} onChange={handleChange} />
                                    <PremiumInput label="State" name="property_location.state" value={formData.property_location.state} onChange={handleChange} />
                                    <PremiumInput label="Postal Code" name="property_location.postal_code" value={formData.property_location.postal_code} onChange={handleChange} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <PremiumInput label="Landmark" name="property_location.landmark" value={formData.property_location.landmark} onChange={handleChange} />
                                    <PremiumInput label="Country" name="property_location.country" value={formData.property_location.country} onChange={handleChange} />
                                </div>
                                <div className="space-y-3 pt-4 border-t border-zinc-900">
                                    <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Geospatial Coordinates</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <PremiumInput label="Longitude" type="number" step="any" value={formData.property_location.coordinates.coordinates[0]} onChange={(e) => handleCoordinateChange(0, e.target.value)} />
                                        <PremiumInput label="Latitude" type="number" step="any" value={formData.property_location.coordinates.coordinates[1]} onChange={(e) => handleCoordinateChange(1, e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'media' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="grid grid-cols-3 gap-4">
                                    {previewImages.map((src, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-900 group">
                                            <img src={src} className="w-full h-full object-cover" alt="Property Preview" />
                                            <button onClick={() => removeImage(idx)} type="button" className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer transition-all group">
                                        <FiPlus size={24} className="text-zinc-600 group-hover:text-emerald-500" />
                                        <span className="text-[10px] font-black text-zinc-600 uppercase group-hover:text-emerald-500">Add Asset</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Simple Bottom Footer */}
                    <div className="p-8 border-t border-zinc-900 bg-zinc-950/80 flex gap-4">
                        <div className="flex-1">
                            <PremiumButton text="Cancel" variant="secondary" onClick={onClose} className="w-full" />
                        </div>
                        <div className="flex-1">
                            <PremiumButton text={createMutation.isLoading ? "Publishing..." : "Publish Listing"} type="submit" disabled={createMutation.isLoading} className="w-full" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPropertiesModel;
