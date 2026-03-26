import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../component/layout/AppLayout";
import {
    FiHome,FiMapPin, FiLayers,FiActivity,
    FiZap, FiTrendingUp, FiCheckCircle, FiInfo, FiChevronLeft, FiChevronRight, FiMaximize2, FiArrowLeft, FiLoader, FiGlobe, FiHash, FiShield, FiClock
} from "react-icons/fi";
import { PremiumButton } from "../component/common/PremiumButton";
import { useProperty } from "../hooks/usePropertyHooks";

const PropertyDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: propertyData, isLoading, error } = useProperty(id);
    const [activeImage, setActiveImage] = useState(0);

    const property = propertyData?.data;

    const photos = property?.photos && property.photos.length > 0 
        ? property.photos 
        : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop"];

    const nextImage = () => setActiveImage((prev) => (prev + 1) % photos.length);
    const prevImage = () => setActiveImage((prev) => (prev - 1 + photos.length) % photos.length);

    const formatPrice = (price, currency) => {
        if (!price) return "TBD";
        if (currency === "INR") {
            if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
            if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
            return `₹${Number(price).toLocaleString()}`;
        }
        return `${currency || "USD"} ${Number(price).toLocaleString()}`;
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <FiLoader size={48} className="text-emerald-500 animate-spin" />
                    <p className="text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Loading Property Intelligence...</p>
                </div>
            </AppLayout>
        );
    }

    if (error || !property) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2">
                        <FiInfo size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Listing Not Found</h2>
                        <p className="text-zinc-500 max-w-md italic">The requested property listing might have been removed or is temporarily unavailable in the centralized inventory.</p>
                    </div>
                    <PremiumButton text="Back to Inventory" variant="secondary" onClick={() => navigate("/properties")} icon={<FiArrowLeft />} />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Top Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pt-2 gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate("/properties")}
                        className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-white leading-none">Property Insight</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2">UUID: {property._id.toUpperCase()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-lg ${
                        property.property_status === 'available' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                    }`}>
                        {property.property_status}
                    </span>
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        property.is_active ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
                    }`}>
                        {property.is_active ? 'Active' : 'Archived'}
                    </span>
                    <PremiumButton text="Dossier" variant="secondary" onClick={() => window.print()} icon={<FiMaximize2 />} />
                </div>
            </div>

            {/* Immersive Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
                
                {/* Visual Gallery - Column Span 7 */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="relative aspect-[16/10] bg-zinc-900 rounded-[2.5rem] overflow-hidden group shadow-2xl border border-zinc-500/10">
                        <img 
                            src={photos[activeImage]} 
                            alt={property.property_title} 
                            className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        
                        {/* Navigation Arrows */}
                        {photos.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20">
                                    <FiChevronLeft size={24} />
                                </button>
                                <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20">
                                    <FiChevronRight size={24} />
                                </button>
                            </>
                        )}

                        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                             <div className="flex gap-2">
                                {photos.map((_, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setActiveImage(i)}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${i === activeImage ? 'w-12 bg-emerald-500' : 'w-3 bg-white/20 hover:bg-white/50'}`} 
                                    />
                                ))}
                            </div>
                            <span className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest font-mono">
                                {activeImage + 1} / {photos.length}
                            </span>
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {photos.map((src, i) => (
                            <button 
                                key={i}
                                onClick={() => setActiveImage(i)}
                                className={`flex-shrink-0 w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${i === activeImage ? 'border-emerald-500 scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            >
                                <img src={src} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Core Pricing & Basic Specs - Column Span 5 */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl flex-1 flex flex-col justify-between">
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-lg">
                                    {property.property_type}
                                </span>
                                <span className={`px-3 py-1 border text-[10px] font-black uppercase tracking-[0.25em] rounded-lg ${
                                    property.listing_type === 'sale' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                                }`}>
                                    For {property.listing_type}
                                </span>
                            </div>

                            <h1 className="text-3xl font-black text-white leading-tight tracking-tight">{property.property_title}</h1>

                            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2rem] space-y-2">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Valuation</p>
                                <h3 className="text-4xl font-black text-white">{formatPrice(property.asking_price, property.currency)}</h3>
                                <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-bold pt-2">
                                    <span className="flex items-center gap-1.5"><FiTrendingUp /> {property.price_sqft} / {property.area_unit}</span>
                                    <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                    <span>{property.price_negotiable ? "Negotiable" : "Non-negotiable"}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                {[
                                    { icon: <FiLayers />, label: "Area", value: `${property.total_area} ${property.area_unit}` },
                                    { icon: <FiHome />, label: "Bedrooms", value: property.total_bedrooms },
                                    { icon: <FiActivity />, label: "Bathrooms", value: property.total_bathrooms },
                                    { icon: <FiZap />, label: "Furnishing", value: property.furnished_status }
                                ].map((spec, i) => (
                                    <div key={i} className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-2xl flex items-center gap-4">
                                        <div className="text-zinc-500">{spec.icon}</div>
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest leading-none mb-1">{spec.label}</p>
                                            <p className="text-xs font-black text-white uppercase">{spec.value || "N/A"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8">
                            <PremiumButton text="Acquire Listing" variant="primary" className="h-14 text-sm font-black uppercase tracking-widest w-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
                
                {/* Left Side: Longform Data */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Location Breakdown */}
                    <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                <FiMapPin size={20} />
                            </div>
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Geographical Coordinates</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Street Address</p>
                                    <p className="text-sm font-bold text-white leading-relaxed">{property.property_location?.line1 || property.property_address}</p>
                                    <p className="text-sm text-zinc-500">{property.property_location?.line2}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">City / Hub</p>
                                        <p className="text-sm font-bold text-white">{property.property_location?.city}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">State / Province</p>
                                        <p className="text-sm font-bold text-white">{property.property_location?.state}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Landmark Reference</p>
                                    <p className="text-sm font-bold text-white italic">"{property.property_location?.landmark || "Centrally located with easy access routes"}"</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Postal Code</p>
                                        <p className="text-sm font-bold text-zinc-400">{property.property_location?.postal_code || property.postal_code || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Country</p>
                                        <p className="text-sm font-bold text-zinc-400 flex items-center gap-2"><FiGlobe size={14} /> {property.property_location?.country || "International"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Area Metrics */}
                    <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                <FiLayers size={20} />
                            </div>
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Architectural area Metrics</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 group hover:border-emerald-500/20 transition-all">
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Total Area</p>
                                <h4 className="text-2xl font-black text-white">{property.total_area}</h4>
                                <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase">{property.area_unit}</p>
                            </div>
                            <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 group hover:border-blue-500/20 transition-all">
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Carpet Area</p>
                                <h4 className="text-2xl font-black text-white">{property.carpet_area || "N/A"}</h4>
                                <p className="text-[10px] text-blue-500 font-bold mt-1 uppercase">{property.area_unit}</p>
                            </div>
                            <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50 group hover:border-violet-500/20 transition-all">
                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Built-up Area</p>
                                <h4 className="text-2xl font-black text-white">{property.built_up_area || "N/A"}</h4>
                                <p className="text-[10px] text-violet-500 font-bold mt-1 uppercase">{property.area_unit}</p>
                            </div>
                        </div>
                    </div>

                    {/* Narrative & Amenities */}
                    <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-[2.5rem] p-8 lg:p-10 space-y-10 shadow-xl">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3"><FiInfo /> Description</h3>
                            <p className="text-zinc-400 leading-[1.8] italic text-base">
                                "{property.property_description}"
                            </p>
                        </div>
                        
                        <div className="space-y-6 pt-10 border-t border-zinc-900">
                             <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3"><FiCheckCircle /> Premium Amenities</h3>
                             <div className="flex flex-wrap gap-3">
                                {property.amenities?.map((a, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 px-5 py-3 rounded-2xl">
                                        <FiCheckCircle size={14} className="text-emerald-500" />
                                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{a}</span>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>

                    {/* Documents Segment */}
                    {property.documents && property.documents.length > 0 && (
                        <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-[2.5rem] p-8 lg:p-10 space-y-6 shadow-xl">
                            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <FiLayers /> Attached Documents
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {property.documents.map((doc, i) => (
                                    <a 
                                        key={i} 
                                        href={doc.value} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl transition-all group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                                <FiCheckCircle size={18} />
                                            </div>
                                            <p className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                                {doc.name || "Untitled Document"}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-950 text-zinc-500 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-all shrink-0">
                                            <FiMaximize2 size={14} />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Audit & Personnel */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Agents */}
                    <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
                         <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Assigned Personnel</h3>
                         <div className="space-y-4">
                            {property.assign_agent && property.assign_agent.length > 0 ? (
                                property.assign_agent.map(agent => (
                                    <div key={agent._id} className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center font-black text-white text-lg">
                                            {agent.agent_details?.user_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white">{agent.agent_details?.user_name}</p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase">{agent.agent_role || "Agent"}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-zinc-500 italic px-2">No agents assigned to this portfolio asset.</p>
                            )}
                         </div>
                    </div>

                    {/* Meta / Audit Trail */}
                    <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-[2.5rem] p-8 space-y-6 shadow-xl">
                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Lifecycle audit</h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 mt-1"><FiShield size={16} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Authenticated By</p>
                                    <p className="text-sm font-bold text-zinc-300">{property.created_by?.user_name}</p>
                                    <p className="text-[10px] text-zinc-500 italic mt-1">{property.created_by?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1"><FiClock size={16} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Timeline</p>
                                    <p className="text-xs text-zinc-400 font-bold">CREATED: {new Date(property.createdAt).toLocaleString()}</p>
                                    <p className="text-xs text-zinc-500 font-medium">UPDATED: {new Date(property.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-zinc-800 rounded-lg text-zinc-500 mt-1"><FiHash size={16} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">System Internal Index</p>
                                    <p className="text-[10px] font-mono text-zinc-500 break-all">{property._id}</p>
                                    <p className="text-[10px] font-mono text-zinc-600">V. VERSION: {property.__v || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
};

export default PropertyDetailsPage;
