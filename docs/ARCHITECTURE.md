# SHOPLINE OAuth 系統架構文件

## 📋 系統概述

本系統實現了完整的 SHOPLINE Custom App OAuth 2.0 授權流程，包含前端 UI、後端 API、資料庫持久化和 ngrok 本地開發環境。

## 🏗️ 系統架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 UI      │    │   後端 API     │    │   SQLite 資料庫  │
│  (React/Vanilla)│◄──►│   (Express.js)  │◄──►│   (Token 儲存)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ngrok Tunnel  │    │  SHOPLINE API   │    │   檔案系統       │
│  (HTTPS 公開)   │    │  (OAuth 授權)   │    │  (資料持久化)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔑 關鍵配置

### 應用憑證
```json
{
  "app_key": "4c951e966557c8374d9a61753dfe3c52441aba3b",
  "app_secret": "dd46269d6920f49b07e810862d3093062b0fb858",
  "shop_handle": "paykepoc",
  "shop_url": "https://paykepoc.myshopline.com/"
}
```

## 🔐 SHOPLINE OAuth 2.0 標準流程

### 1. 授權請求 (Authorization Request)
**端點**: `GET /oauth/install`

**SHOPLINE 標準參數**:
```javascript
const params = {
  appkey: config.app_key,           // 應用程式金鑰
  handle: shopHandle,               // 商店識別碼
  timestamp: Date.now().toString(),  // 時間戳
  lang: 'zh-hant-tw',              // 語言設定
  sign: generatedSignature          // HMAC-SHA256 簽名
}
```

**簽名生成算法** (SHOPLINE 標準):
```javascript
function generateHmacSha256(source, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(source, 'utf8')
    .digest('hex')
}

function signGetRequest(params, appSecret) {
  const sortedKeys = Object.keys(params).sort()
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&')
  return generateHmacSha256(queryString, appSecret)
}
```

### 2. 授權回調 (Authorization Callback)
**端點**: `GET /oauth/callback`

**SHOPLINE 回調參數**:
```javascript
const callbackParams = {
  appkey: '4c951e966557c8374d9a61753dfe3c52441aba3b',
  code: 'sg253255cc81492c35b2bcbd4406f7ad8142bcdc32',  // 授權碼
  handle: 'paykepoc',
  lang: 'en',
  sign: '876cfef597d3c1d2843864a4a6a91dee7c1716b295b67e796353542ea1f4924f',
  timestamp: '1760951887800'
}
```

### 3. Access Token 請求
**SHOPLINE API 端點**: `https://{handle}.myshopline.com/admin/oauth/token/create`

**請求格式** (SHOPLINE 標準):
```javascript
const tokenRequest = {
  method: 'POST',
  url: `https://${handle}.myshopline.com/admin/oauth/token/create`,
  headers: {
    'Content-Type': 'application/json',
    'appkey': config.app_key,
    'timestamp': timestamp,
    'sign': postSignature
  },
  body: JSON.stringify({ code: authorizationCode })
}
```

**POST 請求簽名算法**:
```javascript
function signPostRequest(body, timestamp, appSecret) {
  const source = body + timestamp
  return generateHmacSha256(source, appSecret)
}
```

## 🗄️ 資料庫架構

### SQLite 資料表結構
```sql
CREATE TABLE oauth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_handle TEXT NOT NULL,                    -- 商店識別碼
  access_token TEXT NOT NULL,                   -- 存取權杖
  refresh_token TEXT NOT NULL,                  -- 刷新權杖
  expire_time TEXT NOT NULL,                    -- 過期時間
  refresh_expire_time TEXT NOT NULL,            -- 刷新過期時間
  scope TEXT NOT NULL,                          -- 授權範圍
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(shop_handle)                           -- 每個商店唯一
);
```

### 資料庫操作類別
```javascript
class Database {
  async saveToken(shopHandle, tokenData)        // 儲存/更新 Token
  async getToken(shopHandle)                     // 取得 Token
  async deleteToken(shopHandle)                  // 刪除 Token
  async getAllTokens()                          // 取得所有 Token
  isTokenExpired(tokenData)                     // 檢查過期狀態
}
```

## 🌐 API 端點架構

### 核心 OAuth 端點
```
GET  /oauth/install       - 啟動 OAuth 授權流程
GET  /oauth/callback      - 處理授權回調
POST /oauth/refresh       - 刷新 Access Token
GET  /oauth/status        - OAuth 系統狀態
GET  /oauth/token-status  - Token 狀態查詢
POST /oauth/revoke        - 撤銷授權
```

### 前端端點
```
GET  /                    - 前端應用主頁
GET  /health              - 系統健康檢查
GET  /api/info            - 應用程式資訊
```

### API 測試端點
```
GET  /api/test/products   - 商品 API 測試
GET  /api/test/orders     - 訂單 API 測試
```

## 🔒 安全機制

### 1. HMAC-SHA256 簽名驗證
```javascript
function verifyGetSignature(params, receivedSign, appSecret) {
  const filteredParams = Object.keys(params)
    .filter(key => key !== 'sign')
    .reduce((obj, key) => {
      obj[key] = params[key]
      return obj
    }, {})

  const sortedKeys = Object.keys(filteredParams).sort()
  const queryString = sortedKeys
    .map(key => `${key}=${filteredParams[key]}`)
    .join('&')

  const expectedSign = generateHmacSha256(queryString, appSecret)
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSign, 'hex'),
    Buffer.from(receivedSign, 'hex')
  )
}
```

### 2. 時間戳驗證
```javascript
function verifyTimestamp(requestTimestamp, toleranceMinutes = 10) {
  const currentTime = Date.now()
  const requestTime = parseInt(requestTimestamp)
  const timeDiff = Math.abs(currentTime - requestTime)
  const toleranceMs = toleranceMinutes * 60 * 1000
  
  return timeDiff <= toleranceMs
}
```

### 3. 參數驗證
```javascript
// 必要參數檢查
if (!appkey || !handle || !timestamp || !sign) {
  return res.status(400).json({ 
    error: 'Missing required parameters' 
  })
}

// App Key 驗證
if (appkey !== config.app_key) {
  return res.status(401).json({ 
    error: 'Invalid app key' 
  })
}
```

## 🎨 前端架構

### 核心 JavaScript 類別
```javascript
class ShoplineOAuthApp {
  constructor() {
    this.config = { shopHandle: 'paykepoc', appKey: '...' }
    this.tokenData = null
  }

  // 核心方法
  async loadTokenFromServer()           // 從伺服器載入 Token
  updateTokenDisplay()                  // 更新 UI 顯示
  async startOAuthFlow()               // 啟動 OAuth 流程
  async refreshToken()                 // 刷新 Token
  async revokeAuthorization()          // 撤銷授權
}
```

### UI 狀態管理
```javascript
// 授權狀態顯示
updateTokenDisplay() {
  if (this.tokenData) {
    // 顯示已授權狀態
    document.getElementById('authorizedState').classList.remove('hidden')
    // 更新 Token 資訊
    document.getElementById('accessToken').textContent = this.tokenData.accessToken
    // 啟用 API 測試按鈕
    document.getElementById('testProductsBtn').disabled = false
  } else {
    // 顯示未授權狀態
    document.getElementById('notAuthorizedState').classList.remove('hidden')
  }
}
```

## 🚀 部署架構

### 本地開發環境
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Server  │    │   ngrok Tunnel  │    │  SHOPLINE API   │
│   (localhost:3000)│◄──►│  (HTTPS 公開)   │◄──►│  (OAuth 授權)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 生產環境建議
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Server    │    │   Load Balancer │    │  SHOPLINE API   │
│   (Express.js)  │◄──►│   (HTTPS)       │◄──►│  (OAuth 授權)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   CDN/Static    │
│   (PostgreSQL)  │    │   (Frontend)    │
└─────────────────┘    └─────────────────┘
```

## 📊 資料流程

### OAuth 授權流程
```
1. 用戶點擊「開始授權」
   ↓
2. 重定向到 SHOPLINE 授權頁面
   ↓
3. 用戶在 SHOPLINE 後台授權
   ↓
4. SHOPLINE 回調到 /oauth/callback
   ↓
5. 驗證簽名和參數
   ↓
6. 請求 Access Token
   ↓
7. 儲存 Token 到資料庫
   ↓
8. 重定向到成功頁面
   ↓
9. 前端載入 Token 狀態
```

### Token 管理流程
```
1. 前端載入時檢查 Token 狀態
   ↓
2. 從資料庫讀取最新 Token
   ↓
3. 檢查 Token 是否過期
   ↓
4. 顯示相應的 UI 狀態
   ↓
5. 提供 Token 刷新和撤銷功能
```

## 🔧 關鍵依賴

### 後端依賴
```json
{
  "express": "^4.18.2",      // Web 框架
  "sqlite3": "^5.1.6",       // 資料庫
  "axios": "^1.6.0",         // HTTP 客戶端
  "cors": "^2.8.5"           // CORS 支援
}
```

### 開發依賴
```json
{
  "nodemon": "^3.0.1"        // 開發伺服器
}
```

### 外部服務
- **ngrok**: 本地 HTTPS 隧道
- **SHOPLINE API**: OAuth 授權服務

## 📝 環境變數

### 必要配置
```bash
NODE_ENV=development
PORT=3000
```

### SHOPLINE 配置
```json
{
  "app_key": "4c951e966557c8374d9a61753dfe3c52441aba3b",
  "app_secret": "dd46269d6920f49b07e810862d3093062b0fb858",
  "shop_handle": "paykepoc",
  "shop_url": "https://paykepoc.myshopline.com/",
  "ngrok_token": "32oPQ50o6TPO04LvlnvuwjLKENf_29WWsE19EN9BxG4s1ehJU"
}
```

## 🚨 錯誤處理

### 簽名驗證失敗
```javascript
if (!isValidSignature) {
  console.error('簽名驗證失敗')
  return res.status(401).json({ 
    error: 'Invalid signature' 
  })
}
```

### Token 過期處理
```javascript
if (database.isTokenExpired(tokenData)) {
  // 自動刷新 Token 或要求重新授權
  await refreshToken()
}
```

### 資料庫錯誤處理
```javascript
try {
  await database.saveToken(handle, tokenData)
} catch (dbError) {
  console.error('儲存 Token 到資料庫失敗:', dbError)
  // 即使資料庫儲存失敗，也繼續流程
}
```

## 📈 監控和日誌

### 關鍵日誌點
```javascript
console.log('✅ Token 已儲存/更新:', shopHandle)
console.log('✅ Token 已取得:', shopHandle)
console.log('✅ Token 已刪除:', shopHandle)
console.error('簽名驗證失敗')
console.error('時間戳驗證失敗')
```

### 健康檢查端點
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})
```

## 🔄 維護和擴展

### 資料庫遷移
```sql
-- 添加新欄位
ALTER TABLE oauth_tokens ADD COLUMN new_field TEXT;

-- 建立索引
CREATE INDEX idx_shop_handle ON oauth_tokens(shop_handle);
CREATE INDEX idx_expire_time ON oauth_tokens(expire_time);
```

### API 版本控制
```javascript
// 未來可添加版本控制
app.use('/api/v1', oauthRoutes)
app.use('/api/v2', oauthRoutesV2)
```

### 快取策略
```javascript
// Redis 快取 Token (生產環境)
const redis = require('redis')
const client = redis.createClient()

async function getCachedToken(shopHandle) {
  const cached = await client.get(`token:${shopHandle}`)
  return cached ? JSON.parse(cached) : null
}
```

---

## 📋 總結

本系統實現了完整的 SHOPLINE OAuth 2.0 標準流程，包含：

1. **標準 OAuth 2.0 流程** - 符合 SHOPLINE 平台規範
2. **HMAC-SHA256 簽名驗證** - 確保請求安全性
3. **資料庫持久化** - SQLite 儲存 Token 資料
4. **前端 UI 管理** - 完整的用戶界面
5. **錯誤處理機制** - 完善的異常處理
6. **本地開發環境** - ngrok 隧道支援

系統架構清晰，代碼結構良好，易於維護和擴展。
