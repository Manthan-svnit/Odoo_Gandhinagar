import { NextResponse } from 'next/server';
import { sendLicenseExpiryReminder } from '@/lib/mailer'; // adjust path if needed

export async function GET() {
    try {
        // Hardcoding test data just to make sure it works!
        const testDriverName = "Alex";
        const testEmail = process.env.SMTP_USER as string; // Sends the email to yourself
        const testExpiry = "2026-08-01";

        await sendLicenseExpiryReminder(testDriverName, testEmail, testExpiry);

        return NextResponse.json({ message: "Success! Expiry reminder sent." }, { status: 200 });
    } catch (error) {
        console.error("Email error:", error);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
}