# Sprint 2 - Orders API 測試指南

## 📋 測試前準備

### 1. 更新 SHOPLINE Developer Center Scopes ⚠️ **必須**
前往 SHOPLINE Partner Portal，更新應用程式的 API 權限：

**新增以下 Scopes**：
- `read_orders` - 讀取訂單資訊
- `write_orders` - 建立和修改訂單

**完整 Scopes 列表**：
```
read_store_information,read_products,write_products,read_orders,write_orders
```

### 2. 重新授權
更新 Scopes 後，必須重新授權：
1. 點擊「撤銷授權」按鈕
2. 點擊「開始授權」按鈕
3. 確認新的權限請求
4. 完成授權流程

### 3. 確認環境
- ✅ 本地伺服器已啟動 (http://localhost:3000)
- ✅ 已完成授權
- ✅ Token 有效
- ✅ 商店中至少有一個商品（建立訂單的先決條件）

---

## 🧪 測試流程（依照 Sprint 2 規格）

### **測試步驟 1：建立訂單**

#### 操作
1. 點擊「建立訂單」按鈕

#### 預期結果
- ✅ 後端自動 GET Products API 取得有效的 variant_id
- ✅ 使用預設測試訂單資料建立訂單
- ✅ 顯示建立成功訊息
- ✅ 顯示訂單 ID 和訂單編號
- ✅ 前端自動儲存 `lastOrderId`

#### API 資訊
```
POST /api/test/orders
官方文件: https://developer.shopline.com/docs/admin-rest-api/order/order-management/create-an-order?version=v20260301
```

#### 範例回應
```json
{
  "success": true,
  "message": "建立訂單成功",
  "orderId": "...",
  "orderNumber": "...",
  "data": { ... }
}
```

---

### **測試步驟 2：查詢訂單列表**

#### 操作
1. 點擊「查詢訂單列表」按鈕

#### 預期結果
- ✅ 顯示訂單列表（最多 10 筆）
- ✅ 顯示訂單總數
- ✅ 確認剛建立的訂單在列表中
- ✅ 前端自動儲存第一個訂單的 ID（如果尚未儲存）

#### API 資訊
```
GET /api/test/orders?page=1&limit=10
官方文件: https://developer.shopline.com/docs/admin-rest-api/order/order-management/get-orders?version=v20260301
```

#### 範例回應
```json
{
  "success": true,
  "message": "查詢訂單列表成功",
  "ordersCount": 10,
  "total": 50,
  "orders": [ ... ]
}
```

---

### **測試步驟 3：查詢訂單詳情**

#### 操作
1. 點擊「查詢訂單詳情」按鈕

#### 預期結果
- ✅ 使用 `lastOrderId` 查詢訂單詳情
- ✅ 顯示完整的訂單資訊
- ✅ 包含商品明細、價格資訊等

#### 注意事項
⚠️ 如果沒有 `lastOrderId`，會提示「請先建立訂單或查詢訂單列表」

#### API 資訊
```
GET /api/test/orders/{orderId}
官方文件: https://developer.shopline.com/docs/admin-rest-api/order/order-management/get-orders?version=v20260301
```

---

### **測試步驟 4：更新訂單**

#### 操作
1. 點擊「更新訂單」按鈕

#### 預期結果
- ✅ 使用 `lastOrderId` 更新訂單
- ✅ 更新 `tags` 為 `Updated_{timestamp}`
- ✅ 更新 `note_attributes` 為當前時間
- ✅ 顯示更新成功訊息
- ✅ 顯示更新的 payload

#### 注意事項
⚠️ 如果沒有 `lastOrderId`，會提示「請先建立訂單或查詢訂單列表」

#### API 資訊
```
PUT /api/test/orders/{orderId}
官方文件: https://developer.shopline.com/docs/admin-rest-api/order/order-management/update-an-order?version=v20260301
```

#### 更新 Payload
```json
{
  "order": {
    "tags": "Updated_1729512345678",
    "note_attributes": [
      {
        "name": "API_REMARK",
        "value": "Updated at 2025-10-21T12:00:00.000Z"
      }
    ]
  }
}
```

---

### **測試步驟 5：再次查詢訂單詳情（驗證更新）**

#### 操作
1. 再次點擊「查詢訂單詳情」按鈕

#### 預期結果
- ✅ 確認 `tags` 已更新
- ✅ 確認 `note_attributes` 已更新
- ✅ 其他欄位保持不變

---

## ✅ 測試檢查清單

### 基本功能
- [ ] 建立訂單成功
- [ ] 查詢訂單列表成功
- [ ] 查詢訂單詳情成功
- [ ] 更新訂單成功
- [ ] 再次查詢訂單詳情，確認更新成功

### 錯誤處理
- [ ] 沒有商品時，建立訂單顯示錯誤
- [ ] 沒有 lastOrderId 時，查詢/更新詳情顯示提示
- [ ] API 錯誤時，顯示完整錯誤訊息

### UI/UX
- [ ] 所有按鈕在未授權時禁用
- [ ] 所有按鈕在授權後啟用
- [ ] Loading 狀態正確顯示
- [ ] API 回應格式正確（JSON 格式化）

### 資料一致性
- [ ] lastOrderId 正確儲存
- [ ] 前端顯示的資料與 API 回應一致
- [ ] 訂單 ID 和訂單編號正確

---

## 🐛 常見問題

### 1. 403: ACCESS_TOKEN is no permission!
**原因**：未更新 SHOPLINE Developer Center 的 Scopes  
**解決**：
1. 前往 Developer Center 更新 Scopes
2. 撤銷授權並重新授權

### 2. 無法獲取商品列表
**原因**：商店中沒有商品  
**解決**：
1. 先點擊「建立商品 API」建立測試商品
2. 或手動在 SHOPLINE 後台新增商品

### 3. 商品沒有有效的 variant_id
**原因**：商品資料不完整  
**解決**：
1. 確認商品有 variants
2. 使用「檢視商品 API」查看商品結構

### 4. 查詢訂單詳情時提示「請先建立訂單或查詢訂單列表」
**原因**：前端沒有儲存 lastOrderId  
**解決**：
1. 先執行「建立訂單」或「查詢訂單列表」
2. 系統會自動儲存訂單 ID

---

## 📊 測試結果記錄

### 測試環境
- **日期**：2025-10-21
- **環境**：Local Development (http://localhost:3000)
- **商店**：paykepoc.myshopline.com
- **API 版本**：v20260301

### 測試記錄
請在測試時記錄：
1. 每個步驟的執行結果（成功/失敗）
2. 失敗時的錯誤訊息
3. API 回應時間
4. 任何異常或問題

---

## 📝 下一步

完成本地測試後：
1. ✅ 確認所有功能正常
2. ✅ 記錄測試結果
3. ✅ 建立 Vercel Serverless Functions (api/test/orders.js)
4. ✅ 部署到 Vercel
5. ✅ 在 Vercel 環境測試完整流程
6. ✅ 更新文件

---

**版本**: 1.0.0  
**最後更新**: 2025-10-21  
**維護者**: Development Team

