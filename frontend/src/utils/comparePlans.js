// Compare by: tier (string) -> customerName -> breadTypeName -> quantity
/**
 * Compare two PlanDelivery objects for sorting.
 * Sort by: tier (string, locale-aware) -> customerName -> breadTypeName -> quantity (number)
 * @param {import('../data/useCustomerDataController').PlanDelivery} a
 * @param {import('../data/useCustomerDataController').PlanDelivery} b
 * @returns {number}
 */
export function comparePlans(a, b) {
  // tier (locale-aware string)
  const aTierStr = a.tier.toString()
  const bTierStr = b.tier.toString()
  const cmpTier = aTierStr.localeCompare(bTierStr, 'it', { numeric: true, sensitivity: 'base' })
  if (cmpTier !== 0) return cmpTier

  // customerName
  const aCust = a.customerName
  const bCust = b.customerName
  const cmpCust = aCust.localeCompare(bCust, 'it', { sensitivity: 'base' })
  if (cmpCust !== 0) return cmpCust

  // breadTypeName
  const aBread = a.breadTypeName
  const bBread = b.breadTypeName
  const cmpBread = aBread.localeCompare(bBread, 'it', { sensitivity: 'base' })
  if (cmpBread !== 0) return cmpBread

  // quantity (numeric)
  const aQty = Number(a.quantity)
  const bQty = Number(b.quantity)
  return aQty - bQty
}
