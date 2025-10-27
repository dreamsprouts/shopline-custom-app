const { Pool } = require('pg')

class Database {
  constructor() {
    this.pool = null
    this.isInitialized = false
  }

  // 初始化資料庫連接
  async init() {
    if (this.isInitialized) {
      return Promise.resolve()
    }

    try {
      // Vercel Postgres 連接配置
      const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL
      
      if (!connectionString) {
        console.warn('⚠️  POSTGRES_URL or DATABASE_URL not found, using mock database for development')
        this.isInitialized = true
        return Promise.resolve()
      }

      this.pool = new Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })

      // 測試連接
      const client = await this.pool.connect()
      await client.query('SELECT 1')
      client.release()

      console.log('✅ PostgreSQL 資料庫連線成功')
      
      // 建立資料表
      await this.createTables()
      this.isInitialized = true
      
    } catch (error) {
      console.error('❌ PostgreSQL 連線失敗:', error.message)
      throw error
    }
  }

  // 建立資料表
  async createTables() {
    const createTokensTable = `
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id SERIAL PRIMARY KEY,
        shop_handle VARCHAR(255) NOT NULL UNIQUE,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expire_time TIMESTAMP NOT NULL,
        refresh_expire_time TIMESTAMP NOT NULL,
        scope TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    const createEventsTable = `
      CREATE TABLE IF NOT EXISTS events (
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
      )
    `

    const createEventsIndexes = `
      CREATE INDEX IF NOT EXISTS idx_events_type ON events (event_type);
      CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_events_source ON events (source_platform, source_connector);
    `

    try {
      await this.pool.query(createTokensTable)
      await this.pool.query(createEventsTable)
      await this.pool.query(createEventsIndexes)
      console.log('✅ PostgreSQL 資料表和索引建立成功')
    } catch (error) {
      console.error('❌ 建立資料表失敗:', error.message)
      throw error
    }
  }

  // 儲存或更新 Token
  async saveToken(shopHandle, tokenData) {
    if (!this.pool) {
      console.log(`📊 [Mock DB] Token 已記錄: ${shopHandle}`)
      return { id: 1, changes: 1 }
    }

    try {
      const sql = `
        INSERT INTO oauth_tokens 
        (shop_handle, access_token, refresh_token, expire_time, refresh_expire_time, scope, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (shop_handle) 
        DO UPDATE SET 
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expire_time = EXCLUDED.expire_time,
          refresh_expire_time = EXCLUDED.refresh_expire_time,
          scope = EXCLUDED.scope,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `

      const result = await this.pool.query(sql, [
        shopHandle,
        tokenData.accessToken,
        tokenData.refreshToken,
        tokenData.expireTime,
        tokenData.refreshExpireTime,
        tokenData.scope
      ])

      console.log(`✅ Token 已儲存/更新: ${shopHandle}`)
      return { id: result.rows[0].id, changes: 1 }
    } catch (error) {
      console.error('❌ 儲存 Token 失敗:', error.message)
      throw error
    }
  }

  // 取得 Token
  async getToken(shopHandle) {
    if (!this.pool) {
      console.log(`📊 [Mock DB] 取得 Token: ${shopHandle} (Mock)`)
      return null
    }

    try {
      const sql = 'SELECT * FROM oauth_tokens WHERE shop_handle = $1'
      const result = await this.pool.query(sql, [shopHandle])
      
      if (result.rows.length === 0) {
        console.log(`ℹ️ 未找到 Token: ${shopHandle}`)
        return null
      }

      const row = result.rows[0]
      const tokenData = {
        accessToken: row.access_token,
        refreshToken: row.refresh_token,
        expireTime: row.expire_time,
        refreshExpireTime: row.refresh_expire_time,
        scope: row.scope,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        handle: row.shop_handle
      }

      console.log(`✅ Token 已取得: ${shopHandle}`)
      return tokenData
    } catch (error) {
      console.error('❌ 取得 Token 失敗:', error.message)
      throw error
    }
  }

  // 刪除 Token
  async deleteToken(shopHandle) {
    try {
      const sql = 'DELETE FROM oauth_tokens WHERE shop_handle = $1'
      const result = await this.pool.query(sql, [shopHandle])
      
      console.log(`✅ Token 已刪除: ${shopHandle} (影響 ${result.rowCount} 筆記錄)`)
      return { changes: result.rowCount }
    } catch (error) {
      console.error('❌ 刪除 Token 失敗:', error.message)
      throw error
    }
  }

  // 取得所有 Token
  async getAllTokens() {
    try {
      const sql = 'SELECT * FROM oauth_tokens ORDER BY updated_at DESC'
      const result = await this.pool.query(sql)
      
      const tokens = result.rows.map(row => ({
        accessToken: row.access_token,
        refreshToken: row.refresh_token,
        expireTime: row.expire_time,
        refreshExpireTime: row.refresh_expire_time,
        scope: row.scope,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        handle: row.shop_handle
      }))

      console.log(`✅ 取得 ${tokens.length} 個 Token`)
      return tokens
    } catch (error) {
      console.error('❌ 取得所有 Token 失敗:', error.message)
      throw error
    }
  }

  // 檢查 Token 是否過期
  isTokenExpired(tokenData) {
    if (!tokenData || !tokenData.expireTime) {
      return true
    }
    
    const now = new Date()
    const expireTime = new Date(tokenData.expireTime)
    return now > expireTime
  }

  // 儲存事件到資料庫
  async saveEvent(event) {
    if (!this.pool) {
      console.log('📊 [Mock DB] 事件已記錄:', event.type, event.id)
      return
    }

    const query = `
      INSERT INTO events (
        event_id, event_type, event_version, source_platform, 
        source_platform_id, source_connector, payload, metadata, correlation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (event_id) DO NOTHING
    `

    const values = [
      event.id,
      event.type,
      event.version,
      event.source.platform,
      event.source.platformId,
      event.source.connector,
      JSON.stringify(event.payload),
      event.metadata ? JSON.stringify(event.metadata) : null,
      event.correlation ? JSON.stringify(event.correlation) : null
    ]

    try {
      await this.pool.query(query, values)
    } catch (error) {
      console.error('❌ 儲存事件失敗:', error.message)
      throw error
    }
  }

  // 取得事件列表
  async getEvents(limit = 50, offset = 0) {
    if (!this.pool) {
      console.log('📊 [Mock DB] 取得事件列表 (Mock)')
      return []
    }

    const query = `
      SELECT event_id, event_type, event_version, source_platform, 
             source_platform_id, source_connector, payload, metadata, 
             correlation, created_at
      FROM events 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `

    try {
      const result = await this.pool.query(query, [limit, offset])
      return result.rows.map(row => ({
        id: row.event_id,
        type: row.event_type,
        version: row.event_version,
        source: {
          platform: row.source_platform,
          platformId: row.source_platform_id,
          connector: row.source_connector
        },
        payload: row.payload,
        metadata: row.metadata,
        correlation: row.correlation,
        timestamp: row.created_at.toISOString()
      }))
    } catch (error) {
      console.error('❌ 取得事件失敗:', error.message)
      throw error
    }
  }

  // 取得事件統計
  async getEventStats() {
    if (!this.pool) {
      console.log('📊 [Mock DB] 取得事件統計 (Mock)')
      return { total: 0, product_events: 0, order_events: 0, last_event_time: null }
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN event_type LIKE 'product.%' THEN 1 END) as product_events,
        COUNT(CASE WHEN event_type LIKE 'order.%' THEN 1 END) as order_events,
        MAX(created_at) as last_event_time
      FROM events
    `

    try {
      const result = await this.pool.query(query)
      return result.rows[0]
    } catch (error) {
      console.error('❌ 取得事件統計失敗:', error.message)
      throw error
    }
  }

  // 關閉資料庫連接
  async close() {
    if (this.pool) {
      await this.pool.end()
      console.log('✅ PostgreSQL 連接已關閉')
    }
  }
}

// 建立單例實例
const database = new Database()

module.exports = database
