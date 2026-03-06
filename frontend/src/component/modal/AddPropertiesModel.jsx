import React, { useState } from "react";
import { PremiumInput } from "../common/PremiumInput";
import { PremiumButton } from "../common/PremiumButton";
import { FiX, FiHome, FiDollarSign, FiMapPin, FiInfo, FiLayers, FiUser, FiZap } from "react-icons/fi";
import { PremiumTabs } from "../common/PremiumTabs";
import { PremiumCheckbox } from "../common/PremiumCheckbox";

const PROPERTY_TYPES = ["Apartment", "Villa", "Office", "Plot", "Warehouse", "Studio", "Penthouse"];
const LISTING_TYPES = ["sale", "rent"];
const CURRENCIES = ["INR", "AED", "USD", "EUR"];
const FURNISHED_STATUS = ["Unfurnished", "Semi Furnished", "Fully Furnished", "NA"];
const AMENITIES_OPTIONS = ["Lift", "Gym", "Swimming Pool", "Security", "Power Backup", "Parking", "Garden", "Club House"];

const AddPropertiesModel = ({ isOpen, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        property_type: PROPERTY_TYPES[0],
        listing_type: LISTING_TYPES[0],
        price: "",
        currency: CURRENCIES[0],
        price_per_sqft: "",
        location: {
            city: "",
            locality: "",
            address: "",
            state: "",
            country: "India"
        },
        details: {
            bedrooms: "",
            bathrooms: "",
            balconies: "",
            area_sqft: "",
            furnished_status: FURNISHED_STATUS[0],
            floor: "",
            total_floors: "",
            parking: ""
        },
        agent: {
            name: "",
            phone: "",
            email: ""
        },
        amenities: [],
        status: "active"
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleAmenity = (amenity) => {
        setFormData(prev => {
            const amenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            return { ...prev, amenities };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[95vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">Add New Property Listing</h2>
                        <p className="text-xs text-zinc-500 mt-1">Fill in the details to create a new property record</p>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">

                        {/* Section: Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                                <FiInfo size={14} /> Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <PremiumInput
                                    label="Property Title"
                                    name="title"
                                    placeholder="e.g. Luxury 3BHK in South Mumbai"
                                    value={formData.title}
                                    onChange={handleChange}
                                    icon={<FiHome />}
                                    required
                                />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Property Type</label>
                                    <select
                                        name="property_type"
                                        value={formData.property_type}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                                    >
                                        {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Add property description and key highlights..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors min-h-[80px]"
                                />
                            </div>
                        </div>

                        {/* Section: Price & Listing */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2 uppercase tracking-widest">
                                <FiDollarSign size={14} /> Pricing & Listing
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Listing For</label>
                                    <PremiumTabs
                                        options={LISTING_TYPES}
                                        value={formData.listing_type}
                                        onChange={(val) => setFormData(prev => ({ ...prev, listing_type: val }))}
                                        showLabel={false}
                                    />
                                </div>
                                <PremiumInput
                                    label="Asking Price"
                                    name="price"
                                    type="number"
                                    placeholder="Amount"
                                    value={formData.price}
                                    onChange={handleChange}
                                    icon={<FiDollarSign />}
                                    required
                                />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Currency</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                                    >
                                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <PremiumInput
                                    label="Price/Sq.ft"
                                    name="price_per_sqft"
                                    type="number"
                                    placeholder="Rate"
                                    value={formData.price_per_sqft}
                                    onChange={handleChange}
                                    icon={<FiTrendingUp />}
                                />
                            </div>
                        </div>

                        {/* Section: Location */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 uppercase tracking-widest">
                                <FiMapPin size={14} /> Location Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <PremiumInput
                                    label="Locality"
                                    name="location.locality"
                                    placeholder="e.g. Andheri West"
                                    value={formData.location.locality}
                                    onChange={handleChange}
                                    icon={<FiMapPin />}
                                />
                                <PremiumInput
                                    label="City"
                                    name="location.city"
                                    placeholder="e.g. Mumbai"
                                    value={formData.location.city}
                                    onChange={handleChange}
                                    icon={<FiMapPin />}
                                />
                                <PremiumInput
                                    label="State"
                                    name="location.state"
                                    placeholder="e.g. Maharashtra"
                                    value={formData.location.state}
                                    onChange={handleChange}
                                    icon={<FiMapPin />}
                                />
                            </div>
                            <PremiumInput
                                label="Full Address"
                                name="location.address"
                                placeholder="Plot no, Building name, Street..."
                                value={formData.location.address}
                                onChange={handleChange}
                                icon={<FiMapPin />}
                            />
                        </div>

                        {/* Section: Property Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2 uppercase tracking-widest">
                                <FiLayers size={14} /> Property Specifications
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <PremiumInput
                                    label="Area (Sq.ft)"
                                    name="details.area_sqft"
                                    type="number"
                                    placeholder="Total Area"
                                    value={formData.details.area_sqft}
                                    onChange={handleChange}
                                    icon={<FiLayers />}
                                />
                                <PremiumInput
                                    label="Bedrooms"
                                    name="details.bedrooms"
                                    type="number"
                                    placeholder="Total"
                                    value={formData.details.bedrooms}
                                    onChange={handleChange}
                                />
                                <PremiumInput
                                    label="Bathrooms"
                                    name="details.bathrooms"
                                    type="number"
                                    placeholder="Total"
                                    value={formData.details.bathrooms}
                                    onChange={handleChange}
                                />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Furnishing</label>
                                    <select
                                        name="details.furnished_status"
                                        value={formData.details.furnished_status}
                                        onChange={handleChange}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                                    >
                                        {FURNISHED_STATUS.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section: Amenities */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2 uppercase tracking-widest">
                                <FiZap size={14} /> Amenities
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
                                {AMENITIES_OPTIONS.map(amenity => (
                                    <PremiumCheckbox
                                        key={amenity}
                                        label={amenity}
                                        checked={formData.amenities.includes(amenity)}
                                        onChange={() => toggleAmenity(amenity)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Section: Agent Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-500 flex items-center gap-2 uppercase tracking-widest">
                                <FiUser size={14} /> Assigned Agent
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <PremiumInput
                                    label="Agent Name"
                                    name="agent.name"
                                    placeholder="Enter name"
                                    value={formData.agent.name}
                                    onChange={handleChange}
                                    icon={<FiUser />}
                                />
                                <PremiumInput
                                    label="Phone Number"
                                    name="agent.phone"
                                    placeholder="+91XXXXX-XXXXX"
                                    value={formData.agent.phone}
                                    onChange={handleChange}
                                />
                                <PremiumInput
                                    label="Email"
                                    name="agent.email"
                                    type="email"
                                    placeholder="agent@example.com"
                                    value={formData.agent.email}
                                    onChange={handleChange}
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
                                onClick={onClose}
                            />
                        </div>
                        <div className="flex-1">
                            <PremiumButton
                                text="Create Listing"
                                type="submit"
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPropertiesModel;
