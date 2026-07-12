import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectDB } from '@/lib/db';
import Expense from '@/models/Expense';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });
  const role = (session.user as any).role;

  await connectDB();

  if (req.method === 'GET') {
    const expenses = await Expense.find()
      .sort({ date: -1 })
      .populate('vehicleId', 'name registrationNumber')
      .populate('tripId', 'tripNumber');
    return res.status(200).json(expenses);
  }

  if (req.method === 'POST') {
    if (!['fleet_manager', 'financial_analyst'].includes(role)) return res.status(403).json({ error: 'Forbidden' });
    const { vehicleId, tripId, category, amount, description, date } = req.body;
    if (!category || amount == null) return res.status(400).json({ error: 'Missing required fields' });
    const expense = await Expense.create({ vehicleId, tripId, category, amount, description, date: date || new Date() });
    return res.status(201).json(expense);
  }

  return res.status(405).end();
}
