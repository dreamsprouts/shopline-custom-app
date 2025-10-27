/**
 * Event Bus Module
 * 匯出 Event Bus 相關的類別和工具
 */

const InMemoryEventBus = require('./InMemoryEventBus')
const { getEventConfig } = require('../../config/event-driven')

let eventBusInstance = null

function getEventBus() {
  if (!eventBusInstance) {
    const config = getEventConfig()
    eventBusInstance = new InMemoryEventBus()
    
    // 根據環境變數設定啟用狀態
    const isEnabled = process.env.USE_EVENT_BUS === 'true'
    eventBusInstance.setEnabled(isEnabled)
  }
  return eventBusInstance
}

module.exports = {
  InMemoryEventBus,
  getEventBus
}

