# Custom App - Multi-Platform Connector

> **Event-Driven 多平台整合系統**
> 
> 作為中介層（Middleman）整合電商平台（Shopline）與 OMS（Next Engine）

## 🎯 專案願景

建立一個 **Event-Driven 的多平台 Connector 系統**，支援：
- **Shopline** (電商平台) - ✅ 已整合 + Event Bus
- **Next Engine** (OMS 訂單管理) - 🔄 整合中
- **未來**: Shopify, WooCommerce, 其他平台

### 核心能力
- 🔄 **庫存同步**: NE ↔ Shopline 雙向同步
- 📦 **訂單管理**: Shopline → Next Engine 訂單推送
- 🔌 **可擴展性**: 新增端點不影響核心邏輯
- 👀 **可觀測性**: 所有變化都是可追蹤的事件
- 📊 **即時監控**: Event Monitor Dashboard 使用 SSE 訂閱模式監控事件流

---

## 📚 文件中心

**⭐ 新進 Agent 必讀**: [docs/README.md](./docs/README.md) - 完整的文件導航

### 快速導航

#### 核心文件 (必讀)
1. **[專案現況](./docs/PROJECT_STATUS.md)** ⭐ 第一份必讀
   - 當前運作中的功能
   - 已完成的階段
   - 下一步要做什麼

2. **[Event-Driven 架構 V3](./docs/architecture/EVENT_DRIVEN_ARCHITECTURE_V3.md)** ⭐ 目標架構
   - 核心設計理念
   - 完整技術規範

3. **[漸進式重構 Roadmap](./docs/architecture/GRADUAL_REFACTORING_ROADMAP.md)** ⭐ 執行計劃
   - 如何從現況演進
   - 零停機策略

#### 開發相關
- [API 測試端點](#-api-端點) - 當前可用的 API
- [開發工作流程](./docs/workflow/DEVELOPMENT_WORKFLOW.md)
- [部署指南](./docs/DEPLOYMENT.md)

---

## ✅ 當前狀態

### 運作中的功能
- ✅ Shopline OAuth 2.0 授權
- ✅ 商店資訊查詢
- ✅ 商品 CRUD
- ✅ 訂單 CRUD (Create, Read, Update)
- ✅ Vercel 部署 (Serverless + PostgreSQL)
- ✅ Event-Driven 核心 (Phase R1 完成)

### 當前階段
**Phase R1 已完成** ✅ (2025-10-23)
- Event Bus 核心建立完成
- 35 個測試全部通過 (100%)
- 現有功能完全正常

**Phase R2 準備中**: Shopline Source Connector (預計 3 天)
- 雙寫模式
- 不影響現有功能

詳見: [Phase R1 完成報告](./docs/status/PHASE_R1_COMPLETION_REPORT.md)

---

## 📋 快速開始

### 系統概述
完整的 Multi-Platform Connector 系統，包含前端 UI、後端 API、PostgreSQL 資料庫和 Vercel 雲端部署。支援本地開發（ngrok）和正式環境（Vercel）。

### 快速啟動
```bash
# 1. 安裝依賴
npm install

# 2. 設定 Vercel Postgres 資料庫
# 在 Vercel Dashboard 中建立 Postgres 資料庫
# 取得連接字串後設定環境變數
export POSTGRES_URL="postgres://username:password@host:port/database"

# 3. 啟動應用
npm start

# 4. 啟動 ngrok (新終端)
npm run ngrok

# 5. 訪問應用
open http://localhost:3000

# 6. 訪問 Event Monitor Dashboard
open http://localhost:3000/event-monitor

# Event Monitor Dashboard 功能：
# - 即時監控：使用 SSE 訂閱模式監控事件流
# - 事件發布：測試 Event Bus 事件發布功能
# - 歷史載入：載入最近 100 筆歷史事件
# - 統計顯示：顯示資料庫總事件數和 log 區域統計
```

## 📚 詳細文件導航

完整的文件結構請查看: **[docs/README.md](./docs/README.md)**

### 參考文件
- [Vercel 架構說明](./docs/architecture/VERCEL_ARCHITECTURE.md)
- [Shopline Orders API 筆記](./docs/research/SHOPLINE_ORDERS_API_NOTES.md)
- [開發流程](./docs/workflow/DEVELOPMENT_WORKFLOW.md)

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

## 📋 API 端點

### OAuth 端點 (運作中)
- `GET /oauth/install` - 啟動授權流程
- `GET /oauth/callback` - 授權回調
- `POST /oauth/refresh` - 刷新 Token
- `POST /oauth/revoke` - 撤銷授權

### Shopline API 測試 (運作中)
- `GET /api/test/shop` - 商店資訊查詢
- `GET /api/test/products` - 商品列表查詢
- `POST /api/test/products` - 商品建立
- `POST /api/test/orders/create` - 訂單建立
- `GET /api/test/orders/list` - 訂單列表查詢
- `GET /api/test/orders/:id` - 訂單詳情查詢
- `PUT /api/test/orders/:id` - 訂單更新

### 系統端點
- `GET /health` - 健康檢查
- `GET /` - 前端 UI

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

**版本**: 3.0.0 (Event-Driven 架構)  
**最後更新**: 2025-10-23  
**狀態**: ✅ Phase R1 完成，Phase R2 準備中  
**正式網址**: https://shopline-custom-app.vercel.app  
**文件中心**: [docs/README.md](./docs/README.md)
