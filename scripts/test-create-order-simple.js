/**
 * 簡化版建立訂單測試
 * 直接測試完整流程：取得商品 -> 建立訂單
 */

const database = require('../utils/database-postgres')
const ShoplineAPIClient = require('../utils/shopline-api')

async function testCreateOrder() {
  try {
    console.log('🔍 [測試] 開始測試建立訂單完整流程')
    console.log('='.repeat(60))
    
    // 1. 初始化
    await database.init()
    const tokenRecord = await database.getToken('paykepoc')
    
    if (!tokenRecord || !tokenRecord.accessToken) {
      throw new Error('找不到 Token')
    }
    
    console.log('✅ Token 已取得')
    
    const apiClient = new ShoplineAPIClient()
    const accessToken = tokenRecord.accessToken
    
    // 2. 取得商品
    console.log('\n📦 [步驟 1] 取得商品列表...')
    const productsResult = await apiClient.getProducts(accessToken, {
      page: 1,
      limit: 10,
      status: 'active'
    })
    
    if (!productsResult.success) {
      throw new Error('取得商品失敗: ' + productsResult.error)
    }
    
    const products = productsResult.data?.products || []
    console.log(`✅ 找到 ${products.length} 個商品`)
    
    if (products.length === 0) {
      throw new Error('沒有商品')
    }
    
    const firstProduct = products[0]
    const variants = firstProduct.variants || []
    
    if (variants.length === 0) {
      throw new Error('商品沒有 variants')
    }
    
    const variantId = variants[0].id
    console.log(`✅ 使用商品: ${firstProduct.title}`)
    console.log(`✅ 使用 variant_id: ${variantId}`)
    
    // 3. 建立訂單
    console.log('\n🛒 [步驟 2] 建立訂單...')
    
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
    
    console.log('📋 Payload:')
    console.log(JSON.stringify(orderData, null, 2))
    
    const result = await apiClient.createOrder(accessToken, orderData)
    
    console.log('\n📋 [結果] 建立訂單 API 回應:')
    console.log('  success:', result.success)
    console.log('  status:', result.status)
    console.log('  error:', result.error)
    console.log('  code:', result.code)
    
    if (result.success) {
      console.log('\n✅ 訂單建立成功！')
      console.log('  Order ID:', result.data?.data?.order?.id)
      console.log('  Order Number:', result.data?.data?.order?.order_number)
    } else {
      console.error('\n❌ 訂單建立失敗')
      console.error('完整回應:')
      console.error(JSON.stringify(result, null, 2))
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ [完成] 測試完成')
    
  } catch (error) {
    console.error('\n❌ [錯誤] 測試失敗:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await database.close()
  }
}

testCreateOrder()

