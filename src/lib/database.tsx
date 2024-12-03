import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();


const connectionStatus = {
  primary: true,
  replica1: true,
  replica2: true,
};


function createConnection(host: string): Pool {
  return mysql.createPool({
    host,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}


const primaryConnection = createConnection(process.env.PRIMARY_DB_HOST!);
const replica1Connection = createConnection(process.env.REPLICA1_DB_HOST!);
const replica2Connection = createConnection(process.env.REPLICA2_DB_HOST!);


function toggleConnection(node: 'primary' | 'replica1' | 'replica2', status: boolean) {
  connectionStatus[node] = status;
}


async function getConnection(node: 'primary' | 'replica1' | 'replica2'): Promise<Pool | null> {
  if (connectionStatus[node]) {
    const connection = node === 'primary' ? primaryConnection :
                      node === 'replica1' ? replica1Connection :
                      replica2Connection;

    try {
      // Test the connection by querying a simple operation
      const [rows] = await connection.query('SELECT 1');
      if (rows) {
        return connection;
      } else {
        throw new Error('Connection validation failed.');
      }
    } catch (error) {
      console.error(`Connection to ${node} is not healthy:`, error);
      connectionStatus[node] = false;
      return null;
    }
  }
  return null;
}


function simulateFailure(node: 'primary' | 'replica1' | 'replica2') {
  toggleConnection(node, false);
  console.log(`Simulated failure: ${node} is now offline.`);
}

function simulateRecovery(node: 'primary' | 'replica1' | 'replica2') {
  toggleConnection(node, true);
  console.log(`Simulated recovery: ${node} is now online.`);
}

export { getConnection, toggleConnection, simulateFailure, simulateRecovery};