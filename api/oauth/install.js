// Vercel Function: OAuth 安裝
const { 
  verifyGetSignature, 
  verifyTimestamp
} = require('../../utils/signature')

// 環境變數配置
const config = {
  app_key: process.env.APP_KEY || '4c951e966557c8374d9a61753dfe3c52441aba3b',
  app_secret: process.env.APP_SECRET || 'dd46269d6920f49b07e810862d3093062b0fb858',
  shop_handle: process.env.SHOP_HANDLE || 'paykepoc'
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
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
    
    // 驗證商店 handle
    if (handle !== config.shop_handle) {
      console.error('商店 handle 不匹配')
      return res.status(401).json({ 
        error: 'Invalid shop handle' 
      })
    }
    
    console.log('✅ 安裝請求驗證成功')
    
    // 重導向到 SHOPLINE 授權頁面
    const scope = 'read_store_information,read_products,write_products'
    const redirectUri = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/oauth/callback`
    const authUrl = `https://${handle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${config.app_key}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(redirectUri)}`
    
    console.log('重導向到授權頁面:', authUrl)
    res.redirect(302, authUrl)
    
  } catch (error) {
    console.error('安裝請求處理失敗:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
