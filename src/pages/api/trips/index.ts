import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Trip from '@/models/Trip';
import Vehicle from '@/models/Vehicle';
import Driver from '@/models/Driver';

let tripCounter = 1;

async function getNextTripNumber() {
  const latest = await Trip.findOne().sort({ tripNumber: -1 });
  if (!latest) return 'TR001';
  const num = parseInt(latest.tripNumber?.replace('TR', '') || '0') + 1;
  return `TR${String(num).padStart(3, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();

  if (req.method === 'GET') {
    const { status, search } = req.query;
    const filter: Record<string, any> = {};
    if (status && status !== 'All') filter.status = status;
    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .populate('vehicleId', 'name registrationNumber maxLoadCapacity')
      .populate('driverId', 'name licenseNumber');
    return res.status(200).json(trips);
  }

  if (req.method === 'POST') {
    if (!['fleet_manager', 'dispatcher'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance, revenue } = req.body;
    if (!source || !destination || !vehicleId || !driverId || cargoWeight == null || plannedDistance == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (!['Available'].includes(vehicle.status)) {
      return res.status(422).json({ error: `Vehicle is ${vehicle.status} and cannot be assigned` });
    }
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(422).json({ error: `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity}kg)` });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status === 'Suspended') return res.status(422).json({ error: 'Driver is suspended and cannot be assigned' });
    if (driver.status === 'On Trip') return res.status(422).json({ error: 'Driver is already On Trip' });
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      return res.status(422).json({ error: 'Driver license has expired' });
    }

    const tripNumber = await getNextTripNumber();
    const trip = await Trip.create({ tripNumber, source, destination, vehicleId, driverId, cargoWeight, plannedDistance, revenue: revenue || 0 });
    return res.status(201).json(trip);
  }

  return res.status(405).end();
}
