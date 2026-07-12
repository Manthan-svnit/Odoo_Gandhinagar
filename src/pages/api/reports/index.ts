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
    Vehicle.find(),
    Trip.find({ status: 'Completed' }),
    FuelLog.find(),
    MaintenanceLog.find(),
  ]);

  const totalFuel = fuelLogs.reduce((s, f) => s + f.totalCost, 0);
  const totalMaint = maintenanceLogs.reduce((s, m) => s + m.cost, 0);
  const totalRevenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);

  const totalDistance = trips.reduce((s, t) => s + (t.actualDistance || t.plannedDistance), 0);
  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const fuelEfficiency = totalLiters > 0 ? +(totalDistance / totalLiters).toFixed(2) : 0;

  const activeVehicles = vehicles.filter((v) => v.status !== 'Retired').length;
  const totalVehicles = vehicles.length;
  const fleetUtilization = totalVehicles > 0 ? Math.round(((totalVehicles - vehicles.filter(v => v.status === 'Available').length) / totalVehicles) * 100) : 0;

  const vehicleROI = vehicles.map((v) => {
    const vFuel = fuelLogs.filter((f) => f.vehicleId.toString() === v._id.toString()).reduce((s, f) => s + f.totalCost, 0);
    const vMaint = maintenanceLogs.filter((m) => m.vehicleId.toString() === v._id.toString()).reduce((s, m) => s + m.cost, 0);
    const vRevenue = trips.filter((t) => t.vehicleId.toString() === v._id.toString()).reduce((s, t) => s + (t.revenue || 0), 0);
    const roi = v.acquisitionCost > 0 ? +((vRevenue - (vMaint + vFuel)) / v.acquisitionCost * 100).toFixed(2) : 0;
    const totalCost = vFuel + vMaint;
    return { _id: v._id, name: v.name, registrationNumber: v.registrationNumber, totalCost, roi, vRevenue, vFuel, vMaint };
  });

  const monthlyRevenue = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (7 - i));
    const month = d.toLocaleString('default', { month: 'short' });
    const rev = trips
      .filter((t) => {
        const td = new Date(t.completedAt || t.createdAt);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      })
      .reduce((s, t) => s + (t.revenue || 0), 0);
    return { month, revenue: rev };
  });

  return res.status(200).json({
    fuelEfficiency,
    fleetUtilization,
    operationalCost: totalFuel + totalMaint,
    vehicleROI: +((totalRevenue - (totalMaint + totalFuel)) / (vehicles.reduce((s, v) => s + v.acquisitionCost, 0) || 1) * 100).toFixed(2),
    vehicleROIList: vehicleROI,
    monthlyRevenue,
    topCostlyVehicles: vehicleROI.sort((a, b) => b.totalCost - a.totalCost).slice(0, 5),
  });
}
