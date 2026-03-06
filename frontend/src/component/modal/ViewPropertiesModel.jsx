import React from "react";
import {
    FiX, FiHome, FiDollarSign, FiMapPin, FiLayers, FiUser,
    FiZap, FiCalendar, FiTrendingUp, FiCheckCircle, FiInfo
} from "react-icons/fi";
import { PremiumButton } from "../common/PremiumButton";

const ViewPropertiesModel = ({ isOpen, onClose, property }) => {
    if (!isOpen || !property) return null;

    const formatPrice = (price, currency) => {
        if (currency === "INR") {
            if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
            if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
            return `₹${Number(price).toLocaleString()}`;
        }
        return `${currency} ${Number(price).toLocaleString()}`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800/50 rounded-3xl w-full max-w-4xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">

                {/* Status Header Overlay */}
                <div className="relative h-2 w-full">
                    <div className={`h-full w-full ${property.status === 'active' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' :
                            property.status === 'sold' ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-zinc-600'
                        }`} />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between p-8 border-b border-zinc-900/50 bg-zinc-900/20">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md border border-zinc-700">
                                {property.property_id}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-md border-2 ${property.listing_type === 'sale'
                                    ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                    : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                }`}>
                                FOR {property.listing_type}
                            </span>
                        </div>
                        <h2 className="text-3xl font-black text-white leading-tight">{property.title}</h2>
                        <p className="text-zinc-400 flex items-center gap-2 text-sm">
                            <FiMapPin className="text-emerald-500" />
                            {property.location.address}, {property.location.locality}, {property.location.city}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 transition-all">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Asking Price</p>
                            <h4 className="text-xl font-black text-white">{formatPrice(property.price, property.currency)}</h4>
                            <p className="text-[11px] text-zinc-500 mt-1">{property.price_per_sqft} / sqft</p>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Area</p>
                            <h4 className="text-xl font-black text-white">{property.details.area_sqft} <span className="text-xs font-medium text-zinc-500">Sq.ft</span></h4>
                            <p className="text-[11px] text-zinc-500 mt-1">{property.property_type}</p>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${property.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                                        property.status === 'sold' ? 'bg-blue-500' : 'bg-zinc-600'
                                    }`} />
                                <h4 className="text-xl font-black text-white uppercase">{property.status}</h4>
                            </div>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800 p-4 rounded-2xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Views</p>
                            <h4 className="text-xl font-black text-white">{property.views || 0}</h4>
                            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                                <FiTrendingUp size={10} className="text-emerald-500" />
                                Updated tracking
                            </p>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                            <FiInfo className="mt-0.5" /> Property Description
                        </h3>
                        <div className="bg-zinc-900/20 border border-zinc-800/50 p-6 rounded-2xl">
                            <p className="text-zinc-300 leading-relaxed italic">
                                "{property.description || "No description provided for this listing."}"
                            </p>
                        </div>
                    </div>

                    {/* Detailed Specs & Amenities Grid */}
                    <div className="grid md:grid-cols-2 gap-10">
                        {/* Specifications */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 uppercase tracking-widest">
                                <FiLayers /> Specifications
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Bedrooms", value: property.details.bedrooms },
                                    { label: "Bathrooms", value: property.details.bathrooms },
                                    { label: "Balconies", value: property.details.balconies },
                                    { label: "Floor", value: `${property.details.floor} of ${property.details.total_floors}` },
                                    { label: "Furnishing", value: property.details.furnished_status },
                                    { label: "Parking", value: property.details.parking > 0 ? `${property.details.parking} Slots` : "None" }
                                ].map((spec, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-900">
                                        <span className="text-xs text-zinc-500 font-medium">{spec.label}</span>
                                        <span className="text-xs text-white font-bold">{spec.value || "NA"}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-yellow-400 flex items-center gap-2 uppercase tracking-widest">
                                <FiZap /> Amenities
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                                {property.amenities && property.amenities.length > 0 ? (
                                    property.amenities.map((amenity, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl group hover:border-emerald-500/30 transition-all">
                                            <FiCheckCircle size={14} className="text-emerald-500 shrink-0" />
                                            <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">{amenity}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-zinc-600 font-medium italic p-4 text-center border border-dashed border-zinc-800 rounded-xl">No amenities listed.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Agent & History Footer */}
                    <div className="pt-6 border-t border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-xl font-black text-white shadow-lg">
                                {property.agent.name.charAt(0)}
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Assigned Agent</p>
                                <h4 className="text-white font-bold">{property.agent.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-zinc-400">
                                    <span className="hover:text-blue-400 cursor-pointer">{property.agent.phone}</span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                    <span className="hover:text-blue-400 cursor-pointer">{property.agent.email}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <FiCalendar size={18} className="text-zinc-500" />
                            <div>
                                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-0.5">Listing Created</p>
                                <p className="text-xs font-black text-zinc-400 italic font-medium">{property.created_at}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-8 border-t border-zinc-900/50 bg-zinc-900/10 flex gap-4">
                    <div className="flex-1">
                        <PremiumButton
                            text="Close View"
                            variant="secondary"
                            onClick={onClose}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewPropertiesModel;
