const { htmlLayout, paragraphHtml, buttonHtml, escapeHtml, formatMoney } = require('./shared');

function render(data = {}, env = {}) {
    const appName = env.appName || 'LeadReal';
    const title = 'New property inquiry';
    const preheader = 'A customer is interested in a property.';

    const customerName = data.customerName || 'Customer';
    const customerPhone = data.customerPhone || '';
    const customerEmail = data.customerEmail || '';

    const propertyTitle = data.propertyTitle || 'Property';
    const listingType = data.listingType || '';
    const askingPrice = data.askingPrice !== undefined ? formatMoney(data.askingPrice, data.currency || 'INR') : '';
    const location = data.location || '';
    const propertyUrl = data.propertyUrl || '';

    const rows = [
        ['Customer', customerName],
        ['Phone', customerPhone],
        ['Email', customerEmail],
        ['Property', propertyTitle],
        ['Listing', listingType],
        ['Price', askingPrice],
        ['Location', location]
    ].filter(([, v]) => v);

    const detailsHtml = rows.length
        ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:14px 0 6px 0;border:1px solid #27272a;border-radius:14px;overflow:hidden;">
  ${rows.map(([k, v]) => `<tr><td style="padding:10px 12px;background:#0b0b0c;color:#a1a1aa;font-size:12px;font-weight:700;width:140px;">${escapeHtml(k)}</td><td style="padding:10px 12px;background:#0f0f10;color:#e4e4e7;font-size:13px;">${escapeHtml(v)}</td></tr>`).join('')}
</table>`
        : '';

    const contentHtml = [
        paragraphHtml('A new property inquiry was created.'),
        detailsHtml,
        propertyUrl ? buttonHtml({ url: propertyUrl, label: 'Open Property' }) : ''
    ].filter(Boolean).join('');

    const html = htmlLayout({ appName, title: `${appName}: ${title}`, preheader, contentHtml });
    const textLines = [
        `A new property inquiry was created.`,
        '',
        ...rows.map(([k, v]) => `${k}: ${v}`),
        propertyUrl ? `\nOpen Property: ${propertyUrl}` : ''
    ].filter(Boolean);

    return { subject: `${appName}: ${title}`, html, text: `${textLines.join('\n')}\n` };
}

module.exports = { render };
