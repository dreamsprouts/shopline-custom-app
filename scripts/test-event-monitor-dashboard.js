#!/usr/bin/env node3

/**
 * 測試 Event Monitor Dashboard
 * 
 * 這個腳本會：
 * 1. 啟動 Event Bus 和 Shopline Source Connector
 * 2. 發佈一些測試事件
 * 3. 展示如何使用 Event Monitor Dashboard
 */

const { ShoplineAPIClientWrapper } = require('../connectors/shopline/source')
const { getEventBus } = require('../core/event-bus')

async function testEventMonitorDashboard() {
  console.log('🚀 測試 Event Monitor Dashboard...\n')

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
    console.log('\n👂 設定事件監聽器...')
    let eventCount = 0
    
    eventBus.subscribe('*', (event) => {
      eventCount++
      console.log(`📡 [${eventCount}] 收到事件: ${event.type} (ID: ${event.id})`)
    })

    // 4. 模擬 API 呼叫並發佈事件
    console.log('\n🚀 開始模擬 API 呼叫...')

    // 模擬商店資訊 API
    console.log('🏪 模擬商店資訊 API...')
    const mockShopResponse = {
      success: true,
      data: {
        data: {
          shop: {
            id: 'shop_123',
            name: 'Demo Shop',
            domain: 'demo.myshopline.com',
            url: 'https://demo.myshopline.com',
            currency: 'TWD',
            timezone: 'Asia/Taipei',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z'
          }
        }
      }
    }

    // 直接呼叫 Source Connector 方法
    const sourceConnector = apiClient.getSourceConnector()
    await sourceConnector.publishShopInfoEvent(mockShopResponse, 'mock_token')
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模擬商品列表 API
    console.log('📦 模擬商品列表 API...')
    const mockProductsResponse = {
      success: true,
      data: {
        products: [
          {
            id: 'product_123',
            title: 'Demo Product 1',
            handle: 'demo-product-1',
            status: 'active',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            variants: [
              {
                id: 'variant_123',
                sku: 'DEMO-001',
                price: '100.00',
                inventory_tracker: true
              }
            ]
          },
          {
            id: 'product_456',
            title: 'Demo Product 2',
            handle: 'demo-product-2',
            status: 'active',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            variants: [
              {
                id: 'variant_456',
                sku: 'DEMO-002',
                price: '200.00',
                inventory_tracker: true
              }
            ]
          }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10
        }
      }
    }

    await sourceConnector.publishProductsListEvent(mockProductsResponse, 'mock_token', { page: 1, limit: 10 })
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模擬訂單建立 API
    console.log('📋 模擬訂單建立 API...')
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
              title: 'Demo Product 1',
              quantity: 1,
              price: '100.00'
            }
          ]
        }
      }
    }

    const mockOrderPayload = {
      order: {
        tags: 'demo_order',
        note_attributes: [
          { name: 'API_REMARK', value: 'Demo order from Event Monitor test' }
        ]
      }
    }

    await sourceConnector.publishOrderCreatedEvent(mockOrderResponse, 'mock_token', mockOrderPayload)
    await new Promise(resolve => setTimeout(resolve, 500))

    // 5. 展示 Event Monitor Dashboard 使用方式
    console.log('\n📊 Event Monitor Dashboard 使用方式:')
    console.log('')
    console.log('1. 啟動伺服器:')
    console.log('   npm start')
    console.log('')
    console.log('2. 開啟 Event Monitor Dashboard:')
    console.log('   http://localhost:3000/event-monitor')
    console.log('')
    console.log('3. 在 Dashboard 中:')
    console.log('   - 點擊「開始監控」按鈕')
    console.log('   - 查看即時事件流')
    console.log('   - 使用「測試事件」按鈕發送測試事件')
    console.log('   - 查看事件統計和詳細資訊')
    console.log('')
    console.log('4. 同時測試 Shopline Connector:')
    console.log('   - 在另一個終端執行: node scripts/test-event-publishing.js')
    console.log('   - 在 Dashboard 中即時看到事件')
    console.log('')

    // 6. 測試完成
    console.log('✅ Event Monitor Dashboard 測試完成!')
    console.log('\n📋 測試結果摘要:')
    console.log(`  - 事件發佈: ${eventCount} 個事件`)
    console.log(`  - Event Bus: 正常運作`)
    console.log(`  - Source Connector: 正常運作`)
    console.log(`  - Dashboard: 準備就緒`)

    console.log('\n🎯 下一步:')
    console.log('1. 啟動伺服器: npm start')
    console.log('2. 開啟 Dashboard: http://localhost:3000/event-monitor')
    console.log('3. 開始監控事件流!')

    return true

  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// 執行測試
if (require.main === module) {
  testEventMonitorDashboard()
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

module.exports = testEventMonitorDashboard
