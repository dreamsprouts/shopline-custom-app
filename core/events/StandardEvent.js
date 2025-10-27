// 使用 crypto.randomUUID() 替代 uuid 套件，避免 ESM 相容性問題
const crypto = require('crypto')
const uuidv4 = () => crypto.randomUUID()
const { isValidEventType } = require('./EventTypes')

/**
 * Standard Event
 * 所有平台的變化都必須轉換為此標準格式
 * 
 * @typedef {Object} StandardEvent
 * @property {string} id - UUID
 * @property {string} version - Schema version (e.g., "1.0.0")
 * @property {string} type - 事件類型 (見 EventTypes)
 * @property {Date} timestamp - 事件發生時間 (ISO 8601)
 * @property {Object} source - 來源資訊
 * @property {string} source.platform - 平台名稱 ('shopline', 'next-engine', etc.)
 * @property {string} source.platformId - 平台內的資源 ID
 * @property {string} source.connector - 連接器名稱
 * @property {any} [source.originalEvent] - 原始事件 (可選，用於除錯)
 * @property {Object} payload - 事件 Payload (統一格式)
 * @property {Object} [correlation] - 追蹤資訊
 * @property {string} [correlation.traceId] - 全鏈路追蹤 ID
 * @property {string} [correlation.causationId] - 引發此事件的事件 ID
 * @property {string} [correlation.conversationId] - 業務會話 ID
 * @property {Object} [metadata] - 元數據
 * @property {number} [metadata.retryCount] - 重試次數
 * @property {string} [metadata.priority] - 優先級: 'low' | 'normal' | 'high'
 */

/**
 * 建立標準事件
 */
const createStandardEvent = ({
  type,
  source,
  payload,
  correlation = {},
  metadata = {},
  timestamp = new Date()
}) => {
  // 驗證必要欄位
  if (!type) {
    throw new Error('Event type is required')
  }
  
  if (!isValidEventType(type)) {
    throw new Error(`Invalid event type: ${type}`)
  }
  
  if (!source || !source.platform || !source.platformId || !source.connector) {
    throw new Error('Event source must include platform, platformId, and connector')
  }
  
  if (!payload) {
    throw new Error('Event payload is required')
  }
  
  return {
    id: uuidv4(),
    version: '1.0.0',
    type,
    timestamp,
    source: {
      platform: source.platform,
      platformId: String(source.platformId),
      connector: source.connector,
      ...(source.originalEvent && { originalEvent: source.originalEvent })
    },
    payload,
    ...(Object.keys(correlation).length > 0 && { correlation }),
    ...(Object.keys(metadata).length > 0 && { metadata })
  }
}

/**
 * 驗證事件格式
 */
const validateEvent = (event) => {
  if (!event.id || typeof event.id !== 'string') {
    throw new Error('Event must have a valid id')
  }
  
  if (!event.version || typeof event.version !== 'string') {
    throw new Error('Event must have a valid version')
  }
  
  if (!event.type || !isValidEventType(event.type)) {
    throw new Error(`Invalid event type: ${event.type}`)
  }
  
  if (!event.timestamp || !(event.timestamp instanceof Date)) {
    throw new Error('Event must have a valid timestamp')
  }
  
  if (!event.source || !event.source.platform || !event.source.platformId || !event.source.connector) {
    throw new Error('Event must have a valid source with platform, platformId, and connector')
  }
  
  if (!event.payload || typeof event.payload !== 'object') {
    throw new Error('Event must have a valid payload')
  }
  
  return true
}

/**
 * 複製事件（用於重試、回放等場景）
 */
const cloneEvent = (event, overrides = {}) => {
  return {
    ...event,
    ...overrides,
    // 保持嵌套物件的複製
    source: {
      ...event.source,
      ...(overrides.source || {})
    },
    payload: {
      ...event.payload,
      ...(overrides.payload || {})
    },
    ...(event.correlation && {
      correlation: {
        ...event.correlation,
        ...(overrides.correlation || {})
      }
    }),
    ...(event.metadata && {
      metadata: {
        ...event.metadata,
        ...(overrides.metadata || {})
      }
    })
  }
}

module.exports = {
  createStandardEvent,
  validateEvent,
  cloneEvent
}

