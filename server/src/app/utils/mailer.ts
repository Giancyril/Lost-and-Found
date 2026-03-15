import nodemailer from "nodemailer";

export const createTransporter = (config: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
}) => {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
};

export const sendEmail = async (config: {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  html: string;
}) => {
  const transporter = createTransporter(config);
  const info = await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: config.toEmail,
    subject: config.subject,
    html: config.html,
  });
  return info;
};