# Custom App 文件中心

**最後更新**: 2025-10-27  
**當前狀態**: Phase R2 完成，Shopline Source Connector 已建立  
**架構版本**: Event-Driven V3.0 (部分實作)

---

## 🚀 快速開始

### 新進 Agent 必讀 (依序閱讀)

1. **[專案現況](./PROJECT_STATUS.md)** ⭐ 必讀第一份
   - 當前運作中的功能
   - 已完成的階段
   - 下一步要做什麼
   - 關鍵決策記錄

2. **[Event-Driven 架構 V3](./architecture/EVENT_DRIVEN_ARCHITECTURE_V3.md)** ⭐ 目標架構
   - 核心設計理念：背骨 + 器官
   - Standard Event 定義
   - Connector 設計模式
   - 完整實作範例

3. **[漸進式重構 Roadmap](./architecture/GRADUAL_REFACTORING_ROADMAP.md)** ⭐ 執行計劃
   - 如何從現況演進到目標架構
   - 零停機、零破壞策略
   - 6 個 Phase 詳細步驟

4. **[三平台 API 對比表](./architecture/THREE_PLATFORM_API_COMPARISON.md)** (參考)
   - Shopline REST, GraphQL, Next Engine API 完整對比

---

## 📂 文件結構

```
docs/
├── README.md                           ← 你在這裡
├── PROJECT_STATUS.md                   ← ⭐ 專案現況 (新進必讀)
│
├── architecture/                       ← 架構設計
│   ├── EVENT_DRIVEN_ARCHITECTURE_V3.md ← ⭐ 當前目標架構
│   ├── GRADUAL_REFACTORING_ROADMAP.md  ← ⭐ 重構計劃
│   └── THREE_PLATFORM_API_COMPARISON.md ← API 對比表
│
├── research/                           ← API 研究
│   ├── SHOPLINE_GRAPHQL_RESEARCH.md    ← Shopline GraphQL 深度研究
│   ├── NEXT_ENGINE_API_RESEARCH.md     ← Next Engine API 深度研究
│   └── SHOPLINE_ORDERS_API_NOTES.md    ← Shopline Orders 最佳實踐
│
├── api/                                ← API 文件
│   └── API_DOCUMENTATION.md            ← 完整 API 端點文件
│
├── sprints/                            ← Sprint 記錄
│   ├── SPRINT2_COMPLETION_REPORT.md    ← Sprint 2 完成報告
│   └── SPRINT_PAUSE_NOTICE.md          ← Sprint 暫停說明
│
├── status/                             ← 狀態追蹤
│   ├── PHASE_R1_COMPLETION_REPORT.md  ← Phase R1 完成報告
│   ├── PHASE_R2_COMPLETION_REPORT.md  ← Phase R2 完成報告
│   └── SPRINT2_COMPLETION_REPORT.md   ← Sprint 2 完成報告
│
└── archive/                            ← 已過時文件
    ├── architecture/
    │   ├── MULTI_PLATFORM_ARCHITECTURE.md      (V1 - 已過時)
    │   ├── MULTI_PLATFORM_ARCHITECTURE_V2.md   (V2 - 已過時)
    │   ├── PHASE1_IMPLEMENTATION_PLAN.md       (V1 - 已過時)
    │   ├── PHASE1_IMPLEMENTATION_PLAN_V2.md    (V2 - 已過時)
    │   └── PHASE1_IMPLEMENTATION_PLAN_V3.md    (V3 - 已過時，轉向 Phase R1-R3)
    ├── status/
    │   └── PROCESSING_STATUS.md                (已過時，轉向 Phase R1-R3)
    ├── sprints/
    │   └── SPRINT3_PLANNING.md                 (已過時，轉向 Phase R1-R3)
    └── research/
        └── API_STYLES_COMPARISON.md            (已被整合)
```

---

## 🎯 當前狀態總覽

### ✅ 已完成

#### Phase 0: 研究與架構設計
- [x] Shopline REST API 研究與測試
- [x] Shopline GraphQL API 深度研究
- [x] Next Engine API 深度研究
- [x] 三平台 API 完整對比
- [x] Event-Driven 架構設計 V3
- [x] 漸進式重構 Roadmap

#### Sprint 2: Orders API
- [x] Shopline Orders API 實作 (Create, Read, Update)
- [x] Vercel Functions 部署成功
- [x] 前端測試通過

#### Phase R1: Event Bus 核心建立
- [x] Standard Event 定義與實作
- [x] InMemoryEventBus 核心功能
- [x] Event Monitor Dashboard (SSE 訂閱模式)
- [x] 事件持久化 (PostgreSQL)
- [x] 測試事件發布功能
- [x] 統計數字顯示 (資料庫總數 + log 區域統計)

#### Phase R2: Shopline Source Connector
- [x] Shopline Source Connector 實作
- [x] 雙寫模式 (原有 API + 事件發布)
- [x] 事件轉換器 (API 回應 → Standard Events)
- [x] 功能開關控制
- [x] 完整測試覆蓋 (100% 通過率)
- [x] 零破壞性整合

### 🔄 進行中

**準備開始 Phase R3**: Shopline Target Connector
- 事件訂閱機制
- Standard Event 到 Shopline API 轉換
- 選擇性訂閱功能

### 📋 待執行

詳見 [漸進式重構 Roadmap](./architecture/GRADUAL_REFACTORING_ROADMAP.md)

---

## 🗂️ Archive 說明

### 為什麼有 Archive？

為了保持文件清晰，已過時的文件會移至 `archive/` 目錄：

- **V1, V2 架構文件**: 保留作為演進參考，但不再是執行方向
- **API Styles Comparison**: 內容已整合到 THREE_PLATFORM_API_COMPARISON.md

### Archive 文件的用途

1. **歷史參考**: 了解架構演進過程
2. **決策記錄**: 為什麼從 V1 → V2 → V3
3. **概念借鑒**: 某些概念在 V1/V2 中仍有價值

### ⚠️ 重要提醒

**不要使用 Archive 中的文件作為實作依據！**

如果需要了解為什麼做某個決策，請查閱：
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - 關鍵決策記錄
- Archive 文件 - 歷史演進過程

---

## 📖 各類文件說明

### 架構文件 (architecture/)

#### EVENT_DRIVEN_ARCHITECTURE_V3.md ⭐
**狀態**: 當前目標架構  
**用途**: 
- 理解 Event-Driven 設計理念
- Standard Event 定義
- Connector 實作範例
- 完整的技術規範

**何時閱讀**: 開始實作前必讀

#### GRADUAL_REFACTORING_ROADMAP.md ⭐
**狀態**: 執行中  
**用途**:
- 如何從現況演進到目標架構
- 6 個 Phase 的詳細步驟
- 回滾策略
- 驗收標準

**何時閱讀**: 每個 Phase 開始前

#### THREE_PLATFORM_API_COMPARISON.md
**狀態**: 參考文件  
**用途**:
- Shopline REST, GraphQL, Next Engine 完整對比
- ID / Filter / Pagination 轉換邏輯
- Webhook / Push 處理差異

**何時閱讀**: 實作 Connector 時參考

---

### 研究文件 (research/)

#### SHOPLINE_GRAPHQL_RESEARCH.md
**內容**: 
- GraphQL Schema 完整分析
- Products API 詳細規範
- **關鍵發現**: Orders API 不支援 GraphQL
- GID 格式轉換邏輯

#### NEXT_ENGINE_API_RESEARCH.md
**內容**:
- REST API 架構分析
- OAuth-like 認證流程
- **自動 Token 更新機制**
- **主動推送式庫存更新** (獨特設計)
- 受注伝票 (Orders) API
- 商品マスタ (Products) API

#### SHOPLINE_ORDERS_API_NOTES.md
**內容**:
- Orders API 最佳實踐
- location_id 是可選的
- 測試經驗總結

### API 文件 (api/)

#### API_DOCUMENTATION.md
**內容**:
- 完整 API 端點文件
- OAuth 授權流程 API
- Event Monitor Dashboard API
- SSE 事件流端點
- 測試事件發布端點

---

### Sprint 文件 (sprints/)

#### SPRINT2_COMPLETION_REPORT.md
**內容**:
- Sprint 2 完整報告
- 功能清單
- 修正的問題
- 測試結果
- 學到的經驗

#### SPRINT_PAUSE_NOTICE.md
**內容**:
- 為什麼暫停 Sprint 3
- 轉向架構重構
- Phase 0 研究啟動

---

## 🔧 開發工作流程

### 1. 開始新的 Phase

```bash
# 1. 閱讀對應的 Phase 文件
# 2. 確認當前功能正常運作
npm start  # 測試現有功能

# 3. 建立新分支 (建議)
git checkout -b phase-r1-event-bus

# 4. 開始實作
```

### 2. 實作過程

```bash
# 頻繁測試
npm test

# 檢查現有功能
npm start

# 提交代碼
git add .
git commit -m "phase-r1: implement event bus core"
```

### 3. Phase 完成

```bash
# 1. 確認所有驗收標準通過
# 2. 更新 PROJECT_STATUS.md
# 3. 合併分支
git checkout main
git merge phase-r1-event-bus
git push
```

---

## 🆘 遇到問題？

### 常見問題

**Q: 不確定從哪裡開始？**  
A: 依序閱讀：PROJECT_STATUS.md → EVENT_DRIVEN_ARCHITECTURE_V3.md → GRADUAL_REFACTORING_ROADMAP.md

**Q: 現有功能在哪裡？**  
A: 查看 PROJECT_STATUS.md 的「運作中的功能」章節

**Q: 為什麼有這麼多版本的架構文件？**  
A: 架構經過多次演進 (V1 → V2 → V3)，舊版本在 archive/ 中保留參考

**Q: 實作時應該參考哪份文件？**  
A: 只參考 EVENT_DRIVEN_ARCHITECTURE_V3.md 和 GRADUAL_REFACTORING_ROADMAP.md

**Q: 如何確保不破壞現有功能？**  
A: 遵循 GRADUAL_REFACTORING_ROADMAP.md 的「雙模式並存」策略

---

## 📝 文件維護

### 何時更新文件？

- **PROJECT_STATUS.md**: 每個 Phase 完成後更新
- **架構文件**: 架構有重大調整時更新 (謹慎)
- **研究文件**: 發現新的 API 行為時補充
- **Sprint 文件**: Sprint 開始/結束時建立/更新

### 文件 Archive 流程

當文件過時時：

```bash
# 1. 移至 archive
mkdir -p docs/archive/architecture
git mv docs/architecture/OLD_FILE.md docs/archive/architecture/

# 2. 在 archive 文件頂部加上過時說明
# 3. 更新 README.md 的 Archive 說明
# 4. 提交
git commit -m "docs: archive outdated architecture document"
```

---

## 🎯 關鍵原則

1. **單一真相來源**: 只有一份「當前」架構文件
2. **清晰的狀態標示**: 每份文件都標明是否為當前、參考或過時
3. **完整的 Archive 機制**: 舊文件保留但明確標示
4. **新進 Agent 友善**: 5 分鐘內能找到需要的資訊

---

**需要協助？查看 PROJECT_STATUS.md 的「聯絡資訊」章節**

---

**Last Updated**: 2025-10-22  
**Maintained by**: Development Team  
**Status**: ✅ Active
