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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  return date.toISOString().split('T')[0];
};

const updateGame = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const gameData: Game = req.body;

  if (!gameData.game_id) {
    return res.status(400).json({ error: 'Game ID is required.' });
  }

  let formattedReleaseDate;
  try {
    formattedReleaseDate = formatDate(gameData.release_date);
  } catch {
    return res.status(400).json({ error: 'Invalid release date format.' });
  }

  const query = `
    UPDATE dim_game_info
    SET 
      name = ?, 
      detailed_description = ?, 
      release_date = ?, 
      required_age = ?, 
      price = ?, 
      estimated_owners_min = ?, 
      estimated_owners_max = ?, 
      dlc_count = ?, 
      achievements = ?, 
      packages = ?, 
      notes = ?
    WHERE game_id = ?
  `;

  try {
    const [result] = await primaryConnectionNode1.execute<RowDataPacket[]>(query, [
      gameData.name,
      gameData.detailed_description,
      formattedReleaseDate,
      gameData.required_age,
      gameData.price,
      gameData.estimated_owners_min,
      gameData.estimated_owners_max,
      gameData.dlc_count,
      gameData.achievements,
      JSON.stringify(gameData.packages),
      gameData.notes,
      gameData.game_id,
    ]);

    if ((result as RowDataPacket).affectedRows > 0) {
      return res.status(200).json({ message: 'Game updated successfully.' });
    } else {
      return res.status(404).json({ error: 'Game not found or no changes made.' });
    }
  } catch {
    console.error('Error updating game');
    return res.status(500).json({ error: 'Failed to update game.' });
  }
};

export default updateGame;