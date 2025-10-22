# Phase 1 實施計劃：建立抽象層

## 📋 文件資訊

- **階段**: Phase 1 - 建立抽象層
- **預計時間**: 2-3 天
- **狀態**: 📋 規劃中
- **目標**: 建立核心抽象層，將 Shopline 重構為第一個平台插件
- **成功標準**: 所有現有測試通過，功能零破壞

---

## 🎯 Phase 1 目標

### 核心目標
1. ✅ 建立清晰的抽象介面定義
2. ✅ 實作基礎類別提供通用功能
3. ✅ 將 Shopline 重構為符合抽象層的平台插件
4. ✅ 建立統一的服務層
5. ✅ 保持所有現有功能正常運作

### 非目標（留待後續階段）
- ❌ 改動路由層（Phase 2）
- ❌ 改動前端 UI（Phase 4）
- ❌ 實作第二平台（Phase 4）
- ❌ 資料庫結構變更（Phase 2）

---

## 📂 目錄結構變更

### 新增的目錄和檔案
```
custom-app/
├── core/                              # 新增
│   ├── interfaces/                    # 新增
│   │   ├── IPlatform.js              # 新增
│   │   ├── IOAuthProvider.js         # 新增
│   │   ├── IAPIClient.js             # 新增
│   │   └── IDataMapper.js            # 新增
│   ├── base/                          # 新增
│   │   ├── BasePlatform.js           # 新增
│   │   ├── BaseOAuthProvider.js      # 新增
│   │   ├── BaseAPIClient.js          # 新增
│   │   └── BaseDataMapper.js         # 新增
│   └── registry/                      # 新增
│       └── PlatformRegistry.js       # 新增
│
├── platforms/                         # 新增
│   └── shopline/                      # 新增
│       ├── ShoplineOAuth.js          # 新增（從 utils/shopline-api.js 提取）
│       ├── ShoplineAPIClient.js      # 新增（從 utils/shopline-api.js 提取）
│       ├── ShoplineDataMapper.js     # 新增
│       ├── ShoplinePlatform.js       # 新增
│       ├── utils/                     # 新增
│       │   └── signature.js          # 移動（從 utils/signature.js）
│       ├── config.js                  # 新增
│       └── index.js                   # 新增
│
├── services/                          # 新增
│   ├── AuthService.js                # 新增
│   ├── ProductService.js             # 新增
│   ├── OrderService.js               # 新增
│   └── index.js                       # 新增
│
└── config/                            # 新增
    ├── platforms.json                # 新增
    └── index.js                       # 新增
```

### 保留（暫不改動）
```
api/                    # 保持不變（Phase 2 再改）
routes/                 # 保持不變（Phase 2 再改）
server.js               # 保持不變（Phase 2 再改）
utils/
├── database-postgres.js  # 保持不變
├── shopline-api.js       # 保留但標記為 deprecated（Phase 3 刪除）
└── signature.js          # 保留但標記為 deprecated（Phase 3 刪除）
```

---

## 🔨 實施步驟

### Step 1: 建立核心介面定義 (0.5 天)

#### 1.1 建立 `core/interfaces/IPlatform.js`
```javascript
/**
 * Platform Interface
 * 所有平台必須實作此介面
 */
class IPlatform {
  constructor() {
    if (new.target === IPlatform) {
      throw new TypeError('Cannot construct IPlatform instances directly')
    }
  }

  /**
   * 平台名稱
   * @returns {string} 平台唯一識別名稱，例如: 'shopline', 'shopify'
   */
  getName() {
    throw new Error('Method getName() must be implemented')
  }

  /**
   * 平台顯示名稱
   * @returns {string} 平台顯示名稱，例如: 'SHOPLINE', 'Shopify'
   */
  getDisplayName() {
    throw new Error('Method getDisplayName() must be implemented')
  }

  /**
   * OAuth 提供者
   * @returns {IOAuthProvider}
   */
  getOAuthProvider() {
    throw new Error('Method getOAuthProvider() must be implemented')
  }

  /**
   * API 客戶端
   * @returns {IAPIClient}
   */
  getAPIClient() {
    throw new Error('Method getAPIClient() must be implemented')
  }

  /**
   * 資料映射器
   * @returns {IDataMapper}
   */
  getDataMapper() {
    throw new Error('Method getDataMapper() must be implemented')
  }

  /**
   * 平台配置
   * @returns {Object}
   */
  getConfig() {
    throw new Error('Method getConfig() must be implemented')
  }

  /**
   * 初始化平台
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('Method initialize() must be implemented')
  }

  /**
   * 驗證平台配置
   * @returns {boolean}
   */
  validateConfig() {
    throw new Error('Method validateConfig() must be implemented')
  }
}

module.exports = IPlatform
```

#### 1.2 建立 `core/interfaces/IOAuthProvider.js`
```javascript
/**
 * OAuth Provider Interface
 * 處理 OAuth 2.0 授權流程
 */
class IOAuthProvider {
  constructor() {
    if (new.target === IOAuthProvider) {
      throw new TypeError('Cannot construct IOAuthProvider instances directly')
    }
  }

  /**
   * 生成授權 URL
   * @param {string} identifier - 商店識別碼（handle, shop domain, etc.）
   * @param {string} redirectUri - 回調 URI
   * @param {Object} options - 額外選項（scope, state, etc.）
   * @returns {Promise<string>} 授權 URL
   */
  async generateAuthUrl(identifier, redirectUri, options = {}) {
    throw new Error('Method generateAuthUrl() must be implemented')
  }

  /**
   * 處理授權回調
   * @param {Object} callbackParams - 回調參數
   * @returns {Promise<TokenData>} Token 資料
   */
  async handleCallback(callbackParams) {
    throw new Error('Method handleCallback() must be implemented')
  }

  /**
   * 刷新 Access Token
   * @param {string} refreshToken - Refresh Token
   * @returns {Promise<TokenData>} 新的 Token 資料
   */
  async refreshAccessToken(refreshToken) {
    throw new Error('Method refreshAccessToken() must be implemented')
  }

  /**
   * 撤銷 Token
   * @param {string} accessToken - Access Token
   * @returns {Promise<boolean>} 是否成功撤銷
   */
  async revokeToken(accessToken) {
    throw new Error('Method revokeToken() must be implemented')
  }

  /**
   * 驗證回調簽名
   * @param {Object} params - 回調參數
   * @returns {boolean} 簽名是否有效
   */
  validateSignature(params) {
    throw new Error('Method validateSignature() must be implemented')
  }
}

/**
 * TokenData 標準格式
 * @typedef {Object} TokenData
 * @property {string} accessToken - Access Token
 * @property {string} refreshToken - Refresh Token
 * @property {number} expiresIn - 過期時間（秒）
 * @property {number} refreshExpiresIn - Refresh Token 過期時間（秒）
 * @property {string} scope - 授權範圍
 * @property {string} identifier - 商店識別碼
 * @property {Object} metadata - 平台特定的額外資料
 */

module.exports = IOAuthProvider
```

#### 1.3 建立 `core/interfaces/IAPIClient.js`
```javascript
/**
 * API Client Interface
 * 統一的 API 請求介面
 */
class IAPIClient {
  constructor() {
    if (new.target === IAPIClient) {
      throw new TypeError('Cannot construct IAPIClient instances directly')
    }
  }

  /**
   * 通用 API 請求方法
   * @param {string} endpoint - API 端點
   * @param {Object} options - 請求選項
   * @param {string} options.method - HTTP 方法
   * @param {Object} options.headers - 請求標頭
   * @param {Object} options.params - Query 參數
   * @param {Object} options.body - 請求 Body
   * @param {string} accessToken - Access Token
   * @returns {Promise<APIResponse>}
   */
  async request(endpoint, options, accessToken) {
    throw new Error('Method request() must be implemented')
  }

  /**
   * 取得商品列表
   * @param {string} accessToken
   * @param {Object} params - 查詢參數 (page, limit, status, etc.)
   * @returns {Promise<APIResponse>}
   */
  async getProducts(accessToken, params = {}) {
    throw new Error('Method getProducts() must be implemented')
  }

  /**
   * 建立商品
   * @param {string} accessToken
   * @param {Object} productData - 商品資料
   * @returns {Promise<APIResponse>}
   */
  async createProduct(accessToken, productData) {
    throw new Error('Method createProduct() must be implemented')
  }

  /**
   * 更新商品
   * @param {string} accessToken
   * @param {string} productId
   * @param {Object} productData
   * @returns {Promise<APIResponse>}
   */
  async updateProduct(accessToken, productId, productData) {
    throw new Error('Method updateProduct() must be implemented')
  }

  /**
   * 取得訂單列表
   * @param {string} accessToken
   * @param {Object} params
   * @returns {Promise<APIResponse>}
   */
  async getOrders(accessToken, params = {}) {
    throw new Error('Method getOrders() must be implemented')
  }

  /**
   * 建立訂單
   * @param {string} accessToken
   * @param {Object} orderData
   * @returns {Promise<APIResponse>}
   */
  async createOrder(accessToken, orderData) {
    throw new Error('Method createOrder() must be implemented')
  }

  /**
   * 更新訂單
   * @param {string} accessToken
   * @param {string} orderId
   * @param {Object} orderData
   * @returns {Promise<APIResponse>}
   */
  async updateOrder(accessToken, orderId, orderData) {
    throw new Error('Method updateOrder() must be implemented')
  }

  /**
   * 取得訂單詳情
   * @param {string} accessToken
   * @param {string} orderId
   * @returns {Promise<APIResponse>}
   */
  async getOrderDetail(accessToken, orderId) {
    throw new Error('Method getOrderDetail() must be implemented')
  }
}

/**
 * APIResponse 標準格式
 * @typedef {Object} APIResponse
 * @property {boolean} success - 請求是否成功
 * @property {number} status - HTTP 狀態碼
 * @property {Object} data - 回應資料
 * @property {string} error - 錯誤訊息（如果失敗）
 * @property {Object} metadata - 額外資訊（請求 ID、時間戳等）
 */

module.exports = IAPIClient
```

#### 1.4 建立 `core/interfaces/IDataMapper.js`
```javascript
/**
 * Data Mapper Interface
 * 負責平台資料格式與統一格式之間的轉換
 */
class IDataMapper {
  constructor() {
    if (new.target === IDataMapper) {
      throw new Error('Cannot construct IDataMapper instances directly')
    }
  }

  /**
   * 將平台的商品資料轉換為統一格式
   * @param {Object} platformProduct - 平台商品資料
   * @returns {UnifiedProduct} 統一格式商品
   */
  productToUnified(platformProduct) {
    throw new Error('Method productToUnified() must be implemented')
  }

  /**
   * 將統一格式商品轉換為平台格式
   * @param {UnifiedProduct} unifiedProduct - 統一格式商品
   * @returns {Object} 平台商品資料
   */
  productToPlatform(unifiedProduct) {
    throw new Error('Method productToPlatform() must be implemented')
  }

  /**
   * 將平台的訂單資料轉換為統一格式
   * @param {Object} platformOrder - 平台訂單資料
   * @returns {UnifiedOrder} 統一格式訂單
   */
  orderToUnified(platformOrder) {
    throw new Error('Method orderToUnified() must be implemented')
  }

  /**
   * 將統一格式訂單轉換為平台格式
   * @param {UnifiedOrder} unifiedOrder - 統一格式訂單
   * @returns {Object} 平台訂單資料
   */
  orderToPlatform(unifiedOrder) {
    throw new Error('Method orderToPlatform() must be implemented')
  }

  /**
   * 將平台的客戶資料轉換為統一格式
   * @param {Object} platformCustomer - 平台客戶資料
   * @returns {UnifiedCustomer} 統一格式客戶
   */
  customerToUnified(platformCustomer) {
    throw new Error('Method customerToUnified() must be implemented')
  }

  /**
   * 將統一格式客戶轉換為平台格式
   * @param {UnifiedCustomer} unifiedCustomer - 統一格式客戶
   * @returns {Object} 平台客戶資料
   */
  customerToPlatform(unifiedCustomer) {
    throw new Error('Method customerToPlatform() must be implemented')
  }
}

/**
 * 統一商品格式
 * @typedef {Object} UnifiedProduct
 * @property {string} id - 商品 ID
 * @property {string} title - 商品標題
 * @property {string} description - 商品描述
 * @property {string} handle - 商品 URL handle
 * @property {string} status - 狀態 (active, draft, archived)
 * @property {Array<UnifiedVariant>} variants - 商品變體
 * @property {Array<UnifiedImage>} images - 商品圖片
 * @property {Array<string>} tags - 標籤
 * @property {Object} metadata - 平台特定額外資料
 */

/**
 * 統一訂單格式
 * @typedef {Object} UnifiedOrder
 * @property {string} id - 訂單 ID
 * @property {string} orderNumber - 訂單編號
 * @property {string} status - 訂單狀態
 * @property {number} totalPrice - 總金額
 * @property {string} currency - 幣別
 * @property {Array<UnifiedLineItem>} lineItems - 訂單項目
 * @property {UnifiedCustomer} customer - 客戶資訊
 * @property {Object} metadata - 平台特定額外資料
 */

/**
 * 統一客戶格式
 * @typedef {Object} UnifiedCustomer
 * @property {string} id - 客戶 ID
 * @property {string} email - Email
 * @property {string} firstName - 名字
 * @property {string} lastName - 姓氏
 * @property {string} phone - 電話
 * @property {Object} metadata - 平台特定額外資料
 */

module.exports = IDataMapper
```

#### 1.5 建立 `core/interfaces/index.js`
```javascript
/**
 * Core Interfaces Export
 */
module.exports = {
  IPlatform: require('./IPlatform'),
  IOAuthProvider: require('./IOAuthProvider'),
  IAPIClient: require('./IAPIClient'),
  IDataMapper: require('./IDataMapper')
}
```

**檢查點 1.1**: 
- [ ] 所有介面檔案建立完成
- [ ] JSDoc 註解完整
- [ ] TypeScript 定義清楚

---

### Step 2: 建立基礎類別 (0.5 天)

#### 2.1 建立 `core/base/BasePlatform.js`
```javascript
const IPlatform = require('../interfaces/IPlatform')

/**
 * Base Platform Implementation
 * 提供平台的基礎實作
 */
class BasePlatform extends IPlatform {
  constructor(name, displayName, config) {
    super()
    this.name = name
    this.displayName = displayName
    this.config = config
    this._oauthProvider = null
    this._apiClient = null
    this._dataMapper = null
    this._initialized = false
  }

  getName() {
    return this.name
  }

  getDisplayName() {
    return this.displayName
  }

  getOAuthProvider() {
    if (!this._oauthProvider) {
      throw new Error('OAuth Provider not initialized')
    }
    return this._oauthProvider
  }

  getAPIClient() {
    if (!this._apiClient) {
      throw new Error('API Client not initialized')
    }
    return this._apiClient
  }

  getDataMapper() {
    if (!this._dataMapper) {
      throw new Error('Data Mapper not initialized')
    }
    return this._dataMapper
  }

  getConfig() {
    return this.config
  }

  async initialize() {
    if (this._initialized) {
      return
    }
    
    if (!this.validateConfig()) {
      throw new Error(`Invalid configuration for platform: ${this.name}`)
    }
    
    this._initialized = true
  }

  validateConfig() {
    // 基礎驗證，子類別可以覆寫
    return this.config && typeof this.config === 'object'
  }

  isInitialized() {
    return this._initialized
  }
}

module.exports = BasePlatform
```

#### 2.2 建立 `core/base/BaseOAuthProvider.js`
```javascript
const IOAuthProvider = require('../interfaces/IOAuthProvider')

/**
 * Base OAuth Provider Implementation
 * 提供 OAuth 流程的通用功能
 */
class BaseOAuthProvider extends IOAuthProvider {
  constructor(config) {
    super()
    this.config = config
  }

  /**
   * 建立授權 URL（通用邏輯）
   * @param {string} baseUrl - OAuth 授權端點
   * @param {Object} params - 參數
   * @returns {string}
   */
  buildAuthUrl(baseUrl, params) {
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    return `${baseUrl}?${queryString}`
  }

  /**
   * 解析回調參數
   * @param {Object} query - URL query 參數
   * @returns {Object}
   */
  parseCallbackParams(query) {
    return query
  }

  /**
   * 檢查必要參數
   * @param {Object} params
   * @param {Array<string>} requiredKeys
   * @throws {Error}
   */
  validateRequiredParams(params, requiredKeys) {
    for (const key of requiredKeys) {
      if (!params[key]) {
        throw new Error(`Missing required parameter: ${key}`)
      }
    }
  }

  // 子類別必須實作的方法
  async generateAuthUrl(identifier, redirectUri, options = {}) {
    throw new Error('Method generateAuthUrl() must be implemented by subclass')
  }

  async handleCallback(callbackParams) {
    throw new Error('Method handleCallback() must be implemented by subclass')
  }

  async refreshAccessToken(refreshToken) {
    throw new Error('Method refreshAccessToken() must be implemented by subclass')
  }

  async revokeToken(accessToken) {
    throw new Error('Method revokeToken() must be implemented by subclass')
  }

  validateSignature(params) {
    throw new Error('Method validateSignature() must be implemented by subclass')
  }
}

module.exports = BaseOAuthProvider
```

#### 2.3 建立 `core/base/BaseAPIClient.js`
```javascript
const IAPIClient = require('../interfaces/IAPIClient')
const axios = require('axios')

/**
 * Base API Client Implementation
 * 提供 API 請求的通用功能
 */
class BaseAPIClient extends IAPIClient {
  constructor(config) {
    super()
    this.config = config
    this.baseURL = config.baseURL || ''
  }

  /**
   * 建立授權標頭
   * @param {string} accessToken
   * @returns {Object}
   */
  buildAuthHeaders(accessToken) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  /**
   * 處理 API 回應
   * @param {Object} response - Axios response
   * @returns {APIResponse}
   */
  handleResponse(response) {
    return {
      success: true,
      status: response.status,
      data: response.data,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * 處理 API 錯誤
   * @param {Error} error
   * @returns {APIResponse}
   */
  handleError(error) {
    return {
      success: false,
      status: error.response?.status || 500,
      data: null,
      error: error.response?.data?.message || error.message,
      metadata: {
        timestamp: new Date().toISOString(),
        originalError: error.response?.data
      }
    }
  }

  /**
   * 通用請求方法（使用 axios）
   */
  async request(endpoint, options, accessToken) {
    try {
      const config = {
        url: `${this.baseURL}${endpoint}`,
        method: options.method || 'GET',
        headers: {
          ...this.buildAuthHeaders(accessToken),
          ...options.headers
        }
      }

      if (options.params) {
        config.params = options.params
      }

      if (options.body) {
        config.data = options.body
      }

      const response = await axios(config)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  // 子類別必須實作的方法
  async getProducts(accessToken, params = {}) {
    throw new Error('Method getProducts() must be implemented by subclass')
  }

  async createProduct(accessToken, productData) {
    throw new Error('Method createProduct() must be implemented by subclass')
  }

  async updateProduct(accessToken, productId, productData) {
    throw new Error('Method updateProduct() must be implemented by subclass')
  }

  async getOrders(accessToken, params = {}) {
    throw new Error('Method getOrders() must be implemented by subclass')
  }

  async createOrder(accessToken, orderData) {
    throw new Error('Method createOrder() must be implemented by subclass')
  }

  async updateOrder(accessToken, orderId, orderData) {
    throw new Error('Method updateOrder() must be implemented by subclass')
  }

  async getOrderDetail(accessToken, orderId) {
    throw new Error('Method getOrderDetail() must be implemented by subclass')
  }
}

module.exports = BaseAPIClient
```

#### 2.4 建立 `core/base/BaseDataMapper.js`
```javascript
const IDataMapper = require('../interfaces/IDataMapper')

/**
 * Base Data Mapper Implementation
 * 提供資料映射的基礎功能
 */
class BaseDataMapper extends IDataMapper {
  constructor() {
    super()
  }

  /**
   * 安全地提取欄位值
   * @param {Object} obj
   * @param {string} path - 例如: 'data.product.id'
   * @param {*} defaultValue
   * @returns {*}
   */
  safeGet(obj, path, defaultValue = null) {
    const keys = path.split('.')
    let result = obj

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return defaultValue
      }
    }

    return result !== undefined ? result : defaultValue
  }

  /**
   * 移除 null/undefined 欄位
   * @param {Object} obj
   * @returns {Object}
   */
  removeEmptyFields(obj) {
    const cleaned = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined) {
        cleaned[key] = value
      }
    }
    return cleaned
  }

  // 子類別必須實作的方法
  productToUnified(platformProduct) {
    throw new Error('Method productToUnified() must be implemented by subclass')
  }

  productToPlatform(unifiedProduct) {
    throw new Error('Method productToPlatform() must be implemented by subclass')
  }

  orderToUnified(platformOrder) {
    throw new Error('Method orderToUnified() must be implemented by subclass')
  }

  orderToPlatform(unifiedOrder) {
    throw new Error('Method orderToPlatform() must be implemented by subclass')
  }

  customerToUnified(platformCustomer) {
    throw new Error('Method customerToUnified() must be implemented by subclass')
  }

  customerToPlatform(unifiedCustomer) {
    throw new Error('Method customerToPlatform() must be implemented by subclass')
  }
}

module.exports = BaseDataMapper
```

#### 2.5 建立 `core/base/index.js`
```javascript
/**
 * Core Base Classes Export
 */
module.exports = {
  BasePlatform: require('./BasePlatform'),
  BaseOAuthProvider: require('./BaseOAuthProvider'),
  BaseAPIClient: require('./BaseAPIClient'),
  BaseDataMapper: require('./BaseDataMapper')
}
```

**檢查點 2.1**:
- [ ] 所有基礎類別建立完成
- [ ] 通用功能實作完整
- [ ] 繼承關係正確

---

### Step 3: 建立平台註冊表 (0.25 天)

#### 3.1 建立 `core/registry/PlatformRegistry.js`
```javascript
/**
 * Platform Registry
 * 管理所有平台實例的註冊表
 */
class PlatformRegistry {
  constructor() {
    this.platforms = new Map()
    this.defaultPlatform = null
  }

  /**
   * 註冊平台
   * @param {IPlatform} platform
   */
  register(platform) {
    if (!platform || !platform.getName) {
      throw new Error('Invalid platform instance')
    }

    const name = platform.getName()
    if (this.platforms.has(name)) {
      console.warn(`Platform ${name} is already registered. Overwriting...`)
    }

    this.platforms.set(name, platform)
    
    // 第一個註冊的平台設為預設
    if (!this.defaultPlatform) {
      this.defaultPlatform = name
    }

    console.log(`✅ Platform registered: ${name}`)
  }

  /**
   * 取得平台實例
   * @param {string} name - 平台名稱
   * @returns {IPlatform}
   */
  get(name) {
    if (!this.platforms.has(name)) {
      throw new Error(`Platform not found: ${name}`)
    }
    return this.platforms.get(name)
  }

  /**
   * 取得預設平台
   * @returns {IPlatform}
   */
  getDefault() {
    if (!this.defaultPlatform) {
      throw new Error('No default platform set')
    }
    return this.get(this.defaultPlatform)
  }

  /**
   * 設定預設平台
   * @param {string} name
   */
  setDefault(name) {
    if (!this.platforms.has(name)) {
      throw new Error(`Cannot set default platform: ${name} not registered`)
    }
    this.defaultPlatform = name
  }

  /**
   * 取得所有已註冊平台名稱
   * @returns {Array<string>}
   */
  getAvailablePlatforms() {
    return Array.from(this.platforms.keys())
  }

  /**
   * 檢查平台是否已註冊
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this.platforms.has(name)
  }

  /**
   * 取消註冊平台
   * @param {string} name
   */
  unregister(name) {
    if (this.platforms.has(name)) {
      this.platforms.delete(name)
      console.log(`✅ Platform unregistered: ${name}`)
      
      // 如果刪除的是預設平台，重新設定
      if (this.defaultPlatform === name) {
        const remaining = this.getAvailablePlatforms()
        this.defaultPlatform = remaining.length > 0 ? remaining[0] : null
      }
    }
  }

  /**
   * 清空所有平台
   */
  clear() {
    this.platforms.clear()
    this.defaultPlatform = null
  }

  /**
   * 取得註冊平台數量
   * @returns {number}
   */
  size() {
    return this.platforms.size
  }
}

// 單例模式
const registry = new PlatformRegistry()

module.exports = registry
```

**檢查點 3.1**:
- [ ] PlatformRegistry 實作完成
- [ ] 單例模式正確
- [ ] 註冊/取得/管理功能完整

---

### Step 4: 重構 Shopline 為平台插件 (1 天)

#### 4.1 分析現有 `utils/shopline-api.js`
**目標**: 將 ShoplineAPIClient 拆分為三個類別

- **ShoplineOAuth** - OAuth 相關方法
- **ShoplineAPIClient** - API 請求相關方法
- **ShoplineDataMapper** - 資料映射（新增）

#### 4.2 建立 `platforms/shopline/config.js`
```javascript
/**
 * Shopline Platform Configuration
 */
module.exports = {
  name: 'shopline',
  displayName: 'SHOPLINE',
  
  // OAuth 配置
  oauth: {
    authBaseUrl: 'https://{handle}.myshopline.com/admin/oauth/authorize',
    tokenUrl: 'https://{handle}.myshopline.com/admin/oauth/token/create',
    revokeUrl: 'https://{handle}.myshopline.com/admin/oauth/token/revoke',
    requiredScopes: [
      'read_store_information',
      'read_products',
      'write_products',
      'read_orders',
      'write_orders'
    ]
  },
  
  // API 配置
  api: {
    baseUrl: 'https://{handle}.myshopline.com',
    version: 'v20260301',
    endpoints: {
      shop: '/admin/openapi/{version}/merchants/shop.json',
      products: '/admin/openapi/{version}/products/products.json',
      product: '/admin/openapi/{version}/products/products/{id}.json',
      orders: '/admin/openapi/{version}/orders.json',
      order: '/admin/openapi/{version}/orders/{id}.json'
    }
  },
  
  // 從環境變數讀取
  credentials: {
    appKey: process.env.APP_KEY || '4c951e966557c8374d9a61753dfe3c52441aba3b',
    appSecret: process.env.APP_SECRET || 'dd46269d6920f49b07e810862d3093062b0fb858'
  },
  
  // 預設商店（開發用）
  defaultShop: {
    handle: process.env.SHOP_HANDLE || 'paykepoc',
    url: process.env.SHOP_URL || 'https://paykepoc.myshopline.com/'
  }
}
```

#### 4.3 移動並調整 `utils/signature.js` → `platforms/shopline/utils/signature.js`
（保持現有實作，只移動檔案位置）

#### 4.4 建立 `platforms/shopline/ShoplineOAuth.js`
（從 utils/shopline-api.js 提取 OAuth 相關方法）

#### 4.5 建立 `platforms/shopline/ShoplineAPIClient.js`
（從 utils/shopline-api.js 提取 API 請求相關方法）

#### 4.6 建立 `platforms/shopline/ShoplineDataMapper.js`
（新增，處理 Shopline 資料格式轉換）

#### 4.7 建立 `platforms/shopline/ShoplinePlatform.js`
（整合上述三個類別）

#### 4.8 建立 `platforms/shopline/index.js`
（平台入口，初始化並註冊到 PlatformRegistry）

**檢查點 4.1**:
- [ ] Shopline 平台所有檔案建立完成
- [ ] 從 utils/shopline-api.js 正確提取代碼
- [ ] 所有方法實作完整
- [ ] 測試腳本通過

---

### Step 5: 建立統一服務層 (0.5 天)

#### 5.1 建立 `services/AuthService.js`
```javascript
const PlatformRegistry = require('../core/registry/PlatformRegistry')

/**
 * Authentication Service
 * 統一的認證服務，平台無關
 */
class AuthService {
  /**
   * 發起授權流程
   * @param {string} platformName - 平台名稱
   * @param {string} identifier - 商店識別碼
   * @param {string} redirectUri - 回調 URI
   * @param {Object} options - 額外選項
   * @returns {Promise<string>} 授權 URL
   */
  async authorize(platformName, identifier, redirectUri, options = {}) {
    const platform = PlatformRegistry.get(platformName)
    const oauthProvider = platform.getOAuthProvider()
    return await oauthProvider.generateAuthUrl(identifier, redirectUri, options)
  }

  /**
   * 處理授權回調
   * @param {string} platformName
   * @param {Object} callbackParams
   * @returns {Promise<TokenData>}
   */
  async handleCallback(platformName, callbackParams) {
    const platform = PlatformRegistry.get(platformName)
    const oauthProvider = platform.getOAuthProvider()
    return await oauthProvider.handleCallback(callbackParams)
  }

  /**
   * 刷新 Token
   * @param {string} platformName
   * @param {string} refreshToken
   * @returns {Promise<TokenData>}
   */
  async refreshToken(platformName, refreshToken) {
    const platform = PlatformRegistry.get(platformName)
    const oauthProvider = platform.getOAuthProvider()
    return await oauthProvider.refreshAccessToken(refreshToken)
  }

  /**
   * 撤銷 Token
   * @param {string} platformName
   * @param {string} accessToken
   * @returns {Promise<boolean>}
   */
  async revokeToken(platformName, accessToken) {
    const platform = PlatformRegistry.get(platformName)
    const oauthProvider = platform.getOAuthProvider()
    return await oauthProvider.revokeToken(accessToken)
  }

  /**
   * 驗證回調簽名
   * @param {string} platformName
   * @param {Object} params
   * @returns {boolean}
   */
  validateSignature(platformName, params) {
    const platform = PlatformRegistry.get(platformName)
    const oauthProvider = platform.getOAuthProvider()
    return oauthProvider.validateSignature(params)
  }
}

module.exports = new AuthService()
```

#### 5.2 建立 `services/ProductService.js`
```javascript
const PlatformRegistry = require('../core/registry/PlatformRegistry')

/**
 * Product Service
 * 統一的商品服務，平台無關
 */
class ProductService {
  /**
   * 取得商品列表
   * @param {string} platformName
   * @param {string} accessToken
   * @param {Object} params
   * @returns {Promise<Array<UnifiedProduct>>}
   */
  async getProducts(platformName, accessToken, params = {}) {
    const platform = PlatformRegistry.get(platformName)
    const apiClient = platform.getAPIClient()
    const mapper = platform.getDataMapper()
    
    const response = await apiClient.getProducts(accessToken, params)
    
    if (!response.success) {
      throw new Error(response.error)
    }
    
    // 將平台資料映射為統一格式
    const products = response.data.products || []
    return products.map(p => mapper.productToUnified(p))
  }

  /**
   * 建立商品
   * @param {string} platformName
   * @param {string} accessToken
   * @param {UnifiedProduct} unifiedProduct
   * @returns {Promise<UnifiedProduct>}
   */
  async createProduct(platformName, accessToken, unifiedProduct) {
    const platform = PlatformRegistry.get(platformName)
    const apiClient = platform.getAPIClient()
    const mapper = platform.getDataMapper()
    
    // 將統一格式映射為平台格式
    const platformProduct = mapper.productToPlatform(unifiedProduct)
    const response = await apiClient.createProduct(accessToken, platformProduct)
    
    if (!response.success) {
      throw new Error(response.error)
    }
    
    return mapper.productToUnified(response.data.product)
  }

  /**
   * 更新商品
   * @param {string} platformName
   * @param {string} accessToken
   * @param {string} productId
   * @param {UnifiedProduct} unifiedProduct
   * @returns {Promise<UnifiedProduct>}
   */
  async updateProduct(platformName, accessToken, productId, unifiedProduct) {
    const platform = PlatformRegistry.get(platformName)
    const apiClient = platform.getAPIClient()
    const mapper = platform.getDataMapper()
    
    const platformProduct = mapper.productToPlatform(unifiedProduct)
    const response = await apiClient.updateProduct(accessToken, productId, platformProduct)
    
    if (!response.success) {
      throw new Error(response.error)
    }
    
    return mapper.productToUnified(response.data.product)
  }
}

module.exports = new ProductService()
```

#### 5.3 建立 `services/OrderService.js`
（類似 ProductService，處理訂單相關業務邏輯）

#### 5.4 建立 `services/index.js`
```javascript
/**
 * Services Export
 */
module.exports = {
  AuthService: require('./AuthService'),
  ProductService: require('./ProductService'),
  OrderService: require('./OrderService')
}
```

**檢查點 5.1**:
- [ ] 所有服務類別建立完成
- [ ] 服務層完全平台無關
- [ ] 統一資料格式使用正確

---

### Step 6: 配置管理 (0.25 天)

#### 6.1 建立 `config/platforms.json`
```json
{
  "platforms": {
    "shopline": {
      "enabled": true,
      "default": true
    },
    "shopify": {
      "enabled": false
    },
    "woocommerce": {
      "enabled": false
    }
  },
  "defaultPlatform": "shopline"
}
```

#### 6.2 建立 `config/index.js`
```javascript
/**
 * Configuration Management
 */
const platformsConfig = require('./platforms.json')

class ConfigManager {
  constructor() {
    this.platformsConfig = platformsConfig
  }

  /**
   * 取得啟用的平台列表
   * @returns {Array<string>}
   */
  getEnabledPlatforms() {
    return Object.keys(this.platformsConfig.platforms)
      .filter(name => this.platformsConfig.platforms[name].enabled)
  }

  /**
   * 取得預設平台
   * @returns {string}
   */
  getDefaultPlatform() {
    return this.platformsConfig.defaultPlatform
  }

  /**
   * 檢查平台是否啟用
   * @param {string} name
   * @returns {boolean}
   */
  isPlatformEnabled(name) {
    return this.platformsConfig.platforms[name]?.enabled || false
  }
}

module.exports = new ConfigManager()
```

**檢查點 6.1**:
- [ ] 配置檔案建立完成
- [ ] ConfigManager 實作完整

---

### Step 7: 初始化流程 (0.25 天)

#### 7.1 建立 `core/bootstrap.js`
```javascript
/**
 * Bootstrap Core System
 * 初始化核心系統和註冊平台
 */
const PlatformRegistry = require('./registry/PlatformRegistry')
const ConfigManager = require('../config')

/**
 * 初始化核心系統
 */
async function bootstrap() {
  console.log('🚀 Bootstrapping core system...')

  // 取得啟用的平台
  const enabledPlatforms = ConfigManager.getEnabledPlatforms()
  
  console.log(`📦 Enabled platforms: ${enabledPlatforms.join(', ')}`)

  // 載入並註冊平台
  for (const platformName of enabledPlatforms) {
    try {
      const PlatformClass = require(`../platforms/${platformName}`)
      const platform = new PlatformClass()
      await platform.initialize()
      PlatformRegistry.register(platform)
    } catch (error) {
      console.error(`❌ Failed to load platform: ${platformName}`, error.message)
    }
  }

  // 設定預設平台
  const defaultPlatform = ConfigManager.getDefaultPlatform()
  if (PlatformRegistry.has(defaultPlatform)) {
    PlatformRegistry.setDefault(defaultPlatform)
    console.log(`✅ Default platform set: ${defaultPlatform}`)
  }

  console.log(`✅ Core system initialized with ${PlatformRegistry.size()} platform(s)`)
  
  return PlatformRegistry
}

module.exports = bootstrap
```

#### 7.2 在 `server.js` 中加入初始化（保持向後兼容）
```javascript
// 在 server.js 最上方加入
const bootstrap = require('./core/bootstrap')

// 初始化核心系統（不影響現有代碼）
bootstrap().then(() => {
  console.log('✅ Core system ready')
}).catch(error => {
  console.error('❌ Core system initialization failed:', error)
  // 不中斷現有流程，只記錄錯誤
})

// ... 現有的 server.js 代碼保持不變
```

**檢查點 7.1**:
- [ ] Bootstrap 流程實作完成
- [ ] server.js 整合正確
- [ ] 不影響現有功能

---

## ✅ Phase 1 完成檢查清單

### 核心層
- [ ] `core/interfaces/` 所有介面定義完成
- [ ] `core/base/` 所有基礎類別完成
- [ ] `core/registry/PlatformRegistry.js` 完成
- [ ] `core/bootstrap.js` 完成

### Shopline 平台
- [ ] `platforms/shopline/config.js` 完成
- [ ] `platforms/shopline/utils/signature.js` 移動完成
- [ ] `platforms/shopline/ShoplineOAuth.js` 完成
- [ ] `platforms/shopline/ShoplineAPIClient.js` 完成
- [ ] `platforms/shopline/ShoplineDataMapper.js` 完成
- [ ] `platforms/shopline/ShoplinePlatform.js` 完成
- [ ] `platforms/shopline/index.js` 完成

### 服務層
- [ ] `services/AuthService.js` 完成
- [ ] `services/ProductService.js` 完成
- [ ] `services/OrderService.js` 完成
- [ ] `services/index.js` 完成

### 配置層
- [ ] `config/platforms.json` 完成
- [ ] `config/index.js` 完成

### 測試
- [ ] 所有現有測試通過
- [ ] 新增單元測試（介面、基礎類別）
- [ ] 新增整合測試（Shopline 平台）
- [ ] Bootstrap 測試通過

### 文件
- [ ] 更新 ARCHITECTURE.md
- [ ] 建立 PLATFORM_DEVELOPMENT_GUIDE.md
- [ ] 更新 README.md

---

## 🧪 測試策略

### 1. 單元測試
```bash
# 測試核心介面
npm test core/interfaces

# 測試基礎類別
npm test core/base

# 測試 PlatformRegistry
npm test core/registry
```

### 2. 整合測試
```bash
# 測試 Shopline 平台
npm test platforms/shopline

# 測試服務層
npm test services
```

### 3. 端到端測試
```bash
# 執行現有所有測試
npm test

# 確保所有功能正常
npm run test:e2e
```

---

## 🚨 風險管理

### 高風險項目
| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 破壞現有功能 | 高 | 保留舊代碼、嚴格測試 |
| 介面設計不夠通用 | 中 | 參考多個平台 API |
| 開發時間超出預期 | 低 | 分步驟實施、可隨時停止 |

### 回滾計劃
如果 Phase 1 遇到無法解決的問題：
1. 保留 `utils/shopline-api.js` 不刪除
2. 新代碼加入 `_deprecated` 標記
3. 繼續使用舊架構
4. 重新評估設計

---

## 📅 時間規劃

| 步驟 | 預估時間 | 累計時間 |
|------|---------|---------|
| Step 1: 建立核心介面 | 0.5 天 | 0.5 天 |
| Step 2: 建立基礎類別 | 0.5 天 | 1 天 |
| Step 3: 建立平台註冊表 | 0.25 天 | 1.25 天 |
| Step 4: 重構 Shopline | 1 天 | 2.25 天 |
| Step 5: 建立服務層 | 0.5 天 | 2.75 天 |
| Step 6: 配置管理 | 0.25 天 | 3 天 |
| Step 7: 初始化流程 | 0.25 天 | 3.25 天 |
| **總計** | **3.25 天** | - |

---

## 🎯 成功標準

### 技術標準
- ✅ 所有現有測試通過
- ✅ 代碼覆蓋率保持或提升
- ✅ 無任何功能破壞
- ✅ Shopline 平台完整實作

### 代碼品質標準
- ✅ 所有介面有完整 JSDoc
- ✅ 所有類別遵循 SOLID 原則
- ✅ 無 ESLint 錯誤
- ✅ 代碼可讀性良好

### 文件標準
- ✅ 架構文件更新
- ✅ API 文件完整
- ✅ 開發指南建立

---

**建立日期**: 2025-10-22  
**作者**: AI Assistant (Architecture Role)  
**版本**: 1.0.0 - Phase 1 實施計劃  
**狀態**: 📋 待審核

