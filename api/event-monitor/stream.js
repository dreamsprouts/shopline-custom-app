/**
 * Event Monitor Stream API - Server-Sent Events
 * GET /api/event-monitor/stream
 * 
 * 使用 Server-Sent Events 實現真正的訂閱模式
 */

const { getEventBus } = require('../../core/event-bus')

module.exports = async (req, res) => {
  // 設定 SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

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
