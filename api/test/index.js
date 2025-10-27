/**
 * 合併的測試 API
 * GET /api/test?type=shop - 測試商店資訊
 * GET /api/test?type=products - 測試商品列表
 * POST /api/test?type=orders - 建立訂單
 * GET /api/test?type=orders - 查詢訂單列表
 */

const { ShoplineSourceConnector } = require('../../connectors/shopline/source/ShoplineSourceConnector')
const ShoplineAPIClient = require('../../utils/shopline-api')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
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
    const testType = req.query.type || 'shop'
    
    // 使用 Shopline Source Connector (會自動發佈事件)
    const sourceConnector = new ShoplineSourceConnector()
    const apiClient = new ShoplineAPIClient()
    let result
    
    switch (testType) {
      case 'shop':
        result = await sourceConnector.getShopInfo(accessToken)
        break
        
      case 'products':
        result = await sourceConnector.getProducts(accessToken)
        break
        
      case 'orders':
        if (req.method === 'POST') {
          // 建立訂單
          const orderData = {
            order: {
              line_items: [
                {
                  title: "Test Product",
                  price: "10.00",
                  quantity: 1
                }
              ],
              customer: {
                email: "test@example.com",
                first_name: "Test",
                last_name: "User"
              }
            }
          }
          result = await sourceConnector.createOrder(accessToken, orderData)
        } else {
          // 查詢訂單列表
          result = await sourceConnector.getOrders(accessToken)
        }
        break
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid test type. Use: shop, products, orders'
        })
    }
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error('Test API error:', error)
    res.status(500).json({ 
      success: false,
      error: 'API test failed',
      message: error.message 
    })
  }
}
