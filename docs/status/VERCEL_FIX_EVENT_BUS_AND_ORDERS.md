# Vercel 正式機 Event Bus 和 Orders 功能修復報告

## 📋 問題描述

在 Vercel 正式機上發現以下問題：
1. Event Bus 無法運作 - 顯示 "Event Bus: 離線"
2. Order 相關函數無法運作 - 405 Method Not Allowed 錯誤

## 🔍 根本原因分析

### 問題 1: Vercel 缺少必要的 Serverless Functions

**發現的問題**:
- `api/test/orders/create.js` 不存在
- `api/test/orders/list.js` 不存在
- `vercel.json` 路由設定不完整

**影響**:
- 前端在 Vercel 上請求 `/api/test/orders/create` 和 `/api/test/orders/list` 時返回 404 或 500 錯誤

### 問題 2: 環境變數未設定

**發現的問題**:
- Vercel 生產環境可能未設定 `USE_EVENT_BUS=true`
- Vercel 生產環境可能未設定 `ENABLE_SHOPLINE_SOURCE=true`

**影響**:
- Event Bus 預設為停用狀態
- Shopline Source Connector 不會發布事件

### 問題 3: 前端端點不一致

**發現的問題**:
- 前端 `getOrdersAPI()` 在 Vercel 環境使用錯誤的端點
- 前端使用 `/api/test/orders` 而非 `/api/test/orders/list`

## ✅ 修復內容

### 修復 1: 建立缺失的 Vercel Functions

**新增檔案**:
- `api/test/orders/create.js` - 建立訂單 API
- `api/test/orders/list.js` - 查詢訂單列表 API

**程式碼實作**:
- 與 `server.js` 的邏輯保持一致
- 正確處理 CORS、認證、錯誤處理
- 使用 `ShoplineAPIClientWrapper` 進行 API 呼叫

### 修復 2: 更新 vercel.json 路由

**更新的路由**:
```json
{
  "source": "/api/test/orders/create",
  "destination": "/api/test/orders/create"
},
{
  "source": "/api/test/orders/list",
  "destination": "/api/test/orders/list"
}
```

### 修復 3: 更新前端端點

**修改檔案**: `public/js/app.js`

**修改內容**:
```javascript
// 修正前
const endpoint = '/api/test/orders?page=1&limit=10'

// 修正後
const endpoint = window.location.hostname.includes('vercel.app') 
    ? '/api/test/orders/list?page=1&limit=10'
    : '/api/test/orders?page=1&limit=10'
```

## 🚀 部署步驟

### 1. 提交變更到 Git

```bash
git add .
git commit -m "fix: 修復 Vercel 正式機 Event Bus 和 Orders 功能"
git push origin main
```

### 2. Vercel 自動部署

推送到 `main` 分支後，Vercel 會自動觸發部署。

### 3. 設定 Vercel 環境變數

在 Vercel Dashboard 設定以下環境變數：

```bash
USE_EVENT_BUS=true
ENABLE_SHOPLINE_SOURCE=true
```

**設定步驟**:
1. 前往 Vercel Dashboard → 你的專案 → Settings → Environment Variables
2. 新增以下環境變數:
   - `USE_EVENT_BUS` = `true`
   - `ENABLE_SHOPLINE_SOURCE` = `true`
3. 選擇環境: Production, Preview, Development
4. 點擊 Save

### 4. 重新部署

```bash
# 觸發重新部署（如果環境變數是在部署後才設定的）
vercel --prod
```

或直接在 Vercel Dashboard → Deployments → 選擇最新部署 → Redeploy

## 🧪 驗證測試

### 測試項目 1: Orders API

1. 開啟生產環境網址
2. 點擊「建立訂單」按鈕
3. 預期結果: ✅ 成功建立訂單，返回 Order ID
4. 點擊「查詢訂單列表」按鈕
5. 預期結果: ✅ 成功查詢訂單列表

### 測試項目 2: Event Bus

1. 開啟生產環境 Event Monitor Dashboard
2. 預期結果: ✅ Event Bus 狀態顯示「線上」
3. 點擊「開始監控」
4. 預期結果: ✅ 連接狀態顯示「已連接」
5. 點擊「測試事件發布」
6. 預期結果: ✅ 事件出現在事件列表中

## 📋 修復檔案清單

### 新增檔案
- `api/test/orders/create.js`
- `api/test/orders/list.js`
- `docs/status/VERCEL_FIX_EVENT_BUS_AND_ORDERS.md`

### 修改檔案
- `vercel.json` - 新增 Orders API 路由
- `public/js/app.js` - 修正查詢訂單列表端點

## 🔄 後續維護

### 定期檢查項目

1. **環境變數檢查**
   - 確認 Vercel 環境變數設定正確
   - 檢查新部署後環境變數是否生效

2. **路由一致性**
   - 新增 API 時，必須同時建立本地路由和 Vercel Function
   - 更新 `vercel.json` 路由設定
   - 更新前端環境偵測邏輯

3. **測試覆蓋**
   - 所有新功能都應該在本地和 Vercel 環境測試
   - 使用 `vercel dev` 進行本地 Vercel 環境測試

## 📚 相關文件

- [Vercel 架構文件](./architecture/VERCEL_ARCHITECTURE.md)
- [Sprint 2 完成報告](./status/SPRINT2_COMPLETION_REPORT.md)
- [Vercel 部署記錄](./status/VERCEL_DEPLOYMENT_COMPLETE.md)

## 📝 注意事項

1. **環境變數優先級**: Vercel 環境變數會覆蓋 `.env.local` 設定
2. **快取問題**: 如果部署後仍有問題，請清除瀏覽器快取
3. **監控日誌**: 可以透過 Vercel Dashboard → Deployments → Functions 查看執行日誌

## 🎯 總結

此次修復主要解決了三個問題：
1. ✅ 建立缺失的 Orders API Vercel Functions
2. ✅ 更新路由設定和前端端點
3. ✅ 提供環境變數設定指南

修復後，Vercel 正式機上的 Event Bus 和 Orders 功能應該可以正常運作。
