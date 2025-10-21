/**
 * Vercel Serverless Function: 查詢/更新訂單詳情 API
 * GET /api/test/orders/[id] - 查詢訂單詳情
 * PUT /api/test/orders/[id] - 更新訂單
 */

const path = require('path')
const ShoplineAPIClient = require(path.join(process.cwd(), 'utils', 'shopline-api'))

module.exports = async (req, res) => {
  // 設定 CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 處理 preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只接受 GET 或 PUT
  if (req.method !== 'GET' && req.method !== 'PUT') {
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
    const orderId = req.query.id
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      })
    }
    
    const apiClient = new ShoplineAPIClient()
    let result
    
    if (req.method === 'GET') {
      // 查詢訂單詳情
      result = await apiClient.getOrderDetail(accessToken, orderId)
    } else {
      // 更新訂單
      const updateData = {
        order: {
          tags: `Updated_${Date.now()}`,
          note_attributes: [
            {
              name: "API_REMARK",
              value: `Updated at ${new Date().toISOString()}`
            }
          ]
        }
      }
      result = await apiClient.updateOrder(accessToken, orderId, updateData)
    }
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error(`${req.method} order error:`, error)
    res.status(500).json({ 
      success: false,
      error: `Failed to ${req.method === 'GET' ? 'get' : 'update'} order`,
      message: error.message 
    })
  }
}

