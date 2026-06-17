import { createServer } from 'http';
import playersRouter from './routes/players';
import gamesRouter from './routes/games';
import spotifyRouter from './routes/spotify';
import { setupWebSocket } from './websocket';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://blind-test-one.vercel.app',
    'https://blind-test-git-main-clement-es-projects.vercel.app'
  ],
}));

app.use(express.json());
app.use('/api/players', playersRouter);
app.use('/api/games', gamesRouter);
app.use('/api/spotify', spotifyRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Spotify login → http://localhost:${PORT}/api/spotify/login`);
});