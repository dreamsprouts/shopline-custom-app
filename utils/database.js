const sqlite3 = require('sqlite3').verbose()
const path = require('path')

class Database {
  constructor() {
    this.db = null
    this.dbPath = path.join(__dirname, '..', 'data', 'shopline_oauth.db')
  }

  // 初始化資料庫
  async init() {
    return new Promise((resolve, reject) => {
      // 確保 data 目錄存在
      const fs = require('fs')
      const dataDir = path.dirname(this.dbPath)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('資料庫連線失敗:', err.message)
          reject(err)
        } else {
          console.log('✅ 資料庫連線成功:', this.dbPath)
          this.createTables().then(resolve).catch(reject)
        }
      })
    })
  }

  // 建立資料表
  async createTables() {
    return new Promise((resolve, reject) => {
      const createTokensTable = `
        CREATE TABLE IF NOT EXISTS oauth_tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shop_handle TEXT NOT NULL,
          access_token TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          expire_time TEXT NOT NULL,
          refresh_expire_time TEXT NOT NULL,
          scope TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(shop_handle)
        )
      `

      this.db.run(createTokensTable, (err) => {
        if (err) {
          console.error('建立資料表失敗:', err.message)
          reject(err)
        } else {
          console.log('✅ 資料表建立成功')
          resolve()
        }
      })
    })
  }

  // 儲存或更新 Token
  async saveToken(shopHandle, tokenData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO oauth_tokens 
        (shop_handle, access_token, refresh_token, expire_time, refresh_expire_time, scope, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `

      this.db.run(sql, [
        shopHandle,
        tokenData.accessToken,
        tokenData.refreshToken,
        tokenData.expireTime,
        tokenData.refreshExpireTime,
        tokenData.scope
      ], function(err) {
        if (err) {
          console.error('儲存 Token 失敗:', err.message)
          reject(err)
        } else {
          console.log(`✅ Token 已儲存/更新: ${shopHandle}`)
          resolve({ id: this.lastID, changes: this.changes })
        }
      })
    })
  }

  // 取得 Token
  async getToken(shopHandle) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM oauth_tokens WHERE shop_handle = ?'
      
      this.db.get(sql, [shopHandle], (err, row) => {
        if (err) {
          console.error('取得 Token 失敗:', err.message)
          reject(err)
        } else if (row) {
          // 轉換資料格式以符合前端期望
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
          resolve(tokenData)
        } else {
          console.log(`ℹ️ 未找到 Token: ${shopHandle}`)
          resolve(null)
        }
      })
    })
  }

  // 刪除 Token
  async deleteToken(shopHandle) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM oauth_tokens WHERE shop_handle = ?'
      
      this.db.run(sql, [shopHandle], function(err) {
        if (err) {
          console.error('刪除 Token 失敗:', err.message)
          reject(err)
        } else {
          console.log(`✅ Token 已刪除: ${shopHandle} (影響 ${this.changes} 筆記錄)`)
          resolve({ changes: this.changes })
        }
      })
    })
  }

  // 取得所有 Token
  async getAllTokens() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM oauth_tokens ORDER BY updated_at DESC'
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('取得所有 Token 失敗:', err.message)
          reject(err)
        } else {
          const tokens = rows.map(row => ({
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
          resolve(tokens)
        }
      })
    })
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

  // 關閉資料庫連線
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('關閉資料庫失敗:', err.message)
        } else {
          console.log('✅ 資料庫連線已關閉')
        }
      })
    }
  }
}

// 建立單例實例
const database = new Database()

module.exports = database
