# 三平台 API 完整對比表

## 📋 文件資訊

- **對比平台**: Shopline REST, Shopline GraphQL, Next Engine
- **建立日期**: 2025-10-22
- **目的**: 為通用抽象層設計提供依據
- **狀態**: ✅ 完成

---

## 🎯 核心對比總表

### 1. API 基本特性

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **API 風格** | REST | GraphQL | REST |
| **主機** | `openapi.shoplineapp.com` | `openapi.shoplineapp.com/graphql/admin` | `api.next-engine.org` |
| **請求方法** | GET, POST, PUT, DELETE | **POST only** | **POST only** |
| **Content-Type** | `application/json` | `application/json` | **`application/x-www-form-urlencoded`** |
| **回應格式** | JSON | JSON | JSON |
| **API 版本** | `/v1/` | `?version=v20260301` | `/api_v1_` |
| **文件完整度** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

### 2. 認證機制

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **認證協議** | OAuth 2.0 | OAuth 2.0 (same as REST) | OAuth-like (獨特實作) |
| **授權流程** | Authorization Code | Authorization Code | uid/state → access_token |
| **Token 位置** | `Authorization: Bearer {token}` | `Authorization: Bearer {token}` | **Body: `access_token=...`** |
| **Token 類型** | access_token, refresh_token | access_token, refresh_token | access_token, refresh_token |
| **Token 更新** | 手動呼叫 `/oauth/token` | 手動呼叫 `/oauth/token` | **自動返回新 token** ⭐ |
| **access_token 有效期** | 不明 (推測 1 小時-1 天) | 同 REST | **1 天** |
| **refresh_token 有效期** | 不明 (推測 30-90 天) | 同 REST | **3 天** |
| **State 有效期** | - | - | **5 分鐘** ⭐ |

**關鍵差異**:
- Shopline: 傳統 OAuth 2.0，token 過期需**手動 refresh**
- Next Engine: **每次 API 呼叫都可能返回新 token**，必須每次檢查並保存

---

### 3. 分頁機制

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **分頁類型** | **Offset-based** | **Cursor-based** | **Offset-based** |
| **參數** | `page`, `limit` | `first`, `after`, `before`, `last` | `offset`, `limit` |
| **預設筆數** | 20 | - | 20 |
| **最大筆數** | 250 | - | **10000** ⭐ |
| **總筆數取得** | Response header | `pageInfo.total` (部分支援) | 需先呼叫 `/count` endpoint |
| **下一頁判斷** | `page * limit < total` | `pageInfo.hasNextPage` | `offset + limit < total` |

**範例對比**:

**Shopline REST**:
```
GET /v1/products?page=1&limit=50
Response: { products: [...], total: 1234 }
```

**Shopline GraphQL**:
```graphql
query {
  products(first: 50, after: "cursor123") {
    edges { node { id } }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

**Next Engine**:
```
POST /api_v1_master_goods/count
→ { count: 1234 }

POST /api_v1_master_goods/search
Body: offset=0&limit=50
```

---

### 4. 過濾/查詢機制

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **語法** | Query parameters | GraphQL query string | **運算子後綴** |
| **範例** | `?status=active&created_at_min=2025-01-01` | `query: "title:'test' AND status:ACTIVE"` | `status-eq=active&created_date-gte=2025-01-01` |
| **支援運算子** | `_min`, `_max`, 直接等於 | Lucene-like | `-eq`, `-neq`, `-gt`, `-gte`, `-lt`, `-lte`, `-like`, `-in` |
| **最大過濾參數** | 無明確限制 | 最多 30 個 | 無明確限制 |

**運算子對比表**:

| 運算 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| 等於 | `field=value` | `field:'value'` | `field-eq=value` |
| 不等於 | - | - | `field-neq=value` |
| 大於 | `field_min=value` | `field:>value` | `field-gt=value` |
| 大於等於 | `field_min=value` | `field:>=value` | `field-gte=value` |
| 小於 | `field_max=value` | `field:<value` | `field-lt=value` |
| 小於等於 | `field_max=value` | `field:<=value` | `field-lte=value` |
| 模糊匹配 | - | `field:'%value%'` | `field-like=%value%` |
| 在列表中 | - | - | `field-in=val1,val2` |

---

### 5. ID 格式

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **格式** | **數字** | **GID 字串** | **數字字串** |
| **範例** | `1234567890` | `"gid://shopline/Product/1234567890"` | `"1234567890"` |
| **轉換需求** | - | **需要** GID ↔ 數字轉換 | 數字 ↔ 字串轉換 |

**GID 格式**:
```
gid://shopline/{ResourceType}/{NumericID}
```

**轉換邏輯**:
```typescript
// REST/NE → GraphQL
function toGID(resourceType: string, id: number | string): string {
  return `gid://shopline/${resourceType}/${id}`;
}

// GraphQL → REST/NE
function fromGID(gid: string): { type: string; id: string } {
  const match = gid.match(/gid:\/\/shopline\/(.+?)\/(.+)/);
  return { type: match[1], id: match[2] };
}

// NE ↔ REST
function toNextEngineId(id: number): string {
  return String(id);
}
```

---

### 6. 錯誤處理

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **HTTP 狀態碼** | ✅ 使用 (200, 400, 401, 404, 500) | ⚠️ 總是 200 | ⚠️ 總是 200 (推測) |
| **錯誤格式** | `{ error: {...} }` | `{ errors: [...], data: null }` | `{ result: "error", code: "...", message: "..." }` |
| **業務錯誤** | HTTP 4xx | `userErrors` in data | `result: "error"` |
| **系統錯誤** | HTTP 5xx | `errors` array | `result: "error"` with code |

**錯誤範例對比**:

**Shopline REST**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title cannot be blank"
  }
}
```

**Shopline GraphQL**:
```json
{
  "data": {
    "productCreate": {
      "product": null,
      "userErrors": [
        {
          "field": ["title"],
          "message": "Title can't be blank"
        }
      ]
    }
  }
}
```

**Next Engine**:
```json
{
  "result": "error",
  "code": "003001",
  "message": "Missing required parameter"
}
```

---

### 7. Rate Limiting

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **機制** | RPS (每秒請求數) | **Query Complexity** | 未明確說明 (推測 RPS) |
| **限制值** | 未明確說明 | 未明確說明 | 未明確說明 |
| **Headers** | `X-Shopline-Shop-Api-Call-Limit` | `X-Shopline-Api-Request-Cost` | 未知 |
| **超限行為** | HTTP 429 | HTTP 429 | 未知 |

---

## 📦 業務功能對比

### 8. Products (商品)

| 功能 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **List** | ✅ `GET /products` | ✅ `query { products }` | ✅ `POST /api_v1_master_goods/search` |
| **Get** | ✅ `GET /products/{id}` | ✅ `query { product(id) }` | ✅ `POST /api_v1_master_goods/search` (by id) |
| **Create** | ✅ `POST /products` | ✅ `mutation { productCreate }` | ✅ `POST /api_v1_master_goods/upload` |
| **Update** | ✅ `PUT /products/{id}` | ✅ `mutation { productUpdate }` | ✅ `POST /api_v1_master_goods/upload` |
| **Delete** | ✅ `DELETE /products/{id}` | ✅ `mutation { productDelete }` | ❌ 無刪除 (更新狀態) |
| **Count** | ⚠️ Header | ⚠️ 需自行計算 | ✅ `POST /api_v1_master_goods/count` |
| **Bulk** | ❌ | ✅ `productVariantsBulkCreate` | ✅ Bulk upload |

**資料結構差異**:

```typescript
// Shopline REST/GraphQL (概念相似)
interface ShoplineProduct {
  id: number | string;  // REST: number, GraphQL: GID
  title: string;
  handle: string;
  status: 'active' | 'draft' | 'archived';  // GraphQL 大寫
  variants: Variant[];
  images: Image[];
}

// Next Engine
interface NextEngineProduct {
  goods_id: string;  // 字串格式數字
  goods_code: string;  // SKU
  goods_name: string;
  stock_quantity: string;  // 字串格式數字
  selling_price: string;
  cost_price: string;
  goods_status_id: string;  // 狀態碼
}
```

---

### 9. Orders (訂單)

| 功能 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **List** | ✅ `GET /orders` | ❌ **不支援** | ✅ `POST /api_v1_receiveorder_base/search` |
| **Get** | ✅ `GET /orders/{id}` | ❌ **不支援** | ✅ `POST /api_v1_receiveorder_base/search` (by id) |
| **Create** | ✅ `POST /orders` | ❌ **不支援** | ✅ `POST /api_v1_receiveorder_base/upload` |
| **Update** | ✅ `PUT /orders/{id}` | ❌ **不支援** | ✅ `POST /api_v1_receiveorder_base/update` |
| **Delete/Cancel** | ✅ `DELETE /orders/{id}` | ❌ **不支援** | ✅ Update cancel_type |
| **Count** | ⚠️ Header | ❌ **不支援** | ✅ `POST /api_v1_receiveorder_base/count` |
| **Bulk Update** | ❌ | ❌ **不支援** | ✅ `POST /api_v1_receiveorder_base/bulkupdate` |
| **特殊操作** | - | ❌ **不支援** | ✅ 出荷確定、納品書印刷、分割 |

**⚠️ 關鍵限制**: Shopline GraphQL **完全不支援 Orders API**

---

### 10. Customers (客戶)

| 功能 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **List** | ✅ `GET /customers` | ✅ `query { customers }` | ❌ **無獨立 API** |
| **Get** | ✅ `GET /customers/{id}` | ✅ `query { customer(id) }` | ❌ **無獨立 API** |
| **Create** | ✅ `POST /customers` | ✅ `mutation { customerCreate }` | ❌ **無獨立 API** |
| **Update** | ✅ `PUT /customers/{id}` | ✅ `mutation { customerUpdate }` | ❌ **無獨立 API** |
| **資料來源** | 獨立 Customers 表 | 獨立 Customers 表 | **訂單中內嵌** |

**Next Engine 客戶資訊**:
```typescript
// 客戶資訊內嵌在訂單中
interface NextEngineOrder {
  receiveorder_customer_name: string;
  receiveorder_customer_mail_address: string;
  receiveorder_customer_tel: string;
  receiveorder_customer_address1: string;
  // ...
}

// 需要自行提取並建立本地 Customer 模型
```

---

### 11. Inventory (庫存)

| 功能 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **Get** | ✅ `GET /inventory_items` | ✅ `query { inventoryItem }` | ✅ `POST /api_v1_master_stock/search` |
| **Update** | ✅ `PUT /inventory_items/{id}` | ✅ `mutation { inventoryAdjustQuantity }` | ✅ `POST /api_v1_warehouse_stock/upload` |
| **Multi-location** | ✅ 支援 | ✅ 支援 | ✅ **完整支援多倉庫** |
| **History** | ❌ | ❌ | ✅ 出入庫紀錄 API |

---

### 12. Webhooks

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **傳統 Webhook** | ✅ 支援 | ⚠️ 設定同 REST | ❌ **不支援** |
| **事件類型** | order.created, product.updated, ... | 同 REST | - |
| **推送方向** | Shopline → Your Server | Shopline → Your Server | - |
| **HTTP Method** | POST | POST | - |
| **格式** | JSON | JSON | - |
| **驗證** | HMAC-SHA256 | HMAC-SHA256 | - |
| **替代方案** | - | - | ✅ **主動推送式庫存更新** ⭐ |

---

## 🔄 Next Engine 獨特機制

### 13. 主動推送式庫存更新

**這是 Next Engine 最獨特的設計**，取代了傳統 Webhook：

| 特性 | 說明 |
|------|------|
| **方向** | **Next Engine → Your Server** (反向) |
| **觸發** | 定時同步 (由 NE 控制) |
| **HTTP Method** | **GET** (不是 POST) |
| **參數格式** | URL Query Parameters |
| **回應格式** | **EUC-JP 編碼的 XML** (不是 JSON) |
| **驗證** | HMAC-MD5 (不是 SHA256) |
| **效能要求** | **< 1 秒** (非常嚴格) |
| **重試邏輯** | 只重試**超時**，有回應則不重試 |

**請求範例**:
```
GET /api/nextengine/stock-update?
  StoreAccount=mystore&
  Code=ITEM-001&
  Stock=50&
  ts=20251022120000&
  .sig=abc123...
```

**回應範例**:
```xml
<?xml version="1.0" encoding="EUC-JP"?>
<ShoppingUpdateStock version="1.0">
  <ResultSet TotalResult="1">
    <Request>...</Request>
    <Result No="1">
      <Processed>0</Processed>
    </Result>
  </ResultSet>
</ShoppingUpdateStock>
```

**對比傳統 Webhook**:

| 特性 | Shopline Webhook | Next Engine 庫存推送 |
|------|------------------|---------------------|
| 方向 | Platform → You | Platform → You |
| 觸發 | 事件發生時 | 定時 |
| Method | POST | GET |
| 請求格式 | JSON Body | URL Params |
| 回應格式 | Status Code | XML |
| 編碼 | UTF-8 | EUC-JP |
| 驗證算法 | HMAC-SHA256 | HMAC-MD5 |
| 事件類型 | 多種 | **僅庫存** |
| 效能要求 | 一般 | **< 1 秒** |

---

## 🎨 通用抽象層設計考量

### 14. 必須支援的差異

基於以上對比，通用抽象層必須處理以下關鍵差異：

#### 14.1 請求格式

```typescript
interface APIRequestSpec {
  platform: 'shopline-rest' | 'shopline-graphql' | 'next-engine';
  resource: string;  // 'products', 'orders', 'customers'
  action: string;    // 'list', 'get', 'create', 'update', 'delete'
  
  // Shopline REST
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint?: string;
  headers?: Record<string, string>;
  body?: any;
  
  // Shopline GraphQL
  query?: string;
  variables?: Record<string, any>;
  
  // Next Engine
  neEndpoint?: string;  // e.g., '/api_v1_receiveorder_base/search'
  formData?: Record<string, string>;  // form-urlencoded
  
  // Common
  filters?: Record<string, any>;
  pagination?: PaginationSpec;
}
```

#### 14.2 Token 管理

```typescript
interface TokenManager {
  // Shopline (手動 refresh)
  refreshShoplineToken(): Promise<{ access_token, refresh_token }>;
  
  // Next Engine (自動 refresh)
  handleNextEngineResponse(response: any): void;  // 檢查並保存新 token
}
```

#### 14.3 ID 轉換

```typescript
interface IDConverter {
  // Shopline GraphQL GID
  toGID(resourceType: string, id: number | string): string;
  fromGID(gid: string): { type: string; id: string };
  
  // Next Engine 字串 ID
  toNEId(id: number): string;
  fromNEId(id: string): number;
}
```

#### 14.4 過濾語法轉換

```typescript
interface FilterConverter {
  // Shopline REST → Next Engine
  shoplineToNE(filters: Record<string, any>): Record<string, string>;
  
  // Shopline GraphQL → Next Engine  
  graphqlToNE(queryString: string): Record<string, string>;
}
```

#### 14.5 分頁轉換

```typescript
interface PaginationConverter {
  // Offset ↔ Cursor
  offsetToCursor(offset: number, limit: number): { first: number; after?: string };
  cursorToOffset(cursor: string, limit: number): { offset: number; limit: number };
  
  // Shopline page ↔ Next Engine offset
  pageToOffset(page: number, limit: number): number;
  offsetToPage(offset: number, limit: number): number;
}
```

#### 14.6 Webhook / 推送處理

```typescript
interface WebhookHandler {
  // Shopline Webhook (POST, JSON)
  handleShoplineWebhook(req: Request, res: Response): Promise<void>;
  
  // Next Engine 庫存推送 (GET, XML)
  handleNextEngineStockPush(req: Request, res: Response): Promise<void>;
}
```

---

## 📊 功能覆蓋矩陣

### 15. 三平台功能支援總表

| 業務功能 | Shopline REST | Shopline GraphQL | Next Engine | 整合策略 |
|---------|--------------|------------------|-------------|---------|
| **商品管理** | ✅ 完整 | ✅ 完整 | ✅ 完整 | 優先 GraphQL (靈活), fallback REST |
| **訂單管理** | ✅ 完整 | ❌ **不支援** | ✅ **更完整** | **必須用 REST** |
| **客戶管理** | ✅ 完整 | ✅ 完整 | ❌ 內嵌 | Shopline 用 API, NE 從訂單提取 |
| **庫存管理** | ✅ 基本 | ✅ 基本 | ✅ **完整** | NE 最強，雙向同步 |
| **庫存推送** | ✅ Webhook | ✅ Webhook | ✅ **反向推送** | 兩種模式並存 |
| **進銷存** | ❌ | ❌ | ✅ **獨有** | NE 獨有功能 |
| **批次操作** | ❌ 少 | ✅ 支援 | ✅ **完整** | GraphQL/NE 優先 |

---

## 🔑 關鍵結論

### 16. 設計原則

基於三平台對比，抽象層設計必須遵循以下原則：

#### 16.1 **混合使用是必須的**

```
不能只用一種 API：
- Shopline Orders → 必須用 REST
- Shopline Products → 可用 GraphQL (更靈活) 或 REST
- Next Engine → 只有 REST，但有獨特的 token 和推送機制
```

#### 16.2 **Token 管理策略不同**

```typescript
// Shopline: 檢查過期 → 手動 refresh
if (isTokenExpired(shoplineToken)) {
  await refreshShoplineToken();
}

// Next Engine: 每次呼叫後檢查回應
const response = await callNextEngineAPI();
if (response.access_token) {
  await saveNewTokens(response.access_token, response.refresh_token);
}
```

#### 16.3 **資料結構需要映射**

```typescript
// 統一的 Product 模型
interface UnifiedProduct {
  id: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
}

// 從各平台映射
function fromShopline(product: ShoplineProduct): UnifiedProduct { ... }
function fromNextEngine(goods: NextEngineGoods): UnifiedProduct { ... }
```

#### 16.4 **Webhook 需要兩種處理器**

```typescript
// Shopline: 傳統 Webhook (POST /webhook/shopline)
app.post('/webhook/shopline', verifyHMAC, handleJSON);

// Next Engine: 反向推送 (GET /webhook/nextengine)
app.get('/webhook/nextengine', verifyMD5, respondXML);
```

#### 16.5 **客戶資料需要整合**

```typescript
// Shopline: 直接從 Customers API
const customers = await shopline.getCustomers();

// Next Engine: 從訂單中提取
const orders = await nextEngine.getOrders();
const customers = extractCustomersFromOrders(orders);
```

---

## 📝 下一步

### 17. Phase 1 實作優先級

基於此對比，Phase 1 應實作以下核心功能：

**Priority 1** (核心抽象):
1. ✅ 統一的 Request Builder
2. ✅ 統一的 Response Parser
3. ✅ ID 轉換器 (GID, 數字, 字串)
4. ✅ Token Manager (兩種策略)

**Priority 2** (資料映射):
1. ✅ Product Mapper
2. ✅ Order Mapper
3. ✅ Customer Mapper (含 NE 提取邏輯)
4. ✅ Inventory Mapper

**Priority 3** (過濾與分頁):
1. ✅ Filter Converter (三種語法互轉)
2. ✅ Pagination Converter (offset ↔ cursor ↔ page)

**Priority 4** (Webhook/推送):
1. ✅ Shopline Webhook Handler
2. ✅ Next Engine Stock Push Handler

---

## 📚 參考文件

- [Shopline REST API 研究](../research/SHOPLINE_API_RESEARCH.md)
- [Shopline GraphQL API 研究](../research/SHOPLINE_GRAPHQL_RESEARCH.md)
- [Next Engine API 研究](../research/NEXT_ENGINE_API_RESEARCH.md)
- [多平台架構設計](./MULTI_PLATFORM_ARCHITECTURE.md)

---

**建立時間**: 2025-10-22  
**維護人員**: AI Assistant  
**狀態**: ✅ Phase 0 完成，為 Phase 1 實作提供依據

