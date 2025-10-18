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

// Aggregator: maintains backward compatibility after splitting read & write controllers.
// Prefer importing specific controllers directly for tree-shaking if needed.

import { useCustomerDataReadController } from './useCustomerDataReadController'
import { useCustomerDataWriteController } from './useCustomerDataWriteController'

export function useCustomerDataController() {
  const read = useCustomerDataReadController()
  const write = useCustomerDataWriteController()
  // Merge objects (write may include a redundant breadTypes array; keep read's canonical list)
  const { breadTypes, tiers } = read
  return {
    breadTypes,
    tiers,
    // read functions
    loadCounts: read.loadCounts,
    searchCustomers: read.searchCustomers,
    getPlanByDate: read.getPlanByDate,
    getCustomerWithPlan: read.getCustomerWithPlan,
    getDeliverySummaryByMonth: read.getDeliverySummaryByMonth,
    // write functions
    submitCustomer: write.submitCustomer,
    updateCustomer: write.updateCustomer,
    resetLocalData: write.resetLocalData,
    exportLocalData: write.exportLocalData,
    importLocalDataFromFile: write.importLocalDataFromFile,
    saveDelivery: write.saveDelivery,
  }
}

// Optional named re-exports for selective imports elsewhere
export { useCustomerDataReadController } from './useCustomerDataReadController'
export { useCustomerDataWriteController } from './useCustomerDataWriteController'
