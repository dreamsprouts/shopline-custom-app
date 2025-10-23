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

module.exports = {
  // Event Types
  EventTypes,
  isValidEventType,
  matchEventType,
  
  // Standard Event
  createStandardEvent,
  validateEvent,
  cloneEvent,
  
  // Payload Creators
  createInventoryPayload,
  createProductPayload,
  createOrderPayload,
  createPricePayload
}

