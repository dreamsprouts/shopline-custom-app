# SHOPLINE Orders API 測試筆記

## 📋 文件資訊

- **API 版本**: v20260301
- **官方文件**: https://developer.shopline.com/docs/admin-rest-api/order/order-management/create-an-order?version=v20260301
- **測試日期**: 2025-10-22
- **測試狀態**: ✅ 驗證完成

---

## 🛒 建立訂單 API (Create Order)

### 基本資訊

- **端點**: `POST /admin/openapi/v20260301/orders.json`
- **所需權限**: `write_orders`
- **請求標頭**:
  ```http
  Authorization: Bearer {access_token}
  Content-Type: application/json
  Accept: application/json
  ```

---

## ✅ 最小可用 Payload（已測試）

以下是經過實際測試，**確認可以成功建立訂單**的最小 payload：

```json
{
  "order": {
    "note_attributes": [
      {
        "name": "API_REMARK",
        "value": "Test order created at 2025-10-22T02:40:06.505Z"
      }
    ],
    "tags": "API_Test_1761100806509",
    "price_info": {
      "current_extra_total_discounts": "8.00",
      "taxes_included": null,
      "total_shipping_price": "8.00"
    },
    "line_items": [
      {
        "discount_price": {
          "amount": "1.00",
          "title": "Test Discount"
        },
        "price": "100.00",
        "properties": [
          {
            "name": "Test Attribute",
            "show": true,
            "type": "text",
            "value": "Test Value"
          }
        ],
        "quantity": 1,
        "requires_shipping": null,
        "shipping_line_title": null,
        "tax_line": {
          "price": "5.00",
          "rate": "0.050",
          "title": "Tax"
        },
        "taxable": null,
        "title": "Product Title",
        "variant_id": "18072188958287349702023900"
      }
    ]
  }
}
```

### ⚠️ 重要發現

#### 1. `location_id` 欄位可以省略

**測試結果**：
- ❌ **帶 location_id（硬編碼）**: `{ errors: 'location is invalid' }`
- ✅ **不帶 location_id**: 訂單建立成功

**原因**：
- `location_id` 是**商店特定**的，不能跨商店使用
- 官方文件中 `location_id` 是**選填欄位**
- 省略時 Shopline 會使用預設 location

**建議**：
- ✅ 測試環境：省略 `location_id`
- ✅ 正式環境：如果需要指定倉庫，先查詢商店的 locations 再使用

#### 2. `variant_id` 必須是有效的

**取得方式**：
1. 先呼叫 `GET /admin/openapi/v20260301/products/products.json`
2. 從商品的 `variants` 陣列中取得 `id`
3. 使用該 `id` 作為 `variant_id`

**範例代碼**：
```javascript
// 1. 取得商品
const productsResult = await apiClient.getProducts(accessToken, {
  page: 1,
  limit: 10,
  status: 'active'
})

const products = productsResult.data?.products || []
const firstProduct = products[0]
const variantId = firstProduct.variants[0].id  // ← 取得 variant_id

// 2. 使用 variant_id 建立訂單
const orderData = {
  order: {
    line_items: [{
      variant_id: variantId,  // ← 使用實際的 variant_id
      price: "100.00",
      quantity: 1,
      title: firstProduct.title
    }]
  }
}
```

---

## 📝 測試結果

### 測試案例 1: 帶無效 location_id
```json
{
  "line_items": [{
    "location_id": "6402444512912503764",  // ← 硬編碼的無效 ID
    "variant_id": "18072188958287349702023900",
    "price": "100.00"
  }]
}
```

**結果**: ❌ `500 Internal Server Error`
```json
{
  "errors": "location is invalid"
}
```

---

### 測試案例 2: 省略 location_id（✅ 推薦）
```json
{
  "line_items": [{
    "variant_id": "18072188958287349702023900",
    "price": "100.00",
    "quantity": 1,
    "title": "Test Product"
  }]
}
```

**結果**: ✅ `200 OK`
```json
{
  "order": {
    "id": "21072271681728426845564555",
    "status": "pending",
    "line_items": [...]
  }
}
```

---

## 🔍 欄位說明

### 必填欄位
- `line_items`: 訂單項目陣列
  - `variant_id`: 商品 variant ID（必填）
  - `quantity`: 數量（必填，預設 1）
  - `price`: 價格（必填）

### 選填欄位
- `note_attributes`: 訂單備註屬性
- `tags`: 訂單標籤
- `price_info`: 價格資訊
  - `current_extra_total_discounts`: 額外折扣
  - `total_shipping_price`: 運費
- `line_items` 中的選填欄位：
  - `discount_price`: 折扣資訊
  - `properties`: 商品屬性
  - `tax_line`: 稅金資訊
  - `title`: 商品名稱
  - ⚠️ `location_id`: 倉庫 ID（**建議省略**）

---

## 🎯 最佳實踐

### 1. 動態取得 variant_id
❌ **不要硬編碼**:
```javascript
const variantId = "18072188958287349702023900"  // 固定值，不靈活
```

✅ **動態查詢**:
```javascript
const products = await getProducts(accessToken)
const variantId = products[0].variants[0].id  // 從 API 取得
```

### 2. 省略 location_id
❌ **不要硬編碼**:
```javascript
location_id: "6402444512912503764"  // 可能無效
```

✅ **省略該欄位**:
```javascript
{
  variant_id: variantId,
  price: "100.00",
  // 不帶 location_id
}
```

### 3. 錯誤處理
```javascript
try {
  const result = await apiClient.createOrder(accessToken, orderData)
  
  if (!result.success) {
    if (result.error.includes('location is invalid')) {
      console.error('Location ID 無效，請移除該欄位')
    }
  }
} catch (error) {
  console.error('建立訂單失敗:', error.response?.data)
}
```

---

## 📊 測試統計

| 測試項目 | 狀態 | 說明 |
|---------|------|------|
| 帶 location_id | ❌ 失敗 | `location is invalid` |
| 不帶 location_id | ✅ 成功 | Order ID: 21072271681728426845564555 |
| 動態 variant_id | ✅ 成功 | 從 Products API 取得 |
| 硬編碼 variant_id | ⚠️ 不推薦 | 商品刪除後會失效 |

---

## 🔄 完整測試流程

### 端到端測試腳本
```javascript
// scripts/test-create-order-simple.js

const database = require('../utils/database-postgres')
const ShoplineAPIClient = require('../utils/shopline-api')

async function testCreateOrder() {
  // 1. 初始化
  await database.init()
  const tokenRecord = await database.getToken('shop_handle')
  const apiClient = new ShoplineAPIClient()
  
  // 2. 取得商品（動態取得 variant_id）
  const productsResult = await apiClient.getProducts(tokenRecord.accessToken, {
    page: 1,
    limit: 10,
    status: 'active'
  })
  
  const products = productsResult.data?.products || []
  const variantId = products[0].variants[0].id
  
  // 3. 建立訂單（不帶 location_id）
  const orderData = {
    order: {
      tags: `API_Test_${Date.now()}`,
      line_items: [{
        variant_id: variantId,  // ← 動態取得
        price: "100.00",
        quantity: 1,
        title: products[0].title
        // 不帶 location_id ← 重點
      }]
    }
  }
  
  const result = await apiClient.createOrder(tokenRecord.accessToken, orderData)
  
  if (result.success) {
    console.log('✅ 訂單建立成功')
    console.log('Order ID:', result.data?.data?.order?.id)
  }
  
  await database.close()
}
```

---

## 📚 參考資料

- **官方文件**: https://developer.shopline.com/docs/admin-rest-api/order/order-management/create-an-order?version=v20260301
- **測試腳本**: `scripts/test-create-order-simple.js`
- **API Client**: `utils/shopline-api.js` - `createOrder()` 方法
- **Vercel Function**: `api/test/orders/create.js`

---

## 🔄 更新日誌

### 2025-10-22
- ✅ 確認 `location_id` 可以省略
- ✅ 測試最小可用 payload
- ✅ 記錄常見錯誤和解決方案
- ✅ 提供端到端測試範例

---

**文件版本**: 1.0.0  
**最後更新**: 2025-10-22  
**測試商店**: paykepoc  
**測試結果**: ✅ 所有測試通過

