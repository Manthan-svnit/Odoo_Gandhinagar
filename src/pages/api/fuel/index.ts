import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import FuelLog from '@/models/FuelLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();

  if (req.method === 'GET') {
    const { vehicleId } = req.query;
    const filter: Record<string, any> = {};
    if (vehicleId) filter.vehicleId = vehicleId;
    const logs = await FuelLog.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .populate('vehicleId', 'name registrationNumber')
      .populate('tripId', 'tripNumber');
    return res.status(200).json(logs);
  }

  if (req.method === 'POST') {
    if (!['fleet_manager', 'financial_analyst'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { vehicleId, tripId, liters, costPerLiter, date, odometer } = req.body;
    if (!vehicleId || !liters || !costPerLiter) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const totalCost = liters * costPerLiter;
    const payload: any = { vehicleId, liters, costPerLiter, totalCost, date: date || new Date(), odometer };
    if (tripId) payload.tripId = tripId;
    const log = await FuelLog.create(payload);
    return res.status(201).json(log);
  }

  return res.status(405).end();
}
