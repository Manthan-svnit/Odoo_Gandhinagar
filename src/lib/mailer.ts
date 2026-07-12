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

import Driver from '@/models/Driver';
import { connectDB } from './db';

export async function sendLicenseExpiryReminder(driverName: string, email: string, expiryDate: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `⚠️ License Expiry Reminder — ${driverName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px;">
        <h2 style="color:#f59e0b;">TransitOps — License Expiry Alert</h2>
        
        <div style="color: #ef4444; font-size: 15px; font-weight: bold; margin: 16px 0; padding: 12px; border: 1px solid #ef4444; border-radius: 6px; background: rgba(239, 68, 68, 0.1); line-height: 1.5;">
          Your email is going to expire before 15 days  pls renew it otherwise you will be suspended....
        </div>

        <p>Driver <strong>${driverName}</strong>'s driving license is expiring on <strong>${expiryDate}</strong>.</p>
        <p>Please ensure the license is renewed before the expiry date to avoid trip assignment restrictions.</p>
        <hr style="border-color:#30363d;margin:24px 0;"/>
        <p style="font-size:12px;color:#8b949e;">This is an automated reminder from TransitOps.</p>
      </div>
    `,
  });
}

export async function checkAndSendExpiryReminders() {
  await connectDB();
  const drivers = await Driver.find({});
  const now = new Date();
  
  let processed = 0;
  let emailsSent = 0;
  let suspended = 0;
  const details: Array<{ name: string; email: string; daysLeft: number; action: string }> = [];

  for (const driver of drivers) {
    if (!driver.email) continue;
    processed++;

    const expiry = new Date(driver.licenseExpiryDate);
    // Calculate difference in calendar days
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Already expired -> Suspend driver if not suspended
      if (driver.status !== 'Suspended') {
        driver.status = 'Suspended';
        await driver.save();
        suspended++;
        details.push({
          name: driver.name,
          email: driver.email,
          daysLeft: diffDays,
          action: 'License expired. Driver status set to Suspended.',
        });
      } else {
        details.push({
          name: driver.name,
          email: driver.email,
          daysLeft: diffDays,
          action: 'License expired. Already Suspended.',
        });
      }
    } else if (diffDays < 15) {
      // Expiration date is less than 15 days away -> Send warning email if not sent in last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const needsEmail = !driver.lastExpiryReminderSentAt || driver.lastExpiryReminderSentAt < oneWeekAgo;

      if (needsEmail) {
        try {
          const formattedDate = expiry.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          await sendLicenseExpiryReminder(driver.name, driver.email, formattedDate);
          driver.lastExpiryReminderSentAt = now;
          await driver.save();
          emailsSent++;
          details.push({
            name: driver.name,
            email: driver.email,
            daysLeft: diffDays,
            action: `Warning email sent (Expires in ${diffDays} days).`,
          });
        } catch (error: any) {
          details.push({
            name: driver.name,
            email: driver.email,
            daysLeft: diffDays,
            action: `Failed to send email: ${error.message || error}`,
          });
        }
      } else {
        details.push({
          name: driver.name,
          email: driver.email,
          daysLeft: diffDays,
          action: `Warning email skipped (already sent recently).`,
        });
      }
    } else {
      details.push({
        name: driver.name,
        email: driver.email,
        daysLeft: diffDays,
        action: 'License valid. No action needed.',
      });
    }
  }

  return { processed, emailsSent, suspended, details };
}

export async function sendCustomDriverEmail(driverName: string, email: string, subject: string, message: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0d1117;color:#e6edf3;padding:32px;border-radius:12px;">
        <h2 style="color:#f59e0b;">TransitOps — Message from Safety Officer</h2>
        <p>Hello <strong>${driverName}</strong>,</p>
        <div style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 6px; border: 1px solid #30363d; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        <hr style="border-color:#30363d;margin:24px 0;"/>
        <p style="font-size:12px;color:#8b949e;">This is an automated communication sent by TransitOps on behalf of your Safety Officer.</p>
      </div>
    `,
  });
}
