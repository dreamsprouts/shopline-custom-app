/**
 * Vercel Serverless Function: 建立訂單 API
 * POST /api/test/orders/create
 */

const ShoplineAPIClient = require('../../../utils/shopline-api')

module.exports = async (req, res) => {
  // 設定 CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // 處理 preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 只接受 POST
  if (req.method !== 'POST') {
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
    
    // 1. 先取得商品列表，獲取有效的 variant_id
    const apiClient = new ShoplineAPIClient()
    const productsResult = await apiClient.getProducts(accessToken, {
      page: 1,
      limit: 10,
      status: 'active'
    })
    
    if (!productsResult.success) {
      return res.status(500).json({
        success: false,
        error: '無法取得商品列表',
        details: productsResult.error
      })
    }
    
    const products = productsResult.data?.data?.products || []
    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        error: '商店中沒有商品，無法建立訂單'
      })
    }
    
    // 取得第一個商品的第一個 variant
    const firstProduct = products[0]
    const variants = firstProduct.variants || []
    if (variants.length === 0) {
      return res.status(400).json({
        success: false,
        error: '商品沒有有效的 variants'
      })
    }
    
    const variantId = variants[0].id
    
    // 2. 使用預設訂單資料建立訂單
    const orderData = {
      order: {
        note_attributes: [
          {
            name: "API_REMARK",
            value: `Test order created at ${new Date().toISOString()}`
          }
        ],
        tags: `API_Test_${Date.now()}`,
        price_info: {
          current_extra_total_discounts: "8.00",
          taxes_included: null,
          total_shipping_price: "8.00"
        },
        line_items: [
          {
            discount_price: {
              amount: "1.00",
              title: "Test Discount"
            },
            location_id: "6402444512912503764",
            price: "100.00",
            properties: [
              {
                name: "Test Attribute",
                show: true,
                type: "text",
                value: "Test Value"
              }
            ],
            quantity: 1,
            requires_shipping: null,
            shipping_line_title: null,
            tax_line: {
              price: "5.00",
              rate: "0.050",
              title: "Tax"
            },
            taxable: null,
            title: firstProduct.title || "Test Product",
            variant_id: variantId
          }
        ]
      }
    }
    
    // 建立訂單
    const result = await apiClient.createOrder(accessToken, orderData)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to create order',
      message: error.message 
    })
  }
}

