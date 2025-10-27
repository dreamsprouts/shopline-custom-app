/**
 * Shopline API Client Wrapper
 * 
 * 包裝現有的 ShoplineAPIClient，在 API 呼叫後自動發佈事件
 * 採用「雙寫模式」：保持原有邏輯不變，額外發佈事件
 */

const ShoplineAPIClient = require('../../../utils/shopline-api')
const { ShoplineSourceConnector } = require('./ShoplineSourceConnector')

class ShoplineAPIClientWrapper extends ShoplineAPIClient {
  constructor() {
    super()
    this.sourceConnector = new ShoplineSourceConnector()
    console.log('🔧 [ShoplineAPIClientWrapper] 初始化:', {
      sourceConnectorEnabled: this.sourceConnector.enabled,
      eventBusEnabled: this.sourceConnector.eventBus.isEnabled()
    })
  }

  /**
   * 測試商店資訊 API (包裝版本)
   * @param {string} accessToken - Access Token
   * @returns {Object} API 回應
   */
  async testShopInfoAPI(accessToken) {
    // 呼叫原始方法
    const result = await super.testShopInfoAPI(accessToken)
    
    // 發佈事件
    await this.sourceConnector.publishShopInfoEvent(result, accessToken)
    
    return result
  }

  /**
   * 查詢商品列表 (包裝版本)
   * @param {string} accessToken - Access Token
   * @param {object} params - 查詢參數
   * @returns {Object} API 回應
   */
  async getProducts(accessToken, params = {}) {
    // 呼叫原始方法
    const result = await super.getProducts(accessToken, params)
    
    // 發佈事件
    await this.sourceConnector.publishProductsListEvent(result, accessToken, params)
    
    return result
  }

  /**
   * 建立商品 (包裝版本)
   * @param {string} accessToken - Access Token
   * @param {object} productPayload - 商品資料
   * @returns {Object} API 回應
   */
  async createProduct(accessToken, productPayload) {
    // 呼叫原始方法
    const result = await super.createProduct(accessToken, productPayload)
    
    // 發佈事件
    await this.sourceConnector.publishProductCreatedEvent(result, accessToken, productPayload)
    
    return result
  }

  /**
   * 建立訂單 (包裝版本)
   * @param {string} accessToken - Access Token
   * @param {object} orderPayload - 訂單資料
   * @returns {Object} API 回應
   */
  async createOrder(accessToken, orderPayload) {
    // 呼叫原始方法
    const result = await super.createOrder(accessToken, orderPayload)
    
    // 發佈事件
    await this.sourceConnector.publishOrderCreatedEvent(result, accessToken, orderPayload)
    
    return result
  }

  /**
   * 查詢訂單列表 (包裝版本)
   * @param {string} accessToken - Access Token
   * @param {object} params - 查詢參數
   * @returns {Object} API 回應
   */
  async getOrders(accessToken, params = {}) {
    // 呼叫原始方法
    const result = await super.getOrders(accessToken, params)
    
    // 發佈事件
    await this.sourceConnector.publishOrdersListEvent(result, accessToken, params)
    
    return result
  }

  /**
   * 查詢訂單詳情 (包裝版本)
   * @param {string} accessToken - Access Token
   * @param {string} orderId - 訂單 ID
   * @returns {Object} API 回應
   */
  async getOrderDetail(accessToken, orderId) {
    // 呼叫原始方法
    const result = await super.getOrderDetail(accessToken, orderId)
    
    // 發佈事件
    await this.sourceConnector.publishOrderDetailEvent(result, accessToken, orderId)
    
    return result
  }

  /**
   * 更新訂單 (包裝版本)
   * @param {string} accessToken - Access Token
   * @param {string} orderId - 訂單 ID
   * @param {object} updatePayload - 更新資料
   * @returns {Object} API 回應
   */
  async updateOrder(accessToken, orderId, updatePayload) {
    // 呼叫原始方法
    const result = await super.updateOrder(accessToken, orderId, updatePayload)
    
    // 發佈事件
    await this.sourceConnector.publishOrderUpdatedEvent(result, accessToken, orderId, updatePayload)
    
    return result
  }

  /**
   * 測試商品 API (包裝版本)
   * @param {string} accessToken - Access Token
   * @returns {Object} API 回應
   */
  async testProductsAPI(accessToken) {
    // 呼叫原始方法
    const result = await super.testProductsAPI(accessToken)
    
    // 發佈事件 (使用預設參數)
    await this.sourceConnector.publishProductsListEvent(result, accessToken, {
      page: 1,
      limit: 10,
      status: 'active'
    })
    
    return result
  }

  /**
   * 測試訂單 API (包裝版本)
   * @param {string} accessToken - Access Token
   * @returns {Object} API 回應
   */
  async testOrdersAPI(accessToken) {
    // 呼叫原始方法
    const result = await super.testOrdersAPI(accessToken)
    
    // 發佈事件 (使用預設參數)
    await this.sourceConnector.publishOrdersListEvent(result, accessToken, {
      page: 1,
      limit: 10,
      status: 'paid'
    })
    
    return result
  }

  /**
   * 測試所有 API (包裝版本)
   * @param {string} accessToken - Access Token
   * @returns {Object} 所有 API 測試結果
   */
  async testAllAPIs(accessToken) {
    // 呼叫原始方法
    const result = await super.testAllAPIs(accessToken)
    
    // 注意：testAllAPIs 內部會呼叫其他包裝方法，所以事件會自動發佈
    // 這裡不需要額外處理
    
    return result
  }

  /**
   * 取得 Source Connector 實例
   * @returns {ShoplineSourceConnector}
   */
  getSourceConnector() {
    return this.sourceConnector
  }

  /**
   * 檢查 Event Bus 是否啟用
   * @returns {boolean}
   */
  isEventBusEnabled() {
    return this.sourceConnector.isEnabled()
  }

  /**
   * 動態啟用/停用 Event Bus
   * @param {boolean} enabled
   */
  setEventBusEnabled(enabled) {
    this.sourceConnector.setEnabled(enabled)
  }

  /**
   * Token 刷新 (包裝版本)
   * @param {string} refreshToken - Refresh Token
   */
  async refreshToken(refreshToken) {
    // 呼叫原始方法
    const result = await super.refreshToken(refreshToken)
    
    // 發佈事件
    await this.sourceConnector.publishTokenRefreshedEvent(
      result, 
      result.data?.access_token, 
      refreshToken
    )
    
    return result
  }

  /**
   * Token 撤銷 (包裝版本)
   * @param {string} accessToken - Access Token
   */
  async revokeToken(accessToken) {
    console.log('🔍 [ShoplineAPIClientWrapper] revokeToken 被呼叫:', accessToken ? `${accessToken.substring(0, 10)}...` : null)
    
    // 呼叫原始方法
    const result = await super.revokeToken(accessToken)
    console.log('🔍 [ShoplineAPIClientWrapper] revokeToken 結果:', result)
    
    // 無論成功或失敗都發佈事件
    console.log('🔍 [ShoplineAPIClientWrapper] 準備發佈撤銷事件')
    await this.sourceConnector.publishTokenRevokedEvent(result, accessToken)
    
    return result
  }

  /**
   * OAuth 授權 (包裝版本)
   * @param {string} code - 授權碼
   * @param {string} state - 狀態參數
   */
  async authorizeOAuth(code, state) {
    // 呼叫原始方法
    const result = await super.authorizeOAuth(code, state)
    
    // 發佈事件
    await this.sourceConnector.publishOAuthAuthorizedEvent(result, code, state)
    
    return result
  }

  /**
   * OAuth 撤銷 (包裝版本)
   * @param {string} accessToken - Access Token
   */
  async revokeOAuth(accessToken) {
    // 呼叫原始方法
    const result = await super.revokeOAuth(accessToken)
    
    // 發佈事件
    await this.sourceConnector.publishOAuthRevokedEvent(result, accessToken)
    
    return result
  }

  /**
   * 登入 (包裝版本)
   * @param {string} username - 用戶名
   * @param {string} password - 密碼
   * @param {string} loginMethod - 登入方式
   */
  async login(username, password, loginMethod = 'oauth') {
    try {
      // 呼叫原始方法
      const result = await super.login(username, password)
      
      // 發佈事件
      if (result.success) {
        await this.sourceConnector.publishLoginSuccessEvent(result, username, loginMethod)
      } else {
        await this.sourceConnector.publishLoginFailedEvent(result, username, 'invalid_credentials')
      }
      
      return result
    } catch (error) {
      // 發佈登入失敗事件
      await this.sourceConnector.publishLoginFailedEvent(
        { success: false, error_message: error.message }, 
        username, 
        'login_error'
      )
      throw error
    }
  }

  /**
   * 登出 (包裝版本)
   * @param {string} accessToken - Access Token
   */
  async logout(accessToken) {
    // 呼叫原始方法
    const result = await super.logout(accessToken)
    
    // 發佈事件
    await this.sourceConnector.publishLogoutEvent(result, accessToken)
    
    return result
  }
}

module.exports = ShoplineAPIClientWrapper
