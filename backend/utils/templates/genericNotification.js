const { htmlLayout, paragraphHtml, buttonHtml } = require('./shared');

function render(data = {}, env = {}) {
    const appName = env.appName || 'LeadReal';
    const title = data.title || 'Notification';
    const preheader = data.preheader || 'You have a new notification.';
    const message = data.message || '';
    const actionUrl = data.actionUrl || '';
    const actionText = data.actionText || 'Open';

    const contentHtml = [
        message ? paragraphHtml(message) : '',
        actionUrl ? buttonHtml({ url: actionUrl, label: actionText }) : ''
    ].filter(Boolean).join('');

    const html = htmlLayout({ appName, title: `${appName}: ${title}`, preheader, contentHtml });
    const text = `${title}\n\n${message}${actionUrl ? `\n\n${actionText}: ${actionUrl}` : ''}\n`;

    return { subject: `${appName}: ${title}`, html, text };
}

module.exports = { render };
