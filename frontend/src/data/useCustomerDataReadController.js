// Read-only data controller: exposes functions to query customers and plans
// Shared DB instance (also used by write controller)

import Dexie from 'dexie'
import { BREAD_TYPES } from './breadTypes'
import { TIERS } from './tiers'

// Dexie setup (exported so write controller can reuse same instance)
const DB_NAME = 'il-forno'
const STORE_CUSTOMERS = 'customers'
const STORE_PLAN = 'plan'
const STORE_DELIVERY = 'delivery'

class IlFornoDB extends Dexie {
  /** @type {Dexie.Table<any, number>} */ customers
  /** @type {Dexie.Table<any, number>} */ plan
  /** @type {Dexie.Table<any, number>} */ delivery
  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      [STORE_CUSTOMERS]: '++id,&name,tier,createdAt',
      [STORE_PLAN]: '++id,customerId,deliveryDate,createdAt',
      // New deliveries store: tracks completed deliveries
      [STORE_DELIVERY]: '++id,deliveredAt,customerId,breadTypeId,deliveredPlan',
    })
    this.customers = this.table(STORE_CUSTOMERS)
    this.plan = this.table(STORE_PLAN)
    this.delivery = this.table(STORE_DELIVERY)
  }
}

export const db = new IlFornoDB()

// Bread type helpers (exported for write controller convenience)
export const breadNameToId = new Map(BREAD_TYPES.map(({ name, id }) => [name, id]))
export const breadIdToName = new Map(BREAD_TYPES.map(({ id, name }) => [id, name]))

async function getCustomerById(id) {
  return db.customers.get(id)
}

async function getCustomerPlan(customerId) {
  const rows = await db.plan.where({ customerId }).toArray()
  return rows.filter((r) => r.deliveryDate == null)
}

// Public read functions
async function loadCounts() {
  const rows = await db.customers.toArray()
  const counts = Object.fromEntries(TIERS.map((t) => [t, 0]))
  for (const r of rows) {
    const t = r?.tier
    if (t in counts) counts[t] += 1
  }
  return counts
}

async function searchCustomersByName(query) {
  const q = String(query || '')
    .trim()
    .toLowerCase()
  if (!q) return []
  const rows = await db.customers
    .filter((r) => (r?.name || '').toLowerCase().includes(q))
    .sortBy('name')
  return rows
}

async function getPlanByDate(date, tier) {
  const targetDayName = dayNameFromDate(date)
  const targetISO = toISODate(date)
  const [plans, customers] = await Promise.all([db.plan.toArray(), db.customers.toArray()])
  const customerMap = new Map()
  for (const c of customers) customerMap.set(c.id, c)
  const filtered = plans.filter((p) => {
    if (p.createdAt && toISODate(p.createdAt) > targetISO) return false
    const matchDate = p.deliveryDate && p.deliveryDate === targetISO
    const matchDay = !p.deliveryDate && !!p[targetDayName]
    return matchDate || matchDay
  })
  const byTier =
    String(tier) === '0'
      ? filtered
      : filtered.filter((p) => customerMap.get(p.customerId)?.tier === tier)
  return byTier.map((p) => ({
    planId: p.id,
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

async function getCustomerWithPlan(id) {
  const customer = await getCustomerById(id)
  if (!customer) return null
  const planRows = await getCustomerPlan(id)
  return {
    customer,
    plan: planRows.map((r) => ({
      planId: r.id,
      breadTypeId: r.breadTypeId,
      breadTypeName: breadIdToName.get(r.breadTypeId) || '',
      quantity: r.quantity,
      days: {
        mon: !!r.monday,
        tue: !!r.tuesday,
        wed: !!r.wednesday,
        thu: !!r.thursday,
        fri: !!r.friday,
        sat: !!r.saturday,
        sun: !!r.sunday,
      },
    })),
  }
}

/**
 * Compute a summary of deliveries for a given month.
 * @param {Date|string|number} anyDayInMonth - Any date within the target month
 * @returns {Promise<Array<{customerId:number, customerName:string, customerDeliveryCount:number, breadTypeId:number, breadTypeName:string, totalQuantity:number}>>}
 */
async function getDeliverySummaryByMonth(anyDayInMonth) {
  const date = anyDayInMonth instanceof Date ? anyDayInMonth : new Date(anyDayInMonth)
  // Build month prefix 'YYYY-MM' to match saved ISO timestamps reliably across timezones
  const pad = (n) => String(n).padStart(2, '0')
  const monthPrefix = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
  // Filter by prefix; it's fine performance-wise for expected dataset size
  const deliveries = await db.delivery
    .filter((d) => typeof d?.deliveredAt === 'string' && d.deliveredAt.startsWith(monthPrefix))
    .toArray()

  if (deliveries.length === 0) return []

  // Build customer map only for involved ids
  const customerIds = Array.from(new Set(deliveries.map((d) => d.customerId)))
  const customersArr = await db.customers.bulkGet(customerIds)
  const customerMap = new Map()
  customersArr.forEach((c) => {
    customerMap.set(String(c.id), c)
  })

  // Aggregate:
  const byClient = Object.groupBy(deliveries, (d) => {
    return String(d.customerId) + '-' + String(d.breadTypeId)
  })

  const rows = Object.entries(byClient).map(([compositeId, clientDeliveries]) => {
    const [customerId, breadTypeId] = compositeId.split('-')

    return {
      customerId,
      customerName: customerMap.get(customerId)?.name || '—',
      tier: customerMap.get(customerId)?.tier || '',
      customerDeliveryCount: clientDeliveries.length,
      breadTypeId,
      breadTypeName: breadIdToName.get(Number(breadTypeId)) || '—',
      totalQuantity: clientDeliveries.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0),
    }
  })

  // Sort by customer name then bread name
  rows.sort((a, b) => {
    const c = a.customerName.localeCompare(b.customerName, 'it', { sensitivity: 'base' })
    if (c !== 0) return c
    return a.breadTypeName.localeCompare(b.breadTypeName, 'it', { sensitivity: 'base' })
  })

  return rows
}

export function useCustomerDataReadController() {
  const breadTypes = BREAD_TYPES.map((bt) => bt.name)
  const tiers = TIERS
  return {
    breadTypes,
    tiers,
    loadCounts,
    searchCustomers: searchCustomersByName,
    getPlanByDate,
    getCustomerWithPlan,
    getDeliverySummaryByMonth,
  }
}

function toISODate(d) {
  const date = d instanceof Date ? d : new Date(d)
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return local.toISOString().slice(0, 10)
}

function dayNameFromDate(d) {
  const date = d instanceof Date ? d : new Date(d)
  const idx = date.getDay()
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][idx]
}
