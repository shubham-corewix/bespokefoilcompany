// Renders the BFC branded order confirmation email (HTML + plain text)
// from the shared merge shape used by Stripe and Shopify webhooks.

const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const gbp = (amount) => '\u00A3' + Number(amount).toFixed(2);

const gbpPlain = (amount) => '£' + Number(amount).toFixed(2);

function itemMetaLine(item) {
  return `Qty ${item.qty} \u00B7 ${gbp(item.unit_price)} each`;
}

function discountRow(data) {
  if (!data.discount_amount || Number(data.discount_amount) <= 0) return '';
  const label = data.discount_label || data.discount_code || 'Discount';
  return `
                <tr>
                  <td style="padding:8px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#5A5650;">Discount (${esc(label)})</td>
                  <td align="right" style="padding:8px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#5A5650;">&minus;${gbp(data.discount_amount)}</td>
                </tr>`;
}

function postageRow(data) {
  if (data.postage == null || Number(data.postage) <= 0) return '';
  return `
                <tr>
                  <td style="padding:8px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#5A5650;">Postage</td>
                  <td align="right" style="padding:8px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#5A5650;">${gbp(data.postage)}</td>
                </tr>`;
}

function itemRows(items) {
  return items.map((item) => `
                <tr>
                  <td style="padding:14px 0; border-bottom:1px solid #F6F6F4; font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-size:15px; color:#000000;">${esc(item.name)}</div>
                    <div style="font-size:13px; color:#5A5650; padding-top:3px;">${esc(itemMetaLine(item))}</div>
                  </td>
                  <td align="right" valign="top" style="padding:14px 0; border-bottom:1px solid #F6F6F4; font-family:Arial,Helvetica,sans-serif; font-size:15px; color:#000000;">
                    ${gbp(item.line_total)}
                  </td>
                </tr>`).join('');
}


function personalisationBlock(data) {
  const rows = data.personalisation;
  if (!rows || !rows.length) return '';
  const items = rows.map(([k, v]) => `
                  <tr>
                    <td style="padding:4px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#5A5650;">${esc(k)}</td>
                    <td align="right" style="padding:4px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; color:#000000;">${esc(v)}</td>
                  </tr>`).join('');
  return `
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F6F4; border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-family:Georgia,serif; font-size:15px; color:#000000; padding-bottom:8px;">Your personalisation</div>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
                    <div style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#5A5650; padding-top:10px;">
                      We have these on file - no need to add them again in the upload portal.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function renderOrderEmailHtml(data) {
  const supportEmail = data.support_email || 'hello@thebespokefoilcompany.co.uk';
  const websiteUrl = data.website_url || 'thebespokefoilcompany.co.uk';
  const customerName = data.customer_name || 'there';
  const preheader = data.preheader || `Order ${data.order_ref} confirmed. Here's everything you bought.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Bespoke Foil Company order</title>
</head>
<body style="margin:0; padding:0; background-color:#DDD6CE; -webkit-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#DDD6CE;">
    ${esc(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#DDD6CE;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#FFFFFF; border-radius:14px; overflow:hidden;">
          <tr>
            <td style="background-color:#000000; padding:34px 40px; border-radius:14px 14px 0 0;" align="left">
              <img src="https://static.wixstatic.com/media/cc6e5a_697f7be2cb68465bba490ce44862d4bf~mv2.png" width="280" alt="The Bespoke Foil Company - Makers of Memory Catchers" style="display:block; border:0;">
            </td>
          </tr>
          <tr>
            <td style="padding:44px 40px 8px 40px;">
              <div style="font-family:Georgia,'Times New Roman',serif; font-size:30px; line-height:36px; color:#000000;">
                Thank you, your order is confirmed
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#5A5650; padding-top:14px;">
                Hi ${esc(customerName)}, we've received your order and it's now with our studio. Everything you bought is listed below. You'll get a separate email with tracking once it's on its way.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #DDD6CE; border-bottom:1px solid #DDD6CE;">
                <tr>
                  <td style="padding:18px 0; font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#BEAD9D;">Order</div>
                    <div style="font-size:15px; color:#000000; padding-top:4px;">#${esc(data.order_ref)}</div>
                  </td>
                  <td style="padding:18px 0; font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#BEAD9D;">Date</div>
                    <div style="font-size:15px; color:#000000; padding-top:4px;">${esc(data.date_paid)}</div>
                  </td>
                  <td style="padding:18px 0; font-family:Arial,Helvetica,sans-serif;">
                    <div style="font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:#BEAD9D;">Paid with</div>
                    <div style="font-size:15px; color:#000000; padding-top:4px;">${esc(data.payment_method)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#000000; padding-bottom:12px;">
                Your items
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${itemRows(data.items || [])}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#5A5650;">Subtotal</td>
                  <td align="right" style="padding:10px 0 0 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#5A5650;">${gbp(data.subtotal)}</td>
                </tr>
${discountRow(data)}${postageRow(data)}
                <tr>
                  <td style="padding:16px 0 0 0; border-top:2px solid #000000; font-family:Georgia,serif; font-size:18px; color:#000000;">Total paid</td>
                  <td align="right" style="padding:16px 0 0 0; border-top:2px solid #000000; font-family:Georgia,serif; font-size:18px; color:#000000;">${gbp(data.total)}</td>
                </tr>
              </table>
            </td>
          </tr>
${personalisationBlock(data)}
          <tr>
            <td style="padding:36px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F6F4; border-radius:12px; overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px; font-family:Arial,Helvetica,sans-serif; border-radius:12px;">
                    <div style="font-size:14px; line-height:22px; color:#000000;">
                      Every kit is handmade in our UK studio using our Foil Fusion Technology&reg;, so your keepsake stays crisp and bright for a lifetime. 100% plastic-free packaging, and &pound;1 from every kit goes to Tommy's.
                    </div>
                    <div style="font-size:13px; line-height:20px; color:#5A5650; padding-top:12px;">
                      Tommy's - the UK's leading charity funding pregnancy and baby loss research.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 44px 40px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:22px; color:#5A5650;">
              Any questions about your order, just reply to this email or contact us at
              <a href="mailto:${esc(supportEmail)}" style="color:#000000;">${esc(supportEmail)}</a>.
            </td>
          </tr>
          <tr>
            <td style="background-color:#000000; padding:28px 40px; font-family:Arial,Helvetica,sans-serif; border-radius:0 0 14px 14px;">
              <div style="font-size:12px; letter-spacing:1px; color:#BEAD9D; text-transform:uppercase;">The Bespoke Foil Company</div>
              <div style="font-size:12px; line-height:20px; color:#DDD6CE; padding-top:8px;">
                ${esc(websiteUrl)}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderOrderEmailText(data) {
  const lines = [
    'Thank you, your order is confirmed',
    '',
    `Hi ${data.customer_name || 'there'},`,
    "We've received your order and it's now with our studio.",
    '',
    `Order: #${data.order_ref}`,
    `Date: ${data.date_paid}`,
    `Paid with: ${data.payment_method}`,
    '',
    'Your items:'
  ];

  for (const item of data.items || []) {
    lines.push(`- ${item.name} (${itemMetaLine(item).replace('\u00A3', '£')}) = ${gbpPlain(item.line_total)}`);
  }

  lines.push('');
  lines.push(`Subtotal: ${gbpPlain(data.subtotal)}`);
  if (data.discount_amount && Number(data.discount_amount) > 0) {
    const label = data.discount_label || data.discount_code || 'Discount';
    lines.push(`Discount (${label}): -${gbpPlain(data.discount_amount)}`);
  }
  if (data.postage != null && Number(data.postage) > 0) {
    lines.push(`Postage: ${gbpPlain(data.postage)}`);
  }
  lines.push(`Total paid: ${gbpPlain(data.total)}`);
  lines.push('');

  if (data.personalisation && data.personalisation.length) {
    lines.push('Your personalisation:');
    for (const [k, v] of data.personalisation) lines.push(`- ${k}: ${v}`);
    lines.push('We have these on file - no need to add them again in the upload portal.');
    lines.push('');
  }
  lines.push(`Questions? ${data.support_email || 'hello@thebespokefoilcompany.co.uk'}`);
  lines.push('');
  lines.push('The Bespoke Foil Company');

  return lines.join('\n');
}

module.exports = {
  renderOrderEmailHtml,
  renderOrderEmailText
};
