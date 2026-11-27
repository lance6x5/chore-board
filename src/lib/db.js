// Persistence: the whole app state is one record in IndexedDB.
// Falls back to localStorage if IndexedDB is unavailable (e.g. some
// private-browsing modes). All calls are wrapped in try/catch.

const DB_NAME = 'chore-champs';
const STORE = 'kv';
const KEY = 'state';
const LS_KEY = 'chore-champs-state';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    const req = fn(store);
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

let dbPromise = null;
function getDb() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

export async function loadState() {
  try {
    const db = await getDb();
    const value = await tx(db, 'readonly', (s) => s.get(KEY));
    if (value) return value;
  } catch (err) {
    console.warn('IndexedDB load failed, trying localStorage', err);
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('localStorage load failed', err);
    return null;
  }
}

export async function saveState(state) {
  try {
    const db = await getDb();
    await tx(db, 'readwrite', (s) => s.put(state, KEY));
    return true;
  } catch (err) {
    console.warn('IndexedDB save failed, trying localStorage', err);
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Could not save data', err);
    return false;
  }
}

export async function clearState() {
  try {
    const db = await getDb();
    await tx(db, 'readwrite', (s) => s.delete(KEY));
  } catch (err) {
    console.warn('IndexedDB clear failed', err);
  }
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}
