import { useCallback, useEffect, useState } from "react";
import { getRecords, resolveConflict, uploadCsv } from "./api";
import { socket } from "./socket";
import type { Conflict, RecordItem } from "./types";
import "./styles.css";

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const loadRecords = useCallback(async () => {
    try {
      const result = await getRecords(page, search);
      setRecords(result.records);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records");
    }
  }, [page, search]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    const handleConflicts = (payload: { conflicts: Conflict[] }) => {
      if (payload.conflicts.length) {
        setConflicts(payload.conflicts);
      }
      void loadRecords();
    };

    const handleUpdated = () => void loadRecords();

    const handleResolved = (payload: { id: number }) => {
      setConflicts((items) => items.filter((item) => item.id !== payload.id));
      void loadRecords();
    };

    socket.on("upload:conflicts", handleConflicts);
    socket.on("record:updated", handleUpdated);
    socket.on("conflict:resolved", handleResolved);

    return () => {
      socket.off("upload:conflicts", handleConflicts);
      socket.off("record:updated", handleUpdated);
      socket.off("conflict:resolved", handleResolved);
    };
  }, [loadRecords]);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setProgress(0);

    try {
      await uploadCsv(file, setProgress);
      await loadRecords();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setProgress(null);
      event.target.value = "";
    }
  };

  const handleResolve = async (
    conflict: Conflict,
    resolution: "keep-old" | "keep-new"
  ) => {
    try {
      await resolveConflict(
        conflict.id,
        resolution,
        conflict.newRecord
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resolution failed");
    }
  };

  return (
    <main className="container">
      <header className="header">
        <div>
          <h1>CSV Data Manager</h1>
          <p>Real-time collaborative CSV management</p>
        </div>

        <label className="uploadButton">
          Upload CSV
          <input
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={handleUpload}
          />
        </label>
      </header>

      {progress !== null && (
        <div className="uploadStatus">
          <span>Uploading CSV...</span>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      <input
        className="search"
        type="search"
        placeholder="Search by ID, name, email or body..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {conflicts.length > 0 && (
        <ConflictList conflicts={conflicts} onResolve={handleResolve} />
      )}

      <div className="tableWrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Post ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Body</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.post_id}</td>
                <td>{record.name}</td>
                <td>{record.email}</td>
                <td>{record.body}</td>
              </tr>
            ))}
            {!records.length && (
              <tr>
                <td colSpan={5} className="empty">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </main>
  );
}

function ConflictList({
  conflicts,
  onResolve
}: {
  conflicts: Conflict[];
  onResolve: (
    conflict: Conflict,
    resolution: "keep-old" | "keep-new"
  ) => void;
}) {
  return (
    <section className="conflicts">
      <h2>Conflicts detected</h2>
      <p>Choose which version of each changed record to keep.</p>

      {conflicts.map((conflict) => (
        <article className="conflict" key={conflict.id}>
          <h3>Record #{conflict.id}</h3>

          <div className="diff">
            {conflict.changes.map((change) => (
              <div className="diffRow" key={change.field}>
                <strong>{change.field}</strong>

                <div className="oldValue">
                  <span>Old</span>
                  <pre>{String(change.oldValue)}</pre>
                </div>

                <div className="newValue">
                  <span>New</span>
                  <pre>{String(change.newValue)}</pre>
                </div>
              </div>
            ))}
          </div>

          <div className="actions">
            <button onClick={() => onResolve(conflict, "keep-old")}>
              Keep Old
            </button>
            <button
              className="primary"
              onClick={() => onResolve(conflict, "keep-new")}
            >
              Keep New
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}