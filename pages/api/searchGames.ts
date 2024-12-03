import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '@/lib/database';
import { RowDataPacket, Connection } from 'mysql2/promise';  
import transactionManager from '@/lib/TransactionManager';
import { v4 as uuidv4 } from 'uuid';

const searchGames = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Game name is required.' });
  }

  const transactionId = uuidv4();

  try {
    let games: RowDataPacket[] = [];
    const query = `SELECT * FROM dim_game_info WHERE name LIKE ?`;

    
    const executeWithTransaction = async (connection: Connection, query: string, params: any[]) => {
      const isolationLevel = transactionManager.hasActiveTransactions() ? 'READ COMMITTED' : 'READ UNCOMMITTED';
      await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
      await connection.query('START TRANSACTION');

      try {
        transactionManager.startTransaction(transactionId);

        const [rows] = await connection.execute<RowDataPacket[]>(query, params);
        await connection.execute('COMMIT');
        return rows;
      } catch (err) {
        await connection.execute('ROLLBACK');
        console.error(`Transaction ${transactionId} failed:`, err);
        throw err;
      } finally {
        transactionManager.endTransaction(transactionId);
      }
    };

    
    const node2Connection = getConnection('replica1');
    if (node2Connection) {
      try {
        const rows = await executeWithTransaction(
          node2Connection,
          `${query} AND release_date < '2010-01-01'`,
          [`%${name}%`]
        );
        games = rows;
      } catch {
        console.warn('Replica Node 1 unavailable, skipping...');
      }
    }

    if (!node2Connection || games.length === 0) {
      const primaryConnection = getConnection('primary');
      if (primaryConnection) {
        const fallbackRows = await executeWithTransaction(
          primaryConnection,
          `${query} AND release_date < '2010-01-01'`,
          [`%${name}%`]
        );
        games = fallbackRows;
      }
    }

    const node3Connection = getConnection('replica2');
    if (node3Connection) {
      try {
        const rows = await executeWithTransaction(
          node3Connection,
          `${query} AND release_date >= '2010-01-01'`,
          [`%${name}%`]
        );
        games = [...games, ...rows];
      } catch {
        console.warn('Replica Node 2 unavailable, skipping...');
      }
    }

    if (!node3Connection) {
      const primaryConnection = getConnection('primary');
      if (primaryConnection) {
        const fallbackRows = await executeWithTransaction(
          primaryConnection,
          `${query} AND release_date >= '2010-01-01'`,
          [`%${name}%`]
        );
        games = [...games, ...fallbackRows];
      }
    }

    res.status(200).json({ games });
  } catch (error) {
    console.error(`Error fetching games in transaction ${transactionId}:`, error);
    res.status(500).json({ error: 'Failed to fetch games.' });
  }
};

export default searchGames;
