import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Vehicle from '@/models/Vehicle';
import Driver from '@/models/Driver';
import Trip from '@/models/Trip';
import MaintenanceLog from '@/models/MaintenanceLog';
import FuelLog from '@/models/FuelLog';
import Expense from '@/models/Expense';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  const [vehicles, drivers, trips, fuelLogs, expenses, maintenanceLogs] = await Promise.all([
    Vehicle.find(),
    Driver.find(),
    Trip.find(),
    FuelLog.find(),
    Expense.find(),
    MaintenanceLog.find(),
  ]);

  const activeVehicles = vehicles.filter((v) => v.status !== 'Retired').length;
  const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
  const inMaintenance = vehicles.filter((v) => v.status === 'In Shop').length;
  const activeTrips = trips.filter((t) => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter((t) => t.status === 'Draft').length;
  const driversOnDuty = drivers.filter((d) => d.status === 'On Trip').length;
  const fleetUtilization =
    activeVehicles > 0 ? Math.round(((activeVehicles - availableVehicles) / activeVehicles) * 100) : 0;

  const vehicleStatusCounts = {
    Available: availableVehicles,
    'On Trip': vehicles.filter((v) => v.status === 'On Trip').length,
    'In Shop': inMaintenance,
    Retired: vehicles.filter((v) => v.status === 'Retired').length,
  };

  const recentTrips = await Trip.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('vehicleId', 'name registrationNumber')
    .populate('driverId', 'name');

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((s, m) => s + m.cost, 0);

  return res.status(200).json({
    kpis: { activeVehicles, availableVehicles, inMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilization },
    vehicleStatusCounts,
    recentTrips,
    totalOperationalCost: totalFuelCost + totalMaintenanceCost,
  });
}
