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
  const { id } = req.query;

  if (req.method === 'PUT') {
    if (!['fleet_manager'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const log = await MaintenanceLog.findById(id);
    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });

    const { action } = req.body;
    if (action === 'close') {
      if (log.status === 'Closed') return res.status(400).json({ error: 'Already closed' });
      log.status = 'Closed';
      log.closedAt = new Date();
      await log.save();

      const vehicle = await Vehicle.findById(log.vehicleId);
      if (vehicle && vehicle.status === 'In Shop') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
      return res.status(200).json(log);
    }

    const { serviceType, description, cost, date } = req.body;
    Object.assign(log, { serviceType, description, cost, date });
    await log.save();
    return res.status(200).json(log);
  }

  if (req.method === 'DELETE') {
    if (!['fleet_manager'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    await MaintenanceLog.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).end();
}
