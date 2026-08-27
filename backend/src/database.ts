import Database from "better-sqlite3";
import { CsvRecord } from "./types";

const db = new Database("data.db");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY,
    post_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1
  )
`);

function rowToRecord(row: any): CsvRecord {
  return {
    id: row.id,
    postId: row.post_id,
    name: row.name,
    email: row.email,
    body: row.body
  };
}

export function getRecord(id: number): CsvRecord | null {
  const row = db.prepare(`
    SELECT id, post_id, name, email, body
    FROM records
    WHERE id = ?
  `).get(id);

  return row ? rowToRecord(row) : null;
}

export function insertRecord(record: CsvRecord): void {
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO records
      (id, post_id, name, email, body, created_at, updated_at, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    record.id,
    record.postId,
    record.name,
    record.email,
    record.body,
    now,
    now
  );
}

export function updateRecord(record: CsvRecord): void {
  db.prepare(`
    UPDATE records
    SET post_id = ?, name = ?, email = ?, body = ?,
        updated_at = ?, version = version + 1
    WHERE id = ?
  `).run(
    record.postId,
    record.name,
    record.email,
    record.body,
    new Date().toISOString(),
    record.id
  );
}

export function getRecords({
  page,
  limit,
  search
}: {
  page: number;
  limit: number;
  search: string;
}) {
  const offset = (page - 1) * limit;
  const pattern = `%${search}%`;

  const where = `
    WHERE CAST(id AS TEXT) LIKE ?
       OR CAST(post_id AS TEXT) LIKE ?
       OR name LIKE ?
       OR email LIKE ?
       OR body LIKE ?
  `;

  const params = [pattern, pattern, pattern, pattern, pattern];

  const rows = db.prepare(`
    SELECT id, post_id, name, email, body, updated_at
    FROM records
    ${where}
    ORDER BY id
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const count = db.prepare(`
    SELECT COUNT(*) AS count
    FROM records
    ${where}
  `).get(...params) as { count: number };

  return {
    records: rows,
    total: count.count,
    page,
    limit,
    totalPages: Math.ceil(count.count / limit)
  };
}