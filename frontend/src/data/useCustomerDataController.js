// Data layer utility: bread types, tiers, and submit handler (Dexie-based)

/**
 * @typedef {Object} PlanDelivery
 * @property {number} customerId - Unique ID of the customer
 * @property {string} customerName - Name of the customer
 * @property {string} tier - Tier of the customer
 * @property {number} breadTypeId - ID of the bread type
 * @property {string} breadTypeName - Name of the bread type
 * @property {number} quantity - Quantity for delivery
 * @property {string|null} deliveryDate - ISO date string if specific delivery, otherwise null
 * @property {Object} days - Object indicating delivery days (boolean for each day)
 * @property {boolean} days.monday
 * @property {boolean} days.tuesday
 * @property {boolean} days.wednesday
 * @property {boolean} days.thursday
 * @property {boolean} days.friday
 * @property {boolean} days.saturday
 * @property {boolean} days.sunday
*/

import { BREAD_TYPES } from './breadTypes'
import { TIERS } from './tiers'
import Dexie from 'dexie'

// Dexie setup
const DB_NAME = 'il-forno'
const STORE_CUSTOMERS = 'customers'
const STORE_PLAN = 'plan'

const breadNameToId = new Map(BREAD_TYPES.map(({ name, id }) => [name, id]))
const breadIdToName = new Map(BREAD_TYPES.map(({ id, name }) => [id, name]))

class IlFornoDB extends Dexie {
  /** @type {Dexie.Table<any, number>} */ customers
  /** @type {Dexie.Table<any, number>} */ plan
  constructor () {
    super(DB_NAME)
    // Indexes: ++id (PK), &name (unique), tier; plan: ++id, customerId, deliveryDate, createdAt
    this.version(1).stores({
      [STORE_CUSTOMERS]: '++id,&name,tier,createdAt',
      [STORE_PLAN]: '++id,customerId,deliveryDate,createdAt'
    })
    this.customers = this.table(STORE_CUSTOMERS)
    this.plan = this.table(STORE_PLAN)
  }
}

const db = new IlFornoDB()

async function saveCustomerWithPlanToDB ({ customer, plan }) {
  const createdAt = new Date().toISOString()
  return db.transaction('rw', db.customers, db.plan, async () => {
    const customerId = await db.customers.add({
      name: customer.name,
      address: customer.address || '',
      tier: customer.tier,
      createdAt,
    })

    const rows = plan.map((r) => {
      const days = r.days || {}
      return {
        customerId,
        createdAt,
        breadTypeId: r.breadTypeId,
        quantity: r.quantity,
        deliveryDate: null,
        monday: !!days.mon,
        tuesday: !!days.tue,
        wednesday: !!days.wed,
        thursday: !!days.thu,
        friday: !!days.fri,
        saturday: !!days.sat,
        sunday: !!days.sun,
      }
    })

    await db.plan.bulkAdd(rows)
    return { ok: true }
  })
}

async function getCustomerByName (name) {
  return db.customers.get({ name })
}

async function loadCounts () {
  const rows = await db.customers.toArray()
  const counts = Object.fromEntries(TIERS.map((t) => [t, 0]))
  for (const r of rows) {
    const t = r?.tier
    if (t in counts) counts[t] += 1
  }
  return counts
}

// Simple name search (case-insensitive, contains). Returns an array of flat customer rows.
async function searchCustomersByName (query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return []
  const rows = await db.customers
    .filter(r => (r?.name || '').toLowerCase().includes(q))
    .sortBy('name')
  return rows
}

function toISODate (d) {
  const date = (d instanceof Date) ? d : new Date(d)
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return local.toISOString().slice(0, 10)
}

function dayNameFromDate (d) {
  const date = (d instanceof Date) ? d : new Date(d)
  // 0=Sunday..6=Saturday
  const idx = date.getDay()
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][idx]
}

export function useCustomerDataController () {
  const getBreadTypes = () => BREAD_TYPES.map(bt => bt.name)
  const getTiers = () => TIERS

  /**
   * Delete all local IndexedDB data for this app.
   * Useful for a clean reset from the Setup page.
   *
   * @returns {Promise<void>}
   */
  const resetLocalData = async () => {
    await db.delete()
    // Re-open the database so subsequent operations in the same session work without reload
    await db.open()
  }

  /**
   * Loads the plan/deliveries for a specific date and tier.
   *
   * @async
   * @function getPlanByDate
   * @param {Date|string|number} date - The target date (can be a Date object, ISO string, or timestamp).
   * @param {string|number} tier - The tier to filter by. If '0', returns all tiers.
   * @returns {Promise<Array<PlanDelivery>>} Resolves to an array of plan objects.
   */
  const getPlanByDate = async (date, tier) => {
    const targetDayName = dayNameFromDate(date) // e.g., 'monday'
    const targetISO = toISODate(date)

    const [plans, customers] = await Promise.all([
      db.plan.toArray(),
      db.customers.toArray(),
    ])

    // Build customer map
    const customerMap = new Map()
    for (const c of customers) customerMap.set(c.id, c)

    // Filter plans matching the day/date AND exclude records created after the selected date
    const filtered = plans.filter((p) => {
      if (p.createdAt && toISODate(p.createdAt) > targetISO) return false
      const matchDate = p.deliveryDate && p.deliveryDate === targetISO
      const matchDay = !p.deliveryDate && !!p[targetDayName]
      return matchDate || matchDay
    })

    // Optional filter by tier (ignore if '0')
    const byTier = String(tier) === '0'
      ? filtered
      : filtered.filter((p) => customerMap.get(p.customerId)?.tier === tier)

    return byTier.map((p) => ({
      customerId: p.customerId,
      customerName: customerMap.get(p.customerId)?.name || '—',
      tier: customerMap.get(p.customerId)?.tier || '',
      breadTypeId: p.breadTypeId,
      breadTypeName: breadIdToName.get(p.breadTypeId) || '',
      quantity: p.quantity,
      deliveryDate: p.deliveryDate,
      days: {
        monday: !!p.monday,
        tuesday: !!p.tuesday,
        wednesday: !!p.wednesday,
        thursday: !!p.thursday,
        friday: !!p.friday,
        saturday: !!p.saturday,
        sunday: !!p.sunday,
      },
    }))
  }

  const submitCustomer = async ({ customer, rows }) => {
    // Validazioni base
    if (!customer?.name?.trim()) throw new Error('Il nome è obbligatorio')
    if (!customer?.tier) throw new Error('Il giro è obbligatorio')
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Aggiungi almeno una riga di consegna')

    const invalidRow = rows.find((r) => {
      const hasBread = r.breadTypeId != null || !!r.breadType
      const hasQuantity = !!r.quantity
      const hasDays = Object.values(r.days || {}).some(Boolean)
      return !hasBread || !hasQuantity || !hasDays
    })
    if (invalidRow) throw new Error('Controlla le righe: tipo, quantità e almeno un giorno sono obbligatori')

    const name = customer.name.trim()

    // Unicità nome cliente
    const existing = await getCustomerByName(name)
    if (existing) throw new Error('Esiste già un cliente con questo nome')

    // Prepara customer flat + plan rows
    const plan = rows.map((r) => {
      let id = r.breadTypeId
      if (id == null && r.breadType) id = breadNameToId.get(r.breadType)
      if (typeof id === 'string') id = parseInt(id, 10)
      if (!Number.isFinite(id)) throw new Error('Tipo di pane non valido in una riga')
      return {
        breadTypeId: id,
        quantity: r.quantity,
        days: r.days,
      }
    })

    try {
      await saveCustomerWithPlanToDB({
        customer: { name, address: customer.address?.trim() || '', tier: customer.tier },
        plan,
      })
      return { ok: true }
    } catch (err) {
      if (err?.name === 'ConstraintError') {
        throw err
      }
      console.error('IndexedDB save failed', err)
      throw new Error('Errore durante il salvataggio locale')
    }
  }

  return {
    breadTypes: getBreadTypes(),
    tiers: getTiers(),
    submitCustomer,
    loadCounts,
    searchCustomers: searchCustomersByName,
    getPlanByDate,
    resetLocalData,
  }
}
