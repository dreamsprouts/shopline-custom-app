# Event Bus 最終修復報告

## 🔥 問題

本地測試正常，Vercel 正式部署後 Event Bus 完全不運作：
- Event Bus 狀態顯示「離線」
- 不會發佈任何事件
- Event Monitor 收不到事件

## 🔍 根本原因

**Vercel 環境變數錯誤設定**

雖然在 Vercel Dashboard 看到環境變數已設定，但實際值為：
- `USE_EVENT_BUS="false"` ❌
- `ENABLE_SHOPLINE_SOURCE="false"` ❌

應該要是：
- `USE_EVENT_BUS="true"` ✅
- `ENABLE_SHOPLINE_SOURCE="true"` ✅

## ✅ 修復步驟

### 1. 檢查環境變數值
```bash
vercel env pull .env.vercel
cat .env.vercel | grep -E "(USE_EVENT_BUS|ENABLE_SHOPLINE)"
# 發現都是 "false"
```

### 2. 刪除並重新設定環境變數
```bash
# 刪除舊的環境變數
vercel env rm USE_EVENT_BUS production --yes
vercel env rm ENABLE_SHOPLINE_SOURCE production --yes

# 重新設定為 true
echo "true" | vercel env add USE_EVENT_BUS production
echo "true" | vercel env add ENABLE_SHOPLINE_SOURCE production
```

### 3. 重新部署
```bash
vercel --prod --yes
```

## 📝 驗證

部署完成後檢查：

1. **Event Monitor Dashboard**
   - Event Bus 狀態應該顯示「線上」✅
   - Source Connector 狀態應該顯示「啟用」✅

2. **測試事件發佈**
   - 點擊「測試事件發布」
   - 應該可以看到事件出現在列表中 ✅

3. **API 測試**
   - 呼叫任何 Shopline API
   - 應該會自動發佈事件到 Event Bus ✅

## 🎯 教訓

1. **永遠不要假設環境變數設定正確**
   - 必須用 `vercel env pull` 驗證實際值
   - 不要只看 Vercel Dashboard 顯示

2. **環境變數可能因為各種原因變成錯誤值**
   - 可能在設定時輸入錯誤
   - 可能因為複製貼上問題
   - 可能被其他部署覆蓋

3. **本地和 Vercel 環境要分別驗證**
   - 本地用 `.env.local`
   - Vercel 用 `vercel env`
   - 兩者是獨立的

## 🚀 預防措施

### 建議 1: 使用環境變數管理指令碼

建立 `scripts/vercel-env-setup.sh`:

```bash
#!/bin/bash
# 設定 Event Bus 相關環境變數

vercel env rm USE_EVENT_BUS production --yes
echo "true" | vercel env add USE_EVENT_BUS production

vercel env rm ENABLE_SHOPLINE_SOURCE production --yes
echo "true" | vercel env add ENABLE_SHOPLINE_SOURCE production

echo "✅ 環境變數設定完成"
```

### 建議 2: 建立環境變數檢查指令碼

建立 `scripts/check-env.js`:

```javascript
const { execSync } = require('child_process')

function checkEnv() {
  console.log('🔍 檢查環境變數...\n')
  
  // 檢查本地環境變數
  const localEnv = require('dotenv').config({ path: '.env.local' })
  
  console.log('📁 本地環境變數:')
  console.log(`  USE_EVENT_BUS=${localEnv.parsed?.USE_EVENT_BUS}`)
  console.log(`  ENABLE_SHOPLINE_SOURCE=${localEnv.parsed?.ENABLE_SHOPLINE_SOURCE}`)
  
  // 檢查 Vercel 環境變數
  try {
    execSync('vercel env pull .env.vercel.tmp')
    const vercelEnv = require('dotenv').config({ path: '.env.vercel.tmp' })
    
    console.log('\n☁️  Vercel 環境變數:')
    console.log(`  USE_EVENT_BUS=${vercelEnv.parsed?.USE_EVENT_BUS}`)
    console.log(`  ENABLE_SHOPLINE_SOURCE=${vercelEnv.parsed?.ENABLE_SHOPLINE_SOURCE}`)
    
    // 比較並警告
    if (localEnv.parsed?.USE_EVENT_BUS !== vercelEnv.parsed?.USE_EVENT_BUS) {
      console.warn('⚠️  警告：USE_EVENT_BUS 本地和 Vercel 不一致！')
    }
    
    execSync('rm .env.vercel.tmp')
  } catch (error) {
    console.error('❌ 無法檢查 Vercel 環境變數:', error.message)
  }
}

checkEnv()
```

### 建議 3: 加入 CI/CD 檢查

在 GitHub Actions 中加入環境變數驗證步驟。

## 📚 相關文件

- [Vercel 環境變數文件](https://vercel.com/docs/concepts/projects/environment-variables)
- [Event Bus 修復摘要](./VERCEL_FIX_SUMMARY.md)
- [Vercel 部署記錄](./VERCEL_DEPLOYMENT_COMPLETE.md)

## ✅ 確認清單

部署前必做：
- [ ] 檢查本地環境變數
- [ ] 用 `vercel env pull` 檢查 Vercel 環境變數
- [ ] 確認兩者一致
- [ ] 測試本地功能
- [ ] 部署到 Vercel
- [ ] 測試 Vercel 功能
- [ ] 檢查 Event Monitor Dashboard
