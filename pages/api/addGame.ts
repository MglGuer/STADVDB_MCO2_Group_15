import { NextApiRequest, NextApiResponse } from 'next';
import { RowDataPacket } from 'mysql2';
import { primaryConnectionNode1 } from '@/lib/database';

const addGame = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    game_id,
    name,
    detailed_description,
    release_date,
    required_age,
    price,
    estimated_owners_min,
    estimated_owners_max,
    dlc_count,
    achievements,
    packages,
    notes,
  } = req.body;

  try {
    // Validate input
    if (!game_id || !name || !release_date || !price || !packages) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const parsedPackages = typeof packages === 'string' ? JSON.parse(packages) : packages;

    // Check if game_id already exists
    const checkQuery = 'SELECT COUNT(*) as count FROM dim_game_info WHERE game_id = ?';
    const [checkResult] = await primaryConnectionNode1.execute<RowDataPacket[]>(checkQuery, [game_id]);
    
    if (checkResult[0].count > 0) {
      return res.status(400).json({ message: 'Game ID already exists.' });
    }

    // Insert query
    const insertQuery = `
      INSERT INTO dim_game_info 
      (game_id, name, detailed_description, release_date, required_age, price, estimated_owners_min, estimated_owners_max, dlc_count, achievements, packages, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      game_id,
      name,
      detailed_description,
      release_date,
      required_age,
      price,
      estimated_owners_min,
      estimated_owners_max,
      dlc_count,
      achievements,
      JSON.stringify(parsedPackages),
      notes,
    ];

    await primaryConnectionNode1.execute(insertQuery, values);
    return res.status(200).json({ message: 'Game added successfully.' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Failed to add the game.' });
  }
};

export default addGame;