import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (config: {
  fromName: string;
  toEmail: string;
  subject: string;
  html: string;
}) => {
  const { data, error } = await resend.emails.send({
    from: `${config.fromName} <onboarding@resend.dev>`,
    to: config.toEmail,
    subject: config.subject,
    html: config.html,
  });

  if (error) throw error;
  return data;
};