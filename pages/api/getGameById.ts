
import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '../../src/lib/database';
import transactionManager from '../../src/lib/TransactionManager'; 
import { RowDataPacket } from 'mysql2';
import { v4 as uuidv4 } from 'uuid'; 

const getGameById = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid or missing game ID' });
  }

  const transactionId = uuidv4(); 

  let connection;
  try {
    
    transactionManager.startTransaction(transactionId);

    connection = await getConnection('primary')?.getConnection();
    if (!connection) {
      return res.status(500).json({ message: 'Primary database unavailable' });
    }

    
    const isolationLevel = transactionManager.hasActiveTransactions() ? 'READ COMMITTED' : 'READ UNCOMMITTED';
    await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
    console.log(`Transaction ${transactionId} started with isolation level: ${isolationLevel}`);

    await connection.beginTransaction();

    
    const query = `SELECT * FROM dim_game_info WHERE game_id = ?`;
    const [rows] = await connection.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Game not found' });
    }

    const releaseDate = rows[0].release_date;
    let game = rows[0];
    let gameFound = false;

    
    if (releaseDate && new Date(releaseDate) < new Date('2010-01-01')) {
      try {
        const [rowsFromNode2] = await getConnection('replica1')?.execute<RowDataPacket[]>(query, [id]) ?? [[], []];
        if (rowsFromNode2.length > 0) {
          game = rowsFromNode2[0];
          gameFound = true;
        }
      } catch {
        console.warn('Node 2 unavailable for pre-2010 games, attempting Node 3.');
      }

      if (!gameFound) {
        try {
          const [rowsFromNode3] = await getConnection('replica2')?.execute<RowDataPacket[]>(query, [id]) ?? [[], []];
          if (rowsFromNode3.length > 0) {
            game = rowsFromNode3[0];
            gameFound = true;
          }
        } catch {
          console.warn('Node 3 unavailable for pre-2010 games, falling back to Node 1.');
        }
      }
    }

    if (!gameFound && releaseDate && new Date(releaseDate) >= new Date('2010-01-01')) {
      try {
        const [rowsFromNode3] = await getConnection('replica2')?.execute<RowDataPacket[]>(query, [id]) ?? [[], []];
        if (rowsFromNode3.length > 0) {
          game = rowsFromNode3[0];
          gameFound = true;
        }
      } catch {
        console.warn('Node 3 unavailable for 2010+ games, attempting Node 2.');
      }

      if (!gameFound) {
        try {
          const [rowsFromNode2] = await getConnection('replica1')?.execute<RowDataPacket[]>(query, [id]) ?? [[], []];
          if (rowsFromNode2.length > 0) {
            game = rowsFromNode2[0];
            gameFound = true;
          }
        } catch {
          console.warn('Node 2 unavailable for 2010+ games, falling back to Node 1.');
        }
      }
    }

    
    if (!gameFound) {
      const [rowsFromNode1] = await getConnection('primary')?.execute<RowDataPacket[]>(query, [id]) ?? [[], []];
      if (rowsFromNode1.length > 0) {
        game = rowsFromNode1[0];
        gameFound = true;
      }
    }

    if (gameFound) {
      await connection.commit();
      return res.status(200).json({ game });
    } else {
      await connection.rollback();
      return res.status(404).json({ message: 'Game not found' });
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error(`Error in transaction ${transactionId}:`, error);
    return res.status(500).json({ message: 'Failed to fetch game by ID' });
  } finally {
    
    transactionManager.endTransaction(transactionId);
    if (connection) {
      connection.release();
    }
    console.log(`Transaction ${transactionId} ended.`);
  }
};

export default getGameById;
