import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../global/response";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "./mailer";
import { userService } from "../modules/user/user.service";

const prisma = new PrismaClient();

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, message, type = "INFO", target = "ALL", sendEmail: shouldSendEmail = false } = req.body;
    if (!title || !message) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "Title and message are required", data: null });
    }

    const announcement = await prisma.announcement.create({
      data: { title, message, type, target, sentByName: (req as any).user?.username || "Admin", sentById: (req as any).user?.id },
    });

    let emailCount = 0;

    if (shouldSendEmail) {
      const allUsers = await userService.allUsers();
      const targets = allUsers.filter((u: any) => {
        if (u.isDeleted || !u.activated || !u.email) return false;
        if (target === "ADMINS") return u.role === "ADMIN";
        if (target === "STUDENTS") return u.role !== "ADMIN";
        return true;
      });

      const emailPromises = targets.map((u: any) =>
        sendEmail({
          fromName:  process.env.SMTP_FROM_NAME  || "NBSC SAS Lost & Found",
          fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@nbsc.edu.ph",
          toEmail:   u.email,
          subject:   `[NBSC SAS] ${title}`,
          html: announcementEmailTemplate({ title, message, type, recipientName: u.username || u.name || "User" }),
        }).catch(() => null)
      );

      const results = await Promise.allSettled(emailPromises);
      emailCount = results.filter(r => r.status === "fulfilled" && r.value !== null).length;

      await prisma.announcement.update({
        where: { id: announcement.id },
        data: { emailSent: true, emailCount },
      });
    }

    sendResponse(res, {
      statusCode: StatusCodes.CREATED, success: true,
      message: shouldSendEmail ? `Announcement sent to ${emailCount} users` : "Announcement created",
      data: { ...announcement, emailCount },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Announcements retrieved", data: announcements });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    await prisma.announcement.update({ where: { id: req.params.id }, data: { isDeleted: true } });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Announcement deleted", data: null });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ── SUPPORT TICKETS ───────────────────────────────────────────────────────────

export const createTicket = async (req: Request, res: Response) => {
  try {
    const { subject, message, senderName, senderEmail, priority = "NORMAL" } = req.body;
    if (!subject || !message) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "Subject and message are required", data: null });
    }
    const ticket = await prisma.supportTicket.create({
      data: { subject, message, senderName: senderName || "", senderEmail: senderEmail || "", priority },
    });
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Ticket submitted", data: ticket });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const getTickets = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const tickets = await prisma.supportTicket.findMany({
      where: { isDeleted: false, ...(status ? { status: status as any } : {}) },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Tickets retrieved", data: tickets });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const replyToTicket = async (req: Request, res: Response) => {
  try {
    const { adminReply, status = "RESOLVED" } = req.body;
    if (!adminReply) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "Reply message is required", data: null });
    }
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { adminReply, status, repliedAt: new Date(), repliedBy: (req as any).user?.username || "Admin" },
    });

    // Send reply email if senderEmail exists
    if (ticket.senderEmail) {
      await sendEmail({
        fromName:  process.env.SMTP_FROM_NAME  || "NBSC SAS Lost & Found",
        fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@nbsc.edu.ph",
        toEmail:   ticket.senderEmail,
        subject:   `Re: ${ticket.subject} — Support Reply`,
        html: ticketReplyEmailTemplate({
          senderName: ticket.senderName || "User",
          subject:    ticket.subject,
          originalMessage: ticket.message,
          adminReply,
        }),
      }).catch(() => null);
    }

    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Reply sent", data: ticket });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const ticket = await prisma.supportTicket.update({ where: { id: req.params.id }, data: { status } });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Status updated", data: ticket });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const deleteTicket = async (req: Request, res: Response) => {
  try {
    await prisma.supportTicket.update({ where: { id: req.params.id }, data: { isDeleted: true } });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Ticket deleted", data: null });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ── FEEDBACK ──────────────────────────────────────────────────────────────────

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { senderName, senderEmail, category = "GENERAL", message, rating } = req.body;
    if (!message) {
      return sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: "Message is required", data: null });
    }
    const feedback = await prisma.feedback.create({
      data: { senderName: senderName || "Anonymous", senderEmail: senderEmail || "", category, message, rating: rating ? parseInt(rating) : null },
    });
    sendResponse(res, { statusCode: StatusCodes.CREATED, success: true, message: "Feedback submitted", data: feedback });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const feedbacks = await prisma.feedback.findMany({
      where: { isDeleted: false, ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: "desc" },
    });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Feedbacks retrieved", data: feedbacks });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { status, adminNote } = req.body;
    const feedback = await prisma.feedback.update({
      where: { id: req.params.id },
      data: { status, ...(adminNote ? { adminNote } : {}) },
    });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Feedback updated", data: feedback });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    await prisma.feedback.update({ where: { id: req.params.id }, data: { isDeleted: true } });
    sendResponse(res, { statusCode: StatusCodes.OK, success: true, message: "Feedback deleted", data: null });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ── COMM HUB STATS ────────────────────────────────────────────────────────────

export const getCommHubStats = async (req: Request, res: Response) => {
  try {
    const [openTickets, unresolvedFeedback, totalAnnouncements, urgentTickets] = await Promise.all([
      prisma.supportTicket.count({ where: { isDeleted: false, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.feedback.count({ where: { isDeleted: false, status: { in: ["UNREAD", "READ"] } } }),
      prisma.announcement.count({ where: { isDeleted: false } }),
      prisma.supportTicket.count({ where: { isDeleted: false, priority: "URGENT", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    ]);
    sendResponse(res, {
      statusCode: StatusCodes.OK, success: true, message: "Stats retrieved",
      data: { openTickets, unresolvedFeedback, totalAnnouncements, urgentTickets },
    });
  } catch (error: any) {
    sendResponse(res, { statusCode: StatusCodes.BAD_REQUEST, success: false, message: error?.message, data: null });
  }
};

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────

const announcementEmailTemplate = (data: { title: string; message: string; type: string; recipientName: string }) => {
  const accentColor = data.type === "URGENT" ? "#ef4444" : data.type === "WARNING" ? "#f59e0b" : data.type === "SUCCESS" ? "#10b981" : "#0891b2";
  const badge = data.type === "URGENT" ? "🚨 URGENT" : data.type === "WARNING" ? "⚠️ NOTICE" : data.type === "SUCCESS" ? "✅ UPDATE" : "📢 ANNOUNCEMENT";
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="height:4px;background:${accentColor};"></td></tr>
        <tr><td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">NBSC SAS Lost &amp; Found</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#0f172a;">${data.title}</h1></td>
            <td align="right" valign="top"><span style="background:#f1f5f9;color:${accentColor};font-size:11px;font-weight:700;padding:6px 14px;border-radius:16px;border:1px solid ${accentColor}33;">${badge}</span></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0f172a;">Hello, ${data.recipientName}</p>
          <div style="font-size:14px;color:#334155;line-height:1.8;white-space:pre-wrap;">${data.message}</div>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#334155;">NBSC SAS Lost &amp; Found System</p>
          <p style="margin:0;font-size:12px;color:#94a3b8;">Northern Bukidnon State College · Student Affairs Services</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
};

const ticketReplyEmailTemplate = (data: { senderName: string; subject: string; originalMessage: string; adminReply: string }) => `
  <!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="height:4px;background:linear-gradient(90deg,#1d4ed8,#0891b2);"></td></tr>
        <tr><td style="padding:36px 40px 28px;border-bottom:1px solid #e2e8f0;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;">NBSC SAS Support</p>
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">We've responded to your ticket</h1>
        </td></tr>
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#0f172a;">Hello, ${data.senderName}</p>
          <p style="margin:0 0 20px;font-size:14px;color:#64748b;">Your support ticket "<strong style="color:#0f172a;">${data.subject}</strong>" has received a reply.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:20px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#3b82f6;">Admin Reply</p>
              <p style="margin:0;font-size:14px;color:#1e3a5f;line-height:1.7;white-space:pre-wrap;">${data.adminReply}</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;">Your Original Message</p>
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.7;white-space:pre-wrap;">${data.originalMessage}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:#334155;">NBSC SAS Lost &amp; Found System</p>
          <p style="margin:0;font-size:12px;color:#94a3b8;">Northern Bukidnon State College · Student Affairs Services</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;