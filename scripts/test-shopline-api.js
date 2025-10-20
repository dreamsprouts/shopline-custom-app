const axios = require('axios')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

/**
 * 直接測試 SHOPLINE API 端點
 * 使用資料庫中的真實 token 進行測試
 */
async function testShoplineAPIs() {
  try {
    console.log('🔍 開始測試 SHOPLINE API...')
    
    // 直接查詢資料庫取得 token
    const dbPath = path.join(__dirname, '../data/shopline_oauth.db')
    const db = new sqlite3.Database(dbPath)
    
    const tokenData = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM oauth_tokens WHERE shop_handle = ?', ['paykepoc'], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
    
    db.close()
    
    if (!tokenData) {
      console.error('❌ 沒有找到 token 資料')
      return
    }
    
    console.log('✅ 找到 token 資料:', {
      shop_handle: tokenData.shop_handle,
      access_token: tokenData.access_token.substring(0, 20) + '...',
      scope: tokenData.scope,
      expire_time: tokenData.expire_time
    })
    
    const accessToken = tokenData.access_token
    const shopHandle = tokenData.shop_handle
    const baseURL = `https://${shopHandle}.myshopline.com`
    
    // 測試 1: 商店資訊 API (嘗試不同版本)
    console.log('\n📡 測試 1: 商店資訊 API')
    
    // 嘗試 v20240301 版本
    try {
      const shopResponse = await axios.get(`${baseURL}/admin/openapi/v20240301/shop`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      console.log('✅ 商店資訊 API 成功:', {
        status: shopResponse.status,
        code: shopResponse.data?.code,
        message: shopResponse.data?.message,
        shopName: shopResponse.data?.data?.shop?.name,
        shopDomain: shopResponse.data?.data?.shop?.domain
      })
      
      // 記錄成功的 API 資訊
      console.log('📝 商店資訊 API 端點確認:')
      console.log(`   URL: ${baseURL}/admin/openapi/v20240301/shop`)
      console.log(`   Method: GET`)
      console.log(`   Headers: Authorization: Bearer {token}`)
      console.log(`   回應格式: ${JSON.stringify(shopResponse.data, null, 2)}`)
      
    } catch (error) {
      console.error('❌ 商店資訊 API (v20240301) 失敗:', {
        status: error.response?.status,
        code: error.response?.data?.code,
        message: error.response?.data?.message,
        error: error.message
      })
      
      // 嘗試其他可能的端點
      console.log('🔄 嘗試其他端點...')
      
      // 嘗試沒有版本號的端點
      try {
        const shopResponse2 = await axios.get(`${baseURL}/admin/api/shop`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
        
        console.log('✅ 商店資訊 API (無版本) 成功:', {
          status: shopResponse2.status,
          data: shopResponse2.data
        })
        
        console.log('📝 商店資訊 API 端點確認:')
        console.log(`   URL: ${baseURL}/admin/api/shop`)
        console.log(`   Method: GET`)
        console.log(`   Headers: Authorization: Bearer {token}`)
        
      } catch (error2) {
        console.error('❌ 商店資訊 API (無版本) 也失敗:', {
          status: error2.response?.status,
          message: error2.response?.data?.message,
          error: error2.message
        })
      }
    }
    
    // 測試 2: 商品 API (嘗試不同路徑)
    console.log('\n📡 測試 2: 商品 API')
    
    // 嘗試不同的 API 路徑
    const productPaths = [
      '/admin/api/products',
      '/admin/openapi/v20240301/products',
      '/admin/openapi/v20251201/products',
      '/api/products',
      '/admin/products'
    ]
    
    for (const path of productPaths) {
      try {
        console.log(`🔄 嘗試路徑: ${path}`)
        const productsResponse = await axios.get(`${baseURL}${path}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          params: {
            page: 1,
            limit: 5,
            status: 'active'
          }
        })
        
        console.log('✅ 商品 API 成功:', {
          path,
          status: productsResponse.status,
          contentType: productsResponse.headers['content-type'],
          dataType: typeof productsResponse.data,
          dataKeys: productsResponse.data ? Object.keys(productsResponse.data) : 'N/A'
        })
        
        console.log('📝 商品 API 端點確認:')
        console.log(`   URL: ${baseURL}${path}`)
        console.log(`   Method: GET`)
        console.log(`   Headers: Authorization: Bearer {token}`)
        console.log(`   回應格式: ${JSON.stringify(productsResponse.data, null, 2)}`)
        break
        
      } catch (error) {
        console.log(`❌ 路徑 ${path} 失敗:`, {
          status: error.response?.status,
          message: error.response?.data?.message,
          error: error.message
        })
      }
    }
    
    // 測試 3: 訂單 API
    console.log('\n📡 測試 3: 訂單 API')
    try {
      const ordersResponse = await axios.get(`${baseURL}/admin/openapi/v20251201/orders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        params: {
          page: 1,
          limit: 5,
          status: 'paid'
        }
      })
      
      console.log('✅ 訂單 API 成功:', {
        status: ordersResponse.status,
        code: ordersResponse.data?.code,
        message: ordersResponse.data?.message,
        orderCount: ordersResponse.data?.data?.orders?.length || 0,
        totalOrders: ordersResponse.data?.data?.pagination?.total || 0
      })
      
      // 記錄成功的 API 資訊
      console.log('📝 訂單 API 端點確認:')
      console.log(`   URL: ${baseURL}/admin/openapi/v20251201/orders`)
      console.log(`   Method: GET`)
      console.log(`   Headers: Authorization: Bearer {token}`)
      console.log(`   Params: page=1, limit=5, status=paid`)
      console.log(`   回應格式: ${JSON.stringify(ordersResponse.data, null, 2)}`)
      
    } catch (error) {
      console.error('❌ 訂單 API 失敗:', {
        status: error.response?.status,
        code: error.response?.data?.code,
        message: error.response?.data?.message,
        error: error.message
      })
    }
    
    console.log('\n🎯 API 測試完成！')
    
  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error)
  }
}

// 執行測試
testShoplineAPIs()
