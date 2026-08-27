export interface CsvRecord {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

export type ConflictField = Exclude<keyof CsvRecord, "id">;

export interface Change {
  field: ConflictField;
  oldValue: string | number;
  newValue: string | number;
}

export interface Conflict {
  id: number;
  oldRecord: CsvRecord;
  newRecord: CsvRecord;
  changes: Change[];
}