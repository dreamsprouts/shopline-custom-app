# 多平台 Connector 架構設計

## 📋 文件資訊

- **版本**: 1.0.0
- **建立日期**: 2025-10-22
- **狀態**: 🔄 架構設計階段
- **目標**: 將系統從 Shopline 專用演進為多平台 Connector

---

## 🎯 架構目標

### 從 (AS-IS)
```
單一平台專用系統
├── Shopline OAuth
├── Shopline API Client
└── Shopline 特定邏輯
```

### 到 (TO-BE)
```
多平台 Connector 系統
├── 統一 OAuth 抽象層
├── 多平台 API Adapter
├── 平台無關業務邏輯
└── 可擴展的插件機制
```

---

## 🏗️ 架構演進策略

### 階段 1: 抽象層設計 (重構準備)
**目標**: 定義清晰的抽象介面，不破壞現有功能

#### 1.1 核心概念抽象
```
Platform (平台)
├── OAuth Provider (OAuth 供應商)
├── API Client (API 客戶端)
├── Data Mapper (資料映射器)
└── Config (配置)
```

#### 1.2 關鍵抽象介面
```javascript
// 平台抽象
interface Platform {
  name: string              // 'shopline', 'shopify', 'woocommerce'
  oauth: OAuthProvider
  api: APIClient
  mapper: DataMapper
}

// OAuth 抽象
interface OAuthProvider {
  authorize()               // 發起授權
  handleCallback()          // 處理回調
  refreshToken()            // 刷新 Token
  revokeToken()             // 撤銷 Token
}

// API 抽象
interface APIClient {
  request(endpoint, options)  // 統一請求介面
  products: ProductAPI
  orders: OrderAPI
  customers: CustomerAPI
}

// 資料映射抽象
interface DataMapper {
  toUnified(platformData)   // 平台資料 → 統一格式
  toPlatform(unifiedData)   // 統一格式 → 平台資料
}
```

---

## 📂 新架構目錄結構

### 方案 A：按層次組織（推薦）
```
custom-app/
├── core/                           # 核心抽象層
│   ├── interfaces/                 # 介面定義
│   │   ├── Platform.js
│   │   ├── OAuthProvider.js
│   │   ├── APIClient.js
│   │   └── DataMapper.js
│   ├── base/                       # 基礎實作
│   │   ├── BasePlatform.js
│   │   ├── BaseOAuthProvider.js
│   │   ├── BaseAPIClient.js
│   │   └── BaseDataMapper.js
│   └── registry/                   # 平台註冊表
│       └── PlatformRegistry.js
│
├── platforms/                      # 平台實作（插件化）
│   ├── shopline/                   # Shopline 平台
│   │   ├── ShoplineOAuth.js
│   │   ├── ShoplineAPI.js
│   │   ├── ShoplineMapper.js
│   │   ├── config.json
│   │   └── index.js               # 平台入口
│   ├── shopify/                    # Shopify 平台（未來）
│   │   └── ...
│   └── woocommerce/                # WooCommerce 平台（未來）
│       └── ...
│
├── services/                       # 業務服務層（平台無關）
│   ├── AuthService.js             # 統一認證服務
│   ├── ProductService.js          # 統一商品服務
│   ├── OrderService.js            # 統一訂單服務
│   └── CustomerService.js         # 統一客戶服務
│
├── api/                            # API 路由（保持現有）
│   ├── oauth/                     # 改為調用 core
│   └── test/                      # 改為調用 services
│
├── routes/                         # Express 路由（保持現有）
│   └── oauth.js                   # 改為調用 core
│
├── utils/                          # 工具（部分移至 core）
│   ├── database-postgres.js       # 保持
│   └── signature.js               # 移至 platforms/shopline/
│
└── config/                         # 配置管理
    ├── platforms.json             # 平台配置
    └── database.json              # 資料庫配置
```

### 方案 B：按平台組織
```
custom-app/
├── core/                           # 核心層（同方案 A）
│   └── ...
│
├── platforms/                      # 按平台完全隔離
│   ├── shopline/
│   │   ├── oauth/                 # OAuth 實作
│   │   ├── api/                   # API Client
│   │   ├── mappers/               # 資料映射
│   │   ├── routes/                # 路由（可選）
│   │   └── index.js
│   └── ...
│
└── services/                       # 業務層（同方案 A）
    └── ...
```

**推薦**: 方案 A，清晰分層，易於理解和維護

---

## 🔄 漸進式遷移計劃

### Phase 1: 建立抽象層（不破壞現有功能）
**時間**: 2-3 天

#### 1.1 建立核心介面
- [ ] 定義 `core/interfaces/` 下的所有介面
- [ ] 建立 `core/base/` 下的基礎類別
- [ ] 建立 `core/registry/PlatformRegistry.js`

#### 1.2 重構 Shopline 為第一個平台實作
- [ ] 建立 `platforms/shopline/` 目錄
- [ ] 將 `utils/shopline-api.js` 重構為:
  - `platforms/shopline/ShoplineOAuth.js`
  - `platforms/shopline/ShoplineAPI.js`
  - `platforms/shopline/ShoplineMapper.js`
- [ ] 將 `utils/signature.js` 移至 `platforms/shopline/utils/`
- [ ] 建立 `platforms/shopline/index.js` 作為平台入口

#### 1.3 建立統一服務層
- [ ] 建立 `services/AuthService.js`
- [ ] 建立 `services/ProductService.js`
- [ ] 建立 `services/OrderService.js`

**驗證標準**: 所有現有測試通過，功能無任何破壞

---

### Phase 2: 路由層適配（雙模式運行）
**時間**: 1-2 天

#### 2.1 改造 Express 路由
- [ ] `routes/oauth.js` 改為調用 `services/AuthService`
- [ ] `server.js` 中的 API 路由改為調用 `services/*`
- [ ] 保留舊代碼作為 fallback（漸進切換）

#### 2.2 改造 Vercel Functions
- [ ] `api/oauth/` 改為調用 `core/` 和 `services/`
- [ ] `api/test/` 改為調用 `services/`

**驗證標準**: 新舊代碼路徑都能正常運作

---

### Phase 3: 完全切換 + 清理舊代碼
**時間**: 1 天

#### 3.1 移除舊代碼
- [ ] 確認所有路由使用新架構
- [ ] 刪除 `utils/shopline-api.js`（已移至 platforms）
- [ ] 更新所有 import/require 路徑

#### 3.2 文件更新
- [ ] 更新 ARCHITECTURE.md
- [ ] 更新 API_DOCUMENTATION.md
- [ ] 建立 PLATFORM_INTEGRATION_GUIDE.md

**驗證標準**: 所有測試通過，無舊代碼殘留

---

### Phase 4: 第二平台實作（驗證可擴展性）
**時間**: 3-5 天（取決於平台複雜度）

#### 4.1 選擇第二平台（建議 Shopify）
- [ ] 研究 Shopify OAuth 流程
- [ ] 研究 Shopify API 結構
- [ ] 建立 `platforms/shopify/` 實作

#### 4.2 驗證抽象層設計
- [ ] 驗證 OAuthProvider 介面是否足夠通用
- [ ] 驗證 APIClient 介面是否足夠通用
- [ ] 驗證 DataMapper 能否處理不同資料結構

#### 4.3 前端多平台切換
- [ ] UI 加入平台選擇器
- [ ] 動態載入平台配置

**驗證標準**: 兩個平台可以無縫切換，共用業務邏輯

---

## 🔑 核心設計原則

### 1. 開放封閉原則 (Open-Closed Principle)
- ✅ 對擴展開放：新增平台不需修改核心代碼
- ✅ 對修改封閉：核心抽象層保持穩定

### 2. 依賴反轉原則 (Dependency Inversion)
```
高層模組（services）→ 抽象介面（core/interfaces）← 低層模組（platforms）
```

### 3. 插件化架構
- 每個平台都是獨立插件
- 通過 PlatformRegistry 動態註冊
- 支援 npm 包形式分發

### 4. 資料映射統一
```javascript
// 統一資料格式
UnifiedProduct {
  id: string
  title: string
  price: number
  variants: UnifiedVariant[]
  // ... 平台無關欄位
}

// Shopline → Unified
shoplineMapper.toUnified(shoplineProduct) => UnifiedProduct

// Unified → Shopify
shopifyMapper.toPlatform(unifiedProduct) => ShopifyProduct
```

---

## 📊 資料庫設計調整

### 當前結構
```sql
oauth_tokens (
  shop_handle,        -- Shopline 特定
  access_token,
  refresh_token,
  ...
)
```

### 新結構（向後兼容）
```sql
oauth_tokens (
  id PRIMARY KEY,
  platform VARCHAR(50),      -- NEW: 'shopline', 'shopify', etc.
  shop_handle VARCHAR(255),  -- 保持，但語義改為 'platform_identifier'
  access_token TEXT,
  refresh_token TEXT,
  expire_time BIGINT,
  scope TEXT,
  platform_metadata JSONB,   -- NEW: 平台特定資料
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  
  UNIQUE(platform, shop_handle)  -- 組合唯一鍵
)
```

**遷移策略**:
1. 新增 `platform` 欄位，預設值 'shopline'
2. 新增 `platform_metadata` JSONB 欄位
3. 舊資料自動標記為 'shopline'
4. 零停機遷移

---

## 🎨 範例：Shopline Platform 實作

### `platforms/shopline/index.js`
```javascript
const ShoplineOAuth = require('./ShoplineOAuth')
const ShoplineAPI = require('./ShoplineAPI')
const ShoplineMapper = require('./ShoplineMapper')
const config = require('./config.json')

class ShoplinePlatform {
  constructor() {
    this.name = 'shopline'
    this.config = config
    this.oauth = new ShoplineOAuth(config)
    this.api = new ShoplineAPI(config)
    this.mapper = new ShoplineMapper()
  }
  
  // 實作 Platform 介面
  async initialize() {
    // 初始化邏輯
  }
}

module.exports = ShoplinePlatform
```

### `platforms/shopline/ShoplineOAuth.js`
```javascript
const BaseOAuthProvider = require('../../core/base/BaseOAuthProvider')
const { signGetRequest, signPostRequest } = require('./utils/signature')

class ShoplineOAuth extends BaseOAuthProvider {
  async authorize(shopHandle, redirectUri) {
    // Shopline 特定實作
    const params = {
      appkey: this.config.app_key,
      handle: shopHandle,
      timestamp: Date.now().toString(),
      sign: signGetRequest(...)
    }
    return this.buildAuthUrl(params)
  }
  
  async handleCallback(callbackParams) {
    // Shopline 特定實作
    const { code, handle } = callbackParams
    return await this.exchangeToken(code, handle)
  }
  
  // ... 其他方法
}

module.exports = ShoplineOAuth
```

### `services/AuthService.js` (平台無關)
```javascript
const PlatformRegistry = require('../core/registry/PlatformRegistry')
const database = require('../utils/database-postgres')

class AuthService {
  async authorize(platformName, shopHandle, redirectUri) {
    const platform = PlatformRegistry.get(platformName)
    const authUrl = await platform.oauth.authorize(shopHandle, redirectUri)
    return authUrl
  }
  
  async handleCallback(platformName, callbackParams) {
    const platform = PlatformRegistry.get(platformName)
    const tokenData = await platform.oauth.handleCallback(callbackParams)
    
    // 儲存到資料庫（統一格式）
    await database.saveToken({
      platform: platformName,
      shop_handle: tokenData.shopHandle,
      access_token: tokenData.accessToken,
      ...
    })
    
    return tokenData
  }
}

module.exports = new AuthService()
```

---

## 🚀 前端調整

### 平台選擇 UI
```html
<!-- views/index.html -->
<div class="platform-selector">
  <label>選擇平台：</label>
  <select id="platformSelect">
    <option value="shopline">Shopline</option>
    <option value="shopify">Shopify (Coming Soon)</option>
    <option value="woocommerce">WooCommerce (Coming Soon)</option>
  </select>
</div>

<button id="authorizeBtn">授權</button>
```

### 動態 API 調用
```javascript
// public/js/app.js
class MultiPlatformApp {
  constructor() {
    this.currentPlatform = 'shopline'  // 預設
  }
  
  async authorize() {
    const platform = this.currentPlatform
    const shopHandle = document.getElementById('shopHandle').value
    
    // 統一 API 端點，平台作為參數
    const url = `/oauth/install?platform=${platform}&handle=${shopHandle}`
    window.location.href = url
  }
  
  async getProducts() {
    const platform = this.currentPlatform
    const response = await fetch(`/api/products?platform=${platform}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    })
    return await response.json()
  }
}
```

---

## 🧪 測試策略

### 1. 抽象層測試
```javascript
// tests/core/base/BaseOAuthProvider.test.js
describe('BaseOAuthProvider', () => {
  it('should enforce interface contract', () => {
    // 測試抽象方法是否必須實作
  })
})
```

### 2. 平台實作測試
```javascript
// tests/platforms/shopline/ShoplineOAuth.test.js
describe('ShoplineOAuth', () => {
  it('should generate correct authorization URL', () => {
    // 測試 Shopline 特定邏輯
  })
})
```

### 3. 服務層測試（Mock 平台）
```javascript
// tests/services/AuthService.test.js
describe('AuthService', () => {
  it('should work with any platform', () => {
    // 使用 Mock Platform 測試
  })
})
```

---

## 📋 遷移檢查清單

### Phase 1 完成標準
- [ ] `core/interfaces/` 所有介面定義完成
- [ ] `core/base/` 所有基礎類別完成
- [ ] `platforms/shopline/` 完整實作
- [ ] 所有現有測試通過
- [ ] 新舊代碼可以並存

### Phase 2 完成標準
- [ ] 所有路由改用服務層
- [ ] Vercel Functions 改用服務層
- [ ] 雙模式測試通過

### Phase 3 完成標準
- [ ] 舊代碼完全移除
- [ ] 文件完整更新
- [ ] 所有測試通過

### Phase 4 完成標準
- [ ] 第二平台實作完成
- [ ] 前端多平台切換正常
- [ ] 架構驗證通過

---

## 🔍 風險評估

| 風險 | 影響 | 機率 | 緩解策略 |
|------|------|------|---------|
| 抽象層設計不夠通用 | 高 | 中 | Phase 4 驗證，及早調整 |
| 遷移過程中斷線上服務 | 高 | 低 | 雙模式運行，漸進切換 |
| 資料庫遷移失敗 | 高 | 低 | 向後兼容設計，預設值 |
| 測試覆蓋不足 | 中 | 中 | 每個 Phase 嚴格測試 |
| 開發時間超出預期 | 低 | 中 | 分階段交付，可隨時停止 |

---

## 📚 參考資料

### 設計模式
- **Abstract Factory Pattern** - 平台工廠
- **Strategy Pattern** - OAuth 策略
- **Adapter Pattern** - API 適配器
- **Template Method Pattern** - 基礎類別模板

### 類似專案參考
- **Saleor** - 多平台電商 connector
- **n8n** - 工作流程自動化平台
- **Zapier** - 服務整合平台

---

## 🎯 成功標準

### 技術標準
- ✅ 新增平台不需修改核心代碼
- ✅ 所有平台共用業務邏輯
- ✅ 測試覆蓋率 > 80%
- ✅ 零停機遷移

### 業務標準
- ✅ 現有 Shopline 功能零影響
- ✅ 第二平台整合時間 < 5 天
- ✅ 代碼可維護性提升

---

**建立日期**: 2025-10-22  
**作者**: AI Assistant (Architecture Role)  
**版本**: 1.0.0 - 初稿  
**狀態**: 📋 待審核

