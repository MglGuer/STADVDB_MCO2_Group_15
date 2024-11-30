import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1 } from '../../src/lib/database';

const searchGames = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.query;  

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ message: 'Invalid search query' });
  }

  try {
    
    const [rows] = await primaryConnectionNode1.execute(
      'SELECT * FROM dim_game_info WHERE name LIKE ?',
      [`%${name}%`]
    );

    
    res.status(200).json({ games: rows });
  } catch (error) {
    console.error('Error searching for games:', error);
    res.status(500).json({ message: 'Error searching for games', error: (error as Error).message });
  }
};

export default searchGames;