# Vercel 修復完整摘要

## 🐛 問題
1. Event Bus 無法運作
2. Order API 返回 405 Method Not Allowed 錯誤

## 🔍 根本原因

**Vercel 路由衝突**: `api/test/index.js` 作為檔案存在時，Vercel 無法處理同目錄下的子路徑（如 `api/test/orders/create.js`）

## ✅ 修復步驟

### 1. 重新命名衝突檔案
```bash
mv api/test/index.js api/test/unified.js
```

### 2. 更新 vercel.json 路由
```json
{
  "source": "/api/test/shop",
  "destination": "/api/test/unified?type=shop"
},
{
  "source": "/api/test/products",
  "destination": "/api/test/unified?type=products"
}
```

### 3. 移除舊的 orders 路由
移除這行：
```json
{
  "source": "/api/test/orders",
  "destination": "/api/test?type=orders"
}
```

### 4. 保留新的 orders 路由
```json
{
  "source": "/api/test/orders/create",
  "destination": "/api/test/orders/create"
},
{
  "source": "/api/test/orders/list",
  "destination": "/api/test/orders/list"
},
{
  "source": "/api/test/orders/:id",
  "destination": "/api/test/orders/[id]"
}
```

## 📁 最終檔案結構

```
api/
├── test/
│   ├── unified.js          # 重命名後的統一 API
│   └── orders/
│       ├── create.js       # POST /api/test/orders/create
│       ├── list.js         # GET /api/test/orders/list
│       └── [id].js         # GET/PUT /api/test/orders/:id
└── ...
```

## 🚀 部署後驗證

### 1. 檢查 Orders API
- [ ] 開啟瀏覽器開發者工具（F12）
- [ ] 點擊「建立訂單」按鈕
- [ ] 檢查 Network 標籤，確認請求 URL 為 `/api/test/orders/create`
- [ ] 確認回應為 200 OK

### 2. 檢查 Event Bus
- [ ] 前往 Event Monitor Dashboard
- [ ] 檢查 Event Bus 狀態是否為「線上」

## 📝 注意事項

1. 清空瀏覽器快取並重新載入頁面
2. 確認 Vercel 環境變數已設定：
   - `USE_EVENT_BUS=true`
   - `ENABLE_SHOPLINE_SOURCE=true`
3. 如果仍有問題，嘗試硬刷新（Cmd+Shift+R 或 Ctrl+Shift+R）

## 🎯 修復檔案清單

### 修改檔案
- `vercel.json` - 路由設定
- `api/test/index.js` → `api/test/unified.js` - 檔案重新命名

### 不變檔案
- `api/test/orders/create.js` - 已建立
- `api/test/orders/list.js` - 已建立
- `api/test/orders/[id].js` - 已存在
