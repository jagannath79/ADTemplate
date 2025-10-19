import { config as loadEnv } from 'dotenv';
import sql from 'mssql';

loadEnv();

const getBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

const sqlConfig: sql.config = {
  server: process.env.SQL_SERVER ?? 'localhost',
  database: process.env.SQL_DATABASE ?? 'AutomationDB',
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  port: process.env.SQL_PORT ? Number.parseInt(process.env.SQL_PORT, 10) : undefined,
  options: {
    encrypt: getBoolean(process.env.SQL_ENCRYPT, false),
    trustServerCertificate: getBoolean(process.env.SQL_TRUST_CERT, true),
    enableArithAbort: true
  }
};

let pool: sql.ConnectionPool | null = null;

export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    pool = await sql.connect(sqlConfig);
  }
  return pool;
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.close();
    pool = null;
  }
};
