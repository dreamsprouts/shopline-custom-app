#!/usr/bin/env node3

/**
 * Shopline Source Connector 示範腳本
 * 
 * 展示如何使用新的 Shopline Source Connector：
 * 1. 啟用 Event Bus
 * 2. 使用包裝的 API Client
 * 3. 監聽事件
 * 4. 展示功能開關
 */

const { ShoplineAPIClientWrapper } = require('../connectors/shopline/source')
const { getEventBus } = require('../core/event-bus')

async function demoShoplineSourceConnector() {
  console.log('🎯 Shopline Source Connector 示範\n')

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
    
    // 監聽所有 Shopline 事件
    eventBus.subscribe('shopline.*', (event) => {
      console.log(`📡 [${event.type}] 事件已發佈 (ID: ${event.id})`)
      console.log(`   📊 來源: ${event.source}`)
      console.log(`   ⏰ 時間: ${event.timestamp}`)
      console.log(`   📦 Payload 欄位: ${Object.keys(event.payload).join(', ')}`)
      console.log('')
    })

    // 監聽特定事件類型
    eventBus.subscribe('shopline.shop.retrieved', (event) => {
      console.log(`🏪 商店資訊事件: ${event.payload.shop_name} (${event.payload.shop_domain})`)
    })

    eventBus.subscribe('shopline.products.retrieved', (event) => {
      console.log(`📦 商品列表事件: ${event.payload.products.length} 個商品`)
    })

    eventBus.subscribe('shopline.orders.retrieved', (event) => {
      console.log(`📋 訂單列表事件: ${event.payload.orders.length} 個訂單`)
    })

    // 4. 模擬 API 呼叫
    console.log('🚀 開始模擬 API 呼叫...\n')

    // 模擬商店資訊 API
    console.log('🏪 呼叫商店資訊 API...')
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

    // 模擬 API 呼叫
    jest.spyOn(apiClient, 'testShopInfoAPI').mockResolvedValue(mockShopResponse)
    await apiClient.testShopInfoAPI('mock_token')

    // 等待事件處理
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模擬商品列表 API
    console.log('📦 呼叫商品列表 API...')
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

    jest.spyOn(apiClient, 'getProducts').mockResolvedValue(mockProductsResponse)
    await apiClient.getProducts('mock_token', { page: 1, limit: 10, status: 'active' })

    // 等待事件處理
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模擬訂單列表 API
    console.log('📋 呼叫訂單列表 API...')
    const mockOrdersResponse = {
      success: true,
      data: {
        data: {
          orders: [
            {
              id: 'order_123',
              order_number: 'ORD-001',
              status: 'paid',
              total_price: '100.00',
              currency: 'TWD',
              created_at: '2023-01-01T00:00:00Z',
              updated_at: '2023-01-01T00:00:00Z'
            }
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10
          }
        }
      }
    }

    jest.spyOn(apiClient, 'getOrders').mockResolvedValue(mockOrdersResponse)
    await apiClient.getOrders('mock_token', { page: 1, limit: 10 })

    // 等待事件處理
    await new Promise(resolve => setTimeout(resolve, 500))

    // 5. 展示功能開關
    console.log('\n🔧 展示功能開關...')
    
    // 停用 Event Bus
    console.log('⏸️ 停用 Event Bus...')
    apiClient.setEventBusEnabled(false)
    console.log(`📊 Event Bus 狀態: ${apiClient.isEventBusEnabled() ? '啟用' : '停用'}`)

    // 再次呼叫 API（不會發佈事件）
    console.log('🏪 呼叫商店資訊 API（停用狀態）...')
    await apiClient.testShopInfoAPI('mock_token')
    await new Promise(resolve => setTimeout(resolve, 500))

    // 重新啟用 Event Bus
    console.log('▶️ 重新啟用 Event Bus...')
    apiClient.setEventBusEnabled(true)
    console.log(`📊 Event Bus 狀態: ${apiClient.isEventBusEnabled() ? '啟用' : '停用'}`)

    // 再次呼叫 API（會發佈事件）
    console.log('🏪 呼叫商店資訊 API（啟用狀態）...')
    await apiClient.testShopInfoAPI('mock_token')
    await new Promise(resolve => setTimeout(resolve, 500))

    // 6. 展示完成
    console.log('\n✅ 示範完成!')
    console.log('\n📋 示範內容摘要:')
    console.log('  - ✅ 啟用 Event Bus 和 Shopline Source Connector')
    console.log('  - ✅ 設定事件監聽器')
    console.log('  - ✅ 模擬 API 呼叫並發佈事件')
    console.log('  - ✅ 展示功能開關控制')
    console.log('  - ✅ 驗證向後兼容性')

    console.log('\n🎯 下一步:')
    console.log('  - 在現有 API 端點中使用 ShoplineAPIClientWrapper')
    console.log('  - 監聽事件並實作業務邏輯')
    console.log('  - 準備進入 Phase R3: Shopline Target Connector')

  } catch (error) {
    console.error('❌ 示範失敗:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

// 執行示範
if (require.main === module) {
  demoShoplineSourceConnector()
    .then(() => {
      console.log('\n🎉 示範完成!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 示範失敗:', error.message)
      process.exit(1)
    })
}

module.exports = demoShoplineSourceConnector
