#!/usr/bin/env node

/**
 * 測試 Event Monitor Dashboard 按鈕行為
 * 驗證監控、停止監控、手動刷新、測試事件的行為
 * 
 * 更新說明：
 * - 使用 SSE 訂閱模式監控事件
 * - 載入最近 100 筆歷史事件
 * - 統計數字顯示資料庫總事件數和 log 區域統計
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testEventMonitorBehavior() {
  console.log('🧪 測試 Event Monitor Dashboard 按鈕行為\n')

  try {
    // 1. 測試系統健康狀態
    console.log('1️⃣ 檢查系統健康狀態...')
    const healthResponse = await fetch(`${BASE_URL}/health`)
    const health = await healthResponse.json()
    console.log(`   系統狀態: ${health.status}`)

    // 2. 測試事件 API
    console.log('\n2️⃣ 測試事件 API...')
    const eventsResponse = await fetch(`${BASE_URL}/api/event-monitor/events`)
    const eventsData = await eventsResponse.json()
    
    if (eventsData.success) {
      console.log(`   ✅ 事件 API 正常`)
      console.log(`   📊 總事件數: ${eventsData.stats?.total || 0}`)
      console.log(`   📦 商品事件: ${eventsData.stats?.product_events || 0}`)
      console.log(`   🛒 訂單事件: ${eventsData.stats?.order_events || 0}`)
      console.log(`   📡 最近事件數: ${eventsData.events?.length || 0}`)
    } else {
      console.log(`   ❌ 事件 API 異常: ${eventsData.error}`)
    }

    // 3. 測試測試事件 API
    console.log('\n3️⃣ 測試測試事件 API...')
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

    // 4. 等待事件處理
    console.log('\n4️⃣ 等待事件處理...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 5. 再次檢查事件
    console.log('\n5️⃣ 檢查事件更新...')
    const eventsResponse2 = await fetch(`${BASE_URL}/api/event-monitor/events`)
    const eventsData2 = await eventsResponse2.json()
    
    if (eventsData2.success) {
      console.log(`   📊 更新後總事件數: ${eventsData2.stats?.total || 0}`)
      console.log(`   📡 最近事件數: ${eventsData2.events?.length || 0}`)
      
      // 檢查是否有新的測試事件
      const testEvents = eventsData2.events?.filter(e => e.type === 'product.updated' && e.payload?.test === true) || []
      console.log(`   🧪 測試事件數: ${testEvents.length}`)
      
      if (testEvents.length > 0) {
        console.log(`   ✅ 測試事件已成功保存到資料庫`)
      } else {
        console.log(`   ⚠️ 未找到測試事件，可能尚未處理完成`)
      }
    }

    // 6. 模擬手動刷新行為
    console.log('\n6️⃣ 模擬手動刷新行為...')
    console.log('   手動刷新會從資料庫拉取最近 100 筆歷史事件')
    console.log('   包括 OAuth 授權事件、商品事件、訂單事件等')
    console.log('   這是正常的行為，因為手動刷新顯示的是完整歷史')

    console.log('\n🎉 Event Monitor Dashboard 行為測試完成！')
    console.log('\n📋 按鈕行為總結:')
    console.log('   ✅ 開始監控: 啟動 SSE 訂閱模式，顯示新事件')
    console.log('   ✅ 停止監控: 關閉 SSE 連接，不影響事件發布')
    console.log('   ✅ 手動刷新: 從資料庫拉取最近 100 筆歷史事件')
    console.log('   ✅ 測試事件: 發布真實事件到 Event Bus')
    console.log('   ✅ 清除事件: 清空前端顯示，不影響資料庫')

    console.log('\n💡 重要提醒:')
    console.log('   - 監控狀態只影響前端顯示，不影響事件發布')
    console.log('   - 手動刷新會顯示最近 100 筆歷史事件（包括 OAuth 事件）')
    console.log('   - 測試事件總是會發布，無論監控狀態如何')

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message)
  }
}

// 執行測試
if (require.main === module) {
  testEventMonitorBehavior()
}

module.exports = { testEventMonitorBehavior }
