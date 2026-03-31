// @ts-ignore
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendEmail = async (config: {
  fromName:  string;
  fromEmail: string;
  toEmail:   string;
  subject:   string;
  html:      string;
}) => {
  await transporter.sendMail({
    from:    `"${config.fromName}" <${process.env.GMAIL_USER}>`,
    to:      config.toEmail,
    subject: config.subject,
    html:    config.html,
  });
};