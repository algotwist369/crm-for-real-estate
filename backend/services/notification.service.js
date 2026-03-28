const User = require('../model/user.model');
const Properties = require('../model/properties.model');
const Agent = require('../model/agent.model');
const mongoose = require('mongoose');
const { sendMail } = require('../utils/sendMail');
const { convertCurrency } = require('../utils/currencyConverter'); // Ensure this utility is available or just hardcode format

function uniqueStrings(values) {
    const set = new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean));
    return Array.from(set);
}

function uniqueObjectIds(values) {
    const set = new Set(values.filter(Boolean).map(v => String(v)));
    return Array.from(set).filter(id => mongoose.Types.ObjectId.isValid(id));
}

function formatINR(value) {
    if (!value) return 'Price on Request';
    return `₹${Number(value).toLocaleString('en-IN')}`;
}
 
async function notifyUsersOnNewProperty(property, creatorId) {
    try {
        if (!property || !creatorId) return;

        // 1. Fetch all active users under the same admin/tenant (including the admin)
        // 2. Exclude the creator entirely
        // 3. Must have an email address
        const recipients = await User.find({
            $or: [
                { tenant_id: property.tenant_id },
                { _id: property.tenant_id }
            ],
            is_active: true,
            is_deleted: false,
            _id: { $ne: creatorId },
            email: { $exists: true, $ne: '' }
        }).select('email').lean();

        const emails = uniqueStrings(recipients.map(u => u.email));
        if (!emails.length) return; // No eligible recipients (e.g., solo admin who is the creator)

        // Gather creator details for the email content
        const creator = await User.findById(creatorId).select('user_name').lean();
        const addedBy = creator?.user_name || 'A team member';

        const appUrl = String(process.env.APP_URL || '').replace(/\/$/, '');
        const propertyUrl = appUrl ? `${appUrl}/properties/${property._id}` : '';

        // Safely extract price
        const priceStr = property.asking_price 
            ? formatINR(property.asking_price) : 'Price on Request';

        // 4. Send bulk email via BCC to prevent displaying everyone's email
        // We use the first email as 'to', and the rest as 'bcc'
        const to = emails[0];
        const bcc = emails.length > 1 ? emails.slice(1) : undefined;

        await sendMail({
            to,
            bcc,
            template: 'propertyNotification',
            templateData: {
                property_title: property.property_title,
                listing_type: property.listing_type || 'Listing',
                asking_price: priceStr,
                added_by: addedBy,
                actionUrl: propertyUrl,
                actionText: 'View Property'
            }
        });
    } catch (error) {
        console.error('Error in notifyUsersOnNewProperty:', error.message);
        // We swallow the error deliberately so it doesn't break the parent API response
    }
}

async function notifyPropertyAgentsOnNewLead(lead, creatorId) {
    try {
        if (!lead || !creatorId) return;

        // 1. Get properties attached to lead
        const propertyIds = Array.isArray(lead.properties) 
            ? lead.properties.map(p => String(p._id || p)) 
            : [];
            
        let propertyAgentUserIds = [];
        if (propertyIds.length) {
            // Get agents assigned to these properties
            const props = await Properties.find({ _id: { $in: uniqueObjectIds(propertyIds) } }).select('assign_agent').lean();
            const agentIds = props.flatMap(p => Array.isArray(p.assign_agent) ? p.assign_agent : []).map(a => String(a));
            
            // Map Agent Profile IDs to User IDs
            if (agentIds.length) {
                const agents = await Agent.find({ _id: { $in: uniqueObjectIds(agentIds) }, is_active: true }).select('agent_details').lean();
                propertyAgentUserIds = agents.map(a => String(a.agent_details)).filter(Boolean);
            }
        }

        const validUserIds = uniqueObjectIds(propertyAgentUserIds);

        // 2. Query target recipients: Admin OR Authorized Assigned Agents
        const recipients = await User.find({
            $or: [
                { _id: lead.tenant_id }, // Admin
                { _id: { $in: validUserIds }, tenant_id: lead.tenant_id } // Assigned agents explicitly part of this tenant
            ],
            is_active: true,
            is_deleted: false,
            _id: { $ne: creatorId }, // NEVER notify the creator
            email: { $exists: true, $ne: '' }
        }).select('email').lean();

        const emails = uniqueStrings(recipients.map(u => u.email));
        if (!emails.length) return;

        const creator = await User.findById(creatorId).select('user_name').lean();
        const assignedBy = creator?.user_name || 'A team member';

        const appUrl = String(process.env.APP_URL || '').replace(/\/$/, '');
        const leadUrl = appUrl ? `${appUrl}/leads/${lead._id}` : '';

        const to = emails[0];
        const bcc = emails.length > 1 ? emails.slice(1) : undefined;

        await sendMail({
            to,
            bcc,
            template: 'leadAssigned',
            templateData: {
                leadName: lead.name,
                leadPhone: lead.phone || 'N/A',
                leadEmail: lead.email || 'N/A',
                requirement: lead.requirement || 'N/A',
                budget: lead.budget || 'N/A',
                source: lead.source || 'N/A',
                assignedBy,
                leadUrl
            }
        });
    } catch (error) {
        console.error('Error in notifyPropertyAgentsOnNewLead:', error.message);
    }
}

module.exports = {
    notifyUsersOnNewProperty,
    notifyPropertyAgentsOnNewLead
};
