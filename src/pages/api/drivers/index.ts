import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Driver from '@/models/Driver';

import { checkAndSendExpiryReminders } from '@/lib/mailer';

const ALLOWED_CREATE = ['fleet_manager'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();

  if (req.method === 'GET') {
    // Run the expiry warnings & auto-suspension checks asynchronously in the background
    checkAndSendExpiryReminders().catch((err) => {
      console.error('Error running background expiry reminders:', err);
    });

    const { status, search } = req.query;
    const filter: Record<string, any> = {};
    if (status && status !== 'All') filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const drivers = await Driver.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(drivers);
  }

  if (req.method === 'POST') {
    if (!ALLOWED_CREATE.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, email, safetyScore } = req.body;
    if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const existing = await Driver.findOne({ licenseNumber });
    if (existing) return res.status(409).json({ error: 'License number already exists' });
    const driver = await Driver.create({ name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, email, safetyScore: safetyScore || 100 });
    return res.status(201).json(driver);
  }

  return res.status(405).end();
}
