const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    let message = `Ошибка запроса (${response.status})`;
    try {
      const data = await response.json();
      if (data.error) message = data.error;
    } catch {
      message = `Ошибка запроса (${response.status})`;
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function getTasks() {
  return request('/tasks');
}

export function createTask(title, description) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, description })
  });
}

export function updateTaskStatus(id, status) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' });
}
