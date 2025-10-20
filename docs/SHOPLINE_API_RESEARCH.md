# SHOPLINE API 研究文件

## 📚 官方文件來源

### 主要文件來源
- **開發者中心**: https://developer.shopline.com/
- **API 文件**: https://developer.shopline.com/docs/
- **REST API 文件**: https://developer.shopline.com/docs/admin-rest-api/
- **OAuth 文件**: https://developer.shopline.com/docs/oauth/

### 文件版本
- **API 版本**: v20260301 (最新)
- **文件更新**: 2025-10-20
- **研究狀態**: 進行中

## 🔍 API 端點研究

### 1. 商品 API (Products API)

#### 1.1 獲取商品列表
**端點**: `GET /admin/openapi/v20260301/products/products.json`
**所需權限 (Access Scope)**: `read_products`
**官方來源**: https://developer.shopline.com/docs/admin-rest-api/product/product/get-products/?version=v20260301

**官方文件來源**: https://developer.shopline.com/docs/admin-rest-api/product/product/get-products/?version=v20260301

**請求標頭**:
```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

#### 1.2 建立商品（最小可用 Sample）
**端點**: `POST /admin/openapi/{{version}}/products/products.json`
**所需權限 (Access Scope)**: `write_products`
**官方來源**: https://developer.shopline.com/docs/admin-rest-api/product/product/create-a-product/?version=v20260301

**官方文件來源**: https://developer.shopline.com/docs/admin-rest-api/product/product/create-a-product/?version=v20260301

**請求標頭**:
```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

**請求 Body（最小可用）**:
```json
{
  "product": {
    "handle": "shopline-251014-01",
    "title": "shopline-251014-01",
    "tags": [
      "tag1, tag2"
    ],
    "variants": [
      {
        "sku": "T0000000001",
        "price": "1000",
        "required_shipping": true,
        "taxable": true,
        "image": {
          "alt": "This is a image alt",
          "src": "https://img.myshopline.com/image/official/e46e6189dd5641a3b179444cacdcdd2a.png"
        },
        "inventory_tracker": true
      }
    ],
    "images": [
      {
        "src": "https://img.myshopline.com/image/official/e46e6189dd5641a3b179444cacdcdd2a.png",
        "alt": "This is a image alt"
      }
    ],
    "subtitle": "This is a subtitle",
    "body_html": "This is a description",
    "status": "active",
    "published_scope": "web"
  }
}
```

**Curl 範例**:
```bash
curl --request POST \
  --url "https://{handle}.myshopline.com/admin/openapi/{version}/products/products.json" \
  --header "Authorization: Bearer {ACCESS_TOKEN}" \
  --header "Content-Type: application/json" \
  --header "Accept: application/json" \
  --data @product.json
```


**請求參數**:
```json
{
  "page": 1,
  "limit": 20,
  "status": "active",
  "sort": "created_at",
  "order": "desc"
}
```

**回應格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "products": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "price": "number",
        "compare_at_price": "number",
        "sku": "string",
        "barcode": "string",
        "inventory_quantity": "number",
        "weight": "number",
        "status": "string",
        "created_at": "string",
        "updated_at": "string",
        "images": [
          {
            "id": "string",
            "url": "string",
            "alt": "string"
          }
        ],
        "variants": [
          {
            "id": "string",
            "title": "string",
            "price": "number",
            "sku": "string",
            "inventory_quantity": "number"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

#### 1.2 獲取單一商品
**端點**: `GET /admin/openapi/v20251201/products/{product_id}`

**官方文件來源**: https://developer.shopline.com/docs/admin-rest-api/product/product/get-product/

**回應格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "product": {
      "id": "string",
      "title": "string",
      "description": "string",
      "price": "number",
      "compare_at_price": "number",
      "sku": "string",
      "barcode": "string",
      "inventory_quantity": "number",
      "weight": "number",
      "status": "string",
      "created_at": "string",
      "updated_at": "string",
      "images": [],
      "variants": []
    }
  }
}
```

### 2. 訂單 API (Orders API)

#### 2.1 獲取訂單列表
**端點**: `GET /admin/openapi/v20260301/orders.json`

**官方文件來源**: https://developer.shopline.com/docs/admin-rest-api/order/order/get-orders/

**請求參數**:
```json
{
  "page": 1,
  "limit": 20,
  "status": "paid",
  "sort": "created_at",
  "order": "desc"
}
```

**回應格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orders": [
      {
        "id": "string",
        "order_number": "string",
        "status": "string",
        "total_price": "number",
        "currency": "string",
        "customer": {
          "id": "string",
          "email": "string",
          "first_name": "string",
          "last_name": "string",
          "phone": "string"
        },
        "line_items": [
          {
            "id": "string",
            "product_id": "string",
            "variant_id": "string",
            "title": "string",
            "quantity": "number",
            "price": "number"
          }
        ],
        "created_at": "string",
        "updated_at": "string"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

#### 2.2 獲取單一訂單
**端點**: `GET /admin/openapi/v20251201/orders/{order_id}`

**官方文件來源**: https://developer.shopline.com/docs/admin-rest-api/order/order/get-order/

### 3. 商店資訊 API (Shop API)

#### 3.1 獲取商店資訊
**端點**: `GET /admin/openapi/v20260301/merchants/shop.json`
**所需權限 (Access Scope)**: `read_store_information`
**官方來源**: https://developer.shopline.com/docs/admin-rest-api/store/query-store-information/?version=v20260301

**官方文件來源**: https://developer.shopline.com/docs/admin-rest-api/store/query-store-information/?version=v20260301

---

## 🔐 OAuth 授權範圍（Scopes）

為了使用上述 API，需在「開發者中心」為 App 勾選相對應的 Access Scope，且在授權 URL 的 `scope` 參數中同時帶上：

- `read_store_information`（查詢商店資訊）
- `read_products`（查詢商品）
- `write_products`（建立/更新商品）

授權 URL 範例（片段）：
```
...&scope=read_store_information,read_products,write_products&redirectUri={NGROK_URL}/oauth/callback
```

官方參考：
- Store info: https://developer.shopline.com/docs/admin-rest-api/store/query-store-information/?version=v20260301
- Get products: https://developer.shopline.com/docs/admin-rest-api/product/product/get-products/?version=v20260301
- Create product: https://developer.shopline.com/docs/admin-rest-api/product/product/create-a-product/?version=v20260301

**回應格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "shop": {
      "id": "string",
      "name": "string",
      "domain": "string",
      "email": "string",
      "phone": "string",
      "address": {
        "country": "string",
        "province": "string",
        "city": "string",
        "address1": "string",
        "address2": "string",
        "zip": "string"
      },
      "currency": "string",
      "timezone": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  }
}
```

## 🔐 認證機制

### OAuth 2.0 流程
1. **授權請求**: 重導向到 SHOPLINE 授權頁面
2. **授權回調**: 接收授權碼
3. **Token 交換**: 使用授權碼獲取 Access Token
4. **API 呼叫**: 使用 Access Token 進行 API 請求

### Access Token 使用
```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
```

## 📝 API 範例程式碼

### Node.js 範例
```javascript
const axios = require('axios');

class ShoplineAPIClient {
  constructor(accessToken, shopDomain) {
    this.accessToken = accessToken;
    this.baseURL = `https://${shopDomain}.myshopline.com`;
  }

  async getProducts(page = 1, limit = 20) {
    try {
      const response = await axios.get(
        `${this.baseURL}/admin/openapi/v20251201/products`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          params: {
            page,
            limit
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('API 請求失敗:', error.response?.data || error.message);
      throw error;
    }
  }

  async getOrders(page = 1, limit = 20) {
    try {
      const response = await axios.get(
        `${this.baseURL}/admin/openapi/v20251201/orders`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          params: {
            page,
            limit
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('API 請求失敗:', error.response?.data || error.message);
      throw error;
    }
  }

  async getShopInfo() {
    try {
      const response = await axios.get(
        `${this.baseURL}/admin/openapi/v20251201/shop`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('API 請求失敗:', error.response?.data || error.message);
      throw error;
    }
  }
}

// 使用範例
const client = new ShoplineAPIClient('your_access_token', 'your_shop_handle');

// 獲取商品
client.getProducts(1, 20).then(data => {
  console.log('商品列表:', data);
});

// 獲取訂單
client.getOrders(1, 20).then(data => {
  console.log('訂單列表:', data);
});

// 獲取商店資訊
client.getShopInfo().then(data => {
  console.log('商店資訊:', data);
});
```

## 🚨 錯誤處理

### 常見錯誤代碼
- **400**: 請求參數錯誤
- **401**: 認證失敗
- **403**: 權限不足
- **404**: 資源不存在
- **429**: 請求頻率限制
- **500**: 伺服器錯誤

### 錯誤回應格式
```json
{
  "code": 400,
  "message": "Invalid request parameters",
  "data": null,
  "errors": [
    {
      "field": "page",
      "message": "Page must be a positive integer"
    }
  ]
}
```

## 📊 限制與配額

### API 限制
- **請求頻率**: 每分鐘最多 60 次請求
- **分頁限制**: 每頁最多 100 筆記錄
- **Token 過期**: Access Token 有效期 24 小時

### 建議實作
- 實作請求重試機制
- 使用分頁獲取大量資料
- 快取 Token 避免重複請求

## 🔄 更新日誌

### 2025-10-20
- 建立初始 API 研究文件
- 記錄商品、訂單、商店資訊 API
- 提供 Node.js 實作範例
- 記錄錯誤處理機制

---

**文件版本**: 1.0.0  
**最後更新**: 2025-10-20  
**研究狀態**: 進行中  
**下一步**: 實作真正的 API 呼叫功能
