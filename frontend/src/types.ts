export interface RecordItem {
  id: number;
  post_id: number;
  name: string;
  email: string;
  body: string;
  updated_at: string;
}

export interface CsvRecord {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

export interface Change {
  field: "postId" | "name" | "email" | "body";
  oldValue: string | number;
  newValue: string | number;
}

export interface Conflict {
  id: number;
  oldRecord: CsvRecord;
  newRecord: CsvRecord;
  changes: Change[];
}