import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import { initDb } from './db.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/tasks', tasksRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API запущен: http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Не удалось подключиться к базе данных:', err.message);
    process.exit(1);
  });
