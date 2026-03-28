function render(data = {}, env = {}) {
    const appName = env.appName || 'LeadReal';
    const title = 'New lead assigned';
    const preheader = 'You have a new lead.';

    const {
        leadName = 'New Lead',
        leadPhone = '',
        leadEmail = '',
        requirement = '',
        budget = '',
        source = '',
        assignedBy = '',
        leadUrl = ''
    } = data;

    const rows = [
        ['Lead', leadName],
        leadPhone && ['Phone', leadPhone],
        leadEmail && ['Email', leadEmail],
        requirement && ['Requirement', requirement],
        budget && ['Budget', budget],
        source && ['Source', source],
        assignedBy && ['Assigned by', assignedBy],
    ].filter(Boolean);

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 24px;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #111827;
  }

  .container {
    max-width: 520px;
    margin: 0 auto;
  }

  .title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .text {
    font-size: 14px;
    margin-bottom: 20px;
    color: #374151;
  }

  .details {
    font-size: 14px;
    line-height: 1.6;
  }

  .details p {
    margin: 6px 0;
  }

  .label {
    color: #6b7280;
  }

  .value {
    font-weight: 500;
    color: #111827;
  }

  .action {
    margin-top: 20px;
  }

  .link {
    font-size: 14px;
    color: #2563eb;
    text-decoration: none;
  }

  .footer {
    margin-top: 32px;
    font-size: 12px;
    color: #9ca3af;
  }
</style>
</head>

<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <div class="container">

    <div class="title">New Lead Assigned</div>

    <div class="text">
      A new lead has been assigned to you.
    </div>

    <div class="details">
      ${rows.map(([k, v]) => `<p><span class="label">${k}:</span> <span class="value">${v}</span></p>`).join('\n      ')}
    </div>

    ${leadUrl ? `
    <div class="action">
      <a href="${leadUrl}" class="link">View lead →</a>
    </div>` : ''}

    <div class="footer">
      © ${new Date().getFullYear()} ${appName}
    </div>

  </div>
</body>
</html>
    `.trim();

    const textLines = [
        `A new lead has been assigned to you.`,
        '',
        ...rows.map(([k, v]) => `${k}: ${v}`),
        leadUrl ? `\nView lead: ${leadUrl}` : ''
    ].filter(Boolean);

    return {
        subject: `${appName}: ${title}`,
        html,
        text: `${textLines.join('\n')}\n`
    };
}

module.exports = { render };