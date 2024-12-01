import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// Toggle connection flags
let enablePrimaryDB = true;
let enableReplica1DB = true;
let enableReplica2DB = true;

// Helper to create a no-op pool
const createNoOpPool = () => ({
    query: async () => {
        throw new Error('Database connection is disabled');
    },
    execute: async () => {
        throw new Error('Database connection is disabled');
    },
    end: async () => {},
    getConnection: async () => {
        throw new Error('Database connection is disabled');
    },
});

const primaryConnectionNode1 = enablePrimaryDB
    ? mysql.createPool({
        host: process.env.PRIMARY_DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    })
    : createNoOpPool();

const replicaConnectionNode2 = enableReplica1DB
    ? mysql.createPool({
        host: process.env.REPLICA1_DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    })
    : createNoOpPool();

const replicaConnectionNode3 = enableReplica2DB
    ? mysql.createPool({
        host: process.env.REPLICA2_DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    })
    : createNoOpPool();

export { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 };
