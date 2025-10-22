# Shopline GraphQL API 研究

## 📋 基本資訊

- **文件入口**: https://developer.shopline.com/docs/admin-graph-ql-api/schema-documentation?version=v20260301
- **API 版本**: v20260301 (2026年3月1日版本)
- **API 類型**: GraphQL
- **研究日期**: 2025-10-22
- **狀態**: ✅ 初步研究完成

---

## 🎯 核心發現

### 1. API 架構

#### 1.1 GraphQL Schema 結構
- **Root Types**:
  - `Query`: 查詢操作
  - `Mutation`: 變更操作
  - **無 Subscription**: 不支援即時訂閱

#### 1.2 支援的模組
Shopline GraphQL API 支援以下業務模組：

| 模組 | 說明 | REST API 對比 |
|------|------|---------------|
| ✅ Apps | 應用管理 | - |
| ✅ B2B | B2B 客戶管理 | - |
| ✅ Customers | 客戶管理 | ✅ REST 也支援 |
| ✅ Discounts and marketing | 折扣與行銷 | ✅ REST 也支援 |
| ✅ Localizations | 多語言 | - |
| ✅ Online store | 線上商店 | - |
| ✅ **Products and collections** | **產品與集合** | ✅ REST 也支援 |
| ✅ Inventory | 庫存管理 | ✅ REST 也支援 |
| ✅ Store properties | 商店屬性 | ✅ REST 也支援 |
| ✅ Member system | 會員系統 | - |
| ✅ Common objects | 通用物件 | - |
| ✅ Common | 通用類型 | - |

#### 1.3 **❌ 不支援的模組**
- **❌ Orders (訂單管理)** - 只有 REST API 支援
- ❌ Webhooks - 需使用 REST API
- ❌ OAuth - 需使用 REST API

---

### 2. Products API (GraphQL)

#### 2.1 Query: `products`
```graphql
products(
  query: String
  after: String
  before: String
  first: Int
  last: Int
  reverse: Boolean
): ProductConnection
```

**說明**: 查詢產品列表

**分頁機制**: Cursor-based pagination (GraphQL 標準)
- `first` + `after`: 向後分頁
- `last` + `before`: 向前分頁
- 返回 `ProductConnection` 類型，包含 `edges`, `pageInfo`

**查詢過濾 (query 參數)**:
支援最多 30 個參數，使用類似 Lucene 的語法：
```
title:'test' AND inventory_total:>=1000
```

支援的過濾欄位：
- `created_at`: 產品建立時間
- `updated_at`: 產品更新時間
- `title`: 產品標題
- `tag`: 產品標籤
- `id`: 產品 ID
- `barcode`: 條碼
- `gift_card`: 是否為禮品卡 (boolean)
- `inventory_total`: 庫存總量
- `out_of_stock_somewhere`: 是否部分缺貨 (boolean)
- `price`: 價格
- `product_type`: 產品類型
- `published_status`: 發佈狀態
- `status`: 產品狀態
- `sku`: SKU
- `vendor`: 供應商
- `spu`: SPU 代碼

#### 2.2 Query: `product`
```graphql
product(id: ID!): Product
```

**說明**: 查詢單個產品

#### 2.3 Mutation: `productCreate`
```graphql
productCreate(input: ProductInput!): ProductCreatePayload
```

#### 2.4 Mutation: `productUpdate`
```graphql
productUpdate(id: ID!, input: ProductInput!): ProductUpdatePayload
```

#### 2.5 Mutation: `productDelete`
```graphql
productDelete(id: ID!): ProductDeletePayload
```

---

### 3. 與 REST API 對比

| 特性 | REST API | GraphQL API |
|------|----------|-------------|
| **Orders** | ✅ 支援 | ❌ **不支援** |
| **Products** | ✅ 支援 | ✅ 支援 |
| **Customers** | ✅ 支援 | ✅ 支援 |
| **認證方式** | OAuth 2.0 + Bearer Token | 同 REST (OAuth 2.0) |
| **分頁機制** | Offset-based (`page`, `limit`) | Cursor-based (`first`, `after`) |
| **查詢靈活度** | 固定欄位 | 可選擇欄位 |
| **過濾語法** | Query parameters | Lucene-like query string |
| **批次操作** | 需多次請求 | 支援 (e.g., `productVariantsBulkCreate`) |
| **ID 格式** | 數字 ID | **GID (Global ID)** `gid://shopline/Product/123` |

---

### 4. 認證機制

#### 4.1 OAuth 2.0 流程
GraphQL API 使用與 REST API 相同的 OAuth 2.0 流程：
1. 授權碼授權 (Authorization Code Grant)
2. 獲取 Access Token
3. 使用 Bearer Token 調用 API

#### 4.2 API Endpoint
```
POST https://{{shop_handle}}.myshopline.com/admin/oauth/graphql.json
```

或使用統一 Endpoint (推測):
```
POST https://openapi.shoplineapp.com/graphql/admin
```

#### 4.3 Headers
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

#### 4.4 Request Body
```json
{
  "query": "query { shop { id name } }",
  "variables": {}
}
```

---

### 5. GID (Global ID) 格式

GraphQL API 使用 GID 格式，不同於 REST API 的數字 ID：

**REST API ID**:
```json
{
  "id": 1234567890
}
```

**GraphQL API GID**:
```json
{
  "id": "gid://shopline/Product/1234567890"
}
```

**GID 格式**:
```
gid://shopline/{ResourceType}/{NumericID}
```

**轉換邏輯**:
- REST → GraphQL: `gid://shopline/Product/${restId}`
- GraphQL → REST: 從 GID 中提取數字部分

---

### 6. 資料結構差異

#### 6.1 Products List (REST)
```json
{
  "products": [
    {
      "id": 1234567890,
      "title": "產品標題",
      "handle": "product-handle",
      "status": "active",
      "variants": [...]
    }
  ]
}
```

#### 6.2 Products List (GraphQL)
```json
{
  "data": {
    "products": {
      "edges": [
        {
          "node": {
            "id": "gid://shopline/Product/1234567890",
            "title": "產品標題",
            "handle": "product-handle",
            "status": "ACTIVE",
            "variants": {
              "edges": [...]
            }
          },
          "cursor": "eyJsYXN0X2lkIjoxMjM0NTY3ODkwLCJsYXN0X3ZhbHVlIjoxMjM0NTY3ODkwfQ=="
        }
      ],
      "pageInfo": {
        "hasNextPage": true,
        "hasPreviousPage": false,
        "startCursor": "...",
        "endCursor": "..."
      }
    }
  }
}
```

**關鍵差異**:
1. **嵌套結構**: GraphQL 使用 `edges` → `node` 模式
2. **ID 格式**: GID vs 數字
3. **Enum 大小寫**: `ACTIVE` vs `active`
4. **分頁資訊**: `pageInfo` 包含 cursor 和 hasNextPage 資訊

---

### 7. 查詢範例

#### 7.1 查詢產品列表 (前 10 個)
```graphql
query GetProducts {
  products(first: 10) {
    edges {
      node {
        id
        title
        handle
        status
        createdAt
        updatedAt
        variants(first: 5) {
          edges {
            node {
              id
              title
              sku
              price
              inventoryQuantity
            }
          }
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```

#### 7.2 查詢單個產品
```graphql
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    title
    handle
    description
    status
    variants(first: 20) {
      edges {
        node {
          id
          title
          sku
          price
          compareAtPrice
          inventoryQuantity
        }
      }
    }
  }
}
```

變數：
```json
{
  "id": "gid://shopline/Product/1234567890"
}
```

#### 7.3 建立產品
```graphql
mutation CreateProduct($input: ProductInput!) {
  productCreate(input: $input) {
    product {
      id
      title
      handle
      status
    }
    userErrors {
      field
      message
    }
  }
}
```

變數：
```json
{
  "input": {
    "title": "新產品",
    "productType": "測試類型",
    "status": "ACTIVE",
    "variants": [
      {
        "title": "預設款式",
        "price": "100.00",
        "sku": "TEST-SKU-001"
      }
    ]
  }
}
```

---

### 8. 錯誤處理

#### 8.1 GraphQL 錯誤格式
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
  },
  "errors": [
    {
      "message": "Validation failed",
      "locations": [{"line": 2, "column": 3}],
      "path": ["productCreate"],
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ]
}
```

#### 8.2 錯誤類型
1. **userErrors**: 業務邏輯錯誤（欄位驗證、權限等）
2. **errors**: GraphQL 系統錯誤（語法錯誤、類型錯誤等）

---

### 9. Rate Limiting

與 REST API 類似，但計算方式可能不同：
- REST: 每秒請求數 (RPS)
- GraphQL: **複雜度計分** (Query Complexity)
  - 簡單欄位: 1 分
  - 嵌套欄位: 累加
  - 列表欄位: 數量 × 複雜度

**Headers**:
```
X-Shopline-Shop-Api-Call-Limit: 120/200
X-Shopline-Api-Request-Cost: 12
```

---

### 10. 與 REST API 整合考量

#### 10.1 何時使用 GraphQL
✅ **適合**:
- 產品管理（複雜的關聯查詢）
- 客戶管理（靈活的欄位選擇）
- 需要精確控制返回欄位（減少流量）
- 批次操作（Bulk Mutations）

#### 10.2 何時使用 REST
✅ **必須**:
- **訂單管理** (Orders) - GraphQL 不支援
- OAuth 認證流程
- Webhook 設定
- 簡單的 CRUD（開發快速）

#### 10.3 混合使用策略
```
┌─────────────────────────────────────┐
│      Unified Platform Layer         │
│  (ShoplinePlatform)                 │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼───────┐ ┌─────▼──────────┐
│ REST Client  │ │ GraphQL Client │
│              │ │                │
│ - Orders ✅  │ │ - Products ✅  │
│ - OAuth ✅   │ │ - Customers ✅ │
│ - Webhooks ✅│ │ - Inventory ✅ │
└──────────────┘ └────────────────┘
```

---

### 11. 資料映射挑戰

#### 11.1 ID 轉換
```typescript
// Helper functions
function toGID(resourceType: string, numericId: number | string): string {
  return `gid://shopline/${resourceType}/${numericId}`;
}

function fromGID(gid: string): { type: string; id: string } {
  const match = gid.match(/gid:\/\/shopline\/(.+?)\/(.+)/);
  if (!match) throw new Error('Invalid GID');
  return { type: match[1], id: match[2] };
}
```

#### 11.2 分頁轉換
```typescript
// REST offset → GraphQL cursor
function offsetToCursor(offset: number, limit: number): { first: number; after?: string } {
  // 需要實作 cursor 編碼邏輯
  return {
    first: limit,
    after: offset > 0 ? encodeCursor(offset) : undefined
  };
}

// GraphQL cursor → REST offset
function cursorToOffset(cursor: string): number {
  return decodeCursor(cursor);
}
```

#### 11.3 狀態值轉換
```typescript
// REST: lowercase, GraphQL: UPPERCASE
const statusMap = {
  'active': 'ACTIVE',
  'draft': 'DRAFT',
  'archived': 'ARCHIVED'
};
```

---

### 12. 開發工具

#### 12.1 GraphiQL Explorer
- **URL**: https://developer.shopline.com/graphql/admin?lang=en
- **功能**: 
  - 互動式查詢編輯器
  - Schema 文件瀏覽
  - 自動補全
  - 查詢歷史

#### 12.2 推薦的 GraphQL Client
- **Node.js**: `graphql-request`, `apollo-client`
- **瀏覽器**: `apollo-client`, `urql`
- **通用**: `axios` (手動 POST)

---

### 13. 限制與注意事項

#### 13.1 API 限制
- ⚠️ **不支援 Orders** - 必須使用 REST API
- ⚠️ 查詢過濾最多 30 個參數
- ⚠️ 嵌套深度限制（推測 5-10 層）
- ⚠️ 單次查詢複雜度限制

#### 13.2 版本管理
- 版本號格式: `vYYYYMMDD` (e.g., `v20260301`)
- 版本更新頻率: 未知
- 向後相容性: 未知

#### 13.3 已知問題
- 文件有些過時（部分 API 可能不可用）
- 錯誤訊息不夠詳細
- Rate limiting 規則不透明

---

### 14. 後續研究需求

#### 14.1 待確認
- [ ] GraphQL API 的實際 Endpoint URL
- [ ] 認證 Token 是否與 REST 共用
- [ ] Rate Limiting 的具體規則
- [ ] 批次操作的限制（一次最多多少筆）
- [ ] Webhook 是否支援 GraphQL（推測不支援）

#### 14.2 待測試
- [ ] 實際調用 GraphQL API（需要測試商店）
- [ ] ID 轉換是否如預期
- [ ] 分頁機制的實際行為
- [ ] 錯誤處理的完整情境

#### 14.3 待比較
- [ ] GraphQL vs REST 效能對比
- [ ] 網路流量對比（欄位過濾效果）
- [ ] 開發效率對比

---

## 🔑 關鍵結論

### 1. **Orders 必須使用 REST API**
這是最重要的發現。我們無法只使用 GraphQL API 完成所有功能。

### 2. **需要混合架構**
抽象層必須同時支援 REST 和 GraphQL：
- **REST Client**: Orders, OAuth, Webhooks
- **GraphQL Client**: Products, Customers, Inventory

### 3. **資料映射複雜度**
- ID 格式不同 (數字 vs GID)
- 分頁機制不同 (offset vs cursor)
- 資料結構不同 (flat vs nested edges)

### 4. **建議的架構**
```
APIRequestSpec (抽象)
    ├── RESTRequestSpec
    │   └── endpoint, method, params, body
    └── GraphQLRequestSpec
        └── query, variables

UnifiedAPIClient
    ├── executeREST()
    └── executeGraphQL()
```

### 5. **下一步**
1. 研究 Next Engine API
2. 基於三方 API 設計通用抽象層
3. 確保抽象層支援：
   - REST API
   - GraphQL API
   - 可能的其他 API 風格

---

## 📚 參考資源

- [Shopline GraphQL API 文件](https://developer.shopline.com/docs/admin-graph-ql-api/schema-documentation?version=v20260301)
- [Shopline REST API 文件](https://developer.shopline.com/docs/api/reference/v20230615/)
- [GraphiQL Explorer](https://developer.shopline.com/graphql/admin?lang=en)

---

**研究完成時間**: 2025-10-22  
**研究人員**: AI Assistant  
**狀態**: ✅ Phase 0 - Part 1 完成，待進行 Next Engine 研究

