const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message('Invalid ID');

const leadSchemas = {
    create: Joi.object({
        body: Joi.object({
            name: Joi.string().trim().required().min(2).max(100),
            email: Joi.string().trim().email().required().lowercase(),
            phone: Joi.string().trim().required().min(10).max(15),
            requirement: Joi.string().trim().required().max(1000),
            budget: Joi.string().trim().required(),
            currency: Joi.string().valid('₹', '$', 'AED').default('₹'),
            budget_min: Joi.number().min(0).allow('', null).optional(),
            budget_max: Joi.number().min(0).allow('', null).optional(),
            inquiry_for: Joi.string().trim().required(),
            client_type: Joi.string().valid('buying', 'renting', 'investing', 'selling', 'other').default('buying'),
            source: Joi.string().valid('website', 'facebook', 'instagram', 'linkedin', 'whatsapp', 'google_ads', 'referral', 'advertisement', 'personal', 'walk_in', 'other').required(),
            priority: Joi.string().valid('low', 'medium', 'high').default('low'),
            properties: Joi.array().items(objectId).optional(),
            assigned_to: Joi.array().items(objectId).optional(),
            next_follow_up_date: Joi.date().iso().greater('now').optional(),
            follow_up_status: Joi.string().valid('pending', 'done', 'missed', 'rescheduled').default('pending'),
            tags: Joi.array().items(Joi.string().trim()).optional(),
            remarks: Joi.string().trim().max(1000).optional(),
            notes: Joi.string().trim().max(1000).optional(),
        }).required()
    }),
    update: Joi.object({
        params: Joi.object({
            id: objectId.required()
        }),
        body: Joi.object({
            name: Joi.string().trim().min(2).max(100),
            email: Joi.string().trim().email().lowercase(),
            phone: Joi.string().trim().min(10).max(15),
            requirement: Joi.string().trim().max(1000),
            budget: Joi.string().trim(),
            currency: Joi.string().valid('₹', '$', 'AED'),
            budget_min: Joi.number().min(0).allow('', null),
            budget_max: Joi.number().min(0).allow('', null),
            inquiry_for: Joi.string().trim(),
            client_type: Joi.string().valid('buying', 'renting', 'investing', 'selling', 'other'),
            source: Joi.string().valid('website', 'facebook', 'instagram', 'linkedin', 'whatsapp', 'google_ads', 'referral', 'advertisement', 'personal', 'walk_in', 'other'),
            priority: Joi.string().valid('low', 'medium', 'high'),
            status: Joi.string().valid('new', 'contacted', 'qualified', 'lost', 'converted', 'archived', 'follow_up', 'wasted', 'closed'),
            properties: Joi.array().items(objectId),
            assigned_to: Joi.array().items(objectId),
            next_follow_up_date: Joi.date().iso().optional(),
            follow_up_status: Joi.string().valid('pending', 'done', 'missed', 'rescheduled'),
            tags: Joi.array().items(Joi.string().trim()),
            remarks: Joi.string().trim().max(1000),
            notes: Joi.string().trim().max(1000),
            lost_reason: Joi.string().trim().max(500),
        }).min(1)
    }),
    query: Joi.object({
        query: Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            status: Joi.string().valid('new', 'contacted', 'qualified', 'lost', 'converted', 'archived', 'follow_up', 'wasted', 'closed').allow('', null).optional(),
            priority: Joi.string().valid('low', 'medium', 'high').allow('', null).optional(),
            search: Joi.string().trim().allow('', null).optional(),
            follow_up_due: Joi.string().valid('today', 'overdue', 'upcoming', 'true', '1').allow('', null).optional(),
            assigned_to: Joi.string().allow('', null).optional(),
        })
    })
};

const propertySchemas = {
    create: Joi.object({
        body: Joi.object({
            property_title: Joi.string().trim().required().min(5).max(200),
            property_type: Joi.string().trim().default('Apartment'),
            listing_type: Joi.string().valid('rent', 'sale', 'investment').required(),
            asking_price: Joi.number().min(0).required(),
            currency: Joi.string().valid('INR', 'AED', 'USD', 'EUR', 'GBP', 'JPY').default('INR'),
            price_sqft: Joi.number().min(0).allow('', null),
            price_negotiable: Joi.boolean().default(false),
            property_address: Joi.string().trim().required(),
            property_location: Joi.object({
                line1: Joi.string().trim(),
                line2: Joi.string().trim(),
                city: Joi.string().trim().required(),
                state: Joi.string().trim().required(),
                country: Joi.string().trim().default('IN'),
                postal_code: Joi.string().trim(),
                landmark: Joi.string().trim()
            }),
            total_area: Joi.number().min(0).required(),
            area_unit: Joi.string().valid('sqft', 'sqm', 'sqyd', 'acre', 'bigha', 'hectare').default('sqft'),
            total_bedrooms: Joi.number().min(0).allow('', null),
            total_bathrooms: Joi.number().min(0).allow('', null),
            property_description: Joi.string().trim().max(5000),
            property_status: Joi.string().valid('available', 'under_offer', 'sold', 'rented', 'inactive').default('available'),
            assign_agent: Joi.array().items(objectId),
            amenities: Joi.array().items(Joi.string().trim())
        }).required()
    }),
    update: Joi.object({
        params: Joi.object({
            id: objectId.required()
        }),
        body: Joi.object({
            property_title: Joi.string().trim().min(5).max(200),
            property_type: Joi.string().trim(),
            listing_type: Joi.string().valid('rent', 'sale', 'investment'),
            asking_price: Joi.number().min(0).allow('', null),
            currency: Joi.string().valid('INR', 'AED', 'USD', 'EUR', 'GBP', 'JPY'),
            price_sqft: Joi.number().min(0).allow('', null),
            price_negotiable: Joi.boolean(),
            property_address: Joi.string().trim(),
            property_location: Joi.object({
                line1: Joi.string().trim(),
                line2: Joi.string().trim(),
                city: Joi.string().trim(),
                state: Joi.string().trim(),
                country: Joi.string().trim(),
                postal_code: Joi.string().trim(),
                landmark: Joi.string().trim()
            }),
            total_area: Joi.number().min(0).allow('', null),
            area_unit: Joi.string().valid('sqft', 'sqm', 'sqyd', 'acre', 'bigha', 'hectare'),
            total_bedrooms: Joi.number().min(0).allow('', null),
            total_bathrooms: Joi.number().min(0).allow('', null),
            property_description: Joi.string().trim().max(5000),
            property_status: Joi.string().valid('available', 'under_offer', 'sold', 'rented', 'inactive'),
            assign_agent: Joi.array().items(objectId),
            amenities: Joi.array().items(Joi.string().trim()),
            is_active: Joi.boolean()
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
