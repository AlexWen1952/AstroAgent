/**
 * djb2-style 32-bit hash function.
 *
 * Used exclusively for deterministic symbol selection — not for security.
 * The algorithm must not change after first deployment, as changing it
 * would alter symbol mappings for all users.
 *
 * Returns a non-negative integer (Math.abs of a signed 32-bit int).
 */
export function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // convert to 32-bit signed integer
  }
  return Math.abs(hash);
}
