const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertiesSchema = new Schema({
    // =========================
    // EXISTING FIELDS (UNCHANGED)
    // =========================
    property_title: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    slug: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    property_description: {
        type: String,
        trim: true,
        default: ''
    },
    property_type: {
        type: String,
        trim: true,
        default: 'Apartment',
        index: true
    },
    listing_type: {
        type: String,
        required: true,
        enum: [
            'rent',
            'sale',
            'investment',
            'off_plan',
            'resale',
            'lease',
            'short_term',
            'holiday_home',
            'commercial_rent',
            'commercial_sale',
            'pre_launch',
            'auction',
            'joint_venture',
            'land_sale',
            'other'
        ],
        index: true
    },
    asking_price: {
        type: Number,
        min: 0,
        index: true
    },
    currency: {
        type: String,
        enum: ['INR', 'AED', 'USD', 'EUR', 'GBP', 'JPY'],
        default: 'INR'
    },
    price_sqft: {
        type: Number,
        min: 0
    },
    price_negotiable: {
        type: Boolean,
        default: false
    },
    assign_agent: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Agent',
        }],
        default: [],
        index: true
    },
    property_status: {
        type: String,
        enum: [
            'available',
            'under_offer',
            'reserved',
            'booked',
            'sold',
            'rented',
            'leased',
            'blocked',
            'under_negotiation',
            'hold',
            'unavailable',
            'withdrawn',
            'expired',
            'inactive',
            'other'
        ],
        default: 'available',
        index: true
    },
    property_address: {
        type: String,
        trim: true,
        default: ''
    },
    property_location: {
        line1: { type: String, trim: true, default: '' },
        line2: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '', index: true },
        state: { type: String, trim: true, default: '', index: true },
        country: { type: String, trim: true, default: 'IN', index: true },
        postal_code: { type: String, trim: true, default: '' },
        landmark: { type: String, trim: true, default: '' },
        google_map_url: { type: String, trim: true, default: '' },
    },
    total_area: {
        type: Number,
        min: 0
    },
    area_unit: {
        type: String,
        enum: ['sqft', 'sqm', 'sqyd', 'acre', 'bigha', 'hectare'],
        default: 'sqft'
    },
    carpet_area: {
        type: Number,
        min: 0
    },
    built_up_area: {
        type: Number,
        min: 0
    },
    total_bedrooms: {
        type: Number,
        min: 0,
        index: true
    },
    total_bathrooms: {
        type: Number,
        min: 0
    },
    furnished_status: {
        type: String,
        enum: ['furnished', 'unfurnished', 'fully furnished', 'semi furnished', 'NA'],
        default: 'NA',
        index: true
    },
    amenities: [{
        type: String,
        trim: true
    }],
    photos: [{
        type: String,
        trim: true
    }],
    possession_date: {
        type: Date
    },
    available_from: {
        type: Date
    },
    documents: [
        {
            name: {
                type: String,
            },
            value: {
                type: String,
            },
        },
    ],
    created_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
    updated_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
    is_active: {
        type: Boolean,
        default: true,
        index: true
    },
    tenant_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // =========================
    // NEW INTERNATIONAL FIELDS
    // =========================

    // Listing / inventory identity
    property_code: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    reference_id: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    external_id: {
        type: String,
        trim: true,
        default: '',
        index: true
    },

    // Market classification
    property_category: {
        type: String,
        enum: ['residential', 'commercial', 'land', 'hospitality', 'industrial', 'mixed_use', 'other'],
        default: 'residential',
        index: true
    },
    property_sub_type: {
        type: String,
        trim: true,
        default: '',
        index: true
    },

    // Project / tower / community hierarchy
    project_name: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    tower_name: {
        type: String,
        trim: true,
        default: ''
    },
    building_name: {
        type: String,
        trim: true,
        default: ''
    },
    community_name: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    sub_community: {
        type: String,
        trim: true,
        default: ''
    },

    // Unit / floor details
    unit_number: {
        type: String,
        trim: true,
        default: ''
    },
    floor_number: {
        type: Number,
        default: 0
    },
    total_floors: {
        type: Number,
        default: 0
    },

    // Room configuration
    bedroom_label: {
        type: String,
        trim: true,
        default: '' // Example: "Studio", "1 BR", "4 BR + Maid", "5 BHK"
    },
    maid_room: {
        type: Boolean,
        default: false
    },
    servant_room: {
        type: Boolean,
        default: false
    },
    study_room: {
        type: Boolean,
        default: false
    },
    store_room: {
        type: Boolean,
        default: false
    },
    balcony_count: {
        type: Number,
        min: 0,
        default: 0
    },
    parking_count: {
        type: Number,
        min: 0,
        default: 0
    },

    // Area flexibility for international market
    plot_area: {
        type: Number,
        min: 0,
        default: 0
    },
    plot_area_unit: {
        type: String,
        enum: ['sqft', 'sqm', 'sqyd', 'acre', 'bigha', 'hectare'],
        default: 'sqft'
    },
    super_built_up_area: {
        type: Number,
        min: 0,
        default: 0
    },
    usable_area: {
        type: Number,
        min: 0,
        default: 0
    },

    // Price / market intelligence
    original_price: {
        type: Number,
        min: 0,
        default: 0
    },
    rental_yield: {
        type: Number,
        min: 0,
        default: 0
    },
    service_charges: {
        type: Number,
        min: 0,
        default: 0
    },
    maintenance_fee: {
        type: Number,
        min: 0,
        default: 0
    },
    payment_plan: {
        type: String,
        trim: true,
        default: ''
    },
    down_payment: {
        type: Number,
        min: 0,
        default: 0
    },

    // Off-plan / ready / delivery workflow
    completion_status: {
        type: String,
        enum: ['ready', 'off_plan', 'under_construction', 'new_launch', 'resale', 'secondary_market', 'unknown'],
        default: 'unknown',
        index: true
    },
    handover_date: {
        type: Date
    },
    handover_label: {
        type: String,
        trim: true,
        default: ''
    },

    // Occupancy / tenancy
    occupancy_status: {
        type: String,
        enum: ['vacant', 'owner_occupied', 'tenant_occupied', 'leased', 'unknown'],
        default: 'unknown',
        index: true
    },
    tenant_name: {
        type: String,
        trim: true,
        default: ''
    },
    tenant_phone: {
        type: String,
        trim: true,
        default: ''
    },
    lease_end_date: {
        type: Date
    },

    // Legal / compliance
    permit_number: {
        type: String,
        trim: true,
        default: ''
    },
    rera_number: {
        type: String,
        trim: true,
        default: ''
    },
    dld_permit_number: {
        type: String,
        trim: true,
        default: ''
    },
    title_deed_number: {
        type: String,
        trim: true,
        default: ''
    },

    // SEO / media / presentation
    video_url: {
        type: String,
        trim: true,
        default: ''
    },
    virtual_tour_url: {
        type: String,
        trim: true,
        default: ''
    },
    floor_plan_url: {
        type: String,
        trim: true,
        default: ''
    },
    brochure_url: {
        type: String,
        trim: true,
        default: ''
    },

    // CRM / discoverability
    tags: [{
        type: String,
        trim: true,
        index: true
    }],
    highlights: [{
        type: String,
        trim: true
    }],
    view_type: {
        type: String,
        trim: true,
        default: '' // Example: "Sea View", "Burj View", "Lagoon View", "Park View"
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    }

}, { timestamps: true });


// =========================
// EXISTING INDEXES (UNCHANGED)
// =========================
propertiesSchema.index({ tenant_id: 1, property_status: 1, createdAt: -1 });
propertiesSchema.index({ tenant_id: 1, listing_type: 1, property_type: 1 });
propertiesSchema.index({ tenant_id: 1, assign_agent: 1 });


// =========================
// NEW INDEXES FOR INTERNATIONAL CRM
// =========================
propertiesSchema.index({ tenant_id: 1, property_code: 1 });
propertiesSchema.index({ tenant_id: 1, reference_id: 1 });
propertiesSchema.index({ tenant_id: 1, project_name: 1 });
propertiesSchema.index({ tenant_id: 1, community_name: 1 });
propertiesSchema.index({ tenant_id: 1, completion_status: 1 });
propertiesSchema.index({ tenant_id: 1, occupancy_status: 1 });
propertiesSchema.index({ tenant_id: 1, asking_price: 1 });
propertiesSchema.index({ tenant_id: 1, total_bedrooms: 1 });
propertiesSchema.index({ tenant_id: 1, furnished_status: 1 });
propertiesSchema.index({ tenant_id: 1, tags: 1 });

module.exports = mongoose.model('Properties', propertiesSchema);