const { spawn } = require('child_process')
const axios = require('axios')

/**
 * 啟動 ngrok 並取得公開 URL
 */
async function startNgrok() {
  console.log('🚀 啟動 ngrok tunnel...')
  
  // 設定 ngrok token
  const ngrokProcess = spawn('ngrok', ['http', '3000', '--log', 'stdout'], {
    stdio: ['pipe', 'pipe', 'pipe']
  })
  
  let ngrokUrl = null
  
  ngrokProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log('ngrok:', output)
    
    // 解析 ngrok URL
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/)
    if (urlMatch && !ngrokUrl) {
      ngrokUrl = urlMatch[0]
      console.log('✅ ngrok URL 已取得:', ngrokUrl)
      updateShoplineConfig(ngrokUrl)
    }
  })
  
  ngrokProcess.stderr.on('data', (data) => {
    console.error('ngrok 錯誤:', data.toString())
  })
  
  ngrokProcess.on('close', (code) => {
    console.log(`ngrok 程序結束，代碼: ${code}`)
  })
  
  // 等待 ngrok 啟動
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // 如果沒有從 stdout 取得 URL，嘗試從 API 取得
  if (!ngrokUrl) {
    try {
      const response = await axios.get('http://localhost:4040/api/tunnels')
      const tunnels = response.data.tunnels
      if (tunnels && tunnels.length > 0) {
        ngrokUrl = tunnels[0].public_url
        console.log('✅ 從 API 取得 ngrok URL:', ngrokUrl)
        updateShoplineConfig(ngrokUrl)
      }
    } catch (error) {
      console.error('無法從 ngrok API 取得 URL:', error.message)
    }
  }
  
  return ngrokUrl
}

/**
 * 更新 SHOPLINE 設定資訊
 */
function updateShoplineConfig(ngrokUrl) {
  console.log('')
  console.log('📋 SHOPLINE Developer Center 設定:')
  console.log('='.repeat(50))
  console.log(`App URL: ${ngrokUrl}/oauth/install`)
  console.log(`Callback URL: ${ngrokUrl}/oauth/callback`)
  console.log('')
  console.log('🔗 測試 OAuth 流程:')
  console.log('='.repeat(50))
  console.log(`1. 在 SHOPLINE Developer Center 更新上述 URL`)
  console.log(`2. 訪問: https://paykepoc.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=4c951e966557c8374d9a61753dfe3c52441aba3b&responseType=code&scope=read_products,read_orders&redirectUri=${encodeURIComponent(ngrokUrl + '/oauth/callback')}`)
  console.log('')
  console.log('📊 監控端點:')
  console.log('='.repeat(50))
  console.log(`應用狀態: ${ngrokUrl}/oauth/status`)
  console.log(`健康檢查: ${ngrokUrl}/health`)
  console.log('')
}

// 如果直接執行此腳本
if (require.main === module) {
  startNgrok().catch(console.error)
}

module.exports = { startNgrok }
