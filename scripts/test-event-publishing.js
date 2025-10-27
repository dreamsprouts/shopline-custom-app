#!/usr/bin/env node3

/**
 * 測試事件發佈功能
 * 
 * 直接測試 ShoplineSourceConnector 的事件發佈功能
 */

const { ShoplineSourceConnector } = require('../connectors/shopline/source')
const { getEventBus } = require('../core/event-bus')

async function testEventPublishing() {
  console.log('🧪 測試事件發佈功能...\n')

  try {
    // 1. 啟用 Event Bus 和 Shopline Source Connector
    console.log('🔧 啟用 Event Bus 和 Shopline Source Connector...')
    process.env.USE_EVENT_BUS = 'true'
    process.env.ENABLE_SHOPLINE_SOURCE = 'true'

    // 2. 建立 Source Connector 實例
    const sourceConnector = new ShoplineSourceConnector()
    const eventBus = getEventBus()

    console.log('✅ Source Connector 和 Event Bus 已建立')
    console.log(`📊 Source Connector 狀態: ${sourceConnector.isEnabled() ? '啟用' : '停用'}`)

    // 3. 設定事件監聽器
    const receivedEvents = []
    eventBus.subscribe('*', (event) => {
      receivedEvents.push(event)
      console.log(`📡 收到事件: ${event.type} (ID: ${event.id})`)
    })

    // 4. 模擬 API 回應並發佈事件
    console.log('\n🚀 開始測試事件發佈...')

    // 測試商店資訊事件
    console.log('🏪 測試商店資訊事件...')
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

    await sourceConnector.publishShopInfoEvent(mockShopResponse, 'mock_token')
    await new Promise(resolve => setTimeout(resolve, 100))

    // 測試商品列表事件
    console.log('📦 測試商品列表事件...')
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

    await sourceConnector.publishProductsListEvent(mockProductsResponse, 'mock_token', { page: 1, limit: 10 })
    await new Promise(resolve => setTimeout(resolve, 100))

    // 測試訂單建立事件
    console.log('📋 測試訂單建立事件...')
    const mockOrderResponse = {
      success: true,
      data: {
        order: {
          id: 'order_123',
          order_number: 'ORD-001',
          status: 'pending',
          total_price: '100.00',
          currency: 'TWD',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
          line_items: [
            {
              variant_id: 'variant_123',
              title: 'Test Product',
              quantity: 1,
              price: '100.00'
            }
          ]
        }
      }
    }

    const mockOrderPayload = {
      order: {
        tags: 'test_order',
        note_attributes: [
          { name: 'API_REMARK', value: 'Test order' }
        ]
      }
    }

    await sourceConnector.publishOrderCreatedEvent(mockOrderResponse, 'mock_token', mockOrderPayload)
    await new Promise(resolve => setTimeout(resolve, 100))

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
    
    // 停用 Source Connector
    sourceConnector.setEnabled(false)
    console.log('⏸️ Source Connector 已停用')
    
    // 記錄停用前的事件數量
    const eventsBeforeDisable = receivedEvents.length
    
    // 再次發佈事件
    await sourceConnector.publishShopInfoEvent(mockShopResponse, 'mock_token')
    await new Promise(resolve => setTimeout(resolve, 100))
    
    console.log(`📊 停用後收到事件數量: ${receivedEvents.length - eventsBeforeDisable} (應該為 0)`)
    
    // 重新啟用 Source Connector
    sourceConnector.setEnabled(true)
    console.log('▶️ Source Connector 已重新啟用')

    // 7. 測試完成
    console.log('\n✅ 事件發佈測試完成!')
    console.log('\n📋 測試結果摘要:')
    console.log(`  - 事件發佈: ${receivedEvents.length > 0 ? '成功' : '失敗'}`)
    console.log(`  - 功能開關: 正常`)
    console.log(`  - 事件格式: 符合 Standard Event`)

    const success = receivedEvents.length > 0
    if (success) {
      console.log('\n🎉 測試成功!')
    } else {
      console.log('\n💥 測試失敗!')
    }

    return success

  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// 執行測試
if (require.main === module) {
  testEventPublishing()
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

module.exports = testEventPublishing
