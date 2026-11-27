// JSON export (download) and import (file upload) helpers.
import { validateState } from './data.js';
import { todayKey } from './dates.js';

export function downloadJson(state) {
  const blob = new Blob([JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chore-champs-backup-${todayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read and validate a backup File. Resolves to { ok, state, error }. */
export async function readBackupFile(file) {
  try {
    const text = await file.text();
    const raw = JSON.parse(text);
    return validateState(raw);
  } catch {
    return { ok: false, error: 'Could not read that file. Is it a JSON backup?' };
  }
}
