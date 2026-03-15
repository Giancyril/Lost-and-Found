import { Request, Response } from "express";
import { sendEmail } from "./mailer";
import { lostItemReportedTemplate, itemClaimedTemplate } from "./emailTemplates";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";

export const sendLostItemEmail = async (req: Request, res: Response) => {
  try {
    const { smtp, recipient } = req.body;
    const fromName = smtp?.fromName || process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";

    const template = lostItemReportedTemplate({
      reporterName: recipient.reporterName,
      itemName:     recipient.itemName,
      location:     recipient.location,
      date:         recipient.date,
      description:  recipient.description,
    });

    await sendEmail({
      fromName,
      toEmail: recipient.toEmail,
      subject: template.subject,
      html:    template.html,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item report email sent successfully",
      data: null,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message || "Failed to send email",
      data: null,
    });
  }
};

export const sendClaimApprovedEmail = async (req: Request, res: Response) => {
  try {
    const { smtp, recipient } = req.body;
    const fromName = smtp?.fromName || process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";

    const template = itemClaimedTemplate({
      claimantName:  recipient.claimantName,
      itemName:      recipient.itemName,
      location:      recipient.location,
      claimDate:     recipient.claimDate,
      contactNumber: recipient.contactNumber,
    });

    await sendEmail({
      fromName,
      toEmail: recipient.toEmail,
      subject: template.subject,
      html:    template.html,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claim approved email sent successfully",
      data: null,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message || "Failed to send email",
      data: null,
    });
  }
};