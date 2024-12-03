import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '@/lib/database';

const checkConnection = async (req: NextApiRequest, res: NextApiResponse) => {
  const nodes: Array<'primary' | 'replica1' | 'replica2'> = ['primary', 'replica1', 'replica2'];
  const statusReport: { [key: string]: string } = {};

  for (const node of nodes) {
    const connection = await getConnection(node);
    if (connection) {
      statusReport[node] = 'Connected';
    } else {
      statusReport[node] = 'Disconnected';
    }
  }

  res.status(200).json({ message: 'Connection status retrieved', statusReport });
};

export default checkConnection;
