# SHOPLINE Access Scopes 說明

## 📋 基本資訊

- **官方文件**：https://developer.shopline.com/docs/apps/api-instructions-for-use/access-scope?version=v20260301
- **版本**：v20260301
- **最後更新**：2025-10-21

## 🔑 Access Scope 說明

Access Scope 用於控制應用程式可以存取的 SHOPLINE API 資源範圍。每個 API 端點都需要對應的 scope 權限。

## 📊 當前專案使用的 Scopes

### ✅ 已申請的 Scopes

#### 1. `read_store_information`
**用途**：讀取商店資訊

**對應 API**：
- GET `/admin/openapi/v20260301/merchants/shop.json` - 商店資訊

**使用位置**：
- `api/test/shop.js` - 測試商店 API

---

#### 2. `read_products`
**用途**：讀取商品資訊

**對應 API**：
- GET `/admin/openapi/v20260301/products/products.json` - 商品列表

**使用位置**：
- `api/test/products.js` - 測試商品查詢 API

---

#### 3. `write_products`
**用途**：建立和修改商品

**對應 API**：
- POST `/admin/openapi/v20260301/products/products.json` - 建立商品

**使用位置**：
- `api/test/products.js` - 測試商品建立 API

---

### 📋 待申請的 Scopes（Sprint 2）

#### 4. `read_orders`
**用途**：讀取訂單資訊

**對應 API**：
- GET `/admin/openapi/v20260301/orders.json` - 訂單列表
- GET `/admin/openapi/v20260301/orders/{id}.json` - 訂單詳情

**使用位置**（待實作）：
- `api/test/orders.js` - 測試訂單查詢 API

**需要時機**：Sprint 2 - Orders API 實作

---

#### 5. `write_orders`
**用途**：建立和修改訂單

**對應 API**：
- POST `/admin/openapi/v20260301/orders.json` - 建立訂單
- PUT `/admin/openapi/v20260301/orders/{id}.json` - 更新訂單

**使用位置**（待實作）：
- `api/test/orders.js` - 測試訂單建立/更新 API

**需要時機**：Sprint 2 - Orders API 實作

---

## 🔧 如何更新 Scopes

### 1. 更新應用程式設定

#### SHOPLINE Developer Center
1. 前往 SHOPLINE Partner Portal
2. 選擇你的應用程式
3. 進入「應用設定」
4. 在「API 權限」區段更新 scopes
5. 儲存變更

### 2. 更新代碼中的 Scope 設定

#### 本地開發（routes/oauth.js）
```javascript
const scope = 'read_store_information,read_products,write_products,read_orders,write_orders'
```

#### Vercel 生產環境（api/oauth/install.js）
```javascript
const scope = 'read_store_information,read_products,write_products,read_orders,write_orders'
```

#### 前端授權連結（public/js/app.js）
```javascript
const scope = 'read_store_information,read_products,write_products,read_orders,write_orders'
```

### 3. 重新授權

更新 scopes 後，用戶需要重新授權：
1. 點擊「撤銷授權」
2. 重新點擊「開始授權」
3. 確認新的權限請求
4. 完成授權流程

## ⚠️ 重要注意事項

### Scope 命名規則
- **讀取權限**：`read_*`
- **寫入權限**：`write_*`
- 寫入權限通常包含讀取權限的功能

### Scope 變更影響
- 更新 scopes 後，現有的 access token 不會自動更新
- 用戶必須重新授權才能取得新的權限
- 測試環境和生產環境的 scopes 應保持一致

### 最小權限原則
- 只申請必要的 scopes
- 不要申請用不到的權限
- 定期檢視和清理不需要的 scopes

## 📊 Scope 使用追蹤

### Sprint 1 (v2.0.0)
- ✅ `read_store_information`
- ✅ `read_products`
- ✅ `write_products`

### Sprint 2 (v2.1.0) - 待實作
- [ ] `read_orders`
- [ ] `write_orders`

### 未來可能需要的 Scopes
- `read_customers` - 讀取客戶資訊
- `write_customers` - 建立和修改客戶
- `read_inventory` - 讀取庫存資訊
- `write_inventory` - 修改庫存

## 🔍 Scope 驗證

### 如何驗證 Scope 是否生效

#### 1. 檢查 Token 資訊
```bash
# 查詢當前 token 的 scopes
GET /oauth/token-status?handle=paykepoc
```

回應範例：
```json
{
  "success": true,
  "data": {
    "scope": "read_store_information,read_products,write_products"
  }
}
```

#### 2. 測試 API 端點
```bash
# 測試需要特定 scope 的 API
GET /api/test/orders
```

如果 scope 不足，會返回：
```json
{
  "success": false,
  "error": "ACCESS_TOKEN is no permission!"
}
```

## 📝 變更日誌

### 2025-10-21
- ✅ 建立 Access Scopes 文件
- ✅ 記錄當前使用的 3 個 scopes
- ✅ 規劃 Sprint 2 需要的 2 個 scopes

---

**參考文件**：https://developer.shopline.com/docs/apps/api-instructions-for-use/access-scope?version=v20260301  
**維護者**：Development Team  
**最後更新**：2025-10-21

