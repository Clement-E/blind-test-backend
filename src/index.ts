import playersRouter from './routes/players';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'http://localhost:5173', // dev local React
    'https://blind-test-one.vercel.app', // production
    'https://blind-test-git-main-clement-es-projects.vercel.app'
  ],
}));

app.use(express.json());
app.use('/api/players', playersRouter);

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env

async function getSpotifyToken() {
  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  if (!data.access_token) throw new Error('Failed to get Spotify token')
  return data.access_token
}

app.get('/api/spotify/playlist/:id', async (req, res) => {
  try {
    const token = await getSpotifyToken()
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${req.params.id}/tracks?fields=items(track(name,album(name)))&limit=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Spotify API error' })
    }
    res.json(await response.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});