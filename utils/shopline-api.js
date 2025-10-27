const axios = require('axios')
const { signPostRequest } = require('./signature')
// 環境變數配置（Vercel 兼容）
const config = {
  app_key: process.env.APP_KEY || '4c951e966557c8374d9a61753dfe3c52441aba3b',
  app_secret: process.env.APP_SECRET || 'dd46269d6920f49b07e810862d3093062b0fb858',
  shop_handle: process.env.SHOP_HANDLE || 'paykepoc',
  shop_url: process.env.SHOP_URL || 'https://paykepoc.myshopline.com/',
  node_env: process.env.NODE_ENV || 'development'
}

/**
 * SHOPLINE API 客戶端工具類
 * 用於與 SHOPLINE 平台 API 進行互動
 */
class ShoplineAPIClient {
  constructor() {
    this.baseURL = `https://${config.shop_handle}.myshopline.com`
    this.appKey = config.app_key
    this.appSecret = config.app_secret
  }

  /**
   * 建立商品（最小 Sample）
   * @param {string} accessToken
   * @param {object} productPayload
   */
  async createProduct(accessToken, productPayload) {
    try {
      console.log('🧩 開始建立商品...')

      const url = `${this.baseURL}/admin/openapi/v20260301/products/products.json`
      const headers = this.buildAuthHeaders(accessToken)

      // 動態唯一 handle/title（若未帶入則自動生成）
      const uniqueSuffix = `${Date.now()}`
      if (!productPayload?.product?.handle) {
        productPayload.product = productPayload.product || {}
        productPayload.product.handle = `shopline-${uniqueSuffix}`
      }
      if (!productPayload.product.title) {
        productPayload.product.title = productPayload.product.handle
      }

      console.log('📡 發送建立商品請求:', {
        url,
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' }
      })

      let response
      try {
        response = await axios.post(url, productPayload, { headers })
      } catch (err) {
        // 若因 handle 重複導致 400，改以新 handle 重試一次
        const msg = err.response?.data?.errors || err.response?.data?.message || err.message
        const isHandleTaken = typeof msg === 'string' && msg.toLowerCase().includes('handle') && msg.toLowerCase().includes('taken')
        if (err.response?.status === 400 && isHandleTaken) {
          const retryHandle = `${productPayload.product.handle}-${Math.floor(Math.random()*10000)}`
          productPayload.product.handle = retryHandle
          if (!productPayload.product.title || productPayload.product.title === productPayload.product.handle) {
            productPayload.product.title = retryHandle
          }
          console.warn('⚠️ handle 重複，改以新 handle 重試一次:', retryHandle)
          response = await axios.post(url, productPayload, { headers })
        } else {
          throw err
        }
      }

      console.log('✅ 建立商品成功:', {
        status: response.status,
        id: response.data?.data?.product?.id,
        handle: response.data?.data?.product?.handle
      })

      return {
        success: true,
        data: response.data,
        message: '建立商品成功',
        apiInfo: {
          endpoint: url,
          method: 'POST',
          status: response.status,
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/product/product/create-a-product/'
        }
      }
    } catch (error) {
      console.error('❌ 建立商品失敗:', {
        message: error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data
      })

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        apiInfo: {
          endpoint: `${this.baseURL}/admin/openapi/v20260301/products/products.json`,
          method: 'POST',
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/product/product/create-a-product/'
        }
      }
    }
  }

  /**
   * 建立認證標頭
   * @param {string} accessToken - Access Token
   * @returns {Object} 認證標頭
   */
  buildAuthHeaders(accessToken) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  /**
   * 建立簽名標頭
   * @param {string} method - HTTP 方法
   * @param {string} path - API 路徑
   * @param {Object} body - 請求主體
   * @returns {Object} 簽名標頭
   */
  buildSignatureHeaders(method, path, body = {}) {
    const timestamp = Date.now().toString()
    const bodyString = JSON.stringify(body)
    const sign = signPostRequest(bodyString, timestamp, this.appSecret)
    
    return {
      'appkey': this.appKey,
      'timestamp': timestamp,
      'sign': sign
    }
  }

  /**
   * 查詢商品列表
   * @param {string} accessToken - Access Token
   * @param {object} params - 查詢參數 { page, limit, status }
   * @returns {Object} API 回應
   */
  async getProducts(accessToken, params = {}) {
    try {
      const url = `${this.baseURL}/admin/openapi/v20260301/products/products.json`
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }

      const queryParams = {
        page: params.page || 1,
        limit: params.limit || 10,
        ...(params.status && { status: params.status })
      }

      const response = await axios.get(url, { 
        headers,
        params: queryParams
      })
      
      return {
        success: true,
        status: response.status,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data
      }
    }
  }

  /**
   * 測試商品 API 連線
   * @param {string} accessToken - Access Token
   * @returns {Object} API 回應
   */
  async testProductsAPI(accessToken) {
    try {
      console.log('🔍 開始測試商品 API...')
      
      // 使用 SHOPLINE 商品 API 端點 (官方文件: https://developer.shopline.com/docs/admin-rest-api/product/product/get-products/)
      const url = `${this.baseURL}/admin/openapi/v20260301/products/products.json`
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }

      const params = {
        page: 1,
        limit: 10,
        status: 'active'
      }

      console.log('📡 發送商品 API 請求:', {
        url,
        headers: {
          ...headers,
          'Authorization': 'Bearer [REDACTED]'
        },
        params
      })

      const response = await axios.get(url, { 
        headers,
        params
      })
      
      console.log('✅ 商品 API 回應成功:', {
        status: response.status,
        code: response.data?.code,
        message: response.data?.message,
        hasProducts: response.data?.data?.products ? response.data.data.products.length : 0,
        totalProducts: response.data?.data?.pagination?.total || 0
      })

      return {
        success: true,
        data: response.data,
        message: '商品 API 測試成功 - 真正的 SHOPLINE API 呼叫',
        apiInfo: {
          endpoint: url,
          method: 'GET',
          status: response.status,
          code: response.data?.code,
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/product/product/get-products/'
        }
      }
    } catch (error) {
      console.error('❌ 商品 API 測試失敗:', {
        message: error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data
      })

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        apiInfo: {
          endpoint: `${this.baseURL}/admin/openapi/v20260301/products/products.json`,
          method: 'GET',
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/product/product/get-products/'
        }
      }
    }
  }

  /**
   * 測試訂單 API 連線
   * @param {string} accessToken - Access Token
   * @returns {Object} API 回應
   */
  async testOrdersAPI(accessToken) {
    try {
      console.log('🔍 開始測試訂單 API...')
      
      // 使用 SHOPLINE 訂單 API 端點 (官方文件: https://developer.shopline.com/docs/admin-rest-api/order/order/get-orders/)
      const url = `${this.baseURL}/admin/openapi/v20260301/orders.json`
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }

      const params = {
        page: 1,
        limit: 10,
        status: 'paid'
      }

      console.log('📡 發送訂單 API 請求:', {
        url,
        headers: {
          ...headers,
          'Authorization': 'Bearer [REDACTED]'
        },
        params
      })

      const response = await axios.get(url, { 
        headers,
        params
      })
      
      console.log('✅ 訂單 API 回應成功:', {
        status: response.status,
        code: response.data?.code,
        message: response.data?.message,
        hasOrders: response.data?.data?.orders ? response.data.data.orders.length : 0,
        totalOrders: response.data?.data?.pagination?.total || 0
      })

      return {
        success: true,
        data: response.data,
        message: '訂單 API 測試成功 - 真正的 SHOPLINE API 呼叫',
        apiInfo: {
          endpoint: url,
          method: 'GET',
          status: response.status,
          code: response.data?.code,
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order/get-orders/'
        }
      }
    } catch (error) {
      console.error('❌ 訂單 API 測試失敗:', {
        message: error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data
      })

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        apiInfo: {
          endpoint: `${this.baseURL}/admin/openapi/v20260301/orders.json`,
          method: 'GET',
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order/get-orders/'
        }
      }
    }
  }

  /**
   * 測試商店資訊 API
   * @param {string} accessToken - Access Token
   * @returns {Object} API 回應
   */
  async testShopInfoAPI(accessToken) {
    try {
      console.log('🔍 開始測試商店資訊 API...')
      
      // 使用 SHOPLINE 商店資訊 API 端點 (官方文件: https://developer.shopline.com/docs/admin-rest-api/shop/shop/get-shop/)
      const url = `${this.baseURL}/admin/openapi/v20260301/merchants/shop.json`
      
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }

      console.log('📡 發送商店資訊 API 請求:', {
        url,
        headers: {
          ...headers,
          'Authorization': 'Bearer [REDACTED]'
        }
      })

      const response = await axios.get(url, { headers })
      
      console.log('✅ 商店資訊 API 回應成功:', {
        status: response.status,
        code: response.data?.code,
        message: response.data?.message,
        shopName: response.data?.data?.shop?.name || 'N/A',
        shopDomain: response.data?.data?.shop?.domain || 'N/A'
      })

      return {
        success: true,
        data: response.data,
        message: '商店資訊 API 測試成功 - 真正的 SHOPLINE API 呼叫',
        apiInfo: {
          endpoint: url,
          method: 'GET',
          status: response.status,
          code: response.data?.code,
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/shop/shop/get-shop/'
        }
      }
    } catch (error) {
      console.error('❌ 商店資訊 API 測試失敗:', {
        message: error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data
      })

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        apiInfo: {
          endpoint: `${this.baseURL}/admin/openapi/v20260301/merchants/shop.json`,
          method: 'GET',
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/shop/shop/get-shop/'
        }
      }
    }
  }

  /**
   * 建立訂單
   * @param {string} accessToken - Access Token
   * @param {object} orderPayload - 訂單資料
   * @returns {Object} API 回應
   */
  async createOrder(accessToken, orderPayload) {
    try {
      console.log('🧩 開始建立訂單...')
      
      const url = `${this.baseURL}/admin/openapi/v20260301/orders.json`
      const headers = this.buildAuthHeaders(accessToken)
      
      console.log('📡 發送建立訂單請求:', {
        url,
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' },
        payload: orderPayload
      })
      
      const response = await axios.post(url, orderPayload, { headers })
      
      console.log('✅ 建立訂單成功:', {
        status: response.status,
        orderId: response.data?.order?.id,
        orderNumber: response.data?.order?.order_number
      })
      
      return {
        success: true,
        data: {
          data: response.data  // 包裝成統一格式
        },
        message: '建立訂單成功',
        apiInfo: {
          endpoint: url,
          method: 'POST',
          status: response.status,
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order-management/create-an-order?version=v20260301'
        }
      }
    } catch (error) {
      console.error('❌ 建立訂單失敗:', {
        message: error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data
      })
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        apiInfo: {
          endpoint: `${this.baseURL}/admin/openapi/v20260301/orders.json`,
          method: 'POST',
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order-management/create-an-order?version=v20260301'
        }
      }
    }
  }

  /**
   * 查詢訂單列表
   * @param {string} accessToken - Access Token
   * @param {object} params - 查詢參數 (page, limit, status, etc.)
   * @returns {Object} API 回應
   */
  async getOrders(accessToken, params = {}) {
    try {
      console.log('🔍 開始查詢訂單列表...')
      
      const url = `${this.baseURL}/admin/openapi/v20260301/orders.json`
      const headers = this.buildAuthHeaders(accessToken)
      
      const defaultParams = {
        page: 1,
        limit: 10,
        ...params
      }
      
      console.log('📡 發送查詢訂單列表請求:', {
        url,
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' },
        params: defaultParams
      })
      
      const response = await axios.get(url, { headers, params: defaultParams })
      
      console.log('✅ 查詢訂單列表成功:', {
        status: response.status,
        ordersCount: response.data?.orders?.length || 0,
        total: response.data?.total_count || 0
      })
      
      return {
        success: true,
        data: {
          data: {
            orders: response.data?.orders || [],
            pagination: {
              total: response.data?.total_count || 0,
              page: defaultParams.page,
              limit: defaultParams.limit
            }
          }
        },
        message: '查詢訂單列表成功',
        apiInfo: {
          endpoint: url,
          method: 'GET',
          status: response.status,
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order-management/get-orders?version=v20260301'
        }
      }
    } catch (error) {
      console.error('❌ 查詢訂單列表失敗:', {
        message: error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data
      })
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        apiInfo: {
          endpoint: `${this.baseURL}/admin/openapi/v20260301/orders.json`,
          method: 'GET',
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order-management/get-orders?version=v20260301'
        }
      }
    }
  }

  /**
   * 查詢訂單詳情
   * @param {string} accessToken - Access Token
   * @param {string} orderId - 訂單 ID
   * @returns {Object} API 回應
   */
  async getOrderDetail(accessToken, orderId) {
    try {
      console.log('🔍 開始查詢訂單詳情...')
      
      // 正確的查詢方式：使用 query parameter ids
      const url = `${this.baseURL}/admin/openapi/v20260301/orders.json`
      const headers = this.buildAuthHeaders(accessToken)
      const params = {
        ids: orderId  // 使用 ids query parameter
      }
      
      console.log('📡 發送查詢訂單詳情請求:', {
        url,
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' },
        params
      })
      
      const response = await axios.get(url, { headers, params })
      
      // Debug: 顯示完整回應
      console.log('📦 API 回應:', {
        status: response.status,
        ordersCount: response.data?.orders?.length || 0,
        totalCount: response.data?.total_count,
        firstOrderId: response.data?.orders?.[0]?.id
      })
      
      // 從訂單列表中取得第一個訂單（應該只有一個）
      const order = response.data?.orders?.[0]
      
      if (!order) {
        console.error('❌ 回應中沒有訂單資料:', JSON.stringify(response.data, null, 2))
        throw new Error('找不到指定的訂單')
      }
      
      console.log('✅ 查詢訂單詳情成功:', {
        status: response.status,
        orderId: order.id,
        orderNumber: order.order_number
      })
      
      return {
        success: true,
        data: {
          data: {
            order: order  // 包裝成統一格式
          }
        },
        message: '查詢訂單詳情成功',
        apiInfo: {
          endpoint: url,
          method: 'GET',
          status: response.status,
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order-management/get-orders?version=v20260301'
        }
      }
    } catch (error) {
      console.error('❌ 查詢訂單詳情失敗:', {
        message: error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data
      })
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        apiInfo: {
          endpoint: `${this.baseURL}/admin/openapi/v20260301/orders.json?ids=${orderId}`,
          method: 'GET',
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order-management/get-orders?version=v20260301'
        }
      }
    }
  }

  /**
   * 更新訂單
   * @param {string} accessToken - Access Token
   * @param {string} orderId - 訂單 ID
   * @param {object} updatePayload - 更新資料
   * @returns {Object} API 回應
   */
  async updateOrder(accessToken, orderId, updatePayload) {
    try {
      console.log('🔄 開始更新訂單...')
      
      const url = `${this.baseURL}/admin/openapi/v20260301/orders/${orderId}.json`
      const headers = this.buildAuthHeaders(accessToken)
      
      console.log('📡 發送更新訂單請求:', {
        url,
        headers: { ...headers, Authorization: 'Bearer [REDACTED]' },
        orderId,
        payload: updatePayload
      })
      
      const response = await axios.put(url, updatePayload, { headers })
      
      console.log('✅ 更新訂單成功:', {
        status: response.status,
        orderId: response.data?.order?.id
      })
      
      return {
        success: true,
        data: {
          data: response.data  // 包裝成統一格式
        },
        message: '更新訂單成功',
        apiInfo: {
          endpoint: url,
          method: 'PUT',
          status: response.status,
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order-management/update-an-order?version=v20260301'
        }
      }
    } catch (error) {
      console.error('❌ 更新訂單失敗:', {
        message: error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        data: error.response?.data
      })
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
        code: error.response?.data?.code,
        apiInfo: {
          endpoint: `${this.baseURL}/admin/openapi/v20260301/orders/${orderId}.json`,
          method: 'PUT',
          timestamp: new Date().toISOString(),
          source: 'https://developer.shopline.com/docs/admin-rest-api/order/order-management/update-an-order?version=v20260301'
        }
      }
    }
  }

  /**
   * 測試所有 API 端點
   * @param {string} accessToken - Access Token
   * @returns {Object} 所有 API 測試結果
   */
  async testAllAPIs(accessToken) {
    console.log('🚀 開始測試所有 SHOPLINE API...')
    
    const results = {
      products: await this.testProductsAPI(accessToken),
      orders: await this.testOrdersAPI(accessToken),
      shopInfo: await this.testShopInfoAPI(accessToken)
    }

    const successCount = Object.values(results).filter(r => r.success).length
    const totalCount = Object.keys(results).length

    console.log(`📊 API 測試完成: ${successCount}/${totalCount} 成功`)

    return {
      success: successCount === totalCount,
      results,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Token 刷新
   * @param {string} refreshToken
   */
  async refreshToken(refreshToken) {
    try {
      console.log('🔄 開始刷新 Token...')
      
      const timestamp = Date.now().toString()
      const body = JSON.stringify({})
      const sign = signPostRequest(body, timestamp, this.appSecret)
      
      const response = await axios.post(
        `${this.baseURL}/admin/oauth/token/refresh`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'appkey': this.appKey,
            'timestamp': timestamp,
            'sign': sign
          }
        }
      )
      
      if (response.data.code === 200) {
        console.log('✅ Token 刷新成功')
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ Token 刷新失敗:', response.data.message)
        return {
          success: false,
          error: response.data.message || 'Token refresh failed'
        }
      }
    } catch (error) {
      console.error('❌ Token 刷新錯誤:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * Token 撤銷
   * @param {string} accessToken
   */
  async revokeToken(accessToken) {
    try {
      console.log('🗑️ 開始撤銷 Token...')
      
      const timestamp = Date.now().toString()
      const body = JSON.stringify({})
      const sign = signPostRequest(body, timestamp, this.appSecret)
      
      const response = await axios.post(
        `${this.baseURL}/admin/oauth/token/revoke`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'appkey': this.appKey,
            'timestamp': timestamp,
            'sign': sign,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.data.code === 200) {
        console.log('✅ Token 撤銷成功')
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ Token 撤銷失敗:', response.data.message)
        return {
          success: false,
          error: response.data.message || 'Token revoke failed'
        }
      }
    } catch (error) {
      console.error('❌ Token 撤銷錯誤:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * OAuth 授權
   * @param {string} code
   * @param {string} state
   */
  async authorizeOAuth(code, state) {
    try {
      console.log('🔐 開始 OAuth 授權...')
      
      const timestamp = Date.now().toString()
      const body = JSON.stringify({ code, state })
      const sign = signPostRequest(body, timestamp, this.appSecret)
      
      const response = await axios.post(
        `${this.baseURL}/admin/oauth/token/create`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'appkey': this.appKey,
            'timestamp': timestamp,
            'sign': sign
          }
        }
      )
      
      if (response.data.code === 200) {
        console.log('✅ OAuth 授權成功')
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ OAuth 授權失敗:', response.data.message)
        return {
          success: false,
          error: response.data.message || 'OAuth authorization failed'
        }
      }
    } catch (error) {
      console.error('❌ OAuth 授權錯誤:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * OAuth 撤銷
   * @param {string} accessToken
   */
  async revokeOAuth(accessToken) {
    try {
      console.log('🚫 開始 OAuth 撤銷...')
      
      const timestamp = Date.now().toString()
      const body = JSON.stringify({})
      const sign = signPostRequest(body, timestamp, this.appSecret)
      
      const response = await axios.post(
        `${this.baseURL}/admin/oauth/revoke`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'appkey': this.appKey,
            'timestamp': timestamp,
            'sign': sign,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.data.code === 200) {
        console.log('✅ OAuth 撤銷成功')
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ OAuth 撤銷失敗:', response.data.message)
        return {
          success: false,
          error: response.data.message || 'OAuth revoke failed'
        }
      }
    } catch (error) {
      console.error('❌ OAuth 撤銷錯誤:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * 登入
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    try {
      console.log('👤 開始登入...')
      
      const timestamp = Date.now().toString()
      const body = JSON.stringify({ username, password })
      const sign = signPostRequest(body, timestamp, this.appSecret)
      
      const response = await axios.post(
        `${this.baseURL}/admin/auth/login`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'appkey': this.appKey,
            'timestamp': timestamp,
            'sign': sign
          }
        }
      )
      
      if (response.data.code === 200) {
        console.log('✅ 登入成功')
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ 登入失敗:', response.data.message)
        return {
          success: false,
          error: response.data.message || 'Login failed'
        }
      }
    } catch (error) {
      console.error('❌ 登入錯誤:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * 登出
   * @param {string} accessToken
   */
  async logout(accessToken) {
    try {
      console.log('👋 開始登出...')
      
      const timestamp = Date.now().toString()
      const body = JSON.stringify({})
      const sign = signPostRequest(body, timestamp, this.appSecret)
      
      const response = await axios.post(
        `${this.baseURL}/admin/auth/logout`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'appkey': this.appKey,
            'timestamp': timestamp,
            'sign': sign,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.data.code === 200) {
        console.log('✅ 登出成功')
        return {
          success: true,
          data: response.data.data
        }
      } else {
        console.error('❌ 登出失敗:', response.data.message)
        return {
          success: false,
          error: response.data.message || 'Logout failed'
        }
      }
    } catch (error) {
      console.error('❌ 登出錯誤:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }
}

module.exports = ShoplineAPIClient
