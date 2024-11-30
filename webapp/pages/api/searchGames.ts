import { NextApiRequest, NextApiResponse } from 'next';
import { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 } from '../../src/lib/database';

const searchGames = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = req.query;  

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ message: 'Invalid search query' });
  }

  try {
    
    const query = `SELECT * FROM dim_game_info WHERE name LIKE ?`;

    
    const getConnection = async (node: any) => {
      try {
        await node.getConnection();
        return true;
      } catch (error) {
        console.error(`Error connecting to node:`, error);
        return false;
      }
    };

    const fetchGames = async (node: any, query: string) => {
      const [rows] = await node.execute(query, [`%${name}%`]);
      return rows;
    };

    
    const isNode2Available = await getConnection(replicaConnectionNode2);
    const isNode3Available = await getConnection(replicaConnectionNode3);

    let games = [];

    
    if (isNode2Available) {
      console.log("Querying Node 2 (Games < 2010)");
      games = await fetchGames(replicaConnectionNode2, query);
    } 
    
    else if (isNode3Available) {
      console.log("Node 2 down, querying Node 3 (Games >= 2010)");
      games = await fetchGames(replicaConnectionNode3, query);
    }
    else {
      console.log("Node 2 and Node 3 both unavailable, querying primary Node 1");
      games = await fetchGames(primaryConnectionNode1, query);
    }

    
    res.status(200).json({ games });
  } catch (error) {
    console.error('Error searching for games:', error);
    res.status(500).json({ message: 'Error searching for games', error: (error as Error).message });
  }
};

export default searchGames;