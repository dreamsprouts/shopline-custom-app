const axios = require('axios')
const { generateHmacSha256, signGetRequest } = require('../utils/signature')
const config = require('../config.json')

/**
 * 測試 OAuth 流程的完整腳本
 */
async function testOAuthFlow() {
  console.log('🧪 開始測試 OAuth 流程...')
  
  try {
    // 測試 1: 檢查應用狀態
    console.log('\n1️⃣ 測試應用狀態端點')
    const statusResponse = await axios.get('http://localhost:3000/oauth/status')
    console.log('✅ 應用狀態:', statusResponse.data)
    
    // 測試 2: 模擬 SHOPLINE 安裝請求
    console.log('\n2️⃣ 模擬 SHOPLINE 安裝請求')
    const timestamp = Date.now().toString()
    const handle = config.shop_handle
    const lang = 'zh-hant-tw'
    
    const installParams = {
      appkey: config.app_key,
      handle: handle,
      timestamp: timestamp,
      lang: lang
    }
    
    // 生成簽名
    const sign = signGetRequest(installParams, config.app_secret)
    installParams.sign = sign
    
    console.log('📤 發送安裝請求參數:', installParams)
    
    // 發送請求到安裝端點
    const installResponse = await axios.get('http://localhost:3000/oauth/install', {
      params: installParams,
      maxRedirects: 0,
      validateStatus: (status) => status < 400
    })
    
    console.log('✅ 安裝請求回應狀態:', installResponse.status)
    console.log('📍 重導向位置:', installResponse.headers.location)
    
    // 測試 3: 驗證簽名生成
    console.log('\n3️⃣ 測試簽名生成和驗證')
    const testSource = 'appkey=test&handle=test&timestamp=1234567890'
    const testSignature = generateHmacSha256(testSource, config.app_secret)
    console.log('✅ 測試簽名生成成功:', testSignature)
    
    // 測試 4: 檢查健康狀態
    console.log('\n4️⃣ 測試健康檢查端點')
    const healthResponse = await axios.get('http://localhost:3000/health')
    console.log('✅ 健康狀態:', healthResponse.data)
    
    console.log('\n🎉 所有測試完成！')
    console.log('\n📋 下一步:')
    console.log('1. 啟動 ngrok: node scripts/start-ngrok.js')
    console.log('2. 更新 SHOPLINE Developer Center 設定')
    console.log('3. 測試完整的 OAuth 流程')
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message)
    if (error.response) {
      console.error('回應狀態:', error.response.status)
      console.error('回應資料:', error.response.data)
    }
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  testOAuthFlow().catch(console.error)
}

module.exports = { testOAuthFlow }
