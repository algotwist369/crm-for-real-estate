const { htmlLayout, paragraphHtml, buttonHtml } = require('./shared');

function render(data = {}, env = {}) {
    const appName = env.appName || 'AlgoTwist';
    const appUrl = env.appUrl || '';
    const name = data.name || 'there';

    const title = `Welcome to ${appName}`;
    const preheader = 'Your account is ready. Start managing leads and properties.';

    const contentHtml = [
        paragraphHtml(`Hi ${name},`),
        paragraphHtml(`Welcome to ${appName}. Your account is ready.`),
        appUrl ? buttonHtml({ url: appUrl, label: 'Open Dashboard' }) : '',
        paragraphHtml('If you did not request this account, you can ignore this email.')
    ].filter(Boolean).join('');

    const html = htmlLayout({ appName, title, preheader, contentHtml });
    const text = `Hi ${name},\n\nWelcome to ${appName}. Your account is ready.${appUrl ? `\n\nOpen Dashboard: ${appUrl}` : ''}\n\nIf you did not request this account, you can ignore this email.\n`;

    return { subject: title, html, text };
}

module.exports = { render };
