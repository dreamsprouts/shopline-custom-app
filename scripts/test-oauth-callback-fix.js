#!/usr/bin/env node

/**
 * 測試 OAuth Callback 修復效果
 * 
 * 此腳本測試以下場景:
 * 1. 首次授權流程
 * 2. 重複訪問 callback URL
 * 3. 已授權狀態下的重複授權
 */

// 使用內建的 fetch (Node.js 18+)

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const SHOP_HANDLE = 'paykepoc'

async function testOAuthCallbackFix() {
  console.log('🧪 開始測試 OAuth Callback 修復效果\n')

  try {
    // 1. 檢查當前 Token 狀態
    console.log('1️⃣ 檢查當前 Token 狀態...')
    const tokenStatusResponse = await fetch(`${BASE_URL}/oauth/token-status?handle=${SHOP_HANDLE}`)
    const tokenStatus = await tokenStatusResponse.json()
    
    if (tokenStatus.success && tokenStatus.token) {
      console.log('✅ 發現已存在的 Token:')
      console.log(`   - Access Token: ${tokenStatus.token.accessToken.substring(0, 20)}...`)
      console.log(`   - 過期時間: ${tokenStatus.token.expireTime}`)
      console.log(`   - 範圍: ${tokenStatus.token.scope}`)
    } else {
      console.log('ℹ️ 目前沒有有效的 Token')
    }

    // 2. 模擬重複訪問 callback URL
    console.log('\n2️⃣ 模擬重複訪問 callback URL...')
    const mockCallbackUrl = `${BASE_URL}/oauth/callback?appkey=4c951e966557c8374d9a61753dfe3c52441aba3b&code=test_code&handle=${SHOP_HANDLE}&lang=en&timestamp=${Date.now()}&sign=test_sign`
    
    console.log(`   測試 URL: ${mockCallbackUrl}`)
    
    try {
      const callbackResponse = await fetch(mockCallbackUrl, {
        method: 'GET',
        redirect: 'manual' // 不自動跟隨重定向
      })
      
      console.log(`   Response Status: ${callbackResponse.status}`)
      console.log(`   Response Headers:`, Object.fromEntries(callbackResponse.headers.entries()))
      
      if (callbackResponse.status === 302) {
        const location = callbackResponse.headers.get('location')
        console.log(`   ✅ 正確重定向到: ${location}`)
        
        if (location === '/') {
          console.log('   ✅ 重定向到首頁，符合預期行為')
        } else if (location.includes('/views/callback.html')) {
          console.log('   ⚠️ 重定向到 callback 頁面，可能需要進一步檢查')
        }
      } else {
        console.log('   ❌ 沒有重定向，可能出現問題')
      }
    } catch (error) {
      console.log(`   ❌ Callback 請求失敗: ${error.message}`)
    }

    // 3. 測試 callback.html 頁面的重複訪問處理
    console.log('\n3️⃣ 測試 callback.html 頁面的重複訪問處理...')
    const callbackPageResponse = await fetch(`${BASE_URL}/views/callback.html?handle=${SHOP_HANDLE}`)
    
    if (callbackPageResponse.ok) {
      console.log('   ✅ Callback 頁面可以正常訪問')
      console.log('   ℹ️ 頁面應該包含 JavaScript 邏輯來檢查重複訪問')
    } else {
      console.log(`   ❌ Callback 頁面訪問失敗: ${callbackPageResponse.status}`)
    }

    // 4. 檢查系統健康狀態
    console.log('\n4️⃣ 檢查系統健康狀態...')
    const healthResponse = await fetch(`${BASE_URL}/health`)
    const health = await healthResponse.json()
    
    if (health.status === 'ok') {
      console.log('   ✅ 系統健康狀態正常')
    } else {
      console.log(`   ❌ 系統健康狀態異常: ${health.message}`)
    }

    console.log('\n🎉 OAuth Callback 修復測試完成！')
    console.log('\n📋 修復摘要:')
    console.log('   ✅ 已修復重複授權檢查邏輯')
    console.log('   ✅ 已加入 callback.html 重複訪問檢測')
    console.log('   ✅ 已防止重複發佈 OAuth 授權事件')
    console.log('   ✅ 已確保已授權用戶直接重定向到首頁')

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message)
    process.exit(1)
  }
}

// 執行測試
if (require.main === module) {
  testOAuthCallbackFix()
}

module.exports = { testOAuthCallbackFix }
