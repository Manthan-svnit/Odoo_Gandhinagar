import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Vehicle from '@/models/Vehicle';

const ALLOWED_CREATE = ['fleet_manager', 'dispatcher'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();

  if (req.method === 'GET') {
    const { type, status, search, available } = req.query;
    const filter: Record<string, any> = {};
    if (type && type !== 'All') filter.type = type;
    if (status && status !== 'All') filter.status = status;
    if (available === 'true') filter.status = 'Available';
    if (search) filter.registrationNumber = { $regex: search, $options: 'i' };
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(vehicles);
  }

  if (req.method === 'POST') {
    if (!ALLOWED_CREATE.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { registrationNumber, name, vehicleModel, type, maxLoadCapacity, odometer, acquisitionCost } = req.body;
    if (!registrationNumber || !name || !vehicleModel || !type || maxLoadCapacity == null || acquisitionCost == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    if (existing) return res.status(409).json({ error: 'Registration number already exists' });
    const vehicle = await Vehicle.create({ registrationNumber, name, vehicleModel, type, maxLoadCapacity, odometer: odometer || 0, acquisitionCost });
    return res.status(201).json(vehicle);
  }

  return res.status(405).end();
}
