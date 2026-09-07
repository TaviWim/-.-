import { useEffect, useMemo, useState } from 'react';
import { createTask, deleteTask, getTasks, updateTaskStatus } from './api.js';

const STATUS_LABELS = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Готово'
};

const STATUS_ORDER = ['new', 'in_progress', 'done'];

function formatDate(value) {
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadTasks() {
    try {
      setLoading(true);
      const data = await getTasks();
      setTasks(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const counts = useMemo(() => {
    return STATUS_ORDER.reduce((acc, status) => {
      acc[status] = tasks.filter((task) => task.status === status).length;
      return acc;
    }, {});
  }, [tasks]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError('Введите название задачи');
      return;
    }
    try {
      setSaving(true);
      const task = await createTask(title.trim(), description.trim());
      setTasks((prev) => [task, ...prev]);
      setTitle('');
      setDescription('');
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id, status) {
    const previous = tasks;
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));
    try {
      await updateTaskStatus(id, status);
      setError('');
    } catch (err) {
      setTasks(previous);
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    const previous = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== id));
    try {
      await deleteTask(id);
      setError('');
    } catch (err) {
      setTasks(previous);
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Менеджер задач</h1>
        <p className="counters">
          {STATUS_ORDER.map((status) => (
            <span key={status} className={`counter counter--${status}`}>
              {STATUS_LABELS[status]}: {counts[status] || 0}
            </span>
          ))}
        </p>
      </header>

      <form className="task-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">Название</label>
          <input
            id="title"
            type="text"
            value={title}
            maxLength={255}
            placeholder="Изучить React"
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="description">Описание</label>
          <input
            id="description"
            type="text"
            value={description}
            placeholder="Пройти базовый курс"
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <button type="submit" disabled={saving}>
          {saving ? 'Сохраняю…' : 'Создать задачу'}
        </button>
      </form>

      {error && <div className="notice notice--error">{error}</div>}

      {loading ? (
        <p className="state">Загружаю задачи…</p>
      ) : tasks.length === 0 ? (
        <p className="state">Задач пока нет. Создайте первую в форме выше.</p>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Создана</th>
              <th>Статус</th>
              <th aria-label="Действия" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className={`row row--${task.status}`}>
                <td>
                  <span className="task-title">{task.title}</span>
                  {task.description && <span className="task-description">{task.description}</span>}
                </td>
                <td className="task-date">{formatDate(task.created_at)}</td>
                <td>
                  <select
                    className={`status-select status-select--${task.status}`}
                    value={task.status}
                    onChange={(event) => handleStatusChange(task.id, event.target.value)}
                  >
                    {STATUS_ORDER.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" className="delete" onClick={() => handleDelete(task.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
