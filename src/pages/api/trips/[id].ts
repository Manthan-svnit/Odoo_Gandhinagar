import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Trip from '@/models/Trip';
import Vehicle from '@/models/Vehicle';
import Driver from '@/models/Driver';
import FuelLog from '@/models/FuelLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();
  const { id } = req.query;

  if (req.method === 'GET') {
    const trip = await Trip.findById(id)
      .populate('vehicleId', 'name registrationNumber maxLoadCapacity type')
      .populate('driverId', 'name licenseNumber safetyScore');
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    return res.status(200).json(trip);
  }

  if (req.method === 'PUT') {
    if (!['fleet_manager', 'dispatcher'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const trip = await Trip.findById(id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    const { action, endOdometer, fuelConsumed, actualDistance, revenue } = req.body;

    if (action === 'dispatch') {
      if (trip.status !== 'Draft') return res.status(400).json({ error: 'Only Draft trips can be dispatched' });
      const vehicle = await Vehicle.findById(trip.vehicleId);
      const driver = await Driver.findById(trip.driverId);
      if (!vehicle || !driver) return res.status(404).json({ error: 'Vehicle or Driver not found' });
      if (vehicle.status !== 'Available') return res.status(422).json({ error: `Vehicle is ${vehicle.status}` });
      if (driver.status === 'Suspended') return res.status(422).json({ error: 'Driver is suspended' });
      if (driver.status === 'On Trip') return res.status(422).json({ error: 'Driver is already On Trip' });
      if (new Date(driver.licenseExpiryDate) < new Date()) return res.status(422).json({ error: 'Driver license expired' });

      vehicle.status = 'On Trip';
      driver.status = 'On Trip';
      trip.status = 'Dispatched';
      trip.dispatchedAt = new Date();
      trip.startOdometer = vehicle.odometer;
      await Promise.all([vehicle.save(), driver.save(), trip.save()]);
      return res.status(200).json(trip);
    }

    if (action === 'complete') {
      if (trip.status !== 'Dispatched') return res.status(400).json({ error: 'Only Dispatched trips can be completed' });
      const vehicle = await Vehicle.findById(trip.vehicleId);
      const driver = await Driver.findById(trip.driverId);
      if (!vehicle || !driver) return res.status(404).json({ error: 'Vehicle or Driver not found' });

      if (endOdometer != null) vehicle.odometer = endOdometer;
      trip.endOdometer = endOdometer;
      trip.fuelConsumed = fuelConsumed;
      trip.actualDistance = actualDistance || (endOdometer && trip.startOdometer ? endOdometer - trip.startOdometer : trip.plannedDistance);
      trip.revenue = revenue || trip.revenue;
      trip.status = 'Completed';
      trip.completedAt = new Date();
      vehicle.status = 'Available';
      driver.status = 'Available';
      driver.tripsCompleted = (driver.tripsCompleted || 0) + 1;

      if (fuelConsumed && fuelConsumed > 0) {
        await FuelLog.create({
          vehicleId: trip.vehicleId,
          tripId: trip._id,
          liters: fuelConsumed,
          costPerLiter: 0,
          totalCost: 0,
          date: new Date(),
          odometer: endOdometer,
        });
      }

      await Promise.all([vehicle.save(), driver.save(), trip.save()]);
      return res.status(200).json(trip);
    }

    if (action === 'cancel') {
      if (!['Draft', 'Dispatched'].includes(trip.status)) return res.status(400).json({ error: 'Trip cannot be cancelled' });
      if (trip.status === 'Dispatched') {
        const vehicle = await Vehicle.findById(trip.vehicleId);
        const driver = await Driver.findById(trip.driverId);
        if (vehicle) { vehicle.status = 'Available'; await vehicle.save(); }
        if (driver) { driver.status = 'Available'; await driver.save(); }
      }
      trip.status = 'Cancelled';
      trip.cancelledAt = new Date();
      await trip.save();
      return res.status(200).json(trip);
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).end();
}
