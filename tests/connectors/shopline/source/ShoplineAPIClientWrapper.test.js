/**
 * Shopline API Client Wrapper 測試
 * 
 * 測試雙寫模式：API 呼叫 + 事件發佈
 */

const { ShoplineAPIClientWrapper } = require('../../../connectors/shopline/source')
const { getEventBus } = require('../../../core/event-bus')
const { getEventConfig } = require('../../../config/event-driven')

describe('Shopline API Client Wrapper', () => {
  let apiClient
  let eventBus
  let originalConfig

  beforeEach(() => {
    // 建立 API Client 實例
    apiClient = new ShoplineAPIClientWrapper()
    
    // 取得 Event Bus 實例
    eventBus = getEventBus()
    
    // 儲存原始配置
    originalConfig = getEventConfig()
    
    // 啟用 Event Bus 和 Shopline Source Connector
    process.env.USE_EVENT_BUS = 'true'
    process.env.ENABLE_SHOPLINE_SOURCE = 'true'
  })

  afterEach(() => {
    // 恢復原始配置
    process.env.USE_EVENT_BUS = originalConfig.eventBus.enabled ? 'true' : 'false'
    process.env.ENABLE_SHOPLINE_SOURCE = originalConfig.connectors.shopline.source.enabled ? 'true' : 'false'
  })

  describe('基本功能', () => {
    test('應該可以建立實例', () => {
      expect(apiClient).toBeDefined()
      expect(apiClient.getSourceConnector).toBeDefined()
      expect(apiClient.isEventBusEnabled).toBeDefined()
    })

    test('應該可以取得 Source Connector', () => {
      const sourceConnector = apiClient.getSourceConnector()
      expect(sourceConnector).toBeDefined()
      expect(sourceConnector.isEnabled).toBeDefined()
    })

    test('應該可以檢查 Event Bus 狀態', () => {
      const isEnabled = apiClient.isEventBusEnabled()
      expect(typeof isEnabled).toBe('boolean')
    })

    test('應該可以動態啟用/停用 Event Bus', () => {
      apiClient.setEventBusEnabled(true)
      expect(apiClient.isEventBusEnabled()).toBe(true)
      
      apiClient.setEventBusEnabled(false)
      expect(apiClient.isEventBusEnabled()).toBe(false)
    })
  })

  describe('事件發佈', () => {
    let mockAccessToken
    let eventSpy

    beforeEach(() => {
      mockAccessToken = 'mock_access_token_12345'
      eventSpy = jest.spyOn(eventBus, 'publish')
    })

    afterEach(() => {
      eventSpy.mockRestore()
    })

    test('商店資訊 API 應該發佈事件', async () => {
      // 模擬成功的 API 回應
      const mockResponse = {
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

      // 模擬 API 呼叫
      jest.spyOn(apiClient, 'testShopInfoAPI').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      const result = await apiClient.testShopInfoAPI(mockAccessToken)

      // 驗證 API 回應
      expect(result).toEqual(mockResponse)

      // 驗證事件發佈
      expect(eventSpy).toHaveBeenCalledTimes(1)
      const publishedEvent = eventSpy.mock.calls[0][0]
      expect(publishedEvent.type).toBe('shopline.shop.retrieved')
      expect(publishedEvent.payload.shop_id).toBe('shop_123')
    })

    test('商品列表 API 應該發佈事件', async () => {
      // 模擬成功的 API 回應
      const mockResponse = {
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

      // 模擬 API 呼叫
      jest.spyOn(apiClient, 'getProducts').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      const params = { page: 1, limit: 10, status: 'active' }
      const result = await apiClient.getProducts(mockAccessToken, params)

      // 驗證 API 回應
      expect(result).toEqual(mockResponse)

      // 驗證事件發佈
      expect(eventSpy).toHaveBeenCalledTimes(1)
      const publishedEvent = eventSpy.mock.calls[0][0]
      expect(publishedEvent.type).toBe('shopline.products.retrieved')
      expect(publishedEvent.payload.products).toHaveLength(1)
      expect(publishedEvent.payload.products[0].product_id).toBe('product_123')
    })

    test('訂單建立 API 應該發佈事件', async () => {
      // 模擬成功的 API 回應
      const mockResponse = {
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

      // 模擬 API 呼叫
      jest.spyOn(apiClient, 'createOrder').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      const orderPayload = {
        order: {
          tags: 'test_order',
          note_attributes: [
            { name: 'API_REMARK', value: 'Test order' }
          ]
        }
      }
      const result = await apiClient.createOrder(mockAccessToken, orderPayload)

      // 驗證 API 回應
      expect(result).toEqual(mockResponse)

      // 驗證事件發佈
      expect(eventSpy).toHaveBeenCalledTimes(1)
      const publishedEvent = eventSpy.mock.calls[0][0]
      expect(publishedEvent.type).toBe('shopline.order.created')
      expect(publishedEvent.payload.order_id).toBe('order_123')
    })
  })

  describe('錯誤處理', () => {
    test('API 失敗時不應該發佈事件', async () => {
      const mockAccessToken = 'mock_access_token_12345'
      const eventSpy = jest.spyOn(eventBus, 'publish')

      // 模擬失敗的 API 回應
      const mockResponse = {
        success: false,
        error: 'API Error',
        status: 500
      }

      // 模擬 API 呼叫
      jest.spyOn(apiClient, 'testShopInfoAPI').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      const result = await apiClient.testShopInfoAPI(mockAccessToken)

      // 驗證 API 回應
      expect(result).toEqual(mockResponse)

      // 驗證沒有發佈事件
      expect(eventSpy).not.toHaveBeenCalled()

      eventSpy.mockRestore()
    })

    test('Event Bus 停用時不應該發佈事件', async () => {
      const mockAccessToken = 'mock_access_token_12345'
      const eventSpy = jest.spyOn(eventBus, 'publish')

      // 停用 Event Bus
      apiClient.setEventBusEnabled(false)

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
      jest.spyOn(apiClient, 'testShopInfoAPI').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      const result = await apiClient.testShopInfoAPI(mockAccessToken)

      // 驗證 API 回應
      expect(result).toEqual(mockResponse)

      // 驗證沒有發佈事件
      expect(eventSpy).not.toHaveBeenCalled()

      eventSpy.mockRestore()
    })
  })

  describe('向後兼容性', () => {
    test('應該保持與原始 API Client 相同的介面', () => {
      // 檢查所有原始方法都存在
      expect(typeof apiClient.testShopInfoAPI).toBe('function')
      expect(typeof apiClient.getProducts).toBe('function')
      expect(typeof apiClient.createProduct).toBe('function')
      expect(typeof apiClient.createOrder).toBe('function')
      expect(typeof apiClient.getOrders).toBe('function')
      expect(typeof apiClient.getOrderDetail).toBe('function')
      expect(typeof apiClient.updateOrder).toBe('function')
      expect(typeof apiClient.testProductsAPI).toBe('function')
      expect(typeof apiClient.testOrdersAPI).toBe('function')
      expect(typeof apiClient.testAllAPIs).toBe('function')
    })

    test('應該保持與原始 API Client 相同的回應格式', async () => {
      const mockAccessToken = 'mock_access_token_12345'
      
      // 模擬成功的 API 回應
      const mockResponse = {
        success: true,
        data: { test: 'data' },
        message: 'Test successful'
      }

      // 模擬 API 呼叫
      jest.spyOn(apiClient, 'testShopInfoAPI').mockResolvedValue(mockResponse)

      // 執行 API 呼叫
      const result = await apiClient.testShopInfoAPI(mockAccessToken)

      // 驗證回應格式與原始 API Client 相同
      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.message).toBeDefined()
    })
  })
})
