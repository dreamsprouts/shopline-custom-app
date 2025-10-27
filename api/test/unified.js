/**
 * Vercel Function: 合併的測試 API
 * GET /api/test?type=shop - 測試商店資訊
 * GET /api/test?type=products - 測試商品列表
 * POST /api/test?type=orders - 建立訂單
 * GET /api/test?type=orders - 查詢訂單列表
 */

// 設置基本環境變數（如果未設置）
if (!process.env.USE_EVENT_BUS) process.env.USE_EVENT_BUS = 'false'
if (!process.env.EVENT_BUS_TYPE) process.env.EVENT_BUS_TYPE = 'memory'
if (!process.env.ENABLE_SHOPLINE_SOURCE) process.env.ENABLE_SHOPLINE_SOURCE = 'false'
if (!process.env.EVENT_STORE_ENABLED) process.env.EVENT_STORE_ENABLED = 'false'

const { ShoplineAPIClientWrapper } = require('../../connectors/shopline/source')

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
    const apiClient = new ShoplineAPIClientWrapper()
    let result
    
    switch (testType) {
      case 'shop':
        result = await apiClient.testShopInfoAPI(accessToken)
        break
        
      case 'products':
        if (req.method === 'GET') {
          result = await apiClient.getProducts(accessToken, {
            page: 1,
            limit: 10,
            status: 'active'
          })
        } else if (req.method === 'POST') {
          const payload = req.body?.product ? req.body : {
            product: {
              handle: 'shopline-251014-01',
              title: 'shopline-251014-01',
              tags: ['tag1, tag2'],
              variants: [
                {
                  sku: 'T0000000001',
                  price: '1000',
                  required_shipping: true,
                  taxable: true,
                  image: {
                    alt: 'This is a image alt',
                    src: 'https://img.myshopline.com/image/official/e46e6189dd5641a3b179444cacdcdd2a.png'
                  },
                  inventory_tracker: true
                }
              ],
              images: [
                {
                  src: 'https://img.myshopline.com/image/official/e46e6189dd5641a3b179444cacdcdd2a.png',
                  alt: 'This is a image alt'
                }
              ],
              subtitle: 'This is a subtitle',
              body_html: 'This is a description',
              status: 'active',
              published_scope: 'web'
            }
          }
          result = await apiClient.createProduct(accessToken, payload)
        }
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
          result = await apiClient.createOrder(accessToken, orderData)
        } else {
          // 查詢訂單列表
          result = await apiClient.getOrders(accessToken, {
            page: 1,
            limit: 10
          })
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