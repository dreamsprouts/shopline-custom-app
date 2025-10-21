// Vercel Function: 測試商店資訊 API
const ShoplineAPIClient = require('../../utils/shopline-api')
const database = require('../../utils/database-postgres')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
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
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }
    
    const accessToken = authHeader.substring(7)
    
    // 使用 SHOPLINE API 客戶端測試商店資訊 API
    const apiClient = new ShoplineAPIClient()
    const result = await apiClient.testShopInfoAPI(accessToken)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error('Shop API test error:', error)
    res.status(500).json({ 
      success: false,
      error: 'API test failed',
      message: error.message 
    })
  }
}
