import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { checkAndSendExpiryReminders } from '@/lib/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const role = (session.user as any).role;
  if (!['fleet_manager', 'safety_officer'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'POST') {
    try {
      const result = await checkAndSendExpiryReminders();
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  return res.status(405).end();
}
