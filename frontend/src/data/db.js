import Dexie from 'dexie'

export class IlFornoDB extends Dexie {
  constructor() {
    super('IlFornoDB')

    this.version(1).stores({
      bread: '++id, name, visible, price_cent',
      customer: '++id, name, village, address, priorityOrder, createdAt',
      plan: '++id, customerId, breadId, quantity, deliveryDate, monday, tuesday, wednesday, thursday, friday, saturday, sunday',
    })
  }
}

export const db = new IlFornoDB()
