# 多平台 Connector 架構設計 V2.0

> ⚠️ **此文件已過時** (Archived on 2025-10-22)
> 
> **當前版本**: [Event-Driven 架構 V3.0](../EVENT_DRIVEN_ARCHITECTURE_V3.md)
> 
> **為什麼過時**:
> - V2 採用 Platform 抽象層，但 Service Layer 仍需知道平台細節
> - 新增端點可能影響核心邏輯
> - V3 採用 Event-Driven 架構，核心完全不依賴平台
> 
> **保留原因**: 作為架構演進參考，理解從 V2 → V3 的決策過程
> 
> **實作請參考**: [Event-Driven 架構 V3](../EVENT_DRIVEN_ARCHITECTURE_V3.md)

---

## 📋 文件資訊

- **版本**: 2.0.0 (已過時)
- **建立日期**: 2025-10-22
- **狀態**: ✅ **基於三方 API 深度研究完成**
- **目標**: 支援 Shopline (REST + GraphQL) + Next Engine 的統一 Connector
- **重大更新**: 基於 Phase 0 研究成果，重新設計架構以支援 3 種 API 風格

---

## 🎯 架構目標（更新）

### 從 (AS-IS)
```
單一平台，單一 API 風格
├── Shopline REST OAuth
├── Shopline REST API Client
└── Shopline 特定邏輯
```

### 到 (TO-BE)
```
多平台，多 API 風格 Connector
├── 統一 OAuth 抽象層
│   ├── 標準 OAuth 2.0 (Shopline)
│   └── OAuth-like (Next Engine - 自動 token 更新)
├── 多 API 風格支援
│   ├── REST API (Shopline + Next Engine)
│   ├── GraphQL API (Shopline)
│   └── 推送式 API (Next Engine 庫存推送)
├── 統一資料模型
│   ├── ID 轉換 (數字 ↔ GID ↔ 字串)
│   ├── 過濾語法轉換 (3 種)
│   └── 分頁機制轉換 (offset ↔ cursor ↔ page)
└── Webhook / 推送處理
    ├── Shopline Webhook (POST, JSON, HMAC-SHA256)
    └── Next Engine 推送 (GET, XML, HMAC-MD5)
```

---

## 🔑 關鍵設計決策（基於研究發現）

### 決策 1: 不能只用一種 API
**原因**: 
- Shopline GraphQL **不支援 Orders API**
- Next Engine 只有 REST，但有**獨特的 token 自動更新**
- Next Engine 有**反向推送式庫存更新**（非傳統 Webhook）

**結論**: 必須同時支援 REST, GraphQL, 和推送式 API

### 決策 2: Token 管理需要兩種策略
**原因**:
- Shopline: 傳統 OAuth 2.0，token 過期需**手動 refresh**
- Next Engine: **每次 API 呼叫都可能返回新 token**

**結論**: TokenManager 必須支援兩種模式

### 決策 3: 需要複雜的資料轉換層
**原因**:
- ID 格式: 數字 (Shopline REST) vs GID (Shopline GraphQL) vs 字串 (Next Engine)
- 過濾語法: Query Params vs Lucene-like vs 運算子後綴
- 分頁: Offset vs Cursor vs Page
- 客戶資料: Shopline 有獨立 API，Next Engine 內嵌在訂單中

**結論**: 需要強大的 DataMapper 和 Converter

### 決策 4: Webhook 需要兩種處理器
**原因**:
- Shopline: 傳統 Webhook (POST, JSON, UTF-8, HMAC-SHA256)
- Next Engine: 反向推送 (GET, XML, EUC-JP, HMAC-MD5, < 1 秒回應)

**結論**: WebhookHandler 需要完全不同的兩種實作

---

## 🏗️ 新架構分層

### 三層架構 + 兩個跨層組件

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer (路由層)                          │
│  Express Routes / Vercel Functions                              │
│  - /oauth/install, /oauth/callback                              │
│  - /api/products, /api/orders                                   │
│  - /webhook/shopline, /webhook/nextengine                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                     Service Layer (業務層)                        │
│  平台無關的業務邏輯                                                 │
│  - AuthService                                                  │
│  - ProductService                                               │
│  - OrderService                                                 │
│  - CustomerService                                              │
│  - InventoryService                                             │
│  - WebhookService                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                     Core Layer (核心抽象層)                        │
│  統一介面定義                                                       │
│  - Platform Interface                                           │
│  - OAuthProvider Interface                                      │
│  - APIClient Interface (支援 REST + GraphQL)                    │
│  - DataMapper Interface                                         │
│  - WebhookHandler Interface                                     │
│  - Base Classes (BaseOAuth, BaseAPI, BaseMapper...)            │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                  Platform Layer (平台實作層)                       │
│  各平台具體實作                                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ platforms/shopline/                                     │   │
│  │  ├── ShoplineRESTOAuth.js                               │   │
│  │  ├── ShoplineRESTClient.js  ← Orders API               │   │
│  │  ├── ShoplineGraphQLClient.js  ← Products API          │   │
│  │  ├── ShoplineMapper.js  (GID ↔ 數字)                    │   │
│  │  ├── ShoplineWebhook.js  (POST, JSON, SHA256)          │   │
│  │  └── index.js                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ platforms/next-engine/                                   │   │
│  │  ├── NextEngineOAuth.js  (獨特流程)                      │   │
│  │  ├── NextEngineClient.js  (自動 token 更新)              │   │
│  │  ├── NextEngineMapper.js  (字串 ID, 客戶提取)            │   │
│  │  ├── NextEngineStockPush.js  (GET, XML, MD5, < 1s)      │   │
│  │  └── index.js                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│           Shared Utilities (跨層共用工具)                          │
│  - IDConverter (數字 ↔ GID ↔ 字串)                               │
│  - FilterConverter (3 種過濾語法互轉)                              │
│  - PaginationConverter (offset ↔ cursor ↔ page)                │
│  - SignatureVerifier (SHA256 vs MD5)                           │
│  - XMLBuilder / XMLParser (Next Engine)                        │
│  - Database (TokenStorage, DataStorage)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 新目錄結構（V2）

```
custom-app/
├── core/                                # 核心抽象層
│   ├── interfaces/                      # 介面定義
│   │   ├── Platform.js
│   │   ├── OAuthProvider.js
│   │   ├── APIClient.js                 # ⭐ 支援 REST + GraphQL
│   │   │   ├── RESTClient
│   │   │   └── GraphQLClient
│   │   ├── DataMapper.js
│   │   ├── WebhookHandler.js            # ⭐ 新增
│   │   └── PushHandler.js               # ⭐ 新增 (Next Engine 式)
│   │
│   ├── base/                            # 基礎實作
│   │   ├── BasePlatform.js
│   │   ├── BaseOAuthProvider.js
│   │   ├── BaseRESTClient.js            # ⭐ 新增
│   │   ├── BaseGraphQLClient.js         # ⭐ 新增
│   │   ├── BaseDataMapper.js
│   │   ├── BaseWebhookHandler.js        # ⭐ 新增
│   │   └── BasePushHandler.js           # ⭐ 新增
│   │
│   ├── models/                          # ⭐ 統一資料模型
│   │   ├── UnifiedProduct.js
│   │   ├── UnifiedOrder.js
│   │   ├── UnifiedCustomer.js
│   │   ├── UnifiedInventory.js
│   │   └── index.js
│   │
│   └── registry/                        # 平台註冊表
│       ├── PlatformRegistry.js
│       └── config.js
│
├── platforms/                           # 平台實作層
│   ├── shopline/
│   │   ├── oauth/
│   │   │   └── ShoplineOAuth.js         # 標準 OAuth 2.0
│   │   ├── api/
│   │   │   ├── ShoplineRESTClient.js    # ⭐ REST API (Orders 必用)
│   │   │   └── ShoplineGraphQLClient.js # ⭐ GraphQL API (Products 可用)
│   │   ├── mappers/
│   │   │   ├── ProductMapper.js         # ⭐ GID 轉換
│   │   │   ├── OrderMapper.js
│   │   │   ├── CustomerMapper.js
│   │   │   └── index.js
│   │   ├── webhook/
│   │   │   └── ShoplineWebhook.js       # ⭐ POST, JSON, SHA256
│   │   ├── utils/
│   │   │   ├── signature.js             # HMAC-SHA256
│   │   │   └── gid-converter.js         # ⭐ GID ↔ 數字
│   │   ├── config.json
│   │   └── index.js
│   │
│   └── next-engine/
│       ├── oauth/
│       │   └── NextEngineOAuth.js       # ⭐ OAuth-like (uid/state)
│       ├── api/
│       │   └── NextEngineClient.js      # ⭐ 自動 token 更新
│       ├── mappers/
│       │   ├── ProductMapper.js         # ⭐ 字串 ID
│       │   ├── OrderMapper.js           # ⭐ 客戶資料提取
│       │   └── index.js
│       ├── push/
│       │   └── StockPushHandler.js      # ⭐ GET, XML, MD5, < 1s
│       ├── utils/
│       │   ├── signature.js             # HMAC-MD5
│       │   ├── xml-builder.js           # ⭐ EUC-JP XML
│       │   └── token-manager.js         # ⭐ 自動更新邏輯
│       ├── config.json
│       └── index.js
│
├── services/                            # 業務服務層
│   ├── AuthService.js                   # ⭐ 兩種 OAuth 策略
│   ├── ProductService.js                # ⭐ 優先用 GraphQL
│   ├── OrderService.js                  # ⭐ 只能用 REST
│   ├── CustomerService.js               # ⭐ SL 用 API, NE 從訂單提取
│   ├── InventoryService.js              # ⭐ 雙向同步
│   ├── WebhookService.js                # ⭐ 兩種 Handler
│   └── SyncService.js                   # ⭐ 新增：跨平台同步
│
├── utils/                               # 共用工具
│   ├── converters/
│   │   ├── IDConverter.js               # ⭐ 數字 ↔ GID ↔ 字串
│   │   ├── FilterConverter.js           # ⭐ 3 種過濾語法
│   │   ├── PaginationConverter.js       # ⭐ 3 種分頁機制
│   │   └── index.js
│   ├── validators/
│   │   ├── SignatureVerifier.js         # ⭐ SHA256 vs MD5
│   │   ├── TimestampValidator.js
│   │   └── index.js
│   ├── database-postgres.js             # 資料庫抽象
│   └── logger.js
│
├── api/                                 # Vercel Functions
│   ├── oauth/
│   │   ├── install.js                   # ⭐ platform 參數
│   │   └── callback.js                  # ⭐ platform 參數
│   ├── products/
│   │   ├── list.js                      # ⭐ 優先用 GraphQL
│   │   └── [id].js
│   ├── orders/
│   │   ├── list.js                      # ⭐ 只能用 REST
│   │   └── [id].js
│   └── webhooks/
│       ├── shopline.js                  # ⭐ POST Handler
│       └── nextengine-stock.js          # ⭐ GET Handler
│
├── routes/                              # Express Routes (local dev)
│   ├── oauth.js                         # ⭐ platform-aware
│   ├── products.js
│   ├── orders.js
│   └── webhooks.js                      # ⭐ 兩種 Handler
│
├── config/
│   ├── platforms.json                   # 平台配置
│   ├── database.json
│   └── webhooks.json                    # ⭐ Webhook 配置
│
├── tests/
│   ├── core/                            # 抽象層測試
│   ├── platforms/
│   │   ├── shopline/                    # Shopline 測試
│   │   └── next-engine/                 # Next Engine 測試
│   ├── services/                        # 服務層測試
│   └── utils/                           # 工具測試
│
├── scripts/                             # 工具腳本
│   ├── test-shopline-graphql.js         # ⭐ GraphQL 測試
│   ├── test-nextengine-oauth.js         # ⭐ NE OAuth 測試
│   └── test-nextengine-push.js          # ⭐ NE 推送測試
│
├── docs/
│   ├── architecture/
│   │   ├── MULTI_PLATFORM_ARCHITECTURE_V2.md  # 本文件
│   │   ├── THREE_PLATFORM_API_COMPARISON.md
│   │   └── PHASE1_IMPLEMENTATION_PLAN_V2.md
│   ├── research/
│   │   ├── SHOPLINE_GRAPHQL_RESEARCH.md
│   │   ├── NEXT_ENGINE_API_RESEARCH.md
│   │   └── ...
│   └── guides/
│       ├── SHOPLINE_INTEGRATION.md
│       └── NEXT_ENGINE_INTEGRATION.md
│
├── server.js                            # Express server (local)
├── vercel.json                          # Vercel config
└── package.json
```

---

## 🔧 核心介面定義（V2）

### 1. Platform Interface

```typescript
interface Platform {
  name: string;                          // 'shopline', 'next-engine'
  type: 'ecommerce' | 'oms' | 'erp';     // 平台類型
  
  // OAuth
  oauth: OAuthProvider;
  
  // API Clients (可能有多個)
  api: {
    rest?: RESTClient;
    graphql?: GraphQLClient;
  };
  
  // Data Mapping
  mapper: DataMapper;
  
  // Webhook / Push
  webhook?: WebhookHandler;
  push?: PushHandler;                    // ⭐ Next Engine 式
  
  // Config
  config: PlatformConfig;
  
  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}
```

### 2. OAuthProvider Interface (支援兩種策略)

```typescript
interface OAuthProvider {
  strategy: 'oauth2' | 'custom';         // ⭐ 新增
  
  // OAuth 2.0 標準流程
  authorize(params: AuthorizeParams): Promise<string>;
  handleCallback(params: CallbackParams): Promise<TokenData>;
  refreshToken(refreshToken: string): Promise<TokenData>;  // Shopline 用
  revokeToken(accessToken: string): Promise<void>;
  
  // Custom 流程 (Next Engine)
  getUidAndState?(params: any): Promise<{ uid: string; state: string }>;
  exchangeToken?(uid: string, state: string): Promise<TokenData>;
  
  // Token 管理策略
  tokenStrategy: 'manual-refresh' | 'auto-refresh';  // ⭐ 新增
  handleTokenUpdate?(response: any): TokenData | null;  // ⭐ NE 自動更新
}
```

### 3. APIClient Interface (支援 REST + GraphQL)

```typescript
// 基礎介面
interface APIClient {
  type: 'rest' | 'graphql';
  platform: string;
  
  // 統一請求介面
  request(spec: APIRequestSpec): Promise<APIResponse>;
  
  // Token 管理
  setToken(accessToken: string, refreshToken?: string): void;
  getToken(): { accessToken: string; refreshToken?: string };
}

// REST Client
interface RESTClient extends APIClient {
  type: 'rest';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  contentType: 'application/json' | 'application/x-www-form-urlencoded';  // ⭐ NE 用
  
  // CRUD operations
  products: RESTResource;
  orders: RESTResource;
  customers?: RESTResource;
  inventory: RESTResource;
}

// GraphQL Client
interface GraphQLClient extends APIClient {
  type: 'graphql';
  
  // GraphQL operations
  query(query: string, variables?: any): Promise<any>;
  mutate(mutation: string, variables?: any): Promise<any>;
  
  // Resource helpers
  products: GraphQLResource;
  // orders: 不支援 (Shopline)
  customers?: GraphQLResource;
}

// 請求規範
interface APIRequestSpec {
  resource: 'products' | 'orders' | 'customers' | 'inventory';
  action: 'list' | 'get' | 'create' | 'update' | 'delete' | 'count';
  
  // 通用參數
  id?: string;
  filters?: Record<string, any>;        // 會被轉換為平台語法
  pagination?: PaginationSpec;          // 會被轉換為平台格式
  fields?: string[];                    // GraphQL 用
  
  // 平台特定（可選）
  platformSpecific?: any;
}
```

### 4. DataMapper Interface (處理複雜轉換)

```typescript
interface DataMapper {
  platform: string;
  
  // 雙向映射
  toUnified(resource: string, platformData: any): UnifiedModel;
  toPlatform(resource: string, unifiedData: UnifiedModel): any;
  
  // ID 轉換
  idConverter: IDConverter;
  
  // 過濾轉換
  filterConverter: FilterConverter;
  
  // 分頁轉換
  paginationConverter: PaginationConverter;
  
  // 特殊處理
  extractCustomersFromOrders?(orders: any[]): UnifiedCustomer[];  // ⭐ NE 用
}

// ID Converter
interface IDConverter {
  toUnified(platformId: any): string;    // 統一為字串
  toPlatform(unifiedId: string): any;    // 轉回平台格式
  
  // Shopline GraphQL 特有
  toGID?(resourceType: string, id: string): string;
  fromGID?(gid: string): { type: string; id: string };
}

// Filter Converter
interface FilterConverter {
  // 從統一格式轉為平台格式
  toPlatform(filters: UnifiedFilters): any;
  
  // 從平台格式轉為統一格式
  toUnified(platformFilters: any): UnifiedFilters;
  
  // 支援的運算子
  supportedOperators: string[];  // ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'in']
}

// Pagination Converter
interface PaginationConverter {
  type: 'offset' | 'cursor' | 'page';
  
  toPlatform(pagination: UnifiedPagination): any;
  toUnified(platformPagination: any): UnifiedPagination;
  
  // Cursor ↔ Offset 轉換
  cursorToOffset?(cursor: string): number;
  offsetToCursor?(offset: number): string;
}
```

### 5. WebhookHandler / PushHandler Interface

```typescript
// Shopline 傳統 Webhook
interface WebhookHandler {
  platform: string;
  
  // 請求處理
  handle(req: Request, res: Response): Promise<void>;
  
  // 簽章驗證
  verify(req: Request): boolean;
  
  // 事件處理
  onEvent(eventType: string, data: any): Promise<void>;
  
  // 配置
  config: {
    secret: string;
    algorithm: 'sha256' | 'md5';         // ⭐
    encoding: 'utf-8' | 'euc-jp';        // ⭐
    format: 'json' | 'xml';              // ⭐
  };
}

// Next Engine 推送式
interface PushHandler {
  platform: string;
  
  // GET 請求處理
  handle(req: Request, res: Response): Promise<void>;
  
  // 簽章驗證 (MD5)
  verify(queryParams: Record<string, string>, authKey: string): boolean;
  
  // 時間戳驗證
  validateTimestamp(ts: string): boolean;
  
  // XML 回應生成
  buildResponse(processedCode: number, queryParams: any): string;
  
  // 異步處理
  handleAsync(data: StockPushData): Promise<void>;
  
  // 配置
  config: {
    authKey: string;
    storeAccount: string;
    url: string;
    performanceTarget: number;           // ⭐ < 1000ms
  };
}
```

---

## 📦 統一資料模型

### UnifiedProduct

```typescript
interface UnifiedProduct {
  // 基本資訊
  id: string;                            // 統一為字串
  code: string;                          // SKU
  title: string;
  description?: string;
  
  // 價格
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  
  // 庫存
  stock: number;
  
  // 狀態
  status: 'active' | 'draft' | 'archived';
  
  // 變體
  variants?: UnifiedVariant[];
  
  // 圖片
  images?: UnifiedImage[];
  
  // 分類
  tags?: string[];
  categories?: string[];
  
  // 元數據
  metadata: {
    platform: string;
    platformId: any;                     // 原始平台 ID
    createdAt: Date;
    updatedAt: Date;
  };
}
```

### UnifiedOrder

```typescript
interface UnifiedOrder {
  // 基本資訊
  id: string;
  orderNumber: string;
  
  // 客戶資訊 (Shopline 有獨立 customerId, NE 內嵌)
  customer: {
    id?: string;                         // Shopline 有，NE 無
    name: string;
    email: string;
    phone?: string;
    // ... 地址資訊
  };
  
  // 訂單項目
  lineItems: UnifiedLineItem[];
  
  // 金額
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  
  // 狀態
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  fulfillmentStatus: 'unfulfilled' | 'fulfilled';
  
  // 日期
  orderDate: Date;
  
  // 元數據
  metadata: {
    platform: string;
    platformId: any;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

### UnifiedCustomer

```typescript
interface UnifiedCustomer {
  id: string;                            // Shopline 有，NE 需自行生成
  name: string;
  email: string;
  phone?: string;
  
  // 地址
  addresses?: UnifiedAddress[];
  
  // 訂單統計 (NE 從訂單提取)
  orderCount?: number;
  totalSpent?: number;
  
  // 元數據
  metadata: {
    platform: string;
    platformId?: any;                    // NE 可能無
    source: 'api' | 'extracted';         // ⭐ NE 用
    extractedFrom?: string[];            // ⭐ NE: order IDs
    createdAt: Date;
    updatedAt: Date;
  };
}
```

---

## 🔄 Token 管理策略（兩種模式）

### Mode 1: Manual Refresh (Shopline)

```typescript
class ShoplineTokenManager {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: number;
  
  async getValidToken(): Promise<string> {
    // 檢查是否過期
    if (Date.now() >= this.expiresAt) {
      // 手動 refresh
      const newTokens = await this.oauth.refreshToken(this.refreshToken);
      this.accessToken = newTokens.accessToken;
      this.refreshToken = newTokens.refreshToken;
      this.expiresAt = newTokens.expiresAt;
      await this.saveToDatabase();
    }
    
    return this.accessToken;
  }
}
```

### Mode 2: Auto Refresh (Next Engine)

```typescript
class NextEngineTokenManager {
  private accessToken: string;
  private refreshToken: string;
  
  async callAPI(endpoint: string, params: any): Promise<any> {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: new URLSearchParams({
        access_token: this.accessToken,
        refresh_token: this.refreshToken,
        ...params
      })
    });
    
    const data = await response.json();
    
    // ⭐ 檢查是否有新 token
    if (data.access_token) {
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      await this.saveToDatabase();  // 立即保存
    }
    
    return data;
  }
}
```

---

## 🌐 Webhook / Push 處理（兩種模式）

### Mode 1: Shopline Webhook (傳統)

```typescript
// routes/webhooks/shopline.js
app.post('/webhooks/shopline/:event', async (req, res) => {
  try {
    // 1. 驗證簽章 (HMAC-SHA256)
    const signature = req.headers['x-shopline-hmac-sha256'];
    const isValid = verifyShoplineSignature(req.body, signature, SECRET);
    
    if (!isValid) {
      return res.status(401).send('Invalid signature');
    }
    
    // 2. 解析事件
    const eventType = req.params.event;  // 'inventory.updated'
    const data = req.body;               // JSON
    
    // 3. 處理事件
    await webhookService.handleShoplineEvent(eventType, data);
    
    // 4. 立即回應 200
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Shopline webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});
```

### Mode 2: Next Engine Stock Push (反向)

```typescript
// routes/webhooks/nextengine-stock.js
app.get('/webhooks/nextengine/stock', async (req, res) => {
  try {
    const { StoreAccount, Code, Stock, ts, '.sig': signature } = req.query;
    
    // 1. 驗證簽章 (HMAC-MD5)
    const isValid = verifyNextEngineSignature(req.query, AUTH_KEY);
    
    if (!isValid) {
      return sendXMLResponse(res, -2, req.query);  // Client Error
    }
    
    // 2. 驗證時間戳 (防止重放)
    if (!validateTimestamp(ts)) {
      return sendXMLResponse(res, -2, req.query);
    }
    
    // 3. **立即回應成功** (< 100ms)
    sendXMLResponse(res, 0, req.query);
    
    // 4. **異步處理**庫存更新
    setImmediate(async () => {
      try {
        await inventoryService.updateFromNextEngine({
          storeAccount: StoreAccount,
          productCode: Code,
          quantity: parseInt(Stock),
          timestamp: ts
        });
        
        // 同步到 Shopline
        await inventoryService.syncToShopline(Code, Stock);
        
      } catch (error) {
        console.error('Async stock update failed:', error);
        // 記錄到錯誤日誌，稍後重試
      }
    });
    
  } catch (error) {
    console.error('Next Engine push error:', error);
    sendXMLResponse(res, -3, req.query);  // System Error
  }
});

function sendXMLResponse(res, processedCode, queryParams) {
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
```

---

## 🎨 Service Layer 範例

### ProductService (多 API 風格)

```typescript
class ProductService {
  async getProducts(platform: string, filters: any, pagination: any) {
    const platformInstance = PlatformRegistry.get(platform);
    
    // Shopline: 優先使用 GraphQL (更靈活)
    if (platform === 'shopline' && platformInstance.api.graphql) {
      return await this._getProductsGraphQL(platformInstance, filters, pagination);
    }
    
    // Fallback to REST
    return await this._getProductsREST(platformInstance, filters, pagination);
  }
  
  private async _getProductsGraphQL(platform, filters, pagination) {
    // 1. 轉換過濾語法 (Unified → GraphQL)
    const graphqlQuery = platform.mapper.filterConverter.toGraphQLQuery(filters);
    
    // 2. 轉換分頁 (Unified → Cursor)
    const { first, after } = platform.mapper.paginationConverter.toCursor(pagination);
    
    // 3. 呼叫 GraphQL API
    const query = `
      query GetProducts($first: Int, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
          edges {
            node {
              id
              title
              handle
              status
              variants(first: 10) {
                edges {
                  node {
                    id
                    sku
                    price
                    inventoryQuantity
                  }
                }
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    
    const response = await platform.api.graphql.query(query, {
      first,
      after,
      query: graphqlQuery
    });
    
    // 4. 映射為統一格式
    const products = response.data.products.edges.map(edge => 
      platform.mapper.toUnified('product', edge.node)
    );
    
    return {
      data: products,
      pagination: {
        hasMore: response.data.products.pageInfo.hasNextPage,
        cursor: response.data.products.pageInfo.endCursor
      }
    };
  }
  
  private async _getProductsREST(platform, filters, pagination) {
    // REST 邏輯 (略)
  }
}
```

### OrderService (只能用 REST)

```typescript
class OrderService {
  async getOrders(platform: string, filters: any, pagination: any) {
    const platformInstance = PlatformRegistry.get(platform);
    
    // ⚠️ Shopline GraphQL 不支援 Orders，必須用 REST
    if (!platformInstance.api.rest) {
      throw new Error(`Platform ${platform} does not support REST API for orders`);
    }
    
    // 1. 轉換過濾語法
    const platformFilters = platformInstance.mapper.filterConverter.toPlatform(filters);
    
    // 2. 轉換分頁
    const platformPagination = platformInstance.mapper.paginationConverter.toPlatform(pagination);
    
    // 3. 呼叫 REST API
    const response = await platformInstance.api.rest.orders.list({
      filters: platformFilters,
      pagination: platformPagination
    });
    
    // 4. 映射為統一格式
    const orders = response.data.map(order => 
      platformInstance.mapper.toUnified('order', order)
    );
    
    return {
      data: orders,
      pagination: response.pagination
    };
  }
}
```

### CustomerService (兩種策略)

```typescript
class CustomerService {
  async getCustomers(platform: string, filters: any, pagination: any) {
    const platformInstance = PlatformRegistry.get(platform);
    
    // Shopline: 有獨立 Customers API
    if (platform === 'shopline') {
      return await this._getCustomersAPI(platformInstance, filters, pagination);
    }
    
    // Next Engine: 從訂單中提取
    if (platform === 'next-engine') {
      return await this._getCustomersFromOrders(platformInstance, filters, pagination);
    }
  }
  
  private async _getCustomersAPI(platform, filters, pagination) {
    // 直接呼叫 Customers API
    const response = await platform.api.rest.customers.list({
      filters,
      pagination
    });
    
    return {
      data: response.data.map(c => platform.mapper.toUnified('customer', c))
    };
  }
  
  private async _getCustomersFromOrders(platform, filters, pagination) {
    // 1. 先取得訂單
    const orders = await platform.api.rest.orders.list({ pagination: { limit: 1000 } });
    
    // 2. 從訂單中提取客戶
    const customers = platform.mapper.extractCustomersFromOrders(orders.data);
    
    // 3. 去重（by email）
    const uniqueCustomers = this._deduplicateCustomers(customers);
    
    // 4. 應用過濾和分頁
    return this._filterAndPaginate(uniqueCustomers, filters, pagination);
  }
}
```

---

## 🔄 漸進式遷移計劃（V2）

### Phase 0: 研究階段 ✅ 已完成
- [x] Shopline REST API 研究
- [x] Shopline GraphQL API 研究
- [x] Next Engine API 研究
- [x] 三方 API 對比表
- [x] 架構設計 V2

### Phase 1: 核心抽象層（3-4 天）
**目標**: 建立支援 3 種 API 風格的抽象層

#### 1.1 建立核心介面（1 天）
- [ ] `core/interfaces/Platform.js`
- [ ] `core/interfaces/OAuthProvider.js`
- [ ] `core/interfaces/APIClient.js` (REST + GraphQL)
- [ ] `core/interfaces/DataMapper.js`
- [ ] `core/interfaces/WebhookHandler.js`
- [ ] `core/interfaces/PushHandler.js`

#### 1.2 建立基礎類別（1 天）
- [ ] `core/base/BasePlatform.js`
- [ ] `core/base/BaseOAuthProvider.js`
- [ ] `core/base/BaseRESTClient.js`
- [ ] `core/base/BaseGraphQLClient.js`
- [ ] `core/base/BaseDataMapper.js`

#### 1.3 建立統一資料模型（0.5 天）
- [ ] `core/models/UnifiedProduct.js`
- [ ] `core/models/UnifiedOrder.js`
- [ ] `core/models/UnifiedCustomer.js`
- [ ] `core/models/UnifiedInventory.js`

#### 1.4 建立共用工具（0.5 天）
- [ ] `utils/converters/IDConverter.js`
- [ ] `utils/converters/FilterConverter.js`
- [ ] `utils/converters/PaginationConverter.js`
- [ ] `utils/validators/SignatureVerifier.js`
- [ ] `utils/xml-builder.js` (Next Engine)

#### 1.5 建立註冊表（0.5 天）
- [ ] `core/registry/PlatformRegistry.js`
- [ ] `config/platforms.json`

**驗證**: 單元測試通過

### Phase 2: Shopline 平台重構（2-3 天）
**目標**: 將現有 Shopline 代碼重構為新架構

#### 2.1 Shopline OAuth（0.5 天）
- [ ] `platforms/shopline/oauth/ShoplineOAuth.js`
- [ ] 測試 OAuth 流程

#### 2.2 Shopline REST Client（1 天）
- [ ] `platforms/shopline/api/ShoplineRESTClient.js`
- [ ] Products API
- [ ] **Orders API** (重點)
- [ ] Customers API
- [ ] Inventory API

#### 2.3 Shopline GraphQL Client（1 天）
- [ ] `platforms/shopline/api/ShoplineGraphQLClient.js`
- [ ] Products Query
- [ ] Customers Query
- [ ] Inventory Query
- [ ] Mutations

#### 2.4 Shopline Mapper（0.5 天）
- [ ] `platforms/shopline/mappers/ProductMapper.js` (GID 轉換)
- [ ] `platforms/shopline/mappers/OrderMapper.js`
- [ ] `platforms/shopline/mappers/CustomerMapper.js`
- [ ] `platforms/shopline/utils/gid-converter.js`

#### 2.5 Shopline Webhook（0.5 天）
- [ ] `platforms/shopline/webhook/ShoplineWebhook.js`
- [ ] 簽章驗證 (HMAC-SHA256)
- [ ] 事件處理

**驗證**: 所有現有測試通過

### Phase 3: Next Engine 平台實作（3-4 天）
**目標**: 實作 Next Engine 平台

#### 3.1 Next Engine OAuth（1 天）
- [ ] `platforms/next-engine/oauth/NextEngineOAuth.js`
- [ ] uid/state 流程
- [ ] Token 取得
- [ ] **測試 OAuth 流程** (Priority 1)

#### 3.2 Next Engine API Client（1 天）
- [ ] `platforms/next-engine/api/NextEngineClient.js`
- [ ] **自動 token 更新邏輯**
- [ ] Products API (form-urlencoded)
- [ ] Orders API (受注伝票)
- [ ] Inventory API

#### 3.3 Next Engine Mapper（1 天）
- [ ] `platforms/next-engine/mappers/ProductMapper.js`
- [ ] `platforms/next-engine/mappers/OrderMapper.js`
- [ ] **`platforms/next-engine/mappers/CustomerExtractor.js`** (從訂單提取)
- [ ] 字串 ID 處理

#### 3.4 Next Engine Stock Push（1 天）
- [ ] `platforms/next-engine/push/StockPushHandler.js`
- [ ] GET 請求處理
- [ ] XML 回應生成 (EUC-JP)
- [ ] 簽章驗證 (HMAC-MD5)
- [ ] 異步處理邏輯
- [ ] **效能優化 (< 1 秒)**
- [ ] **測試推送接收** (Priority 1)

**驗證**: Next Engine 所有功能測試通過

### Phase 4: 服務層實作（2-3 天）
**目標**: 建立平台無關的業務層

#### 4.1 Auth Service（0.5 天）
- [ ] `services/AuthService.js`
- [ ] 支援兩種 OAuth 策略

#### 4.2 Product Service（1 天）
- [ ] `services/ProductService.js`
- [ ] **優先使用 GraphQL** (Shopline)
- [ ] Fallback to REST

#### 4.3 Order Service（0.5 天）
- [ ] `services/OrderService.js`
- [ ] **只能用 REST**

#### 4.4 Customer Service（0.5 天）
- [ ] `services/CustomerService.js`
- [ ] Shopline: 用 API
- [ ] Next Engine: 從訂單提取

#### 4.5 Inventory Service（0.5 天）
- [ ] `services/InventoryService.js`
- [ ] **雙向同步** (NE ↔ Shopline)

#### 4.6 Webhook Service（0.5 天）
- [ ] `services/WebhookService.js`
- [ ] **兩種 Handler** (Shopline + Next Engine)

**驗證**: 服務層單元測試通過

### Phase 5: 路由層適配（1-2 天）
**目標**: 改造路由層調用新架構

#### 5.1 OAuth 路由（0.5 天）
- [ ] `routes/oauth.js` → 調用 `AuthService`
- [ ] `api/oauth/install.js` → 調用 `AuthService`
- [ ] `api/oauth/callback.js` → 調用 `AuthService`
- [ ] **支援 platform 參數**

#### 5.2 API 路由（0.5 天）
- [ ] `routes/products.js` → 調用 `ProductService`
- [ ] `routes/orders.js` → 調用 `OrderService`
- [ ] `api/products/*.js` → 調用 `ProductService`
- [ ] `api/orders/*.js` → 調用 `OrderService`

#### 5.3 Webhook 路由（0.5 天）
- [ ] `routes/webhooks.js` → 調用 `WebhookService`
- [ ] `api/webhooks/shopline.js`
- [ ] `api/webhooks/nextengine-stock.js`

**驗證**: 端到端測試通過

### Phase 6: 測試與優化（2-3 天）
**目標**: 完整測試和效能優化

#### 6.1 單元測試（1 天）
- [ ] Core 層測試
- [ ] Platform 層測試
- [ ] Service 層測試
- [ ] Utils 測試

#### 6.2 整合測試（1 天）
- [ ] Shopline 完整流程測試
- [ ] Next Engine 完整流程測試
- [ ] 跨平台同步測試

#### 6.3 效能優化（1 天）
- [ ] Next Engine 推送 < 1 秒
- [ ] API 回應時間優化
- [ ] 資料庫查詢優化

**驗證**: 測試覆蓋率 > 80%

---

## 📊 資料庫設計（V2）

### oauth_tokens (更新)

```sql
CREATE TABLE oauth_tokens (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL,         -- 'shopline', 'next-engine'
  shop_handle VARCHAR(255) NOT NULL,     -- shop identifier
  
  -- Tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  
  -- OAuth 2.0
  expire_time BIGINT,
  scope TEXT,
  
  -- Next Engine 特有
  uid VARCHAR(255),                      -- Next Engine uid
  state VARCHAR(255),                    -- Next Engine state
  
  -- Token 策略
  token_strategy VARCHAR(50) DEFAULT 'manual-refresh',  -- 'manual-refresh' or 'auto-refresh'
  last_auto_refresh TIMESTAMP,           -- Next Engine 用
  
  -- Platform metadata
  platform_metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(platform, shop_handle)
);

CREATE INDEX idx_oauth_tokens_platform ON oauth_tokens(platform);
CREATE INDEX idx_oauth_tokens_shop_handle ON oauth_tokens(shop_handle);
```

### inventory_sync_log (新增 - Next Engine 推送用)

```sql
CREATE TABLE inventory_sync_log (
  id SERIAL PRIMARY KEY,
  
  -- Source
  source_platform VARCHAR(50) NOT NULL,  -- 'next-engine'
  store_account VARCHAR(255),
  
  -- Product
  product_code VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  
  -- Sync status
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  synced_to_shopline BOOLEAN DEFAULT FALSE,
  sync_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'success', 'failed'
  
  -- Request data
  request_timestamp VARCHAR(50),         -- Next Engine ts
  request_signature VARCHAR(255),        -- Next Engine .sig
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_sync_log_product_code ON inventory_sync_log(product_code);
CREATE INDEX idx_inventory_sync_log_sync_status ON inventory_sync_log(sync_status);
CREATE INDEX idx_inventory_sync_log_received_at ON inventory_sync_log(received_at);
```

---

## 🎯 成功標準（V2）

### 技術標準
- ✅ 支援 Shopline REST + GraphQL + Next Engine REST
- ✅ 支援兩種 OAuth 策略（manual + auto refresh）
- ✅ 支援兩種 Webhook 模式（traditional + push）
- ✅ ID / Filter / Pagination 轉換正確無誤
- ✅ Next Engine 推送回應 < 1 秒
- ✅ 測試覆蓋率 > 80%
- ✅ 零停機遷移

### 業務標準
- ✅ Shopline Orders **必須**用 REST (GraphQL 不支援)
- ✅ Shopline Products **優先**用 GraphQL (更靈活)
- ✅ Next Engine 客戶資料能從訂單中正確提取
- ✅ Next Engine 庫存推送能及時同步到 Shopline
- ✅ 跨平台庫存同步正常運作
- ✅ 所有現有功能零影響

---

## 🔍 風險評估（V2）

| 風險 | 影響 | 機率 | 緩解策略 |
|------|------|------|---------|
| 3 種 API 風格抽象不足 | 高 | 中 | 已有完整對比表，Phase 3 驗證 |
| Next Engine token 自動更新遺漏 | 高 | 中 | 每次 API 呼叫後強制檢查 |
| Next Engine 推送 < 1s 失敗 | 高 | 低 | 異步處理 + 效能測試 |
| GID 轉換錯誤 | 中 | 低 | 完整單元測試 |
| 客戶資料提取不完整 | 中 | 中 | 多次測試驗證 |
| 遷移過程中斷服務 | 高 | 低 | 雙模式運行 |

---

## 📚 相關文件

- [三平台 API 對比表](./THREE_PLATFORM_API_COMPARISON.md)
- [Shopline GraphQL 研究](../research/SHOPLINE_GRAPHQL_RESEARCH.md)
- [Next Engine API 研究](../research/NEXT_ENGINE_API_RESEARCH.md)
- [Phase 1 實施計劃 V2](./PHASE1_IMPLEMENTATION_PLAN_V2.md)

---

**建立日期**: 2025-10-22  
**作者**: AI Assistant (Architecture Role)  
**版本**: 2.0.0 - **基於 Phase 0 研究完成**  
**狀態**: ✅ **Ready for Phase 1 Implementation**

---

## 🎊 總結

這個 V2 架構設計是基於**深入的三方 API 研究**完成的，不是紙上談兵。

**關鍵差異 (V1 → V2)**:
1. ❌ V1 假設所有平台都是標準 OAuth 2.0 和 REST
   ✅ V2 支援 OAuth-like (Next Engine) 和自動 token 更新

2. ❌ V1 假設只需要支援 REST API
   ✅ V2 同時支援 REST, GraphQL, 和推送式 API

3. ❌ V1 沒有考慮 ID / Filter / Pagination 轉換
   ✅ V2 有完整的 Converter 層

4. ❌ V1 假設所有平台都有 Customers API
   ✅ V2 支援從訂單中提取客戶（Next Engine）

5. ❌ V1 只考慮傳統 Webhook
   ✅ V2 支援兩種模式（POST/JSON vs GET/XML）

**這個架構已經可以開始實作了！** 🚀

