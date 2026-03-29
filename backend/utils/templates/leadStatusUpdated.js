function render(data = {}, env = {}) {
    const appName = env.appName || 'AlgoTwist';
    const title = 'Lead status updated';
    const preheader = `Status of lead ${data.leadName || 'Member'} has changed.`;

    const {
        leadName = 'Lead',
        oldStatus = '',
        newStatus = '',
        updatedBy = 'A team member',
        leadUrl = '',
        requirement = '',
        budget = '',
        phone = '',
        email = ''
    } = data;

    const rows = [
        ['Lead Name ', leadName],
        ['Previous Status ', oldStatus || 'N/A'],
        ['New Status ', newStatus || 'N/A'],
        ['Updated By ', updatedBy],
        phone && ['Phone ', phone],
        email && ['Email ', email],
        requirement && ['Requirement ', requirement],
        budget && ['Budget ', budget],
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
    background: #f9fafb;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #111827;
  }
  .container {
    max-width: 520px;
    margin: 0 auto;
    background: #ffffff;
    padding: 32px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }
  .header {
    margin-bottom: 24px;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 16px;
  }
  .title {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
  }
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    background: #f3f4f6;
    color: #374151;
  }
  .status-new { color: #854d0e; background: #fefce8; }
  .status-converted { color: #065f46; background: #ecfdf5; }
  .status-lost { color: #991b1b; background: #fef2f2; }
  .status-follow_up { color: #9a3412; background: #fff7ed; }
  
  .details {
    margin: 24px 0;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f9fafb;
  }
  .label {
    color: #6b7280;
    font-size: 13px;
    font-weight: 500;
  }
  .value {
    color: #111827;
    font-size: 13px;
    font-weight: 600;
  }
  .action {
    margin-top: 32px;
    text-align: center;
  }
  .button {
    background-color: #111827;
    color: #ffffff;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    display: inline-block;
  }
  .footer {
    margin-top: 40px;
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
  }
</style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;"> ${preheader}</div>
  <div class="container">
    <div class="header">
      <div class="title">Lead Status Updated</div>
    </div>

    <p style="font-size: 14px; line-height: 1.5; color: #374151;">
      A lead status was updated by <strong> ${updatedBy}</strong>. Here are the latest details:
    </p>

    <div class="details">
      ${rows.map(([k, v]) => `
        <div class="detail-row">
          <span class="label" >${k}</span>
          <span class="value"> ${v}</span>
        </div>
      `).join('')}
    </div>

    ${leadUrl ? `
    <div class="action">
      <a href="${leadUrl}" class="button">View Lead Details</a>
    </div>` : ''}

    <div class="footer">
      This is an automated notification from ${appName}.<br>
      © ${new Date().getFullYear()} ${appName}
    </div>
  </div>
</body>
</html>
    `.trim();

    return {
        subject: `${appName}: Status Updated for ${leadName} (${newStatus.toUpperCase()})`,
        html,
        text: `Lead status updated for ${leadName} by ${updatedBy}.\n\n` +
              rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
              (leadUrl ? `\n\nView Details: ${leadUrl}` : '')
    };
}

module.exports = { render };
