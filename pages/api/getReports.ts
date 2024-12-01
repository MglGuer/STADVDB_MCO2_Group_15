import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 } from '@/lib/database';
import { RowDataPacket } from 'mysql2';

const getReports = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const reports = [];

    
    const fetchFromNode = async (query: string, yearCondition: string) => {
      let data: RowDataPacket[] = []; 

      
      let connection;
      try {
        connection = await primaryConnectionNode1.getConnection();

        await connection.execute('SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
        await connection.beginTransaction();
        
        try {
          const [rows] = await replicaConnectionNode2.execute(query + yearCondition);
          data = rows as RowDataPacket[];
        } catch {
          console.warn('Node 2 unavailable, falling back to Node 1 for year condition:', yearCondition);
          const [fallbackRows] = await primaryConnectionNode1.execute(query + yearCondition);
          data = fallbackRows as RowDataPacket[];
        }

        
        if (yearCondition === ">= '2010-01-01'") {
          try {
            const [rows] = await replicaConnectionNode3.execute(query + yearCondition);
            data = rows as RowDataPacket[];
          } catch {
            console.warn('Node 3 unavailable, falling back to Node 1 for year condition:', yearCondition);
            const [fallbackRows] = await primaryConnectionNode1.execute(query + yearCondition);
            data = fallbackRows as RowDataPacket[];
          }
        }

        await connection.commit();
      } catch (error) {
        if (connection) {
          await connection.rollback();
        }
        console.error('Error fetching data:', error);
      } finally {
        if (connection) {
          connection.release();
        }
      }

      return data;
    };

    
    let query = `SELECT name, price FROM dim_game_info ORDER BY price DESC LIMIT 5`;
    const topPriceGames = await fetchFromNode(query, '');
    reports.push({
      title: 'Top 5 Games by Price',
      data: topPriceGames.map((game) => ({
        name: game.name,
        value: game.price && !isNaN(parseFloat(game.price)) 
          ? `$${parseFloat(game.price).toFixed(2)}`  
          : 'N/A',  
      })),
    });

    
    query = `SELECT name, estimated_owners_max FROM dim_game_info ORDER BY estimated_owners_max DESC LIMIT 5`;
    const topOwnersGames = await fetchFromNode(query, '');
    reports.push({
      title: 'Top 5 Games by Estimated Owners',
      data: topOwnersGames.map((game) => ({
        name: game.name,
        value: game.estimated_owners_max ? game.estimated_owners_max.toLocaleString() : 'N/A', 
      })),
    });

    
    query = `SELECT name, price FROM dim_game_info ORDER BY price DESC LIMIT 5`;
    const expensiveGames = await fetchFromNode(query, '');
    reports.push({
      title: 'Top 5 Most Expensive Games',
      data: expensiveGames.map((game) => ({
        name: game.name,
        value: game.price && !isNaN(parseFloat(game.price)) 
          ? `$${parseFloat(game.price).toFixed(2)}`  
          : 'N/A',  
      })),
    });

    
    query = `SELECT name, dlc_count FROM dim_game_info ORDER BY dlc_count DESC LIMIT 5`;
    const dlcGames = await fetchFromNode(query, '');
    reports.push({
      title: 'Top 5 Games by DLC Count',
      data: dlcGames.map((game) => ({
        name: game.name,
        value: game.dlc_count ? game.dlc_count : 'N/A', 
      })),
    });

    
    query = `SELECT name, achievements FROM dim_game_info ORDER BY achievements DESC LIMIT 5`;
    const achievementsGames = await fetchFromNode(query, '');
    reports.push({
      title: 'Top 5 Games by Achievements',
      data: achievementsGames.map((game) => ({
        name: game.name,
        value: game.achievements ? game.achievements : 'N/A', 
      })),
    });

    return res.status(200).json({ reports });
  } catch {
    return res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

export default getReports;