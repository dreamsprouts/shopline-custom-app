# SHOPLINE OAuth API 文件

## 📋 API 概述

本系統提供完整的 SHOPLINE OAuth 2.0 授權流程 API，包含前端界面、後端服務和資料庫操作。

**Base URL**: `http://localhost:3000` (開發環境)  
**Content-Type**: `application/json`  
**Authentication**: HMAC-SHA256 簽名驗證

## 🔐 OAuth 授權端點

### 1. 啟動 OAuth 授權流程
**端點**: `GET /oauth/install`

**描述**: 啟動 SHOPLINE OAuth 2.0 授權流程，重導向到 SHOPLINE 授權頁面。

**請求參數**:
```javascript
{
  appkey: string,      // 應用程式金鑰 (必要)
  handle: string,      // 商店識別碼 (必要)
  timestamp: string,    // 時間戳 (必要)
  sign: string,        // HMAC-SHA256 簽名 (必要)
  lang: string         // 語言設定 (可選，預設: zh-hant-tw)
}
```

**回應**:
- **成功**: 重導向到 SHOPLINE 授權頁面
- **失敗**: JSON 錯誤訊息

**範例**:
```bash
curl "http://localhost:3000/oauth/install?appkey=4c951e966557c8374d9a61753dfe3c52441aba3b&handle=paykepoc&timestamp=1760950627830&sign=ee9aa3ae58a2436850760d1600281c0f810a72430366de50979f0719d2c3cf67"
```

### 2. OAuth 授權回調
**端點**: `GET /oauth/callback`

**描述**: 接收 SHOPLINE 授權回調，處理授權碼並獲取 Access Token。

**請求參數**:
```javascript
{
  appkey: string,      // 應用程式金鑰 (必要)
  code: string,        // 授權碼 (必要)
  handle: string,      // 商店識別碼 (必要)
  timestamp: string,    // 時間戳 (必要)
  sign: string,        // HMAC-SHA256 簽名 (必要)
  lang: string,        // 語言設定 (可選)
  customField: string  // 自定義欄位 (可選)
}
```

**回應**:
- **成功**: 重導向到成功頁面 `/views/callback.html`
- **失敗**: JSON 錯誤訊息

**範例**:
```bash
curl "http://localhost:3000/oauth/callback?appkey=4c951e966557c8374d9a61753dfe3c52441aba3b&code=sg40c4e7a74a255d2aa417dcdea26a78efbbb41cbd&handle=paykepoc&timestamp=1760950627830&sign=ee9aa3ae58a2436850760d1600281c0f810a72430366de50979f0719d2c3cf67"
```

### 3. 刷新 Access Token
**端點**: `POST /oauth/refresh`

**描述**: 使用 Refresh Token 刷新 Access Token。

**請求主體**:
```javascript
{
  handle: string       // 商店識別碼 (必要)
}
```

**回應**:
```javascript
{
  success: boolean,
  data?: {
    accessToken: string,
    expireTime: string,
    refreshToken: string,
    refreshExpireTime: string,
    scope: string
  },
  error?: string
}
```

**範例**:
```bash
curl -X POST "http://localhost:3000/oauth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"handle": "paykepoc"}'
```

### 4. 撤銷授權
**端點**: `POST /oauth/revoke`

**描述**: 撤銷 OAuth 授權，刪除所有相關 Token 資料。

**請求主體**:
```javascript
{
  handle: string       // 商店識別碼 (必要)
}
```

**回應**:
```javascript
{
  success: boolean,
  message: string
}
```

**範例**:
```bash
curl -X POST "http://localhost:3000/oauth/revoke" \
  -H "Content-Type: application/json" \
  -d '{"handle": "paykepoc"}'
```

## 📊 狀態查詢端點

### 5. OAuth 系統狀態
**端點**: `GET /oauth/status`

**描述**: 查詢 OAuth 系統整體狀態。

**回應**:
```javascript
{
  success: boolean,
  status: string,      // "active" | "inactive"
  message: string,
  timestamp: string
}
```

**範例**:
```bash
curl "http://localhost:3000/oauth/status"
```

### 6. Token 狀態查詢
**端點**: `GET /oauth/token-status`

**描述**: 查詢特定商店的 Token 狀態。

**請求參數**:
```javascript
{
  handle: string       // 商店識別碼 (可選，預設使用配置中的值)
}
```

**回應**:
```javascript
{
  success: boolean,
  token?: {
    shop_handle: string,
    access_token: string,
    refresh_token: string,
    expire_time: string,
    refresh_expire_time: string,
    scope: string,
    created_at: string,
    updated_at: string
  },
  message?: string
}
```

**範例**:
```bash
curl "http://localhost:3000/oauth/token-status?handle=paykepoc"
```

## 🌐 前端端點

### 7. 前端應用主頁
**端點**: `GET /`

**描述**: 提供前端應用主頁，包含 OAuth 授權界面和 Token 管理功能。

**回應**: HTML 頁面

**範例**:
```bash
curl "http://localhost:3000/"
```

### 8. OAuth 授權成功頁面
**端點**: `GET /views/callback.html`

**描述**: OAuth 授權成功後的重導向頁面，顯示授權詳情。

**請求參數**:
```javascript
{
  handle: string       // 商店識別碼 (必要)
}
```

**回應**: HTML 頁面

**範例**:
```bash
curl "http://localhost:3000/views/callback.html?handle=paykepoc"
```

## 🔍 系統端點

### 9. 健康檢查
**端點**: `GET /health`

**描述**: 系統健康檢查端點。

**回應**:
```javascript
{
  status: "healthy",
  timestamp: string,
  uptime: number,
  memory: {
    rss: number,
    heapTotal: number,
    heapUsed: number,
    external: number
  }
}
```

**範例**:
```bash
curl "http://localhost:3000/health"
```

### 10. 應用程式資訊
**端點**: `GET /api/info`

**描述**: 取得應用程式基本資訊。

**回應**:
```javascript
{
  name: string,
  version: string,
  description: string,
  environment: string,
  timestamp: string
}
```

**範例**:
```bash
curl "http://localhost:3000/api/info"
```

## 🧪 API 測試端點

### 11. 商店 API 測試
**端點**: `GET /api/test/shop`

**狀態**: ✅ 已驗證

**描述**: 測試 SHOPLINE 商店資訊 API，需 `read_store_information`。

**請求標頭**:
```
Authorization: Bearer <access_token>
```

**回應**:
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

**範例**:
```bash
curl -H "Authorization: Bearer <access_token>" "http://localhost:3000/api/test/shop"
```

### 12. 檢視商品 API 測試
**端點**: `GET /api/test/products`

**狀態**: ✅ 已驗證

**描述**: 測試 SHOPLINE 商品 API 連線，需 `read_products`。

**請求標頭**:
```
Authorization: Bearer <access_token>
```

**回應**:
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

**範例**:
```bash
curl -H "Authorization: Bearer <access_token>" "http://localhost:3000/api/test/products"
```

### 13. 訂單 API 測試（預留）
**端點**: `GET /api/test/orders`

**狀態**: ⏸️ 下一個 Sprint 規劃

**描述**: 測試 SHOPLINE 訂單 API 連線；需準備顧客/商品資料與對應 scope。

**請求標頭**:
```
Authorization: Bearer <access_token>
```

**回應**:
```javascript
{
  success: boolean,
  data?: any,
  error?: string
}
```

**範例**:
```bash
curl -H "Authorization: Bearer <access_token>" "http://localhost:3000/api/test/orders"
```

## 🔒 安全機制

### HMAC-SHA256 簽名驗證

所有 OAuth 相關端點都需要 HMAC-SHA256 簽名驗證：

**GET 請求簽名**:
```javascript
// 1. 按字母順序排序參數
const sortedKeys = Object.keys(params).sort()

// 2. 建立查詢字串
const queryString = sortedKeys
  .map(key => `${key}=${params[key]}`)
  .join('&')

// 3. 生成 HMAC-SHA256 簽名
const sign = crypto
  .createHmac('sha256', appSecret)
  .update(queryString, 'utf8')
  .digest('hex')
```

**POST 請求簽名**:
```javascript
// 1. 建立簽名源字串
const source = body + timestamp

// 2. 生成 HMAC-SHA256 簽名
const sign = crypto
  .createHmac('sha256', appSecret)
  .update(source, 'utf8')
  .digest('hex')
```

### 時間戳驗證

所有請求都必須包含有效的時間戳：

```javascript
// 時間戳容差: 10分鐘
const toleranceMinutes = 10
const currentTime = Date.now()
const requestTime = parseInt(timestamp)
const timeDiff = Math.abs(currentTime - requestTime)
const toleranceMs = toleranceMinutes * 60 * 1000

const isValid = timeDiff <= toleranceMs
```

## 📝 錯誤處理

### 標準錯誤回應格式

```javascript
{
  success: false,
  error: string,        // 錯誤訊息
  code?: number,        // 錯誤代碼
  timestamp: string     // 錯誤時間戳
}
```

### 常見錯誤代碼

| 代碼 | 訊息 | 描述 |
|------|------|------|
| 400 | Missing required parameters | 缺少必要參數 |
| 401 | Invalid signature | 簽名驗證失敗 |
| 401 | Request expired | 請求已過期 |
| 401 | Invalid app key | 無效的應用程式金鑰 |
| 500 | Internal server error | 內部伺服器錯誤 |

## 📊 回應範例

### 成功回應
```javascript
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "expireTime": "2025-10-20T18:23:48.725+00:00",
    "refreshToken": "8778ef4e3982b74f9b3ecf7191ffbdb799d46966",
    "refreshExpireTime": "2099-12-30T16:00:00.000+00:00",
    "scope": "read_products,read_orders"
  }
}
```

### 錯誤回應
```javascript
{
  "success": false,
  "error": "Invalid signature",
  "code": 401,
  "timestamp": "2025-10-20T09:00:00.000Z"
}
```

## 🔧 開發工具

### 測試腳本
```bash
# 執行 OAuth 流程測試
npm run test

# 啟動 ngrok 隧道
npm run ngrok

# 開發模式啟動
npm run dev
```

### 日誌查看
```bash
# 查看應用日誌
tail -f logs/combined.log

# 查看錯誤日誌
tail -f logs/error.log
```

## 📊 Event Monitor Dashboard API

### 1. 獲取歷史事件
**端點**: `GET /api/event-monitor/events`

**描述**: 獲取最近 100 筆歷史事件和統計資訊。

**回應**:
```javascript
{
  "success": true,
  "events": [
    {
      "id": "string",
      "type": "string",
      "timestamp": "2025-10-27T11:02:12.278Z",
      "payload": {},
      "metadata": {}
    }
  ],
  "stats": {
    "total_events": 105,
    "last_event_time": "2025-10-27T11:02:12.278Z"
  }
}
```

### 2. SSE 事件流
**端點**: `GET /api/event-monitor/stream`

**描述**: 建立 Server-Sent Events 連接，即時接收事件推送。

**請求頭**:
```
Accept: text/event-stream
Cache-Control: no-cache
```

**回應格式**:
```
data: {"id":"string","type":"string","timestamp":"2025-10-27T11:02:12.278Z","payload":{}}

```

### 3. 發布測試事件
**端點**: `POST /api/event-monitor/test-simple`

**描述**: 發布一個簡單的測試事件到 Event Bus。

**回應**:
```javascript
{
  "success": true,
  "message": "Test event published successfully",
  "event": {
    "id": "string",
    "type": "product.updated",
    "timestamp": "2025-10-27T11:02:12.278Z"
  }
}
```

### 4. Event Monitor Dashboard 頁面
**端點**: `GET /event-monitor`

**描述**: 返回 Event Monitor Dashboard 前端頁面。

**回應**: HTML 頁面

---

## 📋 總結

本 API 文件涵蓋了 SHOPLINE OAuth 系統的已實現端點，包括：

### ✅ 已實現功能
1. **OAuth 授權流程** - 完整的 4 步驟流程
2. **狀態查詢** - 系統和 Token 狀態
3. **前端界面** - 用戶友好的 Web 界面
4. **系統監控** - 健康檢查和資訊查詢
5. **安全機制** - HMAC-SHA256 簽名驗證
6. **錯誤處理** - 標準化的錯誤回應
7. **Event Monitor Dashboard** - 事件監控和測試工具

### ⚠️ 需要測試的功能
1. **API 測試** - 商品和訂單 API 測試 (端點已實現但未驗證)

**注意**: 目前只驗證了 OAuth 授權流程和基本的前端界面。商品和訂單 API 測試端點已實現但需要實際測試驗證。
