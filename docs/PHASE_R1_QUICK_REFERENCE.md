# Phase R1 快速參考

> **Phase R1: Event Bus 核心** - 完成於 2025-10-23

---

## 🎯 核心概念

### Event-Driven 架構
- **背骨**: Event Bus (事件總線)
- **器官**: Sync Engine, Workflow Engine, Analytics
- **原則**: 新增端點不影響核心邏輯

### 標準事件格式
```javascript
{
  id: 'uuid',                    // UUID
  version: '1.0.0',              // Schema version
  type: 'inventory.updated',     // 事件類型
  timestamp: Date,               // 事件發生時間
  source: {
    platform: 'shopline',        // 平台名稱
    platformId: '123',           // 平台資源 ID
    connector: 'webhook'         // 連接器名稱
  },
  payload: { /* 資料 */ },      // 事件內容
  correlation: { /* 追蹤 */ },   // 可選：追蹤資訊
  metadata: { /* 元數據 */ }     // 可選：元數據
}
```

---

## 📦 核心模組

### 1. Events 模組 (`core/events/`)

```javascript
const {
  EventTypes,              // 事件類型常數
  createStandardEvent,     // 建立標準事件
  validateEvent,           // 驗證事件
  createInventoryPayload,  // 建立庫存 Payload
  createProductPayload,    // 建立產品 Payload
  createOrderPayload       // 建立訂單 Payload
} = require('./core/events')
```

**事件類型範例**:
```javascript
EventTypes.INVENTORY_UPDATED      // 'inventory.updated'
EventTypes.PRODUCT_CREATED        // 'product.created'
EventTypes.ORDER_CREATED          // 'order.created'
EventTypes.SYNC_COMPLETED         // 'sync.completed'
```

### 2. Event Bus 模組 (`core/event-bus/`)

```javascript
const { InMemoryEventBus } = require('./core/event-bus')

// 建立 Event Bus
const bus = new InMemoryEventBus({
  enabled: true,         // 是否啟用
  eventStore: null       // 可選：Event Store
})

// 發佈事件
await bus.publish(event)
await bus.publishBatch([event1, event2])

// 訂閱事件
const subId = bus.subscribe('inventory.updated', async (event) => {
  console.log('收到事件:', event)
})

// 支援 wildcard
bus.subscribe('inventory.*', handler)  // 所有 inventory 事件
bus.subscribe('*', handler)            // 所有事件

// 取消訂閱
bus.unsubscribe(subId)

// 統計資訊
const stats = bus.getStats()
// { published: 10, delivered: 10, errors: 0, activeSubscriptions: 3 }

// 啟用/停用
bus.setEnabled(false)
```

### 3. 配置模組 (`config/event-driven/`)

```javascript
const config = require('./config/event-driven')

console.log(config.enabled)                    // Event Bus 是否啟用
console.log(config.busType)                    // 'memory' | 'redis'
console.log(config.connectors.shoplineSource)  // Connector 開關
```

---

## 🔧 環境變數

```bash
# Event Bus 核心開關（預設: false）
USE_EVENT_BUS=false

# Event Bus 類型
EVENT_BUS_TYPE=memory

# 記錄所有事件
LOG_EVENTS=true

# Connector 開關（Phase R2-R4 使用）
ENABLE_SHOPLINE_SOURCE=false
ENABLE_SHOPLINE_TARGET=false
ENABLE_NEXT_ENGINE_SOURCE=false
ENABLE_NEXT_ENGINE_TARGET=false

# Event Store
EVENT_STORE_ENABLED=false
EVENT_STORE_TYPE=postgres
EVENT_STORE_RETENTION_DAYS=90

# 錯誤處理
EVENT_MAX_RETRIES=3
EVENT_RETRY_DELAY_MS=1000
EVENT_USE_DLQ=false
```

---

## 📝 使用範例

### 範例 1: 建立並發佈事件

```javascript
const { 
  InMemoryEventBus,
  createStandardEvent,
  EventTypes,
  createInventoryPayload
} = require('./core')

// 1. 建立 Event Bus
const bus = new InMemoryEventBus()

// 2. 建立事件
const event = createStandardEvent({
  type: EventTypes.INVENTORY_UPDATED,
  source: {
    platform: 'shopline',
    platformId: '12345',
    connector: 'webhook'
  },
  payload: createInventoryPayload({
    productCode: 'SKU-001',
    quantity: 100,
    previousQuantity: 95,
    change: 5,
    reason: 'restock'
  })
})

// 3. 發佈事件
await bus.publish(event)
```

### 範例 2: 訂閱並處理事件

```javascript
// 訂閱特定事件類型
bus.subscribe(EventTypes.INVENTORY_UPDATED, async (event) => {
  console.log('庫存更新:', event.payload.productCode)
  console.log('新數量:', event.payload.quantity)
  
  // 處理事件...
  await updateDatabase(event.payload)
})

// 訂閱所有庫存事件
bus.subscribe('inventory.*', async (event) => {
  console.log('庫存事件:', event.type)
})

// 訂閱所有事件（用於日誌）
bus.subscribe('*', async (event) => {
  console.log('事件:', event.type, event.id)
})
```

### 範例 3: 功能開關控制

```javascript
const config = require('./config/event-driven')

if (config.enabled) {
  // 使用 Event-Driven 架構
  const bus = new InMemoryEventBus()
  await bus.publish(event)
} else {
  // 使用原有架構
  await shoplineAPI.updateInventory(data)
}
```

---

## 🧪 測試

### 執行所有測試

```bash
# Event Bus 單元測試
node tests/core/event-bus/InMemoryEventBus.test.js

# 配置測試
node tests/core/config/event-driven-config.test.js

# 驗收測試
node tests/acceptance/phase-r1-acceptance.test.js
```

### 測試結果
- ✅ Event Bus 單元測試: 13/13 通過
- ✅ 配置測試: 8/8 通過
- ✅ 驗收測試: 14/14 通過
- ✅ **總計: 35/35 通過 (100%)**

---

## 📁 目錄結構

```
custom-app/
├── core/                          # 新增：Event-Driven 核心
│   ├── events/                    # 標準事件定義
│   │   ├── EventTypes.js
│   │   ├── StandardEvent.js
│   │   ├── EventPayloads.js
│   │   └── index.js
│   ├── event-bus/                 # Event Bus 實作
│   │   ├── InMemoryEventBus.js
│   │   └── index.js
│   └── index.js
│
├── config/
│   └── event-driven/              # 新增：Event-Driven 配置
│       ├── config.js
│       └── index.js
│
├── connectors/                    # 新增：Connector 目錄（Phase R2-R4 使用）
│   ├── shopline/
│   │   ├── source/
│   │   └── target/
│   └── next-engine/
│       ├── source/
│       └── target/
│
├── engines/                       # 新增：業務引擎（Phase R4-R5 使用）
│   └── sync-engine/
│
├── tests/                         # 新增：測試
│   ├── core/
│   │   ├── event-bus/
│   │   └── config/
│   └── acceptance/
│
├── api/                           # 保留：現有 API（完全不動）
├── routes/                        # 保留：現有路由（完全不動）
├── utils/                         # 保留：現有工具（完全不動）
└── ...
```

---

## ✅ 驗收標準

Phase R1 驗收標準（全部達成）:

- ✅ **Event Bus 單元測試通過** - 13/13 通過
- ✅ **現有功能完全正常** - 14/14 驗收測試通過
- ✅ **Feature Flag 可控制啟用/停用** - 8/8 配置測試通過

---

## 🚀 Phase R2 已完成

**Phase R2: Shopline Source Connector** (已完成)

成就:
- ✅ 實作 Shopline Source Connector
- ✅ 採用「雙寫模式」
- ✅ 繼續確保現有功能不受影響
- ✅ 100% 測試覆蓋率
- ✅ 零破壞性整合

---

## 📚 相關文件

- [Phase R1 完成報告](./status/PHASE_R1_COMPLETION_REPORT.md)
- [Event-Driven 架構 V3](./architecture/EVENT_DRIVEN_ARCHITECTURE_V3.md)
- [漸進式重構 Roadmap](./architecture/GRADUAL_REFACTORING_ROADMAP.md)
- [專案現況](./PROJECT_STATUS.md)

---

**建立日期**: 2025-10-23  
**狀態**: ✅ Phase R1 完成  
**下一階段**: Phase R3 - Shopline Target Connector

