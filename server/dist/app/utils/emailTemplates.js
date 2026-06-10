"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sheetsReconciliationAlertTemplate = exports.weeklyDeletionReportTemplate = exports.claimSubmittedTemplate = exports.reminderEmailTemplate = exports.smartMatchNotificationTemplate = exports.itemClaimedTemplate = exports.foundItemReportedTemplate = exports.lostItemReportedTemplate = void 0;
const lostItemReportedTemplate = (data) => ({
    subject: `Lost Item Report Submitted — ${data.itemName}`,
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
                        <span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #bfdbfe;white-space:nowrap;"> REPORT</span>
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
                    We have successfully received your lost item report. Our team will review the details and notify you as soon as a potential match is found or if someone turns in your item.
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
                            <td style="padding:12px 0;font-size:13px;color:#334155;"> ${data.location}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Date Lost</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;"> ${data.date}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Description</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">${data.description}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                            <td style="padding:12px 0;">
                              <span style="background:#fef9c3;color:#854d0e;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #fde68a;display:inline-block;white-space:nowrap;">⏳ Under Review</span>
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
                          <strong>What happens next?</strong> The SAS office will review your report and monitor incoming found items for potential matches. You can also track the status in real-time on our website.
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
exports.lostItemReportedTemplate = lostItemReportedTemplate;
const foundItemReportedTemplate = (data) => ({
    subject: `Found Item Report Submitted — ${data.itemName}`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Found Item Report</title>
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
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">Found Item Report Received</h1>
                      </td>
                      <td align="right" valign="top">
                        <span style="display:inline-block;background:#f0fdf4;color:#059669;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #bbf7d0;white-space:nowrap;"> REPORT</span>
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
                    We have successfully received your found item report. Thank you for your honesty and contribution to our campus community. Our team will review the details and notify you once the owner has been contacted or if further information is needed.
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
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Found At</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;"> ${data.location}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Date Found</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;"> ${data.date}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Description</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;">${data.description}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                            <td style="padding:12px 0;">
                              <span style="background:#f0fdf4;color:#166534;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #bbf7d0;display:inline-block;white-space:nowrap;">⏳ Under Review</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- NOTE BOX -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;margin-bottom:8px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
                          <strong>What happens next?</strong> The SAS office will coordinate with the potential owner. If the item remains unclaimed after a certain period, it will be handled according to campus policy.
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
exports.foundItemReportedTemplate = foundItemReportedTemplate;
const itemClaimedTemplate = (data) => ({
    subject: `Item Successfully Claimed — ${data.itemName}`,
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
                        <span style="display:inline-block;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #bbf7d0;white-space:nowrap;">✓ RECEIVED</span>
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
                            <td style="padding:12px 0;font-size:13px;color:#334155;"> ${data.location}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Date Claimed</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;"> ${data.claimDate}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Status</td>
                            <td style="padding:12px 0;">
                              <span style="background:#f0fdf4;color:#166534;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #bbf7d0;display:inline-block;white-space:nowrap;">✓ Successfully Received</span>
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
exports.itemClaimedTemplate = itemClaimedTemplate;
const smartMatchNotificationTemplate = (data) => ({
    subject: `Potential Match Found (${data.matchPercentage}% Match) — ${data.itemName}`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Potential Item Match</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

              <!-- TOP ACCENT BAR -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,#6366f1,#a855f7);"></td>
              </tr>

              <!-- HEADER -->
              <tr>
                <td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">NBSC SAS Lost &amp; Found</p>
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">Potential Item Match Found!</h1>
                      </td>
                      <td align="right" valign="top">
                        <span style="display:inline-block;background:#f5f3ff;color:#7c3aed;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #ddd6fe;white-space:nowrap;"> SMART MATCH</span>
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
                    Our automated system has detected a potential match for the item you reported lost. An item with similar characteristics has been found in your vicinity.
                  </p>

                  <!-- MATCH CARD -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                        <p style="margin:0;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Matching Found Item</p>
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
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Found At</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;"> ${data.location}</td>
                          </tr>
                          <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Date Found</td>
                            <td style="padding:12px 0;font-size:13px;color:#334155;"> ${data.date}</td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Match Conf.</td>
                            <td style="padding:12px 0;">
                              <span style="background:#f0fdf4;color:#166534;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #bbf7d0;display:inline-block;white-space:nowrap;">🎯 ${data.matchPercentage}% Match</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- ACTION BOX -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;margin-bottom:8px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:13px;color:#5b21b6;line-height:1.6;">
                          <strong>Is this your item?</strong> Please visit the SAS office at your earliest convenience to verify and claim your item. Bring your school ID for identification.
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
exports.smartMatchNotificationTemplate = smartMatchNotificationTemplate;
const reminderEmailTemplate = (data) => ({
    subject: `Friendly Reminder: Have you lost anything at school recently?`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Lost & Found Reminder</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

              <!-- TOP ACCENT BAR -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,#2563eb,#3b82f6);"></td>
              </tr>

              <!-- HEADER -->
              <tr>
                <td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">NBSC SAS Lost &amp; Found</p>
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">A Quick Reminder!</h1>
                      </td>
                      <td align="right" valign="top">
                        <span style="display:inline-block;background:#eff6ff;color:#3b82f6;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #bfdbfe;white-space:nowrap;"> NOTIFICATION</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:32px 40px;">

                  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hello, ${data.recipientName}</p>
                  <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
                    This is a quick reminder from the NBSC SAS Office. We have several unclaimed items in our Lost & Found inventory. 
                    If you've misplaced your IDs, notebooks, umbrellas, or any personal belongings on campus, please check our system to see if your item has been found.
                  </p>

                  <!-- ACTION BOX -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:8px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
                          <strong>Check the Dashboard!</strong> Log in to your Student Dashboard to view all recently found items. You might just find what you're looking for!
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
exports.reminderEmailTemplate = reminderEmailTemplate;
const claimSubmittedTemplate = (data) => ({
    subject: `Claim Submitted Successfully! (Tracking ID: ${data.trackingId})`,
    html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Claim Submitted</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

              <!-- TOP ACCENT BAR -->
              <tr>
                <td style="height:4px;background:linear-gradient(90deg,#0ea5e9,#0284c7);"></td>
              </tr>

              <!-- HEADER -->
              <tr>
                <td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">NBSC SAS Lost &amp; Found</p>
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">Claim Submitted!</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- BODY -->
              <tr>
                <td style="padding:32px 40px;">
                  <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hello, ${data.claimantName || "Student"}</p>
                  <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
                    Your claim has been successfully submitted to the SAS Office. Our administrators will review it shortly. 
                    You can track the status of your claim at any time using your unique Tracking ID.
                  </p>

                  <div style="background:#f0f9ff;border:1px dashed #bae6fd;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:12px;color:#0284c7;text-transform:uppercase;font-weight:700;letter-spacing:1px;">Your Tracking ID</p>
                    <p style="margin:0;font-size:20px;font-family:monospace;font-weight:bold;color:#0369a1;">${data.trackingId}</p>
                  </div>

                  <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">
                    Please keep this email for your records. If you are a registered user, this claim has already been added to your Dashboard.
                  </p>
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#334155;">NBSC SAS Lost &amp; Found System</p>
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
exports.claimSubmittedTemplate = claimSubmittedTemplate;
const weeklyDeletionReportTemplate = (data) => {
    const itemsHtml = data.pendingItems
        .map((item) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;width:100px;">${item.type}</td>
        <td style="padding:12px 16px;font-size:13px;color:#0f172a;line-height:1.5;">${item.name}</td>
        <td style="padding:12px 16px;font-size:12px;font-weight:700;color:#dc2626;text-align:right;white-space:nowrap;">${item.daysRemaining} days left</td>
      </tr>`)
        .join("");
    return {
        subject: `[Lost & Found] Weekly Deletion Report — ${data.pendingItems.length} Items Pending Purge`,
        html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Weekly Retention Report</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">

                <!-- TOP ACCENT BAR -->
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#dc2626,#f97316);"></td>
                </tr>

                <!-- HEADER -->
                <tr>
                  <td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">NBSC SAS Lost &amp; Found</p>
                          <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">Retention Deletion Report</h1>
                        </td>
                        <td align="right" valign="top">
                          <span style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid #fecaca;white-space:nowrap;">🛑 PENDING PURGE</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="padding:32px 40px;">
                    <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0f172a;">Hello, Administrator</p>
                    <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.7;">
                      The following soft-deleted items are scheduled for permanent deletion within the next 7 days. This is an automated weekly compliance report sent every Monday.
                    </p>

                    <!-- PENDING ITEMS CARD -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;overflow:hidden;width:100%;">
                      <thead>
                        <tr style="background:#f1f5f9;border-bottom:1px solid #e2e8f0;">
                          <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;width:100px;">Type</th>
                          <th style="padding:10px 16px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Item / Claim Description</th>
                          <th style="padding:10px 16px;text-align:right;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;white-space:nowrap;">Grace Period</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- NOTE BOX -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;margin-bottom:20px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0;font-size:13px;color:#c2410c;line-height:1.6;">
                            <strong>Restoration Action Required?</strong> To restore any of these items and prevent their permanent deletion, please log in to the admin dashboard, navigate to <strong>Security & Compliance</strong>, and check the <strong>Retention Policy</strong> tab.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:14px;color:#64748b;line-height:1.7;">
                      A full CSV report containing the unique item identifiers is attached to this email for audit compliance.
                    </p>
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
    `
    };
};
exports.weeklyDeletionReportTemplate = weeklyDeletionReportTemplate;
const sheetsReconciliationAlertTemplate = (data) => {
    const { discrepanciesCount, lostItemsCount, foundItemsCount, totalChecked, items } = data;
    const itemRows = items
        .map((item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #1e293b;">
            <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;
              background:${item.type === "LOST" ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.15)"};
              color:${item.type === "LOST" ? "#f87171" : "#4ade80"};">
              ${item.type}
            </span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#e2e8f0;font-size:13px;">${item.itemName}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:12px;">${item.reporterName}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#94a3b8;font-size:12px;">${item.location}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #1e293b;color:#64748b;font-size:11px;">${new Date(item.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
        </tr>`)
        .join("");
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
      <title>Sheets Reconciliation Alert</title>
    </head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width:620px;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">

              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#7f1d1d 0%,#991b1b 50%,#b91c1c 100%);padding:32px 36px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;color:#fca5a5;text-transform:uppercase;">⚠ Integrity Alert</p>
                        <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">Google Sheets Reconciliation Alert</h1>
                        <p style="margin:8px 0 0;font-size:13px;color:#fecaca;opacity:0.9;">${discrepanciesCount} item${discrepanciesCount !== 1 ? "s" : ""} missing from your Google Sheets audit trail</p>
                      </td>
                      <td align="right" style="vertical-align:top;">
                        <div style="width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:26px;text-align:center;line-height:52px;">⚠️</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Summary Stats -->
              <tr>
                <td style="padding:28px 36px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #334155;">
                    <tr>
                      <td align="center" style="padding:18px 12px;background:#0f172a;border-right:1px solid #334155;">
                        <p style="margin:0;font-size:24px;font-weight:800;color:#f87171;">${discrepanciesCount}</p>
                        <p style="margin:4px 0 0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Missing</p>
                      </td>
                      <td align="center" style="padding:18px 12px;background:#0f172a;border-right:1px solid #334155;">
                        <p style="margin:0;font-size:24px;font-weight:800;color:#e2e8f0;">${totalChecked}</p>
                        <p style="margin:4px 0 0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Checked</p>
                      </td>
                      <td align="center" style="padding:18px 12px;background:#0f172a;border-right:1px solid #334155;">
                        <p style="margin:0;font-size:24px;font-weight:800;color:#f87171;">${lostItemsCount}</p>
                        <p style="margin:4px 0 0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Lost Missing</p>
                      </td>
                      <td align="center" style="padding:18px 12px;background:#0f172a;">
                        <p style="margin:0;font-size:24px;font-weight:800;color:#4ade80;">${foundItemsCount}</p>
                        <p style="margin:4px 0 0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Found Missing</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding:24px 36px 0;">
                  <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#e2e8f0;">Missing Items Detail</p>
                  <div style="border-radius:10px;overflow:hidden;border:1px solid #334155;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <thead>
                        <tr style="background:#0f172a;">
                          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Type</th>
                          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Item</th>
                          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Reporter</th>
                          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Location</th>
                          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Date</th>
                        </tr>
                      </thead>
                      <tbody style="background:#1e293b;">
                        ${itemRows}
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- How to Fix -->
              <tr>
                <td style="padding:20px 36px 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(37,99,235,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:10px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#93c5fd;">🔧 How to Fix</p>
                        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
                          1. Log in to the admin dashboard<br/>
                          2. Navigate to <strong style="color:#e2e8f0;">Security &amp; Compliance → Sheets Reconciliation</strong><br/>
                          3. Review the list of missing items<br/>
                          4. Click <strong style="color:#e2e8f0;">"Re-sync Missing Items"</strong> to automatically log them to Google Sheets
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:28px 36px 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #334155;padding-top:20px;">
                    <tr>
                      <td>
                        <p style="margin:0 0 4px;font-size:12px;color:#64748b;">This is an automated weekly reconciliation report. The check compares database records from the last 7 days with Google Sheets logs to detect data integrity failures caused by network issues, offline submissions, or webhook errors.</p>
                        <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Northern Bukidnon State College · Student Affairs Services</p>
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
  `;
    return {
        subject: `[Lost & Found] ⚠️ Sheets Reconciliation Alert — ${discrepanciesCount} item${discrepanciesCount !== 1 ? "s" : ""} missing`,
        html,
    };
};
exports.sheetsReconciliationAlertTemplate = sheetsReconciliationAlertTemplate;
