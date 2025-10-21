# SHOPLINE OAuth 系統

## 📋 快速開始

### 系統概述
完整的 SHOPLINE Custom App OAuth 2.0 授權系統，包含前端 UI、後端 API、PostgreSQL 資料庫和 Vercel 雲端部署。支援本地開發（ngrok）和正式環境（Vercel）。

### 快速啟動
```bash
# 1. 安裝依賴
npm install

# 2. 啟動應用
npm start

# 3. 啟動 ngrok (新終端)
npm run ngrok

# 4. 訪問應用
open http://localhost:3000
```

## 📚 文件導航

### 🔧 開發文件
- **[docs/architecture/ARCHITECTURE.md](./docs/architecture/ARCHITECTURE.md)** - 系統架構和設計
- **[docs/architecture/VERCEL_ARCHITECTURE.md](./docs/architecture/VERCEL_ARCHITECTURE.md)** - ⚠️ **必讀** Vercel 架構說明
- **[docs/research/SHOPLINE_STANDARDS.md](./docs/research/SHOPLINE_STANDARDS.md)** - SHOPLINE 平台標準代碼
- **[docs/api/API_DOCUMENTATION.md](./docs/api/API_DOCUMENTATION.md)** - API 端點文件

### 🚀 部署文件
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - 部署和維護指南
- **[GUIDE.md](./GUIDE.md)** - 完整實作指南

### 📊 狀態監控
- **[docs/status/PROCESSING_STATUS.md](./docs/status/PROCESSING_STATUS.md)** - 處理狀態和日誌

### 📋 開發流程 (⚠️ 強制執行)
- **[docs/workflow/DEVELOPMENT_WORKFLOW.md](./docs/workflow/DEVELOPMENT_WORKFLOW.md)** - 標準開發流程
- **[docs/workflow/API_DEVELOPMENT_CHECKLIST.md](./docs/workflow/API_DEVELOPMENT_CHECKLIST.md)** - ⚠️ **新增 API 必讀** 開發檢查清單

### 📖 文件體系
- **[docs/INDEX.md](./docs/INDEX.md)** - 文件索引和導航
- **[docs/DOCS_SUMMARY.md](./docs/DOCS_SUMMARY.md)** - 文件體系總結

## 🏗️ 系統架構

### 本地開發環境
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 UI      │    │   後端 API     │    │  PostgreSQL DB  │
│  (Vanilla JS)  │◄──►│   (Express.js)  │◄──►│   (Token 儲存)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                      ▲                       ▲
         └──────────────────────┴───────────────────────┘
                          ngrok tunnel
```

### Vercel 生產環境
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 UI      │    │ Vercel Functions │    │  Prisma Postgres │
│  (靜態託管)     │◄──►│  (Serverless)   │◄──►│   (雲端資料庫)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔑 核心功能

- ✅ **OAuth 2.0 授權流程** - 完整的 SHOPLINE 標準流程
- ✅ **HMAC-SHA256 簽名驗證** - 符合 SHOPLINE 安全標準
- ✅ **Token 持久化儲存** - PostgreSQL 資料庫（Prisma Postgres）
- ✅ **前端 UI 管理** - 完整的用戶界面
- ✅ **API 測試功能** - 商店資訊、商品查詢、商品建立（含動態 handle 生成）；訂單列為下一 Sprint
- ✅ **本地開發環境** - ngrok 隧道支援
- ✅ **Vercel 雲端部署** - Serverless Functions + Prisma Postgres

## 📋 可用端點

### OAuth 端點
- `GET /oauth/install` - 啟動授權流程
- `GET /oauth/callback` - 授權回調
- `POST /oauth/refresh` - 刷新 Token
- `POST /oauth/revoke` - 撤銷授權

### 狀態端點
- `GET /oauth/status` - OAuth 系統狀態
- `GET /oauth/token-status` - Token 狀態查詢

### 前端端點
- `GET /` - 前端應用主頁
- `GET /views/callback.html` - 授權成功頁面

### API 測試端點
- `GET /api/test/shop` - 測試商店資訊 API
- `GET /api/test/products` - 測試商品查詢 API
- `POST /api/test/products` - 測試商品建立 API（含動態 handle 生成）

### 系統端點
- `GET /health` - 健康檢查
- `GET /api/info` - 應用程式資訊

## 🤖 Agent 資訊查找

### 官方資源查詢
```bash
# 顯示官方資源清單
npm run agent:official
```

### 查找原則
1. 優先使用本地專案文件 (docs/ 資料夾)
2. 超出專案內容時，使用官方來源查詢
3. Agent 自行判斷何時需要查詢何種資訊

## 🔧 配置

### 環境變數
```bash
# 本地開發
NODE_ENV=development
PORT=3000
POSTGRES_URL=postgres://...  # Prisma Postgres 連接字串

# Vercel 生產環境
APP_KEY=4c951e966557c8374d9a61753dfe3c52441aba3b
APP_SECRET=dd46269d6920f49b07e810862d3093062b0fb858
SHOP_HANDLE=paykepoc
SHOP_URL=https://paykepoc.myshopline.com/
NODE_ENV=production
POSTGRES_URL=postgres://...  # 自動由 Vercel 設定
```

### 本地開發設定
```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數（參考 .env.local）
cp .env.example .env.local

# 3. 啟動本地伺服器
npm start

# 4. 啟動 ngrok (另一終端)
npm run ngrok
```

### Vercel 部署
```bash
# 1. 連接 Vercel 專案
vercel link

# 2. 本地測試 Vercel Functions
vercel dev --yes

# 3. 部署到 Vercel
git push origin main  # 自動部署
```

## 🚨 故障排除

### 常見問題
1. **簽名驗證失敗** - 檢查 app_secret 和時間戳
2. **資料庫連線失敗** - 檢查資料庫檔案權限
3. **ngrok 連線問題** - 重新啟動 ngrok 服務

### 日誌查看
```bash
# 查看應用日誌
tail -f logs/combined.log

# 查看錯誤日誌
tail -f logs/error.log
```

## 📞 支援

如需協助，請參考：
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 系統架構
- [SHOPLINE_STANDARDS.md](./SHOPLINE_STANDARDS.md) - 平台標準
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 部署指南

---

**版本**: 2.0.0  
**最後更新**: 2025-10-21  
**狀態**: ✅ Vercel 部署成功（PostgreSQL + Serverless Functions）  
**正式網址**: https://shopline-custom-app.vercel.app
