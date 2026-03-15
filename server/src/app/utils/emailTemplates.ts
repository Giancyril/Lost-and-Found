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
  subject: `Claim Approved — ${data.itemName} is Ready for Pickup`,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Claim Approved</title>
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
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">Your Claim Has Been Approved</h1>
                      </td>
                      <td align="right" valign="top">
                        <span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;border:1px solid #bbf7d0;">✓ APPROVED</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:32px 40px;">

                  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hello, ${data.claimantName}</p>
                  <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
                    Your claim has been verified and approved by the SAS office. Your item is now ready for pickup. Please visit the SAS office with your valid school ID to retrieve your belonging.
                  </p>

                  <!-- DETAIL CARD -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Claim Details</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;width:130px;">Item Name</td>
                            <td style="padding:12px 0;font-size:13px;color:#0f172a;font-weight:600;">${data.itemName}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Found At</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">📍 ${data.location}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Claim Date</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">📅 ${data.claimDate}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Contact #</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">${data.contactNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                            <td style="padding:12px 0;">
                              <span style="background:#f0fdf4;color:#166534;font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid #bbf7d0;">✓ Approved</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- PICKUP BOX -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:20px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#166534;">📍 Pickup Instructions</p>
                        <p style="margin:0;font-size:13px;color:#15803d;line-height:1.7;">
                          Please proceed to the <strong>SAS Office</strong> during office hours and present your <strong>valid school ID</strong>.
                          Our staff will verify your identity and release the item to you.<br/><br/>
                          Office Hours: <strong>Monday – Friday, 8:00 AM – 5:00 PM</strong>
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- WARNING NOTE -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
                    <tr>
                      <td style="padding:14px 20px;">
                        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                          ⚠️ <strong>Important:</strong> Please claim your item within <strong>7 days</strong>. Items not claimed within the allotted time may be turned over to the school administration.
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