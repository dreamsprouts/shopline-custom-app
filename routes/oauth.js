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
    const scope = 'read_store_information,read_products,write_products'
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
        
        // 儲存 token 資料到資料庫
        try {
          await database.saveToken(handle, tokenResponse.data)
        } catch (dbError) {
          console.error('儲存 Token 到資料庫失敗:', dbError)
          // 即使資料庫儲存失敗，也繼續流程
        }
        
        // 重定向到美觀的成功頁面
        const successUrl = `/views/callback.html?handle=${handle}`
        res.redirect(successUrl)
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
