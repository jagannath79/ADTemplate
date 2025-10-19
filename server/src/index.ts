// server/src/index.ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Resolve server/.env explicitly and load it BEFORE anything else.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
  override: true,
});

// Now safely import modules that read process.env
const { default: app } = await import('./app.js');
const { closePool } = await import('./config/database.js');

// Port (default 3000)
const port = Number.parseInt(process.env.PORT ?? '3000', 10);

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`API server listening on http://localhost:${port}`);
});

// Graceful shutdown
async function shutdown(code = 0) {
  try {
    console.log('Shutting down gracefully...');
    // stop accepting new connections
    await new Promise<void>((resolve) => server.close(() => resolve()));
    // close DB pool
    try {
      await closePool();
    } catch (err) {
      console.error('Error closing database pool:', err);
    }
  } catch (err) {
    console.error('Error during shutdown:', err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

// Catch unhandled errors so we can log and exit cleanly
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  shutdown(1);
});
