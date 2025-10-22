# Next Engine API 研究

## 📋 基本資訊

- **文件入口**: https://developer.next-engine.com/api
- **API 主機**: https://api.next-engine.org
- **API 類型**: RESTful API
- **研究日期**: 2025-10-22
- **狀態**: ✅ 初步研究完成

---

## 🎯 核心發現

### 1. API 架構

#### 1.1 API 類型
- **純 REST API**: 只支援 REST風格，無 GraphQL
- **版本**: `api_v1_*` (版本 1)
- **認證方式**: OAuth 2.0 類似流程 (但有獨特實作)
- **主要 Host**:
  - **認證 Host**: `https://base.next-engine.org` (NEログイン)
  - **API Host**: `https://api.next-engine.org` (所有業務 API)

#### 1.2 支援的業務模組

Next Engine API 支援非常完整的電商後台管理功能：

| 模組分類 | 模組名稱 | 說明 | 對應 Shopline |
|---------|---------|------|--------------|
| **認證系統** | 認証系エンドポイント | OAuth 認證流程 | ✅ 類似 |
| **訂單管理** | 受注伝票エンドポイント | 訂單主檔 (CRUD) | ✅ Orders |
| | 受注伝票オプションエンドポイント | 訂單選項 | - |
| | 受注明細エンドポイント | 訂單明細 (Line Items) | ✅ Order Items |
| | 受注確認内容エンドポイント | 訂單確認內容 | - |
| | 受注税金内訳エンドポイント | 訂單稅金明細 | - |
| | 受注分類タグエンドポイント | 訂單分類標籤 | - |
| **配送管理** | 発送方法別区分エンドポイント | 配送方式區分 | ✅ Shipping |
| | 支払い発送変換エンドポイント | 支付配送轉換 | - |
| **倉庫管理** | 拠点マスタエンドポイント | 倉庫據點主檔 | ✅ Locations |
| **商品管理** | 商品マスタエンドポイント | 商品主檔 (CRUD) | ✅ Products |
| | セット商品マスタエンドポイント | 套裝商品主檔 | - |
| | 商品タグエンドポイント | 商品標籤 | ✅ Product Tags |
| | 商品画像エンドポイント | 商品圖片 | ✅ Product Images |
| | 商品カテゴリエンドポイント | 商品分類 | ✅ Collections |
| | 商品ページエンドポイント | 商品頁面 | - |
| **庫存管理** | 在庫マスタエンドポイント | 庫存主檔 | ✅ Inventory |
| | 拠點在庫マスタエンドポイント | 據點庫存 | ✅ Location Inventory |
| | 在庫入出庫履歴エンドポイント | 庫存出入庫紀錄 | - |
| **採購管理** | 仕入先マスタエンドポイント | 供應商主檔 | - |
| | 仕入伝票エンドポイント | 進貨單據 | - |
| | 発注伝票エンドポイント | 採購訂單 | - |
| **銷售管理** | 卸先マスタエンドポイント | 批發客戶主檔 | - |
| **店鋪管理** | 店舗マスタエンドポイント | 店舖主檔 (CRUD) | - |
| **系統設定** | 區分情報エンドポイント | 各種系統設定 | - |
| **檔案管理** | ストレージ系エンドポイント | 檔案上傳/下載 | - |

**關鍵差異**:
- ✅ **Next Engine 功能更完整**: 支援進銷存全流程 (進貨、採購、批發)
- ✅ **Shopline 較電商導向**: 專注線上銷售和客戶管理
- ⚠️ **Next Engine 沒有 Customers API**: 客戶資訊內嵌在訂單中

---

### 2. 認證機制

#### 2.1 認證流程概述

Next Engine 使用類 OAuth 2.0 的認證流程，但有獨特的實作細節：

```
┌─────────────────────────────────────────────────────────────┐
│  認證流程 (場景 1: 從 NE 平台啟動)                              │
└─────────────────────────────────────────────────────────────┘
                                                                
  User → Next Engine → Your App (with uid, state)              
            ↓                                                   
  Your App → API Server: Get access_token                      
            (uid, state, client_id, client_secret)             
            ↓                                                   
  API Server → Your App: access_token, refresh_token           
            ↓                                                   
  Your App → API Server: API calls (with access_token)         
```

#### 2.2 認證端點

##### 2.2.1 uid & state 取得
**Endpoint**: `GET https://base.next-engine.org/users/sign_in`

**Query Parameters**:
- `client_id`: App 的 Client ID

**Response**: 重定向到 App 的 Redirect URI，並附帶：
- `uid`: 用戶識別 ID
- `state`: 狀態碼 (**有效期 5 分鐘**)

##### 2.2.2 access_token 取得
**Endpoint**: `POST https://api.next-engine.org/api_neauth`

**Request Body**:
```json
{
  "uid": "...",
  "state": "...",
  "client_id": "...",
  "client_secret": "..."
}
```

**Response**:
```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

#### 2.3 Token 管理

##### Token 生命週期
| Token Type | 有效期限 | 更新機制 |
|-----------|---------|---------|
| **state** | **5 分鐘** | 需重新取得 uid/state |
| **access_token** | **1 天** | 使用 refresh_token 自動更新 |
| **refresh_token** | **3 天** | 自動隨 access_token 更新 |

##### 自動更新機制 ⭐
**關鍵特性**: Next Engine API 會在每次 API 呼叫時，如果 `access_token` 過期但 `refresh_token` 仍有效，**自動**返回新的 token：

**Request**:
```
POST /api_v1_receiveorder_base/search
Headers:
  (access_token 和 refresh_token 在 Body 或 Header 中)

Body:
{
  "access_token": "expired_token",
  "refresh_token": "valid_refresh_token",
  "other_params": "..."
}
```

**Response** (如果 access_token 過期):
```json
{
  "result": "success",
  "data": [...],
  "access_token": "new_access_token",    // ⭐ 新 token
  "refresh_token": "new_refresh_token"   // ⭐ 新 token
}
```

**重要**: 開發者必須在**每次 API 呼叫後**檢查並保存新的 token。

---

### 3. API 請求格式

#### 3.1 通用請求格式

**所有 API 都使用 POST**:
```
POST https://api.next-engine.org/api_v1_{resource}_{action}
```

**Headers**:
```
Content-Type: application/x-www-form-urlencoded
```

**Body** (form-urlencoded):
```
access_token={access_token}
&refresh_token={refresh_token}
&{other_params}
```

#### 3.2 常見操作模式

所有資源都遵循類似的操作模式：

| 操作 | Endpoint 模式 | 說明 |
|------|--------------|------|
| **件数取得** (Count) | `/api_v1_{resource}/count` | 取得符合條件的資料筆數 |
| **検索** (Search) | `/api_v1_{resource}/search` | 搜尋資料 (支援過濾、分頁) |
| **更新** (Update) | `/api_v1_{resource}/update` | 更新單筆資料 |
| **一括更新** (Bulk Update) | `/api_v1_{resource}/bulkupdate` | 批次更新 |
| **アップロード** (Upload) | `/api_v1_{resource}/upload` | 上傳/建立資料 |

**範例**: 受注伝票 (Orders)
- Count: `/api_v1_receiveorder_base/count`
- Search: `/api_v1_receiveorder_base/search`
- Update: `/api_v1_receiveorder_base/update`
- Bulk Update: `/api_v1_receiveorder_base/bulkupdate`
- Upload: `/api_v1_receiveorder_base/upload`

---

### 4. 資料查詢 (Search) 機制

#### 4.1 通用查詢參數

所有 `search` endpoint 都支援以下參數：

**基本參數**:
```
access_token={token}
refresh_token={token}
fields={欄位列表，逗號分隔}   // 指定要返回的欄位
```

**分頁參數**:
```
offset={起始位置}   // 從 0 開始
limit={筆數}       // 預設 20，最大 10000
```

**過濾參數** (使用比較運算子):
```
{欄位名稱}-{運算子}={值}
```

#### 4.2 比較運算子

| 運算子 | 說明 | 範例 |
|-------|------|------|
| `-eq` | 等於 | `receiveorder_id-eq=12345` |
| `-neq` | 不等於 | `status-neq=cancelled` |
| `-gt` | 大於 | `total_amount-gt=1000` |
| `-gte` | 大於等於 | `created_date-gte=2025-01-01` |
| `-lt` | 小於 | `total_amount-lt=10000` |
| `-lte` | 小於等於 | `created_date-lte=2025-12-31` |
| `-like` | 模糊匹配 | `customer_name-like=%山田%` |
| `-in` | 在列表中 | `status-in=pending,processing` |

#### 4.3 查詢範例

##### 範例 1: 查詢訂單列表
```
POST /api_v1_receiveorder_base/search
Content-Type: application/x-www-form-urlencoded

access_token={token}
&refresh_token={token}
&fields=receiveorder_id,receiveorder_number,customer_name,total_amount,order_date
&offset=0
&limit=50
&order_date-gte=2025-10-01
&order_date-lt=2025-11-01
&status-in=pending,processing
```

##### 範例 2: 查詢商品
```
POST /api_v1_master_goods/search
Content-Type: application/x-www-form-urlencoded

access_token={token}
&refresh_token={token}
&fields=goods_id,goods_code,goods_name,stock_quantity,selling_price
&offset=0
&limit=100
&goods_name-like=%シャツ%
&stock_quantity-gt=0
```

---

### 5. 資料結構

#### 5.1 通用回應格式

**成功回應**:
```json
{
  "result": "success",
  "count": 123,              // 符合條件的總筆數
  "data": [
    {
      "field1": "value1",
      "field2": "value2",
      ...
    }
  ],
  "access_token": "new_token",      // ⚠️ 如果 token 更新
  "refresh_token": "new_refresh"    // ⚠️ 如果 token 更新
}
```

**錯誤回應**:
```json
{
  "result": "error",
  "code": "002004",
  "message": "access_token expired"
}
```

#### 5.2 受注伝票 (Orders) 資料結構

**主要欄位** (from `/api_v1_receiveorder_base/search`):

```javascript
{
  "receiveorder_id": "123456",           // 訂單 ID
  "receiveorder_number": "NE202510-001", // 訂單編號
  "receiveorder_import_date": "2025-10-22 12:34:56",
  "receiveorder_confirm_date": "2025-10-22 13:00:00",
  "receiveorder_order_date": "2025-10-22",
  
  // 客戶資訊 (內嵌，無獨立 Customers API)
  "receiveorder_customer_name": "山田太郎",
  "receiveorder_customer_name_kana": "ヤマダタロウ",
  "receiveorder_customer_zip_code": "1000001",
  "receiveorder_customer_address1": "東京都千代田区",
  "receiveorder_customer_address2": "1-1-1",
  "receiveorder_customer_tel": "03-1234-5678",
  "receiveorder_customer_mail_address": "yamada@example.com",
  
  // 配送資訊
  "receiveorder_delivery_name": "山田花子",
  "receiveorder_delivery_zip_code": "1000002",
  "receiveorder_delivery_address1": "東京都千代田区",
  "receiveorder_delivery_address2": "2-2-2",
  "receiveorder_delivery_tel": "03-5678-1234",
  
  // 金額
  "receiveorder_total_amount": "10800",     // 總金額
  "receiveorder_goods_amount": "10000",     // 商品金額
  "receiveorder_tax": "800",                // 稅金
  "receiveorder_delivery_fee": "0",         // 運費
  "receiveorder_charge": "0",               // 手續費
  
  // 狀態
  "receiveorder_status": "10",              // 訂單狀態碼
  "receiveorder_cancel_type": "0",          // 取消類型
  "receiveorder_important_check_type": "0", // 重要檢查
  "receiveorder_confirm_check_type": "1",   // 確認檢查
  
  // 支付 & 配送
  "receiveorder_payment_method_id": "1",
  "receiveorder_delivery_id": "3",
  
  // 店鋪
  "receiveorder_shop_id": "5",
  "receiveorder_shop_cut_form_id": "1",
  
  // 倉庫
  "receiveorder_warehouse_id": "1",
  
  // 其他
  "receiveorder_note": "備註內容",
  "receiveorder_statement_delivery_text": "配送備註",
  "receiveorder_worker": "作業人員"
}
```

#### 5.3 商品マスタ (Products) 資料結構

**主要欄位** (from `/api_v1_master_goods/search`):

```javascript
{
  "goods_id": "789",                    // 商品 ID
  "goods_code": "ITEM-001",             // 商品代碼 (SKU)
  "goods_name": "白シャツ",            // 商品名稱
  "goods_name_kana": "シロシャツ",      // 商品名稱假名
  
  // 庫存
  "stock_quantity": "100",              // 總庫存
  "stock_allocation_quantity": "10",    // 分配庫存
  "stock_free_quantity": "90",          // 可用庫存
  
  // 價格
  "cost_price": "3000",                 // 成本價
  "selling_price": "5000",              // 售價
  "retail_price": "6000",               // 建議售價
  
  // 分類
  "goods_tag_id": "1,3,5",              // 商品標籤 ID (逗號分隔)
  "goods_tax_rate_id": "1",             // 稅率 ID
  
  // 屬性
  "goods_weight": "200",                // 重量 (g)
  "goods_width": "30",                  // 寬 (cm)
  "goods_depth": "40",                  // 深 (cm)
  "goods_height": "5",                  // 高 (cm)
  
  // 狀態
  "goods_type_id": "1",                 // 商品類型
  "goods_status_id": "1",               // 商品狀態
  "goods_merchandise_id": "1",          // 取扱區分
  
  // 供應商
  "supplier_id": "10",
  "supplier_goods_code": "SUP-001",
  
  // 其他
  "goods_description": "商品說明",
  "goods_note": "備註",
  "pic_folder_id": "20"                 // 圖片資料夾 ID
}
```

---

### 6. 與 Shopline 對比

#### 6.1 核心差異

| 特性 | Shopline REST | Shopline GraphQL | Next Engine |
|------|--------------|------------------|-------------|
| **API 風格** | REST | GraphQL | REST |
| **認證方式** | OAuth 2.0 | OAuth 2.0 | 類 OAuth 2.0 |
| **Token 更新** | 手動 Refresh | 手動 Refresh | **自動更新** ⭐ |
| **請求方法** | GET/POST/PUT/DELETE | POST (GraphQL) | **僅 POST** |
| **分頁機制** | Offset-based (`page`, `limit`) | Cursor-based | Offset-based (`offset`, `limit`) |
| **過濾語法** | Query params | GraphQL query string | **運算子後綴** (`-eq`, `-gt`) |
| **ID 格式** | 數字 | GID (`gid://shopline/Product/123`) | 數字字串 |
| **回應格式** | JSON | JSON (data/errors) | JSON (result/data) |
| **客戶管理** | ✅ Customers API | ✅ Customers API | ❌ 內嵌在訂單中 |
| **訂單管理** | ✅ Orders API | ❌ 不支援 | ✅ 受注伝票 API |
| **進銷存** | ❌ 無 | ❌ 無 | ✅ **完整支援** |

#### 6.2 業務功能對比

| 功能模組 | Shopline | Next Engine | 備註 |
|---------|----------|-------------|------|
| **商品管理** | ✅ | ✅ | Next Engine 更細緻 (倉庫、供應商) |
| **訂單管理** | ✅ | ✅ | Next Engine 流程更完整 |
| **客戶管理** | ✅ | ❌ | Next Engine 客戶資訊在訂單中 |
| **庫存管理** | ✅ 簡單 | ✅ **完整** | Next Engine 支援多倉庫、出入庫紀錄 |
| **進貨管理** | ❌ | ✅ | Next Engine 獨有 |
| **採購管理** | ❌ | ✅ | Next Engine 獨有 |
| **批發管理** | ❌ | ✅ | Next Engine 獨有 |
| **店鋪管理** | ❌ | ✅ | Next Engine 支援多店鋪 |
| **會員系統** | ✅ | ❌ | Shopline 獨有 |
| **折扣行銷** | ✅ | ❌ | Shopline 獨有 |

**結論**:
- **Shopline**: 專注**線上銷售**和**客戶體驗**
- **Next Engine**: 專注**後台管理**和**進銷存流程**

---

### 7. 認證流程差異

#### 7.1 Shopline OAuth 2.0
```
1. 用戶授權 → 取得 authorization_code
2. 使用 code 換取 access_token
3. 使用 access_token 呼叫 API
4. Token 過期 → 使用 refresh_token 手動更新
```

#### 7.2 Next Engine OAuth-like
```
1. 取得 uid & state (5 分鐘有效)
2. 使用 uid, state, client_id, client_secret 取得 access_token & refresh_token
3. 使用 access_token & refresh_token 呼叫 API
4. Token 過期 → **API 自動返回新 token** (無需手動更新)
```

**關鍵差異**:
- Shopline: **必須手動呼叫 refresh endpoint**
- Next Engine: **每次 API 呼叫都可能返回新 token**

#### 7.3 Token 管理策略

**Shopline**:
```typescript
// 固定的 token refresh 邏輯
if (isTokenExpired(accessToken)) {
  const newTokens = await refreshAccessToken(refreshToken);
  saveTokens(newTokens);
}
await callAPI(accessToken);
```

**Next Engine**:
```typescript
// 每次呼叫後都要檢查並保存 token
const response = await callAPI(accessToken, refreshToken);
if (response.access_token) {
  // ⚠️ Token 已更新，必須保存
  saveTokens({
    accessToken: response.access_token,
    refreshToken: response.refresh_token
  });
}
return response.data;
```

---

### 8. 錯誤處理

#### 8.1 錯誤碼

| 錯誤碼 | 說明 | 處理方式 |
|-------|------|---------|
| `002001` | client_id 或 client_secret 錯誤 | 檢查 App 設定 |
| `002002` | access_token 無效 (已被更新) | 使用新的 token |
| `002004` | access_token 和 refresh_token 都過期 | 重新授權 |
| `002005` | uid 或 state 錯誤/過期 | 重新取得 uid/state |
| `003001` | 缺少必要參數 | 檢查請求參數 |
| `003002` | 參數格式錯誤 | 檢查參數格式 |
| `004001` | 資料不存在 | 確認 ID 正確 |
| `005001` | 權限不足 | 檢查 App 權限設定 |

#### 8.2 錯誤回應範例

```json
{
  "result": "error",
  "code": "002004",
  "message": "access_token, refresh_token expired"
}
```

---

### 9. Rate Limiting

**文件未明確說明**，但根據一般經驗推測：
- 每秒請求數 (RPS) 限制
- 可能有每日請求總量限制
- **建議**: 實作 retry 機制和 exponential backoff

**提示**: 文件建議批次處理時避免多執行緒操作同一用戶 (因為 token 管理複雜)。

---

### 10. 資料映射挑戰

#### 10.1 ID 格式轉換

**不需要** GID 轉換，但需注意：
- Next Engine 的 ID 是**字串格式的數字** (`"123456"`)
- Shopline 的 ID 可能是數字或 GID

```typescript
// Helper functions
function toNextEngineId(shoplineId: number | string): string {
  if (typeof shoplineId === 'string' && shoplineId.startsWith('gid://')) {
    return extractIdFromGID(shoplineId);
  }
  return String(shoplineId);
}

function toShoplineId(nextEngineId: string): number {
  return parseInt(nextEngineId, 10);
}
```

#### 10.2 分頁轉換

兩者都使用 offset-based，但參數名稱不同：

```typescript
// Shopline → Next Engine
function shoplineToNextEngine(page: number, limit: number) {
  return {
    offset: (page - 1) * limit,
    limit: limit
  };
}

// Next Engine → Shopline
function nextEngineToShopline(offset: number, limit: number) {
  return {
    page: Math.floor(offset / limit) + 1,
    limit: limit
  };
}
```

#### 10.3 過濾語法轉換

**Shopline** (Query Params):
```
?status=pending&created_at_min=2025-01-01
```

**Next Engine** (Form Body):
```
status-eq=pending&created_date-gte=2025-01-01
```

轉換邏輯：
```typescript
const operatorMap = {
  'min': 'gte',
  'max': 'lte',
  '': 'eq'  // default
};

function shoplineFilterToNextEngine(filters: Record<string, any>) {
  const neFilters: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(filters)) {
    if (key.endsWith('_min')) {
      const baseKey = key.replace('_min', '');
      neFilters[`${baseKey}-gte`] = value;
    } else if (key.endsWith('_max')) {
      const baseKey = key.replace('_max', '');
      neFilters[`${baseKey}-lte`] = value;
    } else {
      neFilters[`${key}-eq`] = value;
    }
  }
  
  return neFilters;
}
```

#### 10.4 客戶資料結構差異

**Shopline**: 獨立的 Customers API
```json
{
  "customer": {
    "id": 123,
    "email": "yamada@example.com",
    "first_name": "太郎",
    "last_name": "山田"
  }
}
```

**Next Engine**: 客戶資訊內嵌在訂單中
```json
{
  "receiveorder_customer_name": "山田太郎",
  "receiveorder_customer_mail_address": "yamada@example.com"
}
```

**映射策略**:
- 從 Next Engine 訂單中提取客戶資訊
- 建立本地 Customer 模型
- 使用 email 或 name 作為去重依據

---

### 11. 通用抽象層設計考量

#### 11.1 請求規範差異

| 特性 | Shopline REST | Next Engine |
|------|--------------|-------------|
| HTTP Method | GET/POST/PUT/DELETE | **僅 POST** |
| Content-Type | `application/json` | `application/x-www-form-urlencoded` |
| Token 位置 | `Authorization: Bearer {token}` | Body 中 (`access_token=...`) |
| Token 更新 | 手動呼叫 `/oauth/token` | **回應中自動返回** |

#### 11.2 建議的抽象層結構

```typescript
interface APIRequestSpec {
  type: 'rest' | 'graphql';
  resource: string;
  action: string;
  params?: Record<string, any>;
  filters?: Record<string, any>;
  pagination?: PaginationSpec;
}

interface RESTRequestSpec extends APIRequestSpec {
  type: 'rest';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  // Next Engine specific
  formEncoded?: boolean;        // ⭐ Next Engine 使用 form-urlencoded
  autoRefreshToken?: boolean;   // ⭐ Next Engine 自動更新 token
}

interface PlatformClient {
  execute(spec: APIRequestSpec): Promise<Response>;
  
  // Token management
  getAccessToken(): Promise<string>;
  refreshAccessToken(): Promise<TokenPair>;
  
  // Next Engine specific
  handleAutoRefresh?(response: any): void;  // ⭐ 處理自動更新的 token
}
```

#### 11.3 統一的 Response 格式

```typescript
interface UnifiedResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
  // Token updates (Next Engine)
  tokenUpdated?: boolean;
  newTokens?: {
    accessToken: string;
    refreshToken: string;
  };
}
```

---

### 12. SDK 支援

Next Engine 提供官方 SDK (PHP, Ruby 等)，但不是強制使用。

**SDK 特性**:
- 自動處理 token refresh
- 自動處理 form-urlencoded 編碼
- 提供型別提示 (部分語言)

**我們的選擇**: 不使用 SDK，自行實作以保持一致性。

---

### 13. Webhook 替代方案：主動推送式庫存更新 ⭐

#### 13.1 概述

**關鍵發現**: Next Engine **沒有傳統的 Webhook 機制**，但提供了一個**反向推送**的庫存更新機制。

- **傳統 Webhook**: 平台主動推送事件到你的伺服器
- **Next Engine 方式**: **Next Engine 主動呼叫你提供的 URL 來更新庫存**

這是一個非常獨特的設計，實際上是 Next Engine 作為「主動方」來同步庫存到外部系統。

**參考文件**: [在庫更新プログラムの準備【汎用】](https://manual.next-engine.net/main/stock/stk_settei-unyou/zaiko_hanyo/5174/)

#### 13.2 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│  傳統 Webhook (例如 Shopline)                                 │
└─────────────────────────────────────────────────────────────┘

  Shopline Server → Your Server (POST /webhook/inventory)
  {
    "event": "inventory.updated",
    "product_id": 123,
    "new_quantity": 50
  }
```

```
┌─────────────────────────────────────────────────────────────┐
│  Next Engine 主動推送式庫存更新                                 │
└─────────────────────────────────────────────────────────────┘

  Next Engine Server → Your Server (GET /UpdateStock.php?...)
  
  參數：
  - StoreAccount: 店鋪帳號
  - Code: 商品代碼
  - Stock: 庫存數量
  - ts: 時間戳
  - .sig: 簽章 (HMAC)
  
  Your Server → Next Engine (XML Response)
  <Processed>0</Processed>  // 0=成功
```

#### 13.3 請求規範

**HTTP Method**: `GET` (注意：不是 POST)

**URL 範例**:
```
http://your-domain.com/UpdateStock.php?
  StoreAccount=samplestore&
  Code=test-aaa&
  Stock=10&
  ts=20180115083010&
  .sig=6a4812f93d36aece5559a9c271fab5a2
```

**參數說明**:

| 參數 | 說明 | 範例 |
|-----|------|------|
| `StoreAccount` | 店鋪帳號 (自訂識別碼) | `samplestore` |
| `Code` | 商品代碼 (對應商品主檔) | `test-aaa` |
| `Stock` | 庫存數量 | `10` |
| `ts` | 時間戳 (YYYYMMDDhhmmss) | `20180115083010` |
| `.sig` | HMAC-MD5 簽章 | `6a4812f93d36aece5559a9c271fab5a2` |

**庫存數量計算**:
```
Stock = 商品マスタのフリー在庫数 + 予約フリー在庫数
```

**特殊情況** (庫存數為空):
- 商品區分為「20：受注発注」(接單後訂貨)
- 商品區分為「10：予約」且預約庫存數為「99999」

#### 13.4 簽章驗證

**簽章生成邏輯**:
```typescript
function generateSignature(params: URLSearchParams, authKey: string): string {
  // 1. 組合所有參數 (不包含 .sig 本身)
  const paramString = params.toString();  // 例: StoreAccount=samplestore&Code=test-aaa&Stock=10&ts=20180115083010
  
  // 2. 附加認證金鑰
  const stringToSign = paramString + authKey;  // 例: ...&ts=20180115083010aaa
  
  // 3. MD5 Hash
  const signature = crypto.createHash('md5').update(stringToSign).digest('hex');
  
  return signature;
}
```

**驗證範例**:
```typescript
import crypto from 'crypto';

function verifyNextEngineSignature(
  queryParams: Record<string, string>,
  authKey: string
): boolean {
  const { '.sig': receivedSig, ...params } = queryParams;
  
  // 重建參數字串 (順序必須一致)
  const paramString = new URLSearchParams(params).toString();
  const stringToSign = paramString + authKey;
  const expectedSig = crypto.createHash('md5').update(stringToSign).digest('hex');
  
  return receivedSig === expectedSig;
}
```

#### 13.5 回應規範

**必須返回 XML 格式** (不是 JSON):

**Content-Type**: `text/xml; charset=EUC-JP`

**編碼**: **EUC-JP** (注意：不是 UTF-8)

**成功回應範例**:
```xml
<?xml version="1.0" encoding="EUC-JP"?>
<ShoppingUpdateStock version="1.0">
  <ResultSet TotalResult="1">
    <Request>
      <Argument Name="StoreAccount" Value="samplestore" />
      <Argument Name="Code" Value="test-aaa" />
      <Argument Name="Stock" Value="10" />
      <Argument Name="ts" Value="201801150830" />
      <Argument Name=".sig" Value="85f6ec658a3d56bbebdf30f28d3a4b61" />
    </Request>
    <Result No="1">
      <Processed>0</Processed>
    </Result>
  </ResultSet>
</ShoppingUpdateStock>
```

**處理結果代碼**:
- `0`: 成功
- `-2`: 客戶端錯誤 (參數錯誤、簽章驗證失敗等)
- `-3`: 系統錯誤 (資料庫錯誤等)

#### 13.6 實作範例 (Node.js + Express)

```typescript
import express from 'express';
import crypto from 'crypto';
import iconv from 'iconv-lite';

const app = express();
const AUTH_KEY = process.env.NE_AUTH_KEY || 'aaa';

// Next Engine 庫存更新端點
app.get('/api/nextengine/stock-update', async (req, res) => {
  try {
    const { StoreAccount, Code, Stock, ts, '.sig': signature } = req.query;
    
    // 1. 驗證簽章
    if (!verifySignature(req.query as Record<string, string>, AUTH_KEY)) {
      return sendXMLResponse(res, -2, req.query);
    }
    
    // 2. 驗證時間戳 (防止重放攻擊)
    if (!isTimestampValid(ts as string)) {
      return sendXMLResponse(res, -2, req.query);
    }
    
    // 3. 更新庫存到本地資料庫
    await updateLocalInventory({
      storeAccount: StoreAccount as string,
      productCode: Code as string,
      quantity: parseInt(Stock as string, 10),
      timestamp: ts as string
    });
    
    // 4. 返回成功回應
    sendXMLResponse(res, 0, req.query);
    
  } catch (error) {
    console.error('Next Engine stock update error:', error);
    sendXMLResponse(res, -3, req.query);
  }
});

function verifySignature(params: Record<string, string>, authKey: string): boolean {
  const { '.sig': receivedSig, ...otherParams } = params;
  
  const paramString = new URLSearchParams(otherParams).toString();
  const stringToSign = paramString + authKey;
  const expectedSig = crypto.createHash('md5').update(stringToSign).digest('hex');
  
  return receivedSig === expectedSig;
}

function isTimestampValid(ts: string): boolean {
  // 時間戳格式: YYYYMMDDhhmmss
  const timestamp = new Date(
    parseInt(ts.substr(0, 4)),   // year
    parseInt(ts.substr(4, 2)) - 1, // month (0-based)
    parseInt(ts.substr(6, 2)),   // day
    parseInt(ts.substr(8, 2)),   // hour
    parseInt(ts.substr(10, 2)),  // minute
    parseInt(ts.substr(12, 2))   // second
  );
  
  const now = new Date();
  const diffMinutes = (now.getTime() - timestamp.getTime()) / 1000 / 60;
  
  // 允許 ±10 分鐘的時間差
  return Math.abs(diffMinutes) < 10;
}

async function updateLocalInventory(data: {
  storeAccount: string;
  productCode: string;
  quantity: number;
  timestamp: string;
}) {
  // 更新到你的資料庫
  await db.inventory.upsert({
    where: { productCode: data.productCode },
    update: {
      quantity: data.quantity,
      lastSyncedAt: new Date(),
      source: 'next-engine',
      storeAccount: data.storeAccount
    },
    create: {
      productCode: data.productCode,
      quantity: data.quantity,
      source: 'next-engine',
      storeAccount: data.storeAccount
    }
  });
}

function sendXMLResponse(
  res: express.Response,
  processedCode: number,
  queryParams: Record<string, any>
) {
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

  // 轉換為 EUC-JP 編碼
  const eucJpBuffer = iconv.encode(xml, 'EUC-JP');
  
  res.setHeader('Content-Type', 'text/xml; charset=EUC-JP');
  res.send(eucJpBuffer);
}

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

#### 13.7 在 Next Engine 後台設定

**設定位置**: 店舗マスタ → 在庫連携用アカウントの登録

**必填欄位**:
1. **在庫更新用URL**: `https://your-domain.com/api/nextengine/stock-update`
2. **ストアアカウント** (選填): 自訂識別碼 (例如 `samplestore`)
3. **認証キー** (選填): 用於簽章驗證 (例如 `aaa`)

#### 13.8 效能要求

**Next Engine 官方建議**:
- 單個請求的回應時間應 **< 1 秒**
- 如果你的端點太慢，會影響 Next Engine 對**所有店鋪**的庫存連攜速度

**建議實作**:
```typescript
// 異步處理模式
app.get('/api/nextengine/stock-update', async (req, res) => {
  // 1. 快速驗證並回應
  if (!verifySignature(req.query, AUTH_KEY)) {
    return sendXMLResponse(res, -2, req.query);
  }
  
  // 2. 立即返回成功 (< 100ms)
  sendXMLResponse(res, 0, req.query);
  
  // 3. 異步處理庫存更新
  setImmediate(async () => {
    try {
      await updateLocalInventory(req.query);
      await syncToShopline(req.query);  // 同步到 Shopline
    } catch (error) {
      console.error('Async inventory update failed:', error);
      // 記錄到錯誤日誌，稍後重試
    }
  });
});
```

#### 13.9 安全性考量

##### 13.9.1 IP 白名單
**建議**: 向 Next Engine Support 索取官方 IP 地址，設定防火牆白名單。

```typescript
const NEXT_ENGINE_IPS = ['xxx.xxx.xxx.xxx', 'yyy.yyy.yyy.yyy'];

app.use('/api/nextengine/*', (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (!NEXT_ENGINE_IPS.includes(clientIP)) {
    return res.status(403).send('Forbidden');
  }
  
  next();
});
```

##### 13.9.2 簽章驗證
**必須**: 驗證 `.sig` 參數，防止偽造請求。

##### 13.9.3 時間戳驗證
**建議**: 驗證 `ts` 參數，防止重放攻擊。

##### 13.9.4 移除 Basic Auth
**重要**: Next Engine 不支援 Basic Auth，必須移除。

#### 13.10 錯誤處理與重試

**Next Engine 重試邏輯**:
- 只有在**超時無回應**時才會重試
- 如果有回應 (不論成功或失敗)，**不會重試**
- 因此，返回 `-2` 或 `-3` 後，該商品會被排除在本次庫存連攜之外

**建議**: 
- 盡量返回 `0` (成功)
- 如果更新失敗，記錄到本地錯誤日誌
- 稍後通過 API 主動拉取並修正

#### 13.11 與 Webhook 的對比

| 特性 | Shopline Webhook | Next Engine 庫存推送 |
|------|------------------|---------------------|
| **方向** | Shopline → Your Server | Next Engine → Your Server |
| **觸發** | 事件發生時 (訂單建立、庫存變動等) | 定時同步 (例如每小時) |
| **HTTP Method** | POST | **GET** |
| **格式** | JSON | **URL Parameters + XML Response** |
| **編碼** | UTF-8 | **EUC-JP** |
| **事件類型** | 多種 (order.created, inventory.updated) | **僅庫存** |
| **驗證** | HMAC-SHA256 | **HMAC-MD5** |
| **重試** | 自動重試失敗的 Webhook | 只重試超時 |

#### 13.12 多平台架構整合

在我們的 Connector 架構中，需要處理兩種模式：

```typescript
interface PlatformWebhookConfig {
  type: 'push' | 'pull';  // Shopline=push, Next Engine=push (但反向)
  
  // Push (傳統 Webhook)
  webhookUrl?: string;
  webhookSecret?: string;
  eventTypes?: string[];
  
  // Pull (Next Engine 式)
  inventoryPushUrl?: string;
  authKey?: string;
  storeAccount?: string;
}

// Shopline Webhook Handler
app.post('/webhook/shopline/inventory', (req, res) => {
  // 驗證 HMAC-SHA256
  // 處理 JSON body
  // 返回 200 OK
});

// Next Engine Inventory Push Handler
app.get('/webhook/nextengine/inventory', (req, res) => {
  // 驗證 HMAC-MD5
  // 處理 URL params
  // 返回 EUC-JP XML
});
```

#### 13.13 測試計劃

**Priority 1** (Next Engine OAuth 後):
1. ✅ 在 Next Engine 後台設定測試 URL
2. ✅ 實作接收端點 (簽章驗證、XML 回應)
3. ✅ 測試單筆庫存推送
4. ✅ 驗證本地資料庫更新
5. ✅ 測試效能 (< 1 秒回應)

**Priority 2** (庫存推送穩定後):
1. 實作異步處理
2. 實作同步到 Shopline
3. 實作錯誤日誌與重試機制
4. 測試大量商品推送

---

### 14. 開發建議

#### 14.1 Token 管理策略

```typescript
class NextEngineTokenManager {
  private accessToken: string;
  private refreshToken: string;
  
  async callAPI(endpoint: string, params: any) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        access_token: this.accessToken,
        refresh_token: this.refreshToken,
        ...params
      })
    });
    
    const data = await response.json();
    
    // ⭐ 檢查並更新 token
    if (data.access_token) {
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      await this.saveTokens();  // 持久化
    }
    
    return data;
  }
  
  async saveTokens() {
    // 保存到資料庫
    await database.updateTokens(this.accessToken, this.refreshToken);
  }
}
```

#### 13.2 批次操作建議

**文件建議**: 避免多執行緒對同一用戶操作 (token 管理困難)。

**替代方案**:
- 使用任務佇列 (Job Queue)
- 一個用戶一個執行緒
- 集中管理 token

#### 13.3 錯誤重試策略

```typescript
async function retryableAPICall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === '002004') {
        // Token 完全過期，需要重新授權
        throw new Error('Reauthorization required');
      }
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);  // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

### 14. 限制與注意事項

#### 14.1 API 限制
- ⚠️ **只支援 POST**: 所有 API 都是 POST
- ⚠️ **form-urlencoded**: 不支援 JSON body
- ⚠️ **沒有 Customers API**: 客戶資訊內嵌在訂單中
- ⚠️ **Token 自動更新**: 必須每次檢查並保存

#### 14.2 Token 生命週期短
- state: 5 分鐘
- access_token: 1 天
- refresh_token: 3 天

**建議**: 實作定期 API 呼叫 (例如每 2 天呼叫一次 count API) 以保持 token 活躍。

#### 14.3 已知問題
- 文件部分內容為日文，理解需要時間
- Rate limiting 規則不明確
- 錯誤訊息有時不夠詳細

---

### 15. 後續研究需求

#### 15.1 待確認
- [ ] Rate Limiting 的具體規則
- [ ] 批次操作的最大筆數限制
- [ ] Webhook 支援 (推測無)
- [ ] 資料一致性保證 (事務支援)

#### 15.2 待測試
- [ ] 實際呼叫 API (需要測試帳號)
- [ ] Token 自動更新機制的實際行為
- [ ] 大量資料查詢的效能
- [ ] 錯誤處理的完整情境

#### 15.3 待比較
- [ ] Next Engine vs Shopline 資料同步策略
- [ ] 多平台訂單合併邏輯
- [ ] 庫存同步機制

---

## 🔑 關鍵結論

### 1. **Next Engine 是完整的進銷存系統**
不只是電商 API，而是完整的後台管理系統，包含進貨、採購、批發等功能。

### 2. **Token 自動更新是核心特性**
與 Shopline 最大的差異：每次 API 呼叫都可能返回新 token，必須每次檢查並保存。

### 3. **客戶資訊內嵌在訂單中**
沒有獨立的 Customers API，需要從訂單中提取並建立本地客戶模型。

### 4. **只支援 POST + form-urlencoded**
所有 API 都是 POST，使用 form-urlencoded 格式，不支援 JSON body。

### 5. **建議的通用抽象層**

```typescript
interface PlatformAdapter {
  // 統一的業務方法
  getOrders(filters: OrderFilters): Promise<Order[]>;
  getProducts(filters: ProductFilters): Promise<Product[]>;
  updateOrder(id: string, data: OrderUpdate): Promise<Order>;
  
  // 內部實作細節
  protected buildRequest(spec: RequestSpec): PlatformRequest;
  protected parseResponse(response: PlatformResponse): UnifiedResponse;
  protected handleTokenRefresh(response: any): void;
}

// Shopline 實作
class ShoplinePlatformAdapter implements PlatformAdapter {
  async getOrders(filters) {
    // Shopline REST API logic
  }
}

// Next Engine 實作
class NextEnginePlatformAdapter implements PlatformAdapter {
  async getOrders(filters) {
    // Next Engine API logic
    // ⭐ 處理自動 token 更新
  }
  
  protected handleTokenRefresh(response: any) {
    if (response.access_token) {
      this.saveTokens(response.access_token, response.refresh_token);
    }
  }
}
```

### 6. **下一步**
1. 完成三方 API 對比表
2. 基於三方 API 設計通用抽象層
3. 確保抽象層支援：
   - Shopline REST API
   - Shopline GraphQL API
   - Next Engine API
   - **特別處理 Next Engine 的 token 自動更新**

---

## 📚 參考資源

- [Next Engine API 文件](https://developer.next-engine.com/api)
- [認證流程](https://developer.next-engine.com/api/auth)
- [受注伝票檢索](https://developer.next-engine.com/api/api_v1_receiveorder_base/search)
- [商品マスタ檢索](https://developer.next-engine.com/api/api_v1_master_goods/search)

---

**研究完成時間**: 2025-10-22  
**研究人員**: AI Assistant  
**狀態**: ✅ Phase 0 - Part 2 完成，待建立三方 API 對比表

