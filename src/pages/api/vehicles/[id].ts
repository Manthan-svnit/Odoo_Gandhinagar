import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Vehicle from '@/models/Vehicle';
import Trip from '@/models/Trip';
import FuelLog from '@/models/FuelLog';
import MaintenanceLog from '@/models/MaintenanceLog';
import Expense from '@/models/Expense';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();
  const { id } = req.query;

  if (req.method === 'GET') {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    const [trips, fuelLogs, maintenance] = await Promise.all([
      Trip.find({ vehicleId: id }).sort({ createdAt: -1 }).populate('driverId', 'name'),
      FuelLog.find({ vehicleId: id }).sort({ date: -1 }),
      MaintenanceLog.find({ vehicleId: id }).sort({ date: -1 }),
    ]);
    const totalFuel = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
    const totalMaint = maintenance.reduce((s, m) => s + m.cost, 0);
    const totalRevenue = trips.filter(t => t.status === 'Completed').reduce((s, t) => s + (t.revenue || 0), 0);
    const roi = vehicle.acquisitionCost > 0
      ? ((totalRevenue - (totalMaint + totalFuel)) / vehicle.acquisitionCost * 100).toFixed(2)
      : 0;
    return res.status(200).json({ vehicle, trips, fuelLogs, maintenance, totalFuel, totalMaint, totalRevenue, roi });
  }

  if (req.method === 'PUT') {
    if (!['fleet_manager'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    const { registrationNumber, name, vehicleModel, type, maxLoadCapacity, odometer, acquisitionCost, status } = req.body;
    if (registrationNumber && registrationNumber.toUpperCase() !== vehicle.registrationNumber) {
      const dup = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase() });
      if (dup) return res.status(409).json({ error: 'Registration number already exists' });
    }
    Object.assign(vehicle, { registrationNumber, name, vehicleModel, type, maxLoadCapacity, odometer, acquisitionCost, status });
    await vehicle.save();
    return res.status(200).json(vehicle);
  }

  if (req.method === 'DELETE') {
    if (!['fleet_manager'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'On Trip') return res.status(400).json({ error: 'Cannot delete a vehicle that is On Trip' });
    await Vehicle.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Vehicle deleted' });
  }

  return res.status(405).end();
}
