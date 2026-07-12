import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import MaintenanceLog from '@/models/MaintenanceLog';
import Vehicle from '@/models/Vehicle';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();

  if (req.method === 'GET') {
    const logs = await MaintenanceLog.find()
      .sort({ date: -1 })
      .populate('vehicleId', 'name registrationNumber');
    return res.status(200).json(logs);
  }

  if (req.method === 'POST') {
    if (!['fleet_manager'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { vehicleId, serviceType, description, cost, date } = req.body;
    if (!vehicleId || !serviceType || cost == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'On Trip') return res.status(422).json({ error: 'Cannot add maintenance for a vehicle On Trip' });

    vehicle.status = 'In Shop';
    await vehicle.save();

    const log = await MaintenanceLog.create({ vehicleId, serviceType, description, cost, date: date || new Date() });
    return res.status(201).json(log);
  }

  return res.status(405).end();
}
