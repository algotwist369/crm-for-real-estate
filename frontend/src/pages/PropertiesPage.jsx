import React, { useState } from "react";
import AppLayout from "../component/layout/AppLayout";
import {
    FiPlus,
    FiSearch,
    FiEdit,
    FiTrash2,
    FiEye,
    FiMapPin,
    FiHome,
    FiTrendingUp,
    FiActivity,
    FiUser
} from "react-icons/fi";
import { MdOutlineRealEstateAgent, MdLocationCity } from "react-icons/md";
import { PremiumButton } from "../component/common/PremiumButton";
import { PremiumToggle } from "../component/common/PremiumToggle";
import { CopyButton } from "../component/common/CopyButton";
import { SearchFilter } from "../component/common/SearchFilter";
import { Pagination } from "../component/common/Pagination";
import { RefreshButton } from "../component/common/RefreshButton";
import { PremiumTabs } from "../component/common/PremiumTabs";
import AddPropertiesModel from "../component/modal/AddPropertiesModel";
import EditPropertiesModel from "../component/modal/EditPropertiesModel";
import ViewPropertiesModel from "../component/modal/ViewPropertiesModel";

/* ─── Initial Property Data ─── */
const initialProperties = [

    { property_id: "PROP001", title: "Luxury 3BHK Apartment Andheri West", description: "Spacious apartment near metro station", property_type: "Apartment", listing_type: "sale", price: 22000000, currency: "INR", price_per_sqft: 25000, banner_image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", media: { images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c"], videos: ["https://example.com/video1.mp4"] }, location: { country: "India", state: "Maharashtra", city: "Mumbai", locality: "Andheri West", address: "Link Road", zipcode: "400053", latitude: 19.1367, longitude: 72.8267 }, nearby_locations: [{ name: "Andheri Metro", type: "metro", distance_km: 0.7 }, { name: "Andheri Railway", type: "railway", distance_km: 1.2 }, { name: "Kokilaben Hospital", type: "hospital", distance_km: 2.0 }], details: { bedrooms: 3, bathrooms: 2, balconies: 2, area_sqft: 1200, furnished_status: "Semi Furnished", floor: 12, total_floors: 22, parking: 1 }, amenities: ["Gym", "Pool", "Lift", "Security"], agent: { name: "Rahul Sharma", phone: "+919876543210", email: "rahul@realestate.com" }, created_at: "2026-03-01", status: "active", views: 120 },
    { property_id: "PROP002", title: "2BHK Apartment Kharghar", description: "Affordable flat near station", property_type: "Apartment", listing_type: "sale", price: 8500000, currency: "INR", price_per_sqft: 14000, banner_image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae", media: { images: ["https://images.unsplash.com/photo-1560185007-cde436f6a4d0", "https://images.unsplash.com/photo-1599423300746-b62533397364"], videos: [] }, location: { country: "India", state: "Maharashtra", city: "Navi Mumbai", locality: "Kharghar", address: "Sector 10", zipcode: "410210", latitude: 19.047, longitude: 73.069 }, nearby_locations: [{ name: "Kharghar Railway", type: "railway", distance_km: 0.9 }, { name: "Central Park", type: "park", distance_km: 1.5 }, { name: "Apollo Hospital", type: "hospital", distance_km: 2.3 }], details: { bedrooms: 2, bathrooms: 2, balconies: 1, area_sqft: 750, furnished_status: "Unfurnished", floor: 5, total_floors: 14, parking: 1 }, amenities: ["Lift", "Security"], agent: { name: "Amit Patel", phone: "+919999999999", email: "amit@propertyhub.com" }, created_at: "2026-02-15", status: "active", views: 65 },
    { property_id: "PROP003", title: "Luxury Penthouse Worli Sea Face", description: "Sea facing penthouse", property_type: "Penthouse", listing_type: "sale", price: 95000000, currency: "INR", price_per_sqft: 55000, banner_image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511", media: { images: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d"], videos: ["https://example.com/video2.mp4"] }, location: { country: "India", state: "Maharashtra", city: "Mumbai", locality: "Worli", address: "Sea Face Road", zipcode: "400018", latitude: 19.0176, longitude: 72.8118 }, nearby_locations: [{ name: "Lower Parel Station", type: "railway", distance_km: 1.4 }, { name: "Phoenix Mall", type: "mall", distance_km: 1.2 }], details: { bedrooms: 4, bathrooms: 4, balconies: 3, area_sqft: 3000, furnished_status: "Fully Furnished", floor: 28, total_floors: 30, parking: 3 }, amenities: ["Pool", "Gym", "Sky Deck", "Security"], agent: { name: "Karan Mehta", phone: "+919811223344", email: "karan@luxuryhomes.com" }, created_at: "2026-03-02", status: "active", views: 300 },
    { property_id: "PROP004", title: "Studio Apartment Downtown Dubai", description: "Modern studio apartment", property_type: "Studio", listing_type: "rent", price: 65000, currency: "AED", price_per_sqft: 90, banner_image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb", media: { images: ["https://images.unsplash.com/photo-1600585153490-76fb20a32601"], videos: [] }, location: { country: "UAE", state: "Dubai", city: "Dubai", locality: "Downtown Dubai", address: "Burj Area", zipcode: "00001", latitude: 25.1972, longitude: 55.2744 }, nearby_locations: [{ name: "Burj Khalifa Metro", type: "metro", distance_km: 0.5 }, { name: "Dubai Mall", type: "mall", distance_km: 0.3 }], details: { bedrooms: 1, bathrooms: 1, balconies: 1, area_sqft: 500, furnished_status: "Fully Furnished", floor: 10, total_floors: 40, parking: 1 }, amenities: ["Pool", "Gym", "Security"], agent: { name: "Fatima Khan", phone: "+971500111111", email: "fatima@uaehomes.ae" }, created_at: "2026-02-18", status: "active", views: 150 },
    { property_id: "PROP005", title: "Palm Jumeirah Beach Villa", description: "Luxury beachfront villa", property_type: "Villa", listing_type: "sale", price: 9500000, currency: "AED", price_per_sqft: 2800, banner_image: "https://images.unsplash.com/photo-1600607687644-c7f34f39c08b", media: { images: ["https://images.unsplash.com/photo-1600585154200-be6161a56a0c"], videos: ["https://example.com/video3.mp4"] }, location: { country: "UAE", state: "Dubai", city: "Dubai", locality: "Palm Jumeirah", address: "Palm Crescent", zipcode: "00002", latitude: 25.112, longitude: 55.138 }, nearby_locations: [{ name: "Atlantis Hotel", type: "landmark", distance_km: 1.1 }, { name: "Palm Monorail", type: "metro", distance_km: 1.4 }], details: { bedrooms: 5, bathrooms: 5, balconies: 3, area_sqft: 5200, furnished_status: "Fully Furnished", floor: 0, total_floors: 2, parking: 3 }, amenities: ["Private Beach", "Pool", "Gym"], agent: { name: "Mohammed Ali", phone: "+971503333333", email: "mohammed@luxuryuae.ae" }, created_at: "2026-03-02", status: "active", views: 420 },
    { property_id: "PROP006", title: "Paris City Center Apartment", description: "Elegant apartment near Eiffel Tower", property_type: "Apartment", listing_type: "sale", price: 980000, currency: "EUR", price_per_sqft: 950, banner_image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6", media: { images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511"], videos: [] }, location: { country: "France", state: "Île-de-France", city: "Paris", locality: "7th Arrondissement", address: "Rue de Grenelle", zipcode: "75007", latitude: 48.8566, longitude: 2.3522 }, nearby_locations: [{ name: "Eiffel Tower", type: "landmark", distance_km: 0.8 }, { name: "Metro Line 8", type: "metro", distance_km: 0.3 }], details: { bedrooms: 2, bathrooms: 1, balconies: 1, area_sqft: 900, furnished_status: "Semi Furnished", floor: 4, total_floors: 8, parking: 1 }, amenities: ["Elevator", "Heating", "Security"], agent: { name: "Jean Dupont", phone: "+33123456789", email: "jean@parishomes.fr" }, created_at: "2026-02-20", status: "active", views: 140 },
    { property_id: "PROP007", title: "Luxury Villa Nice Riviera", description: "Sea view villa", property_type: "Villa", listing_type: "sale", price: 3500000, currency: "EUR", price_per_sqft: 1200, banner_image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750", media: { images: ["https://images.unsplash.com/photo-1600585153927-2d6cbdfe1c23"], videos: [] }, location: { country: "France", state: "Provence-Alpes-Côte d’Azur", city: "Nice", locality: "Promenade des Anglais", address: "Sea View Road", zipcode: "06000", latitude: 43.7102, longitude: 7.262 }, nearby_locations: [{ name: "Nice Airport", type: "airport", distance_km: 5 }, { name: "Beach Promenade", type: "beach", distance_km: 0.2 }], details: { bedrooms: 4, bathrooms: 4, balconies: 2, area_sqft: 3000, furnished_status: "Fully Furnished", floor: 0, total_floors: 2, parking: 2 }, amenities: ["Pool", "Garden", "Security"], agent: { name: "Sophie Laurent", phone: "+33498765432", email: "sophie@rivieraestate.fr" }, created_at: "2026-02-18", status: "active", views: 210 },
    { property_id: "PROP008", title: "Luxury Condo Manhattan", description: "High rise condo", property_type: "Condo", listing_type: "sale", price: 1800000, currency: "USD", price_per_sqft: 2200, banner_image: "https://images.unsplash.com/photo-1484154218962-a197022b5858", media: { images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"], videos: [] }, location: { country: "USA", state: "New York", city: "New York", locality: "Manhattan", address: "5th Avenue", zipcode: "10001", latitude: 40.7128, longitude: -74.006 }, nearby_locations: [{ name: "Central Park", type: "park", distance_km: 1.1 }, { name: "Times Square", type: "landmark", distance_km: 1.5 }], details: { bedrooms: 2, bathrooms: 2, balconies: 1, area_sqft: 1000, furnished_status: "Fully Furnished", floor: 30, total_floors: 60, parking: 1 }, amenities: ["Gym", "Pool", "Doorman"], agent: { name: "Michael Brown", phone: "+12125551234", email: "michael@nycrealty.com" }, created_at: "2026-03-01", status: "active", views: 300 },
    { property_id: "PROP009", title: "Beverly Hills Luxury Villa", description: "Luxury villa with private pool", property_type: "Villa", listing_type: "sale", price: 5200000, currency: "USD", price_per_sqft: 1500, banner_image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d", media: { images: ["https://images.unsplash.com/photo-1600585153490-76fb20a32601"], videos: ["https://example.com/video4.mp4"] }, location: { country: "USA", state: "California", city: "Los Angeles", locality: "Beverly Hills", address: "Sunset Boulevard", zipcode: "90210", latitude: 34.0901, longitude: -118.4065 }, nearby_locations: [{ name: "Hollywood Hills", type: "landmark", distance_km: 2 }, { name: "LA Airport", type: "airport", distance_km: 14 }], details: { bedrooms: 5, bathrooms: 6, balconies: 3, area_sqft: 4500, furnished_status: "Fully Furnished", floor: 0, total_floors: 2, parking: 3 }, amenities: ["Pool", "Cinema Room", "Gym"], agent: { name: "Jessica Smith", phone: "+13105550000", email: "jessica@lahomes.com" }, created_at: "2026-02-27", status: "active", views: 410 },
    { property_id: "PROP010", title: "Miami Beachfront Condo", description: "Oceanfront condo", property_type: "Condo", listing_type: "sale", price: 1350000, currency: "USD", price_per_sqft: 1400, banner_image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb", media: { images: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d"], videos: [] }, location: { country: "USA", state: "Florida", city: "Miami", locality: "Miami Beach", address: "Ocean Drive", zipcode: "33139", latitude: 25.7617, longitude: -80.1918 }, nearby_locations: [{ name: "South Beach", type: "beach", distance_km: 0.3 }, { name: "Miami Airport", type: "airport", distance_km: 15 }], details: { bedrooms: 2, bathrooms: 2, balconies: 2, area_sqft: 950, furnished_status: "Fully Furnished", floor: 10, total_floors: 25, parking: 1 }, amenities: ["Pool", "Gym", "Security", "Beach Access"], agent: { name: "Carlos Rodriguez", phone: "+13055551234", email: "carlos@miamirealty.com" }, created_at: "2026-03-03", status: "active", views: 260 },
    { property_id: "PROP011", title: "Residential Plot Pune Wagholi", description: "Investment plot near highway", property_type: "Plot", listing_type: "sale", price: 3200000, currency: "INR", price_per_sqft: 3500, banner_image: "https://images.unsplash.com/photo-1505691723518-36a5ac3be353", media: { images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511"], videos: [] }, location: { country: "India", state: "Maharashtra", city: "Pune", locality: "Wagholi", address: "Wagholi Road", zipcode: "412207", latitude: 18.58, longitude: 73.98 }, nearby_locations: [{ name: "Pune Airport", type: "airport", distance_km: 9 }, { name: "Wagholi Market", type: "market", distance_km: 1 }], details: { bedrooms: 0, bathrooms: 0, balconies: 0, area_sqft: 2000, furnished_status: "NA", floor: 0, total_floors: 0, parking: 0 }, amenities: ["Road Access"], agent: { name: "Suresh Patil", phone: "+919876543222", email: "suresh@punerealty.com" }, created_at: "2026-02-05", status: "active", views: 45 },
    { property_id: "PROP012", title: "Industrial Warehouse Taloja", description: "Large warehouse space", property_type: "Warehouse", listing_type: "rent", price: 500000, currency: "INR", price_per_sqft: 45, banner_image: "https://images.unsplash.com/photo-1560448075-bb485b067938", media: { images: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d"], videos: [] }, location: { country: "India", state: "Maharashtra", city: "Navi Mumbai", locality: "Taloja", address: "MIDC Area", zipcode: "410208", latitude: 19.05, longitude: 73.1 }, nearby_locations: [{ name: "Taloja Station", type: "railway", distance_km: 1.8 }, { name: "JNPT Port", type: "port", distance_km: 15 }], details: { bedrooms: 0, bathrooms: 2, balconies: 0, area_sqft: 10000, furnished_status: "Unfurnished", floor: 1, total_floors: 1, parking: 5 }, amenities: ["Truck Access", "Security"], agent: { name: "Raj Verma", phone: "+919900001111", email: "raj@industrialspaces.com" }, created_at: "2026-02-20", status: "active", views: 33 },
    { property_id: "PROP013", title: "Whitefield Tech Apartment", description: "Apartment near IT parks", property_type: "Apartment", listing_type: "sale", price: 14500000, currency: "INR", price_per_sqft: 16000, banner_image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6", media: { images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"], videos: [] }, location: { country: "India", state: "Karnataka", city: "Bangalore", locality: "Whitefield", address: "ITPL Road", zipcode: "560066", latitude: 12.9698, longitude: 77.75 }, nearby_locations: [{ name: "ITPL Tech Park", type: "office", distance_km: 1 }, { name: "Metro Station", type: "metro", distance_km: 1.3 }], details: { bedrooms: 3, bathrooms: 3, balconies: 2, area_sqft: 1400, furnished_status: "Semi Furnished", floor: 7, total_floors: 20, parking: 1 }, amenities: ["Gym", "Pool", "Security"], agent: { name: "Ankit Gupta", phone: "+919855555555", email: "ankit@blrhomes.com" }, created_at: "2026-03-03", status: "active", views: 90 },
    { property_id: "PROP014", title: "Beachfront Villa Goa", description: "Luxury villa near beach", property_type: "Villa", listing_type: "sale", price: 38000000, currency: "INR", price_per_sqft: 28000, banner_image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c", media: { images: ["https://images.unsplash.com/photo-1600585153927-2d6cbdfe1c23"], videos: [] }, location: { country: "India", state: "Goa", city: "North Goa", locality: "Candolim", address: "Beach Road", zipcode: "403515", latitude: 15.52, longitude: 73.76 }, nearby_locations: [{ name: "Candolim Beach", type: "beach", distance_km: 0.2 }, { name: "Goa Airport", type: "airport", distance_km: 35 }], details: { bedrooms: 4, bathrooms: 4, balconies: 2, area_sqft: 2500, furnished_status: "Fully Furnished", floor: 0, total_floors: 2, parking: 2 }, amenities: ["Pool", "Garden", "Security"], agent: { name: "Rohit Dsouza", phone: "+919876000000", email: "rohit@goarealty.com" }, created_at: "2026-03-04", status: "active", views: 140 },
    { property_id: "PROP015", title: "Luxury Apartment Chicago Downtown", description: "Modern apartment near lake", property_type: "Apartment", listing_type: "sale", price: 720000, currency: "USD", price_per_sqft: 850, banner_image: "https://images.unsplash.com/photo-1600585153490-76fb20a32601", media: { images: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d"], videos: [] }, location: { country: "USA", state: "Illinois", city: "Chicago", locality: "Downtown", address: "Michigan Avenue", zipcode: "60601", latitude: 41.8781, longitude: -87.6298 }, nearby_locations: [{ name: "Millennium Park", type: "park", distance_km: 0.7 }, { name: "Chicago Metro", type: "metro", distance_km: 0.6 }], details: { bedrooms: 2, bathrooms: 2, balconies: 1, area_sqft: 900, furnished_status: "Semi Furnished", floor: 12, total_floors: 35, parking: 1 }, amenities: ["Gym", "Security", "Parking"], agent: { name: "Robert Miller", phone: "+13125551111", email: "robert@chicagohomes.com" }, created_at: "2026-02-22", status: "active", views: 150 }
];

/* ─── Table Columns ─── */
const tableColumns = ["#", "Property Info", "Type", "Price", "Location", "Specifications", "Agent", "Views", "Status", "Actions"];

/* ─── Filter Options ─── */
const statusOptions = ["All", "active", "inactive", "sold"];
const typeOptions = ["All", "Apartment", "Villa", "Office", "Plot", "Penthouse"];

const PropertiesPage = () => {
    const [properties, setProperties] = useState(initialProperties);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState(null);
    const [viewingProperty, setViewingProperty] = useState(null);

    /* ─── Refresh Handler ─── */
    const handleRefresh = () => {
        setProperties(initialProperties);
        setSearch("");
        setStatusFilter("All");
        setTypeFilter("All");
        setPage(1);
    };

    /* ─── CRUD Handlers ─── */
    const handleAddProperty = (newPropData) => {
        const newProp = {
            property_id: `PROP${Date.now().toString().slice(-3)}`,
            ...newPropData,
            created_at: new Date().toISOString().split('T')[0],
            views: 0
        };
        setProperties(prev => [newProp, ...prev]);
        setIsAddModalOpen(false);
    };

    const handleUpdateProperty = (updatedProp) => {
        setProperties(prev => prev.map(p => p.property_id === updatedProp.property_id ? updatedProp : p));
        setIsEditModalOpen(false);
        setEditingProperty(null);
    };

    const handleDeleteProperty = (id) => {
        if (window.confirm("Are you sure you want to delete this property?")) {
            setProperties(prev => prev.filter(p => p.property_id !== id));
        }
    };

    const handleUpdateField = (id, field, value) => {
        setProperties(prev => prev.map(p => p.property_id === id ? { ...p, [field]: value } : p));
    };

    /* ─── Filters & Search ─── */
    const filteredProperties = properties.filter(prop => {
        const matchesSearch =
            prop.title.toLowerCase().includes(search.toLowerCase()) ||
            prop.property_id.toLowerCase().includes(search.toLowerCase()) ||
            prop.location.city.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === "All" || prop.status === statusFilter;
        const matchesType = typeFilter === "All" || prop.property_type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    /* ─── Pagination Logic ─── */
    const totalPages = Math.ceil(filteredProperties.length / rowsPerPage);
    const paginatedProperties = filteredProperties.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    /* ─── Style Helpers ─── */
    const getStatusColor = (status) => {
        switch (status) {
            case "active": return "text-emerald-400";
            case "inactive": return "text-zinc-500";
            case "sold": return "text-blue-400";
            default: return "text-zinc-500";
        }
    };

    const formatPrice = (price, currency) => {
        if (currency === "INR") {
            if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
            if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
            return `₹${Number(price).toLocaleString()}`;
        }
        return `${currency} ${Number(price).toLocaleString()}`;
    };

    return (
        <AppLayout>
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Property Inventory</h2>
                    <p className="text-sm text-zinc-500 font-medium italic">Manage and track your real estate listings across regions</p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton onClick={handleRefresh} />
                    <div className="w-48">
                        <PremiumButton
                            text="Add Property"
                            variant="primary"
                            onClick={() => setIsAddModalOpen(true)}
                        />
                    </div>
                </div>
            </div>

            {/* Analytics Summary */}
            <div className="mb-6 flex flex-wrap gap-6">
                <div className="flex-1 min-w-[280px] bg-zinc-950/40 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
                        <FiHome size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Active Listings</p>
                        <h3 className="text-xl font-black text-white">{properties.filter(p => p.status === "active").length}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[280px] bg-zinc-950/40 border border-blue-500/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-2xl flex items-center justify-center">
                        <FiTrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Sold</p>
                        <h3 className="text-xl font-black text-white">{properties.filter(p => p.status === "sold").length}</h3>
                    </div>
                </div>

                <div className="flex-1 min-w-[280px] bg-zinc-950/40 border border-orange-500/10 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-2xl flex items-center justify-center">
                        <FiActivity size={24} />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Total Page Views</p>
                        <h3 className="text-xl font-black text-white">{properties.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-5 mb-6 flex flex-col lg:flex-row lg:items-center gap-6 shadow-xl">
                <div className="flex-1">
                    <SearchFilter
                        searchValue={search}
                        onSearchChange={(e) => setSearch(e.target.value)}
                        searchPlaceholder="Search properties by title, ID or city..."
                    />
                </div>

                <div className="flex flex-wrap items-center gap-6 lg:gap-8 lg:w-fit">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-fit">Status:</span>
                        <div className="flex-1 sm:w-[320px]">
                            <PremiumTabs
                                options={statusOptions}
                                value={statusFilter}
                                onChange={(val) => { setStatusFilter(val); setPage(1); }}
                                showLabel={false}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest min-w-fit">Type:</span>
                        <div className="flex-1 sm:w-[360px]">
                            <PremiumTabs
                                options={typeOptions}
                                value={typeFilter}
                                onChange={(val) => { setTypeFilter(val); setPage(1); }}
                                showLabel={false}
                                variant="indigo"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Properties Table */}
            <div className="bg-zinc-950/50 backdrop-blur-md border border-zinc-800/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="border-b border-zinc-800/50 bg-zinc-900/30">
                                {tableColumns.map((col, idx) => (
                                    <th key={idx} className="p-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                            {paginatedProperties.map((prop, index) => (
                                <tr
                                    key={prop.property_id}
                                    className={`group hover:bg-zinc-900/50 transition-all duration-200 ${prop.status === "inactive" ? "opacity-50 grayscale-[0.3]" : ""
                                        }`}
                                >
                                    <td className="p-4 text-xs font-bold text-zinc-600">
                                        #{(page - 1) * rowsPerPage + index + 1}
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col max-w-[280px]">
                                            <span className={`text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors truncate ${prop.status === "inactive" || prop.status === "sold" ? "opacity-60" : ""
                                                }`} title={prop.title}>
                                                {prop.title}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-medium">
                                                ID: {prop.property_id} | Added: {prop.created_at}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                                                {prop.property_type}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded w-fit border ${prop.listing_type === 'sale'
                                                ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                                : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                }`}>
                                                For {prop.listing_type}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-white">
                                                {formatPrice(prop.price, prop.currency)}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-bold">
                                                {prop.price_per_sqft} / sqft
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1 text-zinc-300">
                                                <FiMapPin size={12} className="text-emerald-500" />
                                                <span className="text-xs font-semibold">{prop.location.locality}</span>
                                            </div>
                                            <span className="text-[10px] text-zinc-500 font-medium ml-4">
                                                {prop.location.city}, {prop.location.state}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-x-3 text-[10px] font-bold text-zinc-400">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-zinc-500">BD:</span> {prop.details.bedrooms || "0"}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-zinc-500">BA:</span> {prop.details.bathrooms || "0"}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-zinc-500">FL:</span> {prop.details.floor || "0"}
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-semibold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded w-fit">
                                                {prop.details.area_sqft} Sq.ft
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-bold">
                                                {prop.agent.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-zinc-300">{prop.agent.name}</span>
                                                <button className="text-[10px] text-zinc-500 hover:text-blue-400 text-left">
                                                    {prop.agent.phone}
                                                </button>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5">
                                            <FiEye size={12} className="text-zinc-500" />
                                            <span className="text-xs font-bold text-zinc-400">{prop.views}</span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${prop.status === "active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" :
                                                prop.status === "sold" ? "bg-blue-500" : "bg-zinc-500"
                                                }`} />
                                            <select
                                                value={prop.status}
                                                onChange={(e) => handleUpdateField(prop.property_id, 'status', e.target.value)}
                                                className={`text-xs font-bold bg-transparent cursor-pointer focus:outline-none hover:bg-zinc-800/50 px-1 rounded transition-colors appearance-none ${getStatusColor(prop.status)}`}
                                            >
                                                {statusOptions.slice(1).map(s => (
                                                    <option key={s} value={s} className="bg-zinc-900 text-zinc-300">{s.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-700 cursor-pointer transition-all"
                                                onClick={() => {
                                                    setViewingProperty(prop);
                                                    setIsViewModalOpen(true);
                                                }}
                                            >
                                                <FiEye size={16} />
                                            </div>
                                            <div
                                                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-emerald-400 hover:border-emerald-400/30 cursor-pointer transition-all"
                                                onClick={() => {
                                                    setEditingProperty(prop);
                                                    setIsEditModalOpen(true);
                                                }}
                                            >
                                                <FiEdit size={16} />
                                            </div>
                                            <div
                                                className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-400/30 cursor-pointer transition-all"
                                                onClick={() => handleDeleteProperty(prop.property_id)}
                                            >
                                                <FiTrash2 size={16} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Section */}
                <div className="p-6 border-t border-zinc-800/50 bg-zinc-900/10">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(val) => { setRowsPerPage(val); setPage(1); }}
                    />
                </div>
            </div>

            {/* Modals */}
            <AddPropertiesModel
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddProperty}
            />

            <EditPropertiesModel
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingProperty(null);
                }}
                onUpdate={handleUpdateProperty}
                property={editingProperty}
            />

            <ViewPropertiesModel
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setViewingProperty(null);
                }}
                property={viewingProperty}
            />
        </AppLayout>
    );
};

export default PropertiesPage;