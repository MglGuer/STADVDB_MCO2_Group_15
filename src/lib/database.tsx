import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connectionStatus = {
  primary: true,
  replica1: true,
  replica2: true,
};

function createConnection(host: string, port?: string): Pool {
  // If a port is specified, include it in the host string
  const connectionString = port ? `${host}:${port}` : host;
  return mysql.createPool({
    host: connectionString,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

// Define connection for production and local development with port configurations
const primaryConnection = createConnection(
  process.env.PRIMARY_DB_HOST!,
  process.env.PRIMARY_DB_PORT
);
const replica1Connection = createConnection(
  process.env.REPLICA1_DB_HOST!,
  process.env.REPLICA1_DB_PORT
);
const replica2Connection = createConnection(
  process.env.REPLICA2_DB_HOST!,
  process.env.REPLICA2_DB_PORT
);

function toggleConnection(node: 'primary' | 'replica1' | 'replica2', status: boolean) {
  connectionStatus[node] = status;
}

function getConnection(node: 'primary' | 'replica1' | 'replica2'): Pool | null {
  if (connectionStatus[node]) {
    switch (node) {
      case 'primary':
        return primaryConnection;
      case 'replica1':
        return replica1Connection;
      case 'replica2':
        return replica2Connection;
    }
  }
  return null; 
}

export { getConnection, toggleConnection };
