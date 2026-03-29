const User = require('../model/user.model');
const Properties = require('../model/properties.model');
const Agent = require('../model/agent.model');
const mongoose = require('mongoose');
const { sendMail } = require('../utils/sendMail');
const Notification = require('../model/notification.model');
const socketService = require('./socket.service');
const { convertCurrency } = require('../utils/currencyConverter');

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

async function createSystemNotification({ recipients, senderId, type, category, title, message, url, metadata, tenantId }) {
    try {
        const userIds = uniqueObjectIds(Array.isArray(recipients) ? recipients : [recipients]);
        if (!userIds.length) return;

        const notifications = userIds.map(userId => ({
            recipient: userId,
            sender: senderId,
            type: type || 'info',
            category,
            title,
            message,
            action_url: url,
            metadata: metadata || {},
            tenant_id: tenantId
        }));

        const saved = await Notification.insertMany(notifications);
        
        // Emit real-time pulse
        saved.forEach(notif => {
            socketService.emitToUser(notif.recipient, 'new_notification', notif);
        });
        
        return saved;
    } catch (error) {
        console.error('Error creating system notification:', error.message);
    }
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

        await Promise.all([
            sendMail({
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
            }),
            createSystemNotification({
                recipients: recipients.map(r => r._id),
                senderId: creatorId,
                type: 'info',
                category: 'property_added',
                title: 'New Property Added',
                message: `${addedBy} added a new property: ${property.property_title}`,
                url: `/properties/${property._id}`,
                tenantId: property.tenant_id
            })
        ]);
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

        await Promise.all([
            sendMail({
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
            }),
            createSystemNotification({
                recipients: recipients.map(r => r._id),
                senderId: creatorId,
                type: 'success',
                category: 'lead_assigned',
                title: 'New Lead Assigned',
                message: `${assignedBy} assigned a new lead: ${lead.name}`,
                url: `/leads/${lead._id}`,
                tenantId: lead.tenant_id
            })
        ]);
    } catch (error) {
        console.error('Error in notifyPropertyAgentsOnNewLead:', error.message);
    }
}

// Highly restricted recipient query engine
async function getFollowUpRecipientsForLead(lead, actionUserId) {
    if (!lead) return [];

    const propertyIds = Array.isArray(lead.properties) 
        ? lead.properties.map(p => String(p._id || p)) 
        : [];
        
    let propertyAgentUserIds = [];
    if (propertyIds.length) {
        const props = await Properties.find({ _id: { $in: uniqueObjectIds(propertyIds) } }).select('assign_agent').lean();
        const agentIds = props.flatMap(p => Array.isArray(p.assign_agent) ? p.assign_agent : []).map(a => String(a));
        
        if (agentIds.length) {
            const agents = await Agent.find({ _id: { $in: uniqueObjectIds(agentIds) }, is_active: true }).select('agent_details').lean();
            propertyAgentUserIds = agents.map(a => String(a.agent_details)).filter(Boolean);
        }
    }

    const assignedToIds = Array.isArray(lead.assigned_to) ? lead.assigned_to.map(x => String(x)) : [];

    const validUserIds = uniqueObjectIds([
        ...propertyAgentUserIds,
        ...assignedToIds,
        lead.created_by ? String(lead.created_by) : '',
        lead.followed_by ? String(lead.followed_by) : '',
        actionUserId ? String(actionUserId) : ''
    ]);

    // Query target recipients: Admin OR explicitly involved Agents
    const recipients = await User.find({
        $or: [
            { _id: lead.tenant_id }, // Admin
            { _id: { $in: validUserIds }, tenant_id: lead.tenant_id } // Assigned explicitly under the tenant
        ],
        is_active: true,
        is_deleted: false,
        email: { $exists: true, $ne: '' }
    }).select('_id email').lean();

    return recipients;
}

// Triggered immediately when a follow up is scheduled
async function notifyFollowUpCreated(lead, actionUserId) {
    try {
        if (!lead || !lead.next_follow_up_date) return;
        
        const recipients = await getFollowUpRecipientsForLead(lead, actionUserId);
        
        // Exclude the person who just scheduled it from the "Immediate" notification to avoid spamming them
        const emails = uniqueStrings(recipients.filter(u => String(u._id) !== String(actionUserId)).map(u => u.email));
        if (!emails.length) return;

        const creator = await User.findById(actionUserId).select('user_name').lean();
        const actorName = creator?.user_name || 'A team member';

        const appUrl = String(process.env.APP_URL || '').replace(/\/$/, '');
        const leadUrl = appUrl ? `${appUrl}/leads/${lead._id}` : '';

        const to = emails[0];
        const bcc = emails.length > 1 ? emails.slice(1) : undefined;

        await Promise.all([
            sendMail({
                to,
                bcc,
                template: 'followUpReminder',
                templateData: {
                    leadName: lead.name,
                    leadPhone: lead.phone,
                    requirement: lead.requirement,
                    budget: lead.budget,
                    priority: lead.priority,
                    followUpDate: lead.next_follow_up_date,
                    remarks: lead.remarks || lead.notes || '',
                    leadUrl,
                    actorName
                }
            }),
            createSystemNotification({
                recipients: recipients.filter(u => String(u._id) !== String(actionUserId)).map(u => u._id),
                senderId: actionUserId,
                type: 'warning',
                category: 'followup_reminder',
                title: 'Follow-up Scheduled',
                message: `${actorName} scheduled a follow-up for ${lead.name}`,
                url: `/leads/${lead._id}`,
                tenantId: lead.tenant_id
            })
        ]);
    } catch (error) {
        console.error('Error in notifyFollowUpCreated:', error.message);
    }
}

async function notifyLeadStatusChanged(lead, oldStatus, newStatus, actionUserId) {
    try {
        if (!lead || !newStatus) return;
        if (String(oldStatus || '').toLowerCase() === String(newStatus || '').toLowerCase()) return;

        const recipients = await getFollowUpRecipientsForLead(lead, actionUserId);
        
        // Exclude the person who made the change to avoid spamming them
        const emails = uniqueStrings(recipients.filter(u => String(u._id) !== String(actionUserId)).map(u => u.email));
        if (!emails.length) return;

        const actor = await User.findById(actionUserId).select('user_name').lean();
        const updatedBy = actor?.user_name || 'A team member';

        const appUrl = String(process.env.APP_URL || '').replace(/\/$/, '');
        const leadUrl = appUrl ? `${appUrl}/leads/${lead._id}` : '';

        const to = emails[0];
        const bcc = emails.length > 1 ? emails.slice(1) : undefined;

        await Promise.all([
            sendMail({
                to,
                bcc,
                template: 'leadStatusUpdated',
                templateData: {
                    leadName: lead.name,
                    oldStatus: (oldStatus || 'None').toUpperCase(),
                    newStatus: newStatus.toUpperCase(),
                    updatedBy,
                    leadUrl,
                    requirement: lead.requirement || 'N/A',
                    budget: lead.budget || 'N/A',
                    phone: lead.phone || 'N/A',
                    email: lead.email || 'N/A'
                }
            }),
            createSystemNotification({
                recipients: recipients.filter(u => String(u._id) !== String(actionUserId)).map(u => u._id),
                senderId: actionUserId,
                type: 'info',
                category: 'status_changed',
                title: 'Lead Status Updated',
                message: `${updatedBy} changed ${lead.name}'s status to ${newStatus.toUpperCase()}`,
                url: `/leads/${lead._id}`,
                tenantId: lead.tenant_id
            })
        ]);
    } catch (error) {
        console.error('Error in notifyLeadStatusChanged:', error.message);
    }
}

module.exports = {
    notifyUsersOnNewProperty,
    notifyPropertyAgentsOnNewLead,
    getFollowUpRecipientsForLead,
    notifyFollowUpCreated,
    notifyLeadStatusChanged
};
