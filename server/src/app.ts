import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import templatesRouter from './routes/templates.routes.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/templates', templatesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Unexpected server error', error: err.message });
});

export default app;
