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
  <div class="container">

    <div class="title">New Property Added</div>

    <div class="text">
      ${addedBy} has added a new property to the system.
    </div>

    <div class="details">
      <p><span class="label">Title:</span> <span class="value">${propertyTitle}</span></p>
      <p><span class="label">Listing Type:</span> <span class="value" style="text-transform: capitalize;">${listingType}</span></p>
      <p><span class="label">Price:</span> <span class="value">${askingPrice}</span></p>
    </div>

    <div class="action">
      <a href="${actionUrl}" class="link">${actionText}</a>
    </div>

    <div class="footer">
      © ${new Date().getFullYear()} ${env.appName || 'Grand Gate Properties'}
    </div>

  </div>
</body>
</html>
    `.trim();

    return { subject, text, html };
}

module.exports = { render };
