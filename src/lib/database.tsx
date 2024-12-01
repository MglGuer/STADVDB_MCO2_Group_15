import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const primaryConnectionNode1 = mysql.createPool({
    host: process.env.PRIMARY_DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const replicaConnectionNode2 = mysql.createPool({
    host: process.env.REPLICA1_DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

const replicaConnectionNode3 = mysql.createPool({
    host: process.env.REPLICA2_DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export { primaryConnectionNode1, replicaConnectionNode2, replicaConnectionNode3 };
