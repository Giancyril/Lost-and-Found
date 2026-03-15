import { Request, Response } from "express";
import { sendEmail } from "./mailer";
import { lostItemReportedTemplate, itemClaimedTemplate } from "./emailTemplates";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";

// Helper — merge request smtp fields with .env fallbacks
const resolveSmtp = (smtp: any) => ({
  host:      smtp?.host      || process.env.SMTP_HOST      || "smtp.gmail.com",
  port:      smtp?.port      || Number(process.env.SMTP_PORT) || 587,
  secure:    smtp?.secure    ?? (process.env.SMTP_SECURE === "true"),
  username:  smtp?.username  || process.env.SMTP_USERNAME  || "",
  password:  smtp?.password  || process.env.SMTP_PASSWORD  || "",
  fromName:  smtp?.fromName  || process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found",
  fromEmail: smtp?.fromEmail || process.env.SMTP_FROM_EMAIL || "",
});

export const sendLostItemEmail = async (req: Request, res: Response) => {
  try {
    const { smtp, recipient } = req.body;
    // recipient = { toEmail, reporterName, itemName, location, date, description }

    const smtpConfig = resolveSmtp(smtp);

    if (!smtpConfig.username || !smtpConfig.password) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "SMTP credentials are missing. Please configure SMTP settings.",
        data: null,
      });
    }

    const template = lostItemReportedTemplate({
      reporterName: recipient.reporterName,
      itemName:     recipient.itemName,
      location:     recipient.location,
      date:         recipient.date,
      description:  recipient.description,
    });

    await sendEmail({
      ...smtpConfig,
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
    // recipient = { toEmail, claimantName, itemName, location, claimDate, contactNumber }

    const smtpConfig = resolveSmtp(smtp);

    if (!smtpConfig.username || !smtpConfig.password) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "SMTP credentials are missing. Please configure SMTP settings.",
        data: null,
      });
    }

    const template = itemClaimedTemplate({
      claimantName:  recipient.claimantName,
      itemName:      recipient.itemName,
      location:      recipient.location,
      claimDate:     recipient.claimDate,
      contactNumber: recipient.contactNumber,
    });

    await sendEmail({
      ...smtpConfig,
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