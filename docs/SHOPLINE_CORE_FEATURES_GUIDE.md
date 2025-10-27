# Shopline 核心功能複製指南

> **目標**: 讓另一個 agent 快速複製出 Shopline OAuth 流程和 API 調用的核心功能

## 📋 核心功能清單

### ✅ 已實現的核心功能
1. **Shopline OAuth 2.0 授權流程** - 完整的授權、回調、刷新、撤銷
2. **Token 過期時間檢查** - 自動檢查和顯示 token 狀態
3. **一鍵 API 調用介面** - 前端 UI 可直接調用各種 Shopline API
4. **PostgreSQL 資料庫** - Token 持久化儲存
5. **Vercel 部署** - Serverless 雲端部署
6. **Event Bus 系統** - 事件驅動架構核心
7. **Event Monitor Dashboard** - 即時事件監控和測試工具

---

## 🏗️ 系統架構

### 技術棧
- **後端**: Node.js + Express.js
- **資料庫**: PostgreSQL (Vercel Postgres)
- **前端**: Vanilla JavaScript + Tailwind CSS
- **部署**: Vercel Serverless Functions
- **OAuth**: Shopline OAuth 2.0
- **事件系統**: Event Bus + SSE (Server-Sent Events)
- **監控**: Event Monitor Dashboard

### 目錄結構
```
custom-app/
├── api/                    # Vercel Functions (API 端點)
│   ├── oauth/             # OAuth 相關端點
│   ├── event-monitor/     # Event Monitor Dashboard API
│   └── test/              # API 測試端點
├── views/                 # 前端 HTML
├── public/                # 靜態資源
│   ├── css/              # 樣式檔案
│   └── js/               # 前端 JavaScript
├── utils/                 # 工具函數
│   ├── shopline-api.js   # Shopline API 客戶端
│   └── database-postgres.js # 資料庫操作
├── core/                  # 核心系統
│   ├── event-bus/         # Event Bus 系統
│   └── events/            # 事件定義
├── config.json           # 應用配置
└── vercel.json           # Vercel 部署配置
```

---

## 🔑 核心實現步驟

### 步驟 1: 環境設置

#### 1.1 安裝依賴
```bash
npm install express axios cors pg uuid
npm install -D nodemon
```

#### 1.2 環境變數設置
```bash
# 本地開發 (.env.local)
NODE_ENV=development
PORT=3000
POSTGRES_URL=postgres://username:password@host:port/database

# Vercel 生產環境
APP_KEY=your_shopline_app_key
APP_SECRET=your_shopline_app_secret
SHOP_HANDLE=your_shop_handle
SHOP_URL=https://your_shop.myshopline.com/
POSTGRES_URL=postgres://... # 由 Vercel 自動設定
```

#### 1.3 應用配置 (config.json)
```json
{
  "app_key": "4c951e966557c8374d9a61753dfe3c52441aba3b",
  "app_secret": "dd46269d6920f49b07e810862d3093062b0fb858",
  "shop_handle": "paykepoc",
  "shop_url": "https://paykepoc.myshopline.com/",
  "port": 3000,
  "node_env": "development"
}
```

### 步驟 2: 資料庫設置

#### 2.1 PostgreSQL 資料表結構
```sql
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id SERIAL PRIMARY KEY,
  shop_handle VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expire_time TIMESTAMP NOT NULL,
  refresh_expire_time TIMESTAMP NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2.2 資料庫操作類別 (utils/database-postgres.js)
```javascript
class Database {
  async init() {
    // 初始化 PostgreSQL 連接
    // 建立資料表
  }
  
  async saveToken(shopHandle, tokenData) {
    // 儲存或更新 Token
  }
  
  async getToken(shopHandle) {
    // 取得 Token
  }
  
  async deleteToken(shopHandle) {
    // 刪除 Token
  }
  
  isTokenExpired(tokenData) {
    // 檢查 Token 是否過期
  }
}
```

### 步驟 3: OAuth 2.0 授權流程

#### 3.1 授權啟動端點 (api/oauth/install.js)
```javascript
module.exports = async (req, res) => {
  const scope = 'read_store_information,read_products,write_products,read_orders,write_orders'
  const redirectUri = `${process.env.VERCEL_URL || 'http://localhost:3000'}/oauth/callback`
  const authUrl = `https://${config.shop_handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${config.app_key}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(redirectUri)}`
  
  res.redirect(authUrl)
}
```

#### 3.2 授權回調端點 (api/oauth/callback.js)
```javascript
module.exports = async (req, res) => {
  const { appkey, code, handle, timestamp, sign } = req.query
  
  // 1. 驗證簽名
  const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
  
  // 2. 驗證時間戳
  const isValidTimestamp = verifyTimestamp(timestamp)
  
  // 3. 使用授權碼獲取 Access Token
  const tokenUrl = `https://${handle}.myshopline.com/admin/oauth-web/oauth/token`
  const tokenData = {
    appKey: config.app_key,
    appSecret: config.app_secret,
    code: code,
    grantType: 'authorization_code'
  }
  
  // 4. 儲存 Token 到資料庫
  await database.saveToken(handle, tokenResponse.data)
  
  res.redirect('/?authorized=true')
}
```

#### 3.3 Token 刷新端點 (api/oauth/refresh.js)
```javascript
module.exports = async (req, res) => {
  const { handle } = req.body
  
  const response = await axios.post(
    `https://${handle}.myshopline.com/admin/oauth/token/refresh`,
    {},
    {
      headers: {
        'Content-Type': 'application/json',
        'appkey': config.app_key,
        'timestamp': timestamp,
        'sign': sign
      }
    }
  )
  
  // 更新資料庫中的 token
  await database.saveToken(handle, response.data.data)
  
  res.json({ success: true, data: response.data.data })
}
```

### 步驟 4: Shopline API 客戶端

#### 4.1 API 客戶端類別 (utils/shopline-api.js)
```javascript
class ShoplineAPIClient {
  constructor() {
    this.baseURL = `https://${config.shop_handle}.myshopline.com`
  }
  
  buildAuthHeaders(accessToken) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
  
  async getShopInfo(accessToken) {
    // 查詢商店資訊
  }
  
  async getProducts(accessToken, params = {}) {
    // 查詢商品列表
  }
  
  async createProduct(accessToken, productData) {
    // 建立商品
  }
  
  async getOrders(accessToken, params = {}) {
    // 查詢訂單列表
  }
  
  async createOrder(accessToken, orderData) {
    // 建立訂單
  }
}
```

### 步驟 5: API 測試端點

#### 5.1 商店資訊 API (api/test/shop.js)
```javascript
module.exports = async (req, res) => {
  const accessToken = req.headers.authorization.substring(7)
  const apiClient = new ShoplineAPIClient()
  const result = await apiClient.testShopInfoAPI(accessToken)
  res.json(result)
}
```

#### 5.2 商品 API (api/test/products.js)
```javascript
module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // 查詢商品列表
    const result = await apiClient.getProducts(accessToken, params)
  } else if (req.method === 'POST') {
    // 建立商品
    const result = await apiClient.createProduct(accessToken, payload)
  }
  res.json(result)
}
```

#### 5.3 訂單 API (api/test/orders/list.js)
```javascript
module.exports = async (req, res) => {
  const result = await apiClient.getOrders(accessToken, params)
  res.json(result)
}
```

### 步驟 6: 前端 UI 介面

#### 6.1 主頁面 (views/index.html)
```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <title>SHOPLINE OAuth App</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>
    <!-- 狀態卡片 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">應用狀態</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="text-sm font-medium text-green-800">伺服器狀態</div>
                <div class="text-lg font-bold text-green-900" id="serverStatus">運行中</div>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="text-sm font-medium text-blue-800">OAuth 狀態</div>
                <div class="text-lg font-bold text-blue-900" id="oauthStatus">未授權</div>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div class="text-sm font-medium text-purple-800">Token 狀態</div>
                <div class="text-lg font-bold text-purple-900" id="tokenStatus">無</div>
            </div>
        </div>
    </div>

    <!-- OAuth 授權區域 -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">SHOPLINE 授權</h2>
        <button id="startOAuthBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            開始授權
        </button>
    </div>

    <!-- API 測試區域 -->
    <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">API 測試</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button id="testShopBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg">
                測試商店 API
            </button>
            <button id="testProductsBtn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg">
                檢視商品 API
            </button>
            <button id="getOrdersBtn" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg">
                查詢訂單列表
            </button>
        </div>
    </div>
</body>
</html>
```

#### 6.2 前端 JavaScript (public/js/app.js)
```javascript
class ShoplineOAuthApp {
    constructor() {
        this.config = {
            appKey: '4c951e966557c8374d9a61753dfe3c52441aba3b',
            shopHandle: 'paykepoc'
        }
        this.init()
    }
    
    init() {
        this.bindEvents()
        this.checkAuthStatus()
    }
    
    startOAuthFlow() {
        const scope = 'read_store_information,read_products,write_products,read_orders,write_orders'
        const redirectUri = `${window.location.origin}/oauth/callback`
        const authUrl = `https://${this.config.shopHandle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${this.config.appKey}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(redirectUri)}`
        
        window.open(authUrl, 'shopline_oauth', 'width=600,height=700')
    }
    
    async testShopAPI() {
        const token = await this.getStoredToken()
        const response = await fetch('/api/test/shop', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const result = await response.json()
        this.displayAPIResult(result)
    }
    
    async testProductsAPI() {
        const token = await this.getStoredToken()
        const response = await fetch('/api/test/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const result = await response.json()
        this.displayAPIResult(result)
    }
    
    async getOrdersAPI() {
        const token = await this.getStoredToken()
        const response = await fetch('/api/test/orders/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        const result = await response.json()
        this.displayAPIResult(result)
    }
}
```

### 步驟 7: Vercel 部署配置

#### 7.1 Vercel 配置 (vercel.json)
```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/views/$1"
    }
  ]
}
```

#### 7.2 部署步驟
```bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 連接 Vercel 專案
vercel link

# 3. 設定環境變數
vercel env add APP_KEY
vercel env add APP_SECRET
vercel env add SHOP_HANDLE
vercel env add SHOP_URL
vercel env add POSTGRES_URL

# 4. 部署
vercel --prod
```

---

## 🔧 核心功能實現細節

### OAuth 2.0 流程
1. **授權請求**: 用戶點擊「開始授權」→ 跳轉到 Shopline 授權頁面
2. **授權回調**: Shopline 回調到 `/oauth/callback` → 驗證簽名和時間戳
3. **Token 交換**: 使用授權碼換取 access_token 和 refresh_token
4. **Token 儲存**: 將 token 資訊儲存到 PostgreSQL 資料庫
5. **Token 刷新**: 當 token 過期時，使用 refresh_token 更新

### API 調用流程
1. **前端發起請求**: 用戶點擊 API 測試按鈕
2. **Token 驗證**: 從資料庫取得有效的 access_token
3. **API 調用**: 使用 ShoplineAPIClient 調用相應的 Shopline API
4. **結果顯示**: 將 API 回應顯示在前端介面

### Token 過期檢查
```javascript
isTokenExpired(tokenData) {
  if (!tokenData || !tokenData.expireTime) {
    return true
  }
  const now = new Date()
  const expireTime = new Date(tokenData.expireTime)
  return now > expireTime
}
```

---

## 📋 快速複製檢查清單

### ✅ 必要檔案清單
- [ ] `package.json` - 依賴配置
- [ ] `config.json` - 應用配置
- [ ] `vercel.json` - 部署配置
- [ ] `utils/database-postgres.js` - 資料庫操作
- [ ] `utils/shopline-api.js` - API 客戶端
- [ ] `api/oauth/install.js` - 授權啟動
- [ ] `api/oauth/callback.js` - 授權回調
- [ ] `api/oauth/refresh.js` - Token 刷新
- [ ] `api/test/shop.js` - 商店 API 測試
- [ ] `api/test/products.js` - 商品 API 測試
- [ ] `api/test/orders/list.js` - 訂單 API 測試
- [ ] `views/index.html` - 前端頁面
- [ ] `public/js/app.js` - 前端邏輯

### ✅ 環境設置檢查
- [ ] PostgreSQL 資料庫已設置
- [ ] 環境變數已配置
- [ ] Shopline 應用已註冊
- [ ] Vercel 專案已連接

### ✅ 功能測試檢查
- [ ] OAuth 授權流程正常
- [ ] Token 儲存和讀取正常
- [ ] Token 過期檢查正常
- [ ] 商店資訊 API 調用正常
- [ ] 商品 API 調用正常
- [ ] 訂單 API 調用正常
- [ ] 前端 UI 顯示正常

---

## 🚀 快速啟動命令

```bash
# 1. 安裝依賴
npm install

# 2. 啟動本地開發
npm start

# 3. 啟動 ngrok (另一終端)
npm run ngrok

# 4. 訪問應用
open http://localhost:3000

# 5. 部署到 Vercel
vercel --prod
```

---

## 📊 Event Monitor Dashboard

### 功能概述
Event Monitor Dashboard 是 Event Bus 系統的可視化監控工具，讓用戶能夠直觀地測試和監控事件流。

### 核心功能
1. **即時監控**：使用 Server-Sent Events (SSE) 訂閱模式
2. **事件發布測試**：測試 Event Bus 事件發布功能
3. **歷史事件載入**：載入最近 100 筆歷史事件
4. **統計顯示**：顯示資料庫總事件數和 log 區域統計

### 訪問方式
```bash
# 本地開發
open http://localhost:3000/event-monitor

# 生產環境
open https://your-app.vercel.app/event-monitor
```

### API 端點
- `GET /api/event-monitor/events` - 獲取歷史事件
- `GET /api/event-monitor/stream` - SSE 事件流
- `POST /api/event-monitor/test-simple` - 發布測試事件

---

## 📞 支援資源

- **Shopline 官方文件**: https://developer.shopline.com/
- **OAuth 2.0 標準**: https://tools.ietf.org/html/rfc6749
- **Vercel 部署指南**: https://vercel.com/docs
- **PostgreSQL 文件**: https://www.postgresql.org/docs/

---

**版本**: 1.0.0  
**最後更新**: 2025-01-27  
**狀態**: ✅ 核心功能完整實現
