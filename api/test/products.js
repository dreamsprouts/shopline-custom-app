// Vercel Function: 測試商品 API (GET)
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

  if (req.method === 'GET') {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false,
          error: 'Missing or invalid authorization header' 
        })
      }
      
      const accessToken = authHeader.substring(7)
      const apiClient = new ShoplineAPIClient()
      
      // 使用標準 CRUD 方法
      const result = await apiClient.getProducts(accessToken, {
        page: 1,
        limit: 10,
        status: 'active'
      })
      
      if (result.success) {
        res.json(result)
      } else {
        res.status(result.status || 500).json(result)
      }
    } catch (error) {
      console.error('Products API error:', error)
      res.status(500).json({ 
        success: false,
        error: 'Failed to get products',
        message: error.message 
      })
    }
  } else if (req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false,
          error: 'Missing or invalid authorization header' 
        })
      }

      const accessToken = authHeader.substring(7)
      const apiClient = new ShoplineAPIClient()

      const payload = req.body?.product ? req.body : {
        product: {
          handle: `shopline-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          title: `shopline-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
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

      const result = await apiClient.createProduct(accessToken, payload)
      if (result.success) {
        res.json(result)
      } else {
        res.status(result.status || 500).json(result)
      }
    } catch (error) {
      console.error('Create Product API error:', error)
      res.status(500).json({ 
        success: false,
        error: 'API test failed',
        message: error.message 
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
