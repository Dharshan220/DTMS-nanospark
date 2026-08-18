/**
 * DTMS - JSON file database with in-memory cache + debounced persistence.
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DB_FILE = path.join(__dirname, "db.json");

const state = {
  data: null,
  writeTimer: null,
  writePending: false,
};

export async function createDb(seed) {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    state.data = JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      state.data = seed();
      await flush();
    } else {
      throw err;
    }
  }
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
    if (pending) await flush();
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