function render(data = {}, env = {}) {
    const appName = env.appName || 'AlgoTwist';
    const title = 'Follow-up reminder';
    const preheader = 'You have a lead follow-up scheduled.';

    const leadName = data.leadName || 'Lead';
    const leadPhone = data.leadPhone || '';
    const requirement = data.requirement || '';
    const budget = data.budget || '';
    const priority = data.priority || '';
    const followUpDate = data.followUpDate 
        ? new Date(data.followUpDate).toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        }) 
        : '';
    const remarks = data.remarks || data.notes || '';
    const leadUrl = data.leadUrl || '';
    const actorName = data.actorName || '';
    
    const isImmediate = !!actorName;
    const textDesc = isImmediate 
        ? `${actorName} scheduled a follow-up for you.`
        : `A lead follow-up is due.`;

    const rows = [
        ['Lead', leadName],
        leadPhone && ['Phone', leadPhone],
        requirement && ['Requirement', requirement],
        budget && ['Budget', budget],
        priority && ['Priority', priority],
        followUpDate && ['Due Date', followUpDate],
        remarks && ['Latest Remarks', remarks]
    ].filter(Boolean);

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin: 0; padding: 24px; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111827; }
  .container { max-width: 520px; margin: 0 auto; }
  .title { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
  .text { font-size: 14px; margin-bottom: 20px; color: #374151; }
  .details { font-size: 14px; line-height: 1.6; }
  .details p { margin: 6px 0; }
  .label { color: #6b7280; }
  .value { font-weight: 500; color: #111827; }
  .action { margin-top: 20px; }
  .link { font-size: 14px; color: #2563eb; text-decoration: none; font-weight: 500; }
  .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <div class="container">
    <div class="title">Follow-up Reminder</div>
    <div class="text">${textDesc}</div>
    <div class="details">
      ${rows.map(([k, v]) => `<p><span class="label">${k}:</span> <span class="value">${v}</span></p>`).join('\n      ')}
    </div>
    ${leadUrl ? `<div class="action"><a href="${leadUrl}" class="link">View lead →</a></div>` : ''}
    <div class="footer">© ${new Date().getFullYear()} ${appName}</div>
  </div>
</body>
</html>
    `.trim();

    const textLines = [
        textDesc,
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
