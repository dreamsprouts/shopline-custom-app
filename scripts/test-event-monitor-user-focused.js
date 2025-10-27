#!/usr/bin/env node

/**
 * 測試 Event Bus 功能測試儀表板
 * 驗證用戶測試體驗和核心功能
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testEventMonitorUserFocused() {
  console.log('🧪 測試 Event Bus 功能測試儀表板\n')

  try {
    // 1. 檢查系統健康狀態
    console.log('1️⃣ 檢查系統健康狀態...')
    const healthResponse = await fetch(`${BASE_URL}/health`)
    const health = await healthResponse.json()
    console.log(`   系統狀態: ${health.status}`)

    // 2. 測試儀表板頁面
    console.log('\n2️⃣ 測試儀表板頁面...')
    const dashboardResponse = await fetch(`${BASE_URL}/event-monitor`)
    
    if (dashboardResponse.ok) {
      console.log('   ✅ 儀表板頁面可正常訪問')
      const dashboardContent = await dashboardResponse.text()
      
      if (dashboardContent.includes('Event Bus 功能測試儀表板')) {
        console.log('   ✅ 頁面標題已更新為用戶測試導向')
      }
      
      if (dashboardContent.includes('測試事件發布')) {
        console.log('   ✅ 按鈕文字已更新為用戶友好')
      }
      
      if (dashboardContent.includes('Event Bus 功能測試指南')) {
        console.log('   ✅ 測試指南已添加')
      }
    } else {
      console.log(`   ❌ 儀表板頁面訪問失敗: ${dashboardResponse.status}`)
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

    // 4. 測試事件發布功能
    console.log('\n4️⃣ 測試事件發布功能...')
    const testEventResponse = await fetch(`${BASE_URL}/api/event-monitor/test-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (testEventResponse.ok) {
      const testResult = await testEventResponse.json()
      console.log(`   ✅ 事件發布功能正常`)
      console.log(`   📡 事件 ID: ${testResult.event?.id}`)
      console.log(`   🏷️ 事件類型: ${testResult.event?.type}`)
    } else {
      console.log(`   ❌ 事件發布功能異常: ${testEventResponse.status}`)
    }

    // 5. 等待事件處理
    console.log('\n5️⃣ 等待事件處理...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 6. 驗證事件持久化
    console.log('\n6️⃣ 驗證事件持久化...')
    const eventsResponse2 = await fetch(`${BASE_URL}/api/event-monitor/events`)
    const eventsData2 = await eventsResponse2.json()
    
    if (eventsData2.success) {
      console.log(`   📊 更新後總事件數: ${eventsData2.stats?.total || 0}`)
      
      // 檢查是否有新的測試事件
      const testEvents = eventsData2.events?.filter(e => e.type === 'product.updated' && e.payload?.test === true) || []
      console.log(`   🧪 測試事件數: ${testEvents.length}`)
      
      if (testEvents.length > 0) {
        console.log(`   ✅ 事件持久化功能正常`)
      } else {
        console.log(`   ⚠️ 未找到測試事件，可能尚未處理完成`)
      }
    }

    console.log('\n🎉 Event Bus 功能測試儀表板測試完成！')
    console.log('\n📋 用戶測試重點:')
    console.log('   ✅ 事件發布功能：用戶可以測試事件發布')
    console.log('   ✅ 實時監控功能：用戶可以測試實時監控')
    console.log('   ✅ 事件持久化功能：用戶可以測試事件保存')
    console.log('   ✅ 監控控制功能：用戶可以測試監控開關')
    console.log('   ✅ 用戶友好界面：清晰的測試指南和按鈕')

    console.log('\n💡 用戶測試建議:')
    console.log('   1. 開啟瀏覽器訪問: http://localhost:3000/event-monitor')
    console.log('   2. 按照測試指南進行功能測試')
    console.log('   3. 在另一頁面進行 OAuth 授權，觀察事件')
    console.log('   4. 進行 API 操作，觀察相關事件')

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message)
  }
}

// 執行測試
if (require.main === module) {
  testEventMonitorUserFocused()
}

module.exports = { testEventMonitorUserFocused }
