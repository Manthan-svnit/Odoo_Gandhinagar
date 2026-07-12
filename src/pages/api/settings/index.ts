import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Settings from '@/models/Settings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();

  if (req.method === 'GET') {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    return res.status(200).json(settings);
  }

  if (req.method === 'PUT') {
    if (!['fleet_manager'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { depotName, currency, distanceUnit } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    Object.assign(settings, { depotName, currency, distanceUnit });
    await settings.save();
    return res.status(200).json(settings);
  }

  return res.status(405).end();
}
