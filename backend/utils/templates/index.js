const welcome = require('./welcome');
const verifyEmail = require('./verifyEmail');
const resetPassword = require('./resetPassword');
const leadAssigned = require('./leadAssigned');
const followUpReminder = require('./followUpReminder');
const propertyInquiry = require('./propertyInquiry');
const subscriptionReceipt = require('./subscriptionReceipt');
const genericNotification = require('./genericNotification');
const propertyNotification = require('./propertyNotification');
const leadStatusUpdated = require('./leadStatusUpdated');

const templates = {
    welcome,
    verifyEmail,
    resetPassword,
    leadAssigned,
    followUpReminder,
    propertyInquiry,
    subscriptionReceipt,
    genericNotification,
    propertyNotification,
    leadStatusUpdated
};

function getTemplate(name) {
    const key = String(name || '').trim();
    const entry = templates[key];
    if (!entry || typeof entry.render !== 'function') {
        throw new Error(`Unknown email template: ${key}`);
    }
    return entry;
}

function renderTemplate(name, data = {}, env = {}) {
    return getTemplate(name).render(data, env);
}

function listTemplates() {
    return Object.keys(templates);
}

module.exports = {
    renderTemplate,
    listTemplates
};
