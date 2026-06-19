import { Router } from 'express'
import type { Request, Response } from 'express'
import pool from '../db'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM players ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/upsert', async (req: Request, res: Response) => {
  try {
    const { email, username } = req.body
    const result = await pool.query(
      `INSERT INTO players (email, username) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET username = EXCLUDED.username
       RETURNING *`,
      [email, username]
    )
    res.json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM players WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Joueur non trouvé' })
    res.json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, username } = req.body
    const result = await pool.query(
      'INSERT INTO players (email, username) VALUES ($1, $2) RETURNING *',
      [email, username]
    )
    res.status(201).json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { email, username } = req.body
    const result = await pool.query(
      `UPDATE players
       SET email    = COALESCE($1, email),
           username = COALESCE($2, username)
       WHERE id = $3
       RETURNING *`,
      [email ?? null, username ?? null, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Joueur non trouvé' })
    res.json(result.rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM players WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Joueur non trouvé' })
    res.status(204).send()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
