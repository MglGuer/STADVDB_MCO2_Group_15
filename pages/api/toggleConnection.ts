import { NextApiRequest, NextApiResponse } from 'next';
import { toggleConnection } from '@/lib/database'; 

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { node, status } = req.body;

    if (!node || typeof status !== 'boolean') {
      return res.status(400).json({ error: 'Invalid input' });
    }

    toggleConnection(node, status); 
    res.status(200).json({ message: `${node} connection ${status ? 'enabled' : 'disabled'}` });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
