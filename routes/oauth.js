const express = require('express')
const axios = require('axios')
const { 
  verifyGetSignature, 
  verifyPostSignature, 
  verifyTimestamp,
  signPostRequest 
} = require('../utils/signature')
// 統一使用 PostgreSQL 資料庫
const database = require('../utils/database-postgres')
// 環境變數配置（Vercel 兼容）
const config = {
  app_key: process.env.APP_KEY || '4c951e966557c8374d9a61753dfe3c52441aba3b',
  app_secret: process.env.APP_SECRET || 'dd46269d6920f49b07e810862d3093062b0fb858',
  shop_handle: process.env.SHOP_HANDLE || 'paykepoc',
  shop_url: process.env.SHOP_URL || 'https://paykepoc.myshopline.com/',
  node_env: process.env.NODE_ENV || 'development'
}

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
    const scope = 'read_store_information,read_products,write_products,read_orders,write_orders'
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
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Missing required parameters')}&handle=${handle || 'unknown'}`
      return res.redirect(errorUrl)
    }
    
    // 驗證簽名
    const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
    if (!isValidSignature) {
      console.error('回調簽名驗證失敗')
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Invalid signature')}&handle=${handle}`
      return res.redirect(errorUrl)
    }
    
    // 驗證時間戳
    const isValidTimestamp = verifyTimestamp(timestamp)
    if (!isValidTimestamp) {
      console.error('回調時間戳驗證失敗')
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Request expired')}&handle=${handle}`
      return res.redirect(errorUrl)
    }
    
    // 驗證 app key
    if (appkey !== config.app_key) {
      console.error('回調 App key 不匹配')
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Invalid app key')}&handle=${handle}`
      return res.redirect(errorUrl)
    }
    
    console.log('授權碼驗證成功:', code)
    
    // 檢查是否已經有有效的 Token（防止重複授權）
    try {
      const existingToken = await database.getToken(handle)
      if (existingToken) {
        console.log('已存在有效的 Token，直接跳轉到首頁')
        // 直接跳轉到首頁，讓用戶看到已授權狀態
        return res.redirect('/')
      }
    } catch (dbError) {
      console.warn('檢查現有 Token 失敗，繼續授權流程:', dbError)
      // 資料庫檢查失敗時，繼續正常的授權流程
    }
    
    // 使用授權碼請求 access token
    try {
      const tokenResponse = await requestAccessToken(code, handle)
      
      if (tokenResponse.success) {
        console.log('Access token 獲取成功')
        
        // 儲存 token 資料到資料庫
        try {
          await database.saveToken(handle, tokenResponse.data)
        } catch (dbError) {
          console.error('儲存 Token 到資料庫失敗:', dbError)
          // 即使資料庫儲存失敗，也繼續流程
        }
        
        // 發佈 OAuth 授權成功事件（僅在首次授權時）
        try {
          // 檢查是否為重複授權（通過檢查資料庫中是否已存在相同的 access_token）
          const existingToken = await database.getToken(handle)
          const isNewAuthorization = !existingToken || existingToken.accessToken !== tokenResponse.data.access_token
          
          if (isNewAuthorization) {
          const { ShoplineSourceConnector } = require('../connectors/shopline/source/ShoplineSourceConnector')
          const sourceConnector = new ShoplineSourceConnector()
            console.log('🔍 [OAuth] 準備發佈授權成功事件 (首次授權):', {
            tokenResponse: tokenResponse,
            code: code ? `${code.substring(0, 10)}...` : null
          })
          await sourceConnector.publishOAuthAuthorizedEvent(tokenResponse, code, null)
          console.log('✅ [OAuth] 授權成功事件已發佈')
          } else {
            console.log('ℹ️ [OAuth] 檢測到重複授權，跳過事件發佈')
          }
        } catch (eventError) {
          console.warn('OAuth 授權事件發佈失敗，但授權已成功:', eventError)
        }
        
        // 重定向到美觀的成功頁面
        const successUrl = `/views/callback.html?handle=${handle}`
        res.redirect(successUrl)
      } else {
        console.error('Access token 獲取失敗:', tokenResponse.error)
        // 重定向到錯誤頁面而不是返回 JSON
        const errorUrl = `/views/error.html?error=${encodeURIComponent(tokenResponse.error)}&handle=${handle}`
        res.redirect(errorUrl)
      }
    } catch (tokenError) {
      console.error('Token 請求錯誤:', tokenError)
      // 重定向到錯誤頁面而不是返回 JSON
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Failed to get access token')}&handle=${handle}`
      res.redirect(errorUrl)
    }
    
  } catch (error) {
    console.error('授權回調處理錯誤:', error)
    // 重定向到錯誤頁面而不是返回 JSON
    const errorUrl = `/views/error.html?error=${encodeURIComponent('Internal server error')}&handle=${req.query.handle || 'unknown'}`
    res.redirect(errorUrl)
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
      console.error('Token 請求失敗:', response.data)
      return {
        success: false,
        error: response.data.message || response.data.error || 'Token request failed'
      }
    }
  } catch (error) {
    console.error('Token 請求錯誤:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.error || error.message
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
      // 更新資料庫中的 token 資料
      try {
        await database.saveToken(handle, response.data.data)
      } catch (dbError) {
        console.error('更新 Token 到資料庫失敗:', dbError)
      }
      
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

/**
 * Token 狀態檢查端點
 */
router.get('/token-status', async (req, res) => {
  try {
    const handle = req.query.handle || config.shop_handle
    const tokenData = await database.getToken(handle)
    
    if (tokenData) {
      res.json({
        success: true,
        token: tokenData
      })
    } else {
      res.json({
        success: false,
        message: 'No active token found'
      })
    }
  } catch (error) {
    console.error('取得 Token 狀態失敗:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get token status'
    })
  }
})

/**
 * 撤銷授權端點
 */
router.post('/revoke', async (req, res) => {
  try {
    const { handle } = req.body
    const shopHandle = handle || config.shop_handle
    
    // 從資料庫刪除 Token
    const result = await database.deleteToken(shopHandle)
    
    if (result.changes > 0) {
      res.json({
        success: true,
        message: 'Authorization revoked successfully'
      })
    } else {
      res.json({
        success: false,
        message: 'No token found to revoke'
      })
    }
  } catch (error) {
    console.error('撤銷授權失敗:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to revoke authorization'
    })
  }
})

module.exports = router
