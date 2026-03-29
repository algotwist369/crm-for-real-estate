const { htmlLayout, paragraphHtml, buttonHtml } = require('./shared');

function render(data = {}, env = {}) {
    const appName = env.appName || 'AlgoTwist';
    const resetUrl = data.resetUrl || '';
    const name = data.name || 'there';

    const title = 'Reset your password';
    const preheader = 'Use the link below to set a new password.';

    const contentHtml = [
        paragraphHtml(`Hi ${name},`),
        paragraphHtml(`We received a request to reset your ${appName} password.`),
        resetUrl ? buttonHtml({ url: resetUrl, label: 'Reset Password' }) : '',
        paragraphHtml('If you did not request a password reset, you can ignore this email.')
    ].filter(Boolean).join('');

    const html = htmlLayout({ appName, title, preheader, contentHtml });
    const text = `Hi ${name},\n\nWe received a request to reset your ${appName} password.${resetUrl ? `\n\nReset Password: ${resetUrl}` : ''}\n\nIf you did not request a password reset, you can ignore this email.\n`;

    return { subject: `${appName}: ${title}`, html, text };
}

module.exports = { render };
