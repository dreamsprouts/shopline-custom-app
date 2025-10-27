/**
 * Event Monitor API - 合併版本
 * 支援多個端點：
 * - GET /api/event-monitor/events - 取得事件列表
 * - GET /api/event-monitor/stream - SSE 訂閱
 * - POST /api/event-monitor/test-simple - 測試事件
 */

const { getEventBus } = require('../core/event-bus')
const database = require('../utils/database-postgres')
const { createEventPayload } = require('../core/events')

module.exports = async (req, res) => {
  // 設定 CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // 根據查詢參數決定功能
    const { action } = req.query

    if (action === 'stream') {
      // SSE 訂閱模式
      return handleStream(req, res)
    } else if (action === 'test-simple') {
      // 測試事件
      return handleTestEvent(req, res)
    } else {
      // 預設：取得事件列表
      return handleGetEvents(req, res)
    }
  } catch (error) {
    console.error('Event Monitor API error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    })
  }
}

// 取得事件列表
async function handleGetEvents(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // 確保資料庫已初始化
    await database.init()
    
    // 取得 Event Bus 實例
    const eventBus = getEventBus()
    
    // 取得事件列表和統計
    const events = await database.getEvents(100, 0) // 最近 100 個事件
    const eventStats = await database.getEventStats()
    const busStats = eventBus.getStats()
    
    // 回傳事件歷史和統計
    res.json({
      success: true,
      events: events,
      stats: {
        total: parseInt(eventStats.total) || 0,
        product_events: parseInt(eventStats.product_events) || 0,
        order_events: parseInt(eventStats.order_events) || 0,
        last_event_time: eventStats.last_event_time,
        published: busStats.published,
        delivered: busStats.delivered,
        errors: busStats.errors
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Get events error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to get events',
      message: error.message 
    })
  }
}

// SSE 訂閱模式
async function handleStream(req, res) {
  // 設定 SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  if (req.method !== 'GET') {
    res.status(405).end()
    return
  }

  try {
    console.log('📡 [Event Monitor] 新的 SSE 連接建立')
    
    // 取得 Event Bus 實例
    const eventBus = getEventBus()
    
    // 建立訂閱 ID
    const subscriptionId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 訂閱所有事件
    const eventHandler = async (event) => {
      try {
        // 發送事件到客戶端
        const eventData = {
          id: event.id,
          type: event.type,
          timestamp: event.timestamp,
          source: event.source,
          payload: event.payload,
          version: event.version
        }
        
        // SSE 格式
        res.write(`id: ${event.id}\n`)
        res.write(`event: event\n`)
        res.write(`data: ${JSON.stringify(eventData)}\n\n`)
        
        console.log(`📡 [Event Monitor] 事件已推送: ${event.type} (${event.id})`)
      } catch (error) {
        console.error(`❌ [Event Monitor] 推送事件失敗: ${event.type}`, error)
      }
    }
    
    // 訂閱事件
    eventBus.subscribe('*', eventHandler)
    
    // 發送連接確認
    res.write(`id: connection\n`)
    res.write(`event: connected\n`)
    res.write(`data: ${JSON.stringify({
      message: 'Event Monitor Stream connected',
      subscriptionId: subscriptionId,
      timestamp: new Date().toISOString()
    })}\n\n`)
    
    // 定期發送心跳
    const heartbeat = setInterval(() => {
      try {
        res.write(`id: heartbeat\n`)
        res.write(`event: heartbeat\n`)
        res.write(`data: ${JSON.stringify({
          timestamp: new Date().toISOString()
        })}\n\n`)
      } catch (error) {
        clearInterval(heartbeat)
      }
    }, 30000) // 每 30 秒發送心跳
    
    // 處理連接關閉
    req.on('close', () => {
      console.log('📡 [Event Monitor] SSE 連接已關閉')
      clearInterval(heartbeat)
      // 取消訂閱
      eventBus.unsubscribe(subscriptionId)
    })
    
    req.on('error', (error) => {
      console.error('📡 [Event Monitor] SSE 連接錯誤:', error)
      clearInterval(heartbeat)
      eventBus.unsubscribe(subscriptionId)
    })
    
  } catch (error) {
    console.error('Event Monitor Stream error:', error)
    res.status(500).end()
  }
}

// 測試事件
async function handleTestEvent(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // 取得 Event Bus 實例
    const eventBus = getEventBus()
    
    // 建立測試事件
    const testEvent = createEventPayload('product.updated', {
      test: true,
      message: 'This is a test event from Event Monitor Dashboard',
      source: 'event-monitor-dashboard'
    }, {
      source: 'event-monitor',
      api_endpoint: '/api/event-monitor/test-simple',
      test_mode: true
    })
    
    // 發佈測試事件
    await eventBus.publish(testEvent)
    
    res.json({
      success: true,
      message: 'Test event published successfully',
      event: {
        id: testEvent.id,
        type: testEvent.type,
        timestamp: testEvent.timestamp
      }
    })
  } catch (error) {
    console.error('Event Monitor Test API error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to publish test event',
      message: error.message 
    })
  }
}
