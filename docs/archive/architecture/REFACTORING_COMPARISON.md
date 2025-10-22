# 架構重構對照表

## 📋 文件資訊

- **目的**: 清楚展示重構前後的對照，方便討論和決策
- **版本**: 1.0.0
- **日期**: 2025-10-22

---

## 🔄 檔案結構對照

### 現有結構 (AS-IS)
```
custom-app/
├── utils/
│   ├── shopline-api.js         # 👈 單一檔案包含所有 Shopline 邏輯
│   ├── signature.js            # 👈 Shopline 簽名工具
│   └── database-postgres.js
├── routes/
│   └── oauth.js                # 👈 直接調用 shopline-api.js
├── api/
│   ├── oauth/
│   │   ├── install.js          # 👈 直接調用 shopline-api.js
│   │   └── callback.js
│   └── test/
│       ├── shop.js
│       ├── products.js
│       └── orders/
└── server.js                    # 👈 直接調用 shopline-api.js
```

### 新結構 (TO-BE)
```
custom-app/
├── core/                        # 🆕 核心抽象層
│   ├── interfaces/             # 🆕 介面定義
│   │   ├── IPlatform.js
│   │   ├── IOAuthProvider.js
│   │   ├── IAPIClient.js
│   │   └── IDataMapper.js
│   ├── base/                    # 🆕 基礎類別
│   │   ├── BasePlatform.js
│   │   ├── BaseOAuthProvider.js
│   │   ├── BaseAPIClient.js
│   │   └── BaseDataMapper.js
│   ├── registry/                # 🆕 平台註冊表
│   │   └── PlatformRegistry.js
│   └── bootstrap.js             # 🆕 初始化
│
├── platforms/                   # 🆕 平台插件層
│   └── shopline/               # 🆕 Shopline 插件
│       ├── ShoplineOAuth.js     # ← 從 shopline-api.js 提取
│       ├── ShoplineAPIClient.js # ← 從 shopline-api.js 提取
│       ├── ShoplineDataMapper.js # 🆕 資料映射
│       ├── ShoplinePlatform.js  # 🆕 平台整合
│       ├── utils/
│       │   └── signature.js     # ← 從 utils/ 移動
│       ├── config.js            # 🆕 平台配置
│       └── index.js             # 🆕 平台入口
│
├── services/                    # 🆕 業務服務層
│   ├── AuthService.js          # 🆕 統一認證服務
│   ├── ProductService.js       # 🆕 統一商品服務
│   ├── OrderService.js         # 🆕 統一訂單服務
│   └── index.js
│
├── config/                      # 🆕 配置管理
│   ├── platforms.json
│   └── index.js
│
├── utils/                       # 保持
│   ├── database-postgres.js    # 保持不變
│   ├── shopline-api.js         # ⚠️ 保留（Phase 3 刪除）
│   └── signature.js            # ⚠️ 保留（Phase 3 刪除）
│
├── routes/                      # 保持（Phase 2 再改）
│   └── oauth.js               
├── api/                         # 保持（Phase 2 再改）
│   ├── oauth/
│   └── test/
└── server.js                    # 保持（Phase 2 再改）
```

---

## 📊 代碼組織對照

### 現有：單一檔案 (`utils/shopline-api.js`)

```javascript
// 😰 所有邏輯混在一起，約 700+ 行
class ShoplineAPIClient {
  // OAuth 方法
  generateAuthUrl()
  handleCallback()
  refreshToken()
  
  // API 請求方法
  getProducts()
  createProduct()
  getOrders()
  createOrder()
  
  // 測試方法
  testProductsAPI()
  testOrdersAPI()
  testAllAPIs()
  
  // 簽名方法
  buildAuthHeaders()
  signGetRequest()
  signPostRequest()
}
```

**問題**:
- ❌ 職責不清：OAuth、API、測試混在一起
- ❌ 無法擴展：新增平台需要複製整個檔案
- ❌ 難以測試：一個類別承擔太多責任
- ❌ 緊耦合：與 Shopline 強綁定

---

### 新架構：分層清晰

#### Layer 1: 介面定義 (`core/interfaces/`)
```javascript
// 😊 清晰的契約定義
interface IPlatform {
  getName()
  getOAuthProvider()
  getAPIClient()
  getDataMapper()
}

interface IOAuthProvider {
  generateAuthUrl()
  handleCallback()
  refreshAccessToken()
  revokeToken()
}

interface IAPIClient {
  request()
  getProducts()
  createProduct()
  // ...
}

interface IDataMapper {
  productToUnified()
  productToPlatform()
  // ...
}
```

#### Layer 2: Shopline 實作 (`platforms/shopline/`)
```javascript
// 😊 各司其職，清晰分離

// ShoplineOAuth.js - 只處理 OAuth
class ShoplineOAuth extends BaseOAuthProvider {
  async generateAuthUrl(handle, redirectUri, options) {
    // Shopline 特定實作
  }
}

// ShoplineAPIClient.js - 只處理 API 請求
class ShoplineAPIClient extends BaseAPIClient {
  async getProducts(accessToken, params) {
    // Shopline 特定實作
  }
}

// ShoplineDataMapper.js - 只處理資料映射
class ShoplineDataMapper extends BaseDataMapper {
  productToUnified(shoplineProduct) {
    return {
      id: shoplineProduct.id,
      title: shoplineProduct.title,
      // ... 統一格式
    }
  }
}

// ShoplinePlatform.js - 整合
class ShoplinePlatform extends BasePlatform {
  constructor() {
    super('shopline', 'SHOPLINE', config)
    this._oauthProvider = new ShoplineOAuth(config)
    this._apiClient = new ShoplineAPIClient(config)
    this._dataMapper = new ShoplineDataMapper()
  }
}
```

#### Layer 3: 服務層 (`services/`)
```javascript
// 😊 完全平台無關的業務邏輯

class ProductService {
  async getProducts(platformName, accessToken, params) {
    const platform = PlatformRegistry.get(platformName)
    const apiClient = platform.getAPIClient()
    const mapper = platform.getDataMapper()
    
    const response = await apiClient.getProducts(accessToken, params)
    return response.data.products.map(p => mapper.productToUnified(p))
  }
}
```

**優勢**:
- ✅ 職責單一：每個類別只做一件事
- ✅ 易於擴展：新增平台只需實作介面
- ✅ 易於測試：可以單獨測試每個層次
- ✅ 鬆耦合：業務邏輯與平台解耦

---

## 🔄 調用流程對照

### 現有流程
```
routes/oauth.js
    ↓ require('./utils/shopline-api')
ShoplineAPIClient
    ↓ 直接調用
Shopline API
```

**問題**: 路由層直接依賴具體平台實作

---

### 新流程（Phase 1 後）
```
routes/oauth.js (保持不變，Phase 2 再改)
    ↓
ShoplineAPIClient (保留，標記 deprecated)
    ↓
Shopline API

同時可以使用：
routes/oauth.js (Phase 2 改造)
    ↓ 調用
services/AuthService (平台無關)
    ↓ 透過
PlatformRegistry.get('shopline')
    ↓ 取得
ShoplinePlatform
    ↓ 呼叫
ShoplineOAuth
    ↓
Shopline API
```

**優勢**: 新舊代碼並存，漸進式切換，零風險

---

### 新流程（Phase 3 完成後）
```
routes/oauth.js
    ↓
services/AuthService (平台無關)
    ↓
PlatformRegistry.get(platformName) (支援任何平台)
    ↓
Platform.getOAuthProvider()
    ↓
IOAuthProvider 實作 (Shopline/Shopify/...)
    ↓
平台 API
```

**優勢**: 
- ✅ 平台切換：只需改變 `platformName`
- ✅ 統一介面：所有平台使用相同方法
- ✅ 易於維護：修改不影響其他平台

---

## 📝 使用範例對照

### 現有用法
```javascript
// routes/oauth.js
const ShoplineAPIClient = require('./utils/shopline-api')
const apiClient = new ShoplineAPIClient()

// 只能處理 Shopline
const authUrl = await apiClient.generateAuthUrl(...)
```

---

### 新用法（Phase 2 後）
```javascript
// routes/oauth.js
const { AuthService } = require('./services')

// 可以處理任何平台
const authUrl = await AuthService.authorize('shopline', handle, redirectUri)

// 未來新增 Shopify 不需要改代碼
const authUrl = await AuthService.authorize('shopify', shop, redirectUri)
```

---

## 🎯 新增平台對照

### 現有：新增 Shopify 需要

1. ❌ 複製 `shopline-api.js` → `shopify-api.js` (700+ 行)
2. ❌ 修改所有方法實作
3. ❌ 修改 `routes/oauth.js` 加入 if/else 判斷
4. ❌ 修改 `server.js` 加入 if/else 判斷
5. ❌ 修改所有 API Functions
6. ❌ 前端加入平台判斷邏輯

**預估**: 3-5 天，高風險

---

### 新架構：新增 Shopify 只需

1. ✅ 建立 `platforms/shopify/` 目錄
2. ✅ 實作 `ShopifyOAuth extends BaseOAuthProvider`
3. ✅ 實作 `ShopifyAPIClient extends BaseAPIClient`
4. ✅ 實作 `ShopifyDataMapper extends BaseDataMapper`
5. ✅ 整合為 `ShopifyPlatform extends BasePlatform`
6. ✅ 註冊到 `PlatformRegistry`

**預估**: 1-2 天，低風險

**無需修改**:
- ✅ routes/ - 使用服務層，自動支援
- ✅ api/ - 使用服務層，自動支援
- ✅ services/ - 完全不需要改
- ✅ 前端 - 只需選擇平台名稱

---

## 🧪 測試對照

### 現有測試結構
```
tests/
└── shopline-api.test.js  # 😰 測試 700+ 行的類別
```

**問題**: 
- ❌ 難以針對性測試
- ❌ 測試覆蓋不完整
- ❌ Mock 困難

---

### 新測試結構
```
tests/
├── core/
│   ├── interfaces/        # 測試介面契約
│   ├── base/              # 測試基礎類別
│   └── registry/          # 測試註冊表
├── platforms/
│   └── shopline/
│       ├── ShoplineOAuth.test.js      # 單獨測試 OAuth
│       ├── ShoplineAPIClient.test.js  # 單獨測試 API
│       └── ShoplineDataMapper.test.js # 單獨測試映射
└── services/
    ├── AuthService.test.js     # 測試服務層（Mock 平台）
    ├── ProductService.test.js
    └── OrderService.test.js
```

**優勢**:
- ✅ 職責清晰，易於測試
- ✅ 可以單獨測試每個元件
- ✅ Mock 容易

---

## 📊 風險評估對照

### 繼續現有架構的風險

| 風險 | 影響 | 發生時間 |
|------|------|---------|
| 代碼越來越複雜 | 高 | 每次新增功能 |
| 新增平台困難 | 高 | 需要第二平台時 |
| 難以維護 | 中 | 持續累積 |
| 測試困難 | 中 | 持續累積 |
| 技術債務 | 高 | 持續累積 |

**結論**: 技術債務會持續累積，越晚重構成本越高

---

### 重構的風險

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 破壞現有功能 | 高 | 保留舊代碼、嚴格測試 |
| 開發時間 | 低 | 3 天可控 |
| 學習曲線 | 低 | 清晰的文件和範例 |

**結論**: 風險可控，長期收益遠大於短期成本

---

## 💰 投資報酬率

### 重構成本
- **時間**: 3 天（Phase 1）
- **風險**: 低（保留舊代碼）
- **影響**: 無（不破壞現有功能）

### 重構收益

#### 立即收益（Phase 1 完成後）
- ✅ 代碼結構清晰，易於理解
- ✅ 職責分離，易於維護
- ✅ 為未來擴展打好基礎

#### 中期收益（Phase 2-3 完成後）
- ✅ 新舊代碼切換完成
- ✅ 代碼量減少約 30%
- ✅ 測試覆蓋率提升

#### 長期收益（Phase 4+ 新增平台）
- ✅ 新增平台時間從 5 天 → 2 天（節省 60%）
- ✅ 維護成本降低 50%
- ✅ Bug 減少（清晰的職責分離）
- ✅ 團隊協作更順暢（明確的模組邊界）

---

## 🚀 建議

### 立即開始 Phase 1 的理由

1. **最佳時機**
   - 目前只有一個平台（Shopline）
   - Sprint 2 剛完成，沒有進行中的開發
   - 重構成本最低

2. **可控風險**
   - 保留所有現有代碼
   - 新舊並存，漸進切換
   - 可以隨時停止

3. **未來收益**
   - 為多平台整合打好基礎
   - 代碼質量顯著提升
   - 維護成本大幅降低

4. **時間成本**
   - 只需 3 天
   - 不影響業務進度
   - 長期節省更多時間

---

## 🤔 討論要點

### 需要確認的問題

1. **是否認同多平台 Connector 的方向？**
   - 未來是否會整合 Shopify、WooCommerce 等？
   - 時間規劃是什麼？

2. **是否接受 3 天的重構時間？**
   - 可以接受暫停 Sprint 3 嗎？
   - 或者希望並行進行？

3. **對新架構的疑慮？**
   - 複雜度是否可接受？
   - 學習曲線是否太陡？
   - 有其他考量嗎？

4. **優先級如何？**
   - 立即重構 vs 先完成更多功能？
   - 代碼質量 vs 快速迭代？

---

**建立日期**: 2025-10-22  
**作者**: AI Assistant (Architecture Role)  
**版本**: 1.0.0 - 對照表  
**狀態**: 📋 待討論

