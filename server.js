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
const database = require('./utils/database')
const ShoplineAPIClient = require('./utils/shopline-api')

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
    const apiClient = new ShoplineAPIClient()

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
    
    // 使用 SHOPLINE API 客戶端測試商品 API
    const apiClient = new ShoplineAPIClient()
    const result = await apiClient.testProductsAPI(accessToken)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error('Products API test error:', error)
    res.status(500).json({ 
      success: false,
      error: 'API test failed',
      message: error.message 
    })
  }
})

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
    
    // 使用 SHOPLINE API 客戶端測試訂單 API
    const apiClient = new ShoplineAPIClient()
    const result = await apiClient.testOrdersAPI(accessToken)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(result.status || 500).json(result)
    }
  } catch (error) {
    console.error('Orders API test error:', error)
    res.status(500).json({ 
      success: false,
      error: 'API test failed',
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
    const apiClient = new ShoplineAPIClient()
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
    app.listen(PORT, () => {
      console.log(`🚀 SHOPLINE OAuth App 已啟動`)
      console.log(`📍 本地伺服器: http://localhost:${PORT}`)
      console.log(`🔧 環境: ${config.node_env}`)
      console.log(`🏪 商店: ${config.shop_handle}`)
      console.log(`🔑 App Key: ${config.app_key}`)
      console.log(`💾 資料庫: SQLite`)
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
