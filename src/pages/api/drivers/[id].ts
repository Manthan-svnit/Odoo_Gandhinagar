import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Driver from '@/models/Driver';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();
  const { id } = req.query;

  if (req.method === 'GET') {
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    return res.status(200).json(driver);
  }

  if (req.method === 'PUT') {
    if (!['fleet_manager', 'safety_officer'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, email, safetyScore, status } = req.body;
    
    let targetStatus = status !== undefined ? status : driver.status;
    let pendingSusp = driver.pendingSuspension || false;
    
    if (status !== undefined) {
      if (status === 'Suspended') {
        if (driver.status === 'On Trip') {
          targetStatus = 'On Trip';
          pendingSusp = true;
        } else {
          targetStatus = 'Suspended';
          pendingSusp = false;
        }
      } else {
        targetStatus = status;
        pendingSusp = false;
      }
    }
    
    Object.assign(driver, {
      name: name !== undefined ? name : driver.name,
      licenseNumber: licenseNumber !== undefined ? licenseNumber : driver.licenseNumber,
      licenseCategory: licenseCategory !== undefined ? licenseCategory : driver.licenseCategory,
      licenseExpiryDate: licenseExpiryDate !== undefined ? licenseExpiryDate : driver.licenseExpiryDate,
      contactNumber: contactNumber !== undefined ? contactNumber : driver.contactNumber,
      email: email !== undefined ? email : driver.email,
      safetyScore: safetyScore !== undefined ? safetyScore : driver.safetyScore,
      status: targetStatus,
      pendingSuspension: pendingSusp,
    });
    
    await driver.save();
    return res.status(200).json(driver);
  }

  if (req.method === 'DELETE') {
    if (!['fleet_manager'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status === 'On Trip') return res.status(400).json({ error: 'Cannot delete a driver that is On Trip' });
    await Driver.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Driver deleted' });
  }

  return res.status(405).end();
}
