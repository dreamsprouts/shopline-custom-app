// Vercel Function: 刷新 Token
const axios = require('axios')
const { signPostRequest } = require('../../utils/signature')
const database = require('../../utils/database-postgres')

// 環境變數配置
const config = {
  app_key: process.env.APP_KEY || '4c951e966557c8374d9a61753dfe3c52441aba3b',
  app_secret: process.env.APP_SECRET || 'dd46269d6920f49b07e810862d3093062b0fb858',
  shop_handle: process.env.SHOP_HANDLE || 'paykepoc'
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { handle } = req.body
    
    if (!handle) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing handle parameter' 
      })
    }

    // 初始化資料庫
    await database.init()
    
    // 取得現有 Token
    const existingToken = await database.getToken(handle)
    if (!existingToken) {
      return res.status(404).json({ 
        success: false,
        error: 'Token not found' 
      })
    }

    // 檢查 Refresh Token 是否過期
    if (database.isTokenExpired({ expireTime: existingToken.refreshExpireTime })) {
      return res.status(401).json({ 
        success: false,
        error: 'Refresh token expired' 
      })
    }

    // 使用 Refresh Token 獲取新的 Access Token
    const refreshUrl = `https://${handle}.myshopline.com/admin/oauth-web/oauth/token`
    const refreshData = {
      appKey: config.app_key,
      appSecret: config.app_secret,
      refreshToken: existingToken.refreshToken,
      grantType: 'refresh_token'
    }
    
    const timestamp = Date.now().toString()
    const signature = signPostRequest(JSON.stringify(refreshData), timestamp, config.app_secret)
    
    const refreshResponse = await axios.post(refreshUrl, refreshData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Signature': signature
      }
    })
    
    if (refreshResponse.data && refreshResponse.data.access_token) {
      console.log('Token 刷新成功')
      
      // 更新 Token 到資料庫
      const newTokenInfo = {
        accessToken: refreshResponse.data.access_token,
        refreshToken: refreshResponse.data.refresh_token,
        expireTime: new Date(Date.now() + refreshResponse.data.expires_in * 1000).toISOString(),
        refreshExpireTime: new Date(Date.now() + refreshResponse.data.refresh_expires_in * 1000).toISOString(),
        scope: refreshResponse.data.scope
      }
      
      await database.saveToken(handle, newTokenInfo)
      
      res.json({
        success: true,
        data: {
          access_token: newTokenInfo.accessToken,
          refresh_token: newTokenInfo.refreshToken,
          expire_time: newTokenInfo.expireTime,
          scope: newTokenInfo.scope
        }
      })
    } else {
      console.error('Token 刷新失敗:', refreshResponse.data)
      res.status(500).json({ 
        success: false,
        error: 'Failed to refresh token',
        details: refreshResponse.data 
      })
    }
    
  } catch (error) {
    console.error('Token 刷新處理失敗:', error)
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    })
  }
}
