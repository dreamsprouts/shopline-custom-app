# Vercel 架構設計文件

## 🎯 目的

**避免本地開發正常，Vercel 部署卻失敗的問題！**

## 📊 架構對比

### 本地開發環境 (localhost:3000)

```
┌─────────────────────────────────────────┐
│         Express.js (server.js)          │
├─────────────────────────────────────────┤
│  靜態檔案                                │
│  ├── GET /                              │
│  ├── GET /views/callback.html          │
│  └── GET /js/app.js                     │
├─────────────────────────────────────────┤
│  OAuth 路由 (routes/oauth.js)           │
│  ├── GET /oauth/install                 │
│  ├── GET /oauth/callback                │
│  ├── POST /oauth/refresh                │
│  ├── POST /oauth/revoke                 │
│  ├── GET /oauth/status                  │
│  └── GET /oauth/token-status            │
├─────────────────────────────────────────┤
│  API 測試路由 (server.js)               │
│  ├── GET /api/test/shop                 │
│  ├── GET /api/test/products             │
│  ├── POST /api/test/products            │
│  ├── POST /api/test/orders              │
│  ├── GET /api/test/orders               │
│  ├── GET /api/test/orders/:id           │
│  └── PUT /api/test/orders/:id           │
└─────────────────────────────────────────┘
```

### Vercel 生產環境

```
┌─────────────────────────────────────────┐
│       Vercel 靜態檔案託管               │
├─────────────────────────────────────────┤
│  ├── GET /                              │
│  │    → views/index.html               │
│  ├── GET /views/callback.html          │
│  │    → views/callback.html            │
│  └── GET /js/app.js                     │
│       → public/js/app.js                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     Vercel Serverless Functions         │
├─────────────────────────────────────────┤
│  OAuth Functions (api/oauth/)           │
│  ├── GET /api/oauth/install             │
│  │    → api/oauth/install.js           │
│  ├── GET /api/oauth/callback            │
│  │    → api/oauth/callback.js          │
│  ├── POST /api/oauth/refresh            │
│  │    → api/oauth/refresh.js           │
│  ├── POST /api/oauth/revoke             │
│  │    → api/oauth/revoke.js            │
│  ├── GET /api/oauth/status              │
│  │    → api/oauth/status.js            │
│  └── GET /api/oauth/token-status        │
│       → api/oauth/token-status.js       │
├─────────────────────────────────────────┤
│  API 測試 Functions (api/test/)         │
│  ├── GET /api/test/shop                 │
│  │    → api/test/shop.js               │
│  ├── GET /api/test/products/list        │
│  │    → api/test/products/list.js      │
│  ├── POST /api/test/products/create     │
│  │    → api/test/products/create.js    │
│  ├── POST /api/test/orders/create       │
│  │    → api/test/orders/create.js      │
│  ├── GET /api/test/orders/list          │
│  │    → api/test/orders/list.js        │
│  └── GET/PUT /api/test/orders/[id]      │
│       → api/test/orders/[id].js         │
└─────────────────────────────────────────┘
```

## ⚠️ **關鍵差異**

### 1. server.js 在 Vercel 不會執行
- ❌ **錯誤想法**：Vercel 會執行 `server.js`
- ✅ **正確理解**：Vercel 只執行 `api/` 目錄下的檔案

### 2. 路由對應必須一致
| 本地路由 (server.js) | Vercel Serverless Function |
|---------------------|---------------------------|
| `GET /api/test/shop` | `api/test/shop.js` |
| `POST /api/test/orders` | `api/test/orders/create.js` |
| `GET /api/test/orders` | `api/test/orders/list.js` |

### 3. 前端必須偵測環境
```javascript
// ❌ 錯誤：寫死端點
fetch('/api/test/orders')

// ✅ 正確：偵測環境
const endpoint = window.location.hostname.includes('vercel.app') 
    ? '/api/test/orders/list'  // Vercel
    : '/api/test/orders'        // localhost
fetch(endpoint)
```

## 📋 **開發流程強制檢查點**

### ✅ 新增 API 端點時 (必須全部完成)

#### 1. 實作本地路由
```javascript
// server.js
app.get('/api/test/example', async (req, res) => {
  // 實作邏輯
})
```

#### 2. 建立 Vercel Serverless Function
```javascript
// api/test/example.js
module.exports = async (req, res) => {
  // 複製相同邏輯
}
```

#### 3. 更新前端呼叫
```javascript
// public/js/app.js
const endpoint = window.location.hostname.includes('vercel.app') 
    ? '/api/test/example'  // 確認 Vercel 端點
    : '/api/test/example'  // 確認本地端點
```

#### 4. 本地測試
```bash
# 測試本地環境
curl http://localhost:3000/api/test/example
```

#### 5. Vercel 本地測試
```bash
# 測試 Vercel Functions
vercel dev
# 訪問 http://localhost:3000/api/test/example
```

#### 6. 部署並驗證
```bash
git push  # 自動部署到 Vercel
# 訪問 https://shopline-custom-app.vercel.app 測試
```

## 🚫 **禁止行為**

### ❌ 只在 server.js 新增路由
**後果**：本地正常，Vercel 404

### ❌ 只建立 Vercel Function
**後果**：Vercel 正常，本地 404

### ❌ 部署前不測試 Vercel Functions
**後果**：部署後才發現錯誤

### ❌ 前端寫死端點
**後果**：本地或 Vercel 其中一個失效

## ✅ **最佳實踐**

### 1. 代碼組織
```
project/
├── server.js                    # 本地開發用
├── api/                         # Vercel Functions
│   ├── oauth/
│   │   ├── install.js          # OAuth 授權
│   │   ├── callback.js         # OAuth 回調
│   │   └── ...
│   └── test/
│       ├── shop.js             # 商店 API
│       ├── products/
│       │   ├── list.js         # 查詢商品
│       │   └── create.js       # 建立商品
│       └── orders/
│           ├── create.js       # 建立訂單
│           ├── list.js         # 查詢訂單
│           └── [id].js         # 訂單詳情/更新
└── utils/                       # 共用邏輯
    ├── shopline-api.js         # API Client
    └── database.js             # 資料庫操作
```

### 2. 共用邏輯抽離
```javascript
// utils/shopline-api.js
class ShoplineAPIClient {
  async getOrders(accessToken, params) {
    // 核心邏輯
  }
}

// server.js (本地)
app.get('/api/test/orders', async (req, res) => {
  const client = new ShoplineAPIClient()
  const result = await client.getOrders(accessToken, params)
  res.json(result)
})

// api/test/orders/list.js (Vercel)
const ShoplineAPIClient = require('../../../utils/shopline-api')
module.exports = async (req, res) => {
  const client = new ShoplineAPIClient()
  const result = await client.getOrders(accessToken, params)
  res.json(result)
}
```

### 3. 前端環境偵測統一管理
```javascript
// public/js/app.js
class ShoplineApp {
  getAPIEndpoint(localPath, vercelPath) {
    return window.location.hostname.includes('vercel.app') 
      ? vercelPath 
      : localPath
  }
  
  async getOrders() {
    const endpoint = this.getAPIEndpoint(
      '/api/test/orders',           // localhost
      '/api/test/orders/list'       // Vercel
    )
    const response = await fetch(endpoint)
  }
}
```

## 📝 **文件維護**

### 每次新增 API 時更新
1. ✅ 本文件 (VERCEL_ARCHITECTURE.md) - 新增路由對應表
2. ✅ API_DOCUMENTATION.md - 新增 API 說明
3. ✅ PROJECT_STATUS.md - 更新功能清單
4. ✅ README.md - 更新端點列表

## 🔄 **Git 與 Vercel 自動部署**

### 當前配置
```
GitHub Repository (main branch)
  │
  │ (push to main)
  │
  ↓
Vercel 自動部署
  │
  ↓
生產環境更新
```

### 優點
- ✅ Git 為唯一真實來源
- ✅ 所有變更都有版本記錄
- ✅ 自動化部署，減少人為錯誤

### 缺點與解決
- ❌ 推送到 main 立即部署，沒有緩衝
  - 💡 解決：使用 Git branch + Pull Request
  - 💡 解決：Vercel Preview Deployments (每個 PR 獨立預覽)

## 🎯 **改進建議**

### 短期 (立即執行)
1. ✅ 建立本文件，說明架構差異
2. ✅ 建立開發流程檢查清單
3. ✅ 所有 Agent 必讀本文件

### 中期 (下一個 Sprint)
1. [ ] 建立自動化測試腳本
   - 測試所有 Vercel Functions
   - 測試所有本地路由
   - 對比兩者是否一致
2. [ ] 實作 Git branch workflow
   - 開發分支：`dev`
   - 功能分支：`feature/*`
   - 主分支：`main` (只接受 PR)
3. [ ] 使用 Vercel Preview Deployments
   - 每個 PR 自動建立預覽環境
   - 測試通過後才合併到 main

### 長期 (未來優化)
1. [ ] CI/CD Pipeline
   - GitHub Actions 自動測試
   - 測試通過才允許合併
2. [ ] 監控和告警
   - Vercel 部署狀態監控
   - API 健康檢查
3. [ ] 完整的 E2E 測試
   - Playwright/Cypress
   - 自動化測試完整流程

---

**版本**: 1.0.0  
**建立日期**: 2025-10-21  
**維護者**: Development Team  
**強制執行**: 是

**⚠️ 所有 Agent 在新增 API 端點前必須閱讀本文件！**

