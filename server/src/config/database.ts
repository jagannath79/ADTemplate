// server/src/database.ts
import sql, { type config as SqlConfig, type ConnectionPool } from 'mssql';

/** strict boolean parser */
function asBool(v: string | undefined, fallback: boolean): boolean {
  if (v == null) return fallback;
  const s = v.toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'no', 'n'].includes(s)) return false;
  return fallback;
}

/** read first defined env among provided names (do not trim; we want to detect empty) */
function pick(...names: string[]): string | undefined {
  for (const n of names) {
    if (Object.prototype.hasOwnProperty.call(process.env, n)) return process.env[n];
  }
  return undefined;
}

/** Gather config from env (supports DB_* and SQL_* names) */
const SERVER   = pick('DB_SERVER', 'SQL_SERVER');
const DATABASE = pick('DB_NAME', 'SQL_DATABASE');
const USER     = pick('DB_USER', 'SQL_USER');
const PASSWORD = pick('DB_PASSWORD', 'SQL_PASSWORD');
const PORT_STR = pick('DB_PORT', 'SQL_PORT');          // optional
const INSTANCE = pick('DB_INSTANCE', 'SQL_INSTANCE');  // optional
const ENCRYPT  = asBool(pick('DB_ENCRYPT', 'SQL_ENCRYPT'), false);
const TRUST    = asBool(pick('DB_TRUST_CERT', 'SQL_TRUST_CERT'), true);

/** Fail fast if critical values are missing/empty */
function req(name: string, val: string | undefined) {
  if (val == null || val.trim() === '') {
    throw new Error(`${name} is required but was not provided (check server/.env and dotenv load order).`);
  }
}
req('DB_SERVER/SQL_SERVER', SERVER);
req('DB_NAME/SQL_DATABASE', DATABASE);
req('DB_USER/SQL_USER', USER);
req('DB_PASSWORD/SQL_PASSWORD', PASSWORD);

const PORT =
  PORT_STR && PORT_STR.trim() !== '' ? Number.parseInt(PORT_STR, 10) : undefined;
if (PORT_STR && Number.isNaN(PORT)) {
  throw new Error(`DB_PORT/SQL_PORT must be a number; received "${PORT_STR}".`);
}

/**
 * Build driver config
 * - If INSTANCE is set -> use instanceName (no port)
 * - Else if PORT is set -> use that port
 * - Else -> omit port completely (driver resolves host like sqlcmd without ",1433")
 */
function buildConfig(): SqlConfig {
  const options: NonNullable<SqlConfig['options']> = {
    encrypt: ENCRYPT,
    trustServerCertificate: TRUST
  };

  const base: SqlConfig = {
    user: USER!,                // validated above
    password: PASSWORD!,        // validated above
    server: SERVER!,            // validated above
    database: DATABASE!,        // validated above
    options,
    pool: { min: 0, max: 10, idleTimeoutMillis: 30_000 }
  };

  if (INSTANCE && INSTANCE.trim() !== '') {
    return { ...base, options: { ...options, instanceName: INSTANCE } };
  }
  if (PORT !== undefined) {
    return { ...base, port: PORT };
  }
  return base;
}

let pool: ConnectionPool | null = null;

export async function getPool(): Promise<ConnectionPool> {
  if (pool?.connected) return pool;
  if (pool && !pool.connected) {
    try { await pool.close(); } catch { /* ignore */ }
  }

  const cfg = buildConfig();
  const target =
    INSTANCE && INSTANCE.trim() !== '' ? `${SERVER}\\${INSTANCE}` :
    PORT !== undefined ? `${SERVER},${PORT}` :
    SERVER;

  console.log(
    `[DB] Connecting to ${target} / ${DATABASE} (encrypt=${ENCRYPT}, trustCert=${TRUST}) as ${USER}`
  );

  pool = await new sql.ConnectionPool(cfg).connect();
  return pool;
}

/** Query helper (parametrized) */
export async function query<T = any>(
  sqlText: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  const p = await getPool();
  const req = p.request();
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      req.input(name, value as any);
    }
  }
  const result = await req.query<T>(sqlText);
  return result.recordset as T[];
}

/** Lightweight health check */
export async function ping(): Promise<boolean> {
  const rows = await query<{ ok: number }>('SELECT 1 AS ok');
  return rows?.[0]?.ok === 1;
}

/** Graceful shutdown */
export async function closePool(): Promise<void> {
  if (!pool) return;
  try { await pool.close(); } finally { pool = null; }
}
