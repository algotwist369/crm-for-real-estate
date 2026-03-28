import React, { useCallback, useEffect, useState } from "react";
import { 
    FiX, FiHome, FiDollarSign, FiPlus, FiMapPin, FiInfo, FiLayers, 
    FiUser, FiTrendingUp, FiUpload, FiTrash2, FiLoader, FiCalendar, FiCheckSquare, FiZap
} from "react-icons/fi";
import { useCreateProperty } from "../../hooks/usePropertyHooks";
import { useAgents } from "../../hooks/useAgentHooks";

const PROPERTY_TYPES = ["Apartment", "Villa", "Office", "Plot", "Warehouse", "Studio", "Penthouse"];
const LISTING_TYPES = ["sale", "rent", "investment"];
const CURRENCIES = ["INR", "AED", "USD", "EUR", "GBP", "JPY"];
const FURNISHED_STATUS = ["fully furnished", "semi furnished", "unfurnished", "furnished", "NA"];

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
    documents: [],
    documents_base64: [],
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
            }
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

    const handleDocFileChange = (e) => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    documents_base64: [...prev.documents_base64, {
                        name: file.name.split('.').slice(0, -1).join('.'),
                        base64: reader.result,
                        mimeType: file.type
                    }]
                }));
            };
            reader.readAsDataURL(file);
        });
        e.target.value = null; // reset input
    };

    const handleDocUrlAdd = () => {
        setFormData(prev => ({
            ...prev,
            documents: [...prev.documents, { name: "New Document", value: "" }]
        }));
    };

    const updateDocUrl = (index, field, value) => {
        setFormData(prev => {
            const newDocs = [...prev.documents];
            newDocs[index] = { ...newDocs[index], [field]: value };
            return { ...prev, documents: newDocs };
        });
    };

    const updateBase64DocName = (index, value) => {
        setFormData(prev => {
            const newDocs = [...prev.documents_base64];
            newDocs[index] = { ...newDocs[index], name: value };
            return { ...prev, documents_base64: newDocs };
        });
    }

    const removeDoc = (index, isBase64) => {
        setFormData(prev => {
            if (isBase64) {
                return { ...prev, documents_base64: prev.documents_base64.filter((_, i) => i !== index) };
            }
            return { ...prev, documents: prev.documents.filter((_, i) => i !== index) };
        });
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
            className={`flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-all border-b-2 ${
                activeSection === id ? 'text-white border-white' : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
        >
            <Icon size={14} /> {label}
        </button>
    );

    const inputClasses = "w-full bg-zinc-950 border border-zinc-800 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-zinc-700";
    const labelClasses = "text-xs font-semibold text-zinc-500 uppercase tracking-widest block mb-1.5";

    return (
        <div className="fixed inset-0 bg-zinc-950/80 z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded w-full max-w-2xl overflow-hidden shadow-lg flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div>
                        <h2 className="text-lg font-medium text-white">Add Property</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">Configure new property listing</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800">
                        <FiX size={18} />
                    </button>
                </div>

                {/* Sub-navigation */}
                <div className="flex border-b border-zinc-800 px-2 overflow-x-auto scrollbar-hide">
                    <SectionTab id="basic" label="Basic" icon={FiInfo} />
                    <SectionTab id="specs" label="Specs" icon={FiLayers} />
                    <SectionTab id="location" label="Location" icon={FiMapPin} />
                    <SectionTab id="media" label="Media" icon={FiUpload} />
                    <SectionTab id="docs" label="Docs" icon={FiCheckSquare} />
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        
                        {activeSection === 'basic' && (
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClasses}>Property Title</label>
                                    <input type="text" name="property_title" value={formData.property_title} onChange={handleChange} placeholder="Listing Headline" required className={inputClasses} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Type</label>
                                        <select name="property_type" value={formData.property_type} onChange={handleChange} className={inputClasses}>
                                            {PROPERTY_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Listing</label>
                                        <select name="listing_type" value={formData.listing_type} onChange={handleChange} className={inputClasses}>
                                            {LISTING_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Asking Price</label>
                                        <input type="number" name="asking_price" value={formData.asking_price} onChange={handleChange} placeholder="0.00" required className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Currency</label>
                                        <select name="currency" value={formData.currency} onChange={handleChange} className={inputClasses}>
                                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                                        <input type="checkbox" name="price_negotiable" checked={formData.price_negotiable} onChange={handleChange} className="w-4 h-4 bg-zinc-950 border border-zinc-800 rounded checked:bg-zinc-700" />
                                        <span>Price Negotiable</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 bg-zinc-950 border border-zinc-800 rounded checked:bg-zinc-700" />
                                        <span>Active Listing</span>
                                    </label>
                                </div>
                                <div>
                                    <label className={labelClasses}>Description</label>
                                    <textarea name="property_description" value={formData.property_description} onChange={handleChange} placeholder="Detailed overview..." className={`${inputClasses} h-24 resize-none`} />
                                </div>
                            </div>
                        )}

                        {activeSection === 'specs' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClasses}>Total Area</label><input type="number" name="total_area" value={formData.total_area} onChange={handleChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Carpet Area</label><input type="number" name="carpet_area" value={formData.carpet_area} onChange={handleChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Built-up</label><input type="number" name="built_up_area" value={formData.built_up_area} onChange={handleChange} className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClasses}>Bedrooms</label><input type="number" name="total_bedrooms" value={formData.total_bedrooms} onChange={handleChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Bathrooms</label><input type="number" name="total_bathrooms" value={formData.total_bathrooms} onChange={handleChange} className={inputClasses} /></div>
                                    <div>
                                        <label className={labelClasses}>Furnishing</label>
                                        <select name="furnished_status" value={formData.furnished_status} onChange={handleChange} className={inputClasses}>
                                            {FURNISHED_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Possession</label><input type="date" name="possession_date" value={formData.possession_date} onChange={handleChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Available From</label><input type="date" name="available_from" value={formData.available_from} onChange={handleChange} className={inputClasses} /></div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Amenities</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {AMENITY_OPTIONS.map(a => (
                                            <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`text-left px-3 py-2 text-xs rounded border ${formData.amenities.includes(a) ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-400"}`}>
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-zinc-800">
                                    <label className={labelClasses}>Consultants</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {agents.map(a => (
                                            <button key={a._id} type="button" onClick={() => toggleAgent(a._id)} className={`text-left px-3 py-2 text-xs rounded border ${formData.assign_agent.includes(a._id) ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-400"}`}>
                                                {a.agent_details?.user_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'location' && (
                            <div className="space-y-4">
                                <div><label className={labelClasses}>Property Full Address</label><input type="text" name="property_address" value={formData.property_address} onChange={handleChange} className={inputClasses} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Line 1</label><input type="text" name="property_location.line1" value={formData.property_location.line1} onChange={handleChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Line 2</label><input type="text" name="property_location.line2" value={formData.property_location.line2} onChange={handleChange} className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClasses}>City</label><input type="text" name="property_location.city" value={formData.property_location.city} onChange={handleChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>State</label><input type="text" name="property_location.state" value={formData.property_location.state} onChange={handleChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Postal Code</label><input type="text" name="property_location.postal_code" value={formData.property_location.postal_code} onChange={handleChange} className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Landmark</label><input type="text" name="property_location.landmark" value={formData.property_location.landmark} onChange={handleChange} className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Country</label><input type="text" name="property_location.country" value={formData.property_location.country} onChange={handleChange} className={inputClasses} /></div>
                                </div>
                                <div className="pt-2 border-t border-zinc-800">
                                    <label className={labelClasses}>Geospatial Coordinates</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[10px] text-zinc-500 mb-1 block">Longitude</label><input type="number" step="any" value={formData.property_location.coordinates.coordinates[0]} onChange={(e) => handleCoordinateChange(0, e.target.value)} className={inputClasses} /></div>
                                        <div><label className="text-[10px] text-zinc-500 mb-1 block">Latitude</label><input type="number" step="any" value={formData.property_location.coordinates.coordinates[1]} onChange={(e) => handleCoordinateChange(1, e.target.value)} className={inputClasses} /></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'media' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    {previewImages.map((src, idx) => (
                                        <div key={idx} className="relative aspect-square rounded border border-zinc-800 group">
                                            <img src={src} className="w-full h-full object-cover rounded" alt="Property Preview" />
                                            <button onClick={() => removeImage(idx)} type="button" className="absolute top-1 right-1 w-6 h-6 rounded bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                <FiTrash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded border border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 hover:border-zinc-500 cursor-pointer transition-all bg-zinc-950">
                                        <FiPlus size={20} className="text-zinc-500" />
                                        <span className="text-xs text-zinc-500">Add Photo</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeSection === 'docs' && (
                            <div className="space-y-4">
                                {formData.documents.map((doc, idx) => (
                                    <div key={`doc-${idx}`} className="flex gap-4 items-center bg-zinc-950 p-3 rounded border border-zinc-800">
                                        <div className="flex-1 space-y-2">
                                            <input type="text" value={doc.name} onChange={(e) => updateDocUrl(idx, 'name', e.target.value)} placeholder="Doc Name" className={inputClasses} />
                                            <input type="text" value={doc.value} onChange={(e) => updateDocUrl(idx, 'value', e.target.value)} placeholder="URL" className={inputClasses} />
                                        </div>
                                        <button type="button" onClick={() => removeDoc(idx, false)} className="w-8 h-8 rounded bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white">
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {formData.documents_base64.map((doc, idx) => (
                                    <div key={`doc-new-${idx}`} className="flex gap-4 items-center bg-zinc-950 p-3 rounded border border-zinc-800">
                                        <div className="flex-1 space-y-2">
                                            <input type="text" value={doc.name} onChange={(e) => updateBase64DocName(idx, e.target.value)} placeholder="Doc Name" className={inputClasses} />
                                            <div className="px-3 py-2 bg-zinc-900 rounded text-xs text-zinc-500 border border-zinc-800 truncate">
                                                [Attached] {doc.mimeType}
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeDoc(idx, true)} className="w-8 h-8 rounded bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white">
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={handleDocUrlAdd} className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-xs font-semibold text-white transition-all flex items-center justify-center gap-2">
                                        <FiPlus size={14} /> Add URL
                                    </button>
                                    <label className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                                        <FiUpload size={14} /> Upload File
                                        <input type="file" multiple className="hidden" onChange={handleDocFileChange} />
                                    </label>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700">
                            Cancel
                        </button>
                        <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
                            {createMutation.isPending ? "Creating..." : "Create Property"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPropertiesModel;
