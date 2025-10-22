# API 風格對比研究

## 📋 文件資訊

- **目的**: 對比 REST API、GraphQL、Next Engine API，設計通用抽象層
- **版本**: 1.0.0
- **日期**: 2025-10-22
- **狀態**: 🔄 研究中

---

## 🎯 為什麼需要這份研究

### 問題
我們需要設計一個抽象層支援：
1. **Shopline REST API** (現有)
2. **Shopline GraphQL API** (未來)
3. **Next Engine API** (計劃整合)

如果只基於一種 API 風格設計，未來會需要大幅重構。

### 目標
設計一個**真正通用**的抽象層，能夠適應：
- ✅ REST API
- ✅ GraphQL API
- ✅ 其他可能的 API 風格（SOAP、gRPC 等）

---

## 📊 三種 API 風格對比

### 1. REST API (Shopline 現有)

#### 特性
```
請求方式：多端點、多 HTTP 方法
端點格式：/api/v1/products, /api/v1/orders/123
HTTP 方法：GET, POST, PUT, DELETE, PATCH
認證：Bearer Token in Header
回應：固定結構 JSON
```

#### 範例：取得商品
```http
GET /admin/openapi/v20260301/products/products.json?page=1&limit=10
Authorization: Bearer {token}
```

**回應**：
```json
{
  "products": [
    {
      "id": "123",
      "title": "商品A",
      "variants": [...]
    }
  ]
}
```

#### 優點
- ✅ 簡單易懂
- ✅ 標準化（HTTP 語義）
- ✅ 快取友善
- ✅ 工具支援好

#### 缺點
- ❌ Over-fetching（取得不需要的資料）
- ❌ Under-fetching（需要多次請求）
- ❌ 端點膨脹（資源多時端點爆炸）

---

### 2. GraphQL API (Shopline 未來)

#### 特性
```
請求方式：單一端點、統一 POST
端點格式：/graphql
HTTP 方法：POST
認證：Bearer Token in Header
回應：彈性結構，依 Query 決定
```

#### 範例：取得商品
```http
POST /graphql
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "query GetProducts($limit: Int) {
    products(first: $limit) {
      edges {
        node {
          id
          title
          variants {
            id
            price
          }
        }
      }
    }
  }",
  "variables": {
    "limit": 10
  }
}
```

**回應**：
```json
{
  "data": {
    "products": {
      "edges": [
        {
          "node": {
            "id": "gid://shopline/Product/123",
            "title": "商品A",
            "variants": [...]
          }
        }
      ]
    }
  }
}
```

#### 優點
- ✅ 精確取得需要的資料
- ✅ 單次請求可取得關聯資料
- ✅ 強型別 Schema
- ✅ 自動文件（Introspection）
- ✅ 訂閱支援（Subscriptions）

#### 缺點
- ❌ 學習曲線較陡
- ❌ 快取較複雜
- ❌ 檔案上傳需要特殊處理
- ❌ Rate Limiting 較複雜

---

### 3. Next Engine API (待研究)

#### 特性（假設，待確認）
```
請求方式：？（可能是 REST 或自定義）
端點格式：？
HTTP 方法：？
認證：？（可能是 API Key 或 OAuth）
回應：？
```

#### 需要研究的問題
1. **認證機制**
   - OAuth 2.0?
   - API Key?
   - Session-based?

2. **請求格式**
   - RESTful?
   - SOAP?
   - 自定義格式?

3. **回應結構**
   - JSON?
   - XML?
   - 其他格式?

4. **錯誤處理**
   - HTTP 狀態碼?
   - 錯誤碼系統?

5. **Rate Limiting**
   - 如何計算?
   - 如何回應?

---

## 🏗️ 通用抽象層設計

### 核心概念：請求規範 (Request Specification)

不要假設特定的 API 風格，而是定義**通用的請求概念**：

```typescript
// 通用請求規範
interface APIRequestSpec {
  type: 'rest' | 'graphql' | 'custom'
  authentication: AuthSpec
  // 其他欄位根據 type 不同
}

// REST 請求規範
interface RESTRequestSpec extends APIRequestSpec {
  type: 'rest'
  endpoint: string
  method: HTTPMethod
  params?: Record<string, any>
  body?: any
  headers?: Record<string, string>
}

// GraphQL 請求規範
interface GraphQLRequestSpec extends APIRequestSpec {
  type: 'graphql'
  query: string
  variables?: Record<string, any>
  operationName?: string
}

// 自定義請求規範（為未知的 API 風格保留彈性）
interface CustomRequestSpec extends APIRequestSpec {
  type: 'custom'
  payload: any
  transformer?: (payload: any) => any
}
```

---

## 💻 抽象層介面設計 (更新版)

### IAPIClient 介面

```javascript
/**
 * API Client Interface (支援多種 API 風格)
 */
class IAPIClient {
  /**
   * 通用請求方法
   * @param {APIRequestSpec} requestSpec - 請求規範
   * @param {string} accessToken - Access Token
   * @returns {Promise<APIResponse>}
   */
  async request(requestSpec, accessToken) {
    throw new Error('Method request() must be implemented')
  }

  /**
   * 建立請求規範的輔助方法（由子類別實作）
   */
  createRequestSpec(operation, params) {
    throw new Error('Method createRequestSpec() must be implemented')
  }

  // 業務方法（使用 createRequestSpec 生成請求）
  async getProducts(accessToken, params) {
    const requestSpec = this.createRequestSpec('getProducts', params)
    return this.request(requestSpec, accessToken)
  }

  async createProduct(accessToken, productData) {
    const requestSpec = this.createRequestSpec('createProduct', productData)
    return this.request(requestSpec, accessToken)
  }

  // ... 其他業務方法
}
```

---

## 🎨 實作範例

### 1. Shopline REST API Client

```javascript
const BaseAPIClient = require('../../core/base/BaseAPIClient')

class ShoplineRESTClient extends BaseAPIClient {
  constructor(config) {
    super(config)
    this.apiType = 'rest'
    this.baseURL = config.baseURL
    this.version = config.version || 'v20260301'
  }

  /**
   * 建立 REST 請求規範
   */
  createRequestSpec(operation, params) {
    const specs = {
      getProducts: {
        type: 'rest',
        endpoint: `/admin/openapi/${this.version}/products/products.json`,
        method: 'GET',
        params: params
      },
      createProduct: {
        type: 'rest',
        endpoint: `/admin/openapi/${this.version}/products/products.json`,
        method: 'POST',
        body: params
      },
      getOrders: {
        type: 'rest',
        endpoint: `/admin/openapi/${this.version}/orders.json`,
        method: 'GET',
        params: params
      }
      // ... 其他操作
    }

    return specs[operation]
  }

  /**
   * 執行 REST 請求
   */
  async request(requestSpec, accessToken) {
    if (requestSpec.type !== 'rest') {
      throw new Error(`Invalid request type: ${requestSpec.type}`)
    }

    const axios = require('axios')
    
    try {
      const config = {
        url: `${this.baseURL}${requestSpec.endpoint}`,
        method: requestSpec.method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }

      if (requestSpec.params) {
        config.params = requestSpec.params
      }

      if (requestSpec.body) {
        config.data = requestSpec.body
      }

      const response = await axios(config)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }
}

module.exports = ShoplineRESTClient
```

---

### 2. Shopline GraphQL API Client

```javascript
const BaseAPIClient = require('../../core/base/BaseAPIClient')

class ShoplineGraphQLClient extends BaseAPIClient {
  constructor(config) {
    super(config)
    this.apiType = 'graphql'
    this.graphqlEndpoint = `${config.baseURL}/admin/api/graphql.json`
  }

  /**
   * 建立 GraphQL 請求規範
   */
  createRequestSpec(operation, params) {
    const specs = {
      getProducts: {
        type: 'graphql',
        query: `
          query GetProducts($first: Int, $query: String) {
            products(first: $first, query: $query) {
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
                        title
                        price
                        sku
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
        `,
        variables: {
          first: params.limit || 10,
          query: params.query || null
        }
      },
      createProduct: {
        type: 'graphql',
        query: `
          mutation CreateProduct($input: ProductInput!) {
            productCreate(input: $input) {
              product {
                id
                title
                handle
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          input: this.transformProductInput(params)
        }
      }
      // ... 其他操作
    }

    return specs[operation]
  }

  /**
   * 執行 GraphQL 請求
   */
  async request(requestSpec, accessToken) {
    if (requestSpec.type !== 'graphql') {
      throw new Error(`Invalid request type: ${requestSpec.type}`)
    }

    const axios = require('axios')

    try {
      const response = await axios.post(
        this.graphqlEndpoint,
        {
          query: requestSpec.query,
          variables: requestSpec.variables,
          operationName: requestSpec.operationName
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      // GraphQL 特殊處理：檢查 errors
      if (response.data.errors) {
        return {
          success: false,
          error: response.data.errors[0].message,
          data: null
        }
      }

      return {
        success: true,
        status: 200,
        data: response.data.data
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 轉換商品輸入格式（REST → GraphQL）
   */
  transformProductInput(restProduct) {
    // 將 REST API 的商品格式轉換為 GraphQL Input
    return {
      title: restProduct.title,
      handle: restProduct.handle,
      status: restProduct.status,
      // ... 其他欄位轉換
    }
  }
}

module.exports = ShoplineGraphQLClient
```

---

### 3. 統一的平台包裝

```javascript
class ShoplinePlatform extends BasePlatform {
  constructor() {
    super('shopline', 'SHOPLINE', config)
    
    // 支援兩種 API Client
    this._restClient = new ShoplineRESTClient(config)
    this._graphqlClient = new ShoplineGraphQLClient(config)
    
    // 預設使用 REST（可以動態切換）
    this._apiClient = this._restClient
    this.currentAPIType = 'rest'
  }

  /**
   * 切換 API 類型
   */
  switchAPIType(type) {
    if (type === 'rest') {
      this._apiClient = this._restClient
      this.currentAPIType = 'rest'
    } else if (type === 'graphql') {
      this._apiClient = this._graphqlClient
      this.currentAPIType = 'graphql'
    } else {
      throw new Error(`Unsupported API type: ${type}`)
    }
  }

  getAPIClient() {
    return this._apiClient
  }

  getCurrentAPIType() {
    return this.currentAPIType
  }
}
```

---

## 🔄 資料映射層的挑戰

### 問題：REST vs GraphQL 的回應結構不同

#### REST 回應
```json
{
  "products": [
    { "id": "123", "title": "商品A" }
  ]
}
```

#### GraphQL 回應
```json
{
  "products": {
    "edges": [
      {
        "node": {
          "id": "gid://shopline/Product/123",
          "title": "商品A"
        }
      }
    ]
  }
}
```

### 解決方案：DataMapper 負責統一

```javascript
class ShoplineDataMapper extends BaseDataMapper {
  productToUnified(platformProduct, apiType = 'rest') {
    let normalizedProduct

    if (apiType === 'rest') {
      normalizedProduct = platformProduct
    } else if (apiType === 'graphql') {
      // GraphQL 需要從 edge.node 提取
      normalizedProduct = platformProduct.node || platformProduct
      // 處理 GID
      normalizedProduct.id = this.extractIdFromGID(normalizedProduct.id)
    }

    // 轉換為統一格式
    return {
      id: normalizedProduct.id,
      title: normalizedProduct.title,
      handle: normalizedProduct.handle,
      // ... 其他欄位
    }
  }

  extractIdFromGID(gid) {
    // gid://shopline/Product/123 → 123
    return gid.split('/').pop()
  }
}
```

---

## 📋 Phase 0 研究清單（更新）

### 1. Shopline GraphQL API 研究

#### 需要了解：
- [ ] GraphQL 端點 URL
- [ ] 認證方式（與 REST 是否相同？）
- [ ] Schema 文件（Introspection）
- [ ] Query 範例
  - [ ] 商品查詢
  - [ ] 商品建立/更新
  - [ ] 訂單查詢
  - [ ] 訂單建立/更新
- [ ] Mutation 範例
- [ ] 錯誤處理方式
- [ ] Rate Limiting 規則
- [ ] Pagination 方式（Cursor-based?）

#### 文件來源：
- 官方 GraphQL 文件 URL: ?
- GraphQL Playground / Explorer: ?

---

### 2. Next Engine API 研究

#### 需要了解：
- [ ] API 類型（REST? SOAP? 自定義?）
- [ ] 認證機制
- [ ] Base URL 和端點結構
- [ ] 請求/回應格式
- [ ] 商品 API
  - [ ] 資料結構
  - [ ] CRUD 操作
- [ ] 訂單 API
  - [ ] 資料結構
  - [ ] CRUD 操作
- [ ] 錯誤處理
- [ ] Rate Limiting

#### 文件來源：
- 官方 API 文件 URL: ?
- 開發者文件: ?

---

### 3. 建立完整對比表

```markdown
| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|---------------|------------------|-------------|
| API 類型 | REST | GraphQL | ? |
| 端點結構 | 多端點 | 單一端點 /graphql | ? |
| 認證 | Bearer Token | Bearer Token? | ? |
| 商品 ID 格式 | "123" | "gid://..." | ? |
| 分頁方式 | page/limit | Cursor-based | ? |
| 錯誤格式 | HTTP Status | errors array | ? |
```

---

## 🎯 更新後的抽象層設計原則

### 1. API 類型無關性
```
抽象層不應假設：
❌ 一定是 REST
❌ 一定用 HTTP 方法區分操作
❌ 一定有多個端點
❌ 回應一定是特定結構

抽象層應該：
✅ 支援多種 API 類型
✅ 用操作名稱（getProducts）而非 HTTP 方法
✅ 將請求細節封裝在 RequestSpec
✅ 統一回應格式
```

### 2. 彈性的請求規範
```javascript
// ✅ 好的設計：支援任何 API 風格
interface APIRequestSpec {
  type: string  // 'rest' | 'graphql' | 'soap' | 'custom'
  // 其他欄位根據 type 動態決定
}

// ❌ 不好的設計：假設 REST
interface APIRequestSpec {
  endpoint: string
  method: string
  // 綁死在 REST 概念
}
```

### 3. 統一的業務介面
```javascript
// ✅ 業務方法不暴露 API 細節
async getProducts(accessToken, params)

// 內部可以是 REST:
// GET /products?limit=10

// 也可以是 GraphQL:
// query { products(first: 10) { ... } }

// 使用者不需要知道
```

---

## ⏱️ 更新後的時間規劃

### Phase 0: 三方 API 研究 (2-3 天)
```
Day 1: Shopline GraphQL API 研究
  - 閱讀文件
  - 測試 Query/Mutation
  - 記錄差異點

Day 2: Next Engine API 研究
  - 閱讀文件
  - 了解認證流程
  - 測試基本操作

Day 3: 建立完整對比和設計
  - 三方 API 對比表
  - 更新抽象層設計
  - 確認設計可行性
```

### Phase 1: 通用抽象層 (3-4 天)
```
基於三種 API 風格設計
確保未來擴展性
```

---

## 📝 立即行動項目

### 你需要提供：

1. **Shopline GraphQL API**
   - [ ] 官方文件連結
   - [ ] GraphQL Explorer 連結
   - [ ] 是否已經可以使用？

2. **Next Engine API**
   - [ ] 官方文件連結
   - [ ] API Key 或測試帳號
   - [ ] 是否有 SDK？

3. **優先級確認**
   - [ ] Shopline GraphQL 何時需要？
   - [ ] Next Engine 何時需要？
   - [ ] 是否還有其他平台計劃？

---

**建立日期**: 2025-10-22  
**作者**: AI Assistant (Architecture Role)  
**版本**: 1.0.0 - API 風格對比  
**狀態**: 🔄 待完成（需要 API 文件）

