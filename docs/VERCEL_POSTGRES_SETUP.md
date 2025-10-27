# Vercel Postgres 設定指南

## 🎯 概述

本專案使用 Vercel Postgres 作為主要資料庫，支援開發和生產環境。

## 🔧 環境設定

### 1. Vercel 專案設定

#### 1.1 建立 Vercel Postgres 資料庫
```bash
# 在 Vercel Dashboard 中：
# 1. 進入專案設定
# 2. 選擇 "Storage" 標籤
# 3. 點擊 "Create Database"
# 4. 選擇 "Postgres"
# 5. 設定資料庫名稱
```

#### 1.2 取得連接字串
```bash
# 在 Vercel Dashboard 中：
# 1. 進入 "Storage" → "Postgres"
# 2. 點擊 "Settings"
# 3. 複製 "Connection String"
# 格式：postgres://username:password@host:port/database
```

### 2. 環境變數設定

#### 2.1 本地開發環境
```bash
# .env.local (不要提交到 Git)
POSTGRES_URL=postgres://username:password@host:port/database
DATABASE_URL=postgres://username:password@host:port/database
```

#### 2.2 Vercel 生產環境
```bash
# 在 Vercel Dashboard 中設定：
# 1. 進入專案設定
# 2. 選擇 "Environment Variables"
# 3. 新增變數：
#    - POSTGRES_URL: postgres://username:password@host:port/database
#    - DATABASE_URL: postgres://username:password@host:port/database
```

## 🗄️ 資料庫架構

### 現有資料表

#### 1. OAuth Tokens 表
```sql
CREATE TABLE oauth_tokens (
  id SERIAL PRIMARY KEY,
  shop_handle VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expire_time TIMESTAMP NOT NULL,
  refresh_expire_time TIMESTAMP NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Events 表
```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(255) NOT NULL,
  event_version VARCHAR(50) NOT NULL,
  source_platform VARCHAR(100) NOT NULL,
  source_platform_id VARCHAR(255),
  source_connector VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  metadata JSONB,
  correlation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_events_type ON events (event_type);
CREATE INDEX idx_events_created_at ON events (created_at DESC);
CREATE INDEX idx_events_source ON events (source_platform, source_connector);
CREATE INDEX idx_events_correlation_trace ON events USING GIN ((correlation->>'traceId'));
CREATE INDEX idx_events_payload_gin ON events USING GIN (payload);
```

## 🚀 新增 Model 標準流程

### 步驟 1: 定義 Model 結構
```javascript
// models/YourModel.js
class YourModel {
  constructor(database) {
    this.db = database;
  }

  async create(data) {
    const query = `
      INSERT INTO your_table (field1, field2, field3)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [data.field1, data.field2, data.field3];
    const result = await this.db.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id) {
    const query = `SELECT * FROM your_table WHERE id = $1`;
    const result = await this.db.pool.query(query, [id]);
    return result.rows[0];
  }

  async findAll(limit = 50, offset = 0) {
    const query = `SELECT * FROM your_table ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    const result = await this.db.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async update(id, data) {
    const query = `
      UPDATE your_table 
      SET field1 = $1, field2 = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    const values = [data.field1, data.field2, id];
    const result = await this.db.pool.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    const query = `DELETE FROM your_table WHERE id = $1 RETURNING *`;
    const result = await this.db.pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = YourModel;
```

### 步驟 2: 在資料庫類別中新增資料表
```javascript
// utils/database-postgres.js
async createTables() {
  // ... 現有資料表 ...

  const createYourTable = `
    CREATE TABLE IF NOT EXISTS your_table (
      id SERIAL PRIMARY KEY,
      field1 VARCHAR(255) NOT NULL,
      field2 TEXT,
      field3 JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createYourTableIndexes = `
    CREATE INDEX IF NOT EXISTS idx_your_table_field1 ON your_table (field1);
    CREATE INDEX IF NOT EXISTS idx_your_table_created_at ON your_table (created_at DESC);
  `;

  try {
    await this.pool.query(createYourTable);
    await this.pool.query(createYourTableIndexes);
    console.log('✅ your_table 資料表和索引建立成功');
  } catch (error) {
    console.error('❌ 建立 your_table 失敗:', error.message);
    throw error;
  }
}
```

### 步驟 3: 在資料庫類別中新增 Model 方法
```javascript
// utils/database-postgres.js
async init() {
  // ... 現有初始化邏輯 ...
  
  // 初始化 Models
  this.yourModel = new YourModel(this);
}

// 新增 Model 方法
async createYourModel(data) {
  return await this.yourModel.create(data);
}

async getYourModelById(id) {
  return await this.yourModel.findById(id);
}

async getAllYourModels(limit, offset) {
  return await this.yourModel.findAll(limit, offset);
}

async updateYourModel(id, data) {
  return await this.yourModel.update(id, data);
}

async deleteYourModel(id) {
  return await this.yourModel.delete(id);
}
```

### 步驟 4: 建立 API 端點
```javascript
// api/your-model/index.js
const database = require('../../utils/database-postgres');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        const { id } = req.query;
        if (id) {
          const item = await database.getYourModelById(id);
          res.json({ success: true, data: item });
        } else {
          const items = await database.getAllYourModels();
          res.json({ success: true, data: items });
        }
        break;

      case 'POST':
        const newItem = await database.createYourModel(req.body);
        res.json({ success: true, data: newItem });
        break;

      case 'PUT':
        const { id: updateId } = req.query;
        const updatedItem = await database.updateYourModel(updateId, req.body);
        res.json({ success: true, data: updatedItem });
        break;

      case 'DELETE':
        const { id: deleteId } = req.query;
        const deletedItem = await database.deleteYourModel(deleteId);
        res.json({ success: true, data: deletedItem });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('YourModel API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
};
```

### 步驟 5: 在 server.js 中註冊路由
```javascript
// server.js
app.get('/api/your-model', require('./api/your-model'));
app.post('/api/your-model', require('./api/your-model'));
app.put('/api/your-model', require('./api/your-model'));
app.delete('/api/your-model', require('./api/your-model'));
```

## 🔍 資料庫連線測試

### 本地測試
```bash
# 設定環境變數
export POSTGRES_URL="postgres://username:password@host:port/database"

# 測試連線
node -e "
const database = require('./utils/database-postgres');
database.init().then(() => {
  console.log('✅ 資料庫連線成功');
  process.exit(0);
}).catch(err => {
  console.error('❌ 資料庫連線失敗:', err.message);
  process.exit(1);
});
"
```

### 生產環境測試
```bash
# 在 Vercel 中測試
vercel env pull .env.local
node -e "
const database = require('./utils/database-postgres');
database.init().then(() => {
  console.log('✅ 生產環境資料庫連線成功');
  process.exit(0);
}).catch(err => {
  console.error('❌ 生產環境資料庫連線失敗:', err.message);
  process.exit(1);
});
"
```

## 📋 檢查清單

### 新增 Model 前
- [ ] 確認 Vercel Postgres 已設定
- [ ] 確認環境變數已配置
- [ ] 確認資料庫連線正常

### 新增 Model 後
- [ ] 資料表已建立
- [ ] 索引已建立
- [ ] Model 類別已實作
- [ ] 資料庫方法已新增
- [ ] API 端點已建立
- [ ] 路由已註冊
- [ ] 測試已通過

## 🚨 常見問題

### 1. 連線失敗
```bash
# 檢查環境變數
echo $POSTGRES_URL

# 檢查 Vercel 設定
vercel env ls
```

### 2. 資料表不存在
```bash
# 重新初始化資料庫
node -e "
const database = require('./utils/database-postgres');
database.init().then(() => {
  console.log('✅ 資料庫初始化完成');
  process.exit(0);
});
"
```

### 3. 權限問題
- 檢查 Vercel Postgres 用戶權限
- 確認連接字串正確
- 檢查網路連線

## 📚 相關文件

- [Vercel Postgres 官方文件](https://vercel.com/docs/storage/vercel-postgres)
- [PostgreSQL 官方文件](https://www.postgresql.org/docs/)
- [Node.js pg 模組文件](https://node-postgres.com/)
