# Archive 目錄說明

> ⚠️ **此目錄包含已過時的文件**
> 
> **用途**: 保留歷史文件作為架構演進參考
> 
> **重要提醒**: **不要使用此目錄中的文件作為實作依據！**

---

## 📂 目錄結構

```
archive/
├── README.md                                   ← 你在這裡
├── architecture/                               ← 已過時的架構文件
│   ├── MULTI_PLATFORM_ARCHITECTURE.md         (V1 - 2025-10-22 archived)
│   ├── MULTI_PLATFORM_ARCHITECTURE_V2.md      (V2 - 2025-10-22 archived)
│   ├── PHASE1_IMPLEMENTATION_PLAN.md          (V1 - 2025-10-22 archived)
│   ├── PHASE1_IMPLEMENTATION_PLAN_V2.md       (V2 - 2025-10-22 archived)
│   └── REFACTORING_COMPARISON.md              (2025-10-22 archived)
│
└── research/                                   ← 已被整合的研究文件
    └── API_STYLES_COMPARISON.md               (2025-10-22 archived)
```

---

## 🗂️ 文件說明

### architecture/MULTI_PLATFORM_ARCHITECTURE.md (V1)

**建立時間**: 2025-10-22  
**過時時間**: 2025-10-22 (同日)  
**過時原因**: 
- 假設所有平台都是標準 OAuth 2.0 和 REST
- 未考慮 GraphQL 和反向推送機制
- 未考慮 ID/Filter/Pagination 轉換

**當前版本**: [Event-Driven 架構 V3](../architecture/EVENT_DRIVEN_ARCHITECTURE_V3.md)

---

### architecture/MULTI_PLATFORM_ARCHITECTURE_V2.md (V2)

**建立時間**: 2025-10-22  
**過時時間**: 2025-10-22 (同日)  
**過時原因**:
- 採用 Platform 抽象層，但 Service Layer 仍需知道平台細節
- 新增端點可能影響核心邏輯
- 未採用 Event-Driven 模式

**演進**: V2 → V3 的關鍵轉變是從「平台抽象」到「事件驅動」

**當前版本**: [Event-Driven 架構 V3](../architecture/EVENT_DRIVEN_ARCHITECTURE_V3.md)

---

### architecture/PHASE1_IMPLEMENTATION_PLAN.md (V1)

**建立時間**: 2025-10-22  
**過時時間**: 2025-10-22 (同日)  
**過時原因**: 對應 V1 架構，已不適用

**當前版本**: [漸進式重構 Roadmap](../architecture/GRADUAL_REFACTORING_ROADMAP.md)

---

### architecture/PHASE1_IMPLEMENTATION_PLAN_V2.md (V2)

**建立時間**: 2025-10-22  
**過時時間**: 2025-10-22 (同日)  
**過時原因**: 對應 V2 架構，已不適用

**當前版本**: [漸進式重構 Roadmap](../architecture/GRADUAL_REFACTORING_ROADMAP.md)

---

### architecture/REFACTORING_COMPARISON.md

**建立時間**: 2025-10-22  
**過時時間**: 2025-10-22 (同日)  
**過時原因**: 內容已整合到漸進式重構 Roadmap

**當前版本**: [漸進式重構 Roadmap](../architecture/GRADUAL_REFACTORING_ROADMAP.md)

---

### research/API_STYLES_COMPARISON.md

**建立時間**: 2025-10-22  
**過時時間**: 2025-10-22 (同日)  
**過時原因**: 內容已整合到三平台 API 對比表，更完整且實用

**當前版本**: [三平台 API 對比表](../architecture/THREE_PLATFORM_API_COMPARISON.md)

---

## 🔍 為什麼保留這些文件？

### 1. 架構演進記錄
了解為什麼從 V1 → V2 → V3，每個版本解決了什麼問題。

### 2. 決策追溯
當未來對某個決策有疑問時，可以回溯到當時的考量。

### 3. 概念借鑒
某些概念在 V1/V2 中仍有價值，可以參考但不直接使用。

---

## ⚠️ 使用注意事項

### ❌ 不要做的事

1. **不要**使用 Archive 文件作為實作依據
2. **不要**在 PR 中引用 Archive 文件
3. **不要**將 Archive 文件的代碼複製到專案中

### ✅ 可以做的事

1. **可以**閱讀 Archive 文件了解架構演進
2. **可以**參考 Archive 文件理解決策背景
3. **可以**引用 Archive 文件說明「為什麼不這樣做」

---

## 📚 當前有效的文件

如果你在找實作依據，請查看：

### 核心文件
- [專案現況](../PROJECT_STATUS.md) - 必讀第一份
- [Event-Driven 架構 V3](../architecture/EVENT_DRIVEN_ARCHITECTURE_V3.md) - 目標架構
- [漸進式重構 Roadmap](../architecture/GRADUAL_REFACTORING_ROADMAP.md) - 執行計劃

### 參考文件
- [三平台 API 對比表](../architecture/THREE_PLATFORM_API_COMPARISON.md)
- [Shopline GraphQL 研究](../research/SHOPLINE_GRAPHQL_RESEARCH.md)
- [Next Engine API 研究](../research/NEXT_ENGINE_API_RESEARCH.md)

---

## 🗑️ Archive 管理流程

### 何時 Archive？

當文件符合以下條件時：
1. 不再是「當前」版本
2. 被更新的文件取代
3. 內容已被其他文件整合

### 如何 Archive？

```bash
# 1. 移動到 archive
git mv docs/path/OLD_FILE.md docs/archive/path/

# 2. 在文件頂部加上過時說明 (如上所示)

# 3. 更新 archive/README.md

# 4. 提交
git commit -m "docs: archive outdated file"
```

---

## 📊 Archive 統計

**當前 Archive 文件數**: 6  
**最近 Archive 日期**: 2025-10-22  
**主要原因**: 架構從 V2 演進到 V3 (Event-Driven)

---

**Last Updated**: 2025-10-22  
**Maintained by**: Development Team

