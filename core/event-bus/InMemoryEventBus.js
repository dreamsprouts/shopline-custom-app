const EventEmitter = require('events')
const { validateEvent } = require('../events/StandardEvent')
const { matchEventType } = require('../events/EventTypes')

/**
 * In-Memory Event Bus
 * 初期使用，未來可替換為 Redis/RabbitMQ/Kafka
 * 
 * @description 基於 Node.js EventEmitter 的簡單 Event Bus 實作
 */
class InMemoryEventBus {
  constructor(options = {}) {
    this.emitter = new EventEmitter()
    this.emitter.setMaxListeners(100) // 避免警告
    
    this.subscriptions = new Map()
    this.eventStore = options.eventStore || null
    this.enabled = options.enabled !== false // 預設啟用
    
    // 統計資訊
    this.stats = {
      published: 0,
      delivered: 0,
      errors: 0
    }
  }
  
  /**
   * 發佈事件
   * @param {StandardEvent} event - 標準事件
   */
  async publish(event) {
    if (!this.enabled) {
      console.log('[EventBus] Disabled, skipping event:', event.type)
      return
    }
    
    try {
      // 1. 驗證事件格式
      validateEvent(event)
      
      // 2. 記錄到 Event Store (可選)
      if (this.eventStore) {
        await this.eventStore.append(event)
      }
      
      // 3. 發佈到所有訂閱者
      // 發佈精確匹配
      this.emitter.emit(event.type, event)
      // 發佈 wildcard
      this.emitter.emit('*', event)
      
      // 4. 更新統計
      this.stats.published++
      
      // 5. 記錄日誌
      console.log(`[EventBus] Published: ${event.type} (id: ${event.id})`)
      
    } catch (error) {
      console.error('[EventBus] Failed to publish event:', error.message)
      this.stats.errors++
      throw error
    }
  }
  
  /**
   * 批次發佈
   * @param {Array<StandardEvent>} events - 事件陣列
   */
  async publishBatch(events) {
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array')
    }
    
    for (const event of events) {
      await this.publish(event)
    }
  }
  
  /**
   * 訂閱事件
   * @param {string} pattern - 事件類型 pattern (支援 wildcard)
   * @param {Function} handler - 事件處理器
   * @returns {string} subscriptionId - 訂閱 ID
   */
  subscribe(pattern, handler) {
    if (!pattern || typeof pattern !== 'string') {
      throw new Error('Pattern must be a non-empty string')
    }
    
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function')
    }
    
    const subscriptionId = this._generateSubscriptionId()
    
    // 包裝處理器，加入錯誤處理
    const wrappedHandler = async (event) => {
      try {
        await handler(event)
        this.stats.delivered++
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event.type}:`, error)
        this.stats.errors++
        await this._handleError(event, error)
      }
    }
    
    // 支援 wildcard pattern
    if (pattern.includes('*')) {
      // 對所有事件檢查是否匹配 pattern
      this.emitter.on('*', (event) => {
        if (matchEventType(event.type, pattern)) {
          wrappedHandler(event)
        }
      })
    } else {
      // 精確匹配
      this.emitter.on(pattern, wrappedHandler)
    }
    
    // 記錄訂閱
    this.subscriptions.set(subscriptionId, {
      pattern,
      handler: wrappedHandler,
      createdAt: new Date()
    })
    
    console.log(`[EventBus] Subscribed: ${pattern} (id: ${subscriptionId})`)
    return subscriptionId
  }
  
  /**
   * 取消訂閱
   * @param {string} subscriptionId - 訂閱 ID
   */
  unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId)
    
    if (!subscription) {
      console.warn(`[EventBus] Subscription not found: ${subscriptionId}`)
      return
    }
    
    // 移除監聽器
    if (subscription.pattern.includes('*')) {
      this.emitter.off('*', subscription.handler)
    } else {
      this.emitter.off(subscription.pattern, subscription.handler)
    }
    
    // 移除訂閱記錄
    this.subscriptions.delete(subscriptionId)
    
    console.log(`[EventBus] Unsubscribed: ${subscriptionId}`)
  }
  
  /**
   * 重播事件 (從 Event Store)
   * @param {Object} filter - 事件過濾條件
   * @param {Function} handler - 事件處理器
   */
  async replay(filter, handler) {
    if (!this.eventStore) {
      throw new Error('Event Store not configured')
    }
    
    const events = await this.eventStore.query(filter)
    
    console.log(`[EventBus] Replaying ${events.length} events...`)
    
    for (const event of events) {
      await handler(event)
    }
    
    console.log('[EventBus] Replay completed')
  }
  
  /**
   * 取得統計資訊
   */
  getStats() {
    return {
      ...this.stats,
      activeSubscriptions: this.subscriptions.size
    }
  }
  
  /**
   * 清除所有訂閱
   */
  clear() {
    this.emitter.removeAllListeners()
    this.subscriptions.clear()
    console.log('[EventBus] All subscriptions cleared')
  }
  
  /**
   * 啟用/停用 Event Bus
   */
  setEnabled(enabled) {
    this.enabled = enabled
    console.log(`[EventBus] ${enabled ? 'Enabled' : 'Disabled'}`)
  }

  /**
   * 檢查 Event Bus 是否啟用
   */
  isEnabled() {
    return this.enabled
  }
  
  /**
   * 生成訂閱 ID
   * @private
   */
  _generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 錯誤處理
   * @private
   */
  async _handleError(event, error) {
    // 錯誤處理策略
    // 1. 記錄到錯誤日誌
    console.error('[EventBus] Error details:', {
      eventId: event.id,
      eventType: event.type,
      error: error.message,
      stack: error.stack
    })
    
    // 2. 未來可以加入：
    //    - 重試 (with exponential backoff)
    //    - Dead Letter Queue
    //    - 告警通知
  }
}

module.exports = InMemoryEventBus

