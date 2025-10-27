/**
 * Event Monitor 整合模組
 * 自動將所有發佈的事件保存到資料庫
 */

const { getEventBus } = require('../../core/event-bus')
const database = require('../../utils/database-postgres')

// 設定事件監聽器
async function setupEventMonitor() {
  // 確保資料庫已初始化
  await database.init()
  
  const eventBus = getEventBus()
  
  // 監聽所有事件
  eventBus.subscribe('*', async (event) => {
    try {
      // 保存到資料庫
      await database.saveEvent(event)
      console.log(`📊 [Event Monitor] 事件已保存: ${event.type} (${event.id})`)
    } catch (error) {
      console.error(`❌ [Event Monitor] 保存事件失敗: ${event.type} (${event.id})`, error.message)
    }
  })
  
  console.log('📊 [Event Monitor] 事件監聽器已設定，事件將保存到 PostgreSQL')
}

// 導出設定函數
module.exports = {
  setupEventMonitor
}
