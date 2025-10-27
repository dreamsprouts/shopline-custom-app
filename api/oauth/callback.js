// Vercel Function: OAuth 回調
const axios = require('axios')
const { 
  verifyGetSignature, 
  verifyTimestamp,
  signPostRequest 
} = require('../../utils/signature')
const database = require('../../utils/database-postgres')

// 環境變數配置
const config = {
  app_key: process.env.APP_KEY || '4c951e966557c8374d9a61753dfe3c52441aba3b',
  app_secret: process.env.APP_SECRET || 'dd46269d6920f49b07e810862d3093062b0fb858',
  shop_handle: process.env.SHOP_HANDLE || 'paykepoc'
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    console.log('收到授權回調:', req.query)
    
    const { appkey, code, handle, timestamp, sign, lang } = req.query
    
    // 驗證必要參數
    if (!appkey || !code || !handle || !timestamp || !sign) {
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Missing required parameters')}&handle=${handle || 'unknown'}`
      return res.redirect(errorUrl)
    }
    
    // 驗證簽名
    const isValidSignature = verifyGetSignature(req.query, sign, config.app_secret)
    if (!isValidSignature) {
      console.error('簽名驗證失敗')
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Invalid signature')}&handle=${handle}`
      return res.redirect(errorUrl)
    }
    
    // 驗證時間戳
    const isValidTimestamp = verifyTimestamp(timestamp)
    if (!isValidTimestamp) {
      console.error('時間戳驗證失敗')
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Request expired')}&handle=${handle}`
      return res.redirect(errorUrl)
    }
    
    // 驗證 app key
    if (appkey !== config.app_key) {
      console.error('App key 不匹配')
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Invalid app key')}&handle=${handle}`
      return res.redirect(errorUrl)
    }
    
    // 驗證商店 handle
    if (handle !== config.shop_handle) {
      console.error('商店 handle 不匹配')
      const errorUrl = `/views/error.html?error=${encodeURIComponent('Invalid shop handle')}&handle=${handle}`
      return res.redirect(errorUrl)
    }
    
    console.log('授權碼驗證成功:', code)
    
    // 初始化資料庫
    await database.init()
    
    // 使用授權碼獲取 Access Token
    const tokenUrl = `https://${handle}.myshopline.com/admin/oauth-web/oauth/token`
    const tokenData = {
      appKey: config.app_key,
      appSecret: config.app_secret,
      code: code,
      grantType: 'authorization_code'
    }
    
    // 生成簽名
    const currentTimestamp = Date.now().toString()
    const signature = signPostRequest(JSON.stringify(tokenData), currentTimestamp, config.app_secret)
    
    const tokenResponse = await axios.post(tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': currentTimestamp,
        'X-Signature': signature
      }
    })
    
    if (tokenResponse.data && tokenResponse.data.access_token) {
      console.log('Access token 獲取成功')
      
      // 儲存 Token 到資料庫
      const tokenInfo = {
        accessToken: tokenResponse.data.access_token,
        refreshToken: tokenResponse.data.refresh_token,
        expireTime: new Date(Date.now() + tokenResponse.data.expires_in * 1000).toISOString(),
        refreshExpireTime: new Date(Date.now() + tokenResponse.data.refresh_expires_in * 1000).toISOString(),
        scope: tokenResponse.data.scope
      }
      
      await database.saveToken(handle, tokenInfo)
      
      // 重導向到成功頁面
      res.redirect(302, '/views/callback.html')
    } else {
      console.error('Token 獲取失敗:', tokenResponse.data)
      res.status(500).json({ 
        error: 'Failed to get access token',
        details: tokenResponse.data 
      })
    }
    
  } catch (error) {
    console.error('OAuth 回調處理失敗:', error)
    const errorUrl = `/views/error.html?error=${encodeURIComponent('Internal server error')}&handle=${req.query.handle || 'unknown'}`
    res.redirect(errorUrl)
  }
}
