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
