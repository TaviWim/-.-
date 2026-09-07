# Task Manager

Приложение для управления задачами. Можно создать задачу, посмотреть список,
поменять статус и удалить. Ещё есть скрипт на питоне, он выгружает задачи из
базы в CSV.

React + Node.js (Express) + PostgreSQL + Python.

## Что должно стоять на компе

Node.js 18+, PostgreSQL 14+, Python 3.9+

## Как запустить

Сначала база. Создаём:

```
createdb task_manager
```

Или так, если createdb не работает:

```
psql -U postgres -c "CREATE DATABASE task_manager;"
```

Таблицу создавать не надо, сервер сам её сделает при запуске. Но если хочется
руками, то:

```
psql -U postgres -d task_manager -f backend/db/schema.sql
```

Дальше бэкенд:

```
cd backend
cp .env.example .env
npm install
npm start
```

В .env вписать свой пароль от постгреса. Должно написать "API запущен".

Потом фронт, в новом терминале (бэкенд не закрывать):

```
cd frontend
npm install
npm run dev
```

Открываем http://localhost:5173

Питон-скрипт:

```
cd python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python export_tasks.py
```

На винде вместо source .venv/bin/activate пишем .venv\Scripts\activate

Появится файл tasks.csv. Настройки базы скрипт сам берёт из backend/.env.

Если в экселе всё слиплось в одну колонку:

```
python export_tasks.py -d ";"
```

## Что за файлы

backend:

- src/index.js - запускает сервер, подключает роуты, ловит ошибки
- src/db.js - подключение к постгресу, создание таблицы
- src/routes/tasks.js - сами методы API и проверка того, что прислали
- db/schema.sql - SQL для создания таблицы
- .env.example - образец настроек, свой .env в гит не попадает
- package.json - зависимости и команда запуска

frontend:

- index.html - страница, в которую грузится React
- vite.config.js - настройки Vite, там же прокси на бэкенд чтобы не ловить CORS
- src/main.jsx - точка входа
- src/App.jsx - весь интерфейс: форма, таблица, select статусов, удаление
- src/api.js - запросы к API
- src/styles.css - стили
- package.json - зависимости и команды

python:

- export_tasks.py - лезет в базу, забирает задачи, пишет CSV
- requirements.txt - две библиотеки, psycopg2 и dotenv

## Таблица tasks

id (SERIAL, первичный ключ), title (VARCHAR 255, обязательное), description
(TEXT), status (VARCHAR 20), created_at (TIMESTAMPTZ).

На статус стоит CHECK, туда войдёт только new, in_progress или done.

## API

- GET /tasks - список задач
- GET /tasks/:id - одна задача
- POST /tasks - создать, в теле title и description
- PUT /tasks/:id - поменять статус, в теле status
- DELETE /tasks/:id - удалить

Если что-то не так, приходит {"error": "текст"}. 400 когда данные кривые
(пустое название или несуществующий статус), 404 когда задачи нет, 500 если
сервер упал.

## Как проверить что работает

В браузере:

1. Создать задачу через форму, она появится в таблице
2. Поменять статус в select, строка перекрасится
3. Нажать удалить, строка пропадёт
4. Нажать F5. Задачи на месте, значит они лежат в базе, а не в памяти браузера

Через curl:

```
curl -X POST http://localhost:4000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Изучить React\",\"description\":\"Пройти базовый курс\"}"

curl http://localhost:4000/tasks

curl -X PUT http://localhost:4000/tasks/1 -H "Content-Type: application/json" -d "{\"status\":\"done\"}"

curl -X DELETE http://localhost:4000/tasks/1
```

Проверить ошибки (должны прийти 400, 400 и 404):

```
curl -X POST http://localhost:4000/tasks -H "Content-Type: application/json" -d "{\"title\":\"\"}"
curl -X PUT http://localhost:4000/tasks/1 -H "Content-Type: application/json" -d "{\"status\":\"abc\"}"
curl -X DELETE http://localhost:4000/tasks/9999
```

Посмотреть базу:

```
psql -U postgres -d task_manager -c "SELECT * FROM tasks;"
```

Проверить питон:

```
cd python
python export_tasks.py
```

Напишет сколько задач выгрузил, рядом появится tasks.csv
