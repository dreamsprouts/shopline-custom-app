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
    
    // 建立 Event Store (如果啟用)
    let eventStore = null
    if (config.eventStore.enabled && config.eventStore.type === 'postgres') {
      const database = require('../../utils/database-postgres')
      eventStore = {
        append: async (event) => {
          try {
            await database.init()
            await database.saveEvent(event)
          } catch (error) {
            console.error('[EventStore] Failed to save event:', error.message)
          }
        }
      }
    }
    
    eventBusInstance = new InMemoryEventBus({ eventStore })
    
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

