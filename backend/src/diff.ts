import { Change, Conflict, CsvRecord } from "./types";

const COMPARABLE_FIELDS = ["postId", "name", "email", "body"] as const;

export function getChanges(oldRecord: CsvRecord, newRecord: CsvRecord): Change[] {
  return COMPARABLE_FIELDS
    .filter((field) => oldRecord[field] !== newRecord[field])
    .map((field) => ({
      field,
      oldValue: oldRecord[field],
      newValue: newRecord[field]
    }));
}

export function createConflict(
  oldRecord: CsvRecord,
  newRecord: CsvRecord
): Conflict | null {
  const changes = getChanges(oldRecord, newRecord);

  return changes.length
    ? { id: oldRecord.id, oldRecord, newRecord, changes }
    : null;
}