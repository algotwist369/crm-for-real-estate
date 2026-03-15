const { htmlLayout, paragraphHtml, buttonHtml, escapeHtml, formatMoney } = require('./shared');

function render(data = {}, env = {}) {
    const appName = env.appName || 'LeadReal';
    const title = 'Payment received';
    const preheader = 'Your subscription payment was received.';

    const name = data.name || 'there';
    const planName = data.planName || 'Subscription';
    const amount = data.amount !== undefined ? formatMoney(data.amount, data.currency || 'INR') : '';
    const invoiceUrl = data.invoiceUrl || '';
    const period = data.period || '';

    const contentParts = [
        paragraphHtml(`Hi ${name},`),
        paragraphHtml(`We received your payment for ${planName}.`)
    ];

    if (amount) {
        contentParts.push(`<div style="margin:16px 0;padding:14px;border-radius:14px;border:1px solid #27272a;background:#0b0b0c;color:#fafafa;font-weight:800;text-align:center;">${escapeHtml(amount)}</div>`);
    }
    if (period) contentParts.push(paragraphHtml(`Billing period: ${period}`));
    if (invoiceUrl) contentParts.push(buttonHtml({ url: invoiceUrl, label: 'View Invoice' }));

    const html = htmlLayout({ appName, title: `${appName}: ${title}`, preheader, contentHtml: contentParts.join('') });
    const text = `Hi ${name},\n\nWe received your payment for ${planName}.${amount ? `\n\nAmount: ${amount}` : ''}${period ? `\n\nBilling period: ${period}` : ''}${invoiceUrl ? `\n\nInvoice: ${invoiceUrl}` : ''}\n`;

    return { subject: `${appName}: ${title}`, html, text };
}

module.exports = { render };
