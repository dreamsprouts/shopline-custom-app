# Phase 1 實施計劃 V3：Event-Driven 核心

> ⚠️ **此文件已過時** - 已轉向 Phase R1-R3 漸進式重構模式
> 
> **當前狀態**: Phase R1 和 R2 已完成，請參考：
> - [Phase R1 完成報告](../status/PHASE_R1_COMPLETION_REPORT.md)
> - [Phase R2 完成報告](../status/PHASE_R2_COMPLETION_REPORT.md)
> - [漸進式重構 Roadmap](../architecture/GRADUAL_REFACTORING_ROADMAP.md)

## 📋 文件資訊

- **版本**: 3.0.0 (Event-Driven 架構)
- **階段**: Phase 1 - Event Bus + Connectors
- **預計時間**: 3-4 天
- **狀態**: ✅ Ready to Start
- **前置條件**: ✅ Phase 0 研究完成
- **目標**: 建立 Event-Driven 背骨，實作 Shopline + Next Engine Connectors
- **成功標準**: 事件可以從任一平台流向任一平台，核心不依賴具體平台

---

## 🎯 Phase 1 核心目標

### 主要目標
1. ✅ 建立 **Event Bus** (背骨)
2. ✅ 定義 **Standard Event** 格式
3. ✅ 實作 **Source Connectors** (Shopline + Next Engine)
4. ✅ 實作 **Target Connectors** (Shopline + Next Engine)
5. ✅ 實作基礎 **Sync Engine** (器官)
6. ✅ 端到端測試：庫存雙向同步成功

### 非目標（留待後續階段）
- ❌ Event Store (事件儲存) → Phase 2
- ❌ Workflow Engine → Phase 3
- ❌ Analytics Warehouse → Phase 4
- ❌ Redis/RabbitMQ/Kafka → Phase 5 (先用 In-Memory)
- ❌ 前端 UI 改動 → 後續

---

## 📊 整體時程

```
Day 1 (30%)
  ├── Standard Event 定義 (2h)
  ├── Event Bus 核心 (4h)
  └── 單元測試 (2h)

Day 2 (60%)
  ├── Source Connector 介面 (1h)
  ├── Shopline Source Connector (3h)
  ├── Next Engine Source Connector (3h)
  └── 單元測試 (1h)

Day 3 (90%)
  ├── Target Connector 介面 (1h)
  ├── Shopline Target Connector (2h)
  ├── Next Engine Target Connector (2h)
  ├── Sync Engine 基礎 (2h)
  └── 整合測試 (1h)

Day 4 (100%)
  ├── 端到端測試 (3h)
  ├── 效能測試 (2h)
  ├── 文件更新 (2h)
  └── Code Review (1h)
```

---

## 📂 新增檔案清單

### 完整目錄結構

```
custom-app/
├── core/
│   ├── events/
│   │   ├── StandardEvent.ts                  # Day 1 上午
│   │   ├── EventTypes.ts                     # Day 1 上午
│   │   ├── EventPayloads.ts                  # Day 1 上午
│   │   └── index.ts
│   │
│   ├── event-bus/
│   │   ├── IEventBus.ts                      # Day 1 下午
│   │   ├── InMemoryEventBus.ts               # Day 1 下午
│   │   └── index.ts
│   │
│   ├── connectors/
│   │   ├── ISourceConnector.ts               # Day 2 上午
│   │   ├── ITargetConnector.ts               # Day 3 上午
│   │   └── index.ts
│   │
│   └── index.ts
│
├── connectors/
│   ├── shopline/
│   │   ├── source/
│   │   │   └── ShoplineSourceConnector.ts    # Day 2 上午
│   │   ├── target/
│   │   │   └── ShoplineTargetConnector.ts    # Day 3 上午
│   │   ├── transformers/
│   │   │   ├── toStandardEvent.ts            # Day 2 上午
│   │   │   └── fromStandardEvent.ts          # Day 3 上午
│   │   ├── config.ts
│   │   └── index.ts
│   │
│   ├── next-engine/
│   │   ├── source/
│   │   │   └── NextEngineSourceConnector.ts  # Day 2 下午
│   │   ├── target/
│   │   │   └── NextEngineTargetConnector.ts  # Day 3 下午
│   │   ├── transformers/
│   │   │   ├── toStandardEvent.ts            # Day 2 下午
│   │   │   └── fromStandardEvent.ts          # Day 3 下午
│   │   ├── config.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── engines/
│   ├── sync-engine/
│   │   ├── SyncEngine.ts                     # Day 3 下午
│   │   ├── SyncRule.ts                       # Day 3 下午
│   │   └── index.ts
│   │
│   └── index.ts
│
├── api/
│   ├── webhooks/
│   │   ├── shopline.js                       # Day 2 (重構現有)
│   │   └── nextengine-stock.js               # Day 2 (重構現有)
│   │
│   └── events/
│       └── health.js                         # Day 4 (健康檢查)
│
├── config/
│   ├── event-bus.json                        # Day 1
│   ├── connectors.json                       # Day 2
│   └── sync-rules.json                       # Day 3
│
├── tests/
│   ├── core/
│   │   ├── event-bus/
│   │   │   └── InMemoryEventBus.test.js      # Day 1
│   │   └── events/
│   │       └── StandardEvent.test.js         # Day 1
│   │
│   ├── connectors/
│   │   ├── shopline/
│   │   │   ├── source.test.js                # Day 2
│   │   │   └── target.test.js                # Day 3
│   │   └── next-engine/
│   │       ├── source.test.js                # Day 2
│   │       └── target.test.js                # Day 3
│   │
│   ├── engines/
│   │   └── sync-engine/
│   │       └── SyncEngine.test.js            # Day 3
│   │
│   └── integration/
│       └── e2e.test.js                       # Day 4
│
└── server.js                                  # Day 4 (整合啟動)
```

---

## 🔨 詳細實施步驟

### Day 1: Event Bus + Standard Event (30%)

#### 🕐 上午 (4 小時): Standard Event 定義

##### Task 1.1: 建立 StandardEvent 定義 (1.5h)

**檔案**: `core/events/StandardEvent.ts`

```typescript
/**
 * Standard Event
 * 所有平台的變化都必須轉換為此標準格式
 */
export interface StandardEvent {
  // Event Identity
  id: string;                           // UUID
  version: string;                      // Schema version (e.g., "1.0.0")
  
  // Event Metadata
  type: EventType;
  timestamp: Date;
  
  // Source Information
  source: {
    platform: string;
    platformId: string;
    connector: string;
    originalEvent?: any;
  };
  
  // Event Payload (統一格式)
  payload: EventPayload;
  
  // Correlation (追蹤)
  correlation?: {
    traceId?: string;
    causationId?: string;
    conversationId?: string;
  };
  
  // Metadata
  metadata?: Record<string, any>;
}

export type EventPayload = 
  | InventoryEventPayload
  | ProductEventPayload
  | OrderEventPayload
  | PriceEventPayload
  | SyncEventPayload;
```

**驗收**:
- [ ] TypeScript 編譯通過
- [ ] JSDoc 註解完整
- [ ] 測試可以建立 StandardEvent 實例

##### Task 1.2: 建立 EventTypes 定義 (0.5h)

**檔案**: `core/events/EventTypes.ts`

```typescript
/**
 * Event Type Taxonomy
 * 使用 Resource.Action 命名規則
 */
export type EventType =
  // Inventory Events
  | 'inventory.updated'
  | 'inventory.low'
  | 'inventory.out_of_stock'
  
  // Product Events
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  
  // Order Events
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'order.fulfilled'
  
  // Price Events
  | 'price.updated'
  
  // Sync Events
  | 'sync.conflict_detected'
  | 'sync.reconciliation_needed'
  | 'sync.completed'
  | 'sync.failed';

/**
 * Event Category
 */
export enum EventCategory {
  INVENTORY = 'inventory',
  PRODUCT = 'product',
  ORDER = 'order',
  PRICE = 'price',
  SYNC = 'sync'
}

/**
 * Get category from event type
 */
export function getEventCategory(eventType: EventType): EventCategory {
  const category = eventType.split('.')[0];
  return category as EventCategory;
}
```

**驗收**:
- [ ] 所有事件類型定義完整
- [ ] getEventCategory 函數測試通過

##### Task 1.3: 建立 EventPayloads 定義 (1h)

**檔案**: `core/events/EventPayloads.ts`

```typescript
/**
 * Inventory Event Payload
 */
export interface InventoryEventPayload {
  productCode: string;
  locationId?: string;
  quantity: number;
  previousQuantity?: number;
  change: number;
  reason?: 'sale' | 'restock' | 'adjustment' | 'return';
}

/**
 * Product Event Payload
 */
export interface ProductEventPayload {
  productCode: string;
  title: string;
  price?: number;
  compareAtPrice?: number;
  status: 'active' | 'draft' | 'archived';
  variants?: {
    sku: string;
    price: number;
    stock: number;
  }[];
  changedFields?: string[];
}

/**
 * Order Event Payload
 */
export interface OrderEventPayload {
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customer: {
    email: string;
    name: string;
  };
  lineItems: {
    sku: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  currency: string;
}

/**
 * Price Event Payload
 */
export interface PriceEventPayload {
  productCode: string;
  price: number;
  compareAtPrice?: number;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  reason?: 'promotion' | 'cost_change' | 'manual';
}

/**
 * Sync Event Payload
 */
export interface SyncEventPayload {
  originalEventId: string;
  resourceType: string;
  resourceId: string;
  status: 'success' | 'failed' | 'conflict' | 'reconciliation_needed';
  details?: any;
}
```

**驗收**:
- [ ] 所有 Payload 定義完整
- [ ] 測試可以建立各種 Payload

##### Task 1.4: 單元測試 (1h)

**檔案**: `tests/core/events/StandardEvent.test.js`

```javascript
const { StandardEvent } = require('../../../core/events/StandardEvent');

describe('StandardEvent', () => {
  it('should create a valid inventory event', () => {
    const event = {
      id: 'evt_123',
      version: '1.0.0',
      type: 'inventory.updated',
      timestamp: new Date(),
      source: {
        platform: 'shopline',
        platformId: '123',
        connector: 'shopline-webhook'
      },
      payload: {
        productCode: 'SKU-001',
        quantity: 50,
        change: -5,
        reason: 'sale'
      }
    };
    
    expect(event.type).toBe('inventory.updated');
    expect(event.payload.productCode).toBe('SKU-001');
  });
  
  it('should validate event structure', () => {
    // Validation tests
  });
});
```

**驗收**:
- [ ] 所有測試通過
- [ ] 測試覆蓋率 > 80%

#### 🕐 下午 (4 小時): Event Bus 核心

##### Task 1.5: 建立 IEventBus 介面 (1h)

**檔案**: `core/event-bus/IEventBus.ts`

```typescript
import { StandardEvent } from '../events/StandardEvent';

/**
 * Event Handler
 */
export type EventHandler = (event: StandardEvent) => Promise<void>;

/**
 * Subscription ID
 */
export type SubscriptionId = string;

/**
 * Event Filter
 */
export interface EventFilter {
  types?: string[];
  sources?: string[];
  from?: Date;
  to?: Date;
}

/**
 * Event Bus Interface
 * 核心的事件發佈/訂閱系統
 */
export interface IEventBus {
  /**
   * 發佈事件
   */
  publish(event: StandardEvent): Promise<void>;
  
  /**
   * 批次發佈
   */
  publishBatch(events: StandardEvent[]): Promise<void>;
  
  /**
   * 訂閱事件
   * @param pattern - 事件類型 pattern (支援 wildcard)
   * @param handler - 事件處理器
   */
  subscribe(pattern: string, handler: EventHandler): SubscriptionId;
  
  /**
   * 取消訂閱
   */
  unsubscribe(subscriptionId: SubscriptionId): void;
  
  /**
   * 取得訂閱數量
   */
  getSubscriptionCount(): number;
  
  /**
   * 清除所有訂閱
   */
  clearAllSubscriptions(): void;
}
```

**驗收**:
- [ ] 介面定義完整
- [ ] JSDoc 註解清楚

##### Task 1.6: 實作 InMemoryEventBus (2h)

**檔案**: `core/event-bus/InMemoryEventBus.ts`

```typescript
import { EventEmitter } from 'events';
import { IEventBus, EventHandler, SubscriptionId } from './IEventBus';
import { StandardEvent } from '../events/StandardEvent';

interface Subscription {
  id: SubscriptionId;
  pattern: string;
  handler: EventHandler;
  createdAt: Date;
}

/**
 * In-Memory Event Bus
 * 初期使用，未來可替換為 Redis/RabbitMQ/Kafka
 */
export class InMemoryEventBus implements IEventBus {
  private emitter: EventEmitter;
  private subscriptions: Map<SubscriptionId, Subscription>;
  
  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
    this.subscriptions = new Map();
  }
  
  async publish(event: StandardEvent): Promise<void> {
    // 1. 驗證事件格式
    this._validateEvent(event);
    
    // 2. 發佈到所有訂閱者
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);  // Wildcard
    
    // 3. 記錄日誌
    console.log(`[EventBus] Published: ${event.type} (id: ${event.id})`);
  }
  
  async publishBatch(events: StandardEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
  
  subscribe(pattern: string, handler: EventHandler): SubscriptionId {
    const subscriptionId = this._generateSubscriptionId();
    
    const wrappedHandler = async (event: StandardEvent) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event.type}:`, error);
        // TODO: 錯誤處理策略
      }
    };
    
    // 支援 wildcard pattern
    if (pattern.includes('*')) {
      this.emitter.on('*', (event: StandardEvent) => {
        if (this._matchPattern(event.type, pattern)) {
          wrappedHandler(event);
        }
      });
    } else {
      this.emitter.on(pattern, wrappedHandler);
    }
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      pattern,
      handler: wrappedHandler,
      createdAt: new Date()
    });
    
    console.log(`[EventBus] Subscribed: ${pattern} (id: ${subscriptionId})`);
    return subscriptionId;
  }
  
  unsubscribe(subscriptionId: SubscriptionId): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.emitter.off(subscription.pattern, subscription.handler);
      this.subscriptions.delete(subscriptionId);
      console.log(`[EventBus] Unsubscribed: ${subscriptionId}`);
    }
  }
  
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
  
  clearAllSubscriptions(): void {
    this.emitter.removeAllListeners();
    this.subscriptions.clear();
  }
  
  private _validateEvent(event: StandardEvent): void {
    if (!event.id || !event.type || !event.source) {
      throw new Error('Invalid event format');
    }
  }
  
  private _matchPattern(eventType: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(eventType);
  }
  
  private _generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**驗收**:
- [ ] 可以發佈事件
- [ ] 可以訂閱事件
- [ ] Wildcard pattern 正常運作
- [ ] 單元測試通過

##### Task 1.7: 單元測試 (1h)

**檔案**: `tests/core/event-bus/InMemoryEventBus.test.js`

```javascript
const { InMemoryEventBus } = require('../../../core/event-bus/InMemoryEventBus');

describe('InMemoryEventBus', () => {
  let eventBus;
  
  beforeEach(() => {
    eventBus = new InMemoryEventBus();
  });
  
  it('should publish and receive events', async () => {
    let receivedEvent = null;
    
    eventBus.subscribe('inventory.updated', async (event) => {
      receivedEvent = event;
    });
    
    const testEvent = {
      id: 'test_123',
      version: '1.0.0',
      type: 'inventory.updated',
      timestamp: new Date(),
      source: {
        platform: 'shopline',
        platformId: '123',
        connector: 'test'
      },
      payload: {
        productCode: 'SKU-001',
        quantity: 50,
        change: -5
      }
    };
    
    await eventBus.publish(testEvent);
    
    // Give it a tick to process
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent.type).toBe('inventory.updated');
  });
  
  it('should support wildcard subscriptions', async () => {
    const receivedEvents = [];
    
    eventBus.subscribe('inventory.*', async (event) => {
      receivedEvents.push(event);
    });
    
    await eventBus.publish({ type: 'inventory.updated', /* ... */ });
    await eventBus.publish({ type: 'inventory.low', /* ... */ });
    await eventBus.publish({ type: 'product.updated', /* ... */ });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(receivedEvents).toHaveLength(2);
  });
  
  it('should unsubscribe correctly', async () => {
    let count = 0;
    
    const subId = eventBus.subscribe('test.event', async () => {
      count++;
    });
    
    await eventBus.publish({ type: 'test.event', /* ... */ });
    
    eventBus.unsubscribe(subId);
    
    await eventBus.publish({ type: 'test.event', /* ... */ });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(count).toBe(1);
  });
});
```

**驗收**:
- [ ] 所有測試通過
- [ ] 測試覆蓋率 > 80%

---

### Day 2: Source Connectors (60%)

#### 🕐 上午 (4 小時): Shopline Source Connector

##### Task 2.1: 建立 ISourceConnector 介面 (1h)

**檔案**: `core/connectors/ISourceConnector.ts`

```typescript
import { StandardEvent } from '../events/StandardEvent';
import { Request, Response } from 'express';

/**
 * Source Connector Interface
 * 職責：將平台特定事件轉換為 Standard Event
 */
export interface ISourceConnector {
  /**
   * 平台名稱
   */
  readonly platform: string;
  
  /**
   * 處理 Webhook
   */
  handleWebhook(req: Request, res: Response): Promise<void>;
  
  /**
   * 處理 Push (Next Engine 用)
   */
  handlePush?(req: Request, res: Response): Promise<void>;
  
  /**
   * 轉換為標準事件
   */
  toStandardEvent(platformEvent: any): StandardEvent | StandardEvent[];
  
  /**
   * 驗證簽章
   */
  verifySignature(req: Request): boolean;
}
```

##### Task 2.2: 實作 ShoplineSourceConnector (2h)

**檔案**: `connectors/shopline/source/ShoplineSourceConnector.ts`

(參考 EVENT_DRIVEN_ARCHITECTURE_V3.md 中的實作)

##### Task 2.3: 單元測試 (1h)

**檔案**: `tests/connectors/shopline/source.test.js`

#### 🕐 下午 (4 小時): Next Engine Source Connector

##### Task 2.4: 實作 NextEngineSourceConnector (2.5h)

**檔案**: `connectors/next-engine/source/NextEngineSourceConnector.ts`

(參考 EVENT_DRIVEN_ARCHITECTURE_V3.md 中的實作)

##### Task 2.5: 整合到 API 路由 (1h)

**檔案**: `api/webhooks/shopline.js` (重構)
**檔案**: `api/webhooks/nextengine-stock.js` (重構)

```javascript
// api/webhooks/shopline.js
const { ShoplineSourceConnector } = require('../../connectors/shopline');
const { eventBus } = require('../../core/event-bus');

module.exports = async (req, res) => {
  const connector = new ShoplineSourceConnector(eventBus, config);
  await connector.handleWebhook(req, res);
};
```

##### Task 2.6: 單元測試 (0.5h)

**檔案**: `tests/connectors/next-engine/source.test.js`

---

### Day 3: Target Connectors + Sync Engine (90%)

#### 🕐 上午 (4 小時): Target Connectors

##### Task 3.1: 建立 ITargetConnector 介面 (0.5h)

**檔案**: `core/connectors/ITargetConnector.ts`

```typescript
import { IEventBus } from '../event-bus/IEventBus';
import { StandardEvent } from '../events/StandardEvent';

/**
 * Target Connector Interface
 * 職責：訂閱 Standard Event，轉換並推送到目標平台
 */
export interface ITargetConnector {
  /**
   * 平台名稱
   */
  readonly platform: string;
  
  /**
   * 初始化訂閱
   */
  initialize(eventBus: IEventBus): void;
  
  /**
   * 處理事件
   */
  handleEvent(event: StandardEvent): Promise<void>;
  
  /**
   * 從標準事件轉換為平台格式
   */
  fromStandardEvent(event: StandardEvent): any;
}
```

##### Task 3.2: 實作 ShoplineTargetConnector (1.5h)

**檔案**: `connectors/shopline/target/ShoplineTargetConnector.ts`

##### Task 3.3: 實作 NextEngineTargetConnector (1.5h)

**檔案**: `connectors/next-engine/target/NextEngineTargetConnector.ts`

##### Task 3.4: 單元測試 (0.5h)

#### 🕐 下午 (4 小時): Sync Engine

##### Task 3.5: 實作 SyncEngine (2.5h)

**檔案**: `engines/sync-engine/SyncEngine.ts`

```typescript
import { IEventBus } from '../../core/event-bus/IEventBus';
import { StandardEvent } from '../../core/events/StandardEvent';
import { SyncRule } from './SyncRule';

export class SyncEngine {
  private syncRules: Map<string, SyncRule>;
  
  constructor(
    private eventBus: IEventBus,
    private database: any
  ) {
    this.syncRules = new Map();
  }
  
  initialize(): void {
    // 訂閱需要雙向同步的事件
    this.eventBus.subscribe('inventory.updated', this.handleInventorySync.bind(this));
    this.eventBus.subscribe('price.updated', this.handlePriceSync.bind(this));
  }
  
  registerSyncRule(rule: SyncRule): void {
    this.syncRules.set(rule.id, rule);
  }
  
  private async handleInventorySync(event: StandardEvent): Promise<void> {
    console.log(`[SyncEngine] Handling inventory sync for event ${event.id}`);
    
    // 1. 檢查同步規則
    const rule = this._findApplicableRule('inventory', event.payload.productCode);
    if (!rule) {
      return;
    }
    
    // 2. 記錄同步狀態
    await this.database.syncLog.create({
      eventId: event.id,
      resourceType: 'inventory',
      resourceId: event.payload.productCode,
      sourcePlatform: event.source.platform,
      status: 'pending'
    });
    
    // 3. 發佈同步完成事件
    await this.eventBus.publish({
      id: `sync_${event.id}`,
      version: '1.0.0',
      type: 'sync.completed',
      timestamp: new Date(),
      source: {
        platform: 'sync-engine',
        platformId: event.id,
        connector: 'sync-engine'
      },
      payload: {
        originalEventId: event.id,
        status: 'success'
      }
    });
  }
  
  private async handlePriceSync(event: StandardEvent): Promise<void> {
    // Similar to inventory sync
  }
  
  private _findApplicableRule(resourceType: string, resourceId: string): SyncRule | null {
    for (const rule of this.syncRules.values()) {
      if (rule.resourceType === resourceType && rule.match(resourceId)) {
        return rule;
      }
    }
    return null;
  }
}
```

##### Task 3.6: 配置檔案 (0.5h)

**檔案**: `config/sync-rules.json`

```json
{
  "rules": [
    {
      "id": "inventory-sync-all",
      "resourceType": "inventory",
      "sourcePlatform": "*",
      "targetPlatforms": ["shopline", "next-engine"],
      "match": "*",
      "priority": 1
    },
    {
      "id": "price-sync-all",
      "resourceType": "price",
      "sourcePlatform": "*",
      "targetPlatforms": ["shopline", "next-engine"],
      "match": "*",
      "priority": 1
    }
  ]
}
```

##### Task 3.7: 整合測試 (1h)

**檔案**: `tests/integration/sync-flow.test.js`

```javascript
describe('Sync Flow Integration', () => {
  it('should sync inventory from Shopline to Next Engine', async () => {
    // 1. Publish Shopline inventory.updated event
    // 2. Verify Next Engine Target Connector received it
    // 3. Verify Next Engine API called
    // 4. Verify sync.completed event published
  });
});
```

---

### Day 4: 測試與文件 (100%)

#### 🕐 上午 (4 小時): 端到端測試

##### Task 4.1: E2E 測試：Shopline → Next Engine (1.5h)

**檔案**: `tests/integration/e2e.test.js`

```javascript
describe('E2E: Shopline to Next Engine', () => {
  it('should sync inventory update from Shopline to Next Engine', async () => {
    // 模擬 Shopline Webhook 呼叫
    // 驗證 Next Engine API 被呼叫
    // 驗證庫存數量正確
  });
});
```

##### Task 4.2: E2E 測試：Next Engine → Shopline (1.5h)

##### Task 4.3: 效能測試 (1h)

#### 🕐 下午 (4 小時): 文件與 Code Review

##### Task 4.4: 更新 README (1h)

##### Task 4.5: API 文件 (1h)

##### Task 4.6: 架構圖更新 (1h)

##### Task 4.7: Code Review & 調整 (1h)

---

## ✅ Phase 1 驗收標準

### 代碼完整性
- [ ] Event Bus 核心完成
- [ ] Standard Event 定義完整
- [ ] Shopline Source + Target Connector 完成
- [ ] Next Engine Source + Target Connector 完成
- [ ] Sync Engine 基礎完成

### 測試覆蓋
- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試通過
- [ ] E2E 測試通過

### 功能驗證
- [ ] Shopline Webhook → Standard Event → 成功發佈
- [ ] Next Engine Push → Standard Event → 成功發佈
- [ ] Standard Event → Shopline API → 成功呼叫
- [ ] Standard Event → Next Engine API → 成功呼叫
- [ ] 庫存雙向同步成功

### 可擴展性驗證
- [ ] 新增一個簡單的 Logger Connector (< 1 小時)
- [ ] 驗證新 Connector 不需要修改核心代碼

---

## 📊 進度追蹤

```
[ ] Day 1: Event Bus + Standard Event (30%)
    [ ] Standard Event 定義
    [ ] EventTypes 定義
    [ ] EventPayloads 定義
    [ ] IEventBus 介面
    [ ] InMemoryEventBus 實作
    [ ] 單元測試

[ ] Day 2: Source Connectors (60%)
    [ ] ISourceConnector 介面
    [ ] ShoplineSourceConnector
    [ ] NextEngineSourceConnector
    [ ] API 路由整合
    [ ] 單元測試

[ ] Day 3: Target Connectors + Sync Engine (90%)
    [ ] ITargetConnector 介面
    [ ] ShoplineTargetConnector
    [ ] NextEngineTargetConnector
    [ ] SyncEngine
    [ ] 整合測試

[ ] Day 4: 測試與文件 (100%)
    [ ] E2E 測試
    [ ] 效能測試
    [ ] 文件更新
    [ ] Code Review
```

---

## 🎯 Phase 1 完成後的狀態

### 已完成
✅ Event Bus 作為背骨運行正常
✅ Shopline + Next Engine Connectors 完成
✅ 庫存可以雙向同步
✅ 核心完全不依賴具體平台
✅ 新增 Connector 只需 1-2 天

### 可以開始
✅ 新增 Shopify Connector (驗證可擴展性)
✅ 實作 Event Store (事件儲存)
✅ 實作 Workflow Engine (複雜流程)

---

## 📚 相關文件

- [Event-Driven 架構 V3](./EVENT_DRIVEN_ARCHITECTURE_V3.md)
- [三平台 API 對比表](./THREE_PLATFORM_API_COMPARISON.md)

---

**建立日期**: 2025-10-22  
**版本**: 3.0.0 - Event-Driven  
**狀態**: ✅ **Ready to Execute**

