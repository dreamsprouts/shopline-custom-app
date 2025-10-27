/**
 * Core Events Module
 * 匯出所有事件相關的定義和工具函數
 */

const { EventTypes, isValidEventType, matchEventType } = require('./EventTypes')
const { createStandardEvent, validateEvent, cloneEvent } = require('./StandardEvent')
const {
  createInventoryPayload,
  createProductPayload,
  createOrderPayload,
  createPricePayload
} = require('./EventPayloads')

// 建立事件 payload 的通用函數
function createEventPayload(type, payload, metadata = {}) {
  return createStandardEvent({
    type,
    source: {
      platform: metadata.source || 'shopline',
      platformId: payload.id || 'unknown',
      connector: 'shopline-source'
    },
    payload,
    metadata
  })
}

module.exports = {
  // Event Types
  EventTypes,
  isValidEventType,
  matchEventType,
  
  // Standard Event
  createStandardEvent,
  createEventPayload,
  validateEvent,
  cloneEvent,
  
  // Payload Creators
  createInventoryPayload,
  createProductPayload,
  createOrderPayload,
  createPricePayload
}

