import React, { useState, useEffect, useCallback } from "react";
import { 
    FiX, FiHome, FiDollarSign, FiPlus, FiMapPin, FiInfo, FiLayers, 
    FiUser, FiTrendingUp, FiUpload, FiTrash2, FiLoader, FiCalendar, FiCheckSquare, FiZap
} from "react-icons/fi";
import { useUpdateProperty } from "../../hooks/usePropertyHooks";
import { useAgents } from "../../hooks/useAgentHooks";

const PROPERTY_TYPES = ["Apartment", "Villa", "Office", "Plot", "Warehouse", "Studio", "Penthouse"];
const LISTING_TYPES = ["sale", "rent", "investment"];
const CURRENCIES = ["INR", "AED", "USD", "EUR", "GBP", "JPY"];
const FURNISHED_STATUS = ["fully furnished", "semi furnished", "unfurnished", "furnished", "NA"];
const AMENITY_OPTIONS = ["Infinity Pool", "Gym", "24/7 Security", "Covered Parking", "Concierge Service", "Balcony", "Central AC", "Elevator", "Power Backup", "Clubhouse"];

const EditPropertiesModel = ({ isOpen, onClose, property }) => {
    const [formData, setFormData] = useState({
        property_title: "",
        property_description: "",
        property_type: "",
        listing_type: "",
        asking_price: "",
        currency: "INR",
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
                coordinates: [0, 0]
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
        photos: [],
        photos_base64: [],
        documents: [],
        documents_base64: [],
        is_active: true
    });

    const [previewImages, setPreviewImages] = useState([]);
    const [activeSection, setActiveSection] = useState("basic");
    const [newPhotoUrl, setNewPhotoUrl] = useState("");

    const { data: agentsData, isLoading: isLoadingAgents } = useAgents();
    const updateMutation = useUpdateProperty();
    const agents = agentsData?.data || [];

    useEffect(() => {
        if (property && isOpen) {
            setFormData({
                property_title: property.property_title || "",
                property_description: property.property_description || "",
                property_type: property.property_type || PROPERTY_TYPES[0],
                listing_type: property.listing_type || "sale",
                asking_price: property.asking_price || "",
                currency: property.currency || "INR",
                price_sqft: property.price_sqft || "",
                price_negotiable: property.price_negotiable ?? false,
                property_status: property.property_status || "available",
                property_address: property.property_address || "",
                property_location: {
                    line1: property.property_location?.line1 || "",
                    line2: property.property_location?.line2 || "",
                    city: property.property_location?.city || "",
                    state: property.property_location?.state || "",
                    country: property.property_location?.country || "India",
                    postal_code: property.property_location?.postal_code || "",
                    landmark: property.property_location?.landmark || "",
                    coordinates: {
                        type: "Point",
                        coordinates: property.property_location?.coordinates?.coordinates || [0, 0]
                    }
                },
                total_area: property.total_area || "",
                area_unit: property.area_unit || "sqft",
                carpet_area: property.carpet_area || "",
                built_up_area: property.built_up_area || "",
                total_bedrooms: property.total_bedrooms || "",
                total_bathrooms: property.total_bathrooms || "",
                furnished_status: property.furnished_status === "NA" ? "NA" : (property.furnished_status || "unfurnished").toLowerCase(),
                amenities: property.amenities || [],
                assign_agent: Array.isArray(property.assign_agent) ? property.assign_agent.map(a => a._id || a) : [],
                possession_date: property.possession_date ? new Date(property.possession_date).toISOString().split('T')[0] : "",
                available_from: property.available_from ? new Date(property.available_from).toISOString().split('T')[0] : "",
                photos: property.photos || [],
                photos_base64: [],
                documents: property.documents || [],
                documents_base64: [],
                is_active: property.is_active ?? true
            });
            setPreviewImages(property.photos || []);
        }
    }, [property, isOpen]);

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

    const handleAddPhotoUrl = () => {
        if (!newPhotoUrl.trim()) return;
        const url = newPhotoUrl.trim();
        setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, url]
        }));
        setPreviewImages(prev => [...prev, url]);
        setNewPhotoUrl("");
    };

    const removeImage = (index) => {
        const urlToRemove = previewImages[index];
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        
        setFormData(prev => {
            const isExisting = (prev.photos || []).includes(urlToRemove);
            const isNewBase64 = (prev.photos_base64 || []).includes(urlToRemove);

            if (isExisting) {
                return { ...prev, photos: prev.photos.filter(u => u !== urlToRemove) };
            }
            if (isNewBase64) {
                return { ...prev, photos_base64: prev.photos_base64.filter(b => b !== urlToRemove) };
            }
            return prev;
        });
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
            await updateMutation.mutateAsync({ id: property._id, data: formData });
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
                
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div>
                        <h2 className="text-lg font-medium text-white">Edit Listing</h2>
                        <p className="text-xs text-zinc-500 mt-0.5">UUID: {property?._id.toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-800">
                        <FiX size={18} />
                    </button>
                </div>

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
                                <div><label className={labelClasses}>Property Title</label><input type="text" name="property_title" value={formData.property_title} onChange={handleChange} required className={inputClasses}/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Type</label>
                                        <select name="property_type" value={formData.property_type} onChange={handleChange} className={inputClasses}>
                                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Status</label>
                                        <select name="property_status" value={formData.property_status} onChange={handleChange} className={inputClasses}>
                                            {["available", "under_offer", "sold", "rented", "inactive"].map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Asking Price</label><input type="number" name="asking_price" value={formData.asking_price} onChange={handleChange} required className={inputClasses} /></div>
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
                                <div><label className={labelClasses}>Description</label><textarea name="property_description" value={formData.property_description} onChange={handleChange} className={`${inputClasses} h-24 resize-none`} /></div>
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
                                    <label className={labelClasses}>Assigned Agents</label>
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
                                <div><label className={labelClasses}>Full Address</label><input type="text" name="property_address" value={formData.property_address} onChange={handleChange} className={inputClasses} /></div>
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
                                    <label className={labelClasses}>Coordinates</label>
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
                                            <img src={src} className="w-full h-full object-cover rounded" alt="Preview" />
                                            <button onClick={() => removeImage(idx)} type="button" className="absolute top-1 right-1 w-6 h-6 rounded bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                <FiTrash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded border border-dashed border-zinc-700 flex flex-col items-center justify-center gap-2 hover:border-zinc-500 cursor-pointer transition-all bg-zinc-950">
                                        <FiPlus size={20} className="text-zinc-500" />
                                        <span className="text-xs text-zinc-500 text-center px-1">Upload File</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>

                                <div className="pt-4 border-t border-zinc-800">
                                    <label className={labelClasses}>Add Photo via URL</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={newPhotoUrl} 
                                            onChange={(e) => setNewPhotoUrl(e.target.value)} 
                                            placeholder="https://example.com/image.jpg" 
                                            className={inputClasses} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleAddPhotoUrl}
                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded whitespace-nowrap"
                                        >
                                            Add URL
                                        </button>
                                    </div>
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
                                        <button type="button" onClick={() => removeDoc(idx, false)} className="w-8 h-8 rounded bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
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
                                        <button type="button" onClick={() => removeDoc(idx, true)} className="w-8 h-8 rounded bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
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

                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700">
                            Cancel
                        </button>
                        <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 rounded bg-yellow-600 text-sm font-medium text-white hover:bg-yellow-500 disabled:opacity-50">
                            {updateMutation.isPending ? "Updating..." : "Update Listing"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPropertiesModel;
