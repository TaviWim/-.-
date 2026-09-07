import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

const STATUSES = ['new', 'in_progress', 'done'];

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, title, description, status, created_at FROM tasks ORDER BY created_at DESC, id DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Идентификатор должен быть числом' });
    }
    const { rows } = await query(
      'SELECT id, title, description, status, created_at FROM tasks WHERE id = $1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const description =
      typeof req.body.description === 'string' ? req.body.description.trim() : '';
    const status = req.body.status || 'new';

    if (!title) {
      return res.status(400).json({ error: 'Название задачи обязательно' });
    }
    if (title.length > 255) {
      return res.status(400).json({ error: 'Название длиннее 255 символов' });
    }
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `Статус должен быть одним из: ${STATUSES.join(', ')}` });
    }

    const { rows } = await query(
      `INSERT INTO tasks (title, description, status)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, status, created_at`,
      [title, description, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Идентификатор должен быть числом' });
    }

    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: `Статус должен быть одним из: ${STATUSES.join(', ')}` });
    }

    const { rows } = await query(
      `UPDATE tasks SET status = $1 WHERE id = $2
       RETURNING id, title, description, status, created_at`,
      [status, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Идентификатор должен быть числом' });
    }
    const { rowCount } = await query('DELETE FROM tasks WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Задача не найдена' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
