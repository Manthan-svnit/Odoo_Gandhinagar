import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendLicenseExpiryReminder(driverName: string, email: string, expiryDate: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `⚠️ License Expiry Reminder — ${driverName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px;">
        <h2 style="color:#f59e0b;">TransitOps — License Expiry Alert</h2>
        <p>Driver <strong>${driverName}</strong>'s driving license is expiring on <strong>${expiryDate}</strong>.</p>
        <p>Please ensure the license is renewed before the expiry date to avoid trip assignment restrictions.</p>
        <hr style="border-color:#30363d;margin:24px 0;"/>
        <p style="font-size:12px;color:#8b949e;">This is an automated reminder from TransitOps.</p>
      </div>
    `,
  });
}
