import { Router } from 'express';
import type { Request, Response } from 'express';
import pool from '../db';

const router = Router();

// GET /api/players — tous les joueurs
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM "Player" ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur GET /players:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/players/:id — un joueur
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM "Player" WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Joueur non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/players — créer un joueur
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, name, email, game_id } = req.body;
    const result = await pool.query(
      'INSERT INTO "Player" (id, name, email, game_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, email, game_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/players/:id — modifier un joueur
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, game_id } = req.body;
    const result = await pool.query(
      'UPDATE "Player" SET name = $1, email = $2, game_id = $3 WHERE id = $4 RETURNING *',
      [name, email, game_id, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Joueur non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/players/:id — supprimer un joueur
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM "Player" WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Joueur non trouvé' });
    res.json({ message: 'Joueur supprimé', player: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;