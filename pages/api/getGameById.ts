import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 } from '@/lib/database';
import { RowDataPacket } from 'mysql2';

const getGameById = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid or missing game ID' });
  }

  const query = `SELECT * FROM dim_game_info WHERE game_id = ?`;

  let connection;
  try {
    
    connection = await primaryConnectionNode1.getConnection();
    await connection.query('SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
    
    
    await connection.beginTransaction();

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
        const [rowsFromNode2] = await replicaConnectionNode2.execute<RowDataPacket[]>(query, [id]);
        if (rowsFromNode2.length > 0) {
          game = rowsFromNode2[0];
          gameFound = true;
        }
      } catch {
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
      } catch {
        console.warn('Node 3 unavailable for 2010+ games, falling back to Node 1.');
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
    console.error(error);
    return res.status(500).json({ message: 'Failed to fetch game by ID' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export default getGameById;