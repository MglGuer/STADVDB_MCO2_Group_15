import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import transactionManager from '@/lib/TransactionManager'; 
export const maxDuration = 25;

const getReports = async (req: NextApiRequest, res: NextApiResponse) => {
  const reports = [];
  type NodeType = 'primary' | 'replica1' | 'replica2';

  const fetchDataByYear = async (
    query: string,
    dateCondition: string,
    preferredNode: NodeType,
    fallbackNode: NodeType
  ): Promise<RowDataPacket[]> => {
    const nodes = [preferredNode, fallbackNode, 'primary'];
    let lastError: Error | null = null;
    

    for (const node of nodes) {
      const connection = getConnection(node as 'primary' | 'replica1' | 'replica2');
      if (connection) {
        try {
          
          const isolationLevel = transactionManager.hasActiveTransactions() ? 'READ COMMITTED' : 'READ UNCOMMITTED';
          console.log(`Starting read Transaction on node ${node} using ${isolationLevel} isolaton.`);
          await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
          await connection.query('START TRANSACTION');
          
          const [rows] = await connection.execute(`${query} ${dateCondition}`);
          
          await connection.query('COMMIT'); 
          return rows as RowDataPacket[];
        } catch (error: unknown) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          console.warn(`Error fetching from ${node}: ${lastError.message}`);
          
          await connection.query('ROLLBACK'); 
        } finally {
          console.log(`Transaction ended on node ${node}.`);
        }
      }
    }

    console.error('All nodes failed for the query:', lastError);
    return [];
  };

  const assembleData = async (
    query: string,
    dateConditionNode2: string,
    dateConditionNode3: string
  ): Promise<RowDataPacket[]> => {
    const dataNode2 = await fetchDataByYear(query, dateConditionNode2, 'replica1', 'primary');
    const dataNode3 = await fetchDataByYear(query, dateConditionNode3, 'replica2', 'primary');
    
    return [...dataNode2, ...dataNode3];
  };
  const reportConfigs = [
    {
      title: 'Top 5 Games by Price',
      query: `SELECT name, price FROM dim_game_info`,
      dateConditionNode2: `WHERE release_date < '2010-01-01'`,
      dateConditionNode3: `WHERE release_date >= '2010-01-01'`,
      sortField: 'price',
      format: (row: RowDataPacket) => ({
        name: row.name,
        value: row.price && !isNaN(parseFloat(row.price))
          ? `$${parseFloat(row.price).toFixed(2)}`
          : 'N/A',
      }),
    },
    {
      title: 'Top 5 Games by Estimated Owners',
      query: `SELECT name, estimated_owners_max FROM dim_game_info`,
      dateConditionNode2: `WHERE release_date < '2010-01-01'`,
      dateConditionNode3: `WHERE release_date >= '2010-01-01'`,
      sortField: 'estimated_owners_max',
      format: (row: RowDataPacket) => ({
        name: row.name,
        value: row.estimated_owners_max
          ? row.estimated_owners_max.toLocaleString()
          : 'N/A',
      }),
    },
    {
      title: 'Top 5 Games by DLC Count',
      query: `SELECT name, dlc_count FROM dim_game_info`,
      dateConditionNode2: `WHERE release_date < '2010-01-01'`,
      dateConditionNode3: `WHERE release_date >= '2010-01-01'`,
      sortField: 'dlc_count',
      format: (row: RowDataPacket) => ({
        name: row.name,
        value: row.dlc_count ? row.dlc_count : 'N/A',
      }),
    },
  ];

  for (const {
    title,
    query,
    dateConditionNode2,
    dateConditionNode3,
    sortField,
    format,
  } of reportConfigs) {
    try {
      const combinedData = await assembleData(query, dateConditionNode2, dateConditionNode3);

      if (combinedData.length === 0) {
        reports.push({
          title,
          data: [{ name: 'No data available', value: 'N/A' }],
        });
      } else {
        const sortedData = combinedData.sort((a, b) => {
          if (a[sortField] > b[sortField]) return -1;
          if (a[sortField] < b[sortField]) return 1;
          return 0;
        });

        const top5Data = sortedData.slice(0, 5);
        reports.push({
          title,
          data: top5Data.map(format),
        });
      }
    } catch (error) {
      console.error(`Failed to fetch report "${title}":`, error);
      reports.push({
        title,
        data: [{ name: 'Error fetching data', value: 'N/A' }],
      });
    }
  }

  return res.status(200).json({ reports });
};

export default getReports;