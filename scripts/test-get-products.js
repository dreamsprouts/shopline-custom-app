/**
 * 測試 getProducts API
 */

const database = require('../utils/database-postgres')
const ShoplineAPIClient = require('../utils/shopline-api')

async function testGetProducts() {
  try {
    console.log('🔍 [測試] 開始測試 getProducts API')
    console.log('=' .repeat(60))
    
    // 1. 初始化資料庫
    console.log('\n📊 [步驟 1] 初始化資料庫...')
    await database.init()
    console.log('✅ 資料庫連線成功')
    
    // 2. 取得 Access Token
    console.log('\n🔑 [步驟 2] 取得 Access Token...')
    const tokenRecord = await database.getToken('paykepoc')
    
    if (!tokenRecord || !tokenRecord.accessToken) {
      throw new Error('找不到有效的 Access Token')
    }
    
    console.log('✅ Token 已取得')
    console.log('  Shop Handle:', tokenRecord.handle)
    console.log('  Token (前10字):', tokenRecord.accessToken.substring(0, 10) + '...')
    
    // 3. 測試 getProducts
    console.log('\n📦 [步驟 3] 呼叫 getProducts API...')
    const apiClient = new ShoplineAPIClient()
    
    const params = {
      page: 1,
      limit: 10,
      status: 'active'
    }
    
    console.log('  參數:', params)
    
    const result = await apiClient.getProducts(tokenRecord.accessToken, params)
    
    console.log('\n📋 [結果] API 回應:')
    console.log('  success:', result.success)
    console.log('  status:', result.status)
    
    if (!result.success) {
      console.error('❌ API 呼叫失敗')
      console.error('  error:', result.error)
      console.error('  data:', JSON.stringify(result.data, null, 2))
      return
    }
    
    console.log('  result.data 完整結構:')
    console.log(JSON.stringify(result.data, null, 2))
    
    console.log('\n  data 解析:')
    console.log('    - data keys:', Object.keys(result.data || {}))
    console.log('    - data.code:', result.data?.code)
    console.log('    - data.message:', result.data?.message)
    console.log('    - data.data keys:', Object.keys(result.data?.data || {}))
    
    const products = result.data?.data?.products || []
    console.log('    - products count:', products.length)
    
    if (products.length === 0) {
      console.warn('\n⚠️  警告：沒有找到商品！')
      console.log('可能原因：')
      console.log('  1. 商店中確實沒有商品')
      console.log('  2. status: "active" 過濾掉了所有商品')
      console.log('  3. API 權限不足')
      
      // 嘗試不帶 status 參數
      console.log('\n🔄 [重試] 嘗試不帶 status 參數...')
      const retryResult = await apiClient.getProducts(tokenRecord.accessToken, {
        page: 1,
        limit: 10
      })
      
      const allProducts = retryResult.data?.data?.products || []
      console.log('  不帶 status 的商品數:', allProducts.length)
      
      if (allProducts.length > 0) {
        console.log('\n✅ 找到商品了！商品狀態分佈:')
        const statusCount = {}
        allProducts.forEach(p => {
          statusCount[p.status] = (statusCount[p.status] || 0) + 1
        })
        console.log('  ', statusCount)
        
        // 顯示第一個商品詳情
        const firstProduct = allProducts[0]
        console.log('\n📦 第一個商品詳情:')
        console.log('  id:', firstProduct.id)
        console.log('  title:', firstProduct.title)
        console.log('  handle:', firstProduct.handle)
        console.log('  status:', firstProduct.status)
        console.log('  variants count:', firstProduct.variants?.length || 0)
        
        if (firstProduct.variants && firstProduct.variants.length > 0) {
          const variant = firstProduct.variants[0]
          console.log('\n  第一個 Variant:')
          console.log('    id:', variant.id)
          console.log('    sku:', variant.sku)
          console.log('    price:', variant.price)
        }
      }
    } else {
      console.log('\n✅ 找到商品！')
      
      const firstProduct = products[0]
      console.log('\n📦 第一個商品詳情:')
      console.log('  id:', firstProduct.id)
      console.log('  title:', firstProduct.title)
      console.log('  handle:', firstProduct.handle)
      console.log('  status:', firstProduct.status)
      console.log('  variants count:', firstProduct.variants?.length || 0)
      
      if (firstProduct.variants && firstProduct.variants.length > 0) {
        const variant = firstProduct.variants[0]
        console.log('\n  第一個 Variant:')
        console.log('    id:', variant.id)
        console.log('    sku:', variant.sku)
        console.log('    price:', variant.price)
      } else {
        console.error('\n❌ 商品沒有 variants！')
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ [完成] 測試完成')
    
  } catch (error) {
    console.error('\n❌ [錯誤] 測試失敗:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await database.close()
    console.log('📊 資料庫連線已關閉')
  }
}

// 執行測試
testGetProducts()

