# SHOPLINE OAuth 標準代碼片段

## 🔐 核心簽名算法 (SHOPLINE 標準)

### HMAC-SHA256 簽名生成
```javascript
const crypto = require('crypto')

/**
 * 生成 HMAC-SHA256 簽名 (SHOPLINE 標準)
 * @param {string} source - 簽名源字串
 * @param {string} secret - 應用程式密鑰
 * @returns {string} 十六進位簽名
 */
function generateHmacSha256(source, secret) {
  if (!source || !secret) {
    throw new Error('Source and secret must not be empty')
  }
  
  return crypto
    .createHmac('sha256', secret)
    .update(source, 'utf8')
    .digest('hex')
}
```

### GET 請求簽名 (SHOPLINE 標準)
```javascript
/**
 * 為 GET 請求生成簽名 (SHOPLINE 標準格式)
 * @param {Object} params - 請求參數
 * @param {string} appSecret - 應用程式密鑰
 * @returns {string} 簽名字串
 */
function signGetRequest(params, appSecret) {
  // 1. 按字母順序排序參數
  const sortedKeys = Object.keys(params).sort()
  
  // 2. 建立查詢字串
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  // 3. 生成 HMAC-SHA256 簽名
  return generateHmacSha256(queryString, appSecret)
}
```

### POST 請求簽名 (SHOPLINE 標準)
```javascript
/**
 * 為 POST 請求生成簽名 (SHOPLINE 標準格式)
 * @param {string} body - 請求主體
 * @param {string} timestamp - 時間戳
 * @param {string} appSecret - 應用程式密鑰
 * @returns {string} 簽名字串
 */
function signPostRequest(body, timestamp, appSecret) {
  // SHOPLINE 標準: body + timestamp
  const source = body + timestamp
  return generateHmacSha256(source, appSecret)
}
```

## 🔍 簽名驗證 (SHOPLINE 標準)

### GET 請求簽名驗證
```javascript
/**
 * 驗證 GET 請求的簽名 (SHOPLINE 標準)
 * @param {Object} params - 請求參數
 * @param {string} receivedSign - 接收到的簽名
 * @param {string} appSecret - 應用程式密鑰
 * @returns {boolean} 驗證結果
 */
function verifyGetSignature(params, receivedSign, appSecret) {
  try {
    // 1. 移除 sign 參數
    const filteredParams = Object.keys(params)
      .filter(key => key !== 'sign')
      .reduce((obj, key) => {
        obj[key] = params[key]
        return obj
      }, {})

    // 2. 按字母順序排序
    const sortedKeys = Object.keys(filteredParams).sort()
    
    // 3. 建立查詢字串
    const queryString = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
      .join('&')

    // 4. 計算預期簽名
    const expectedSign = generateHmacSha256(queryString, appSecret)
    
    // 5. 使用 timingSafeEqual 進行安全比較
    return crypto.timingSafeEqual(
      Buffer.from(expectedSign, 'hex'),
      Buffer.from(receivedSign, 'hex')
    )
  } catch (error) {
    console.error('Error verifying GET signature:', error)
    return false
  }
}
```

### POST 請求簽名驗證
```javascript
/**
 * 驗證 POST 請求的簽名 (SHOPLINE 標準)
 * @param {string} body - 請求主體
 * @param {string} timestamp - 時間戳
 * @param {string} receivedSign - 接收到的簽名
 * @param {string} appSecret - 應用程式密鑰
 * @returns {boolean} 驗證結果
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
```

## ⏰ 時間戳驗證 (SHOPLINE 標準)

```javascript
/**
 * 驗證時間戳 (SHOPLINE 標準: 10分鐘容差)
 * @param {string} requestTimestamp - 請求時間戳
 * @param {number} toleranceMinutes - 容差分鐘數 (預設10分鐘)
 * @returns {boolean} 驗證結果
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
```

## 🔄 OAuth 授權流程 (SHOPLINE 標準)

### 1. 授權請求端點
```javascript
/**
 * Step 1: 驗證應用安裝請求 (SHOPLINE 標準)
 */
router.get('/install', async (req, res) => {
  try {
    const { appkey, handle, timestamp, sign, lang } = req.query
    
    // 1. 驗證必要參數
    if (!appkey || !handle || !timestamp || !sign) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      })
    }
    
    // 2. 驗證簽名 (SHOPLINE 標準)
    const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
    if (!isValidSignature) {
      return res.status(401).json({ 
        error: 'Invalid signature' 
      })
    }
    
    // 3. 驗證時間戳 (SHOPLINE 標準)
    const isValidTimestamp = verifyTimestamp(timestamp)
    if (!isValidTimestamp) {
      return res.status(401).json({ 
        error: 'Request expired' 
      })
    }
    
    // 4. 驗證 app key
    if (appkey !== config.app_key) {
      return res.status(401).json({ 
        error: 'Invalid app key' 
      })
    }
    
    // 5. 重導向到 SHOPLINE 授權頁面
    const scope = 'read_products,read_orders'
    const redirectUri = `${req.protocol}://${req.get('host')}/oauth/callback`
    const authUrl = `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${config.app_key}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(redirectUri)}`
    
    res.redirect(authUrl)
    
  } catch (error) {
    console.error('安裝請求處理錯誤:', error)
    res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
})
```

### 2. 授權回調端點
```javascript
/**
 * Step 2: 接收授權碼 (SHOPLINE 標準)
 */
router.get('/callback', async (req, res) => {
  try {
    const { appkey, code, handle, timestamp, sign, customField } = req.query
    
    // 1. 驗證必要參數
    if (!appkey || !code || !handle || !timestamp || !sign) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      })
    }
    
    // 2. 驗證簽名 (SHOPLINE 標準)
    const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
    if (!isValidSignature) {
      return res.status(401).json({ 
        error: 'Invalid signature' 
      })
    }
    
    // 3. 驗證時間戳 (SHOPLINE 標準)
    const isValidTimestamp = verifyTimestamp(timestamp)
    if (!isValidTimestamp) {
      return res.status(401).json({ 
        error: 'Request expired' 
      })
    }
    
    // 4. 驗證 app key
    if (appkey !== config.app_key) {
      return res.status(401).json({ 
        error: 'Invalid app key' 
      })
    }
    
    // 5. 使用授權碼請求 access token
    const tokenResponse = await requestAccessToken(code, handle)
    
    if (tokenResponse.success) {
      // 儲存 token 到資料庫
      await database.saveToken(handle, tokenResponse.data)
      
      // 重導向到成功頁面
      res.redirect(`/views/callback.html?handle=${handle}`)
    } else {
      res.status(500).json({
        success: false,
        error: tokenResponse.error
      })
    }
    
  } catch (error) {
    console.error('授權回調處理錯誤:', error)
    res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
})
```

### 3. Access Token 請求 (SHOPLINE API)
```javascript
/**
 * 請求 Access Token (SHOPLINE API 標準)
 * @param {string} authorizationCode - 授權碼
 * @param {string} handle - 商店識別碼
 * @returns {Object} Token 回應
 */
async function requestAccessToken(authorizationCode, handle) {
  try {
    const timestamp = Date.now().toString()
    const body = JSON.stringify({ code: authorizationCode })
    const sign = signPostRequest(body, timestamp, config.app_secret)
    
    // SHOPLINE API 請求 (標準格式)
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
```

### 4. Token 刷新 (SHOPLINE API)
```javascript
/**
 * 刷新 Access Token (SHOPLINE API 標準)
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
    
    // SHOPLINE API 請求 (標準格式)
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
      // 更新資料庫中的 token
      await database.saveToken(handle, response.data.data)
      
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
```

## 📊 SHOPLINE API 回應格式

### 成功回應格式
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
    "expireTime": "2025-10-20T18:23:48.725+00:00",
    "refreshToken": "8778ef4e3982b74f9b3ecf7191ffbdb799d46966",
    "refreshExpireTime": "2099-12-30T16:00:00.000+00:00",
    "scope": "read_products,read_orders"
  }
}
```

### 錯誤回應格式
```json
{
  "code": 400,
  "message": "Invalid request parameters",
  "data": null
}
```

## 🔧 配置檔案格式

### config.json (SHOPLINE 標準)
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

## 🚨 錯誤處理標準

### 標準錯誤回應
```javascript
// 參數缺失
if (!appkey || !handle || !timestamp || !sign) {
  return res.status(400).json({ 
    error: 'Missing required parameters' 
  })
}

// 簽名驗證失敗
if (!isValidSignature) {
  return res.status(401).json({ 
    error: 'Invalid signature' 
  })
}

// 時間戳過期
if (!isValidTimestamp) {
  return res.status(401).json({ 
    error: 'Request expired' 
  })
}

// App Key 不匹配
if (appkey !== config.app_key) {
  return res.status(401).json({ 
    error: 'Invalid app key' 
  })
}
```

## 📝 日誌記錄標準

### 關鍵日誌點
```javascript
// 授權流程日誌
console.log('收到安裝請求:', req.query)
console.log('收到授權回調:', req.query)
console.log('授權碼驗證成功:', code)
console.log('Access token 獲取成功')

// 資料庫操作日誌
console.log('✅ Token 已儲存/更新:', shopHandle)
console.log('✅ Token 已取得:', shopHandle)
console.log('✅ Token 已刪除:', shopHandle)

// 錯誤日誌
console.error('簽名驗證失敗')
console.error('時間戳驗證失敗')
console.error('Token 請求錯誤:', error.response?.data || error.message)
```

---

## 📋 總結

以上代碼片段包含了 SHOPLINE OAuth 2.0 標準的完整實現：

1. **HMAC-SHA256 簽名算法** - SHOPLINE 平台標準
2. **GET/POST 請求簽名** - 符合 SHOPLINE 規範
3. **時間戳驗證** - 10分鐘容差標準
4. **OAuth 授權流程** - 完整的 4 步驟流程
5. **API 請求格式** - SHOPLINE API 標準格式
6. **錯誤處理機制** - 標準 HTTP 狀態碼
7. **日誌記錄規範** - 關鍵操作追蹤

這些代碼片段是與 SHOPLINE 平台整合的關鍵，缺一不可。
