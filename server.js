// 載入環境變數 - 必須在其他 require 之前
require('dotenv').config({ path: '.env.local' })

// 強制設定環境變數
process.env.USE_EVENT_BUS = 'true'
process.env.ENABLE_SHOPLINE_SOURCE = 'true'

const express = require('express')
const cors = require('cors')
const path = require('path')

// 環境變數配置（Vercel 兼容）
const config = {
  app_key: process.env.APP_KEY || '4c951e966557c8374d9a61753dfe3c52441aba3b',
  app_secret: process.env.APP_SECRET || 'dd46269d6920f49b07e810862d3093062b0fb858',
  shop_handle: process.env.SHOP_HANDLE || 'paykepoc',
  shop_url: process.env.SHOP_URL || 'https://paykepoc.myshopline.com/',
  port: process.env.PORT || 3000,
  node_env: process.env.NODE_ENV || 'development'
}
const oauthRoutes = require('./routes/oauth')
// 統一使用 PostgreSQL 資料庫
const database = require('./utils/database-postgres')
const { ShoplineAPIClientWrapper } = require('./connectors/shopline/source')

// Event Monitor 整合
const { setupEventMonitor } = require('./api/event-monitor')

const app = express()
const PORT = config.port || 3000

// 中介軟體設定
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 靜態檔案服務
app.use(express.static(path.join(__dirname, 'public')))
app.use('/views', express.static(path.join(__dirname, 'views')))

// 請求日誌中介軟體
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  if (Object.keys(req.query).length > 0) {
    console.log('Query params:', req.query)
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body)
  }
  next()
})

// 路由設定
app.use('/oauth', oauthRoutes)

// API 測試路由
// 建立商品（POST）
app.post('/api/test/products', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }

    const accessToken = authHeader.substring(7)
    const apiClient = new ShoplineAPIClientWrapper()

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
})
app.get('/api/test/products', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }
    
    const accessToken = authHeader.substring(7)
    const apiClient = new ShoplineAPIClientWrapper()
    
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
})

// 建立訂單 API
app.post('/api/test/orders', async (req, res) => {
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
    // API 回傳格式: { products: [...] }，直接取 data.products
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
})

// 查詢訂單列表 API
app.get('/api/test/orders', async (req, res) => {
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
    const apiClient = new ShoplineAPIClientWrapper()
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
})

// 查詢訂單詳情 API
app.get('/api/test/orders/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }
    
    const accessToken = authHeader.substring(7)
    const orderId = req.params.id
    
    // 查詢訂單詳情
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.getOrderDetail(accessToken, orderId)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error('Get order detail error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to get order detail',
      message: error.message 
    })
  }
})

// 更新訂單 API
app.put('/api/test/orders/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }
    
    const accessToken = authHeader.substring(7)
    const orderId = req.params.id
    const updatePayload = req.body
    
    // 更新訂單
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.updateOrder(accessToken, orderId, updatePayload)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error('Update order error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to update order',
      message: error.message 
    })
  }
})

// 測試商店資訊 API
app.get('/api/test/shop', async (req, res) => {
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
    const apiClient = new ShoplineAPIClientWrapper()
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
})

// 測試所有 API 端點
app.get('/api/test/all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }
    
    const accessToken = authHeader.substring(7)
    
    // 使用 SHOPLINE API 客戶端測試所有 API
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.testAllAPIs(accessToken)
    
    res.json(result)
  } catch (error) {
    console.error('All APIs test error:', error)
    res.status(500).json({ 
      success: false,
      error: 'API test failed',
      message: error.message 
    })
  }
})

// 根路徑 - 提供前端頁面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'))
})

// Event Monitor Dashboard
app.get('/event-monitor', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'event-monitor.html'))
})

// Event Monitor Dashboard - 訂閱模式
app.get('/event-monitor-subscription', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'event-monitor-subscription.html'))
})

// Event Monitor API 路由
app.get('/api/event-monitor/events', require('./api/event-monitor/events'))
app.get('/api/event-monitor/stream', require('./api/event-monitor/stream'))
app.post('/api/event-monitor/test', require('./api/event-monitor/test'))
app.post('/api/event-monitor/test-simple', require('./api/event-monitor/test-simple'))

// API 資訊端點
app.get('/api/info', (req, res) => {
  res.json({
    message: 'SHOPLINE OAuth App 運行中',
    version: '1.0.0',
    endpoints: {
      install: '/oauth/install',
      callback: '/oauth/callback',
      refresh: '/oauth/refresh',
      status: '/oauth/status'
    },
    config: {
      app_key: config.app_key,
      shop_handle: config.shop_handle,
      shop_url: config.shop_url
    }
  })
})

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// ==================== 認證事件 API 端點 ====================

// Token 刷新 (帶事件發佈)
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }

    const accessToken = authHeader.substring(7)
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing refreshToken parameter'
      })
    }

    // 使用 ShoplineAPIClientWrapper 來發佈事件
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.refreshToken(refreshToken)

    if (result.success) {
      // 更新資料庫中的 token 資料
      try {
        const handle = 'paykepoc' // 可以從 token 中解析或使用預設值
        await database.saveToken(handle, result.data)
      } catch (dbError) {
        console.error('更新 Token 到資料庫失敗:', dbError)
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Token 刷新成功，事件已發佈'
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Token refresh failed'
      })
    }
  } catch (error) {
    console.error('Token 刷新錯誤:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// Token 撤銷 (帶事件發佈)
app.post('/api/auth/revoke', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }

    const accessToken = authHeader.substring(7)
    const { accessToken: tokenToRevoke } = req.body

    // 使用 ShoplineAPIClientWrapper 來發佈事件
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.revokeToken(accessToken)

    if (result.success) {
      // 從資料庫刪除 token 資料
      try {
        const handle = 'paykepoc' // 可以從 token 中解析或使用預設值
        await database.deleteToken(handle)
      } catch (dbError) {
        console.error('從資料庫刪除 Token 失敗:', dbError)
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Token 撤銷成功，事件已發佈'
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Token revoke failed'
      })
    }
  } catch (error) {
    console.error('Token 撤銷錯誤:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// OAuth 授權 (帶事件發佈)
app.post('/api/auth/authorize', async (req, res) => {
  try {
    const { code, state } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code'
      })
    }

    // 使用 ShoplineAPIClientWrapper 來發佈事件
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.authorizeOAuth(code, state)

    if (result.success) {
      // 儲存 token 資料到資料庫
      try {
        const handle = 'paykepoc' // 可以從 token 中解析或使用預設值
        await database.saveToken(handle, result.data)
      } catch (dbError) {
        console.error('儲存 Token 到資料庫失敗:', dbError)
      }

      res.json({
        success: true,
        data: result.data,
        message: 'OAuth 授權成功，事件已發佈'
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'OAuth authorization failed'
      })
    }
  } catch (error) {
    console.error('OAuth 授權錯誤:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// OAuth 撤銷 (帶事件發佈)
app.post('/api/auth/revoke-oauth', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }

    const accessToken = authHeader.substring(7)

    // 使用 ShoplineAPIClientWrapper 來發佈事件
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.revokeOAuth(accessToken)

    if (result.success) {
      // 從資料庫刪除 token 資料
      try {
        const handle = 'paykepoc' // 可以從 token 中解析或使用預設值
        await database.deleteToken(handle)
      } catch (dbError) {
        console.error('從資料庫刪除 Token 失敗:', dbError)
      }

      res.json({
        success: true,
        data: result.data,
        message: 'OAuth 撤銷成功，事件已發佈'
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'OAuth revoke failed'
      })
    }
  } catch (error) {
    console.error('OAuth 撤銷錯誤:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// 登入 (帶事件發佈)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, loginMethod = 'oauth' } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing username or password'
      })
    }

    // 使用 ShoplineAPIClientWrapper 來發佈事件
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.login(username, password, loginMethod)

    if (result.success) {
      // 儲存 token 資料到資料庫
      try {
        const handle = 'paykepoc' // 可以從 token 中解析或使用預設值
        await database.saveToken(handle, result.data)
      } catch (dbError) {
        console.error('儲存 Token 到資料庫失敗:', dbError)
      }

      res.json({
        success: true,
        data: result.data,
        message: '登入成功，事件已發佈'
      })
    } else {
      res.status(401).json({
        success: false,
        error: result.error || 'Login failed'
      })
    }
  } catch (error) {
    console.error('登入錯誤:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// 登出 (帶事件發佈)
app.post('/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Missing or invalid authorization header' 
      })
    }

    const accessToken = authHeader.substring(7)

    // 使用 ShoplineAPIClientWrapper 來發佈事件
    const apiClient = new ShoplineAPIClientWrapper()
    const result = await apiClient.logout(accessToken)

    if (result.success) {
      // 從資料庫刪除 token 資料
      try {
        const handle = 'paykepoc' // 可以從 token 中解析或使用預設值
        await database.deleteToken(handle)
      } catch (dbError) {
        console.error('從資料庫刪除 Token 失敗:', dbError)
      }

      res.json({
        success: true,
        data: result.data,
        message: '登出成功，事件已發佈'
      })
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Logout failed'
      })
    }
  } catch (error) {
    console.error('登出錯誤:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
})

// 錯誤處理中介軟體
app.use((err, req, res, next) => {
  console.error('伺服器錯誤:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 處理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  })
})

// 初始化資料庫並啟動伺服器
async function startServer() {
  try {
    // 初始化資料庫
    await database.init()
    
    // 啟動伺服器
    app.listen(PORT, async () => {
      console.log(`🚀 SHOPLINE OAuth App 已啟動`)
      console.log(`📍 本地伺服器: http://localhost:${PORT}`)
      console.log(`🔧 環境: ${config.node_env}`)
      console.log(`🏪 商店: ${config.shop_handle}`)
      console.log(`🔑 App Key: ${config.app_key}`)
      console.log(`💾 資料庫: PostgreSQL`)
      console.log('')
      console.log('📋 可用端點:')
      console.log(`   GET  /                    - 前端應用`)
      console.log(`   GET  /health              - 健康檢查`)
      console.log(`   GET  /oauth/install       - 應用安裝端點`)
      console.log(`   GET  /oauth/callback      - OAuth 回調端點`)
      console.log(`   POST /oauth/refresh       - Token 刷新端點`)
      console.log(`   GET  /oauth/status        - OAuth 狀態`)
      console.log(`   GET  /oauth/token-status  - Token 狀態檢查`)
      console.log(`   POST /oauth/revoke        - 撤銷授權`)
      console.log('')
      console.log('🔗 測試 OAuth 流程:')
      console.log(`   1. 啟動 ngrok: ngrok http ${PORT}`)
      console.log(`   2. 更新 SHOPLINE Developer Center 設定`)
      console.log(`   3. 訪問: https://paykepoc.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${config.app_key}&responseType=code&scope=read_products,read_orders&redirectUri=<ngrok-url>/oauth/callback`)
      console.log('')
      console.log('📊 Event Monitor Dashboard:')
      console.log(`   GET  /event-monitor         - Event Monitor Dashboard`)
      console.log(`   GET  /api/event-monitor/events - 取得事件列表`)
      console.log(`   POST /api/event-monitor/test   - 發送測試事件`)
      
      // 初始化 Event Monitor
      await setupEventMonitor()
    })
  } catch (error) {
    console.error('❌ 伺服器啟動失敗:', error)
    process.exit(1)
  }
}

// 啟動伺服器
startServer()

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...')
  database.close()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('收到 SIGINT 信號，正在關閉伺服器...')
  database.close()
  process.exit(0)
})
