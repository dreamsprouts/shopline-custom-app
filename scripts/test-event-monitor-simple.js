#!/usr/bin/env node

/**
 * 簡化版 Event Monitor Dashboard 測試
 * 不需要資料庫，直接測試 Event Bus 功能
 * 
 * 更新說明：
 * - 使用 SSE 訂閱模式監控事件
 * - 載入最近 100 筆歷史事件
 * - 統計數字顯示資料庫總事件數和 log 區域統計
 */

const express = require('express')
const path = require('path')
const { ShoplineAPIClientWrapper } = require('../connectors/shopline/source')
const { getEventBus } = require('../core/event-bus')

async function startEventMonitorTest() {
  console.log('🚀 啟動 Event Monitor Dashboard 測試...\n')

  try {
    // 1. 啟用 Event Bus 和 Shopline Source Connector
    console.log('🔧 啟用 Event Bus 和 Shopline Source Connector...')
    process.env.USE_EVENT_BUS = 'true'
    process.env.ENABLE_SHOPLINE_SOURCE = 'true'

    // 2. 建立 Express 應用
    const app = express()
    const PORT = 3001

    // 3. 設定靜態檔案
    app.use(express.static(path.join(__dirname, '../views')))
    app.use(express.json())

    // 4. 建立 API Client 和 Event Bus
    const apiClient = new ShoplineAPIClientWrapper()
    const eventBus = getEventBus()

    // 5. 儲存事件歷史 (記憶體)
    let eventHistory = []

    // 6. 設定事件監聽器
    eventBus.subscribe('*', (event) => {
      eventHistory.unshift(event)
      console.log(`📡 收到事件: ${event.type} (ID: ${event.id})`)
      
      // 限制事件數量
      if (eventHistory.length > 100) {
        eventHistory = eventHistory.slice(0, 100)
      }
    })

    // 7. API 端點
    app.get('/api/events', (req, res) => {
      res.json({
        success: true,
        events: eventHistory.slice(0, 100), // 最近 100 個事件
        stats: {
          total_events: eventHistory.length,
          last_event_time: eventHistory[0]?.timestamp || null
        },
        timestamp: new Date().toISOString()
      })
    })

    app.post('/api/test-event', async (req, res) => {
      try {
        const sourceConnector = apiClient.getSourceConnector()
        
        // 發送測試事件
        const mockResponse = {
          success: true,
          data: {
            data: {
              shop: {
                id: 'test_shop_' + Date.now(),
                name: 'Test Shop',
                domain: 'test.myshopline.com',
                url: 'https://test.myshopline.com',
                currency: 'TWD',
                timezone: 'Asia/Taipei',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            }
          }
        }

        await sourceConnector.publishShopInfoEvent(mockResponse, 'test_token')
        
        res.json({
          success: true,
          message: 'Test event sent successfully'
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        })
      }
    })

    // 8. 啟動伺服器
    app.listen(PORT, () => {
      console.log('✅ Event Monitor Dashboard 測試伺服器已啟動')
      console.log(`📊 Dashboard: http://localhost:${PORT}/event-monitor.html`)
      console.log(`🔗 API 端點:`)
      console.log(`   GET  /api/events      - 取得事件列表`)
      console.log(`   POST /api/test-event  - 發送測試事件`)
      console.log('')
      console.log('🎯 使用方式:')
      console.log('1. 開啟瀏覽器訪問 Dashboard')
      console.log('2. 點擊「開始監控」按鈕 (使用 SSE 訂閱模式)')
      console.log('3. 點擊「測試事件發布」按鈕發送測試事件')
      console.log('4. 點擊「載入歷史事件(100筆)」查看歷史事件')
      console.log('5. 在另一個終端執行: node scripts/test-event-publishing.js')
      console.log('')
      console.log('按 Ctrl+C 停止伺服器')
    })

    // 9. 優雅關閉
    process.on('SIGINT', () => {
      console.log('\n🛑 正在關閉 Event Monitor Dashboard 測試伺服器...')
      process.exit(0)
    })

  } catch (error) {
    console.error('❌ 啟動失敗:', error.message)
    process.exit(1)
  }
}

// 執行測試
if (require.main === module) {
  startEventMonitorTest()
}

module.exports = startEventMonitorTest
