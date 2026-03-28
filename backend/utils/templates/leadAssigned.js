const { htmlLayout, paragraphHtml, buttonHtml, escapeHtml } = require('./shared');

function render(data = {}, env = {}) {
    const appName = env.appName || 'LeadReal';
    const title = 'New lead assigned';
    const preheader = 'A new lead has been assigned to you.';

    const leadName = data.leadName || 'New Lead';
    const leadPhone = data.leadPhone || '';
    const leadEmail = data.leadEmail || '';
    const requirement = data.requirement || '';
    const budget = data.budget || '';
    const source = data.source || '';
    const assignedBy = data.assignedBy || '';
    const leadUrl = data.leadUrl || '';

    const rows = [
        ['Lead', leadName],
        ['Phone', leadPhone],
        ['Email', leadEmail],
        ['Requirement', requirement],
        ['Budget', budget],
        ['Source', source],
        ['Assigned by', assignedBy]
    ].filter(([, v]) => v);

    const detailsHtml = rows.length
        ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:14px 0 6px 0;border:1px solid #27272a;border-radius:14px;overflow:hidden;">
        ${rows.map(([k, v]) => `<tr><td style="padding:10px 12px;background:#0b0b0c;color:#a1a1aa;font-size:12px;font-weight:700;width:140px;">${escapeHtml(k)}</td><td style="padding:10px 12px;background:#0f0f10;color:#e4e4e7;font-size:13px;">${escapeHtml(v)}</td></tr>`).join('')}
        </table>`
        : '';

    const contentHtml = [
        paragraphHtml('A new lead was assigned to you.'),
        detailsHtml,
        leadUrl ? buttonHtml({ url: leadUrl, label: 'Open Lead' }) : ''
    ].filter(Boolean).join('');

    const html = htmlLayout({ appName, title: `${appName}: ${title}`, preheader, contentHtml });
    const textLines = [
        `A new lead was assigned to you.`,
        '',
        ...rows.map(([k, v]) => `${k}: ${v}`),
        leadUrl ? `\nOpen Lead: ${leadUrl}` : ''
    ].filter(Boolean);

    return { subject: `${appName}: ${title}`, html, text: `${textLines.join('\n')}\n` };
}

module.exports = { render };
