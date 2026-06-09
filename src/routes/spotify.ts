import { Router } from 'express'
import type { Request, Response } from 'express'

const router = Router()

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!

function authHeader() {
  return 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
}

async function getClientToken(): Promise<string> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data: any = await res.json()
  if (!data.access_token) throw new Error('Client credentials failed: ' + JSON.stringify(data))
  return data.access_token
}

const PLAYLIST_FIELDS =
  'items(track(id,uri,name,duration_ms,artists(name),album(name,release_date,images)))'

router.get('/playlist/:id', async (req: Request, res: Response) => {
  try {
    const token = await getClientToken()
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/playlists/${req.params.id}/tracks?limit=50&fields=${PLAYLIST_FIELDS}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!spotifyRes.ok) {
      return res.status(spotifyRes.status).json({ error: 'Spotify API error' })
    }
    res.json(await spotifyRes.json())
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router