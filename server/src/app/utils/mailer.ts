import nodemailer from "nodemailer";

export const sendEmail = async (config: {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  html: string;
}) => {
  const transporter = nodemailer.createTransport({
  host: "74.125.24.108",  // smtp.gmail.com IPv4 address
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_FROM_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: config.toEmail,
    subject: config.subject,
    html: config.html,
  });
};