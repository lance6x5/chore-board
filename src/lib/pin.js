// Parent PIN helpers. Only a salted SHA-256 hash is stored, never the PIN.
// This is a light family lock, not real security: anyone with access to the
// device's storage could reset it.

export function isValidPin(pin) {
  return typeof pin === 'string' && /^\d{4,6}$/.test(pin);
}

function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomSalt() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest));
}

/** Returns { pinSalt, pinHash } for a new PIN. */
export async function createPinRecord(pin) {
  if (!isValidPin(pin)) throw new Error('PIN must be 4 to 6 digits.');
  const pinSalt = randomSalt();
  const pinHash = await hashPin(pin, pinSalt);
  return { pinSalt, pinHash };
}

export async function verifyPin(pin, settings) {
  if (!settings?.pinHash || !settings?.pinSalt || !isValidPin(pin)) return false;
  const h = await hashPin(pin, settings.pinSalt);
  return h === settings.pinHash;
}
