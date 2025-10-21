# 文件體系說明

## 📁 目錄結構

```
docs/
├── README.md                    # 本文件，文件體系說明
│
├── architecture/                # 架構設計文件
│   └── ARCHITECTURE.md         # 系統架構文件
│
├── workflow/                    # 開發流程文件
│   └── DEVELOPMENT_WORKFLOW.md # 開發流程規範（所有 Agent 必讀）
│
├── sprints/                     # Sprint 規劃文件
│   ├── SPRINT2_ORDERS_API_SPEC.md
│   └── [future sprints]
│
├── api/                         # API 文件
│   └── API_DOCUMENTATION.md    # API 端點文件
│
├── research/                    # 研究與標準文件
│   ├── SHOPLINE_API_RESEARCH.md
│   ├── SHOPLINE_API_TEST_RESULTS.md
│   └── SHOPLINE_STANDARDS.md
│
├── status/                      # 狀態與部署文件
│   ├── PROCESSING_STATUS.md
│   ├── VERCEL_DEPLOYMENT_COMPLETE.md
│   ├── VERCEL_DEPLOYMENT_NOTES.md
│   └── VERCEL_DEPLOYMENT_STATUS.md
│
├── templates/                   # 文件範本（待建立）
│   ├── SPEC_TEMPLATE.md
│   ├── TEST_CASE_TEMPLATE.md
│   └── SPRINT_PLANNING_TEMPLATE.md
│
├── DEPLOYMENT.md               # 部署指南
├── DOCS_SUMMARY.md             # 文件總結
├── INDEX.md                    # 文件索引
└── INFORMATION_SOURCES.md      # 資訊來源
```

## 📚 文件分類說明

### 🏗️ architecture/ - 架構設計
**用途**：系統架構、技術選型、設計決策

**檔案**：
- `ARCHITECTURE.md` - 系統架構文件

**使用時機**：
- 設計新功能時參考
- 理解系統架構
- 進行技術決策

### 🔄 workflow/ - 開發流程
**用途**：開發流程規範、最佳實踐、品質標準

**檔案**：
- `DEVELOPMENT_WORKFLOW.md` - 開發流程規範（⚠️ 所有 Agent 必讀）

**使用時機**：
- 開始新 Sprint 前必讀
- 不確定流程時查閱
- 進行 Code Review 時參考

**⚠️ 重要**：所有 Agent 必須嚴格遵循此流程！

### 📋 sprints/ - Sprint 規劃
**用途**：各個 Sprint 的規格文件、需求分析、Story 規劃

**檔案命名規則**：`SPRINT{N}_{FEATURE}_SPEC.md`
- 範例：`SPRINT2_ORDERS_API_SPEC.md`

**使用時機**：
- 規劃新 Sprint
- 開發前確認需求
- 追蹤 Sprint 進度

**文件狀態**：
- 📝 規格設計中
- ✅ 規格已確認
- 🚧 開發中
- ✅ 已完成

### 🔌 api/ - API 文件
**用途**：API 端點說明、Request/Response 格式

**檔案**：
- `API_DOCUMENTATION.md` - 完整 API 文件

**使用時機**：
- 呼叫 API 前查閱
- 設計新 API 時參考
- 整合測試時使用

### 🔍 research/ - 研究文件
**用途**：技術研究、官方文件摘要、標準規範

**檔案**：
- `SHOPLINE_API_RESEARCH.md` - SHOPLINE API 研究
- `SHOPLINE_API_TEST_RESULTS.md` - API 測試結果
- `SHOPLINE_STANDARDS.md` - SHOPLINE 標準

**使用時機**：
- 研究新功能時
- 查閱官方規範
- 驗證 API 行為

### 📊 status/ - 狀態文件
**用途**：系統狀態、部署記錄、問題追蹤

**檔案**：
- `PROCESSING_STATUS.md` - 處理狀態和日誌
- `VERCEL_DEPLOYMENT_COMPLETE.md` - Vercel 部署完整記錄
- `VERCEL_DEPLOYMENT_NOTES.md` - Vercel 部署筆記
- `VERCEL_DEPLOYMENT_STATUS.md` - Vercel 部署狀態

**使用時機**：
- 查看系統當前狀態
- 查閱部署歷史
- 追蹤問題和改進

### 📝 templates/ - 文件範本
**用途**：標準化的文件範本

**檔案**（待建立）：
- `SPEC_TEMPLATE.md` - 規格文件範本
- `TEST_CASE_TEMPLATE.md` - 測試案例範本
- `SPRINT_PLANNING_TEMPLATE.md` - Sprint 規劃範本

**使用時機**：
- 建立新規格文件
- 撰寫測試案例
- 規劃新 Sprint

## 📖 文件使用規則

### ✅ 應該做的

1. **開始新任務前**
   - 閱讀 `workflow/DEVELOPMENT_WORKFLOW.md`
   - 查閱相關的 Sprint 規格文件
   - 確認架構設計文件

2. **開發過程中**
   - 參考 API 文件
   - 查閱研究文件
   - 遵循開發流程

3. **完成任務後**
   - 更新狀態文件
   - 更新 API 文件（如有變更）
   - 記錄經驗教訓

4. **建立新文件時**
   - 放在正確的目錄
   - 使用標準命名規則
   - 添加到相應的索引

### ❌ 不應該做的

1. **隨意建立文件**
   - 不要在 `docs/` 根目錄隨意建立文件
   - 不要使用不一致的命名規則
   - 不要建立重複的文件

2. **跳過文件階段**
   - 不要跳過規格文件直接開發
   - 不要忽略開發流程規範
   - 不要省略文件更新

3. **文件與實作不一致**
   - 不要只更新代碼而不更新文件
   - 不要讓文件過時
   - 不要忽略變更日誌

## 🔍 快速查找指南

### 我想了解...

#### 系統架構
→ `architecture/ARCHITECTURE.md`

#### 開發流程
→ `workflow/DEVELOPMENT_WORKFLOW.md` ⚠️ 必讀

#### 當前 Sprint
→ `sprints/SPRINT{N}_*.md`

#### API 如何使用
→ `api/API_DOCUMENTATION.md`

#### SHOPLINE API 規範
→ `research/SHOPLINE_STANDARDS.md`

#### 系統當前狀態
→ `status/PROCESSING_STATUS.md`

#### 部署相關
→ `status/VERCEL_DEPLOYMENT_COMPLETE.md`

## 🔄 文件維護

### 更新頻率

- **status/** - 每次 Sprint 完成時更新
- **sprints/** - 每個 Sprint 建立新文件
- **api/** - API 變更時立即更新
- **architecture/** - 架構變更時更新
- **workflow/** - 流程改進時更新
- **research/** - 發現新資訊時更新

### 版本控制

所有文件變更必須：
1. 提交 Git commit
2. 寫清楚 commit message
3. 更新變更日誌（如適用）

## 📞 文件相關問題

### 找不到想要的資訊？
1. 先查閱 `INDEX.md`
2. 使用全文搜尋
3. 查看 `DOCS_SUMMARY.md`

### 不確定放哪裡？
1. 參考本文件的分類說明
2. 查看現有文件的組織方式
3. 詢問團隊成員

### 需要新增文件分類？
1. 討論並確認需求
2. 更新本文件
3. 建立新目錄
4. 通知團隊成員

---

**版本**: 1.0.0  
**最後更新**: 2025-10-21  
**維護者**: Development Team

**⚠️ 重要提醒：所有 Agent 必須遵循此文件組織規則！**

