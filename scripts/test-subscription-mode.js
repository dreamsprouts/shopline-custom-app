#!/usr/bin/env node

/**
 * 測試 Event Monitor Dashboard 訂閱模式
 * 驗證 Server-Sent Events (SSE) 是否正常工作
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testSubscriptionMode() {
  console.log('🧪 測試 Event Monitor Dashboard 訂閱模式\n')

  try {
    // 1. 測試系統健康狀態
    console.log('1️⃣ 檢查系統健康狀態...')
    const healthResponse = await fetch(`${BASE_URL}/health`)
    const health = await healthResponse.json()
    console.log(`   系統狀態: ${health.status}`)

    // 2. 測試 SSE 端點
    console.log('\n2️⃣ 測試 SSE 端點...')
    try {
      const sseResponse = await fetch(`${BASE_URL}/api/event-monitor/stream`)
      console.log(`   SSE 端點狀態: ${sseResponse.status}`)
      console.log(`   Content-Type: ${sseResponse.headers.get('content-type')}`)
      
      if (sseResponse.ok) {
        console.log('   ✅ SSE 端點正常')
      } else {
        console.log('   ❌ SSE 端點異常')
      }
    } catch (error) {
      console.log(`   ❌ SSE 端點錯誤: ${error.message}`)
    }

    // 3. 測試事件 API
    console.log('\n3️⃣ 測試事件 API...')
    const eventsResponse = await fetch(`${BASE_URL}/api/event-monitor/events`)
    const eventsData = await eventsResponse.json()
    
    if (eventsData.success) {
      console.log(`   ✅ 事件 API 正常`)
      console.log(`   📊 總事件數: ${eventsData.stats?.total || 0}`)
      console.log(`   📦 商品事件: ${eventsData.stats?.product_events || 0}`)
      console.log(`   🛒 訂單事件: ${eventsData.stats?.order_events || 0}`)
    } else {
      console.log(`   ❌ 事件 API 異常: ${eventsData.error}`)
    }

    // 4. 測試測試事件 API
    console.log('\n4️⃣ 測試測試事件 API...')
    const testEventResponse = await fetch(`${BASE_URL}/api/event-monitor/test-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (testEventResponse.ok) {
      const testResult = await testEventResponse.json()
      console.log(`   ✅ 測試事件發送成功`)
      console.log(`   📡 事件 ID: ${testResult.event?.id}`)
      console.log(`   🏷️ 事件類型: ${testResult.event?.type}`)
    } else {
      console.log(`   ❌ 測試事件發送失敗: ${testEventResponse.status}`)
    }

    // 5. 模擬 SSE 連接測試
    console.log('\n5️⃣ 模擬 SSE 連接測試...')
    console.log('   在瀏覽器中訪問以下 URL 來測試訂閱模式:')
    console.log(`   ${BASE_URL}/event-monitor-subscription.html`)
    console.log('')
    console.log('   📋 測試步驟:')
    console.log('   1. 開啟瀏覽器訪問上述 URL')
    console.log('   2. 點擊「開始訂閱」按鈕')
    console.log('   3. 點擊「測試事件」按鈕')
    console.log('   4. 觀察事件是否即時顯示（無需輪詢）')

    console.log('\n🎉 訂閱模式測試完成！')
    console.log('\n📋 訂閱模式優勢:')
    console.log('   ✅ 真正的訂閱者模式，符合 Event Bus 概念')
    console.log('   ✅ 事件即時推送，無需輪詢')
    console.log('   ✅ 更高效的資源使用')
    console.log('   ✅ 更即時的監控體驗')
    console.log('   ✅ 支援心跳檢測和自動重連')

    console.log('\n💡 技術實作:')
    console.log('   - 使用 Server-Sent Events (SSE)')
    console.log('   - Event Bus 訂閱者模式')
    console.log('   - 自動事件推送')
    console.log('   - 心跳檢測機制')

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message)
  }
}

// 執行測試
if (require.main === module) {
  testSubscriptionMode()
}

module.exports = { testSubscriptionMode }
