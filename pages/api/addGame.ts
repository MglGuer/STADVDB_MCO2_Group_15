import { NextApiRequest, NextApiResponse } from 'next';
import { RowDataPacket } from 'mysql2';
import { getConnection } from '@/lib/database';
import transactionManager from '@/lib/TransactionManager'; 
import { v4 as uuidv4 } from 'uuid'; 

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

  const transactionId = uuidv4();

  let primaryConnection;

  try {
    
    transactionManager.startTransaction(transactionId);
    console.log(`Transaction ${transactionId} started.`);

    primaryConnection = getConnection('primary');
    if (!primaryConnection) {
      throw new Error('Primary node is not connected.');
    }

    const isolationLevel = transactionManager.isOnlyTransaction(transactionId) ? 'READ COMMITTED' : 'READ UNCOMMITTED';
    await primaryConnection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
    console.log(`Transaction ${transactionId} started with isolation level: ${isolationLevel}`);

    
    if (!game_id || !name || !release_date || !price || !packages) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const parsedPackages = typeof packages === 'string' ? JSON.parse(packages) : packages;

    
    const checkQuery = 'SELECT COUNT(*) as count FROM dim_game_info WHERE game_id = ?';
    const [checkResult] = await primaryConnection.execute<RowDataPacket[]>(checkQuery, [game_id]);

    if (checkResult[0].count > 0) {
      return res.status(400).json({ message: 'Game ID already exists.' });
    }

    
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

    await primaryConnection.execute(insertQuery, values);

    
    await primaryConnection.query('COMMIT');
    res.status(200).json({ message: 'Game added successfully.' });
  } catch (error) {
    console.error(`Error in transaction ${transactionId}:`, error);

    
    if (primaryConnection) {
      await primaryConnection.query('ROLLBACK');
    }

    res.status(500).json({ message: 'Failed to add the game.' });
  } finally {
    
    transactionManager.endTransaction(transactionId);
    console.log(`Transaction ${transactionId} ended.`);
  }
};

export default addGame;
