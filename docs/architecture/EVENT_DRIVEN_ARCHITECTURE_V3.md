# Event-Driven Multi-Platform Connector 架構 V3.0

## 📋 文件資訊

- **版本**: 3.0.0 (重大架構調整)
- **建立日期**: 2025-10-22
- **狀態**: ✅ **基於「背骨 + 器官」理念重新設計**
- **核心**: Event Bus (事件總線) 作為背骨
- **器官**: Sync Engine (同步引擎), Workflow Engine (未來), Analytics Warehouse (未來)

---

## 🎯 架構理念：背骨 vs. 器官

### 核心定義

**背骨 (Spine)**: 讓前台快速變、後台穩定跑的基礎設施
- 選擇: **Event Bus (事件總線)**
- 特性: 鬆耦合、可擴展、近即時、可回放

**器官 (Organs)**: 掛載在背骨上的能力模組
- **Sync Engine**: 關鍵雙向同步 (庫存、價格)
- **Workflow Engine**: 複雜流程編排 (未來)
- **Analytics Warehouse**: 分析與治理 (未來)

### 關鍵原則

1. ✅ **事件驅動為預設**：所有平台變化都發佈為標準事件
2. ✅ **同步引擎為例外**：僅用於關鍵雙向域 (庫存、價格)
3. ✅ **工作流負責編排**：不承擔資料主權
4. ✅ **倉儲不承擔協調**：只做分析與治理
5. ✅ **新增端點不影響核心**：只需實作 Connector

---

## 🏗️ 整體架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                      Source Connectors                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Shopline │  │   Next   │  │ Shopify  │  │   ...    │       │
│  │  Webhook │  │  Engine  │  │  Webhook │  │          │       │
│  │          │  │   Push   │  │          │  │          │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       └─────────────┴─────────────┴─────────────┘              │
│                     產生 Standard Events                        │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    🦴 Event Bus (背骨)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Event Queue (事件佇列)                                   │  │
│  │  - In-memory (初期): Array + EventEmitter                │  │
│  │  - Future: Redis Streams / RabbitMQ / Kafka              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Event Router (事件路由)                                  │  │
│  │  - Topic-based routing                                   │  │
│  │  - Pattern matching (inventory.*, order.*)               │  │
│  │  - Filter & Transform                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Event Store (事件儲存 - 可選)                            │  │
│  │  - Event Sourcing                                        │  │
│  │  - Replay capability                                     │  │
│  │  - Audit trail                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Event Schema Registry                                   │  │
│  │  - 事件定義與版本管理                                      │  │
│  │  - 語義治理 (避免混亂)                                     │  │
│  │  - Schema validation                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Event Monitor Dashboard (事件監控儀表板)                 │  │
│  │  - SSE 訂閱模式即時監控                                   │  │
│  │  - 事件發布測試功能                                       │  │
│  │  - 歷史事件載入 (100筆)                                   │  │
│  │  - 統計數字顯示                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         ↓ 分發到訂閱者
┌─────────────────────────────────────────────────────────────────┐
│                    Event Handlers (器官層)                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🔄 Sync Engine (同步引擎)                                 │  │
│  │  - 訂閱: inventory.updated, price.updated                │  │
│  │  - 職責: 雙向同步、衝突檢測、補償重試                       │  │
│  │  - 場景: NE ↔ SL 庫存/價格一致性                          │  │
│  │  - 夜間對帳 + 差異自動修正                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📊 Analytics Handler (分析處理器 - 未來)                  │  │
│  │  - 訂閱: all events (*.*)                                │  │
│  │  - 職責: 寫入 Data Warehouse                             │  │
│  │  - 場景: BI、GenBI、指標一致性                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🔔 Notification Handler (通知處理器)                      │  │
│  │  - 訂閱: inventory.low, order.failed                     │  │
│  │  - 職責: 發送告警 (Email, Slack, SMS)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🤖 Workflow Trigger (工作流觸發器 - 未來)                 │  │
│  │  - 訂閱: order.created, return.requested                │  │
│  │  - 職責: 啟動複雜流程 (審批、RMA、促銷)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🎯 Target Connectors (目標連接器)                        │  │
│  │  - 訂閱特定事件                                            │  │
│  │  - 轉換為平台格式                                          │  │
│  │  - 呼叫平台 API                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Target Connectors                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Shopline │  │   Next   │  │  Slack   │  │  Sheets  │       │
│  │   API    │  │  Engine  │  │          │  │          │       │
│  │          │  │   API    │  │          │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 核心組件設計

### 1. Standard Event 定義

#### 事件格式 (不可變)

```typescript
/**
 * Standard Event
 * 所有平台的變化都必須轉換為此標準格式
 */
interface StandardEvent {
  // Event Identity
  id: string;                           // UUID
  version: string;                      // Schema version (e.g., "1.0.0")
  
  // Event Metadata
  type: EventType;                      // 事件類型 (見下方)
  timestamp: Date;                      // 事件發生時間 (ISO 8601)
  
  // Source Information
  source: {
    platform: string;                   // 'shopline', 'next-engine', etc.
    platformId: string;                 // 平台內的資源 ID
    connector: string;                  // 連接器名稱
    originalEvent?: any;                // 原始事件 (可選，用於除錯)
  };
  
  // Event Payload (統一格式)
  payload: EventPayload;
  
  // Correlation (追蹤)
  correlation?: {
    traceId?: string;                   // 全鏈路追蹤 ID
    causationId?: string;               // 引發此事件的事件 ID
    conversationId?: string;            // 業務會話 ID
  };
  
  // Metadata
  metadata?: {
    retryCount?: number;
    priority?: 'low' | 'normal' | 'high';
    [key: string]: any;
  };
}
```

#### 事件類型定義 (語義治理)

```typescript
/**
 * Event Type Taxonomy
 * 使用 Resource.Action 命名規則
 */
type EventType =
  // Inventory Events
  | 'inventory.updated'
  | 'inventory.low'
  | 'inventory.out_of_stock'
  
  // Product Events
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.published'
  | 'product.archived'
  
  // Order Events
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'order.fulfilled'
  | 'order.paid'
  | 'order.refunded'
  
  // Customer Events
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  
  // Price Events
  | 'price.updated'
  | 'price.promotion_started'
  | 'price.promotion_ended'
  
  // Sync Events (Sync Engine 專用)
  | 'sync.conflict_detected'
  | 'sync.reconciliation_needed'
  | 'sync.completed'
  | 'sync.failed';
```

#### Payload 定義 (按資源類型)

```typescript
// Inventory Event Payload
interface InventoryEventPayload {
  productCode: string;                  // SKU
  locationId?: string;                  // 倉庫位置
  quantity: number;                     // 新庫存數量
  previousQuantity?: number;            // 舊庫存數量
  change: number;                       // 變化量
  reason?: 'sale' | 'restock' | 'adjustment' | 'return';
}

// Product Event Payload
interface ProductEventPayload {
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
  changedFields?: string[];             // 哪些欄位變更了
}

// Order Event Payload
interface OrderEventPayload {
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

// Price Event Payload
interface PriceEventPayload {
  productCode: string;
  price: number;
  compareAtPrice?: number;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  reason?: 'promotion' | 'cost_change' | 'manual';
}
```

---

### 2. Event Bus 核心實作

#### EventBus Interface

```typescript
/**
 * Event Bus Interface
 * 核心的事件發佈/訂閱系統
 */
interface IEventBus {
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
   * 重播事件 (從 Event Store)
   */
  replay(filter: EventFilter, handler: EventHandler): Promise<void>;
}

type EventHandler = (event: StandardEvent) => Promise<void>;
type SubscriptionId = string;

interface EventFilter {
  types?: EventType[];
  sources?: string[];
  from?: Date;
  to?: Date;
}
```

#### EventBus 初期實作 (In-Memory)

```typescript
const EventEmitter = require('events');

/**
 * In-Memory Event Bus
 * 初期使用，未來可替換為 Redis/RabbitMQ/Kafka
 */
class InMemoryEventBus implements IEventBus {
  private emitter: EventEmitter;
  private subscriptions: Map<SubscriptionId, Subscription>;
  private eventStore: EventStore;  // Optional
  
  constructor(options?: { eventStore?: EventStore }) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);  // 避免警告
    this.subscriptions = new Map();
    this.eventStore = options?.eventStore;
  }
  
  async publish(event: StandardEvent): Promise<void> {
    // 1. 驗證事件格式
    this._validateEvent(event);
    
    // 2. 記錄到 Event Store (可選)
    if (this.eventStore) {
      await this.eventStore.append(event);
    }
    
    // 3. 發佈到所有訂閱者
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);  // Wildcard
    
    // 4. 記錄日誌
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
        // 錯誤處理策略：重試 / Dead Letter Queue / 告警
        await this._handleError(event, error);
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
  
  async replay(filter: EventFilter, handler: EventHandler): Promise<void> {
    if (!this.eventStore) {
      throw new Error('Event Store not configured');
    }
    
    const events = await this.eventStore.query(filter);
    
    for (const event of events) {
      await handler(event);
    }
  }
  
  private _validateEvent(event: StandardEvent): void {
    if (!event.id || !event.type || !event.source) {
      throw new Error('Invalid event format');
    }
    // TODO: Schema validation
  }
  
  private _matchPattern(eventType: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(eventType);
  }
  
  private _generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async _handleError(event: StandardEvent, error: Error): Promise<void> {
    // 錯誤處理邏輯
    // 1. 記錄到錯誤日誌
    // 2. 重試 (with exponential backoff)
    // 3. 超過重試次數 → Dead Letter Queue
    // 4. 發送告警
  }
}

interface Subscription {
  pattern: string;
  handler: EventHandler;
  createdAt: Date;
}
```

---

### 3. Source Connector 設計

#### Connector Interface

```typescript
/**
 * Source Connector Interface
 * 職責：將平台特定事件轉換為 Standard Event
 */
interface ISourceConnector {
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
   * 輪詢模式 (Polling - 備用)
   */
  poll?(): Promise<void>;
  
  /**
   * 轉換為標準事件
   */
  toStandardEvent(platformEvent: any): StandardEvent;
}
```

#### 範例：Shopline Source Connector (雙寫模式)

```typescript
class ShoplineSourceConnector implements ISourceConnector {
  readonly platform = 'shopline';
  
  constructor(
    private eventBus: IEventBus,
    private config: ShoplineConfig,
    private apiClient: ShoplineAPIClient  // 新增：API 客戶端
  ) {}
  
  // === Webhook 處理 (原有設計) ===
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // 1. 驗證簽章
      const isValid = this._verifySignature(req);
      if (!isValid) {
        res.status(401).send('Invalid signature');
        return;
      }
      
      // 2. 提取平台事件
      const platformEvent = req.body;
      const eventType = req.headers['x-shopline-topic'];
      
      // 3. 轉換為標準事件
      const standardEvent = this.toStandardEvent({
        type: eventType,
        data: platformEvent
      });
      
      // 4. 發佈到 Event Bus
      await this.eventBus.publish(standardEvent);
      
      // 5. 立即回應 200 (不等待處理完成)
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook 處理失敗:', error);
      res.status(500).send('Internal Server Error');
    }
  }
  
  // === 雙寫模式：API 呼叫 + 事件發佈 ===
  async getProducts(accessToken: string, params: any): Promise<ApiResponse> {
    // 1. 呼叫原始 API
    const result = await this.apiClient.getProducts(accessToken, params);
    
    // 2. 發佈事件 (如果啟用)
    if (this.isEnabled() && result.success) {
      await this.publishProductsListEvent(result, accessToken, params);
    }
    
    // 3. 回傳原始結果
    return result;
  }
  
  async createProduct(accessToken: string, payload: any): Promise<ApiResponse> {
    // 1. 呼叫原始 API
    const result = await this.apiClient.createProduct(accessToken, payload);
    
    // 2. 發佈事件 (如果啟用)
    if (this.isEnabled() && result.success) {
      await this.publishProductCreatedEvent(result, accessToken, payload);
    }
    
    // 3. 回傳原始結果
    return result;
  }
  
  async createOrder(accessToken: string, payload: any): Promise<ApiResponse> {
    // 1. 呼叫原始 API
    const result = await this.apiClient.createOrder(accessToken, payload);
    
    // 2. 發佈事件 (如果啟用)
    if (this.isEnabled() && result.success) {
      await this.publishOrderCreatedEvent(result, accessToken, payload);
    }
    
    // 3. 回傳原始結果
    return result;
  }
  
  // === 事件發佈方法 ===
  private async publishProductsListEvent(apiResponse: ApiResponse, accessToken: string, params: any): Promise<void> {
    // 實作商品列表事件發佈
  }
  
  private async publishProductCreatedEvent(apiResponse: ApiResponse, accessToken: string, payload: any): Promise<void> {
    // 實作商品建立事件發佈
  }
  
  private async publishOrderCreatedEvent(apiResponse: ApiResponse, accessToken: string, payload: any): Promise<void> {
    // 實作訂單建立事件發佈
  }
  
  // === 功能開關 ===
  isEnabled(): boolean {
    return this.config.enabled && process.env.ENABLE_SHOPLINE_SOURCE === 'true';
  }
  
  toStandardEvent(platformEvent: any): StandardEvent {
    const { type, data } = platformEvent;
    
    // 根據不同的 Shopline topic 轉換
    switch (type) {
      case 'products/update':
        return this._toProductUpdatedEvent(data);
      
      case 'orders/create':
        return this._toOrderCreatedEvent(data);
      
      case 'inventory_levels/update':
        return this._toInventoryUpdatedEvent(data);
      
      default:
        throw new Error(`Unknown Shopline event type: ${type}`);
    }
  }
  
  private _toInventoryUpdatedEvent(data: any): StandardEvent {
    return {
      id: uuidv4(),
      version: '1.0.0',
      type: 'inventory.updated',
      timestamp: new Date(),
      source: {
        platform: 'shopline',
        platformId: String(data.inventory_item_id),
        connector: 'shopline-webhook'
      },
      payload: {
        productCode: data.sku,
        locationId: String(data.location_id),
        quantity: data.available,
        previousQuantity: data.previous_available,
        change: data.available - data.previous_available,
        reason: 'sale'  // 根據實際情況推斷
      }
    };
  }
  
  private _toProductUpdatedEvent(data: any): StandardEvent {
    return {
      id: uuidv4(),
      version: '1.0.0',
      type: 'product.updated',
      timestamp: new Date(),
      source: {
        platform: 'shopline',
        platformId: String(data.id),
        connector: 'shopline-webhook'
      },
      payload: {
        productCode: data.variants[0]?.sku || data.handle,
        title: data.title,
        price: parseFloat(data.variants[0]?.price || '0'),
        status: data.status,
        variants: data.variants.map(v => ({
          sku: v.sku,
          price: parseFloat(v.price),
          stock: v.inventory_quantity
        }))
      }
    };
  }
  
  private _toOrderCreatedEvent(data: any): StandardEvent {
    return {
      id: uuidv4(),
      version: '1.0.0',
      type: 'order.created',
      timestamp: new Date(data.created_at),
      source: {
        platform: 'shopline',
        platformId: String(data.id),
        connector: 'shopline-webhook'
      },
      payload: {
        orderNumber: data.order_number,
        status: data.financial_status === 'paid' ? 'processing' : 'pending',
        customer: {
          email: data.customer.email,
          name: data.customer.name
        },
        lineItems: data.line_items.map(item => ({
          sku: item.sku,
          quantity: item.quantity,
          price: parseFloat(item.price)
        })),
        total: parseFloat(data.total_price),
        currency: data.currency
      }
    };
  }
  
  private _verifySignature(req: Request): boolean {
    const signature = req.headers['x-shopline-hmac-sha256'] as string;
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
```

#### 範例：Next Engine Source Connector (Push)

```typescript
class NextEngineSourceConnector implements ISourceConnector {
  readonly platform = 'next-engine';
  
  constructor(
    private eventBus: IEventBus,
    private config: NextEngineConfig
  ) {}
  
  async handleWebhook(req: Request, res: Response): Promise<void> {
    throw new Error('Next Engine does not support traditional webhook');
  }
  
  /**
   * Next Engine 獨特的反向推送處理
   */
  async handlePush(req: Request, res: Response): Promise<void> {
    try {
      const { StoreAccount, Code, Stock, ts, '.sig': signature } = req.query;
      
      // 1. 驗證簽章
      const isValid = this._verifySignature(req.query as any);
      if (!isValid) {
        this._sendXMLResponse(res, -2, req.query);
        return;
      }
      
      // 2. 驗證時間戳
      if (!this._validateTimestamp(ts as string)) {
        this._sendXMLResponse(res, -2, req.query);
        return;
      }
      
      // 3. **立即回應成功** (< 100ms)
      this._sendXMLResponse(res, 0, req.query);
      
      // 4. **異步處理**：轉換並發佈事件
      setImmediate(async () => {
        try {
          const standardEvent = this.toStandardEvent({
            storeAccount: StoreAccount,
            productCode: Code,
            quantity: Stock,
            timestamp: ts
          });
          
          await this.eventBus.publish(standardEvent);
          
        } catch (error) {
          console.error('[NextEngineConnector] Push processing error:', error);
          // 記錄到錯誤日誌
        }
      });
      
    } catch (error) {
      console.error('[NextEngineConnector] Push error:', error);
      this._sendXMLResponse(res, -3, req.query);
    }
  }
  
  toStandardEvent(data: any): StandardEvent {
    return {
      id: uuidv4(),
      version: '1.0.0',
      type: 'inventory.updated',
      timestamp: this._parseNETimestamp(data.timestamp),
      source: {
        platform: 'next-engine',
        platformId: data.productCode,
        connector: 'next-engine-push',
        originalEvent: data
      },
      payload: {
        productCode: data.productCode,
        quantity: parseInt(data.quantity, 10),
        change: 0,  // Next Engine 只推送當前值，沒有 delta
        reason: 'adjustment'
      },
      metadata: {
        storeAccount: data.storeAccount
      }
    };
  }
  
  private _verifySignature(queryParams: Record<string, string>): boolean {
    const { '.sig': receivedSig, ...params } = queryParams;
    
    const paramString = new URLSearchParams(params).toString();
    const stringToSign = paramString + this.config.authKey;
    const expectedSig = crypto.createHash('md5').update(stringToSign).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(receivedSig),
      Buffer.from(expectedSig)
    );
  }
  
  private _validateTimestamp(ts: string): boolean {
    const timestamp = this._parseNETimestamp(ts);
    const now = new Date();
    const diffMinutes = Math.abs((now.getTime() - timestamp.getTime()) / 1000 / 60);
    
    return diffMinutes < 10;  // 允許 ±10 分鐘
  }
  
  private _parseNETimestamp(ts: string): Date {
    // YYYYMMDDhhmmss → Date
    return new Date(
      parseInt(ts.substr(0, 4)),   // year
      parseInt(ts.substr(4, 2)) - 1, // month
      parseInt(ts.substr(6, 2)),   // day
      parseInt(ts.substr(8, 2)),   // hour
      parseInt(ts.substr(10, 2)),  // minute
      parseInt(ts.substr(12, 2))   // second
    );
  }
  
  private _sendXMLResponse(res: Response, processedCode: number, queryParams: any): void {
    const xml = `<?xml version="1.0" encoding="EUC-JP"?>
<ShoppingUpdateStock version="1.0">
  <ResultSet TotalResult="1">
    <Request>
      <Argument Name="StoreAccount" Value="${queryParams.StoreAccount || ''}" />
      <Argument Name="Code" Value="${queryParams.Code || ''}" />
      <Argument Name="Stock" Value="${queryParams.Stock || ''}" />
      <Argument Name="ts" Value="${queryParams.ts || ''}" />
      <Argument Name=".sig" Value="${queryParams['.sig'] || ''}" />
    </Request>
    <Result No="1">
      <Processed>${processedCode}</Processed>
    </Result>
  </ResultSet>
</ShoppingUpdateStock>`;
    
    const eucJpBuffer = iconv.encode(xml, 'EUC-JP');
    res.setHeader('Content-Type', 'text/xml; charset=EUC-JP');
    res.send(eucJpBuffer);
  }
}
```

---

### 4. Target Connector 設計

#### Target Connector Interface

```typescript
/**
 * Target Connector Interface
 * 職責：訂閱 Standard Event，轉換並推送到目標平台
 */
interface ITargetConnector {
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

#### 範例：Next Engine Target Connector

```typescript
class NextEngineTargetConnector implements ITargetConnector {
  readonly platform = 'next-engine';
  
  constructor(
    private apiClient: NextEngineAPIClient,
    private config: NextEngineConfig
  ) {}
  
  initialize(eventBus: IEventBus): void {
    // 訂閱需要同步到 Next Engine 的事件
    eventBus.subscribe('inventory.updated', async (event) => {
      // 只處理來自其他平台的事件 (避免循環)
      if (event.source.platform !== 'next-engine') {
        await this.handleEvent(event);
      }
    });
    
    eventBus.subscribe('order.created', async (event) => {
      if (event.source.platform !== 'next-engine') {
        await this.handleEvent(event);
      }
    });
  }
  
  async handleEvent(event: StandardEvent): Promise<void> {
    try {
      console.log(`[NETarget] Handling event: ${event.type} from ${event.source.platform}`);
      
      // 轉換為 Next Engine 格式
      const neData = this.fromStandardEvent(event);
      
      // 呼叫 Next Engine API
      switch (event.type) {
        case 'inventory.updated':
          await this.apiClient.updateInventory(neData);
          break;
        
        case 'order.created':
          await this.apiClient.createOrder(neData);
          break;
        
        default:
          console.warn(`[NETarget] Unhandled event type: ${event.type}`);
      }
      
      console.log(`[NETarget] Successfully processed: ${event.id}`);
      
    } catch (error) {
      console.error(`[NETarget] Error processing event ${event.id}:`, error);
      throw error;  // 讓 EventBus 處理重試
    }
  }
  
  fromStandardEvent(event: StandardEvent): any {
    switch (event.type) {
      case 'inventory.updated':
        return this._fromInventoryEvent(event);
      
      case 'order.created':
        return this._fromOrderEvent(event);
      
      default:
        throw new Error(`Cannot convert event type: ${event.type}`);
    }
  }
  
  private _fromInventoryEvent(event: StandardEvent): any {
    const payload = event.payload as InventoryEventPayload;
    
    return {
      goods_code: payload.productCode,
      stock_quantity: String(payload.quantity)
    };
  }
  
  private _fromOrderEvent(event: StandardEvent): any {
    const payload = event.payload as OrderEventPayload;
    
    return {
      receiveorder_customer_name: payload.customer.name,
      receiveorder_customer_mail_address: payload.customer.email,
      receiveorder_total_amount: String(payload.total),
      receiveorder_row: payload.lineItems.map((item, index) => ({
        receiveorder_row_no: String(index + 1),
        goods_code: item.sku,
        receiveorder_quantity: String(item.quantity),
        receiveorder_unit_price: String(item.price)
      }))
    };
  }
}
```

---

### 5. Sync Engine 設計 (器官)

```typescript
/**
 * Sync Engine
 * 職責：關鍵雙向域的一致性維護
 * 場景：NE ↔ SL 庫存、價格
 */
class SyncEngine {
  private syncRules: Map<string, SyncRule>;
  private conflictResolver: ConflictResolver;
  
  constructor(
    private eventBus: IEventBus,
    private database: Database
  ) {
    this.syncRules = new Map();
    this.conflictResolver = new ConflictResolver();
  }
  
  initialize(): void {
    // 訂閱需要雙向同步的事件
    this.eventBus.subscribe('inventory.updated', this.handleInventorySync.bind(this));
    this.eventBus.subscribe('price.updated', this.handlePriceSync.bind(this));
    
    // 定時對帳任務 (夜間)
    this.scheduleReconciliation();
  }
  
  /**
   * 註冊同步規則
   */
  registerSyncRule(rule: SyncRule): void {
    this.syncRules.set(rule.id, rule);
  }
  
  /**
   * 處理庫存同步
   */
  private async handleInventorySync(event: StandardEvent): Promise<void> {
    const payload = event.payload as InventoryEventPayload;
    
    // 1. 檢查同步規則
    const rule = this._findApplicableRule('inventory', payload.productCode);
    if (!rule) {
      return;  // 不需要同步
    }
    
    // 2. 檢查是否有衝突
    const conflict = await this._detectConflict(event, rule);
    if (conflict) {
      await this._handleConflict(conflict);
      return;
    }
    
    // 3. 記錄同步狀態
    await this.database.syncLog.create({
      eventId: event.id,
      resourceType: 'inventory',
      resourceId: payload.productCode,
      sourcePlatform: event.source.platform,
      targetPlatforms: rule.targetPlatforms,
      status: 'pending'
    });
    
    // 4. 發佈同步完成事件
    await this.eventBus.publish({
      id: uuidv4(),
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
      },
      correlation: {
        causationId: event.id
      }
    });
  }
  
  /**
   * 定時對帳
   */
  private scheduleReconciliation(): void {
    // 每天凌晨 3 點執行對帳
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 3) {
        await this.reconcile();
      }
    }, 60 * 60 * 1000);  // 每小時檢查一次
  }
  
  /**
   * 對帳邏輯
   */
  private async reconcile(): Promise<void> {
    console.log('[SyncEngine] Starting reconciliation...');
    
    // 1. 從所有平台拉取庫存資料
    const shoplineInventory = await this._fetchShoplineInventory();
    const nextEngineInventory = await this._fetchNextEngineInventory();
    
    // 2. 比對差異
    const differences = this._compareInventory(shoplineInventory, nextEngineInventory);
    
    // 3. 自動修正差異 (threshold 內)
    for (const diff of differences) {
      if (Math.abs(diff.delta) <= this.config.autoFixThreshold) {
        await this._autoFixDifference(diff);
      } else {
        // 超過閾值，記錄並告警
        await this._logReconciliationIssue(diff);
        await this.eventBus.publish({
          id: uuidv4(),
          version: '1.0.0',
          type: 'sync.reconciliation_needed',
          timestamp: new Date(),
          source: {
            platform: 'sync-engine',
            platformId: diff.productCode,
            connector: 'reconciliation'
          },
          payload: diff
        });
      }
    }
    
    console.log('[SyncEngine] Reconciliation completed');
  }
  
  private async _detectConflict(event: StandardEvent, rule: SyncRule): Promise<Conflict | null> {
    // 衝突檢測邏輯
    // 1. 檢查是否有同一資源的並發更新
    // 2. 檢查是否違反業務規則
    return null;
  }
  
  private async _handleConflict(conflict: Conflict): Promise<void> {
    // 衝突解決邏輯
    const resolution = await this.conflictResolver.resolve(conflict);
    
    // 發佈衝突檢測事件
    await this.eventBus.publish({
      id: uuidv4(),
      version: '1.0.0',
      type: 'sync.conflict_detected',
      timestamp: new Date(),
      source: {
        platform: 'sync-engine',
        platformId: conflict.resourceId,
        connector: 'conflict-detector'
      },
      payload: {
        conflict,
        resolution
      }
    });
  }
  
  private _findApplicableRule(resourceType: string, resourceId: string): SyncRule | null {
    // 尋找適用的同步規則
    for (const rule of this.syncRules.values()) {
      if (rule.resourceType === resourceType && rule.match(resourceId)) {
        return rule;
      }
    }
    return null;
  }
}

interface SyncRule {
  id: string;
  resourceType: 'inventory' | 'price' | 'product';
  sourcePlatform: string;
  targetPlatforms: string[];
  match: (resourceId: string) => boolean;
  priority: number;
}

interface Conflict {
  resourceType: string;
  resourceId: string;
  events: StandardEvent[];
  detectedAt: Date;
}
```

---

## 📂 新目錄結構

```
custom-app/
├── core/
│   ├── event-bus/
│   │   ├── IEventBus.ts                      # 介面
│   │   ├── InMemoryEventBus.ts               # 初期實作
│   │   ├── RedisEventBus.ts                  # 未來 (使用 Redis Streams)
│   │   ├── EventStore.ts                     # 事件儲存
│   │   ├── SchemaRegistry.ts                 # Schema 管理
│   │   └── index.ts
│   │
│   ├── events/
│   │   ├── StandardEvent.ts                  # 標準事件定義
│   │   ├── EventTypes.ts                     # 事件類型定義
│   │   ├── EventPayloads.ts                  # Payload 定義
│   │   └── index.ts
│   │
│   ├── connectors/
│   │   ├── ISourceConnector.ts               # Source 介面
│   │   ├── ITargetConnector.ts               # Target 介面
│   │   └── index.ts
│   │
│   └── index.ts
│
├── connectors/
│   ├── shopline/
│   │   ├── source/
│   │   │   └── ShoplineSourceConnector.ts    # Webhook Handler
│   │   ├── target/
│   │   │   └── ShoplineTargetConnector.ts    # API Caller
│   │   ├── transformers/
│   │   │   ├── toStandardEvent.ts
│   │   │   └── fromStandardEvent.ts
│   │   └── index.ts
│   │
│   ├── next-engine/
│   │   ├── source/
│   │   │   └── NextEngineSourceConnector.ts  # Push Handler
│   │   ├── target/
│   │   │   └── NextEngineTargetConnector.ts  # API Caller
│   │   ├── transformers/
│   │   │   ├── toStandardEvent.ts
│   │   │   └── fromStandardEvent.ts
│   │   └── index.ts
│   │
│   └── (future: shopify, woocommerce, slack, sheets...)
│
├── engines/                                   # 器官層
│   ├── sync-engine/
│   │   ├── SyncEngine.ts
│   │   ├── ConflictResolver.ts
│   │   ├── Reconciliation.ts
│   │   └── index.ts
│   │
│   ├── workflow-engine/  (未來)
│   └── analytics-engine/  (未來)
│
├── api/                                       # API Routes
│   ├── webhooks/
│   │   ├── shopline.js                       # Source Connector 入口
│   │   └── nextengine-stock.js               # Source Connector 入口
│   │
│   └── events/                                # Event API (可選)
│       ├── publish.js                         # 手動發佈事件
│       └── query.js                           # 查詢歷史事件
│
├── utils/
│   ├── database-postgres.js
│   └── logger.js
│
├── config/
│   ├── event-bus.json
│   ├── connectors.json
│   └── sync-rules.json
│
├── tests/
│   ├── core/
│   │   ├── event-bus/
│   │   └── events/
│   ├── connectors/
│   │   ├── shopline/
│   │   └── next-engine/
│   └── engines/
│       └── sync-engine/
│
└── server.js                                  # 啟動所有組件
```

---

## 🚀 Phase 1 實施計劃 V3

### Day 1: Event Bus + Standard Event (30%)

#### 上午
- [ ] `core/events/StandardEvent.ts` - 標準事件定義
- [ ] `core/events/EventTypes.ts` - 事件類型枚舉
- [ ] `core/events/EventPayloads.ts` - Payload 定義

#### 下午
- [ ] `core/event-bus/IEventBus.ts` - Event Bus 介面
- [ ] `core/event-bus/InMemoryEventBus.ts` - 初期實作
- [ ] 單元測試

### Day 2: Source Connectors (60%)

#### 上午
- [ ] `core/connectors/ISourceConnector.ts`
- [ ] `connectors/shopline/source/ShoplineSourceConnector.ts`
- [ ] `connectors/shopline/transformers/toStandardEvent.ts`

#### 下午
- [ ] `connectors/next-engine/source/NextEngineSourceConnector.ts`
- [ ] `connectors/next-engine/transformers/toStandardEvent.ts`
- [ ] 單元測試

### Day 3: Target Connectors + Sync Engine (90%)

#### 上午
- [ ] `core/connectors/ITargetConnector.ts`
- [ ] `connectors/shopline/target/ShoplineTargetConnector.ts`
- [ ] `connectors/next-engine/target/NextEngineTargetConnector.ts`

#### 下午
- [ ] `engines/sync-engine/SyncEngine.ts`
- [ ] 同步規則配置
- [ ] 整合測試

### Day 4: 整合與測試 (100%)

#### 全天
- [ ] 端到端測試
- [ ] 效能測試
- [ ] 文件更新

## 📊 Event Monitor Dashboard

### 功能概述
Event Monitor Dashboard 是 Event Bus 系統的**可視化監控工具**，讓用戶能夠直觀地測試和監控事件流。

### 核心功能
1. **即時監控**：使用 Server-Sent Events (SSE) 訂閱模式
2. **事件發布測試**：測試 Event Bus 事件發布功能
3. **歷史事件載入**：載入最近 100 筆歷史事件
4. **統計顯示**：顯示資料庫總事件數和 log 區域統計

### 技術實作
- **前端**：HTML + JavaScript + SSE
- **後端**：Express.js + Event Bus
- **資料庫**：PostgreSQL
- **API 端點**：
  - `GET /api/event-monitor/events` - 獲取歷史事件
  - `GET /api/event-monitor/stream` - SSE 事件流
  - `POST /api/event-monitor/test-simple` - 發布測試事件

### 統計數字說明
- **右上角「資料庫總事件數」**：顯示資料庫中所有事件的總數
- **下方統計卡片**：顯示當前 log 顯示區域中的事件統計
- **最後事件時間**：顯示最新事件的真實時間戳（非前端處理時間）

---

## ✅ 成功標準

### 技術標準
- ✅ Event Bus 可以發佈/訂閱事件
- ✅ Shopline Webhook → Standard Event → Next Engine API (成功)
- ✅ Next Engine Push → Standard Event → Shopline API (成功)
- ✅ Sync Engine 可以檢測衝突並對帳
- ✅ 新增 Shopify Connector 只需 1-2 天 (驗證可擴展性)

### 業務標準
- ✅ 庫存變動可以雙向同步
- ✅ 訂單建立可以從 SL 同步到 NE
- ✅ 夜間對帳可以自動修正差異

---

## 🎊 總結

這個 V3 架構的核心優勢：

1. **Event Bus 作為背骨**：所有變化都是事件，核心完全不依賴具體平台
2. **Connector 只負責轉換**：新增端點只需實作 Source + Target Connector
3. **Sync Engine 作為器官**：雙向同步邏輯獨立，不影響核心
4. **可觀測性**：所有事件可追蹤、可回放
5. **可擴展性**：未來可加入 Workflow Engine, Analytics Engine

**這次的設計可以確保：新增任何端點都不會影響核心業務邏輯！** 🚀

