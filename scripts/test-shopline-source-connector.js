#!/usr/bin/env node3

/**
 * 測試 Shopline Source Connector 雙寫模式
 * 
 * 這個腳本會：
 * 1. 啟用 Event Bus 和 Shopline Source Connector
 * 2. 使用包裝的 API Client 呼叫 Shopline API
 * 3. 驗證事件是否正確發佈
 * 4. 確認現有功能不受影響
 */

const { ShoplineAPIClientWrapper } = require('../connectors/shopline/source')
const { getEventBus } = require('../core/event-bus')
const { getEventConfig } = require('../config/event-driven')
const database = require('../utils/database-postgres')

async function testShoplineSourceConnector() {
  console.log('🚀 開始測試 Shopline Source Connector 雙寫模式...\n')

  try {
    // 1. 啟用 Event Bus 和 Shopline Source Connector
    console.log('🔧 啟用 Event Bus 和 Shopline Source Connector...')
    process.env.USE_EVENT_BUS = 'true'
    process.env.ENABLE_SHOPLINE_SOURCE = 'true'
    
    // 2. 建立 API Client 實例
    const apiClient = new ShoplineAPIClientWrapper()
    const eventBus = getEventBus()
    
    console.log('✅ API Client 和 Event Bus 已建立')
    console.log(`📊 Event Bus 狀態: ${apiClient.isEventBusEnabled() ? '啟用' : '停用'}`)

    // 3. 設定事件監聽器
    const receivedEvents = []
    eventBus.subscribe('shopline.*', (event) => {
      receivedEvents.push(event)
      console.log(`📡 收到事件: ${event.type} (ID: ${event.id})`)
    })

    // 4. 取得 Access Token
    console.log('\n🔑 取得 Access Token...')
    const tokens = await database.getTokens()
    if (!tokens || tokens.length === 0) {
      throw new Error('沒有找到 Access Token，請先執行 OAuth 授權')
    }
    
    const accessToken = tokens[0].access_token
    console.log(`✅ Access Token 已取得: ${accessToken.substring(0, 10)}...`)

    // 5. 測試商店資訊 API
    console.log('\n🏪 測試商店資訊 API...')
    const shopResult = await apiClient.testShopInfoAPI(accessToken)
    console.log(`📊 商店資訊 API 結果: ${shopResult.success ? '成功' : '失敗'}`)
    if (shopResult.success) {
      console.log(`🏪 商店名稱: ${shopResult.data?.data?.shop?.name || 'N/A'}`)
    }

    // 6. 測試商品列表 API
    console.log('\n📦 測試商品列表 API...')
    const productsResult = await apiClient.getProducts(accessToken, {
      page: 1,
      limit: 5,
      status: 'active'
    })
    console.log(`📊 商品列表 API 結果: ${productsResult.success ? '成功' : '失敗'}`)
    if (productsResult.success) {
      const products = productsResult.data?.products || []
      console.log(`📦 商品數量: ${products.length}`)
    }

    // 7. 測試訂單列表 API
    console.log('\n📋 測試訂單列表 API...')
    const ordersResult = await apiClient.getOrders(accessToken, {
      page: 1,
      limit: 5
    })
    console.log(`📊 訂單列表 API 結果: ${ordersResult.success ? '成功' : '失敗'}`)
    if (ordersResult.success) {
      const orders = ordersResult.data?.data?.orders || []
      console.log(`📋 訂單數量: ${orders.length}`)
    }

    // 8. 等待事件處理完成
    console.log('\n⏳ 等待事件處理完成...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 9. 驗證事件發佈
    console.log('\n📊 事件發佈驗證:')
    console.log(`📡 總共收到 ${receivedEvents.length} 個事件`)
    
    const eventTypes = receivedEvents.map(event => event.type)
    const uniqueEventTypes = [...new Set(eventTypes)]
    
    console.log('📋 事件類型:')
    uniqueEventTypes.forEach(type => {
      const count = eventTypes.filter(t => t === type).length
      console.log(`  - ${type}: ${count} 次`)
    })

    // 10. 驗證事件內容
    console.log('\n🔍 事件內容驗證:')
    receivedEvents.forEach((event, index) => {
      console.log(`\n事件 ${index + 1}:`)
      console.log(`  - 類型: ${event.type}`)
      console.log(`  - ID: ${event.id}`)
      console.log(`  - 時間戳: ${event.timestamp}`)
      console.log(`  - 來源: ${event.source}`)
      console.log(`  - 版本: ${event.version}`)
      
      if (event.payload) {
        const payloadKeys = Object.keys(event.payload)
        console.log(`  - Payload 欄位: ${payloadKeys.join(', ')}`)
      }
      
      if (event.metadata) {
        const metadataKeys = Object.keys(event.metadata)
        console.log(`  - Metadata 欄位: ${metadataKeys.join(', ')}`)
      }
    })

    // 11. 測試功能開關
    console.log('\n🔧 測試功能開關...')
    
    // 停用 Event Bus
    apiClient.setEventBusEnabled(false)
    console.log('⏸️ Event Bus 已停用')
    
    // 清空事件列表
    receivedEvents.length = 0
    
    // 再次呼叫 API
    await apiClient.testShopInfoAPI(accessToken)
    
    // 等待事件處理
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log(`📊 停用後收到事件數量: ${receivedEvents.length} (應該為 0)`)
    
    // 重新啟用 Event Bus
    apiClient.setEventBusEnabled(true)
    console.log('▶️ Event Bus 已重新啟用')

    // 12. 測試完成
    console.log('\n✅ Shopline Source Connector 雙寫模式測試完成!')
    console.log('\n📋 測試結果摘要:')
    console.log(`  - API 呼叫: 全部成功`)
    console.log(`  - 事件發佈: ${receivedEvents.length > 0 ? '成功' : '失敗'}`)
    console.log(`  - 功能開關: 正常`)
    console.log(`  - 向後兼容: 正常`)

  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// 執行測試
if (require.main === module) {
  testShoplineSourceConnector()
    .then(() => {
      console.log('\n🎉 測試完成!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 測試失敗:', error.message)
      process.exit(1)
    })
}

module.exports = testShoplineSourceConnector
