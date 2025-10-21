// Small date utilities shared across data controllers

/**
 * Convert a Date or date-like value to a local ISO date string (YYYY-MM-DD).
 * It normalizes to local midnight to avoid TZ shifts.
 * @param {Date|string|number} d
 * @returns {string}
 */
export function toISODate(d) {
  const date = d instanceof Date ? d : new Date(d)
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return local.toISOString().slice(0, 10)
}
