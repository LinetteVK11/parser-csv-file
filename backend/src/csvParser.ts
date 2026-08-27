import { parse } from "csv-parse/sync";
import { CsvRecord } from "./types";

const REQUIRED_COLUMNS = ["postId", "id", "name", "email", "body"];

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, "").replace(/^"|"$/g, "").trim();
}

function normalizeRow(row: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      normalizeHeader(key),
      value?.trim() ?? ""
    ])
  );
}

export function parseCsv(buffer: Buffer): CsvRecord[] {
  const csv = buffer.toString("utf8");

  if (!csv.trim()) {
    throw new Error("CSV file is empty");
  }

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    bom: true,
    trim: true
  }) as Record<string, string>[];

  if (!rows.length) {
    throw new Error("CSV file contains no records");
  }

  const normalizedRows = rows.map(normalizeRow);
  const columns = Object.keys(normalizedRows[0]);

  for (const required of REQUIRED_COLUMNS) {
    if (!columns.includes(required)) {
      throw new Error(`Missing required column: ${required}`);
    }
  }

  const seenIds = new Set<number>();

  return normalizedRows.map((row, index) => {
    const line = index + 2;

    for (const field of ["id", "postId", "name", "email", "body"]) {
      if (!row[field]) {
        throw new Error(`Row ${line}: ${field} is required`);
      }
    }

    const id = Number(row.id);
    const postId = Number(row.postId);

    if (!Number.isInteger(id)) {
      throw new Error(`Row ${line}: id must be an integer`);
    }

    if (!Number.isInteger(postId)) {
      throw new Error(`Row ${line}: postId must be an integer`);
    }

    if (seenIds.has(id)) {
      throw new Error(`Duplicate id ${id} found in CSV`);
    }

    seenIds.add(id);

    return {
      postId,
      id,
      name: row.name,
      email: row.email,
      body: row.body
    };
  });
}