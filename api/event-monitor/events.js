/**
 * Event Monitor API - 取得事件列表
 * GET /api/event-monitor/events
 * 返回最近 100 個事件
 */

const { getEventBus } = require('../../core/event-bus')
const database = require('../../utils/database-postgres')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

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
    console.error('Event Monitor API error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Failed to get events',
      message: error.message 
    })
  }
}
