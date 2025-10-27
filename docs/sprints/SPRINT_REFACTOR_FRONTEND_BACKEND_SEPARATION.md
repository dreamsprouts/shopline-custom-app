# Sprint: 前後端分離重構計劃

**目標**: 將當前 Vercel 前後端整合專案重構為前後端分離架構  
**預計時間**: 2-3 週  
**狀態**: 規劃階段  
**建立日期**: 2025-01-27

---

## 🚨 當前問題分析

### 主要問題
1. **Vercel 前後端整合架構複雜度高**
   - 需要同時維護 `server.js` 和 `api/` 目錄
   - 路由對應複雜，容易出錯
   - 本地開發和生產環境行為不一致

2. **技術債累積**
   - 代碼重複 (server.js 和 api/ 目錄)
   - 維護成本高
   - 部署流程複雜

3. **擴展性限制**
   - Vercel Functions 有執行時間限制 (30秒)
   - 不適合長時間運行的後端服務
   - 資料庫連接池管理困難

4. **開發體驗差**
   - 需要同時考慮兩種環境
   - 調試困難
   - 測試覆蓋不完整

---

## 🎯 重構目標

### 架構目標
- **前端**: 純靜態網站，部署在 Vercel
- **後端**: 獨立 API 服務，部署在 Render
- **資料庫**: 統一管理，可選 Vercel Postgres 或外部資料庫
- **通訊**: RESTful API + CORS

### 技術目標
- 簡化開發流程
- 提高代碼可維護性
- 改善部署體驗
- 增強系統穩定性

---

## 🏗️ 新架構設計

### 前端架構 (Vercel)

```
frontend/
├── public/
│   ├── index.html              # 主頁面
│   ├── css/
│   │   └── style.css          # 樣式
│   └── js/
│       ├── app.js             # 主應用邏輯
│       ├── api-client.js      # API 客戶端
│       └── components/        # UI 組件
├── vercel.json                # Vercel 配置
└── package.json               # 前端依賴
```

**特點**:
- 純靜態檔案託管
- 無需 serverless functions
- 快速載入
- 簡單部署

### 後端架構 (Render)

```
backend/
├── src/
│   ├── controllers/           # 控制器
│   │   ├── authController.js
│   │   ├── shopController.js
│   │   ├── productController.js
│   │   └── orderController.js
│   ├── services/              # 業務邏輯
│   │   ├── shoplineService.js
│   │   ├── nextEngineService.js
│   │   └── eventBusService.js
│   ├── models/                # 資料模型
│   │   └── database.js
│   ├── middleware/             # 中介軟體
│   │   ├── auth.js
│   │   ├── cors.js
│   │   └── errorHandler.js
│   ├── routes/                # 路由
│   │   ├── auth.js
│   │   ├── shop.js
│   │   ├── products.js
│   │   └── orders.js
│   └── app.js                 # 應用入口
├── tests/                     # 測試
├── package.json
└── render.yaml                # Render 配置
```

**特點**:
- 標準 Express.js 應用
- 模組化設計
- 完整測試覆蓋
- 獨立部署和擴展

### 資料庫架構

**選項 1: 維持 Vercel Postgres**
- 優點: 無需遷移，現有資料保留
- 缺點: 前端無法直接連接，需要後端代理

**選項 2: 遷移到外部資料庫**
- 優點: 前後端都可直接連接，更靈活
- 缺點: 需要資料遷移

**建議**: 先維持 Vercel Postgres，後續可考慮遷移

---

## 📋 詳細實施計劃

### Phase 1: 準備階段 (3-4 天)

#### Day 1: 專案結構重組
- [ ] 建立 `frontend/` 和 `backend/` 目錄
- [ ] 移動現有檔案到對應目錄
- [ ] 更新 `.gitignore` 和 `package.json`
- [ ] 建立新的專案結構文件

#### Day 2: 後端 API 重構
- [ ] 建立標準 Express.js 應用結構
- [ ] 重構現有 API 端點
- [ ] 實作 CORS 中介軟體
- [ ] 建立統一的錯誤處理

#### Day 3: 前端重構
- [ ] 重構前端 JavaScript 代碼
- [ ] 建立 API 客戶端模組
- [ ] 實作環境偵測 (開發/生產)
- [ ] 優化 UI 組件

#### Day 4: 測試和驗證
- [ ] 本地測試前後端分離
- [ ] 驗證所有 API 端點
- [ ] 測試 CORS 設定
- [ ] 建立測試腳本

### Phase 2: 部署配置 (2-3 天)

#### Day 5: Render 後端部署
- [ ] 建立 Render 專案
- [ ] 配置環境變數
- [ ] 設定自動部署
- [ ] 測試後端 API

#### Day 6: Vercel 前端部署
- [ ] 更新 Vercel 配置
- [ ] 移除不必要的 serverless functions
- [ ] 配置靜態檔案託管
- [ ] 測試前端部署

#### Day 7: 整合測試
- [ ] 端到端測試
- [ ] 效能測試
- [ ] 錯誤處理測試
- [ ] 文件更新

### Phase 3: 優化和清理 (2-3 天)

#### Day 8-9: 代碼優化
- [ ] 移除重複代碼
- [ ] 優化 API 回應
- [ ] 改善錯誤處理
- [ ] 增加日誌記錄

#### Day 10: 文件更新
- [ ] 更新 README
- [ ] 更新 API 文件
- [ ] 建立部署指南
- [ ] 建立故障排除指南

---

## 🔧 技術實施細節

### 前端 API 客戶端設計

```javascript
// frontend/public/js/api-client.js
class APIClient {
  constructor() {
    this.baseURL = this.getBaseURL()
  }

  getBaseURL() {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3001'  // 本地後端
    }
    return 'https://your-backend.onrender.com'  // 生產後端
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'API 請求失敗')
      }
      
      return data
    } catch (error) {
      console.error('API 請求錯誤:', error)
      throw error
    }
  }

  // 認證相關
  async authorize(code, state) {
    return this.request('/api/auth/authorize', {
      method: 'POST',
      body: JSON.stringify({ code, state })
    })
  }

  // 商店相關
  async getShopInfo(token) {
    return this.request('/api/shop/info', {
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  // 商品相關
  async getProducts(token, params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/products?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  async createProduct(token, productData) {
    return this.request('/api/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(productData)
    })
  }

  // 訂單相關
  async getOrders(token, params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/api/orders?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  }

  async createOrder(token, orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(orderData)
    })
  }
}
```

### 後端 Express 應用結構

```javascript
// backend/src/app.js
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/auth')
const shopRoutes = require('./routes/shop')
const productRoutes = require('./routes/products')
const orderRoutes = require('./routes/orders')

const errorHandler = require('./middleware/errorHandler')
const { setupEventBus } = require('./services/eventBusService')

const app = express()

// 安全中介軟體
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100 // 限制每個 IP 100 次請求
})
app.use(limiter)

// 解析中介軟體
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/shop', shopRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// 錯誤處理
app.use(errorHandler)

// 初始化 Event Bus
setupEventBus()

module.exports = app
```

### Render 部署配置

```yaml
# backend/render.yaml
services:
  - type: web
    name: shopline-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: FRONTEND_URL
        value: https://your-frontend.vercel.app
      - key: POSTGRES_URL
        fromDatabase:
          name: shopline-db
          property: connectionString
    healthCheckPath: /health
    autoDeploy: true

databases:
  - name: shopline-db
    plan: free
```

---

## 🧪 測試策略

### 單元測試
- 後端 API 端點測試
- 前端 API 客戶端測試
- 業務邏輯測試

### 整合測試
- 前後端通訊測試
- 資料庫操作測試
- 第三方 API 整合測試

### 端到端測試
- 完整 OAuth 流程測試
- 商品管理流程測試
- 訂單管理流程測試

---

## 📊 風險評估

### 高風險
- **資料庫遷移**: 可能導致資料遺失
- **API 相容性**: 前端可能無法正確呼叫後端

### 中風險
- **部署複雜度**: 需要管理兩個不同的平台
- **網路延遲**: 前後端分離可能增加延遲

### 低風險
- **開發環境設定**: 需要同時運行前後端
- **CORS 設定**: 可能遇到跨域問題

### 風險緩解
- 建立完整的測試覆蓋
- 實作詳細的錯誤處理
- 建立回滾計劃
- 分階段部署

---

## 📈 成功指標

### 技術指標
- [ ] 前端載入時間 < 2 秒
- [ ] 後端 API 回應時間 < 500ms
- [ ] 測試覆蓋率 > 80%
- [ ] 零停機時間部署

### 開發體驗指標
- [ ] 本地開發啟動時間 < 30 秒
- [ ] 部署時間 < 5 分鐘
- [ ] 代碼重複率 < 5%
- [ ] 文件完整度 100%

### 業務指標
- [ ] 所有現有功能正常運作
- [ ] 新功能開發效率提升 50%
- [ ] 維護成本降低 30%
- [ ] 系統穩定性提升

---

## 📚 參考資源

### 技術文件
- [Express.js 官方文件](https://expressjs.com/)
- [Render 部署指南](https://render.com/docs)
- [Vercel 靜態託管](https://vercel.com/docs/concepts/static-sites)
- [CORS 設定指南](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

### 最佳實踐
- [RESTful API 設計原則](https://restfulapi.net/)
- [前端 API 客戶端設計](https://blog.logrocket.com/how-to-make-http-requests-like-a-pro-with-axios/)
- [Node.js 安全最佳實踐](https://nodejs.org/en/docs/guides/security/)

---

## 📝 檢查清單

### 重構前檢查
- [ ] 備份現有代碼
- [ ] 記錄當前功能清單
- [ ] 建立測試基準
- [ ] 準備回滾計劃

### 重構中檢查
- [ ] 每個階段完成後測試
- [ ] 保持功能完整性
- [ ] 更新相關文件
- [ ] 記錄變更日誌

### 重構後檢查
- [ ] 完整功能測試
- [ ] 效能測試
- [ ] 安全檢查
- [ ] 文件更新
- [ ] 團隊培訓

---

**版本**: 1.0.0  
**建立日期**: 2025-01-27  
**預計完成**: 2025-02-17  
**負責人**: Development Team  
**狀態**: 規劃中
