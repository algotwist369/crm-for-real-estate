function render(data = {}, env = {}) {
    const appName = env.appName || 'LeadReal';
    const title = data.title || 'Notification';
    const preheader = data.preheader || 'You have a new notification.';
    const message = data.message || '';
    const actionUrl = data.actionUrl || '';
    const actionText = data.actionText || 'Open';

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 24px; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111827; }
  .container { max-width: 520px; margin: 0 auto; }
  .title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .text { font-size: 14px; margin-bottom: 20px; color: #374151; line-height: 1.6; }
  .action { margin-top: 20px; }
  .link { font-size: 14px; color: #2563eb; text-decoration: none; font-weight: 500; }
  .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <div class="container">
    <div class="title">${title}</div>
    ${message ? `<div class="text">${message}</div>` : ''}
    ${actionUrl ? `<div class="action"><a href="${actionUrl}" class="link">${actionText} →</a></div>` : ''}
    <div class="footer">© ${new Date().getFullYear()} ${appName}</div>
  </div>
</body>
</html>
    `.trim();

    const text = `${title}\n\n${message}${actionUrl ? `\n\n${actionText}: ${actionUrl}` : ''}\n`;

    return { subject: `${appName}: ${title}`, html, text };
}

module.exports = { render };
