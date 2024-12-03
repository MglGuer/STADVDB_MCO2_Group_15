import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 } from '@/lib/database';
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

  
  let game;
  const query = `SELECT * FROM dim_game_info WHERE game_id = ?`;
  
  try {
    
    let releaseDate;
    const [rows] = await primaryConnectionNode1.execute<RowDataPacket[]>(query, [id]);
    
    if (rows.length > 0) {
      releaseDate = rows[0].release_date;
    } else {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    let gameFound = false;

    
    if (releaseDate && new Date(releaseDate) < new Date('2010-01-01')) {
      try {
        const [rowsFromNode2] = await replicaConnectionNode2.execute<RowDataPacket[]>(query, [id]);
        if (rowsFromNode2.length > 0) {
          game = rowsFromNode2[0];
          gameFound = true;
        }
      } catch (error) {
        console.warn('Node 2 unavailable for pre-2010 games, falling back to Node 1.');
      }
    }

    
    if (!gameFound) {
      const [rowsFromNode1] = await primaryConnectionNode1.execute<RowDataPacket[]>(query, [id]);
      if (rowsFromNode1.length > 0) {
        game = rowsFromNode1[0];
        gameFound = true;
      }
    }

    
    if (releaseDate && new Date(releaseDate) >= new Date('2010-01-01')) {
      try {
        const [rowsFromNode3] = await replicaConnectionNode3.execute<RowDataPacket[]>(query, [id]);
        if (rowsFromNode3.length > 0) {
          game = rowsFromNode3[0];
          gameFound = true;
        }
      } catch (error) {
        console.warn('Node 3 unavailable for 2010+ games, falling back to Node 1.');
      }
    }

    
    if (gameFound) {
      return res.status(200).json({ game });
    } else {
      return res.status(404).json({ message: 'Game not found' });
    }
  } catch (error) {
    console.error('Error fetching game by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch game by ID' });
  }
};

export default getGameById;