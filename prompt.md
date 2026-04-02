Act as a senior full-stack SaaS architect and production MERN engineer.

I am building a multi-tenant international real-estate CRM (MERN stack) that must support local and global property markets such as UAE, India, UK, USA, etc.

My current CRM already has Leads, Properties, Agents, Admins, and role-based access. I have now upgraded my Lead model to support international real-estate listing + owner + buyer + broker + investor workflows.

Your task is to update my ENTIRE codebase based on the new Lead schema changes.

IMPORTANT:
- Before updating any file, please read the existing file and understand the current implementation and flow.
- Do not give partial or conceptual output.
- I want actual production-ready code changes and exact file updates.
- If a file should be modified, show the full updated file or clearly updated code block.
- Keep my project structure clean, scalable, and professional.
- Maintain backward compatibility where possible.
- Use best practices for MERN stack production apps.
- Keep the UI Same which already using, clean, responsive, and CRM-friendly.
- Optimize for international real-estate market use cases.
- Do not change the existing functionality & Features of the application. 

--------------------------------------------------
NEW BUSINESS GOAL
--------------------------------------------------
I want this CRM to support:
- Buyer leads
- Seller leads
- Owner leads
- Investor leads
- Broker leads
- Tenant leads
- Property listing leads
- International real-estate workflows
- Dubai / UAE style listing recap data
- Multiple currencies
- Different property types
- Handover / off-plan / ready properties
- Area units like sq.ft / sq.m / sqm
- Market-specific lead capture and filtering

This CRM should feel suitable for:
- Dubai real estate agencies
- Indian real estate firms
- International property brokerages
- Luxury real estate sales teams
- Property investment consultancies

--------------------------------------------------
UPDATED LEAD MODEL (USE THIS AS SOURCE OF TRUTH)
--------------------------------------------------

Use this lead schema as the new source of truth and update all backend/frontend logic around it:

```js
const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    // =========================
    // BASIC LEAD / CLIENT INFO
    // =========================
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        index: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    alternate_phone: {
        type: String,
        trim: true,
        default: ''
    },
    whatsapp_number: {
        type: String,
        trim: true,
        default: ''
    },

    // =========================
    // LEAD CATEGORY
    // =========================
    lead_type: {
        type: String,
        enum: ['buyer', 'seller', 'owner', 'tenant', 'investor', 'listing', 'broker', 'other'],
        default: 'buyer',
        index: true
    },

    client_type: {
        type: String,
        enum: ['buying', 'renting', 'investing', 'selling', 'other'],
        default: 'buying',
        index: true
    },

    inquiry_for: {
        type: String,
        trim: true,
        default: ''
    },

    requirement: {
        type: String,
        trim: true,
        default: ''
    },

    // =========================
    // BUDGET / PRICE
    // =========================
    budget: {
        type: String,
        trim: true,
        default: ''
    },
    currency: {
        type: String,
        enum: ['₹', '$', 'AED'],
        default: 'AED'
    },
    budget_min: {
        type: Number,
        min: 0,
        default: 0
    },
    budget_max: {
        type: Number,
        min: 0,
        default: 0
    },
    asking_price: {
        type: Number,
        min: 0,
        default: 0,
        index: true
    },
    price_label: {
        type: String,
        trim: true,
        default: '' // Example: "3.5 M", "45 M", "2.3 to 2.4 M"
    },
    price_negotiable: {
        type: Boolean,
        default: false
    },

    // =========================
    // PROPERTY DETAILS
    // =========================
    property_type: {
        type: String,
        enum: ['villa', 'townhouse', 'apartment', 'penthouse', 'plot', 'commercial', 'office', 'shop', 'warehouse', 'other'],
        default: 'villa',
        index: true
    },
    unit_count: {
        type: Number,
        default: 1,
        min: 1
    },
    bedrooms: {
        type: String,
        trim: true,
        default: '' // Example: "4 BR", "5 BR + Maid", "1 BR"
    },
    bathrooms: {
        type: Number,
        min: 0,
        default: 0
    },
    maid_room: {
        type: Boolean,
        default: false
    },
    furnished_status: {
        type: String,
        enum: ['furnished', 'semi_furnished', 'unfurnished', 'unknown'],
        default: 'unknown'
    },

    // =========================
    // AREA DETAILS
    // =========================
    plot_size: {
        value: { type: Number, default: 0 },
        unit: {
            type: String,
            enum: ['sq.ft', 'sq.m', 'sqm', 'acre', 'hectare', 'other'],
            default: 'sq.ft'
        }
    },
    built_up_area: {
        value: { type: Number, default: 0 },
        unit: {
            type: String,
            enum: ['sq.ft', 'sq.m', 'sqm', 'acre', 'hectare', 'other'],
            default: 'sq.ft'
        }
    },

    // =========================
    // BROKER / OWNER / SHARED DETAILS
    // =========================
    owner_name: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    broker_name: {
        type: String,
        trim: true,
        default: '',
        index: true
    },
    broker_phone: {
        type: String,
        trim: true,
        default: ''
    },
    shared_details: {
        type: String,
        trim: true,
        default: ''
    },

    address: {
        type: String
    },
    // =========================
    // EXISTING PROPERTY LINK
    // =========================
    properties: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Properties',
        index: true
    }],

    // =========================
    // SOURCE / MARKETING
    // =========================
    source: {
        type: String,
        enum: [
            'website',
            'facebook',
            'instagram',
            'linkedin',
            'whatsapp',
            'google_ads',
            'referral',
            'advertisement',
            'personal',
            'walk_in',
            'broker',
            'owner',
            'manual_entry',
            'other'
        ],
        default: 'website',
        required: true,
        index: true
    },

    utm: {
        source: { type: String, trim: true, default: '' },
        medium: { type: String, trim: true, default: '' },
        campaign: { type: String, trim: true, default: '' },
        term: { type: String, trim: true, default: '' },
        content: { type: String, trim: true, default: '' },
    },

    // =========================
    // CRM STATUS
    // =========================
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
        index: true
    },
    status: {
        type: String,
        enum: [
            'new',
            'contacted',
            'qualified',
            'follow_up',
            'site_visit',
            'negotiation',
            'booked',
            'converted',
            'lost',
            'wasted',
            'closed',
            'archived'
        ],
        default: 'new',
        index: true
    },

    next_follow_up_date: {
        type: Date,
        index: true
    },
    follow_up_status: {
        type: String,
        enum: ['pending', 'done', 'missed', 'rescheduled'],
        default: 'pending',
        index: true
    },
    followed_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
    last_contacted_at: {
        type: Date
    },
    converted_at: {
        type: Date
    },
    lost_reason: {
        type: String,
        trim: true,
        default: ''
    },

    // =========================
    // NOTES / COMMENTS
    // =========================
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    notes: {
        type: String,
        default: '',
        trim: true
    },
    comments: {
        type: String,
        trim: true,
        default: ''
    },

    // =========================
    // TEAM / ASSIGNMENT
    // =========================
    assigned_to: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    }],
    created_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        index: true
    },
    updated_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },

    // =========================
    // TAGS
    // =========================
    tags: [{
        type: String,
        trim: true,
        index: true
    }],

    // =========================
    // TENANCY / ACTIVE
    // =========================
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

}, { timestamps: true });


// =========================
// COMPOUND INDEXES
// =========================
leadSchema.index({ tenant_id: 1, status: 1 });
leadSchema.index({ tenant_id: 1, assigned_to: 1 });
leadSchema.index({ tenant_id: 1, createdAt: -1 });
leadSchema.index({ tenant_id: 1, next_follow_up_date: 1, follow_up_status: 1 });
leadSchema.index({ tenant_id: 1, email: 1 });
leadSchema.index({ tenant_id: 1, phone: 1 });
leadSchema.index({ tenant_id: 1, property_type: 1 });
leadSchema.index({ tenant_id: 1, city: 1, community: 1 });
leadSchema.index({ tenant_id: 1, owner_name: 1 });
leadSchema.index({ tenant_id: 1, broker_name: 1 });
leadSchema.index({ tenant_id: 1, asking_price: 1 });
leadSchema.index({ tenant_id: 1, property_status: 1 });

module.exports = mongoose.model('Lead', leadSchema);