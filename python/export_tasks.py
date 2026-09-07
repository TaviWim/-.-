import argparse
import csv
import os
import sys
from pathlib import Path

import psycopg2
from psycopg2 import errors as pg_errors
from dotenv import load_dotenv

COLUMNS = ["id", "title", "description", "status", "created_at"]
STATUSES = ["new", "in_progress", "done"]


def load_env():
    here = Path(__file__).resolve().parent
    for candidate in (here / ".env", here.parent / "backend" / ".env"):
        if candidate.is_file():
            load_dotenv(candidate)
            return candidate
    return None


def connection_params():
    return {
        "host": os.getenv("PGHOST", "localhost"),
        "port": int(os.getenv("PGPORT", "5432")),
        "user": os.getenv("PGUSER", "postgres"),
        "password": os.getenv("PGPASSWORD", "postgres"),
        "dbname": os.getenv("PGDATABASE", "task_manager"),
    }


def fetch_tasks(connection, status=None):
    query = "SELECT id, title, description, status, created_at FROM tasks"
    params = []
    if status:
        query += " WHERE status = %s"
        params.append(status)
    query += " ORDER BY id"

    with connection.cursor() as cursor:
        cursor.execute(query, params)
        return cursor.fetchall()


def write_csv(rows, path, delimiter):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle, delimiter=delimiter, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(COLUMNS)
        for row in rows:
            task_id, title, description, status, created_at = row
            writer.writerow(
                [
                    task_id,
                    title,
                    description or "",
                    status,
                    created_at.strftime("%Y-%m-%d %H:%M:%S"),
                ]
            )


def parse_args():
    parser = argparse.ArgumentParser(description="Выгрузка задач из PostgreSQL в CSV")
    parser.add_argument("-o", "--output", default="tasks.csv", help="путь к CSV-файлу")
    parser.add_argument("-s", "--status", choices=STATUSES, help="выгрузить только один статус")
    parser.add_argument(
        "-d",
        "--delimiter",
        default=",",
        help="разделитель колонок, для Excel обычно ';'",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    env_file = load_env()
    params = connection_params()

    connection = None
    try:
        connection = psycopg2.connect(**params)
        rows = fetch_tasks(connection, args.status)
    except psycopg2.OperationalError as error:
        print(f"Не удалось подключиться к базе {params['dbname']}: {error}", file=sys.stderr)
        if env_file is None:
            print("Файл .env не найден, использованы значения по умолчанию.", file=sys.stderr)
        return 1
    except pg_errors.UndefinedTable:
        print("Таблица tasks не найдена. Выполните backend/db/schema.sql.", file=sys.stderr)
        return 1
    except psycopg2.Error as error:
        print(f"Ошибка запроса: {error}", file=sys.stderr)
        return 1
    finally:
        if connection is not None:
            connection.close()

    output_path = Path(args.output).resolve()
    try:
        write_csv(rows, output_path, args.delimiter)
    except OSError as error:
        print(f"Не удалось записать файл {output_path}: {error}", file=sys.stderr)
        return 1

    print(f"Выгружено задач: {len(rows)}")
    print(f"Файл: {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
