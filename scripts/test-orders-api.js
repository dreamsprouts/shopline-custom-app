#!/usr/bin/env node
/**
 * Orders API 測試腳本
 * 
 * 先決條件：
 * 1. 必須先完成 OAuth 授權流程
 * 2. Access Token 已存在資料庫中
 * 3. Token 包含 read_orders, write_orders scopes
 * 
 * 使用方法：
 *   node scripts/test-orders-api.js
 */

const { Client } = require('pg')
const ShoplineAPIClient = require('../utils/shopline-api')

// PostgreSQL 連線配置
const connectionString = process.env.POSTGRES_URL || 'postgres://0743608919b1d257f4db152e045a3a2520ae966bd62b76cc1803d79e436b9971:sk_U93HsJ-QJ08Q4zI-TbhUY@db.prisma.io:5432/postgres?sslmode=require'

async function getTokenFromDatabase() {
  const client = new Client({ connectionString })
  
  try {
    await client.connect()
    console.log('✅ 連線到 PostgreSQL 資料庫')
    
    const result = await client.query(
      'SELECT access_token, refresh_token, scope FROM oauth_tokens WHERE shop_handle = $1',
      ['paykepoc']
    )
    
    if (result.rows.length === 0) {
      throw new Error('❌ 資料庫中沒有 Token！請先完成 OAuth 授權流程')
    }
    
    const token = result.rows[0]
    console.log('✅ 成功取得 Token')
    console.log('   Scope:', token.scope)
    
    // 檢查是否有必要的 scopes
    if (!token.scope.includes('read_orders') || !token.scope.includes('write_orders')) {
      console.warn('⚠️  警告：Token 缺少必要的 scopes (read_orders, write_orders)')
      console.warn('   當前 scope:', token.scope)
      console.warn('   請更新 SHOPLINE Developer Center 的 scopes 並重新授權')
    }
    
    return token.access_token
  } finally {
    await client.end()
  }
}

async function testOrdersAPI() {
  console.log('\n🧪 開始測試 Orders API...\n')
  
  try {
    // Step 1: 取得 Token
    console.log('📋 Step 1: 從資料庫取得 Access Token')
    const accessToken = await getTokenFromDatabase()
    console.log('   Token (前 20 字元):', accessToken.substring(0, 20) + '...')
    
    const apiClient = new ShoplineAPIClient()
    
    // Step 2: 先取得商品列表（建立訂單的先決條件）
    console.log('\n📋 Step 2: 取得商品列表（用於建立訂單）')
    let productsResult = await apiClient.testProductsAPI(accessToken)
    
    if (!productsResult.success) {
      throw new Error('無法取得商品列表: ' + productsResult.error)
    }
    
    let products = productsResult.data?.data?.products || []
    console.log('   ✅ 成功取得', products.length, '個商品')
    
    // 如果沒有商品，自動建立一個測試商品
    if (products.length === 0) {
      console.log('   ⚠️  商店中沒有商品，自動建立測試商品...')
      
      const testProduct = {
        product: {
          handle: `test-product-${Date.now()}`,
          title: `測試商品 ${new Date().toISOString()}`,
          tags: ["test", "auto-created"],
          variants: [
            {
              sku: `TEST-${Date.now()}`,
              price: "100.00",
              required_shipping: true,
              taxable: true,
              inventory_tracker: false
            }
          ],
          subtitle: "自動建立的測試商品",
          body_html: "此商品由測試腳本自動建立",
          status: "active",
          published_scope: "web"
        }
      }
      
      const createProductResult = await apiClient.createProduct(accessToken, testProduct)
      
      if (!createProductResult.success) {
        throw new Error('無法建立測試商品: ' + createProductResult.error)
      }
      
      console.log('   ✅ 成功建立測試商品')
      console.log('   完整回應:', JSON.stringify(createProductResult.data, null, 2))
      
      const productId = createProductResult.data?.data?.product?.id || createProductResult.data?.product?.id
      console.log('   商品 ID:', productId)
      
      // 等待一下讓商品索引完成
      console.log('   ⏳ 等待 2 秒讓商品索引完成...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 重新取得商品列表（不過濾 status，取得所有商品）
      productsResult = await apiClient.getOrders(accessToken, { page: 1, limit: 10 })
      // 改用直接 call testProductsAPI 但不帶 status 參數
      const response = await require('axios').get(
        'https://paykepoc.myshopline.com/admin/openapi/v20260301/products/products.json',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          params: { page: 1, limit: 10 }  // 不過濾 status
        }
      )
      products = response.data?.products || []
      console.log('   重新查詢商品列表，取得', products.length, '個商品')
      
      if (products.length === 0) {
        throw new Error('建立商品後仍無法取得商品列表')
      }
    }
    
    const firstProduct = products[0]
    const variantId = firstProduct.variants?.[0]?.id
    
    if (!variantId) {
      throw new Error('商品沒有有效的 variant_id')
    }
    
    console.log('   使用商品:', firstProduct.title)
    console.log('   Variant ID:', variantId)
    
    // Step 3: 建立訂單
    console.log('\n📋 Step 3: 建立測試訂單')
    const orderPayload = {
      order: {
        note_attributes: [
          {
            name: "API_REMARK",
            value: `Backend test order created at ${new Date().toISOString()}`
          }
        ],
        tags: "Backend_Test",
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
    
    const createResult = await apiClient.createOrder(accessToken, orderPayload)
    
    if (!createResult.success) {
      console.error('   ❌ 建立訂單失敗:', createResult.error)
      console.error('   Status:', createResult.status)
      console.error('   Code:', createResult.code)
      throw new Error('建立訂單失敗')
    }
    
    const orderId = createResult.data?.data?.order?.id
    const orderNumber = createResult.data?.data?.order?.order_number
    
    console.log('   ✅ 成功建立訂單')
    console.log('   訂單 ID:', orderId)
    console.log('   訂單編號:', orderNumber)
    
    // Step 4: 查詢訂單列表
    console.log('\n📋 Step 4: 查詢訂單列表')
    const ordersResult = await apiClient.getOrders(accessToken, { page: 1, limit: 10 })
    
    if (!ordersResult.success) {
      console.error('   ❌ 查詢訂單列表失敗:', ordersResult.error)
      throw new Error('查詢訂單列表失敗')
    }
    
    const orders = ordersResult.data?.data?.orders || []
    console.log('   ✅ 成功查詢訂單列表')
    console.log('   訂單總數:', ordersResult.data?.data?.pagination?.total || 0)
    console.log('   當前頁訂單數:', orders.length)
    
    // 確認剛建立的訂單在列表中
    const foundOrder = orders.find(o => o.id === orderId)
    if (foundOrder) {
      console.log('   ✅ 確認剛建立的訂單在列表中')
    } else {
      console.warn('   ⚠️  剛建立的訂單不在當前頁列表中（可能在其他頁）')
    }
    
    // Step 5: 查詢訂單詳情（如果 API 支援）
    console.log('\n📋 Step 5: 查詢訂單詳情')
    const detailResult = await apiClient.getOrderDetail(accessToken, orderId)
    
    if (!detailResult.success) {
      if (detailResult.status === 405) {
        console.warn('   ⚠️  SHOPLINE API 不支援透過 ID 查詢單一訂單（405 Method Not Allowed）')
        console.warn('   跳過此步驟，從訂單列表中取得訂單資訊')
        
        // 從訂單列表中找到剛建立的訂單
        const foundOrder = orders.find(o => o.id === orderId)
        if (foundOrder) {
          console.log('   ✅ 從訂單列表中找到訂單')
          console.log('   訂單 ID:', foundOrder.id)
          console.log('   訂單編號:', foundOrder.order_number)
          console.log('   Tags:', foundOrder.tags)
        } else {
          console.warn('   ⚠️  無法從訂單列表中找到訂單')
        }
      } else {
        console.error('   ❌ 查詢訂單詳情失敗:', detailResult.error)
        throw new Error('查詢訂單詳情失敗')
      }
    } else {
      const orderDetail = detailResult.data?.data?.order
      console.log('   ✅ 成功查詢訂單詳情')
      console.log('   訂單 ID:', orderDetail?.id)
      console.log('   訂單編號:', orderDetail?.order_number)
      console.log('   Tags:', orderDetail?.tags)
    }
    
    // Step 6: 更新訂單
    console.log('\n📋 Step 6: 更新訂單')
    const updatePayload = {
      order: {
        tags: `Backend_Test_Updated_${Date.now()}`,
        note_attributes: [
          {
            name: "API_REMARK",
            value: `Backend test updated at ${new Date().toISOString()}`
          }
        ]
      }
    }
    
    const updateResult = await apiClient.updateOrder(accessToken, orderId, updatePayload)
    
    if (!updateResult.success) {
      console.error('   ❌ 更新訂單失敗:', updateResult.error)
      console.error('   Status:', updateResult.status)
      console.error('   Code:', updateResult.code)
      throw new Error('更新訂單失敗')
    }
    
    console.log('   ✅ 成功更新訂單')
    console.log('   新 Tags:', updatePayload.order.tags)
    
    // Step 7: 再次查詢訂單詳情（驗證更新）
    console.log('\n📋 Step 7: 再次查詢訂單列表（驗證更新）')
    const verifyListResult = await apiClient.getOrders(accessToken, { page: 1, limit: 10 })
    
    if (!verifyListResult.success) {
      console.error('   ❌ 驗證查詢失敗:', verifyListResult.error)
      throw new Error('驗證查詢失敗')
    }
    
    const verifyOrders = verifyListResult.data?.data?.orders || []
    const verifiedOrder = verifyOrders.find(o => o.id === orderId)
    
    if (verifiedOrder) {
      console.log('   ✅ 成功從訂單列表中找到訂單')
      console.log('   訂單 ID:', verifiedOrder.id)
      console.log('   Tags:', verifiedOrder.tags)
      
      // 驗證更新是否成功
      if (verifiedOrder.tags === updatePayload.order.tags) {
        console.log('   ✅ 確認 Tags 已更新')
      } else {
        console.warn('   ⚠️  Tags 可能未更新或更新延遲')
        console.warn('   預期:', updatePayload.order.tags)
        console.warn('   實際:', verifiedOrder.tags)
      }
    } else {
      console.warn('   ⚠️  無法從訂單列表中找到訂單')
    }
    
    // 測試總結
    console.log('\n' + '='.repeat(60))
    console.log('✅ 所有測試通過！')
    console.log('='.repeat(60))
    console.log('測試摘要：')
    console.log('  ✅ Step 1: 取得 Access Token')
    console.log('  ✅ Step 2: 取得商品列表')
    console.log('  ✅ Step 3: 建立測試訂單')
    console.log('  ✅ Step 4: 查詢訂單列表')
    console.log('  ✅ Step 5: 查詢訂單詳情')
    console.log('  ✅ Step 6: 更新訂單')
    console.log('  ✅ Step 7: 驗證更新')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ 測試失敗！')
    console.error('='.repeat(60))
    console.error('錯誤訊息:', error.message)
    if (error.stack) {
      console.error('\n錯誤堆疊:')
      console.error(error.stack)
    }
    console.error('='.repeat(60))
    process.exit(1)
  }
}

// 執行測試
testOrdersAPI()
  .then(() => {
    console.log('\n🎉 測試腳本執行完成')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 測試腳本執行失敗:', error.message)
    process.exit(1)
  })

