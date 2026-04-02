import React, { useCallback, useEffect, useState } from "react";
import { 
    FiX, FiHome, FiDollarSign, FiPlus, FiMapPin, FiInfo, FiLayers, 
    FiUser, FiTrendingUp, FiUpload, FiTrash2, FiLoader, FiCalendar, FiCheckSquare, FiZap
} from "react-icons/fi";
import { useCreateProperty } from "../../hooks/usePropertyHooks";
import { useAgents } from "../../hooks/useAgentHooks";

const PROPERTY_TYPES = ["Apartment", "Villa", "Office", "Plot", "Warehouse", "Studio", "Penthouse", "Townhouse", "Shop", "Industrial"];
const LISTING_TYPES = [
    "rent", "sale", "investment", "off_plan", "resale", "lease", 
    "short_term", "holiday_home", "commercial_rent", "commercial_sale", 
    "pre_launch", "auction", "joint_venture", "land_sale", "other"
];
const CURRENCIES = ["INR", "AED", "USD", "EUR", "GBP", "JPY"];
const FURNISHED_STATUS = ["fully furnished", "semi furnished", "unfurnished", "furnished", "NA"];
const PROPERTY_STATUSES = [
    "available", "under_offer", "reserved", "booked", "sold", "rented", 
    "leased", "blocked", "under_negotiation", "hold", "unavailable", 
    "withdrawn", "expired", "inactive", "other"
];
const COMPLETION_STATUSES = ["ready", "off_plan", "under_construction", "new_launch", "resale", "secondary_market", "unknown"];
const OCCUPANCY_STATUSES = ["vacant", "owner_occupied", "tenant_occupied", "leased", "unknown"];
const PROPERTY_CATEGORIES = ["residential", "commercial", "land", "hospitality", "industrial", "mixed_use", "other"];

const getInitialFormData = () => ({
    property_title: "",
    property_description: "",
    property_type: PROPERTY_TYPES[0],
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
        google_map_url: ""
    },
    total_area: "",
    area_unit: "sqft",
    carpet_area: "",
    built_up_area: "",
    total_bedrooms: "",
    total_bathrooms: "",
    furnished_status: "NA",
    amenities: [],
    assign_agent: [],
    possession_date: "",
    available_from: "",
    photos: [],
    photos_base64: [],
    documents: [],
    documents_base64: [],
    is_active: true,

    // International / Project details
    property_code: "",
    reference_id: "",
    external_id: "",
    property_category: "residential",
    property_sub_type: "",
    project_name: "",
    tower_name: "",
    building_name: "",
    community_name: "",
    sub_community: "",
    unit_number: "",
    floor_number: "",
    total_floors: "",

    // Room configuration
    bedroom_label: "",
    maid_room: false,
    servant_room: false,
    study_room: false,
    store_room: false,
    balcony_count: 0,
    parking_count: 0,

    // Area flexibility
    plot_area: "",
    plot_area_unit: "sqft",
    super_built_up_area: "",
    usable_area: "",

    // Price intelligence
    original_price: "",
    rental_yield: "",
    service_charges: "",
    maintenance_fee: "",
    payment_plan: "",
    down_payment: "",

    // Workflow
    completion_status: "unknown",
    handover_date: "",
    handover_label: "",

    // Occupancy
    occupancy_status: "unknown",
    tenant_name: "",
    tenant_phone: "",
    lease_end_date: "",

    // Legal
    permit_number: "",
    rera_number: "",
    dld_permit_number: "",
    title_deed_number: "",

    // SEO / Presentation
    video_url: "",
    virtual_tour_url: "",
    floor_plan_url: "",
    brochure_url: "",
    tags: [],
    highlights: [],
    view_type: "",
    remarks: ""
});

const AMENITY_OPTIONS = [
    "Infinity Pool", "Gym", "24/7 Security", "Covered Parking", "Concierge Service", "Balcony", "Central AC", 
    "Elevator", "Power Backup", "Clubhouse", "Maid Service", "Private Pool", "Garden", "Sauna", "Steam Room",
    "Jacuzzi", "Built-in Wardrobes", "Kitchen Appliances", "Walk-in Closet", "Study Room", "Maid's Room", 
    "Laundry Room", "Storage Room", "Balcony/Terrace", "Private Garden", "Shared Pool", "Shared Gym", 
    "Children's Play Area", "BBQ Area", "Tennis Court", "Basketball Court", "Squash Court", "Yoga Studio", 
    "Spa", "Business Center", "Conference Room", "Lobby in Building", "Valet Parking", "Pet Friendly", 
    "Smart Home System", "View of Water", "View of Landmark", "Beach Access", "Marina Access", "Golf Course", 
    "Park Access", "Supermarket Nearby", "Pharmacy Nearby", "School Nearby", "Metro Nearby", "Waste Disposal", 
    "Cleaning Services", "Maintenance Staff"
];

const AddPropertiesModel = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState(getInitialFormData);
    const [previewImages, setPreviewImages] = useState([]);
    const [activeSection, setActiveSection] = useState("basic");
    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [newTag, setNewTag] = useState("");
    const [newHighlight, setNewHighlight] = useState("");

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
            if (prev.photos.includes(urlToRemove)) {
                return { ...prev, photos: prev.photos.filter(u => u !== urlToRemove) };
            }
            if (prev.photos_base64.includes(urlToRemove)) {
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

    const handleAddTag = () => {
        if (!newTag.trim()) return;
        setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, newTag.trim()]
        }));
        setNewTag("");
    };

    const removeTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const handleAddHighlight = () => {
        if (!newHighlight.trim()) return;
        setFormData(prev => ({
            ...prev,
            highlights: [...prev.highlights, newHighlight.trim()]
        }));
        setNewHighlight("");
    };

    const removeHighlight = (highlight) => {
        setFormData(prev => ({
            ...prev,
            highlights: prev.highlights.filter(h => h !== highlight)
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
            <div className="bg-zinc-900 border border-zinc-800 rounded w-full max-w-4xl overflow-hidden shadow-lg flex flex-col max-h-[95vh]">
                
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
                    <SectionTab id="crm" label="CRM" icon={FiTrendingUp} />
                    <SectionTab id="occupancy" label="Occupancy" icon={FiUser} />
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
                                        <label className={labelClasses}>Listing Type</label>
                                        <select name="listing_type" value={formData.listing_type} onChange={handleChange} required className={inputClasses}>
                                            {LISTING_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase().replace('_', ' ')}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Property Category</label>
                                        <select name="property_category" value={formData.property_category} onChange={handleChange} className={inputClasses}>
                                            {PROPERTY_CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase().replace('_', ' ')}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Property Type</label>
                                        <select name="property_type" value={formData.property_type} onChange={handleChange} className={inputClasses}>
                                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Property Sub-Type</label>
                                        <input type="text" name="property_sub_type" value={formData.property_sub_type} onChange={handleChange} placeholder="e.g. Garden Villa" className={inputClasses} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Asking Price</label>
                                        <input type="number" name="asking_price" value={formData.asking_price} onChange={handleChange} placeholder="0.00" className={inputClasses} />
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
                                    <label className={labelClasses}>Property Description</label>
                                    <textarea name="property_description" value={formData.property_description} onChange={handleChange} placeholder="Detailed overview..." className={`${inputClasses} h-24 resize-none`} />
                                </div>
                            </div>
                        )}

                        {activeSection === 'specs' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClasses}>Total Area</label><input type="number" name="total_area" value={formData.total_area} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Unit</label>
                                        <select name="area_unit" value={formData.area_unit} onChange={handleChange} className={inputClasses}>
                                            {["sqft", "sqm", "sqyd", "acre", "bigha", "hectare"].map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div><label className={labelClasses}>Carpet Area</label><input type="number" name="carpet_area" value={formData.carpet_area} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClasses}>Bedrooms</label><input type="number" name="total_bedrooms" value={formData.total_bedrooms} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Bathrooms</label><input type="number" name="total_bathrooms" value={formData.total_bathrooms} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Bedroom Label</label><input type="text" name="bedroom_label" value={formData.bedroom_label} onChange={handleChange} placeholder="e.g. 3 BR + Maid" className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400"><input type="checkbox" name="maid_room" checked={formData.maid_room} onChange={handleChange} /> Maid's Room</label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400"><input type="checkbox" name="servant_room" checked={formData.servant_room} onChange={handleChange} /> Servant's Room</label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400"><input type="checkbox" name="study_room" checked={formData.study_room} onChange={handleChange} /> Study Room</label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400"><input type="checkbox" name="store_room" checked={formData.store_room} onChange={handleChange} /> Store Room</label>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400"><input type="checkbox" name="balcony_count" checked={formData.balcony_count > 0} onChange={(e) => setFormData(p => ({...p, balcony_count: e.target.checked ? 1 : 0}))} /> Has Balcony</label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400"><input type="checkbox" name="parking_count" checked={formData.parking_count > 0} onChange={(e) => setFormData(p => ({...p, parking_count: e.target.checked ? 1 : 0}))} /> Has Parking</label>
                                </div>
                                <div className="pt-4 border-t border-zinc-800">
                                    <label className={labelClasses}>Area Flexibility</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div><label className={labelClasses}>Plot Area</label><input type="number" name="plot_area" value={formData.plot_area} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                        <div><label className={labelClasses}>Plot Unit</label>
                                            <select name="plot_area_unit" value={formData.plot_area_unit} onChange={handleChange} className={inputClasses}>
                                                {["sqft", "sqm", "sqyd", "acre", "bigha", "hectare"].map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                        <div><label className={labelClasses}>Super Built-up</label><input type="number" name="super_built_up_area" value={formData.super_built_up_area} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        <div><label className={labelClasses}>Usable Area</label><input type="number" name="usable_area" value={formData.usable_area} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={labelClasses}>Furnishing</label>
                                        <select name="furnished_status" value={formData.furnished_status} onChange={handleChange} className={inputClasses}>
                                            {FURNISHED_STATUS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div><label className={labelClasses}>Floor No.</label><input type="number" name="floor_number" value={formData.floor_number} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Total Floors</label><input type="number" name="total_floors" value={formData.total_floors} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Amenities</label>
                                    <div className="flex flex-wrap gap-2">
                                        {AMENITY_OPTIONS.map(a => (
                                            <button key={a} type="button" onClick={() => toggleAmenity(a)} className={`px-3 py-2 text-[10px] rounded border transition-all ${formData.amenities.includes(a) ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}>
                                                {a}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'location' && (
                            <div className="space-y-4">
                                <div><label className={labelClasses}>Property Address</label><input type="text" name="property_address" value={formData.property_address} onChange={handleChange} placeholder="Full address" className={inputClasses} /></div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClasses}>Building</label><input type="text" name="building_name" value={formData.building_name} onChange={handleChange} placeholder="e.g. Burj Khalifa" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Tower</label><input type="text" name="tower_name" value={formData.tower_name} onChange={handleChange} placeholder="e.g. Tower A" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Unit Number</label><input type="text" name="unit_number" value={formData.unit_number} onChange={handleChange} placeholder="e.g. 101" className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Community</label><input type="text" name="community_name" value={formData.community_name} onChange={handleChange} placeholder="e.g. Downtown Dubai" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Sub Community</label><input type="text" name="sub_community" value={formData.sub_community} onChange={handleChange} placeholder="e.g. Old Town" className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClasses}>City</label><input type="text" name="property_location.city" value={formData.property_location.city} onChange={handleChange} placeholder="City Name" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>State</label><input type="text" name="property_location.state" value={formData.property_location.state} onChange={handleChange} placeholder="State" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Country</label><input type="text" name="property_location.country" value={formData.property_location.country} onChange={handleChange} placeholder="Country Name" className={inputClasses} /></div>
                                </div>
                                <div><label className={labelClasses}>Google Maps URL</label><input type="text" name="property_location.google_map_url" value={formData.property_location.google_map_url} onChange={handleChange} placeholder="https://goo.gl/maps/..." className={inputClasses} /></div>
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
                                        <span className="text-[10px] text-zinc-500 text-center px-1">Upload File</span>
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Video URL</label><input type="text" name="video_url" value={formData.video_url} onChange={handleChange} placeholder="YouTube/Vimeo link" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Virtual Tour URL</label><input type="text" name="virtual_tour_url" value={formData.virtual_tour_url} onChange={handleChange} placeholder="https://..." className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Floor Plan URL</label><input type="text" name="floor_plan_url" value={formData.floor_plan_url} onChange={handleChange} placeholder="https://..." className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Brochure URL</label><input type="text" name="brochure_url" value={formData.brochure_url} onChange={handleChange} placeholder="https://..." className={inputClasses} /></div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'crm' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className={labelClasses}>Property Code</label><input type="text" name="property_code" value={formData.property_code} onChange={handleChange} placeholder="REF-001" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Reference ID</label><input type="text" name="reference_id" value={formData.reference_id} onChange={handleChange} placeholder="REF-ID" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>External ID</label><input type="text" name="external_id" value={formData.external_id} onChange={handleChange} placeholder="EXT-ID" className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Property Status</label>
                                        <select name="property_status" value={formData.property_status} onChange={handleChange} className={inputClasses}>
                                            {PROPERTY_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClasses}>Completion Status</label>
                                        <select name="completion_status" value={formData.completion_status} onChange={handleChange} className={inputClasses}>
                                            {COMPLETION_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClasses}>Occupancy</label>
                                        <select name="occupancy_status" value={formData.occupancy_status} onChange={handleChange} className={inputClasses}>
                                            {OCCUPANCY_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</option>)}
                                        </select>
                                    </div>
                                    <div><label className={labelClasses}>View Type</label><input type="text" name="view_type" value={formData.view_type} onChange={handleChange} placeholder="e.g. Marina View" className={inputClasses} /></div>
                                </div>
                                <div className="pt-4 border-t border-zinc-800">
                                    <label className={labelClasses}>Market Intelligence</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div><label className={labelClasses}>Original Price</label><input type="number" name="original_price" value={formData.original_price} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                        <div><label className={labelClasses}>Rental Yield %</label><input type="number" name="rental_yield" value={formData.rental_yield} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                        <div><label className={labelClasses}>Service Charges</label><input type="number" name="service_charges" value={formData.service_charges} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        <div><label className={labelClasses}>Maintenance Fee</label><input type="number" name="maintenance_fee" value={formData.maintenance_fee} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                        <div><label className={labelClasses}>Down Payment</label><input type="number" name="down_payment" value={formData.down_payment} onChange={handleChange} placeholder="0" className={inputClasses} /></div>
                                        <div><label className={labelClasses}>Payment Plan</label><input type="text" name="payment_plan" value={formData.payment_plan} onChange={handleChange} placeholder="e.g. 20/80" className={inputClasses} /></div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-zinc-800">
                                    <label className={labelClasses}>Off-Plan Workflow</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className={labelClasses}>Handover Date</label><input type="date" name="handover_date" value={formData.handover_date} onChange={handleChange} className={inputClasses} /></div>
                                        <div><label className={labelClasses}>Handover Label</label><input type="text" name="handover_label" value={formData.handover_label} onChange={handleChange} placeholder="e.g. Q4 2026" className={inputClasses} /></div>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-zinc-800">
                                    <label className={labelClasses}>Consultants Assigned</label>
                                    <div className="flex flex-wrap gap-2">
                                        {agents.map(a => (
                                            <button key={a._id} type="button" onClick={() => toggleAgent(a._id)} className={`px-3 py-2 text-[10px] rounded border transition-all ${formData.assign_agent.includes(a._id) ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}>
                                                {a.agent_details?.user_name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Tags</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.tags.map(t => (
                                            <span key={t} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] rounded flex items-center gap-1">
                                                {t} <FiX size={10} className="cursor-pointer" onClick={() => removeTag(t)} />
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag..." className={inputClasses} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} />
                                        <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-zinc-800 rounded text-white text-xs"><FiPlus /></button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClasses}>Highlights</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.highlights.map(h => (
                                            <span key={h} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] rounded flex items-center gap-1">
                                                {h} <FiX size={10} className="cursor-pointer" onClick={() => removeHighlight(h)} />
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={newHighlight} onChange={(e) => setNewHighlight(e.target.value)} placeholder="Add highlight..." className={inputClasses} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHighlight())} />
                                        <button type="button" onClick={handleAddHighlight} className="px-3 py-2 bg-zinc-800 rounded text-white text-xs"><FiPlus /></button>
                                    </div>
                                </div>
                                <div><label className={labelClasses}>Remarks</label><textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Internal remarks..." className={`${inputClasses} h-20 resize-none`} /></div>
                            </div>
                        )}

                        {activeSection === 'occupancy' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Tenant Name</label><input type="text" name="tenant_name" value={formData.tenant_name} onChange={handleChange} placeholder="Tenant Name" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Tenant Phone</label><input type="text" name="tenant_phone" value={formData.tenant_phone} onChange={handleChange} placeholder="Tenant Phone" className={inputClasses} /></div>
                                </div>
                                <div><label className={labelClasses}>Lease End Date</label><input type="date" name="lease_end_date" value={formData.lease_end_date} onChange={handleChange} className={inputClasses} /></div>
                            </div>
                        )}

                        {activeSection === 'docs' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>RERA Number</label><input type="text" name="rera_number" value={formData.rera_number} onChange={handleChange} placeholder="RERA-12345" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Permit Number</label><input type="text" name="permit_number" value={formData.permit_number} onChange={handleChange} placeholder="PERMIT-67890" className={inputClasses} /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>DLD Permit</label><input type="text" name="dld_permit_number" value={formData.dld_permit_number} onChange={handleChange} placeholder="DLD-XXXXX" className={inputClasses} /></div>
                                    <div><label className={labelClasses}>Title Deed</label><input type="text" name="title_deed_number" value={formData.title_deed_number} onChange={handleChange} placeholder="DEED-XXXXX" className={inputClasses} /></div>
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Attached Documents</label>
                                    {formData.documents.map((doc, idx) => (
                                        <div key={`doc-${idx}`} className="flex gap-2 items-center bg-zinc-950 p-2 rounded border border-zinc-800">
                                            <input type="text" value={doc.name} onChange={(e) => updateDocUrl(idx, 'name', e.target.value)} placeholder="Doc Name" className="flex-1 bg-transparent text-xs text-white outline-none" />
                                            <input type="text" value={doc.value} onChange={(e) => updateDocUrl(idx, 'value', e.target.value)} placeholder="URL" className="flex-1 bg-transparent text-xs text-zinc-500 outline-none" />
                                            <FiTrash2 size={12} className="text-red-500 cursor-pointer" onClick={() => removeDoc(idx, false)} />
                                        </div>
                                    ))}
                                    {formData.documents_base64.map((doc, idx) => (
                                        <div key={`doc-new-${idx}`} className="flex gap-2 items-center bg-zinc-950 p-2 rounded border border-zinc-800">
                                            <input type="text" value={doc.name} onChange={(e) => updateBase64DocName(idx, e.target.value)} placeholder="Doc Name" className="flex-1 bg-transparent text-xs text-white outline-none" />
                                            <span className="text-[10px] text-zinc-500 italic">[File Attached]</span>
                                            <FiTrash2 size={12} className="text-red-500 cursor-pointer" onClick={() => removeDoc(idx, true)} />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleDocUrlAdd} className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-400 hover:text-white flex items-center justify-center gap-1"><FiPlus /> Add URL</button>
                                    <label className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-400 hover:text-white flex items-center justify-center gap-1 cursor-pointer"><FiUpload /> Upload File<input type="file" multiple className="hidden" onChange={handleDocFileChange} /></label>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700">
                            Cancel
                        </button>
                        <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded bg-yellow-600 text-sm font-medium text-white hover:bg-yellow-500 disabled:opacity-50">
                            {createMutation.isPending ? "Creating..." : "Create Property"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPropertiesModel;
