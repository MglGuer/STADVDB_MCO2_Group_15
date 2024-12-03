import { NextApiRequest, NextApiResponse } from 'next';
import { Pool, RowDataPacket } from 'mysql2/promise';
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
  const primaryConnection = await getConnection('primary');
  let replicaConnection: Pool | null = null;

  try {
    transactionManager.startTransaction(transactionId, 'primary');
    console.log(`Transaction ${transactionId} started on the primary connection.`);

    if (!primaryConnection) {
      console.log('Primary node not available. Attempting failover...');
      replicaConnection = (await getConnection('replica1')) || (await getConnection('replica2'));
      if (!replicaConnection) {
        throw new Error('No available replica nodes for failover.');
      }
      transactionManager.endTransaction(transactionId);
      transactionManager.startTransaction(transactionId, 'replica');
      console.log(`Transaction ${transactionId} switched to the replica connection.`);
    }

    // Set transaction isolation level on the active connection
    const activeConnection = primaryConnection || replicaConnection!;
    const isolationLevel = transactionManager.isOnlyTransaction(transactionId)
      ? 'SERIALIZABLE'
      : 'READ UNCOMMITTED';
    await activeConnection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
    console.log(`Transaction ${transactionId} started with isolation level: ${isolationLevel}`);

    if (!game_id || !name || !release_date || !price || !packages) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const parsedPackages = typeof packages === 'string' ? JSON.parse(packages) : packages;
    const checkQuery = 'SELECT COUNT(*) as count FROM dim_game_info WHERE game_id = ?';
    const [checkResult] = await activeConnection.execute<RowDataPacket[]>(checkQuery, [game_id]);

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

    await activeConnection.execute(insertQuery, values);
    await activeConnection.query('COMMIT');
    res.status(200).json({ message: 'Game added successfully.' });
  } catch (error) {
    console.error(`Error in transaction ${transactionId}:`, error as Error);

    try {
      // Rollback on the active connection
      if (primaryConnection) {
        await primaryConnection.query('ROLLBACK');
      }
      if (replicaConnection) {
        await replicaConnection.query('ROLLBACK');
      }
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }

    res.status(500).json({ message: 'Failed to add the game.', error: (error as Error).message });
  } finally {
    transactionManager.endTransaction(transactionId);
    console.log(`Transaction ${transactionId} ended.`);
  }
};

export default addGame;
