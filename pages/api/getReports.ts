import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '@/lib/database'; 
import { RowDataPacket } from 'mysql2';

const getReports = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const reports = [];

    
    type NodeType = 'primary' | 'replica1' | 'replica2';

    const isAnyNodeEnabled = ['primary', 'replica1', 'replica2'].some((node) => getConnection(node as NodeType) !== null);
    if (!isAnyNodeEnabled) {
      return res.status(500).json({ message: 'All nodes are disabled. Cannot generate reports.' });
    }

    
    const fetchFromNode = async (query: string, yearCondition: string, node: 'primary' | 'replica1' | 'replica2') => {
      let data: RowDataPacket[] = [];

      
      const connection = getConnection(node);
      if (!connection) {
        console.warn(`Connection to ${node} is disabled, falling back to primary node.`);
        
        return await fetchFromNode(query, yearCondition, 'primary');
      }

      try {
        const [rows] = await connection.execute(query + yearCondition);
        data = rows as RowDataPacket[];
      } catch (error) {
        console.warn(`${node} unavailable for query: ${query}. Error: ${(error as Error).message}`);
        
        return await fetchFromNode(query, yearCondition, 'primary');
      }

      return data;
    };

    
    let query = `SELECT name, price FROM dim_game_info ORDER BY price DESC LIMIT 5`;
    const topPriceGames = await fetchFromNode(query, '', 'replica1'); 
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
    const topOwnersGames = await fetchFromNode(query, '', 'replica2'); 
    reports.push({
      title: 'Top 5 Games by Estimated Owners',
      data: topOwnersGames.map((game) => ({
        name: game.name,
        value: game.estimated_owners_max ? game.estimated_owners_max.toLocaleString() : 'N/A',
      })),
    });

    
    query = `SELECT name, price FROM dim_game_info ORDER BY price DESC LIMIT 5`;
    const expensiveGames = await fetchFromNode(query, '', 'replica1');
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
    const dlcGames = await fetchFromNode(query, '', 'replica2');
    reports.push({
      title: 'Top 5 Games by DLC Count',
      data: dlcGames.map((game) => ({
        name: game.name,
        value: game.dlc_count ? game.dlc_count : 'N/A',
      })),
    });

    
    query = `SELECT name, achievements FROM dim_game_info ORDER BY achievements DESC LIMIT 5`;
    const achievementsGames = await fetchFromNode(query, '', 'replica1');
    reports.push({
      title: 'Top 5 Games by Achievements',
      data: achievementsGames.map((game) => ({
        name: game.name,
        value: game.achievements ? game.achievements : 'N/A',
      })),
    });

    return res.status(200).json({ reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

export default getReports;
