import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Vehicle from '@/models/Vehicle';
import Trip from '@/models/Trip';
import FuelLog from '@/models/FuelLog';
import MaintenanceLog from '@/models/MaintenanceLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  const [vehicles, trips, fuelLogs, maintenanceLogs] = await Promise.all([
    Vehicle.find().lean(),
    Trip.find().lean(),
    FuelLog.find().lean(),
    MaintenanceLog.find().lean(),
  ]);

  // --- KPIs ---
  const totalRevenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);
  const totalFuelCost = fuelLogs.reduce((s, f) => s + (f.totalCost || 0), 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((s, m) => s + (m.cost || 0), 0);
  const totalOperationalCost = totalFuelCost + totalMaintenanceCost;
  const netProfit = totalRevenue - totalOperationalCost;

  const totalDistance = trips.reduce((s, t) => s + (t.actualDistance || t.plannedDistance || 0), 0);
  const totalFuelLiters = fuelLogs.reduce((s, f) => s + (f.liters || 0), 0);
  const avgFuelEfficiency = totalFuelLiters > 0 ? Math.round((totalDistance / totalFuelLiters) * 100) / 100 : 0;

  // --- Per-vehicle ROI ---
  const vehicleROI = vehicles.map((v) => {
    const vid = v._id.toString();
    const vTrips = trips.filter((t) => t.vehicleId?.toString() === vid);
    const vRevenue = vTrips.reduce((s, t) => s + (t.revenue || 0), 0);
    const vFuel = fuelLogs.filter((f) => f.vehicleId?.toString() === vid).reduce((s, f) => s + (f.totalCost || 0), 0);
    const vMaint = maintenanceLogs.filter((m) => m.vehicleId?.toString() === vid).reduce((s, m) => s + (m.cost || 0), 0);
    const acqCost = v.acquisitionCost || 0;
    const roi = acqCost > 0 ? Math.round(((vRevenue - (vMaint + vFuel)) / acqCost) * 10000) / 100 : 0;

    return {
      _id: v._id,
      name: v.name,
      registrationNumber: v.registrationNumber,
      type: v.type,
      acquisitionCost: acqCost,
      revenue: vRevenue,
      fuelCost: vFuel,
      maintenanceCost: vMaint,
      totalCost: vFuel + vMaint,
      roi,
    };
  });

  // --- Revenue vs Operational Cost per completed trip (for BarChart) ---
  const completedTrips = trips
    .filter((t) => t.status === 'Completed' && t.revenue)
    .slice(-12)
    .map((t) => {
      const tid = t._id.toString();
      const tripFuel = fuelLogs.filter((f) => f.tripId?.toString() === tid).reduce((s, f) => s + (f.totalCost || 0), 0);
      return {
        trip: t.tripNumber,
        revenue: t.revenue || 0,
        cost: tripFuel,
      };
    });

  return res.status(200).json({
    kpis: {
      totalRevenue,
      totalFuelCost,
      totalMaintenanceCost,
      totalOperationalCost,
      netProfit,
      avgFuelEfficiency,
      totalTrips: trips.length,
      completedTrips: trips.filter((t) => t.status === 'Completed').length,
    },
    vehicleROI,
    tripChart: completedTrips,
  });
}
