// Small date utilities shared across data controllers

/**
 * Convert a Date or date-like value to a local ISO date string (YYYY-MM-DD).
 * It normalizes to local midnight to avoid TZ shifts.
 * @param {Date|string|number} d
 * @returns {string}
 */
export function toISODate(d) {
  const date = d instanceof Date ? d : new Date(d)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
