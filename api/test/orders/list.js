/**
 * Vercel Serverless Function: 查詢訂單列表 API
 * GET /api/test/orders/list
 */

const ShoplineAPIClient = require('../../../utils/shopline-api')

module.exports = async (req, res) => {
  // 設定 CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 處理 preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只接受 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    })
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
    const params = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    }
    
    // 查詢訂單列表
    const apiClient = new ShoplineAPIClient()
    const result = await apiClient.getOrders(accessToken, params)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to get orders',
      message: error.message 
    })
  }
}

