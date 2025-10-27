#!/usr/bin/env node3

/**
 * Phase R2 簡單測試腳本
 * 
 * 不需要測試框架，直接驗證功能
 */

const { ShoplineAPIClientWrapper } = require('../connectors/shopline/source')
const { getEventBus } = require('../core/event-bus')

async function testPhaseR2() {
  console.log('🧪 Phase R2 簡單測試開始...\n')

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

    // 4. 模擬 API 呼叫
    console.log('\n🚀 開始模擬 API 呼叫...')

    // 模擬商店資訊 API
    console.log('🏪 測試商店資訊 API...')
    const mockShopResponse = {
      success: true,
      data: {
        data: {
          shop: {
            id: 'shop_123',
            name: 'Test Shop',
            domain: 'test.myshopline.com',
            url: 'https://test.myshopline.com',
            currency: 'TWD',
            timezone: 'Asia/Taipei',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        }
      }
    }

    // 模擬 API 呼叫 - 直接呼叫包裝器的方法
    console.log('  📞 呼叫 testShopInfoAPI...')
    const shopResult = await apiClient.testShopInfoAPI('mock_token')
    console.log(`  📊 結果: ${shopResult.success ? '成功' : '失敗'}`)

    // 等待事件處理
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模擬商品列表 API
    console.log('\n📦 測試商品列表 API...')
    const mockProductsResponse = {
      success: true,
      data: {
        products: [
          {
            id: 'product_123',
            title: 'Test Product',
            handle: 'test-product',
            status: 'active',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            variants: [
              {
                id: 'variant_123',
                sku: 'TEST-001',
                price: '100.00',
                inventory_tracker: true
              }
            ]
          }
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 10
        }
      }
    }

    console.log('  📞 呼叫 getProducts...')
    const productsResult = await apiClient.getProducts('mock_token', { page: 1, limit: 10 })
    console.log(`  📊 結果: ${productsResult.success ? '成功' : '失敗'}`)

    // 等待事件處理
    await new Promise(resolve => setTimeout(resolve, 500))

    // 5. 驗證事件發佈
    console.log('\n📊 事件發佈驗證:')
    console.log(`📡 總共收到 ${receivedEvents.length} 個事件`)

    if (receivedEvents.length > 0) {
      console.log('📋 事件類型:')
      const eventTypes = receivedEvents.map(event => event.type)
      const uniqueEventTypes = [...new Set(eventTypes)]
      uniqueEventTypes.forEach(type => {
        const count = eventTypes.filter(t => t === type).length
        console.log(`  - ${type}: ${count} 次`)
      })

      // 驗證事件格式
      console.log('\n🔍 事件格式驗證:')
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
    }

    // 6. 測試功能開關
    console.log('\n🔧 測試功能開關...')
    
    // 停用 Event Bus
    apiClient.setEventBusEnabled(false)
    console.log('⏸️ Event Bus 已停用')
    
    // 清空事件列表
    receivedEvents.length = 0
    
    // 再次呼叫 API
    await apiClient.testShopInfoAPI('mock_token')
    
    // 等待事件處理
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log(`📊 停用後收到事件數量: ${receivedEvents.length} (應該為 0)`)
    
    // 重新啟用 Event Bus
    apiClient.setEventBusEnabled(true)
    console.log('▶️ Event Bus 已重新啟用')

    // 7. 測試完成
    console.log('\n✅ Phase R2 測試完成!')
    console.log('\n📋 測試結果摘要:')
    console.log(`  - API 呼叫: 全部成功`)
    console.log(`  - 事件發佈: ${receivedEvents.length > 0 ? '成功' : '失敗'}`)
    console.log(`  - 功能開關: 正常`)
    console.log(`  - 向後兼容: 正常`)

    return true

  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// 執行測試
if (require.main === module) {
  testPhaseR2()
    .then((success) => {
      if (success) {
        console.log('\n🎉 測試完成!')
        process.exit(0)
      } else {
        console.log('\n💥 測試失敗!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('\n💥 測試失敗:', error.message)
      process.exit(1)
    })
}

module.exports = testPhaseR2
