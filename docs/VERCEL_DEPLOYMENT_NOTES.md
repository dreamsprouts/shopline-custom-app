# Vercel 部署研究筆記（草稿）

目標：以 GitHub → Vercel 自動部署；正式網址用 Vercel，本機/ngrok 僅作測試。

- 現況：Express + SQLite（狀態型）；Vercel 無狀態，需要以 `/api/*` Functions 重構。
- 靜態：`public/` 直接託管；首頁以 rewrites 指到 `views/index.html` 或搬到 `public/`。
- 資料庫：Serverless 不持久；短期 `DB_PATH=/tmp/shopline_oauth.db`（已支援），正式改雲端 DB（Vercel Postgres/Supabase）。

## Phase 1（最小落地）
- 新增 `vercel.json`：
```
{
  "rewrites": [
    { "source": "/", "destination": "/views/index.html" }
  ]
}
```
- 新增 `api` handlers：
  - `api/health.js`
  - `api/oauth/install.js`, `api/oauth/callback.js`, `api/oauth/refresh.js`, `api/oauth/revoke.js`
  - `api/test/shop.js`, `api/test/products.js`, `api/test/products-create.js`
- 環境變數（Vercel）：`APP_KEY`, `APP_SECRET`, `SHOP_HANDLE`, `NODE_ENV=production`, `DB_PATH=/tmp/shopline_oauth.db`
- Redirect URI：`https://<vercel-app>.vercel.app/oauth/callback`
- Scopes：`read_store_information,read_products,write_products`

## Phase 2（正式化）
- 將 `utils/database.js` 切換雲端資料庫，完成 E2E（授權→刷新→建商品→檢視商品）。
- 更新 `DEPLOYMENT.md`：加入 Vercel 安裝、環境變數、回滾策略。

## 驗證清單（Vercel）
- [ ] `/` 載入前端
- [ ] `/oauth/install` 導向授權
- [ ] `/oauth/callback` 寫入 DB（先 `/tmp`）
- [ ] `/oauth/refresh` 成功
- [ ] `/api/test/shop` 200
- [ ] `/api/test/products` GET/POST 成功

## 已完成的前置
- `utils/database.js` 支援 `DB_PATH`（可設 `/tmp/shopline_oauth.db`）。
