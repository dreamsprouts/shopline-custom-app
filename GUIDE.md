# SHOPLINE Custom App OAuth 完整設置指南

## 📋 概述

本指南提供完整的 SHOPLINE Custom App OAuth 2.0 流程設置，包含簽名驗證、token 管理和本地測試環境。遵循此指南可確保一次到位完成 OAuth 流程設置。

## 🎯 目標

建立一個完整的 SHOPLINE Custom App OAuth 系統，包含：
- ✅ 完整的 OAuth 2.0 授權流程
- ✅ HMAC-SHA256 簽名生成和驗證
- ✅ Access Token 和 Refresh Token 管理
- ✅ 本地開發環境（ngrok tunnel）
- ✅ 端到端測試驗證

## 📦 前置需求

### 必要資訊
- **App Key**: `4c951e966557c8374d9a61753dfe3c52441aba3b`
- **App Secret**: `dd46269d6920f49b07e810862d3093062b0fb858`
- **Shop Handle**: `paykepoc`
- **Shop URL**: `https://paykepoc.myshopline.com/`
- **ngrok Token**: `32oPQ50o6TPO04LvlnvuwjLKENf_29WWsE19EN9BxG4s1ehJU`

### 系統需求
- Node.js 16+ 
- npm 或 yarn
- ngrok（用於本地測試）

## 🚀 一鍵設置流程

### Step 1: 建立專案結構

```bash
# 建立專案目錄
mkdir shopline-oauth-app
cd shopline-oauth-app

# 建立目錄結構
mkdir -p utils routes scripts
```

### Step 2: 建立配置檔案

**config.json**
```json
{
  "app_key": "4c951e966557c8374d9a61753dfe3c52441aba3b",
  "app_secret": "dd46269d6920f49b07e810862d3093062b0fb858",
  "shop_handle": "paykepoc",
  "shop_url": "https://paykepoc.myshopline.com/",
  "ngrok_token": "32oPQ50o6TPO04LvlnvuwjLKENf_29WWsE19EN9BxG4s1ehJU",
  "port": 3000,
  "node_env": "development"
}
```

**package.json**
```json
{
  "name": "shopline-oauth-app",
  "version": "1.0.0",
  "description": "SHOPLINE Custom App OAuth Flow",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "ngrok": "ngrok http 3000",
    "test": "node scripts/test-oauth.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Step 3: 建立簽名工具

**utils/signature.js**
```javascript
const crypto = require('crypto')

/**
 * 生成 HMAC-SHA256 簽名
 */
function generateHmacSha256(source, secret) {
  if (!source || !secret) {
    throw new Error('Source and secret must not be empty')
  }
  
  try {
    const signature = crypto
    .createHmac('sha256', secret)
    .update(source, 'utf8')
    .digest('hex')
    return signature
  } catch (error) {
    console.error('Error generating HMAC-SHA256 signature:', error)
    throw error
  }
}

/**
 * 驗證 GET 請求的簽名
 */
function verifyGetSignature(params, receivedSign, appSecret) {
  try {
    // 移除 sign 參數
  const filteredParams = Object.keys(params)
    .filter(key => key !== 'sign')
    .reduce((obj, key) => {
      obj[key] = params[key]
      return obj
    }, {})

    // 按字母順序排序
  const sortedKeys = Object.keys(filteredParams).sort()
    
    // 建立查詢字串
  const queryString = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
    .join('&')

    // 計算預期簽名
  const expectedSign = generateHmacSha256(queryString, appSecret)
  
    // 使用 crypto.timingSafeEqual 進行安全比較
  return crypto.timingSafeEqual(
    Buffer.from(expectedSign, 'hex'),
    Buffer.from(receivedSign, 'hex')
  )
  } catch (error) {
    console.error('Error verifying GET signature:', error)
    return false
  }
}

/**
 * 驗證 POST 請求的簽名
 */
function verifyPostSignature(body, timestamp, receivedSign, appSecret) {
  try {
  const source = body + timestamp
  const expectedSign = generateHmacSha256(source, appSecret)
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSign, 'hex'),
    Buffer.from(receivedSign, 'hex')
  )
  } catch (error) {
    console.error('Error verifying POST signature:', error)
    return false
  }
}

/**
 * 驗證時間戳
 */
function verifyTimestamp(requestTimestamp, toleranceMinutes = 10) {
  try {
  const currentTime = Date.now()
  const requestTime = parseInt(requestTimestamp)
  const timeDiff = Math.abs(currentTime - requestTime)
  const toleranceMs = toleranceMinutes * 60 * 1000
  
  return timeDiff <= toleranceMs
  } catch (error) {
    console.error('Error verifying timestamp:', error)
    return false
  }
}

/**
 * 為 GET 請求生成簽名
 */
function signGetRequest(params, appSecret) {
  const sortedKeys = Object.keys(params).sort()
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&')
  return generateHmacSha256(queryString, appSecret)
}

/**
 * 為 POST 請求生成簽名
 */
function signPostRequest(body, timestamp, appSecret) {
  const source = body + timestamp
  return generateHmacSha256(source, appSecret)
}

module.exports = {
  generateHmacSha256,
  verifyGetSignature,
  verifyPostSignature,
  verifyTimestamp,
  signGetRequest,
  signPostRequest
}
```

### Step 4: 建立 OAuth 路由

**routes/oauth.js**
```javascript
const express = require('express')
const axios = require('axios')
const { 
  verifyGetSignature, 
  verifyPostSignature, 
  verifyTimestamp,
  signPostRequest 
} = require('../utils/signature')
const config = require('../config.json')

const router = express.Router()

/**
 * Step 1: 驗證應用安裝請求
 */
router.get('/install', async (req, res) => {
  try {
    console.log('收到安裝請求:', req.query)
    
    const { appkey, handle, timestamp, sign, lang } = req.query
    
    // 驗證必要參數
    if (!appkey || !handle || !timestamp || !sign) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      })
    }
    
    // 驗證簽名
    const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
    if (!isValidSignature) {
      console.error('簽名驗證失敗')
      return res.status(401).json({ 
        error: 'Invalid signature' 
      })
    }
    
    // 驗證時間戳
    const isValidTimestamp = verifyTimestamp(timestamp)
    if (!isValidTimestamp) {
      console.error('時間戳驗證失敗')
      return res.status(401).json({ 
        error: 'Request expired' 
      })
    }
    
    // 驗證 app key
    if (appkey !== config.app_key) {
      console.error('App key 不匹配')
      return res.status(401).json({ 
        error: 'Invalid app key' 
      })
    }
    
    console.log('安裝請求驗證成功')
    
    // 重導向到授權頁面
    const scope = 'read_products,read_orders'
    const redirectUri = `${req.protocol}://${req.get('host')}/oauth/callback`
    const authUrl = `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${config.app_key}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(redirectUri)}`
    
    console.log('重導向到授權頁面:', authUrl)
    res.redirect(authUrl)
    
  } catch (error) {
    console.error('安裝請求處理錯誤:', error)
    res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
})

/**
 * Step 3: 接收授權碼
 */
router.get('/callback', async (req, res) => {
  try {
    console.log('收到授權回調:', req.query)
    
    const { appkey, code, handle, timestamp, sign, customField } = req.query
    
    // 驗證必要參數
    if (!appkey || !code || !handle || !timestamp || !sign) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      })
    }
    
    // 驗證簽名
    const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
    if (!isValidSignature) {
      console.error('回調簽名驗證失敗')
      return res.status(401).json({ 
        error: 'Invalid signature' 
      })
    }
    
    // 驗證時間戳
    const isValidTimestamp = verifyTimestamp(timestamp)
    if (!isValidTimestamp) {
      console.error('回調時間戳驗證失敗')
      return res.status(401).json({ 
        error: 'Request expired' 
      })
    }
    
    // 驗證 app key
    if (appkey !== config.app_key) {
      console.error('回調 App key 不匹配')
      return res.status(401).json({ 
        error: 'Invalid app key' 
      })
    }
    
    console.log('授權碼驗證成功:', code)
    
    // 使用授權碼請求 access token
    try {
      const tokenResponse = await requestAccessToken(code, handle)
      
      if (tokenResponse.success) {
        console.log('Access token 獲取成功')
        res.json({
          success: true,
          message: 'OAuth 流程完成',
          data: tokenResponse.data
        })
      } else {
        console.error('Access token 獲取失敗:', tokenResponse.error)
        res.status(500).json({
          success: false,
          error: tokenResponse.error
        })
      }
    } catch (tokenError) {
      console.error('Token 請求錯誤:', tokenError)
      res.status(500).json({
        success: false,
        error: 'Failed to get access token'
      })
    }
    
  } catch (error) {
    console.error('授權回調處理錯誤:', error)
    res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
})

/**
 * Step 4: 請求 Access Token
 */
async function requestAccessToken(authorizationCode, handle) {
  try {
    const timestamp = Date.now().toString()
    const body = JSON.stringify({ code: authorizationCode })
    const sign = signPostRequest(body, timestamp, config.app_secret)
    
    const response = await axios.post(
      `https://${handle}.myshopline.com/admin/oauth/token/create`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'appkey': config.app_key,
          'timestamp': timestamp,
          'sign': sign
        }
      }
    )
    
    if (response.data.code === 200) {
      return {
        success: true,
        data: response.data.data
      }
    } else {
      return {
        success: false,
        error: response.data.message || 'Token request failed'
      }
    }
  } catch (error) {
    console.error('Token 請求錯誤:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}

/**
 * Step 6: 刷新 Access Token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { handle } = req.body
    
    if (!handle) {
      return res.status(400).json({ 
        error: 'Missing handle parameter' 
      })
    }
    
    const timestamp = Date.now().toString()
    const body = JSON.stringify({})
    const sign = signPostRequest(body, timestamp, config.app_secret)
    
    const response = await axios.post(
      `https://${handle}.myshopline.com/admin/oauth/token/refresh`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'appkey': config.app_key,
          'timestamp': timestamp,
          'sign': sign
        }
      }
    )
    
    if (response.data.code === 200) {
      res.json({
        success: true,
        data: response.data.data
      })
    } else {
      res.status(500).json({
        success: false,
        error: response.data.message || 'Token refresh failed'
      })
    }
    
  } catch (error) {
    console.error('Token 刷新錯誤:', error.response?.data || error.message)
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    })
  }
})

/**
 * 測試端點
 */
router.get('/status', (req, res) => {
    res.json({
    status: 'running',
    app_key: config.app_key,
    shop_handle: config.shop_handle,
    timestamp: new Date().toISOString()
  })
})

module.exports = router
```

### Step 5: 建立主伺服器

**server.js**
```javascript
const express = require('express')
const cors = require('cors')
const config = require('./config.json')
const oauthRoutes = require('./routes/oauth')

const app = express()
const PORT = config.port || 3000

// 中介軟體設定
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 請求日誌中介軟體
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (Object.keys(req.query).length > 0) {
    console.log('Query params:', req.query)
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body)
  }
  next()
})

// 路由設定
app.use('/oauth', oauthRoutes)

// 根路徑
app.get('/', (req, res) => {
  res.json({
    message: 'SHOPLINE OAuth App 運行中',
    version: '1.0.0',
    endpoints: {
      install: '/oauth/install',
      callback: '/oauth/callback',
      refresh: '/oauth/refresh',
      status: '/oauth/status'
    },
    config: {
      app_key: config.app_key,
      shop_handle: config.shop_handle,
      shop_url: config.shop_url
    }
  })
})

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 錯誤處理中介軟體
app.use((err, req, res, next) => {
  console.error('伺服器錯誤:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  })
})

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`🚀 SHOPLINE OAuth App 已啟動`)
  console.log(`📍 本地伺服器: http://localhost:${PORT}`)
  console.log(`🔧 環境: ${config.node_env}`)
  console.log(`🏪 商店: ${config.shop_handle}`)
  console.log(`🔑 App Key: ${config.app_key}`)
  console.log('')
  console.log('📋 可用端點:')
  console.log(`   GET  /                    - 應用狀態`)
  console.log(`   GET  /health              - 健康檢查`)
  console.log(`   GET  /oauth/install       - 應用安裝端點`)
  console.log(`   GET  /oauth/callback      - OAuth 回調端點`)
  console.log(`   POST /oauth/refresh       - Token 刷新端點`)
  console.log(`   GET  /oauth/status        - OAuth 狀態`)
  console.log('')
  console.log('🔗 測試 OAuth 流程:')
  console.log(`   1. 啟動 ngrok: ngrok http ${PORT}`)
  console.log(`   2. 更新 SHOPLINE Developer Center 設定`)
  console.log(`   3. 訪問: https://paykepoc.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${config.app_key}&responseType=code&scope=read_products,read_orders&redirectUri=<ngrok-url>/oauth/callback`)
})

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在關閉伺服器...')
  process.exit(0)
})
```

### Step 6: 建立測試腳本

**scripts/test-oauth.js**
```javascript
const axios = require('axios')
const { generateHmacSha256, signGetRequest } = require('../utils/signature')
const config = require('../config.json')

/**
 * 測試 OAuth 流程的完整腳本
 */
async function testOAuthFlow() {
  console.log('🧪 開始測試 OAuth 流程...')
  
  try {
    // 測試 1: 檢查應用狀態
    console.log('\n1️⃣ 測試應用狀態端點')
    const statusResponse = await axios.get('http://localhost:3000/oauth/status')
    console.log('✅ 應用狀態:', statusResponse.data)
    
    // 測試 2: 模擬 SHOPLINE 安裝請求
    console.log('\n2️⃣ 模擬 SHOPLINE 安裝請求')
    const timestamp = Date.now().toString()
    const handle = config.shop_handle
    const lang = 'zh-hant-tw'
    
    const installParams = {
      appkey: config.app_key,
      handle: handle,
      timestamp: timestamp,
      lang: lang
    }
    
    // 生成簽名
    const sign = signGetRequest(installParams, config.app_secret)
    installParams.sign = sign
    
    console.log('📤 發送安裝請求參數:', installParams)
    
    // 發送請求到安裝端點
    const installResponse = await axios.get('http://localhost:3000/oauth/install', {
      params: installParams,
      maxRedirects: 0,
      validateStatus: (status) => status < 400
    })
    
    console.log('✅ 安裝請求回應狀態:', installResponse.status)
    console.log('📍 重導向位置:', installResponse.headers.location)
    
    // 測試 3: 驗證簽名生成
    console.log('\n3️⃣ 測試簽名生成和驗證')
    const testSource = 'appkey=test&handle=test&timestamp=1234567890'
    const testSignature = generateHmacSha256(testSource, config.app_secret)
    console.log('✅ 測試簽名生成成功:', testSignature)
    
    // 測試 4: 檢查健康狀態
    console.log('\n4️⃣ 測試健康檢查端點')
    const healthResponse = await axios.get('http://localhost:3000/health')
    console.log('✅ 健康狀態:', healthResponse.data)
    
    console.log('\n🎉 所有測試完成！')
    console.log('\n📋 下一步:')
    console.log('1. 啟動 ngrok: node scripts/start-ngrok.js')
    console.log('2. 更新 SHOPLINE Developer Center 設定')
    console.log('3. 測試完整的 OAuth 流程')
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
    if (error.response) {
      console.error('回應狀態:', error.response.status)
      console.error('回應資料:', error.response.data)
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  testOAuthFlow().catch(console.error)
}

module.exports = { testOAuthFlow }
```

**scripts/start-ngrok.js**
```javascript
const { spawn } = require('child_process')
const axios = require('axios')

/**
 * 啟動 ngrok 並取得公開 URL
 */
async function startNgrok() {
  console.log('🚀 啟動 ngrok tunnel...')
  
  // 設定 ngrok token
  const ngrokProcess = spawn('ngrok', ['http', '3000', '--log', 'stdout'], {
    stdio: ['pipe', 'pipe', 'pipe']
  })
  
  let ngrokUrl = null
  
  ngrokProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log('ngrok:', output)
    
    // 解析 ngrok URL
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/)
    if (urlMatch && !ngrokUrl) {
      ngrokUrl = urlMatch[0]
      console.log('✅ ngrok URL 已取得:', ngrokUrl)
      updateShoplineConfig(ngrokUrl)
    }
  })
  
  ngrokProcess.stderr.on('data', (data) => {
    console.error('ngrok 錯誤:', data.toString())
  })
  
  ngrokProcess.on('close', (code) => {
    console.log(`ngrok 程序結束，代碼: ${code}`)
  })
  
  // 等待 ngrok 啟動
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // 如果沒有從 stdout 取得 URL，嘗試從 API 取得
  if (!ngrokUrl) {
    try {
      const response = await axios.get('http://localhost:4040/api/tunnels')
      const tunnels = response.data.tunnels
      if (tunnels && tunnels.length > 0) {
        ngrokUrl = tunnels[0].public_url
        console.log('✅ 從 API 取得 ngrok URL:', ngrokUrl)
        updateShoplineConfig(ngrokUrl)
      }
    } catch (error) {
      console.error('無法從 ngrok API 取得 URL:', error.message)
    }
  }
  
  return ngrokUrl
}

/**
 * 更新 SHOPLINE 設定資訊
 */
function updateShoplineConfig(ngrokUrl) {
  console.log('')
  console.log('📋 SHOPLINE Developer Center 設定:')
  console.log('='.repeat(50))
  console.log(`App URL: ${ngrokUrl}/oauth/install`)
  console.log(`Callback URL: ${ngrokUrl}/oauth/callback`)
  console.log('')
  console.log('🔗 測試 OAuth 流程:')
  console.log('='.repeat(50))
  console.log(`1. 在 SHOPLINE Developer Center 更新上述 URL`)
  console.log(`2. 訪問: https://paykepoc.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=4c951e966557c8374d9a61753dfe3c52441aba3b&responseType=code&scope=read_products,read_orders&redirectUri=${encodeURIComponent(ngrokUrl + '/oauth/callback')}`)
  console.log('')
  console.log('📊 監控端點:')
  console.log('='.repeat(50))
  console.log(`應用狀態: ${ngrokUrl}/oauth/status`)
  console.log(`健康檢查: ${ngrokUrl}/health`)
  console.log('')
}

// 如果直接執行此腳本
if (require.main === module) {
  startNgrok().catch(console.error)
}

module.exports = { startNgrok }
```

## 🚀 一鍵執行流程

### 完整設置指令

```bash
# 1. 安裝依賴
npm install

# 2. 啟動應用
npm start

# 3. 在另一個終端啟動 ngrok
npm run ngrok

# 4. 執行測試
npm test
```

### 驗證步驟

1. **檢查應用狀態**
   ```bash
   curl http://localhost:3000/oauth/status
   ```

2. **檢查健康狀態**
   ```bash
   curl http://localhost:3000/health
   ```

3. **執行完整測試**
```bash
   node scripts/test-oauth.js
   ```

## 📋 SHOPLINE Developer Center 設定

當 ngrok 啟動後，會顯示類似以下的設定資訊：

```
📋 SHOPLINE Developer Center 設定:
==================================================
App URL: https://e13b719cbfa5.ngrok-free.app/oauth/install
Callback URL: https://e13b719cbfa5.ngrok-free.app/oauth/callback
```

**在 SHOPLINE Developer Center 更新這些 URL**

## 🧪 測試 OAuth 流程

### 手動測試 URL

```
https://paykepoc.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=4c951e966557c8374d9a61753dfe3c52441aba3b&responseType=code&scope=read_products,read_orders&redirectUri=https%3A%2F%2Fe13b719cbfa5.ngrok-free.app%2Foauth%2Fcallback
```

### 預期結果

成功完成 OAuth 流程後，會收到類似以下的回應：

```json
{
  "success": true,
  "message": "OAuth 流程完成",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "expireTime": "2025-10-20T14:12:52.599+00:00",
    "refreshToken": "473d0e788a6eecc43e87e5f7d5680545dc8aa779",
    "refreshExpireTime": "2099-12-30T16:00:00.000+00:00",
    "scope": "read_products,read_orders"
  }
}
```

## 🔧 故障排除

### 常見問題

1. **端口衝突**
   ```bash
   # 檢查端口使用情況
   lsof -ti:3000
   
   # 停止現有程序
   kill -9 $(lsof -ti:3000)
   ```

2. **ngrok 連線問題**
   ```bash
   # 檢查 ngrok 狀態
   curl http://localhost:4040/api/tunnels
   ```

3. **簽名驗證失敗**
   - 檢查 app_secret 是否正確
   - 確認參數排序是否按字母順序
   - 驗證時間戳是否在允許範圍內

## 📊 監控端點

- **應用狀態**: `https://your-ngrok-url.ngrok-free.app/oauth/status`
- **健康檢查**: `https://your-ngrok-url.ngrok-free.app/health`
- **ngrok 儀表板**: `http://localhost:4040`

## 🎯 成功指標

✅ **應用正常啟動** - 伺服器在端口 3000 運行  
✅ **ngrok tunnel 建立** - 獲得公開 HTTPS URL  
✅ **簽名驗證通過** - HMAC-SHA256 驗證成功  
✅ **OAuth 流程完成** - 成功獲取 Access Token  
✅ **API 呼叫準備就緒** - 可以使用 Access Token 呼叫 SHOPLINE APIs  

## 📝 注意事項

1. **安全性**: 妥善保管 app_secret，不要提交到版本控制
2. **時間戳**: 確保系統時間同步，避免時間戳驗證失敗
3. **ngrok 限制**: 免費版 ngrok 每次重啟會更換 URL
4. **Token 管理**: Access Token 有效期 10 小時，需要定期刷新

## 🎉 完成確認

當您看到以下回應時，表示 OAuth 流程設置完全成功：

```json
{
  "success": true,
  "message": "OAuth 流程完成",
  "data": {
    "accessToken": "...",
    "expireTime": "...",
    "scope": "read_products,read_orders"
  }
}
```

此時您已經可以開始使用 Access Token 呼叫 SHOPLINE 的 Admin APIs 了！