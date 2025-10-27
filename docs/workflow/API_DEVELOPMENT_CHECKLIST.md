# API 開發檢查清單

## 🎯 目的

**確保每次新增 API 端點時，本地和 Vercel 環境同時正常運作！**

## ✅ **強制檢查清單**

### 階段 1：設計與規劃

- [ ] **1.1** 確認 API 端點路徑
  - 本地路由：`________________`
  - Vercel Function 路徑：`________________`
  
- [ ] **1.2** 確認 HTTP Method (GET/POST/PUT/DELETE)

- [ ] **1.3** 確認 Request/Response 格式

- [ ] **1.4** 更新規格文件 (`docs/sprints/SPRINT*_SPEC.md`)

- [ ] **1.5** 如果是 Event Bus 相關 API，確認事件格式和時間戳

---

### 階段 2：實作本地環境

- [ ] **2.1** 在 `server.js` 新增路由
  ```javascript
  app.METHOD('PATH', async (req, res) => {
    // 實作邏輯
  })
  ```

- [ ] **2.2** 將核心邏輯抽離到 `utils/` 目錄
  ```javascript
  // utils/shopline-api.js 或其他共用模組
  ```

- [ ] **2.3** 本地測試
  ```bash
  # 啟動本地伺服器
  npm start
  
  # 測試端點
  curl http://localhost:3000/PATH
  ```

- [ ] **2.4** 如果是 Event Monitor Dashboard API，測試 SSE 連接
  ```bash
  curl -N -H "Accept: text/event-stream" http://localhost:3000/api/event-monitor/stream
  ```

- [ ] **2.5** 確認本地測試通過

---

### 階段 3：實作 Vercel Serverless Function

- [ ] **3.1** 建立 Vercel Function 檔案
  ```
  api/
    └── [category]/
        └── [function-name].js
  ```

- [ ] **3.2** 實作 Vercel Function
  ```javascript
  const SharedModule = require('../../utils/...')
  
  module.exports = async (req, res) => {
    // 設定 CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // 處理 preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }
    
    // 複用 server.js 的邏輯
    // ...
  }
  ```

- [ ] **3.3** 確認邏輯與 `server.js` 一致

- [ ] **3.4** 更新 `vercel.json` 路由設定 ⚠️ **必須**
  ```json
  {
    "rewrites": [
      {
        "source": "/api/your/endpoint",
        "destination": "/api/your/endpoint"
      }
    ]
  }
  ```

- [ ] **3.5** 本地測試 Vercel Function (可選)
  ```bash
  vercel dev
  # 訪問 http://localhost:3000/api/...
  ```

---

### 階段 4：更新前端

- [ ] **4.1** 更新 `public/js/app.js`
  ```javascript
  const endpoint = window.location.hostname.includes('vercel.app') 
      ? '/api/VERCEL_PATH'  // Vercel 端點
      : '/api/LOCAL_PATH'   // 本地端點
  ```

- [ ] **4.2** 更新 `views/index.html` 版本號
  ```html
  <script src="/js/app.js?v=X.Y.Z"></script>
  ```

- [ ] **4.3** 前端本地測試
  - 打開 http://localhost:3000
  - 測試新功能
  - 檢查 Network 面板

---

### 階段 5：文件更新

- [ ] **5.1** 更新 API 文件
  - `docs/api/API_DOCUMENTATION.md`
  - 新增端點說明
  - 新增 Request/Response 範例

- [ ] **5.2** 更新架構文件
  - `docs/architecture/VERCEL_ARCHITECTURE.md`
  - 新增路由對應表

- [ ] **5.3** 更新 README.md
  - 新增可用端點列表

- [ ] **5.4** 更新狀態文件
  - `docs/PROJECT_STATUS.md`
  - 記錄新功能

---

### 階段 6：版本控制與部署

- [ ] **6.1** Git Commit
  ```bash
  git add -A
  git commit -m "feat: add API endpoint for ..."
  ```

- [ ] **6.2** Git Push
  ```bash
  git push origin main
  ```

- [ ] **6.3** 等待 Vercel 自動部署完成
  - 訪問 https://vercel.com/dashboard
  - 確認部署狀態：✅ Ready

- [ ] **6.4** Vercel 生產環境測試
  - 訪問 https://shopline-custom-app.vercel.app
  - 重新授權 (如需要)
  - 測試新功能
  - 檢查 Network 面板

---

### 階段 7：完整測試

- [ ] **7.1** 本地環境測試
  - [ ] OAuth 流程
  - [ ] 所有 API 端點
  - [ ] 前端 UI 互動

- [ ] **7.2** Vercel 環境測試
  - [ ] OAuth 流程
  - [ ] 所有 API 端點
  - [ ] 前端 UI 互動

- [ ] **7.3** 跨瀏覽器測試 (可選)
  - [ ] Chrome
  - [ ] Safari
  - [ ] Firefox

- [ ] **7.4** 錯誤處理測試
  - [ ] 無效 Token
  - [ ] 無效參數
  - [ ] 網路錯誤

---

## 🚨 **常見錯誤與檢查**

### ❌ 錯誤 1：只實作本地路由
**症狀**：本地正常，Vercel 404  
**檢查**：是否建立了對應的 Vercel Function？

### ❌ 錯誤 2：前端寫死端點
**症狀**：本地正常，Vercel 失敗 (或反之)  
**檢查**：前端是否有環境偵測？

### ❌ 錯誤 3：邏輯不一致
**症狀**：本地和 Vercel 回應不同  
**檢查**：server.js 和 Vercel Function 邏輯是否完全一致？

### ❌ 錯誤 4：未更新 vercel.json
**症狀**：Vercel 回傳 500 或 404 錯誤  
**檢查**：`vercel.json` 是否有新增路由設定？

### ❌ 錯誤 5：CORS 設定缺失
**症狀**：Vercel 出現 CORS 錯誤  
**檢查**：Vercel Function 是否有設定 CORS headers？

### ❌ 錯誤 6：未更新前端版本號
**症狀**：前端沒有使用最新代碼  
**檢查**：`views/index.html` 的 `app.js?v=` 版本號是否更新？

---

## 📊 **檢查清單範例**

### 範例：新增「查詢客戶列表」API

#### ✅ 設計與規劃
- [x] 本地路由：`GET /api/test/customers`
- [x] Vercel Function：`api/test/customers/list.js`
- [x] HTTP Method：GET
- [x] Response：`{ success: true, data: { customers: [...] } }`
- [x] 更新 `docs/sprints/SPRINT3_SPEC.md`

#### ✅ 實作本地環境
- [x] `server.js` 新增 `app.get('/api/test/customers', ...)`
- [x] 抽離邏輯到 `utils/shopline-api.js` (`getCustomers()`)
- [x] `curl http://localhost:3000/api/test/customers` ✅

#### ✅ 實作 Vercel Function
- [x] 建立 `api/test/customers/list.js`
- [x] 複用 `utils/shopline-api.js`
- [x] `vercel dev` 測試 ✅

#### ✅ 更新前端
- [x] `app.js` 新增環境偵測
- [x] `index.html` 版本號 `v=2.3.0`
- [x] 本地測試 ✅

#### ✅ 文件更新
- [x] `API_DOCUMENTATION.md` 新增端點
- [x] `VERCEL_ARCHITECTURE.md` 新增對應表
- [x] `README.md` 更新端點列表
- [x] `PROJECT_STATUS.md` 記錄功能

#### ✅ 部署與測試
- [x] `git commit -m "feat: add customers API"`
- [x] `git push` ✅
- [x] Vercel 部署完成 ✅
- [x] Vercel 測試通過 ✅

---

## 📝 **使用方式**

### 新增 API 時
1. 複製本檢查清單
2. 逐項完成並打勾
3. 全部完成後才提交代碼

### Code Review 時
1. 檢查是否有對應的檢查清單
2. 確認所有項目都已完成
3. 抽查測試結果

---

**版本**: 1.0.0  
**建立日期**: 2025-10-21  
**維護者**: Development Team  
**強制執行**: 是

**⚠️ 每次新增 API 必須完成本檢查清單！**

