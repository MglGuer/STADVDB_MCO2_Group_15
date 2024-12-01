import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 } from '@/lib/database';
import { RowDataPacket } from 'mysql2';

const searchGames = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Game name is required.' });
  }

  try {
    let games: RowDataPacket[] = [];

    const query = `SELECT * FROM dim_game_info WHERE name LIKE ?`;

    try {
      const [rows] = await replicaConnectionNode2.execute<RowDataPacket[]>(
        `${query} AND release_date < '2010-01-01'`,
        [`%${name}%`]
      );
      games = rows;
    } catch {
      console.warn('Node 2 unavailable, falling back to Node 1 for pre-2010 games.');
      const [fallbackRows] = await primaryConnectionNode1.execute<RowDataPacket[]>(
        `${query} AND release_date < '2010-01-01'`,
        [`%${name}%`]
      );
      games = fallbackRows;
    }

    try {
      const [rows] = await replicaConnectionNode3.execute<RowDataPacket[]>(
        `${query} AND release_date >= '2010-01-01'`,
        [`%${name}%`]
      );
      games = [...games, ...rows];
    } catch {
      console.warn('Node 3 unavailable, falling back to Node 1 for 2010+ games.');
      const [fallbackRows] = await primaryConnectionNode1.execute<RowDataPacket[]>(
        `${query} AND release_date >= '2010-01-01'`,
        [`%${name}%`]
      );
      games = [...games, ...fallbackRows];
    }

    res.status(200).json({ games });
  } catch {
    console.error('Error fetching games');
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
};

export default searchGames;
