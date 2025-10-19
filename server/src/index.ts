import { config as loadEnv } from 'dotenv';

import app from './app.js';
import { closePool } from './config/database.js';

loadEnv();

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const server = app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

const shutdown = async () => {
  console.log('Shutting down gracefully...');
  server.close(async () => {
    try {
      await closePool();
    } catch (error) {
      console.error('Error closing database pool', error);
    } finally {
      process.exit(0);
    }
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
