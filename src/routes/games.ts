import { Router } from 'express'
import type { Request, Response } from 'express'
import pool from '../db'

const router = Router()

// ─── Games CRUD ───────────────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM games WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partie non trouvée' })
    res.json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, playlist_url, status = 'waiting' } = req.body
    const result = await pool.query(
      'INSERT INTO games (id, playlist_url, status) VALUES ($1, $2, $3) RETURNING *',
      [id, playlist_url, status]
    )
    res.status(201).json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { playlist_url, status } = req.body
    const result = await pool.query(
      `UPDATE games
       SET playlist_url = COALESCE($1, playlist_url),
           status       = COALESCE($2, status)
       WHERE id = $3
       RETURNING *`,
      [playlist_url ?? null, status ?? null, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partie non trouvée' })
    res.json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM games WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partie non trouvée' })
    res.status(204).send()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── game_players sub-resource ────────────────────────────────────────────────

// GET /api/games/:id/players — joueurs de la partie avec leurs scores
router.get('/:id/players', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.email, p.username, gp.score, gp.joined_at
       FROM game_players gp
       JOIN players p ON p.id = gp.player_id
       WHERE gp.game_id = $1
       ORDER BY gp.score DESC, gp.joined_at ASC`,
      [req.params.id]
    )
    res.json(result.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/games/:id/players/:playerId — ajouter un joueur à la partie
router.post('/:id/players/:playerId', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'INSERT INTO game_players (game_id, player_id, score) VALUES ($1, $2, 0) RETURNING *',
      [req.params.id, req.params.playerId]
    )
    res.status(201).json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/games/:id/players/:playerId/score — mettre à jour le score
router.put('/:id/players/:playerId/score', async (req: Request, res: Response) => {
  try {
    const { score } = req.body
    const result = await pool.query(
      `UPDATE game_players SET score = $1
       WHERE game_id = $2 AND player_id = $3
       RETURNING *`,
      [score, req.params.id, req.params.playerId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Entrée non trouvée' })
    res.json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/games/:id/players/:playerId — retirer un joueur de la partie
router.delete('/:id/players/:playerId', async (req: Request, res: Response) => {
  try {
    await pool.query(
      'DELETE FROM game_players WHERE game_id = $1 AND player_id = $2',
      [req.params.id, req.params.playerId]
    )
    res.status(204).send()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
