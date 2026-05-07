import playersRouter from './routes/players';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ⚠️ Remplace par l'URL exacte de ton app Vercel en production
app.use(cors({
  origin: [
    'http://localhost:5173', // dev local React
    'https://blind-test-one.vercel.app' // production
  ],
}));

app.use(express.json());
app.use('/api/players', playersRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});