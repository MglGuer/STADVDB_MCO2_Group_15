import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1 } from '@/lib/database';  
import { RowDataPacket } from 'mysql2';

interface Game {
  game_id: number;
  name: string;
  detailed_description: string;
  release_date: string;
  required_age: string;
  price: number;
  estimated_owners_min: number;
  estimated_owners_max: number;
  dlc_count: number;
  achievements: number;
  packages: string; 
  notes: string;
}

const getGameById = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;  

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid or missing game ID' });
  }

  const query = `SELECT * FROM dim_game_info WHERE game_id = ?`;

  try {
    const [rows] = await primaryConnectionNode1.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    return res.status(200).json({ game: rows[0] });
  } catch (error) {
    console.error('Error fetching game by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch game by ID' });
  }
};

export default getGameById;