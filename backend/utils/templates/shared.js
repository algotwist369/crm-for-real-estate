function escapeHtml(value) {
    const str = value === undefined || value === null ? '' : String(value);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatMoney(amount, currency = 'INR') {
    const n = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(n)) return '';
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
    } catch {
        return `${currency} ${n.toFixed(2)}`;
    }
}

function htmlLayout({ appName, title, preheader, contentHtml, footerHtml }) {
    const safeAppName = escapeHtml(appName);
    const safeTitle = escapeHtml(title);
    const safePreheader = escapeHtml(preheader || '');
    const footer = footerHtml || `<p style="margin:0;color:#71717a;font-size:12px;line-height:18px;">© ${new Date().getFullYear()} ${safeAppName}</p>`;
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;color:#e4e4e7;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#0a0a0a;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="640" style="max-width:640px;background:#111113;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:22px 22px 0 22px;">
                <div style="font-weight:800;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#a1a1aa;">${safeAppName}</div>
                <h1 style="margin:10px 0 0 0;font-size:22px;line-height:30px;color:#fafafa;">${safeTitle}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 22px 22px 22px;">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 22px;border-top:1px solid #27272a;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buttonHtml({ url, label }) {
    const safeUrl = escapeHtml(url);
    const safeLabel = escapeHtml(label);
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 6px 0;">
  <tr>
    <td>
      <a href="${safeUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:12px;">${safeLabel}</a>
    </td>
  </tr>
</table>`;
}

function paragraphHtml(text) {
    const safe = escapeHtml(text);
    return `<p style="margin:0 0 12px 0;color:#d4d4d8;font-size:14px;line-height:22px;">${safe}</p>`;
}

module.exports = {
    escapeHtml,
    formatDate,
    formatMoney,
    htmlLayout,
    buttonHtml,
    paragraphHtml
};
