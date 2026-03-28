function render(data = {}, env = {}) {
    const propertyTitle = data.property_title || 'New Property';
    const listingType = data.listing_type || 'Listing';
    const askingPrice = data.asking_price || 'Price on Request';
    const addedBy = data.added_by || 'A team member';
    const actionUrl = data.actionUrl || env.appUrl || '#';
    const actionText = data.actionText || 'View Property Details';

    const subject = `New ${listingType} Added: ${propertyTitle}`;

    const text = `
Hello,

A new property has been added to your inventory by ${addedBy}.

Title: ${propertyTitle}
Type: ${listingType}
Price: ${askingPrice}

Click the link below to view the property:
${actionUrl}

Thank you.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #f5f5f7;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #1f2937;
  }

  .wrapper {
    max-width: 560px;
    margin: 40px auto;
    background: #ffffff;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }

  .header {
    padding: 20px 28px;
    border-bottom: 1px solid #f1f5f9;
    font-weight: 600;
    font-size: 16px;
  }

  .content {
    padding: 28px;
    font-size: 15px;
    line-height: 1.6;
  }

  .details {
    margin: 20px 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }

  .row {
    display: flex;
    justify-content: space-between;
    padding: 12px 16px;
    font-size: 14px;
  }

  .row:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }

  .label {
    color: #6b7280;
  }

  .value {
    font-weight: 500;
    color: #111827;
  }

  .button-wrap {
    text-align: left;
    margin-top: 24px;
  }

  .button {
    display: inline-block;
    padding: 10px 18px;
    background-color: #111827;
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
  }

  .footer {
    padding: 20px 28px;
    font-size: 12px;
    color: #9ca3af;
    border-top: 1px solid #f1f5f9;
  }
</style>
</head>

<body>
  <div class="wrapper">

    <div class="header">
      New Property Added
    </div>

    <div class="content">
      <p>Hello,</p>

      <p>
        <strong>${addedBy}</strong> has added a new property to the system.
      </p>

      <div class="details">
        <div class="row">
          <span class="label">Title</span>
          <span class="value">${propertyTitle}</span>
        </div>
        <div class="row">
          <span class="label">Listing Type</span>
          <span class="value" style="text-transform: capitalize;">${listingType}</span>
        </div>
        <div class="row">
          <span class="label">Price</span>
          <span class="value">${askingPrice}</span>
        </div>
      </div>

      <div class="button-wrap">
        <a href="${actionUrl}" class="button">${actionText}</a>
      </div>

      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        Please review the listing for complete details.
      </p>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} ${env.appName || 'Grand Gate Properties'}  
      <br/>
      This is an automated notification.
    </div>

  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
}

module.exports = { render };
