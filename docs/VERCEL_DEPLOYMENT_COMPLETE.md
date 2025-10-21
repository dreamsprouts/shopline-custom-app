# Vercel 部署完整記錄

## 📋 部署概況

### 基本資訊
- **專案名稱**: shopline-custom-app
- **Vercel 網址**: https://shopline-custom-app.vercel.app
- **GitHub 倉庫**: https://github.com/dreamsprouts/shopline-custom-app
- **部署時間**: 2025-10-21
- **狀態**: ✅ 部署成功

### 技術架構
- **前端**: Vanilla JavaScript + HTML + Tailwind CSS（靜態託管）
- **後端**: Vercel Serverless Functions
- **資料庫**: Prisma Postgres（Tokyo, Japan）
- **部署平台**: Vercel

## 🔑 環境變數設定

### 必要環境變數
```bash
APP_KEY=4c951e966557c8374d9a61753dfe3c52441aba3b
APP_SECRET=dd46269d6920f49b07e810862d3093062b0fb858
SHOP_HANDLE=paykepoc
SHOP_URL=https://paykepoc.myshopline.com/
NODE_ENV=production
```

### 自動設定變數
```bash
POSTGRES_URL=postgres://...  # Prisma Postgres 自動設定
PRISMA_DATABASE_URL=prisma+postgres://...  # Prisma Accelerate
DATABASE_URL=postgres://...  # 備用連接字串
```

## 📁 專案結構

### Vercel Functions (api/)
```
api/
├── health.js                 # 健康檢查
├── oauth/
│   ├── install.js           # OAuth 安裝
│   ├── callback.js          # OAuth 回調
│   ├── refresh.js           # Token 刷新
│   └── revoke.js            # 撤銷授權
└── test/
    ├── shop.js              # 商店 API 測試
    └── products.js          # 商品 API 測試
```

### 靜態檔案 (public/)
```
public/
├── css/
│   └── style.css            # 樣式
├── js/
│   └── app.js               # 前端邏輯
└── views/
    ├── index.html           # 主頁
    └── callback.html        # 回調頁
```

### 配置檔案
```
vercel.json                  # Vercel 配置
package.json                 # 依賴管理
```

## 🛠️ 關鍵配置

### vercel.json
```json
{
  "rewrites": [
    { "source": "/", "destination": "/views/index.html" },
    { "source": "/health", "destination": "/api/health" },
    { "source": "/oauth/install", "destination": "/api/oauth/install" },
    { "source": "/oauth/callback", "destination": "/api/oauth/callback" },
    { "source": "/oauth/refresh", "destination": "/api/oauth/refresh" },
    { "source": "/oauth/revoke", "destination": "/api/oauth/revoke" },
    { "source": "/api/test/shop", "destination": "/api/test/shop" },
    { "source": "/api/test/products", "destination": "/api/test/products" }
  ],
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 重要注意事項
- ❌ **不要同時使用 `builds` 和 `functions`** - 會導致部署失敗
- ✅ **使用 `rewrites` 處理路由** - 取代舊的 `routes`
- ✅ **函數超時設定** - `maxDuration: 30` 秒

## 🧪 本地測試

### 使用 Vercel CLI
```bash
# 安裝 Vercel CLI
npm install -g vercel

# 連接專案
vercel link

# 本地測試 Vercel Functions
vercel dev --yes

# 訪問測試
curl http://localhost:3000/health
```

### 預期結果
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T05:00:00.000Z",
  "environment": "production",
  "platform": "vercel",
  "postgres_url": "configured"
}
```

## 🚀 部署流程

### 自動部署
```bash
# 1. 提交代碼
git add .
git commit -m "feat: your feature"
git push origin main

# 2. Vercel 自動部署
# GitHub Push → Vercel Build → Deploy → Live
```

### 手動部署
```bash
# 使用 Vercel CLI
vercel --prod
```

## 📊 部署驗證清單

### ✅ 基本功能
- [x] 前端頁面載入正常
- [x] 健康檢查端點 (`/health`)
- [x] OAuth 安裝端點 (`/oauth/install`)
- [x] OAuth 回調端點 (`/oauth/callback`)
- [x] Token 刷新功能 (`/oauth/refresh`)
- [x] 撤銷授權功能 (`/oauth/revoke`)

### ✅ API 端點
- [x] 商店資訊 API (`/api/test/shop`)
- [x] 商品查詢 API (`GET /api/test/products`)
- [x] 商品建立 API (`POST /api/test/products`)

### ✅ 資料庫
- [x] PostgreSQL 連接正常
- [x] Token 儲存功能
- [x] Token 查詢功能
- [x] Token 刪除功能

### ✅ 環境變數
- [x] `APP_KEY` 配置
- [x] `APP_SECRET` 配置
- [x] `SHOP_HANDLE` 配置
- [x] `POSTGRES_URL` 配置
- [x] `NODE_ENV=production`

## 🐛 常見問題與解決

### 問題 1：`FUNCTION_INVOCATION_FAILED`
**原因**: vercel.json 配置錯誤，同時使用 `builds` 和 `functions`
**解決**: 移除 `builds`，只保留 `functions`

### 問題 2：環境變數未生效
**原因**: Vercel Dashboard 未正確設定
**解決**: 檢查 Settings → Environment Variables

### 問題 3：資料庫連接失敗
**原因**: `POSTGRES_URL` 未設定或格式錯誤
**解決**: 確認 Prisma Postgres 已啟用並正確設定

### 問題 4：靜態檔案 404
**原因**: 路由配置錯誤
**解決**: 使用 `rewrites` 而非 `routes`

## 📝 重要教訓

### ❌ 錯誤做法
1. **逃避問題** - 遇到困難就建議放棄
2. **混合架構** - 本地一套，生產一套
3. **缺少測試** - 直接推送到生產環境
4. **配置錯誤** - `builds` + `functions` 衝突

### ✅ 正確做法
1. **堅持解決** - 找出根本問題並修復
2. **統一架構** - 本地和生產使用相同技術
3. **本地測試** - 使用 `vercel dev` 提前驗證
4. **文件同步** - 保持文件與實作一致

## 🔄 後續維護

### 監控
- **Vercel Dashboard** - 監控部署狀態和日誌
- **Health Check** - 定期檢查 `/health` 端點
- **資料庫** - 監控 Prisma Postgres 使用量

### 更新流程
1. 本地開發和測試
2. 使用 `vercel dev` 本地驗證
3. 提交到 GitHub
4. Vercel 自動部署
5. 驗證生產環境

### 回滾策略
- Vercel Dashboard → Deployments → 選擇舊版本 → Promote to Production

## 🎯 當前 Sprint 完成狀態

### ✅ 已完成功能
- [x] **商店 API** - GET `/api/test/shop` 商店資訊查詢
- [x] **商品查詢 API** - GET `/api/test/products` 商品列表查詢
- [x] **商品建立 API** - POST `/api/test/products` 建立商品測試
- [x] **前端按鈕調整** - 重新排序（商店 → 建立商品 → 檢視商品）
- [x] **動態 handle 生成** - 自動生成唯一商品 handle，避免重複
- [x] **OAuth 完整流程** - 本地環境（ngrok）完整測試通過
- [x] **Token 管理** - 儲存、刷新、撤銷功能完整
- [x] **API Scopes** - `read_store_information`, `read_products`, `write_products`
- [x] **Vercel 部署** - PostgreSQL + Serverless Functions 部署成功
- [x] **本地測試** - `vercel dev` 本地 Serverless Functions 測試通過

### 📋 待測試項目
- [ ] Vercel 版本的完整 OAuth 流程測試
- [ ] 更新 SHOPLINE Developer Center Redirect URI 為 Vercel 網址
- [ ] Vercel 生產環境的 API 端點測試

## 🎯 下一步建議

### 短期改進（本次 Sprint 收尾）
- [ ] 完整測試 Vercel 版本的 OAuth 流程
- [ ] 更新 SHOPLINE Developer Center Redirect URI
- [ ] 驗證 Vercel 生產環境所有功能

### 中期改進（下一個 Sprint）
- [ ] 實作 Orders API（需要顧客和商品數據，複雜度較高）
- [ ] 優化前端 UI 結果呈現
- [ ] 增加完整的錯誤處理和日誌

### 長期改進
- [ ] CI/CD 自動化測試
- [ ] 效能監控和優化
- [ ] 資料庫備份策略

---

**版本**: 2.0.0  
**最後更新**: 2025-10-21  
**負責人**: dreamsprouts  
**狀態**: ✅ 部署成功並運行中

