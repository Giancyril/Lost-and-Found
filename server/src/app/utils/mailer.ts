export const sendEmail = async (config: {
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  html: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${config.fromName} <onboarding@resend.dev>`,
      to:      config.toEmail,
      subject: config.subject,
      html:    config.html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error));
  }

  return response.json();
};
