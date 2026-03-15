const { htmlLayout, paragraphHtml, buttonHtml, escapeHtml, formatDate } = require('./shared');

function render(data = {}, env = {}) {
    const appName = env.appName || 'LeadReal';
    const title = 'Follow-up reminder';
    const preheader = 'You have a lead follow-up scheduled.';

    const leadName = data.leadName || 'Lead';
    const followUpDate = formatDate(data.followUpDate) || '';
    const notes = data.notes || data.remarks || '';
    const leadUrl = data.leadUrl || '';

    const contentParts = [
        paragraphHtml(`Follow-up reminder for ${leadName}.`)
    ];

    if (followUpDate) {
        contentParts.push(`<div style="margin:16px 0;padding:14px;border-radius:14px;border:1px solid #27272a;background:#0f172a;color:#e2e8f0;font-weight:800;text-align:center;">${escapeHtml(followUpDate)}</div>`);
    }

    if (notes) contentParts.push(paragraphHtml(notes));
    if (leadUrl) contentParts.push(buttonHtml({ url: leadUrl, label: 'Open Lead' }));

    const html = htmlLayout({ appName, title: `${appName}: ${title}`, preheader, contentHtml: contentParts.join('') });
    const text = `Follow-up reminder for ${leadName}.${followUpDate ? `\n\nDate: ${followUpDate}` : ''}${notes ? `\n\nNotes: ${notes}` : ''}${leadUrl ? `\n\nOpen Lead: ${leadUrl}` : ''}\n`;

    return { subject: `${appName}: ${title}`, html, text };
}

module.exports = { render };
