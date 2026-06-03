import cron from "node-cron";
import prisma from "../config/prisma";
import { userService } from "../modules/user/user.service";
import { sendEmail } from "../utils/mailer";
import { announcementEmailTemplate } from "../utils/communicationController";

/**
 * Announcement Scheduler Job
 * Checks every minute for scheduled announcements that are due for delivery
 */
export const startAnnouncementScheduler = () => {
  // Cron format: run every minute
  cron.schedule("* * * * *", async () => {
    console.log("[AnnouncementScheduler] Checking for scheduled announcements...");
    try {
      const now = new Date();
      const pending = await prisma.announcement.findMany({
        where: {
          isDeleted: false,
          publishAt: { lte: now },
          sendEmail: true,
          emailSent: false,
        },
      });

      if (pending.length === 0) {
        return;
      }

      console.log(`[AnnouncementScheduler] Found ${pending.length} announcements due for email broadcast`);

      for (const ann of pending) {
        try {
          const allUsers = await userService.allUsers();
          const targets = allUsers.filter((u: any) => {
            if (u.isDeleted || !u.activated || !u.email) return false;
            if (ann.target === "ADMINS") return u.role === "ADMIN";
            if (ann.target === "STUDENTS") {
              if (u.role === "ADMIN") return false;
              if (ann.targetGroupYear && u.yearLevel !== ann.targetGroupYear) return false;
              if (ann.targetGroupCourse && u.course !== ann.targetGroupCourse) return false;
              return true;
            }
            return true;
          });

          if (targets.length === 0) {
            console.log(`[AnnouncementScheduler] No target users found for announcement ID: ${ann.id}`);
            await prisma.announcement.update({
              where: { id: ann.id },
              data: { emailSent: true, emailCount: 0 },
            });
            continue;
          }

          console.log(`[AnnouncementScheduler] Broadcasting announcement "${ann.title}" to ${targets.length} users...`);

          const emailPromises = targets.map((u: any) =>
            sendEmail({
              fromName: process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found",
              fromEmail: process.env.SMTP_FROM_EMAIL || "noreply@nbsc.edu.ph",
              toEmail: u.email,
              subject: ann.title,
              html: announcementEmailTemplate({
                title: ann.title,
                message: ann.message,
                type: ann.type,
                recipientName: u.name || u.username || "Student",
              }),
            }).catch(() => null)
          );

          const results = await Promise.allSettled(emailPromises);
          const emailCount = results.filter(
            (r) => r.status === "fulfilled" && r.value !== null
          ).length;

          await prisma.announcement.update({
            where: { id: ann.id },
            data: { emailSent: true, emailCount },
          });

          console.log(`[AnnouncementScheduler] Announcement "${ann.title}" successfully sent to ${emailCount} users`);
        } catch (innerError) {
          console.error(`[AnnouncementScheduler] Failed to process announcement ID: ${ann.id}`, innerError);
        }
      }
    } catch (error) {
      console.error("[AnnouncementScheduler] Error running scheduler job:", error);
    }
  });

  console.log("[AnnouncementScheduler] Scheduled announcement check started (Every minute)");
};
