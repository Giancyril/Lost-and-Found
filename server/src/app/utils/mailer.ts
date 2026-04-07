import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export const sendEmail = async (config: {
  fromName:  string;
  fromEmail: string;
  toEmail:   string;
  subject:   string;
  html:      string;
}) => {
  await sgMail.send({
    from:    { name: config.fromName, email: config.fromEmail },
    to:      config.toEmail,
    subject: config.subject,
    html:    config.html,
  });
};