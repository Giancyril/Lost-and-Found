import { Request, Response } from "express";
import { sendEmail } from "./mailer";
import { lostItemReportedTemplate, itemClaimedTemplate } from "./emailTemplates";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";

export const sendLostItemEmail = async (req: Request, res: Response) => {
  try {
    const { smtp, recipient } = req.body;
    const fromName = smtp?.fromName || process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";

    console.log("[email] sendLostItemEmail → to:", recipient?.toEmail, "| SMTP_USER:", process.env.SMTP_USERNAME, "| SMTP_PASS set:", !!process.env.SMTP_PASSWORD);

    const template = lostItemReportedTemplate({
      reporterName: recipient.reporterName,
      itemName:     recipient.itemName,
      location:     recipient.location,
      date:         recipient.date,
      description:  recipient.description,
    });

    await sendEmail({
      fromName,
      fromEmail: process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com",
      toEmail:   recipient.toEmail,
      subject:   template.subject,
      html:      template.html,
    });

    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Lost item report email sent successfully", data: null });
  } catch (error: any) {
    console.error("[email] sendLostItemEmail error:", error?.message, error?.code, error?.response);
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message || "Failed to send email", data: null });
  }
};

export const sendClaimApprovedEmail = async (req: Request, res: Response) => {
  try {
    const { smtp, recipient } = req.body;
    const fromName = smtp?.fromName || process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";

    console.log("[email] sendClaimApprovedEmail → to:", recipient?.toEmail, "| SMTP_USER:", process.env.SMTP_USERNAME, "| SMTP_PASS set:", !!process.env.SMTP_PASSWORD);

    const template = itemClaimedTemplate({
      claimantName:  recipient.claimantName,
      itemName:      recipient.itemName,
      location:      recipient.location,
      claimDate:     recipient.claimDate,
      contactNumber: recipient.contactNumber,
    });

    await sendEmail({
      fromName,
      fromEmail: process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com",
      toEmail:   recipient.toEmail,
      subject:   template.subject,
      html:      template.html,
    });

    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Claim approved email sent successfully", data: null });
  } catch (error: any) {
    console.error("[email] sendClaimApprovedEmail error:", error?.message, error?.code, error?.response);
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message || "Failed to send email", data: null });
  }
};
