const { htmlLayout, paragraphHtml, buttonHtml, escapeHtml } = require('./shared');

function render(data = {}, env = {}) {
    const appName = env.appName || 'AlgoTwist';
    const verifyUrl = data.verifyUrl || '';
    const code = data.code || '';
    const name = data.name || 'there';

    const title = 'Verify your email';
    const preheader = 'Confirm your email address to activate your account.';

    const contentParts = [
        paragraphHtml(`Hi ${name},`),
        paragraphHtml(`Please verify your email to finish setting up your ${appName} account.`)
    ];

    if (verifyUrl) contentParts.push(buttonHtml({ url: verifyUrl, label: 'Verify Email' }));
    if (code) {
        contentParts.push(`<div style="margin:16px 0;padding:14px;border-radius:14px;border:1px dashed #3f3f46;background:#0f172a;color:#e2e8f0;font-weight:800;letter-spacing:0.2em;text-align:center;">${escapeHtml(code)}</div>`);
    }

    contentParts.push(paragraphHtml('If you did not request this, you can ignore this email.'));

    const html = htmlLayout({ appName, title, preheader, contentHtml: contentParts.join('') });
    const text = `Hi ${name},\n\nPlease verify your email to finish setting up your ${appName} account.${verifyUrl ? `\n\nVerify: ${verifyUrl}` : ''}${code ? `\n\nCode: ${code}` : ''}\n\nIf you did not request this, you can ignore this email.\n`;

    return { subject: `${appName}: ${title}`, html, text };
}

module.exports = { render };
