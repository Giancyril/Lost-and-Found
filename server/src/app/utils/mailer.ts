import nodemailer from "nodemailer";

export const sendEmail = async (config: {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  html: string;
}) => {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST     || "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from:    `"${config.fromName}" <${process.env.SMTP_FROM_EMAIL || config.fromEmail}>`,
    to:      config.toEmail,
    subject: config.subject,
    html:    config.html,
  });
};
