import express from "express";
import cors from "cors";
import multer from "multer";
import http from "http";
import { Server } from "socket.io";

import { parseCsv } from "./csvParser";
import { createConflict } from "./diff";
import {
  getRecord,
  getRecords,
  insertRecord,
  updateRecord
} from "./database";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "http://localhost:5173" }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.get("/api/records", (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = typeof req.query.search === "string" ? req.query.search : "";

    res.json(getRecords({ page, limit, search }));
  } catch {
    res.status(500).json({ message: "Failed to retrieve records" });
  }
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please select a CSV file" });
    }

    if (!req.file.originalname.toLowerCase().endsWith(".csv")) {
      return res.status(400).json({ message: "Only CSV files are allowed" });
    }

    const records = parseCsv(req.file.buffer);
    const conflicts = [];
    let inserted = 0;
    let unchanged = 0;

    for (const newRecord of records) {
      const existing = getRecord(newRecord.id);

      if (!existing) {
        insertRecord(newRecord);
        inserted++;
        continue;
      }

      const conflict = createConflict(existing, newRecord);

      if (conflict) {
        conflicts.push(conflict);
      } else {
        unchanged++;
      }
    }

    io.emit("upload:conflicts", {
      conflicts,
      inserted,
      unchanged
    });

    return res.json({
      success: true,
      imported: records.length,
      inserted,
      unchanged,
      conflicts
    });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "CSV upload failed"
    });
  }
});

app.post("/api/conflicts/:id/resolve", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { resolution, record } = req.body;

    if (resolution !== "keep-old" && resolution !== "keep-new") {
      return res.status(400).json({ message: "Invalid resolution" });
    }

    if (resolution === "keep-new") {
      if (!record || Number(record.id) !== id) {
        return res.status(400).json({ message: "Invalid record" });
      }

      updateRecord(record);

      io.emit("record:updated", {
        record,
        resolution
      });
    }

    io.emit("conflict:resolved", { id, resolution });

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ message: "Failed to resolve conflict" });
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});