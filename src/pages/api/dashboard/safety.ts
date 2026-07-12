import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Driver from '@/models/Driver';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  await connectDB();

  const drivers = await Driver.find().lean();

  const activeDrivers = drivers.filter((d) => d.status !== 'Suspended').length;
  const suspendedDrivers = drivers.filter((d) => d.status === 'Suspended').length;

  const avgSafetyScore =
    drivers.length > 0
      ? Math.round(drivers.reduce((sum, d) => sum + (d.safetyScore ?? 0), 0) / drivers.length)
      : 0;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const licenseAlerts = drivers
    .filter((d) => {
      const expiry = new Date(d.licenseExpiryDate);
      return expiry <= thirtyDaysFromNow;
    })
    .map((d) => {
      const expiry = new Date(d.licenseExpiryDate);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        _id: d._id,
        name: d.name,
        licenseNumber: d.licenseNumber,
        licenseCategory: d.licenseCategory,
        licenseExpiryDate: d.licenseExpiryDate,
        status: d.status,
        safetyScore: d.safetyScore,
        daysLeft,
        severity: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'critical' : 'warning',
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const complianceTable = drivers.map((d) => ({
    _id: d._id,
    name: d.name,
    licenseNumber: d.licenseNumber,
    licenseCategory: d.licenseCategory,
    licenseExpiryDate: d.licenseExpiryDate,
    contactNumber: d.contactNumber,
    email: d.email,
    safetyScore: d.safetyScore,
    tripsCompleted: d.tripsCompleted,
    status: d.status,
  }));

  return res.status(200).json({
    kpis: { activeDrivers, suspendedDrivers, avgSafetyScore, totalDrivers: drivers.length },
    licenseAlerts,
    complianceTable,
  });
}
