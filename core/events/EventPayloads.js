/**
 * Event Payload 定義（按資源類型）
 * 提供標準的 Payload 建立和驗證函數
 */

/**
 * Inventory Event Payload
 * 
 * @typedef {Object} InventoryEventPayload
 * @property {string} productCode - SKU
 * @property {string} [locationId] - 倉庫位置
 * @property {number} quantity - 新庫存數量
 * @property {number} [previousQuantity] - 舊庫存數量
 * @property {number} change - 變化量
 * @property {string} [reason] - 原因: 'sale' | 'restock' | 'adjustment' | 'return'
 */
const createInventoryPayload = ({
  productCode,
  locationId,
  quantity,
  previousQuantity,
  change,
  reason
}) => {
  if (!productCode) {
    throw new Error('productCode is required for inventory payload')
  }
  
  if (typeof quantity !== 'number') {
    throw new Error('quantity must be a number')
  }
  
  return {
    productCode,
    ...(locationId && { locationId }),
    quantity,
    ...(previousQuantity !== undefined && { previousQuantity }),
    change: change || (previousQuantity !== undefined ? quantity - previousQuantity : 0),
    ...(reason && { reason })
  }
}

/**
 * Product Event Payload
 * 
 * @typedef {Object} ProductEventPayload
 * @property {string} productCode - SKU 或產品代碼
 * @property {string} title - 產品標題
 * @property {number} [price] - 價格
 * @property {number} [compareAtPrice] - 比較價格
 * @property {string} status - 狀態: 'active' | 'draft' | 'archived'
 * @property {Array} [variants] - 變體列表
 * @property {Array<string>} [changedFields] - 變更的欄位
 */
const createProductPayload = ({
  productCode,
  title,
  price,
  compareAtPrice,
  status,
  variants,
  changedFields
}) => {
  if (!productCode) {
    throw new Error('productCode is required for product payload')
  }
  
  if (!title) {
    throw new Error('title is required for product payload')
  }
  
  if (!status) {
    throw new Error('status is required for product payload')
  }
  
  return {
    productCode,
    title,
    ...(price !== undefined && { price }),
    ...(compareAtPrice !== undefined && { compareAtPrice }),
    status,
    ...(variants && { variants }),
    ...(changedFields && { changedFields })
  }
}

/**
 * Order Event Payload
 * 
 * @typedef {Object} OrderEventPayload
 * @property {string} orderNumber - 訂單編號
 * @property {string} status - 狀態: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
 * @property {Object} customer - 顧客資訊
 * @property {string} customer.email - Email
 * @property {string} customer.name - 姓名
 * @property {Array} lineItems - 訂單項目
 * @property {number} total - 總金額
 * @property {string} currency - 幣別
 */
const createOrderPayload = ({
  orderNumber,
  status,
  customer,
  lineItems,
  total,
  currency
}) => {
  if (!orderNumber) {
    throw new Error('orderNumber is required for order payload')
  }
  
  if (!status) {
    throw new Error('status is required for order payload')
  }
  
  if (!customer || !customer.email || !customer.name) {
    throw new Error('customer with email and name is required for order payload')
  }
  
  if (!lineItems || !Array.isArray(lineItems)) {
    throw new Error('lineItems must be an array')
  }
  
  if (typeof total !== 'number') {
    throw new Error('total must be a number')
  }
  
  if (!currency) {
    throw new Error('currency is required for order payload')
  }
  
  return {
    orderNumber,
    status,
    customer: {
      email: customer.email,
      name: customer.name
    },
    lineItems: lineItems.map(item => ({
      sku: item.sku,
      quantity: item.quantity,
      price: item.price
    })),
    total,
    currency
  }
}

/**
 * Price Event Payload
 * 
 * @typedef {Object} PriceEventPayload
 * @property {string} productCode - SKU
 * @property {number} price - 新價格
 * @property {number} [compareAtPrice] - 比較價格
 * @property {Date} effectiveFrom - 生效時間
 * @property {Date} [effectiveUntil] - 失效時間
 * @property {string} [reason] - 原因: 'promotion' | 'cost_change' | 'manual'
 */
const createPricePayload = ({
  productCode,
  price,
  compareAtPrice,
  effectiveFrom,
  effectiveUntil,
  reason
}) => {
  if (!productCode) {
    throw new Error('productCode is required for price payload')
  }
  
  if (typeof price !== 'number') {
    throw new Error('price must be a number')
  }
  
  if (!effectiveFrom) {
    throw new Error('effectiveFrom is required for price payload')
  }
  
  return {
    productCode,
    price,
    ...(compareAtPrice !== undefined && { compareAtPrice }),
    effectiveFrom: effectiveFrom instanceof Date ? effectiveFrom : new Date(effectiveFrom),
    ...(effectiveUntil && {
      effectiveUntil: effectiveUntil instanceof Date ? effectiveUntil : new Date(effectiveUntil)
    }),
    ...(reason && { reason })
  }
}

module.exports = {
  createInventoryPayload,
  createProductPayload,
  createOrderPayload,
  createPricePayload
}

