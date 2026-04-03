const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID');

// ─── Reusable area sub-object ────────────────────────────────────────────────
const areaObject = Joi.object({
    value: Joi.number().min(0).default(0),
    unit: Joi.string().valid('sq.ft', 'sq.m', 'sqm', 'acre', 'hectare', 'other').default('sq.ft')
}).optional();

// ─── UTM sub-object ──────────────────────────────────────────────────────────
const utmObject = Joi.object({
    source: Joi.string().trim().allow('', null).optional(),
    medium: Joi.string().trim().allow('', null).optional(),
    campaign: Joi.string().trim().allow('', null).optional(),
    term: Joi.string().trim().allow('', null).optional(),
    content: Joi.string().trim().allow('', null).optional()
}).optional();

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'follow_up', 'site_visit', 'negotiation', 'booked', 'converted', 'lost', 'wasted', 'closed', 'archived'];
const LEAD_SOURCES = ['website', 'facebook', 'instagram', 'linkedin', 'whatsapp', 'google_ads', 'referral', 'advertisement', 'personal', 'walk_in', 'broker', 'owner', 'manual_entry', 'other'];
const ALL_LEAD_SOURCES = [...LEAD_SOURCES, 'direct', 'email', 'sms', 'youtube', 'tiktok', 'twitter', 'snapchat', 'pinterest', 'event', 'exhibition', 'newspaper', 'magazine', 'radio', 'tv', 'cold_call', 'cold_email', 'bulk_whatsapp'];
const LEAD_TYPES = ['buyer', 'seller', 'owner', 'tenant', 'investor', 'listing', 'broker', 'other'];
const CLIENT_TYPES = ['buying', 'renting', 'investing', 'selling', 'other'];
const CURRENCIES = ['₹', '$', 'AED'];
const PRIORITIES = ['low', 'medium', 'high'];
const PROPERTY_TYPES = ['villa', 'townhouse', 'apartment', 'penthouse', 'plot', 'commercial', 'office', 'shop', 'warehouse', 'other'];
const FURNISHED_STATUSES = ['furnished', 'semi_furnished', 'unfurnished', 'unknown'];
const FOLLOW_UP_STATUSES = ['pending', 'done', 'missed', 'rescheduled'];

const leadSchemas = {
    // ─── CREATE ──────────────────────────────────────────────────────
    // Only name, phone, source are required (matching Mongoose schema)
    create: Joi.object({
        body: Joi.object({
            // REQUIRED fields (matches Mongoose required:true)
            name: Joi.string().trim().required().min(2).max(100).messages({
                'string.empty': 'Full name is required',
                'any.required': 'Full name is required',
                'string.min': 'Full name must be at least 2 characters long'
            }),
            phone: Joi.string().trim().required().min(5).max(20).messages({
                'string.empty': 'Phone number is required',
                'any.required': 'Phone number is required',
                'string.min': 'Phone number must be at least 5 characters long'
            }),
            source: Joi.string().trim().required().messages({
                'string.empty': 'Lead source is required',
                'any.required': 'Lead source is required'
            }),

            // OPTIONAL - Basic contact
            email: Joi.string().trim().email().lowercase().allow('', null).optional().messages({
                'string.email': 'Please enter a valid email address'
            }),
            alternate_phone: Joi.string().trim().allow('', null).optional(),
            whatsapp_number: Joi.string().trim().allow('', null).optional(),

            // OPTIONAL - Lead category
            lead_type: Joi.string().valid(...LEAD_TYPES).default('buyer').optional(),
            client_type: Joi.string().valid(...CLIENT_TYPES).default('buying').optional(),
            inquiry_for: Joi.string().trim().allow('', null).optional(),
            requirement: Joi.string().trim().max(2000).allow('', null).optional(),

            // OPTIONAL - Budget / Pricing
            budget: Joi.string().trim().allow('', null).optional(),
            currency: Joi.string().valid(...CURRENCIES).default('AED').optional(),
            budget_min: Joi.number().min(0).allow('', null).optional(),
            budget_max: Joi.number().min(0).allow('', null).optional(),
            asking_price: Joi.number().min(0).allow('', null).optional(),
            price_label: Joi.string().trim().allow('', null).optional(),
            price_negotiable: Joi.boolean().default(false).optional(),

            // OPTIONAL - Property details
            property_type: Joi.string().valid(...PROPERTY_TYPES).default('villa').optional(),
            unit_count: Joi.number().min(1).default(1).optional(),
            bedrooms: Joi.string().trim().allow('', null).optional(),
            bathrooms: Joi.number().min(0).allow('', null).optional(),
            maid_room: Joi.boolean().default(false).optional(),
            furnished_status: Joi.string().valid(...FURNISHED_STATUSES).default('unknown').optional(),

            // OPTIONAL - Area details
            plot_size: areaObject,
            built_up_area: areaObject,

            // OPTIONAL - Broker / Owner
            owner_name: Joi.string().trim().allow('', null).optional(),
            broker_name: Joi.string().trim().allow('', null).optional(),
            broker_phone: Joi.string().trim().allow('', null).optional(),
            shared_details: Joi.string().trim().allow('', null).optional(),
            address: Joi.string().trim().allow('', null).optional(),

            // OPTIONAL - Property links
            properties: Joi.array().items(objectId).optional(),

            // OPTIONAL - CRM
            priority: Joi.string().valid(...PRIORITIES).default('low').optional(),
            status: Joi.string().valid(...LEAD_STATUSES).default('new').optional(),
            assigned_to: Joi.array().items(objectId).optional(),
            next_follow_up_date: Joi.date().iso().optional(),
            follow_up_status: Joi.string().valid(...FOLLOW_UP_STATUSES).default('pending').optional(),

            // OPTIONAL - Notes / remarks
            remarks: Joi.string().trim().max(2000).allow('', null).optional(),
            notes: Joi.string().trim().max(5000).allow('', null).optional(),
            comments: Joi.string().trim().max(2000).allow('', null).optional(),
            lost_reason: Joi.string().trim().max(1000).allow('', null).optional(),
            tags: Joi.array().items(Joi.string().trim()).optional(),

            // OPTIONAL - UTM
            utm: utmObject
        }).required()
    }),

    // ─── UPDATE ──────────────────────────────────────────────────────
    // Nothing required - it's a PATCH operation
    update: Joi.object({
        params: Joi.object({
            id: objectId.required()
        }),
        body: Joi.object({
            // Basic contact
            name: Joi.string().trim().min(2).max(100).optional(),
            email: Joi.string().trim().email().lowercase().allow('', null).optional(),
            phone: Joi.string().trim().min(5).max(20).optional(),
            alternate_phone: Joi.string().trim().allow('', null).optional(),
            whatsapp_number: Joi.string().trim().allow('', null).optional(),

            // Lead category
            lead_type: Joi.string().valid(...LEAD_TYPES).optional(),
            client_type: Joi.string().valid(...CLIENT_TYPES).optional(),
            inquiry_for: Joi.string().trim().allow('', null).optional(),
            requirement: Joi.string().trim().max(2000).allow('', null).optional(),

            // Budget / Pricing
            budget: Joi.string().trim().allow('', null).optional(),
            currency: Joi.string().valid(...CURRENCIES).optional(),
            budget_min: Joi.number().min(0).allow('', null).optional(),
            budget_max: Joi.number().min(0).allow('', null).optional(),
            asking_price: Joi.number().min(0).allow('', null).optional(),
            price_label: Joi.string().trim().allow('', null).optional(),
            price_negotiable: Joi.boolean().optional(),

            // Property details
            property_type: Joi.string().valid(...PROPERTY_TYPES).optional(),
            unit_count: Joi.number().min(1).optional(),
            bedrooms: Joi.string().trim().allow('', null).optional(),
            bathrooms: Joi.number().min(0).allow('', null).optional(),
            maid_room: Joi.boolean().optional(),
            furnished_status: Joi.string().valid(...FURNISHED_STATUSES).optional(),

            // Area details
            plot_size: areaObject,
            built_up_area: areaObject,

            // Broker / Owner
            owner_name: Joi.string().trim().allow('', null).optional(),
            broker_name: Joi.string().trim().allow('', null).optional(),
            broker_phone: Joi.string().trim().allow('', null).optional(),
            shared_details: Joi.string().trim().allow('', null).optional(),
            address: Joi.string().trim().allow('', null).optional(),

            // Property links
            properties: Joi.array().items(objectId).optional(),

            // CRM
            source: Joi.string().trim().optional(),
            priority: Joi.string().valid(...PRIORITIES).optional(),
            status: Joi.string().valid(...LEAD_STATUSES).optional(),
            assigned_to: Joi.array().items(objectId).optional(),
            next_follow_up_date: Joi.date().iso().optional(),
            follow_up_status: Joi.string().valid(...FOLLOW_UP_STATUSES).optional(),

            // Notes / remarks
            remarks: Joi.string().trim().max(2000).allow('', null).optional(),
            notes: Joi.string().trim().max(5000).allow('', null).optional(),
            comments: Joi.string().trim().max(2000).allow('', null).optional(),
            lost_reason: Joi.string().trim().max(1000).allow('', null).optional(),
            tags: Joi.array().items(Joi.string().trim()).optional(),

            // UTM
            utm: utmObject
        }).min(1)
    }),

    // ─── QUERY ───────────────────────────────────────────────────────
    query: Joi.object({
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            status: Joi.string().valid(...LEAD_STATUSES).allow('', null).optional(),
            priority: Joi.string().valid(...PRIORITIES).allow('', null).optional(),
            lead_type: Joi.string().valid(...LEAD_TYPES).allow('', null).optional(),
            property_type: Joi.string().valid(...PROPERTY_TYPES).allow('', null).optional(),
            search: Joi.string().trim().allow('', null).optional(),
            follow_up_due: Joi.string().valid('today', 'overdue', 'upcoming', 'true', '1').allow('', null).optional(),
            assigned_to: Joi.string().allow('', null).optional()
        })
    })
};

const PROPERTY_LISTING_TYPES = [
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
];

const PROPERTY_STATUSES = [
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
];

const PROPERTY_COMPLETION_STATUSES = ['ready', 'off_plan', 'under_construction', 'new_launch', 'resale', 'secondary_market', 'unknown'];
const PROPERTY_OCCUPANCY_STATUSES = ['vacant', 'owner_occupied', 'tenant_occupied', 'leased', 'unknown'];

const propertySchemas = {
    create: Joi.object({
        body: Joi.object({
            // Minimal required fields
            property_title: Joi.string().trim().required().min(3).max(200).messages({
                'string.empty': 'Property title is required',
                'any.required': 'Property title is required',
                'string.min': 'Property title must be at least 3 characters long'
            }),
            listing_type: Joi.string().valid(...PROPERTY_LISTING_TYPES).required().messages({
                'any.only': 'Please select a valid listing type',
                'any.required': 'Listing type is required'
            }),

            // Basic details
            property_type: Joi.string().trim().default('Apartment'),
            property_description: Joi.string().trim().max(10000).allow('', null),
            asking_price: Joi.number().min(0).allow('', null),
            currency: Joi.string().valid('INR', 'AED', 'USD', 'EUR', 'GBP', 'JPY').default('INR'),
            price_sqft: Joi.number().min(0).allow('', null),
            price_negotiable: Joi.boolean().default(false),

            // Location
            property_address: Joi.string().trim().allow('', null),
            property_location: Joi.object({
                line1: Joi.string().trim().allow('', null),
                line2: Joi.string().trim().allow('', null),
                city: Joi.string().trim().allow('', null),
                state: Joi.string().trim().allow('', null),
                country: Joi.string().trim().default('IN'),
                postal_code: Joi.string().trim().allow('', null),
                landmark: Joi.string().trim().allow('', null),
                google_map_url: Joi.string().trim().allow('', null)
            }).optional(),

            // Area
            total_area: Joi.number().min(0).allow('', null),
            area_unit: Joi.string().valid('sqft', 'sqm', 'sqyd', 'acre', 'bigha', 'hectare').default('sqft'),
            carpet_area: Joi.number().min(0).allow('', null),
            built_up_area: Joi.number().min(0).allow('', null),
            plot_area: Joi.number().min(0).allow('', null),
            plot_area_unit: Joi.string().valid('sqft', 'sqm', 'sqyd', 'acre', 'bigha', 'hectare').default('sqft'),
            super_built_up_area: Joi.number().min(0).allow('', null),
            usable_area: Joi.number().min(0).allow('', null),

            // Room details
            total_bedrooms: Joi.number().min(0).allow('', null),
            total_bathrooms: Joi.number().min(0).allow('', null),
            bedroom_label: Joi.string().trim().allow('', null),
            maid_room: Joi.boolean().default(false),
            servant_room: Joi.boolean().default(false),
            study_room: Joi.boolean().default(false),
            store_room: Joi.boolean().default(false),
            balcony_count: Joi.number().min(0).allow('', null).default(0),
            parking_count: Joi.number().min(0).allow('', null).default(0),

            // International / Project details
            property_code: Joi.string().trim().allow('', null),
            reference_id: Joi.string().trim().allow('', null),
            external_id: Joi.string().trim().allow('', null),
            property_category: Joi.string().valid('residential', 'commercial', 'land', 'hospitality', 'industrial', 'mixed_use', 'other').default('residential'),
            property_sub_type: Joi.string().trim().allow('', null),
            project_name: Joi.string().trim().allow('', null),
            tower_name: Joi.string().trim().allow('', null),
            building_name: Joi.string().trim().allow('', null),
            community_name: Joi.string().trim().allow('', null),
            sub_community: Joi.string().trim().allow('', null),
            unit_number: Joi.string().trim().allow('', null),
            floor_number: Joi.number().allow('', null),
            total_floors: Joi.number().allow('', null),

            // Price intelligence
            original_price: Joi.number().min(0).allow('', null).default(0),
            rental_yield: Joi.number().min(0).allow('', null).default(0),
            service_charges: Joi.number().min(0).allow('', null).default(0),
            maintenance_fee: Joi.number().min(0).allow('', null).default(0),
            payment_plan: Joi.string().trim().allow('', null),
            down_payment: Joi.number().min(0).allow('', null).default(0),

            // Status / workflow
            property_status: Joi.string().valid(...PROPERTY_STATUSES).default('available'),
            completion_status: Joi.string().valid(...PROPERTY_COMPLETION_STATUSES).default('unknown'),
            occupancy_status: Joi.string().valid(...PROPERTY_OCCUPANCY_STATUSES).default('unknown'),
            possession_date: Joi.date().allow('', null),
            available_from: Joi.date().allow('', null),
            handover_date: Joi.date().allow('', null),
            handover_label: Joi.string().trim().allow('', null),

            // Occupancy
            tenant_name: Joi.string().trim().allow('', null),
            tenant_phone: Joi.string().trim().allow('', null),
            lease_end_date: Joi.date().allow('', null),

            // Legal
            permit_number: Joi.string().trim().allow('', null),
            rera_number: Joi.string().trim().allow('', null),
            dld_permit_number: Joi.string().trim().allow('', null),
            title_deed_number: Joi.string().trim().allow('', null),

            // SEO / Media
            video_url: Joi.string().trim().allow('', null),
            virtual_tour_url: Joi.string().trim().allow('', null),
            floor_plan_url: Joi.string().trim().allow('', null),
            brochure_url: Joi.string().trim().allow('', null),
            tags: Joi.array().items(Joi.string().trim()),
            highlights: Joi.array().items(Joi.string().trim()),
            amenities: Joi.array().items(Joi.string().trim()),
            view_type: Joi.string().trim().allow('', null),
            remarks: Joi.string().trim().allow('', null),

            // System / Assignment
            assign_agent: Joi.array().items(objectId),
            furnished_status: Joi.string().valid('furnished', 'unfurnished', 'fully furnished', 'semi furnished', 'NA').default('NA'),
            is_active: Joi.boolean().default(true)
        }).required()
    }),
    update: Joi.object({
        params: Joi.object({
            id: objectId.required()
        }),
        body: Joi.object({
            property_title: Joi.string().trim().min(3).max(200),
            listing_type: Joi.string().valid(...PROPERTY_LISTING_TYPES),
            property_type: Joi.string().trim(),
            property_description: Joi.string().trim().max(10000).allow('', null),
            asking_price: Joi.number().min(0).allow('', null),
            currency: Joi.string().valid('INR', 'AED', 'USD', 'EUR', 'GBP', 'JPY'),
            price_sqft: Joi.number().min(0).allow('', null),
            price_negotiable: Joi.boolean(),
            property_address: Joi.string().trim().allow('', null),
            property_location: Joi.object({
                line1: Joi.string().trim().allow('', null),
                line2: Joi.string().trim().allow('', null),
                city: Joi.string().trim().allow('', null),
                state: Joi.string().trim().allow('', null),
                country: Joi.string().trim(),
                postal_code: Joi.string().trim().allow('', null),
                landmark: Joi.string().trim().allow('', null),
                google_map_url: Joi.string().trim().allow('', null)
            }),
            total_area: Joi.number().min(0).allow('', null),
            area_unit: Joi.string().valid('sqft', 'sqm', 'sqyd', 'acre', 'bigha', 'hectare'),
            carpet_area: Joi.number().min(0).allow('', null),
            built_up_area: Joi.number().min(0).allow('', null),
            plot_area: Joi.number().min(0).allow('', null),
            plot_area_unit: Joi.string().valid('sqft', 'sqm', 'sqyd', 'acre', 'bigha', 'hectare'),
            super_built_up_area: Joi.number().min(0).allow('', null),
            usable_area: Joi.number().min(0).allow('', null),
            total_bedrooms: Joi.number().min(0).allow('', null),
            total_bathrooms: Joi.number().min(0).allow('', null),
            bedroom_label: Joi.string().trim().allow('', null),
            maid_room: Joi.boolean(),
            servant_room: Joi.boolean(),
            study_room: Joi.boolean(),
            store_room: Joi.boolean(),
            balcony_count: Joi.number().min(0),
            parking_count: Joi.number().min(0),
            property_code: Joi.string().trim().allow('', null),
            reference_id: Joi.string().trim().allow('', null),
            external_id: Joi.string().trim().allow('', null),
            property_category: Joi.string().valid('residential', 'commercial', 'land', 'hospitality', 'industrial', 'mixed_use', 'other'),
            property_sub_type: Joi.string().trim().allow('', null),
            project_name: Joi.string().trim().allow('', null),
            tower_name: Joi.string().trim().allow('', null),
            building_name: Joi.string().trim().allow('', null),
            community_name: Joi.string().trim().allow('', null),
            sub_community: Joi.string().trim().allow('', null),
            unit_number: Joi.string().trim().allow('', null),
            floor_number: Joi.number().allow('', null),
            total_floors: Joi.number().allow('', null),
            original_price: Joi.number().min(0).allow('', null),
            rental_yield: Joi.number().min(0).allow('', null),
            service_charges: Joi.number().min(0).allow('', null),
            maintenance_fee: Joi.number().min(0).allow('', null),
            payment_plan: Joi.string().trim().allow('', null),
            down_payment: Joi.number().min(0).allow('', null),
            property_status: Joi.string().valid(...PROPERTY_STATUSES),
            completion_status: Joi.string().valid(...PROPERTY_COMPLETION_STATUSES),
            occupancy_status: Joi.string().valid(...PROPERTY_OCCUPANCY_STATUSES),
            possession_date: Joi.date().allow('', null),
            available_from: Joi.date().allow('', null),
            handover_date: Joi.date().allow('', null),
            handover_label: Joi.string().trim().allow('', null),
            tenant_name: Joi.string().trim().allow('', null),
            tenant_phone: Joi.string().trim().allow('', null),
            lease_end_date: Joi.date().allow('', null),
            permit_number: Joi.string().trim().allow('', null),
            rera_number: Joi.string().trim().allow('', null),
            dld_permit_number: Joi.string().trim().allow('', null),
            title_deed_number: Joi.string().trim().allow('', null),
            video_url: Joi.string().trim().allow('', null),
            virtual_tour_url: Joi.string().trim().allow('', null),
            floor_plan_url: Joi.string().trim().allow('', null),
            brochure_url: Joi.string().trim().allow('', null),
            tags: Joi.array().items(Joi.string().trim()),
            highlights: Joi.array().items(Joi.string().trim()),
            amenities: Joi.array().items(Joi.string().trim()),
            view_type: Joi.string().trim().allow('', null),
            remarks: Joi.string().trim().allow('', null),
            assign_agent: Joi.array().items(objectId),
            furnished_status: Joi.string().valid('furnished', 'unfurnished', 'fully furnished', 'semi furnished', 'NA'),
            is_active: Joi.boolean(),
            balcony_count: Joi.number().min(0).allow('', null),
            parking_count: Joi.number().min(0).allow('', null)
        }).min(1)
    })
};

const authSchemas = {
    login: Joi.object({
        body: Joi.object({
            email: Joi.string().trim().lowercase().optional(),
            phone_number: Joi.string().trim().optional(),
            phone: Joi.string().trim().optional(),
            identifier: Joi.string().trim().optional(),
            phone_or_email: Joi.string().trim().optional(),
            password: Joi.string().optional(),
            agent_pin: Joi.string().optional(),
            remember: Joi.boolean().default(false)
        }).or('email', 'phone_number', 'phone', 'identifier', 'phone_or_email')
        .or('password', 'agent_pin')
        .messages({
            'object.missing': 'Identifier and password are required'
        })
    }),
    registerAdmin: Joi.object({
        body: Joi.object({
            user_name: Joi.string().trim().required().min(2),
            email: Joi.string().trim().email().required().lowercase(),
            phone_number: Joi.string().trim().required().min(10).max(15),
            password: Joi.string().required().min(8),
            profile_pic: Joi.string().optional()
        }).required()
    })
};

module.exports = {
    leadSchemas,
    propertySchemas,
    authSchemas,
    objectId
};
