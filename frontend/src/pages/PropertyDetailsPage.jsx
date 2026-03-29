import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../component/layout/AppLayout";
import {
    FiHome, FiMapPin, FiLayers, FiActivity,
    FiZap, FiTrendingUp, FiCheckCircle, FiInfo, FiChevronLeft, FiChevronRight, FiMaximize2, FiArrowLeft, FiLoader, FiGlobe, FiHash, FiShield, FiClock
} from "react-icons/fi";
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
                    <FiLoader size={40} className="text-zinc-500 animate-spin" />
                    <p className="text-sm text-zinc-500">Loading Property Details...</p>
                </div>
            </AppLayout>
        );
    }

    if (error || !property) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
                    <FiInfo size={40} className="text-red-500" />
                    <div>
                        <h2 className="text-lg font-medium text-white mb-1">Listing Not Found</h2>
                        <p className="text-sm text-zinc-500 max-w-md">The requested property listing might have been removed or is temporarily unavailable.</p>
                    </div>
                    <button
                        onClick={() => navigate("/properties")}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded flex items-center justify-center gap-2 transition-colors mt-2"
                    >
                        <FiArrowLeft size={16} /> Back to Inventory
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/properties")}
                        className="text-zinc-500 hover:text-white transition-colors p-2 rounded hover:bg-zinc-800 shrink-0"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-medium text-white mb-1">Property Insight: {property._id.slice(-8).toUpperCase()}</h2>
                        <p className="text-sm text-zinc-400">{property.property_title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded text-xs capitalize border ${
                        property.property_status === 'available' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}>
                        {property.property_status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1.5 rounded text-xs border ${
                        property.is_active ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                        {property.is_active ? 'Active' : 'Archived'}
                    </span>
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded flex items-center gap-2 transition-colors"
                    >
                        <FiMaximize2 size={16} /> Dossier
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Visual Gallery - Column Span 2 */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative aspect-[16/10] bg-zinc-900 rounded overflow-hidden border border-zinc-800 group">
                        <img
                            src={photos[activeImage]}
                            alt={property.property_title}
                            className="w-full h-full object-cover"
                        />
                        
                        {/* Navigation Arrows */}
                        {photos.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80">
                                    <FiChevronLeft size={20} />
                                </button>
                                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80">
                                    <FiChevronRight size={20} />
                                </button>
                            </>
                        )}
                        
                        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-xs text-white">
                            {activeImage + 1} / {photos.length}
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {photos.map((src, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(i)}
                                className={`flex-shrink-0 w-20 aspect-video rounded overflow-hidden border-2 transition-all ${
                                    i === activeImage ? 'border-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img src={src} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Core Pricing & Specs - Column Span 1 */}
                <div className="border border-zinc-800 rounded bg-zinc-950/20 p-6 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded capitalize">
                                {property.property_type}
                            </span>
                            <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded">
                                For {property.listing_type}
                            </span>
                        </div>

                        <div className="border border-zinc-800 bg-zinc-900/50 p-4 rounded space-y-1">
                            <p className="text-xs text-zinc-500 font-medium">Asking Price</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">{formatPrice(property.asking_price, property.currency)}</h3>
                            <div className="flex items-center gap-3 text-sm text-zinc-400 pt-1">
                                <span className="flex items-center gap-1.5"><FiTrendingUp size={14} /> {property.price_sqft} / {property.area_unit}</span>
                                <span>&bull;</span>
                                <span>{property.price_negotiable ? "Negotiable" : "Non-negotiable"}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: <FiLayers />, label: "Area", value: `${property.total_area} ${property.area_unit}` },
                                { icon: <FiHome />, label: "Bedrooms", value: property.total_bedrooms },
                                { icon: <FiActivity />, label: "Bathrooms", value: property.total_bathrooms },
                                { icon: <FiZap />, label: "Furnishing", value: property.furnished_status }
                            ].map((spec, i) => (
                                <div key={i} className="border border-zinc-800 bg-zinc-900/30 p-3 rounded flex items-center gap-3">
                                    <div className="text-zinc-500">{spec.icon}</div>
                                    <div className="flex flex-col">
                                        <p className="text-xs text-zinc-500">{spec.label}</p>
                                        <p className="text-sm font-medium text-white capitalize">{spec.value || "N/A"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6">
                        <button className="w-full bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium rounded py-3 transition-colors flex items-center justify-center">
                            Acquire Listing
                        </button>
                    </div>
                </div>
            </div>

            {/* Detailed Info Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
                
                {/* Left Side: Longform Data (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Location Breakdown */}
                    <div className="border border-zinc-800 rounded bg-zinc-950/20 p-6">
                        <h3 className="text-sm font-medium text-zinc-300 mb-6 flex items-center gap-2">
                            <FiMapPin className="text-zinc-500" /> Location Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Street Address</p>
                                    <p className="text-sm font-medium text-white">{property.property_location?.line1 || property.property_address}</p>
                                    <p className="text-sm text-zinc-400">{property.property_location?.line2}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">City</p>
                                        <p className="text-sm font-medium text-white">{property.property_location?.city}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">State</p>
                                        <p className="text-sm font-medium text-white">{property.property_location?.state}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-zinc-500 mb-1">Landmark</p>
                                    <p className="text-sm text-zinc-300">{property.property_location?.landmark || "N/A"}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Postal Code</p>
                                        <p className="text-sm text-zinc-300">{property.property_location?.postal_code || property.postal_code || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 mb-1">Country</p>
                                        <p className="text-sm text-zinc-300">{property.property_location?.country || "International"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Area Metrics */}
                    <div className="border border-zinc-800 rounded bg-zinc-950/20 p-6">
                        <h3 className="text-sm font-medium text-zinc-300 mb-6 flex items-center gap-2">
                            <FiLayers className="text-zinc-500" /> Area Metrics
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="border border-zinc-800 bg-zinc-900/30 p-4 rounded">
                                <p className="text-xs text-zinc-500 mb-1">Total Area</p>
                                <p className="text-lg font-medium text-white">{property.total_area} <span className="text-sm text-zinc-500">{property.area_unit}</span></p>
                            </div>
                            <div className="border border-zinc-800 bg-zinc-900/30 p-4 rounded">
                                <p className="text-xs text-zinc-500 mb-1">Carpet Area</p>
                                <p className="text-lg font-medium text-white">{property.carpet_area || "N/A"} <span className="text-sm text-zinc-500">{property.carpet_area ? property.area_unit : ""}</span></p>
                            </div>
                            <div className="border border-zinc-800 bg-zinc-900/30 p-4 rounded">
                                <p className="text-xs text-zinc-500 mb-1">Built-up Area</p>
                                <p className="text-lg font-medium text-white">{property.built_up_area || "N/A"} <span className="text-sm text-zinc-500">{property.built_up_area ? property.area_unit : ""}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Narrative & Amenities */}
                    <div className="border border-zinc-800 rounded bg-zinc-950/20 p-6 space-y-8">
                        <div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                                <FiInfo className="text-zinc-500" /> Description
                            </h3>
                            <p className="text-sm text-zinc-400 leading-relaxed max-w-4xl">
                                {property.property_description}
                            </p>
                        </div>
                        
                        {(property.amenities?.length > 0) && (
                            <div className="pt-6 border-t border-zinc-800">
                                 <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                                    <FiCheckCircle className="text-zinc-500" /> Amenities
                                 </h3>
                                 <div className="flex flex-wrap gap-2">
                                    {property.amenities.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded">
                                            <FiCheckCircle size={12} className="text-emerald-500" />
                                            <span className="text-xs font-medium text-zinc-300 capitalize">{a}</span>
                                        </div>
                                    ))}
                                 </div>
                            </div>
                        )}
                    </div>

                    {/* Documents Segment */}
                    {property.documents && property.documents.length > 0 && (
                        <div className="border border-zinc-800 rounded bg-zinc-950/20 p-6">
                            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                                <FiLayers className="text-zinc-500" /> Attached Documents
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {property.documents.map((doc, i) => (
                                    <a 
                                        key={i} 
                                        href={doc.value} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FiActivity className="text-zinc-500 shrink-0" size={16} />
                                            <p className="text-sm text-zinc-300 truncate group-hover:text-white transition-colors">
                                                {doc.name || "Untitled Document"}
                                            </p>
                                        </div>
                                        <FiMaximize2 size={14} className="text-zinc-500 group-hover:text-white transition-colors" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Audit & Personnel (Span 1) */}
                <div className="space-y-6">
                    
                    {/* Agents */}
                    <div className="border border-zinc-800 rounded bg-zinc-950/20 p-6">
                         <h3 className="text-sm font-medium text-zinc-300 mb-4">Assigned Agents</h3>
                         <div className="space-y-3">
                            {property.assign_agent && property.assign_agent.length > 0 ? (
                                property.assign_agent.map(agent => (
                                    <div key={agent._id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded">
                                        <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center font-medium text-zinc-300">
                                            {agent.agent_details?.user_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{agent.agent_details?.user_name}</p>
                                            <p className="text-xs text-zinc-500 capitalize">{agent.agent_role || "Agent"}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-zinc-500">No agents assigned.</p>
                            )}
                         </div>
                    </div>

                    {/* Meta / Audit Trail */}
                    <div className="border border-zinc-800 rounded bg-zinc-950/20 p-6">
                        <h3 className="text-sm font-medium text-zinc-300 mb-4">Lifecycle Audit</h3>
                        
                        <div className="space-y-5">
                            <div className="flex items-start gap-3">
                                <div className="text-zinc-500 mt-0.5"><FiShield size={16} /></div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-0.5">Created By</p>
                                    <p className="text-sm text-zinc-300">{property.created_by?.user_name}</p>
                                    <p className="text-xs text-zinc-500">{property.created_by?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="text-zinc-500 mt-0.5"><FiClock size={16} /></div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-0.5">Timeline</p>
                                    <p className="text-xs text-zinc-300 mb-0.5">Created: {new Date(property.createdAt).toLocaleString()}</p>
                                    <p className="text-xs text-zinc-500">Updated: {new Date(property.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="text-zinc-500 mt-0.5"><FiHash size={16} /></div>
                                <div>
                                    <p className="text-xs text-zinc-500 mb-0.5">System Reference</p>
                                    <p className="text-xs text-zinc-400 font-mono break-all">{property._id}</p>
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
