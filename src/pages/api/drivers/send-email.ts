import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Driver from '@/models/Driver';
import { sendCustomDriverEmail } from '@/lib/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;
  
  if (!['fleet_manager', 'safety_officer'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await connectDB();
  const { driverId, subject, message } = req.body;
  
  if (!driverId || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: driverId, subject, message' });
  }

  const driver = await Driver.findById(driverId);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  if (!driver.email) return res.status(400).json({ error: 'Driver does not have an email address' });

  try {
    await sendCustomDriverEmail(driver.name, driver.email, subject, message);
    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Failed to send custom driver email:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
