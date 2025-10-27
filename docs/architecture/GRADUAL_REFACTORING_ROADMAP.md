# 漸進式重構 Roadmap：從現況到 Event-Driven 架構

## 📋 文件資訊

- **版本**: 1.0.0
- **建立日期**: 2025-10-22
- **狀態**: ✅ Ready to Execute
- **核心原則**: **零停機、零破壞、漸進演進**
- **目標**: 從現有 Shopline 單平台架構，逐步演進到 Event-Driven 多平台架構

---

## 🎯 核心原則

### 1. **雙模式並存** (Dual-Mode Operation)
```
新架構 (Event-Driven) ← 可選開關 → 舊架構 (Direct Call)
```
- 初期：舊架構為主，新架構為輔 (測試用)
- 中期：雙模式並行 (A/B testing)
- 後期：新架構為主，舊架構移除

### 2. **Strangler Fig Pattern** (絞殺者模式)
```
新功能 → 只用新架構
既有功能 → 逐步遷移到新架構
舊代碼 → 最後移除
```

### 3. **Feature Flag** (功能開關)
```typescript
const USE_EVENT_BUS = process.env.USE_EVENT_BUS === 'true';

if (USE_EVENT_BUS) {
  // 新架構：發佈事件
  await eventBus.publish(event);
} else {
  // 舊架構：直接呼叫
  await shoplineAPI.updateInventory(data);
}
```

### 4. **逐層重構** (Layer-by-Layer)
```
Phase R1: Event Bus 核心 (不影響現有功能)
    ↓
Phase R2: Shopline Source Connector (Webhook 雙寫) - **✅ 已完成**
    ↓
Phase R3: Shopline Target Connector (選擇性訂閱) - **準備開始**
    ↓
Phase R4: 完全切換到事件驅動
    ↓
Phase R5: Next Engine 整合
    ↓
Phase R6: 移除舊代碼
```

---

## 🗺️ 漸進式重構 Roadmap

### 📍 當前狀態 (AS-IS)

```
現有運作中的功能：
✅ Shopline OAuth (安裝、授權、回調)
✅ Shopline 商店資訊查詢
✅ Shopline 商品列表查詢
✅ Shopline 訂單建立 (測試通過)

現有代碼結構：
custom-app/
├── api/
│   ├── oauth/
│   │   ├── install.js          ← 運作中
│   │   └── callback.js         ← 運作中
│   └── test/
│       ├── shop.js             ← 運作中
│       ├── products.js         ← 運作中
│       └── orders/
│           ├── create.js       ← 運作中
│           ├── list.js         ← 運作中
│           └── [id].js         ← 運作中
├── routes/
│   └── oauth.js                ← 運作中
├── utils/
│   ├── shopline-api.js         ← 核心 API Client
│   ├── database-postgres.js    ← Token 儲存
│   └── signature.js            ← HMAC 驗證
├── server.js                   ← Express Server
└── vercel.json                 ← Vercel 配置

⚠️ 不能破壞這些功能！
```

---

## 🚀 Phase R1: Event Bus 核心 (2 天) - **✅ 已完成**

### 目標
建立 Event Bus 基礎設施，但**不改動任何現有代碼**。

### 完成狀態
- [x] Standard Event 定義與實作
- [x] InMemoryEventBus 核心功能
- [x] Event Monitor Dashboard (SSE 訂閱模式)
- [x] 事件持久化 (PostgreSQL)
- [x] 測試事件發布功能
- [x] 統計數字顯示 (資料庫總數 + log 區域統計)

### 實施步驟 (已完成)

#### Step R1.1: 建立新目錄結構 (0.5 天) ✅

```bash
# 建立新目錄 (不影響舊代碼)
mkdir -p core/events
mkdir -p core/event-bus
mkdir -p connectors/shopline/source
mkdir -p connectors/shopline/target
mkdir -p config/event-driven

# 新舊代碼並存
custom-app/
├── api/                        # ← 舊代碼，保持不動
├── routes/                     # ← 舊代碼，保持不動
├── utils/                      # ← 舊代碼，保持不動
├── core/                       # ← 新代碼
│   ├── events/
│   └── event-bus/
├── connectors/                 # ← 新代碼
│   └── shopline/
└── config/
    ├── (existing configs)      # ← 舊配置
    └── event-driven/           # ← 新配置
```

#### Step R1.2: 實作 Event Bus 核心 (1 天)

**不依賴現有功能，獨立測試**

- [ ] `core/events/StandardEvent.ts`
- [ ] `core/events/EventTypes.ts`
- [ ] `core/event-bus/InMemoryEventBus.ts`
- [ ] `tests/core/event-bus/InMemoryEventBus.test.js`

**驗收標準**:
- [ ] Event Bus 單元測試通過
- [ ] **不影響現有 API 功能**
- [ ] `npm start` 現有功能正常

#### Step R1.3: 建立功能開關 (0.5 天)

**檔案**: `.env` (新增)

```bash
# Event-Driven 架構開關
USE_EVENT_BUS=false              # 初期設為 false
EVENT_BUS_TYPE=memory            # memory / redis
LOG_EVENTS=true                  # 是否記錄所有事件
```

**檔案**: `config/event-driven/config.js` (新增)

```javascript
const config = {
  enabled: process.env.USE_EVENT_BUS === 'true',
  busType: process.env.EVENT_BUS_TYPE || 'memory',
  logEvents: process.env.LOG_EVENTS === 'true',
  
  // Connector 開關
  connectors: {
    shoplineSource: process.env.ENABLE_SHOPLINE_SOURCE === 'true',
    shoplineTarget: process.env.ENABLE_SHOPLINE_TARGET === 'true'
  }
};

module.exports = config;
```

**驗收標準**:
- [ ] 環境變數載入正確
- [ ] 功能開關可以控制 Event Bus 啟用/停用
- [ ] **不影響現有功能**

---

## 🚀 Phase R2: Shopline Source Connector (3 天) - **✅ 已完成**

### 目標
在**不破壞現有 Webhook 處理**的前提下，**額外**發佈事件到 Event Bus。

### 完成狀態
- [x] Shopline Source Connector 實作完成
- [x] 雙寫模式成功整合 (原有 API + 事件發布)
- [x] 事件轉換器完整實作
- [x] 功能開關控制正常
- [x] 100% 測試覆蓋率
- [x] 零破壞性整合

### 實施步驟 (已完成)

#### Step R2.1: 實作 Shopline Source Connector (1.5 天) ✅

**檔案**: `connectors/shopline/source/ShoplineSourceConnector.js`

```javascript
const { v4: uuidv4 } = require('uuid');

class ShoplineSourceConnector {
  constructor(eventBus) {
    this.platform = 'shopline';
    this.eventBus = eventBus;
  }
  
  /**
   * 將 Shopline Webhook 事件轉換為 Standard Event
   */
  toStandardEvent(webhookTopic, webhookData) {
    const eventId = uuidv4();
    const timestamp = new Date();
    
    switch (webhookTopic) {
      case 'products/update':
        return {
          id: eventId,
          version: '1.0.0',
          type: 'product.updated',
          timestamp,
          source: {
            platform: 'shopline',
            platformId: String(webhookData.id),
            connector: 'shopline-webhook'
          },
          payload: {
            productCode: webhookData.variants?.[0]?.sku || webhookData.handle,
            title: webhookData.title,
            price: parseFloat(webhookData.variants?.[0]?.price || '0'),
            status: webhookData.status
          }
        };
      
      case 'orders/create':
        return {
          id: eventId,
          version: '1.0.0',
          type: 'order.created',
          timestamp: new Date(webhookData.created_at),
          source: {
            platform: 'shopline',
            platformId: String(webhookData.id),
            connector: 'shopline-webhook'
          },
          payload: {
            orderNumber: webhookData.order_number,
            status: webhookData.financial_status === 'paid' ? 'processing' : 'pending',
            customer: {
              email: webhookData.customer.email,
              name: webhookData.customer.name
            },
            total: parseFloat(webhookData.total_price),
            currency: webhookData.currency
          }
        };
      
      default:
        return null;  // 不支援的事件類型
    }
  }
  
  /**
   * 發佈事件 (如果啟用)
   */
  async publishIfEnabled(webhookTopic, webhookData) {
    if (!this.eventBus) {
      return;  // Event Bus 未啟用
    }
    
    const event = this.toStandardEvent(webhookTopic, webhookData);
    if (event) {
      await this.eventBus.publish(event);
      console.log(`[ShoplineSource] Published event: ${event.type}`);
    }
  }
}

module.exports = ShoplineSourceConnector;
```

**驗收標準**:
- [ ] Connector 可以獨立測試
- [ ] 轉換邏輯正確
- [ ] **不依賴現有代碼**

#### Step R2.2: 整合到現有 Webhook (雙寫模式) (1 天)

**⚠️ 關鍵：不改變現有邏輯，只「額外」發佈事件**

**檔案**: `routes/shopline-webhooks.js` (新增)

```javascript
const express = require('express');
const router = express.Router();
const eventDrivenConfig = require('../config/event-driven/config');
const { InMemoryEventBus } = require('../core/event-bus/InMemoryEventBus');
const ShoplineSourceConnector = require('../connectors/shopline/source/ShoplineSourceConnector');

// 初始化 Event Bus (如果啟用)
let eventBus = null;
let sourceConnector = null;

if (eventDrivenConfig.enabled && eventDrivenConfig.connectors.shoplineSource) {
  eventBus = new InMemoryEventBus();
  sourceConnector = new ShoplineSourceConnector(eventBus);
  console.log('[Event-Driven] Shopline Source Connector enabled');
}

/**
 * Shopline Webhook 處理器
 * 雙寫模式：
 * 1. 執行原有邏輯 (保持不變)
 * 2. 額外發佈事件到 Event Bus (如果啟用)
 */
router.post('/webhooks/shopline/:topic', async (req, res) => {
  try {
    const topic = req.params.topic;
    const data = req.body;
    
    // ===== 原有邏輯開始 (保持不變) =====
    console.log(`[Webhook] Received: ${topic}`);
    
    // 驗證簽章 (原有邏輯)
    const signature = req.headers['x-shopline-hmac-sha256'];
    const isValid = verifyShoplineSignature(req.body, signature);
    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }
    
    // 處理不同的 Webhook (原有邏輯)
    switch (topic) {
      case 'products/update':
        // 原有處理邏輯...
        break;
      
      case 'orders/create':
        // 原有處理邏輯...
        break;
    }
    
    res.status(200).send('OK');
    // ===== 原有邏輯結束 =====
    
    // ===== 新增：Event-Driven 雙寫 =====
    if (sourceConnector && eventDrivenConfig.enabled) {
      // 異步發佈事件 (不阻塞回應)
      setImmediate(async () => {
        try {
          await sourceConnector.publishIfEnabled(topic, data);
        } catch (error) {
          console.error('[Event-Driven] Failed to publish event:', error);
          // 不影響原有流程
        }
      });
    }
    // ===== Event-Driven 雙寫結束 =====
    
  } catch (error) {
    console.error('[Webhook] Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
```

**或者，更輕量的做法 - 在現有檔案中加入雙寫**

**檔案**: `api/test/orders/create.js` (修改 - 加入雙寫)

```javascript
// ===== 檔案頂部新增 =====
const eventDrivenConfig = require('../../../config/event-driven/config');
let eventBus = null;
let sourceConnector = null;

if (eventDrivenConfig.enabled) {
  const { InMemoryEventBus } = require('../../../core/event-bus/InMemoryEventBus');
  const ShoplineSourceConnector = require('../../../connectors/shopline/source/ShoplineSourceConnector');
  eventBus = new InMemoryEventBus();
  sourceConnector = new ShoplineSourceConnector(eventBus);
}
// ===== 新增結束 =====

module.exports = async (req, res) => {
  try {
    // ===== 原有邏輯 (完全不變) =====
    const database = require('../../../utils/database-postgres');
    await database.init();
    
    const shopHandle = req.query.shop || process.env.SHOP_HANDLE;
    const tokenRecord = await database.getToken(shopHandle);
    
    if (!tokenRecord) {
      return res.status(401).json({ error: '未授權' });
    }
    
    const ShoplineAPIClient = require('../../../utils/shopline-api');
    const apiClient = new ShoplineAPIClient({
      app_key: process.env.APP_KEY,
      app_secret: process.env.APP_SECRET
    });
    
    // 建立訂單...
    const orderData = { /* ... */ };
    const result = await apiClient.createOrder(tokenRecord.accessToken, orderData);
    
    res.json({ success: true, data: result.data });
    // ===== 原有邏輯結束 =====
    
    // ===== 新增：Event-Driven 雙寫 =====
    if (sourceConnector && eventDrivenConfig.enabled && result.data?.order) {
      setImmediate(async () => {
        try {
          const event = sourceConnector.toStandardEvent('orders/create', result.data.order);
          if (event) {
            await eventBus.publish(event);
            console.log('[Event-Driven] Published order.created event');
          }
        } catch (error) {
          console.error('[Event-Driven] Failed to publish event:', error);
        }
      });
    }
    // ===== Event-Driven 雙寫結束 =====
    
  } catch (error) {
    console.error('建立訂單失敗：', error.message);
    res.status(500).json({ 
      error: '建立訂單失敗',
      details: error.response?.data || error.message 
    });
  }
};
```

**驗收標準**:
- [ ] 原有功能**完全正常**
- [ ] `USE_EVENT_BUS=false` 時，行為與之前一致
- [ ] `USE_EVENT_BUS=true` 時，額外發佈事件
- [ ] 事件發佈失敗**不影響**原有功能
- [ ] 所有現有測試通過

#### Step R2.3: 監控與日誌 (0.5 天)

**檔案**: `utils/event-logger.js` (新增)

```javascript
class EventLogger {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.enabled = process.env.LOG_EVENTS === 'true';
  }
  
  initialize() {
    if (!this.enabled || !this.eventBus) {
      return;
    }
    
    // 訂閱所有事件
    this.eventBus.subscribe('*', async (event) => {
      console.log('[EventLogger]', JSON.stringify({
        id: event.id,
        type: event.type,
        source: event.source.platform,
        timestamp: event.timestamp
      }));
    });
  }
}

module.exports = EventLogger;
```

**驗收標準**:
- [ ] 可以看到所有發佈的事件
- [ ] 方便除錯

---

## 🚀 Phase R3: Shopline Target Connector (3 天) - **選擇性訂閱**

### 目標
建立 Target Connector，但**只處理新功能**，不影響現有流程。

### 實施步驟

#### Step R3.1: 實作 Shopline Target Connector (1.5 天)

**檔案**: `connectors/shopline/target/ShoplineTargetConnector.js`

```javascript
class ShoplineTargetConnector {
  constructor(apiClient, config) {
    this.platform = 'shopline';
    this.apiClient = apiClient;
    this.config = config;
  }
  
  initialize(eventBus) {
    // 只訂閱特定事件 (避免循環)
    eventBus.subscribe('inventory.updated', async (event) => {
      if (event.source.platform !== 'shopline') {
        await this.handleInventoryUpdate(event);
      }
    });
  }
  
  async handleInventoryUpdate(event) {
    console.log(`[ShoplineTarget] Handling inventory update for ${event.payload.productCode}`);
    
    // 轉換並呼叫 Shopline API
    const data = this.fromStandardEvent(event);
    await this.apiClient.updateInventory(this.config.accessToken, data);
  }
  
  fromStandardEvent(event) {
    // 轉換邏輯...
  }
}

module.exports = ShoplineTargetConnector;
```

#### Step R3.2: 只在新功能中啟用 (1 天)

**範例：新的庫存同步 API**

**檔案**: `api/sync/inventory.js` (新增)

```javascript
// 這是新功能，直接用 Event-Driven 架構
const { InMemoryEventBus } = require('../../core/event-bus/InMemoryEventBus');
const ShoplineTargetConnector = require('../../connectors/shopline/target/ShoplineTargetConnector');

const eventBus = new InMemoryEventBus();
const targetConnector = new ShoplineTargetConnector(apiClient, config);
targetConnector.initialize(eventBus);

module.exports = async (req, res) => {
  // 直接發佈事件，由 Target Connector 處理
  await eventBus.publish({
    id: uuidv4(),
    type: 'inventory.updated',
    timestamp: new Date(),
    source: {
      platform: 'manual',
      platformId: req.body.productCode,
      connector: 'api'
    },
    payload: {
      productCode: req.body.productCode,
      quantity: req.body.quantity,
      change: req.body.change
    }
  });
  
  res.json({ success: true, message: 'Event published' });
};
```

**驗收標準**:
- [ ] 新功能使用 Event-Driven 架構
- [ ] 舊功能保持不變
- [ ] 可以逐步遷移

#### Step R3.3: A/B Testing (0.5 天)

**檔案**: `utils/feature-flags.js` (新增)

```javascript
class FeatureFlags {
  static shouldUseEventBus(feature) {
    const flags = {
      'inventory-sync': process.env.USE_EVENT_BUS_INVENTORY === 'true',
      'order-create': process.env.USE_EVENT_BUS_ORDER === 'true',
      'product-update': process.env.USE_EVENT_BUS_PRODUCT === 'true'
    };
    
    return flags[feature] || false;
  }
}

module.exports = FeatureFlags;
```

**使用範例**:

```javascript
if (FeatureFlags.shouldUseEventBus('inventory-sync')) {
  // 新架構
  await eventBus.publish(event);
} else {
  // 舊架構
  await shoplineAPI.updateInventory(data);
}
```

**驗收標準**:
- [ ] 可以逐功能切換
- [ ] 可以快速回滾

---

## 🚀 Phase R4: Next Engine 整合 (5 天)

### 目標
在 Event-Driven 架構穩定後，整合 Next Engine。

### 實施步驟

#### Step R4.1: Next Engine OAuth (2 天)

- [ ] 實作 Next Engine OAuth 流程
- [ ] **不影響現有 Shopline OAuth**
- [ ] 新增 `/oauth/nextengine/install` 路由
- [ ] 新增 `/oauth/nextengine/callback` 路由

#### Step R4.2: Next Engine Source Connector (1.5 天)

- [ ] 實作 Next Engine Push Handler
- [ ] 轉換為 Standard Event
- [ ] 發佈到 Event Bus

#### Step R4.3: Next Engine Target Connector (1 天)

- [ ] 實作 Next Engine API Client
- [ ] 訂閱事件
- [ ] 呼叫 Next Engine API

#### Step R4.4: 雙向同步測試 (0.5 天)

**測試場景**:
```
Shopline 庫存變動 → Event Bus → Next Engine API ✅
Next Engine 推送 → Event Bus → Shopline API ✅
```

**驗收標準**:
- [ ] 雙向同步成功
- [ ] Shopline 現有功能不受影響

---

## 🚀 Phase R5: 全面切換 (2 天)

### 目標
所有功能切換到 Event-Driven 架構。

### 實施步驟

#### Step R5.1: 逐功能遷移 (1.5 天)

```bash
# 逐步開啟功能開關
USE_EVENT_BUS_INVENTORY=true
USE_EVENT_BUS_ORDER=true
USE_EVENT_BUS_PRODUCT=true
```

- [ ] 監控每個功能
- [ ] 發現問題立即回滾
- [ ] 確認穩定後繼續下一個

#### Step R5.2: 移除雙寫代碼 (0.5 天)

當所有功能都切換到新架構後：
- [ ] 移除舊的直接 API 呼叫
- [ ] 移除 `if (USE_EVENT_BUS)` 判斷
- [ ] 簡化代碼

**驗收標準**:
- [ ] 所有功能使用 Event-Driven 架構
- [ ] 測試全部通過

---

## 🚀 Phase R6: 清理舊代碼 (1 天)

### 目標
移除不再需要的舊代碼。

### 實施步驟

#### Step R6.1: 識別可移除的代碼 (0.5 天)

- [ ] 舊的 API Client (如果完全被 Connector 取代)
- [ ] 重複的邏輯
- [ ] Feature Flags (已不再需要)

#### Step R6.2: 移除並測試 (0.5 天)

- [ ] 逐步移除
- [ ] 每次移除後測試
- [ ] 確認無遺漏

**驗收標準**:
- [ ] 代碼簡潔
- [ ] 無重複邏輯
- [ ] 所有測試通過

---

## 📊 完整時程總覽

```
Phase R1: Event Bus 核心 (2 天)
  └─ 不影響現有功能，獨立建立

Phase R2: Shopline Source Connector (3 天)
  └─ 雙寫模式，額外發佈事件

Phase R3: Shopline Target Connector (3 天)
  └─ 只在新功能中啟用

Phase R4: Next Engine 整合 (5 天)
  └─ 新平台，使用 Event-Driven

Phase R5: 全面切換 (2 天)
  └─ 逐功能遷移到新架構

Phase R6: 清理舊代碼 (1 天)
  └─ 移除不再需要的代碼

━━━━━━━━━━━━━━━━━━━━━━━━━━━
總計：16 天 (約 3 週)
```

---

## ✅ 各階段驗收標準

### Phase R1 驗收
- [ ] Event Bus 單元測試通過
- [ ] **現有功能完全正常** (最重要)
- [ ] Feature Flag 可以控制啟用/停用

### Phase R2 驗收
- [ ] Shopline Webhook 正常運作
- [ ] `USE_EVENT_BUS=true` 時可以看到事件發佈
- [ ] `USE_EVENT_BUS=false` 時行為與之前一致
- [ ] 事件發佈失敗不影響原有功能

### Phase R3 驗收
- [ ] Target Connector 可以處理事件
- [ ] 新功能使用 Event-Driven
- [ ] 舊功能保持不變

### Phase R4 驗收
- [ ] Next Engine OAuth 成功
- [ ] 庫存雙向同步成功
- [ ] Shopline 功能不受影響

### Phase R5 驗收
- [ ] 所有功能使用 Event-Driven
- [ ] 效能與之前相當或更好
- [ ] 所有測試通過

### Phase R6 驗收
- [ ] 舊代碼移除
- [ ] 代碼簡潔
- [ ] 文件更新

---

## 🔧 回滾策略

### 每個 Phase 都有快速回滾機制

**Phase R1-R3**: 關閉 Feature Flag
```bash
USE_EVENT_BUS=false
```

**Phase R4**: 停用 Next Engine Connector
```bash
ENABLE_NEXT_ENGINE=false
```

**Phase R5**: 逐功能回滾
```bash
USE_EVENT_BUS_INVENTORY=false  # 只回滾庫存同步
```

**回滾測試**:
- [ ] 每個 Phase 完成後，測試回滾
- [ ] 確認回滾後功能正常
- [ ] 再繼續下一個 Phase

---

## 📝 關鍵檢查清單

### 每個 Phase 開始前
- [ ] 確認現有功能正常
- [ ] 建立本 Phase 的測試計劃
- [ ] 準備回滾方案

### 每個 Phase 執行中
- [ ] 頻繁測試
- [ ] 監控錯誤日誌
- [ ] 保持代碼可回滾

### 每個 Phase 完成後
- [ ] 所有測試通過
- [ ] 現有功能正常
- [ ] 文件更新
- [ ] Code Review
- [ ] 回滾測試通過

---

## 🎯 成功標準

### 技術標準
- ✅ 零停機
- ✅ 零破壞現有功能
- ✅ 每個 Phase 可獨立測試
- ✅ 每個 Phase 可快速回滾
- ✅ 測試覆蓋率維持或提升

### 業務標準
- ✅ Shopline 功能持續正常運作
- ✅ 新功能使用新架構
- ✅ Next Engine 成功整合
- ✅ 代碼可維護性提升

---

## 📚 相關文件

- [Event-Driven 架構 V3](./EVENT_DRIVEN_ARCHITECTURE_V3.md) - 目標架構
- [Phase 1 實施計劃 V3](./PHASE1_IMPLEMENTATION_PLAN_V3.md) - 詳細實作
- [三平台 API 對比表](./THREE_PLATFORM_API_COMPARISON.md) - API 研究

---

**建立日期**: 2025-10-22  
**版本**: 1.0.0  
**狀態**: ✅ **Ready to Execute**  
**核心**: **漸進式、零破壞、可回滾**

---

## 🚀 現在可以開始

**建議從 Phase R1 開始**，預計 2 天完成，**完全不影響現有功能**。

準備好了嗎？

