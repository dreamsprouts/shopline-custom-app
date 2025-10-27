/**
 * Vercel Serverless Function: 建立訂單 API
 * POST /api/test/orders/create - 建立訂單
 */

const { ShoplineAPIClientWrapper } = require('../../../connectors/shopline/source')

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
    const orderPayload = req.body
    
    // 先獲取商品列表以取得有效的 variant_id
    const apiClient = new ShoplineAPIClientWrapper()
    
    // 暫時停用事件發佈，避免發佈不必要的 product.updated 事件
    apiClient.setEventBusEnabled(false)
    const productsResult = await apiClient.testProductsAPI(accessToken)
    
    // 重新啟用事件發佈，準備建立訂單
    apiClient.setEventBusEnabled(true)
    
    if (!productsResult.success) {
      return res.status(500).json({
        success: false,
        error: '無法獲取商品列表',
        details: productsResult
      })
    }
    
    // 取得第一個商品的 variant_id
    const products = productsResult.data?.products || []
    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        error: '商店中沒有商品，無法建立訂單'
      })
    }
    
    const firstProduct = products[0]
    const variantId = firstProduct.variants?.[0]?.id
    
    if (!variantId) {
      return res.status(400).json({
        success: false,
        error: '商品沒有有效的 variant_id'
      })
    }
    
    // 如果沒有提供 orderPayload，使用預設的測試訂單
    const finalOrderPayload = orderPayload?.order ? orderPayload : {
      order: {
        note_attributes: [
          {
            name: "API_REMARK",
            value: `test order created at ${new Date().toISOString()}`
          }
        ],
        tags: "API_Test",
        price_info: {
          current_extra_total_discounts: "0.00",
          taxes_included: null,
          total_shipping_price: "0.00"
        },
        line_items: [
          {
            discount_price: {
              amount: "0.00",
              title: "No discount"
            },
            location_id: firstProduct.location_id || "",
            price: firstProduct.variants?.[0]?.price || "100.00",
            properties: [],
            quantity: 1,
            requires_shipping: null,
            shipping_line_title: null,
            tax_line: {
              price: "0.00",
              rate: "0.000",
              title: "No tax"
            },
            taxable: null,
            title: firstProduct.title || "Test Product",
            variant_id: variantId
          }
        ]
      }
    }
    
    // 建立訂單
    const result = await apiClient.createOrder(accessToken, finalOrderPayload)
    
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
