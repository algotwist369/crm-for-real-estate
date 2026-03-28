const User = require('../model/user.model');
const { sendMail } = require('../utils/sendMail');
const { convertCurrency } = require('../utils/currencyConverter'); // Ensure this utility is available or just hardcode format

function uniqueStrings(values) {
    const set = new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean));
    return Array.from(set);
}

function formatINR(value) {
    if (!value) return 'Price on Request';
    return `₹${Number(value).toLocaleString('en-IN')}`;
}

/**
 * Notifies all active users under the same tenant about a new property,
 * strictly EXCLUDING the user who created it.
 *
 * @param {Object} property - The populated property mongoose document
 * @param {String|ObjectId} creatorId - The ID of the user who created the property
 */
async function notifyUsersOnNewProperty(property, creatorId) {
    try {
        if (!property || !creatorId) return;

        // 1. Fetch all active users under the same admin/tenant
        // 2. Exclude the creator entirely
        // 3. Must have an email address
        const recipients = await User.find({
            tenant_id: property.tenant_id,
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

module.exports = {
    notifyUsersOnNewProperty
};
