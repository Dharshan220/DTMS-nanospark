/**
 * DTMS - JSON file database with in-memory cache + debounced persistence.
 */
import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * On Vercel the function bundle directory is read-only, so writes must go to
 * the writable /tmp directory. Locally the DB file stays in server/api.
 */
const IS_SERVERLESS = process.env.VERCEL === "1";

export const DB_FILE = IS_SERVERLESS
  ? path.join(os.tmpdir(), "dtms-db.json")
  : path.join(__dirname, "db.json");

const BUNDLE_DB_FILE = path.join(__dirname, "db.json");

const state = {
  data: null,
  writeTimer: null,
  writePending: false,
};

export async function createDb(seed) {
  for (const file of [DB_FILE, BUNDLE_DB_FILE]) {
    try {
      const raw = await fs.readFile(file, "utf8");
      state.data = JSON.parse(raw);
      // When loaded from the read-only bundle, copy it to the writable file
      if (file !== DB_FILE) await flush();
      return;
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  }
  state.data = seed();
  await flush();
}

export function db() {
  if (!state.data) throw new Error("DB not initialised");
  return state.data;
}

export function save() {
  state.writePending = true;
  if (state.writeTimer) return;
  state.writeTimer = setTimeout(async () => {
    state.writeTimer = null;
    const pending = state.writePending;
    state.writePending = false;
    if (pending) {
      try {
        await flush();
      } catch (err) {
        console.error("DB flush failed:", err);
      }
    }
  }, 150);
}

export async function flush() {
  const tmp = DB_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(state.data, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

export function collection(name) {
  const data = db();
  if (!data[name]) data[name] = [];
  return data[name];
}

export async function nextId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function paginate(list, page = 1, limit = 20) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  return {
    items: list.slice((p - 1) * l, p * l),
    page: p,
    limit: l,
    total: list.length,
    hasMore: p * l < list.length,
  };
}