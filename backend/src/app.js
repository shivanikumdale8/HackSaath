import express from 'express';
import cors from 'cors';
import { db } from './db/index.js';
import { env, isDev } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

/**
 * Implementation file for app.
 * @author = kruthinraj
 * @date = 2026-08-22
 */

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '500kb' }));
  if (isDev) {
    app.use((req, _res, next) => {
      if (req.url.startsWith('/api') || req.url === '/health') {
        console.log(`[API ${req.method}] ${req.url}`);
      }
      next();
    });
  }

  /** Render pings this to check the service is alive. */
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      env: env.nodeEnv,
      database: db.kind,
      mailDriver: env.mail.driver,
    });
  });

  app.use('/api', routes);

  // Catch unmatched /api routes
  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
