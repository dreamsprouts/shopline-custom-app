// 測試 Vercel Functions 在本地環境
const database = require('./utils/database-postgres')

async function testDatabase() {
  try {
    console.log('🧪 測試 PostgreSQL 資料庫連接...')
    
    // 初始化資料庫
    await database.init()
    console.log('✅ 資料庫初始化成功')
    
    // 測試儲存 Token
    const testToken = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      expireTime: new Date(Date.now() + 3600000).toISOString(),
      refreshExpireTime: new Date(Date.now() + 86400000).toISOString(),
      scope: 'read_store_information,read_products,write_products'
    }
    
    await database.saveToken('test-shop', testToken)
    console.log('✅ Token 儲存成功')
    
    // 測試讀取 Token
    const retrievedToken = await database.getToken('test-shop')
    console.log('✅ Token 讀取成功:', retrievedToken)
    
    // 測試刪除 Token
    await database.deleteToken('test-shop')
    console.log('✅ Token 刪除成功')
    
    console.log('🎉 所有資料庫測試通過！')
    
  } catch (error) {
    console.error('❌ 資料庫測試失敗:', error.message)
    process.exit(1)
  } finally {
    await database.close()
  }
}

// 執行測試
testDatabase()
