export const lostItemReportedTemplate = (data: {
  reporterName: string;
  itemName: string;
  location: string;
  date: string;
  description: string;
}) => ({
  subject: `Lost Item Report Received — ${data.itemName}`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Lost Item Report</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

              <!-- TOP ACCENT BAR -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,#1d4ed8,#0891b2);"></td>
              </tr>

              <!-- HEADER -->
              <tr>
                <td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">NBSC SAS Lost &amp; Found</p>
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">Lost Item Report Received</h1>
                      </td>
                      <td align="right" valign="top">
                        <span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;border:1px solid #bfdbfe;">📋 REPORT</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:32px 40px;">

                  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hello, ${data.reporterName}</p>
                  <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
                    We have successfully received your lost item report. Our team will review the details and notify you as soon as a matching found item is identified.
                  </p>

                  <!-- DETAIL CARD -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Report Details</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;width:120px;">Item Name</td>
                            <td style="padding:12px 0;font-size:13px;color:#0f172a;font-weight:600;">${data.itemName}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Last Seen</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">📍 ${data.location}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Date Lost</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">📅 ${data.date}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Description</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">${data.description}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                            <td style="padding:12px 0;">
                              <span style="background:#fef9c3;color:#854d0e;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #fde68a;">⏳ Under Review</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- NOTE BOX -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:8px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
                          <strong>What happens next?</strong> The SAS office will review your report and cross-reference it with found items on campus. You will be contacted once a match is found.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#334155;">NBSC SAS Lost &amp; Found System</p>
                        <p style="margin:0;font-size:12px;color:#94a3b8;">Northern Bukidnon State College · Student Affairs Services</p>
                      </td>
                      <td align="right">
                        <p style="margin:0;font-size:11px;color:#cbd5e1;">Do not reply to this email</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});

export const itemClaimedTemplate = (data: {
  claimantName: string;
  itemName: string;
  location: string;
  claimDate: string;
  contactNumber: string;
}) => ({
  subject: `Item Successfully Received — ${data.itemName} Has Been Claimed`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Item Received Confirmation</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

              <!-- TOP ACCENT BAR -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,#059669,#0891b2);"></td>
              </tr>

              <!-- HEADER -->
              <tr>
                <td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">NBSC SAS Lost &amp; Found</p>
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">Your Item Has Been Received</h1>
                      </td>
                      <td align="right" valign="top">
                        <span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;border:1px solid #bbf7d0;">✓ RECEIVED</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:32px 40px;">

                  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hello, ${data.claimantName}</p>
                  <p style="margin:0 0 10px;font-size:14px;color:#64748b;line-height:1.7;">
                    This is an automated confirmation from the NBSC SAS Lost &amp; Found office. Our records indicate that the item listed below has been successfully claimed and received.
                  </p>
                  <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
                    <strong style="color:#0f172a;">Is this you?</strong> If you did receive this item, no further action is needed. If you did <strong>not</strong> receive this item or believe this is an error, please contact the SAS office immediately.
                  </p>

                  <!-- DETAIL CARD -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Claim Record</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;width:130px;">Item</td>
                            <td style="padding:12px 0;font-size:13px;color:#0f172a;font-weight:600;">${data.itemName}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Found At</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">📍 ${data.location}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Date Claimed</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">📅 ${data.claimDate}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                            <td style="padding:12px 0;">
                              <span style="background:#f0fdf4;color:#166534;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0;">✓ Successfully Received</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- NOT YOU BOX -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin-bottom:20px;">
                    <tr>
                      <td style="padding:18px 24px;">
                        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#c2410c;">⚠️ Not you?</p>
                        <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.7;">
                          If you did <strong>not</strong> claim this item or did not authorize this transaction, please contact the SAS office immediately at your earliest convenience so we can investigate.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- INFO NOTE -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
                    <tr>
                      <td style="padding:14px 20px;">
                        <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
                          This email is an automated notification from the NBSC SAS Lost &amp; Found system. <strong>Please do not reply to this email.</strong> For inquiries, visit the SAS office directly during office hours: <strong>Monday – Friday, 8:00 AM – 5:00 PM</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#334155;">NBSC SAS Lost &amp; Found System</p>
                        <p style="margin:0;font-size:12px;color:#94a3b8;">Northern Bukidnon State College · Student Affairs Services</p>
                      </td>
                      <td align="right">
                        <p style="margin:0;font-size:11px;color:#cbd5e1;">Do not reply to this email</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
});