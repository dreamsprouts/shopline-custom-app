# SHOPLINE OAuth 系統

## 📋 快速開始

### 系統概述
完整的 SHOPLINE Custom App OAuth 2.0 授權系統，包含前端 UI、後端 API、SQLite 資料庫和 ngrok 本地開發環境。

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
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - 系統架構和設計
- **[docs/SHOPLINE_STANDARDS.md](./docs/SHOPLINE_STANDARDS.md)** - SHOPLINE 平台標準代碼
- **[docs/API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - API 端點文件

### 🚀 部署文件
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - 部署和維護指南
- **[GUIDE.md](./GUIDE.md)** - 完整實作指南

### 📊 狀態監控
- **[docs/PROCESSING_STATUS.md](./docs/PROCESSING_STATUS.md)** - 處理狀態和日誌

### 📖 文件體系
- **[docs/INDEX.md](./docs/INDEX.md)** - 文件索引和導航
- **[docs/DOCS_SUMMARY.md](./docs/DOCS_SUMMARY.md)** - 文件體系總結
- **[docs/INFORMATION_SOURCES.md](./docs/INFORMATION_SOURCES.md)** - 資訊來源管理

## 🏗️ 系統架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 UI      │    │   後端 API     │    │   SQLite 資料庫  │
│  (React/Vanilla)│◄──►│   (Express.js)  │◄──►│   (Token 儲存)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔑 核心功能

- ✅ **OAuth 2.0 授權流程** - 完整的 SHOPLINE 標準流程
- ✅ **HMAC-SHA256 簽名驗證** - 符合 SHOPLINE 安全標準
- ✅ **Token 持久化儲存** - SQLite 資料庫
- ✅ **前端 UI 管理** - 完整的用戶界面
- ✅ **API 測試功能** - 商店與商品 API（含建立商品）；訂單列為下一 Sprint
- ✅ **本地開發環境** - ngrok 隧道支援

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
NODE_ENV=development
PORT=3000
```

### 應用配置
```json
{
  "app_key": "4c951e966557c8374d9a61753dfe3c52441aba3b",
  "app_secret": "dd46269d6920f49b07e810862d3093062b0fb858",
  "shop_handle": "paykepoc",
  "shop_url": "https://paykepoc.myshopline.com/"
}
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

**版本**: 1.2.2  
**最後更新**: 2025-10-20  
**狀態**: ✅ 開發就緒（商店/商品 API 實測通過）
