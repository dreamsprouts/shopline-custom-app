/**
 * Phase R2 驗收測試
 * 
 * 驗證 Shopline Source Connector 雙寫模式：
 * 1. 現有功能完全正常
 * 2. 事件正確發佈
 * 3. 功能開關正常
 * 4. 向後兼容性
 */

const { ShoplineAPIClientWrapper } = require('../../connectors/shopline/source')
const ShoplineAPIClient = require('../../utils/shopline-api')
const { getEventBus } = require('../../core/event-bus')
const { getEventConfig } = require('../../config/event-driven')

describe('Phase R2 驗收測試 - Shopline Source Connector', () => {
  let originalConfig
  let eventBus
  let receivedEvents

  beforeAll(() => {
    // 儲存原始配置
    originalConfig = getEventConfig()
    
    // 啟用 Event Bus 和 Shopline Source Connector
    process.env.USE_EVENT_BUS = 'true'
    process.env.ENABLE_SHOPLINE_SOURCE = 'true'
    
    // 取得 Event Bus 實例
    eventBus = getEventBus()
    
    // 設定事件監聽器
    receivedEvents = []
    eventBus.subscribe('shopline.*', (event) => {
      receivedEvents.push(event)
    })
  })

  afterAll(() => {
    // 恢復原始配置
    process.env.USE_EVENT_BUS = originalConfig.eventBus.enabled ? 'true' : 'false'
    process.env.ENABLE_SHOPLINE_SOURCE = originalConfig.connectors.shopline.source.enabled ? 'true' : 'false'
  })

  beforeEach(() => {
    // 清空事件列表
    receivedEvents.length = 0
  })

  describe('1. 現有功能完全正常', () => {
    test('包裝的 API Client 應該與原始 API Client 有相同的介面', () => {
      const originalClient = new ShoplineAPIClient()
      const wrappedClient = new ShoplineAPIClientWrapper()

      // 檢查所有方法都存在
      const methods = [
        'testShopInfoAPI',
        'getProducts',
        'createProduct',
        'createOrder',
        'getOrders',
        'getOrderDetail',
        'updateOrder',
        'testProductsAPI',
        'testOrdersAPI',
        'testAllAPIs'
      ]

      methods.forEach(method => {
        expect(typeof wrappedClient[method]).toBe('function')
        expect(typeof originalClient[method]).toBe('function')
      })
    })

    test('包裝的 API Client 應該保持相同的回應格式', async () => {
      const wrappedClient = new ShoplineAPIClientWrapper()
      
      // 模擬成功的 API 回應
      const mockResponse = {
        success: true,
        data: { test: 'data' },
        message: 'Test successful',
        apiInfo: {
          endpoint: '/test',
          method: 'GET',
          status: 200
        }
      }

      // 模擬 API 呼叫
      jest.spyOn(wrappedClient, 'testShopInfoAPI').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      const result = await wrappedClient.testShopInfoAPI('mock_token')

      // 驗證回應格式
      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.message).toBeDefined()
      expect(result.apiInfo).toBeDefined()
    })
  })

  describe('2. 事件正確發佈', () => {
    test('商店資訊 API 應該發佈事件', async () => {
      const wrappedClient = new ShoplineAPIClientWrapper()
      
      // 模擬成功的 API 回應
      const mockResponse = {
        success: true,
        data: {
          data: {
            shop: {
              id: 'shop_123',
              name: 'Test Shop',
              domain: 'test.myshopline.com'
            }
          }
        }
      }

      // 模擬 API 呼叫
      jest.spyOn(wrappedClient, 'testShopInfoAPI').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      await wrappedClient.testShopInfoAPI('mock_token')

      // 等待事件處理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 驗證事件發佈
      expect(receivedEvents.length).toBeGreaterThan(0)
      const shopEvent = receivedEvents.find(event => event.type === 'shopline.shop.retrieved')
      expect(shopEvent).toBeDefined()
      expect(shopEvent.payload.shop_id).toBe('shop_123')
    })

    test('商品列表 API 應該發佈事件', async () => {
      const wrappedClient = new ShoplineAPIClientWrapper()
      
      // 模擬成功的 API 回應
      const mockResponse = {
        success: true,
        data: {
          products: [
            {
              id: 'product_123',
              title: 'Test Product',
              handle: 'test-product'
            }
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10
          }
        }
      }

      // 模擬 API 呼叫
      jest.spyOn(wrappedClient, 'getProducts').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      await wrappedClient.getProducts('mock_token', { page: 1, limit: 10 })

      // 等待事件處理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 驗證事件發佈
      expect(receivedEvents.length).toBeGreaterThan(0)
      const productsEvent = receivedEvents.find(event => event.type === 'shopline.products.retrieved')
      expect(productsEvent).toBeDefined()
      expect(productsEvent.payload.products).toHaveLength(1)
      expect(productsEvent.payload.products[0].product_id).toBe('product_123')
    })
  })

  describe('3. 功能開關正常', () => {
    test('停用 Event Bus 時不應該發佈事件', async () => {
      const wrappedClient = new ShoplineAPIClientWrapper()
      
      // 停用 Event Bus
      wrappedClient.setEventBusEnabled(false)
      expect(wrappedClient.isEventBusEnabled()).toBe(false)

      // 模擬成功的 API 回應
      const mockResponse = {
        success: true,
        data: { test: 'data' }
      }

      // 模擬 API 呼叫
      jest.spyOn(wrappedClient, 'testShopInfoAPI').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      await wrappedClient.testShopInfoAPI('mock_token')

      // 等待事件處理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 驗證沒有發佈事件
      expect(receivedEvents.length).toBe(0)

      // 重新啟用 Event Bus
      wrappedClient.setEventBusEnabled(true)
      expect(wrappedClient.isEventBusEnabled()).toBe(true)
    })

    test('應該可以動態啟用/停用', () => {
      const wrappedClient = new ShoplineAPIClientWrapper()

      // 測試停用
      wrappedClient.setEventBusEnabled(false)
      expect(wrappedClient.isEventBusEnabled()).toBe(false)

      // 測試啟用
      wrappedClient.setEventBusEnabled(true)
      expect(wrappedClient.isEventBusEnabled()).toBe(true)
    })
  })

  describe('4. 向後兼容性', () => {
    test('應該可以與現有代碼無縫整合', () => {
      // 建立包裝的 API Client
      const wrappedClient = new ShoplineAPIClientWrapper()

      // 驗證所有原始方法都存在且可呼叫
      const methods = [
        'testShopInfoAPI',
        'getProducts',
        'createProduct',
        'createOrder',
        'getOrders',
        'getOrderDetail',
        'updateOrder'
      ]

      methods.forEach(method => {
        expect(typeof wrappedClient[method]).toBe('function')
        expect(() => wrappedClient[method].call(wrappedClient)).not.toThrow()
      })
    })

    test('應該保持與原始 API Client 相同的錯誤處理', async () => {
      const wrappedClient = new ShoplineAPIClientWrapper()
      
      // 模擬失敗的 API 回應
      const mockErrorResponse = {
        success: false,
        error: 'API Error',
        status: 500
      }

      // 模擬 API 呼叫
      jest.spyOn(wrappedClient, 'testShopInfoAPI').mockResolvedValue(mockErrorResponse)

      // 執行 API 呼叫
      const result = await wrappedClient.testShopInfoAPI('mock_token')

      // 驗證錯誤回應格式
      expect(result.success).toBe(false)
      expect(result.error).toBe('API Error')
      expect(result.status).toBe(500)

      // 驗證沒有發佈事件（因為 API 失敗）
      await new Promise(resolve => setTimeout(resolve, 100))
      expect(receivedEvents.length).toBe(0)
    })
  })

  describe('5. 事件格式驗證', () => {
    test('發佈的事件應該符合 Standard Event 格式', async () => {
      const wrappedClient = new ShoplineAPIClientWrapper()
      
      // 模擬成功的 API 回應
      const mockResponse = {
        success: true,
        data: {
          data: {
            shop: {
              id: 'shop_123',
              name: 'Test Shop'
            }
          }
        }
      }

      // 模擬 API 呼叫
      jest.spyOn(wrappedClient, 'testShopInfoAPI').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      await wrappedClient.testShopInfoAPI('mock_token')

      // 等待事件處理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 驗證事件格式
      expect(receivedEvents.length).toBeGreaterThan(0)
      const event = receivedEvents[0]
      
      // 檢查必要欄位
      expect(event.id).toBeDefined()
      expect(event.version).toBeDefined()
      expect(event.type).toBeDefined()
      expect(event.timestamp).toBeDefined()
      expect(event.source).toBeDefined()
      expect(event.payload).toBeDefined()
      expect(event.metadata).toBeDefined()

      // 檢查欄位類型
      expect(typeof event.id).toBe('string')
      expect(typeof event.version).toBe('string')
      expect(typeof event.type).toBe('string')
      expect(typeof event.timestamp).toBe('string')
      expect(typeof event.source).toBe('string')
      expect(typeof event.payload).toBe('object')
      expect(typeof event.metadata).toBe('object')
    })
  })
})
