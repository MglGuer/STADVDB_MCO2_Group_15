
import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 } from '../../src/lib/database';

const checkConnection = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    
    await primaryConnectionNode1.getConnection();
    await replicaConnectionNode2.getConnection();
    await replicaConnectionNode3.getConnection();
    
    
    res.status(200).json({ message: 'Database connected successfully!' });
  } catch (error) {
    
    console.error('Error connecting to the database:', error);
    res.status(500).json({ message: 'Failed to connect to the database', error: (error as Error).message });
  }
};

export default checkConnection;