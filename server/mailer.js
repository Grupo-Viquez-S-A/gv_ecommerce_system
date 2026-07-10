import nodemailer from "nodemailer";

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || "465");
  const username = process.env.SMTP_USERNAME || "";
  const password = process.env.SMTP_PASSWORD || "";
  const fromEmail =
    process.env.SMTP_FROM_EMAIL || process.env.SMTP_SENDER_EMAIL || username;
  const fromName =
    process.env.SMTP_FROM_NAME || process.env.SMTP_SENDER_NAME || "Grupo Viquez S.A";

  return { host, port, username, password, fromEmail, fromName };
}

export function isSmtpConfigured(config) {
  return Boolean(
    config.host && config.port && config.username && config.password && config.fromEmail,
  );
}

let cachedTransporter = null;
let cachedTransporterKey = null;

function getTransporter(config) {
  const key = `${config.host}:${config.port}:${config.username}`;

  if (cachedTransporter && cachedTransporterKey === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
  cachedTransporterKey = key;

  return cachedTransporter;
}

export async function sendSmtpMail({
  host,
  port,
  username,
  password,
  fromEmail,
  fromName,
  to,
  subject,
  text,
  html,
}) {
  const transporter = getTransporter({ host, port, username, password });

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  });
}
