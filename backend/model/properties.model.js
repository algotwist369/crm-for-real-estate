const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const propertiesSchema = new Schema({
    property_title: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        required: false,
        trim: true,
        unique: true,
        lowercase: true
    },


    property_type: {
        type: String,
        required: true,
        enum: ['rent', 'sale', 'Apartment', 'investment', 'Studio', 'Villa', 'Plot', 'Commercial', 'other'],
        default: 'appartment',
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
        default: []
    },
    property_status: {
        type: String,
        enum: ['available', 'under_offer', 'sold', 'rented', 'inactive'],
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
        coordinates: {
            type: {
                type: String,
                enum: ['Point']
            },
            coordinates: {
                type: [Number]
            }
        }
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
        min: 0
    },
    total_bathrooms: {
        type: Number,
        min: 0
    },
    property_description: {
        type: String,
        trim: true,
        default: ''
    },
    furnished_status: {
        type: String,
        enum: ['furnished', 'unfurnished', 'fully furnished', 'NA'],
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
                type: String, // document name or type (e.g., "Title Deed", "Floor Plan")
            },
            value: {
                type: String, // URL or file path to the document
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
        index: true
    },

}, { timestamps: true });

propertiesSchema.index({ assign_agent: 1, property_status: 1 });
propertiesSchema.index({ 'property_location.coordinates': '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Properties', propertiesSchema);
