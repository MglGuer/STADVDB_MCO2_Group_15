import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '@/lib/database'; 

const checkConnection = async (req: NextApiRequest, res: NextApiResponse) => {
  
  const nodes: Array<'primary' | 'replica1' | 'replica2'> = ['primary', 'replica1', 'replica2'];
  const statusReport: { [key: string]: string } = {};

  try {
    for (const node of nodes) {
      const connection = getConnection(node);  

      if (connection) {
        try {
          await connection.getConnection(); 
          statusReport[node] = 'Connected';
        } catch (err) {
          statusReport[node] = 'Connection failed';
        }
      } else {
        statusReport[node] = 'Disabled'; 
      }
    }

    res.status(200).json({ message: 'Connection status retrieved', statusReport });
  } catch (error) {
    console.error('Error checking connections:', error);
    res.status(500).json({ message: 'Failed to check connections', error: (error as Error).message });
  }
};

export default checkConnection;