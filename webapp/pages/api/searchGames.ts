import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 } from '@/lib/database';

const searchGames = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Game name is required.' });
  }

  try {
    let games = [];

    
    let query = `SELECT * FROM dim_game_info WHERE name LIKE ?`;
    const searchPattern = `%${name}%`;

    
    try {
      const [rows] = await replicaConnectionNode2.execute(
        `${query} AND release_date < '2010-01-01'`,
        [searchPattern]
      );
      games = rows as any[];
    } catch (error) {
      console.warn('Node 2 unavailable, falling back to Node 1 for pre-2010 games.');
      
      const [fallbackRows] = await primaryConnectionNode1.execute(
        `${query} AND release_date < '2010-01-01'`,
        [searchPattern]
      );
      games = fallbackRows as any[];
    }

    
    try {
      const [rows] = await replicaConnectionNode3.execute(
        `${query} AND release_date >= '2010-01-01'`,
        [searchPattern]
      );
      games = [...games, ...(rows as any[])]; 
    } catch (error) {
      console.warn('Node 3 unavailable, falling back to Node 1 for 2010+ games.');
      
      const [fallbackRows] = await primaryConnectionNode1.execute(
        `${query} AND release_date >= '2010-01-01'`,
        [searchPattern]
      );
      games = [...games, ...(fallbackRows as any[])];
    }

    res.status(200).json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
};

export default searchGames;