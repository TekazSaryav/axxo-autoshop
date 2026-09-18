import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { apiRouter } from './routes.js';
import { bot, setupBot } from './bot.js';
import { seedUsersFromExistingData } from './userStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', shop: config.shopDomain, time: new Date().toISOString() });
});

// Serve frontend static files if built
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Tekaz Autoshop API is running. Client build will be served here once built.');
    }
  });
});

// Start Express Server
const server = app.listen(config.port, () => {
  console.log(`🚀 Tekaz Autoshop Server running on http://localhost:${config.port}`);
  console.log(`🔗 Configured Mini App URL: ${config.miniAppUrl}`);
});

// Start Telegram Bot
(async () => {
  try {
    seedUsersFromExistingData();
    await setupBot();
    console.log('🤖 Starting Telegram bot polling...');
    bot.start({
      onStart: (botInfo) => {
        console.log(` Telegram Bot @${botInfo.username} started successfully!`);
      }
    });
  } catch (err: any) {
    console.error('❌ Error starting Telegram bot:', err.message);
  }
})();

// Graceful shutdown
process.once('SIGINT', () => {
  bot.stop();
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop();
  server.close();
});
