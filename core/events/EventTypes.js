/**
 * Event Type Taxonomy
 * 使用 Resource.Action 命名規則
 * 
 * @description 定義所有平台事件的標準類型
 */

const EventTypes = {
  // Inventory Events
  INVENTORY_UPDATED: 'inventory.updated',
  INVENTORY_LOW: 'inventory.low',
  INVENTORY_OUT_OF_STOCK: 'inventory.out_of_stock',
  
  // Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_PUBLISHED: 'product.published',
  PRODUCT_ARCHIVED: 'product.archived',
  
  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_FULFILLED: 'order.fulfilled',
  ORDER_PAID: 'order.paid',
  ORDER_REFUNDED: 'order.refunded',
  
  // Customer Events
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
  
  // Price Events
  PRICE_UPDATED: 'price.updated',
  PRICE_PROMOTION_STARTED: 'price.promotion_started',
  PRICE_PROMOTION_ENDED: 'price.promotion_ended',
  
  // Sync Events (Sync Engine 專用)
  SYNC_CONFLICT_DETECTED: 'sync.conflict_detected',
  SYNC_RECONCILIATION_NEEDED: 'sync.reconciliation_needed',
  SYNC_COMPLETED: 'sync.completed',
  SYNC_FAILED: 'sync.failed'
}

/**
 * 驗證事件類型是否有效
 */
const isValidEventType = (type) => {
  return Object.values(EventTypes).includes(type)
}

/**
 * 根據 pattern 匹配事件類型
 * 支援 wildcard: inventory.*, order.*, *
 */
const matchEventType = (eventType, pattern) => {
  if (pattern === '*') return true
  if (pattern === eventType) return true
  
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  return regex.test(eventType)
}

module.exports = {
  EventTypes,
  isValidEventType,
  matchEventType
}

