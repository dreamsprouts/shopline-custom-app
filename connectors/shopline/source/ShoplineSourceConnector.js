/**
 * Shopline Source Connector
 * 
 * 負責將 Shopline API 回應轉換為 Standard Events
 * 並發佈到 Event Bus
 * 
 * 採用「雙寫模式」：
 * 1. 保持現有 API 呼叫邏輯不變
 * 2. 額外發佈事件到 Event Bus
 * 3. 透過功能開關控制啟用/停用
 */

const { createEventPayload } = require('../../../core/events')
const { getEventBus } = require('../../../core/event-bus')
const { getEventConfig } = require('../../../config/event-driven')
const ShoplineAPIClient = require('../../../utils/shopline-api')

class ShoplineSourceConnector {
  constructor() {
    this.eventBus = getEventBus()
    this.config = getEventConfig()
    this.enabled = process.env.ENABLE_SHOPLINE_SOURCE === 'true'
    this.apiClient = new ShoplineAPIClient()
    
    console.log('🔧 [ShoplineSourceConnector] 初始化:', {
      enabled: this.enabled,
      ENABLE_SHOPLINE_SOURCE: process.env.ENABLE_SHOPLINE_SOURCE,
      eventBusEnabled: this.eventBus.isEnabled()
    })
  }

  /**
   * 發佈商店資訊事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - Access Token
   */
  async publishShopInfoEvent(apiResponse, accessToken) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const shopData = apiResponse.data?.data
      if (!shopData) return

      const event = createEventPayload('shop.queried', {
        shop_id: shopData.id,
        shop_name: shopData.name,
        shop_domain: shopData.domain,
        shop_url: shopData.url,
        shop_currency: shopData.currency,
        shop_timezone: shopData.timezone,
        shop_created_at: shopData.created_at,
        shop_updated_at: shopData.updated_at
      }, {
        source: 'shopline',
        api_endpoint: '/admin/openapi/v20260301/merchants/shop.json',
        access_token: accessToken.substring(0, 10) + '...' // 部分遮罩
      })

      await this.eventBus.publish(event)
      console.log('📡 [Shopline Source] 商店資訊事件已發佈:', event.id)
    } catch (error) {
      console.error('❌ [Shopline Source] 發佈商店資訊事件失敗:', error.message)
    }
  }

  /**
   * 發佈商品列表事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - Access Token
   * @param {Object} params - 查詢參數
   */
  async publishProductsListEvent(apiResponse, accessToken, params = {}) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const products = apiResponse.data?.products || []
      const pagination = apiResponse.data?.pagination || {}

      const event = createEventPayload('product.queried', {
        products: products.map(product => ({
          product_id: product.id,
          title: product.title,
          handle: product.handle,
          status: product.status,
          created_at: product.created_at,
          updated_at: product.updated_at,
          variants_count: product.variants?.length || 0
        })),
        pagination: {
          total: pagination.total || 0,
          page: params.page || 1,
          limit: params.limit || 10
        }
      }, {
        source: 'shopline',
        api_endpoint: '/admin/openapi/v20260301/products/products.json',
        access_token: accessToken.substring(0, 10) + '...',
        query_params: params
      })

      await this.eventBus.publish(event)
      console.log('📡 [Shopline Source] 商品列表事件已發佈:', event.id)
    } catch (error) {
      console.error('❌ [Shopline Source] 發佈商品列表事件失敗:', error.message)
    }
  }

  /**
   * 發佈商品建立事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - Access Token
   * @param {Object} productPayload - 商品建立資料
   */
  async publishProductCreatedEvent(apiResponse, accessToken, productPayload) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const productData = apiResponse.data?.product
      if (!productData) return

      const event = createEventPayload('product.created', {
        product_id: productData.id,
        title: productData.title,
        handle: productData.handle,
        status: productData.status,
        created_at: productData.created_at,
        updated_at: productData.updated_at,
        variants: productData.variants?.map(variant => ({
          variant_id: variant.id,
          sku: variant.sku,
          price: variant.price,
          inventory_tracker: variant.inventory_tracker
        })) || []
      }, {
        source: 'shopline',
        api_endpoint: '/admin/openapi/v20260301/products/products.json',
        access_token: accessToken.substring(0, 10) + '...',
        product_payload: {
          title: productPayload.product?.title,
          handle: productPayload.product?.handle
        }
      })

      await this.eventBus.publish(event)
      console.log('📡 [Shopline Source] 商品建立事件已發佈:', event.id)
    } catch (error) {
      console.error('❌ [Shopline Source] 發佈商品建立事件失敗:', error.message)
    }
  }

  /**
   * 發佈訂單建立事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - Access Token
   * @param {Object} orderPayload - 訂單建立資料
   */
  async publishOrderCreatedEvent(apiResponse, accessToken, orderPayload) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const orderData = apiResponse.data?.data?.order
      if (!orderData) return

      const event = createEventPayload('order.created', {
        order_id: orderData.id,
        order_number: orderData.order_number,
        status: orderData.status,
        total_price: orderData.total_price,
        currency: orderData.currency,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at,
        line_items: orderData.line_items?.map(item => ({
          variant_id: item.variant_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price
        })) || []
      }, {
        source: 'shopline',
        api_endpoint: '/admin/openapi/v20260301/orders.json',
        access_token: accessToken.substring(0, 10) + '...',
        order_payload: {
          tags: orderPayload.order?.tags,
          note_attributes: orderPayload.order?.note_attributes
        }
      })

      await this.eventBus.publish(event)
      console.log('📡 [Shopline Source] 訂單建立事件已發佈:', event.id)
    } catch (error) {
      console.error('❌ [Shopline Source] 發佈訂單建立事件失敗:', error.message)
    }
  }

  /**
   * 發佈訂單列表事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - Access Token
   * @param {Object} params - 查詢參數
   */
  async publishOrdersListEvent(apiResponse, accessToken, params = {}) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const orders = apiResponse.data?.data?.orders || []
      const pagination = apiResponse.data?.data?.pagination || {}

      const event = createEventPayload('order.queried', {
        orders: orders.map(order => ({
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          total_price: order.total_price,
          currency: order.currency,
          created_at: order.created_at,
          updated_at: order.updated_at
        })),
        pagination: {
          total: pagination.total || 0,
          page: params.page || 1,
          limit: params.limit || 10
        }
      }, {
        source: 'shopline',
        api_endpoint: '/admin/openapi/v20260301/orders.json',
        access_token: accessToken.substring(0, 10) + '...',
        query_params: params
      })

      await this.eventBus.publish(event)
      console.log('📡 [Shopline Source] 訂單列表事件已發佈:', event.id)
    } catch (error) {
      console.error('❌ [Shopline Source] 發佈訂單列表事件失敗:', error.message)
    }
  }

  /**
   * 發佈訂單詳情事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - Access Token
   * @param {string} orderId - 訂單 ID
   */
  async publishOrderDetailEvent(apiResponse, accessToken, orderId) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const orderData = apiResponse.data?.data?.order
      if (!orderData) return

      const event = createEventPayload('order.queried', {
        order_id: orderData.id,
        order_number: orderData.order_number,
        status: orderData.status,
        total_price: orderData.total_price,
        currency: orderData.currency,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at,
        line_items: orderData.line_items?.map(item => ({
          variant_id: item.variant_id,
          title: item.title,
          quantity: item.quantity,
          price: item.price
        })) || [],
        customer: orderData.customer ? {
          customer_id: orderData.customer.id,
          email: orderData.customer.email,
          first_name: orderData.customer.first_name,
          last_name: orderData.customer.last_name
        } : null
      }, {
        source: 'shopline',
        api_endpoint: `/admin/openapi/v20260301/orders.json?ids=${orderId}`,
        access_token: accessToken.substring(0, 10) + '...',
        order_id: orderId
      })

      await this.eventBus.publish(event)
      console.log('📡 [Shopline Source] 訂單詳情事件已發佈:', event.id)
    } catch (error) {
      console.error('❌ [Shopline Source] 發佈訂單詳情事件失敗:', error.message)
    }
  }

  /**
   * 發佈訂單更新事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - Access Token
   * @param {string} orderId - 訂單 ID
   * @param {Object} updatePayload - 更新資料
   */
  async publishOrderUpdatedEvent(apiResponse, accessToken, orderId, updatePayload) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const orderData = apiResponse.data?.order
      if (!orderData) return

      const event = createEventPayload('order.queried', {
        order_id: orderData.id,
        order_number: orderData.order_number,
        status: orderData.status,
        total_price: orderData.total_price,
        currency: orderData.currency,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at,
        changes: {
          tags: updatePayload.order?.tags,
          note_attributes: updatePayload.order?.note_attributes
        }
      }, {
        source: 'shopline',
        api_endpoint: `/admin/openapi/v20260301/orders/${orderId}.json`,
        access_token: accessToken.substring(0, 10) + '...',
        order_id: orderId,
        update_payload: updatePayload
      })

      await this.eventBus.publish(event)
      console.log('📡 [Shopline Source] 訂單更新事件已發佈:', event.id)
    } catch (error) {
      console.error('❌ [Shopline Source] 發佈訂單更新事件失敗:', error.message)
    }
  }

  // === 雙寫模式：API 呼叫 + 事件發佈 ===
  
  /**
   * 取得商品列表 (雙寫模式)
   * @param {string} accessToken - Access Token
   * @param {Object} params - 查詢參數
   * @returns {Promise<Object>} API 回應
   */
  async getProducts(accessToken, params = {}) {
    // 1. 呼叫原始 API
    const result = await this.apiClient.getProducts(accessToken, params)
    
    // 2. 發佈事件 (如果啟用)
    if (this.isEnabled() && result.success) {
      await this.publishProductsListEvent(result, accessToken, params)
    }
    
    // 3. 回傳原始結果
    return result
  }

  /**
   * 建立商品 (雙寫模式)
   * @param {string} accessToken - Access Token
   * @param {Object} payload - 商品資料
   * @returns {Promise<Object>} API 回應
   */
  async createProduct(accessToken, payload) {
    console.log('🔧 [ShoplineSourceConnector] createProduct 被呼叫:', {
      enabled: this.isEnabled(),
      hasAccessToken: !!accessToken,
      payloadTitle: payload?.product?.title
    })
    
    // 1. 呼叫原始 API
    const result = await this.apiClient.createProduct(accessToken, payload)
    
    console.log('🔧 [ShoplineSourceConnector] API 呼叫結果:', {
      success: result.success,
      enabled: this.isEnabled()
    })
    
    // 2. 發佈事件 (如果啟用)
    if (this.isEnabled() && result.success) {
      console.log('🔧 [ShoplineSourceConnector] 準備發佈事件...')
      await this.publishProductCreatedEvent(result, accessToken, payload)
    } else {
      console.log('🔧 [ShoplineSourceConnector] 跳過事件發佈:', {
        enabled: this.isEnabled(),
        success: result.success
      })
    }
    
    // 3. 回傳原始結果
    return result
  }

  /**
   * 建立訂單 (雙寫模式)
   * @param {string} accessToken - Access Token
   * @param {Object} payload - 訂單資料
   * @returns {Promise<Object>} API 回應
   */
  async createOrder(accessToken, payload) {
    // 1. 呼叫原始 API
    const result = await this.apiClient.createOrder(accessToken, payload)
    
    // 2. 發佈事件 (如果啟用)
    if (this.isEnabled() && result.success) {
      await this.publishOrderCreatedEvent(result, accessToken, payload)
    }
    
    // 3. 回傳原始結果
    return result
  }

  /**
   * 取得商店資訊 (雙寫模式)
   * @param {string} accessToken - Access Token
   * @returns {Promise<Object>} API 回應
   */
  async getShopInfo(accessToken) {
    // 1. 呼叫原始 API
    const result = await this.apiClient.testShopInfoAPI(accessToken)
    
    // 2. 發佈事件 (如果啟用)
    if (this.isEnabled() && result.success) {
      await this.publishShopInfoEvent(result, accessToken)
    }
    
    // 3. 回傳原始結果
    return result
  }

  /**
   * 檢查是否啟用
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled
  }

  /**
   * 動態啟用/停用
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled
    console.log(`🔧 [Shopline Source] ${enabled ? '已啟用' : '已停用'}`)
  }

  /**
   * 發佈 Token 刷新事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - 新的 Access Token
   * @param {string} refreshToken - Refresh Token
   */
  async publishTokenRefreshedEvent(apiResponse, accessToken, refreshToken) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const event = createEventPayload('auth.token_refreshed', {
        access_token: accessToken ? `${accessToken.substring(0, 10)}...` : null,
        refresh_token: refreshToken ? `${refreshToken.substring(0, 10)}...` : null,
        expires_in: apiResponse.data?.expires_in || null,
        token_type: apiResponse.data?.token_type || 'Bearer',
        scope: apiResponse.data?.scope || null,
        refreshed_at: new Date().toISOString()
      })

      await this.eventBus.publish(event)
      console.log(`📡 [Shopline Source] Token 刷新事件已發佈: ${event.id}`)
    } catch (error) {
      console.error('❌ [Shopline Source] Token 刷新事件發佈失敗:', error.message)
    }
  }

  /**
   * 發佈 Token 撤銷事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - 被撤銷的 Access Token
   */
  async publishTokenRevokedEvent(apiResponse, accessToken) {
    console.log('🔍 [Shopline Source] publishTokenRevokedEvent 被呼叫:', {
      enabled: this.enabled,
      apiResponse: apiResponse,
      accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : null
    })
    
    if (!this.enabled) {
      console.log('❌ [Shopline Source] Event Bus 未啟用，跳過事件發佈')
      return
    }

    try {
      const event = createEventPayload('auth.token_revoked', {
        access_token: accessToken ? `${accessToken.substring(0, 10)}...` : null,
        revoked_at: new Date().toISOString(),
        reason: 'manual_revoke'
      })

      console.log('📡 [Shopline Source] 準備發佈 Token 撤銷事件:', event.id)
      await this.eventBus.publish(event)
      console.log(`📡 [Shopline Source] Token 撤銷事件已發佈: ${event.id}`)
    } catch (error) {
      console.error('❌ [Shopline Source] Token 撤銷事件發佈失敗:', error.message)
    }
  }

  /**
   * 發佈 OAuth 授權事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} code - 授權碼
   * @param {string} state - 狀態參數
   */
  async publishOAuthAuthorizedEvent(apiResponse, code, state) {
    console.log('🔍 [Shopline Source] publishOAuthAuthorizedEvent 被呼叫:', {
      enabled: this.enabled,
      apiResponse: apiResponse,
      code: code ? `${code.substring(0, 10)}...` : null,
      state: state
    })
    
    if (!this.enabled) {
      console.log('❌ [Shopline Source] Event Bus 未啟用，跳過事件發佈')
      return
    }
    
    if (!apiResponse.success) {
      console.log('❌ [Shopline Source] API 回應失敗，跳過事件發佈')
      return
    }

    try {
      const event = createEventPayload('auth.oauth_authorized', {
        authorization_code: code ? `${code.substring(0, 10)}...` : null,
        state: state || null,
        access_token: apiResponse.data?.access_token ? `${apiResponse.data.access_token.substring(0, 10)}...` : null,
        refresh_token: apiResponse.data?.refresh_token ? `${apiResponse.data.refresh_token.substring(0, 10)}...` : null,
        expires_in: apiResponse.data?.expires_in || null,
        scope: apiResponse.data?.scope || null,
        authorized_at: new Date().toISOString()
      })

      console.log('📡 [Shopline Source] 準備發佈 OAuth 授權事件:', event.id)
      await this.eventBus.publish(event)
      console.log(`📡 [Shopline Source] OAuth 授權事件已發佈: ${event.id}`)
    } catch (error) {
      console.error('❌ [Shopline Source] OAuth 授權事件發佈失敗:', error.message)
    }
  }

  /**
   * 發佈 OAuth 撤銷事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - 被撤銷的 Access Token
   */
  async publishOAuthRevokedEvent(apiResponse, accessToken) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const event = createEventPayload('auth.oauth_revoked', {
        access_token: accessToken ? `${accessToken.substring(0, 10)}...` : null,
        revoked_at: new Date().toISOString(),
        reason: 'oauth_revoke'
      })

      await this.eventBus.publish(event)
      console.log(`📡 [Shopline Source] OAuth 撤銷事件已發佈: ${event.id}`)
    } catch (error) {
      console.error('❌ [Shopline Source] OAuth 撤銷事件發佈失敗:', error.message)
    }
  }

  /**
   * 發佈登入成功事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} username - 用戶名
   * @param {string} loginMethod - 登入方式
   */
  async publishLoginSuccessEvent(apiResponse, username, loginMethod = 'oauth') {
    if (!this.enabled || !apiResponse.success) return

    try {
      const event = createEventPayload('auth.login_success', {
        username: username || null,
        login_method: loginMethod,
        access_token: apiResponse.data?.access_token ? `${apiResponse.data.access_token.substring(0, 10)}...` : null,
        expires_in: apiResponse.data?.expires_in || null,
        scope: apiResponse.data?.scope || null,
        login_at: new Date().toISOString()
      })

      await this.eventBus.publish(event)
      console.log(`📡 [Shopline Source] 登入成功事件已發佈: ${event.id}`)
    } catch (error) {
      console.error('❌ [Shopline Source] 登入成功事件發佈失敗:', error.message)
    }
  }

  /**
   * 發佈登入失敗事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} username - 用戶名
   * @param {string} reason - 失敗原因
   */
  async publishLoginFailedEvent(apiResponse, username, reason) {
    if (!this.enabled) return

    try {
      const event = createEventPayload('auth.login_failed', {
        username: username || null,
        reason: reason || 'unknown',
        error_code: apiResponse?.error_code || null,
        error_message: apiResponse?.error_message || null,
        failed_at: new Date().toISOString()
      })

      await this.eventBus.publish(event)
      console.log(`📡 [Shopline Source] 登入失敗事件已發佈: ${event.id}`)
    } catch (error) {
      console.error('❌ [Shopline Source] 登入失敗事件發佈失敗:', error.message)
    }
  }

  /**
   * 發佈登出事件
   * @param {Object} apiResponse - Shopline API 回應
   * @param {string} accessToken - 被登出的 Access Token
   */
  async publishLogoutEvent(apiResponse, accessToken) {
    if (!this.enabled || !apiResponse.success) return

    try {
      const event = createEventPayload('auth.logout', {
        access_token: accessToken ? `${accessToken.substring(0, 10)}...` : null,
        logout_at: new Date().toISOString(),
        reason: 'manual_logout'
      })

      await this.eventBus.publish(event)
      console.log(`📡 [Shopline Source] 登出事件已發佈: ${event.id}`)
    } catch (error) {
      console.error('❌ [Shopline Source] 登出事件發佈失敗:', error.message)
    }
  }
}

module.exports = { ShoplineSourceConnector }
