/**
 * 簡單的測試事件 API
 * POST /api/event-monitor/test-simple
 */

const { getEventBus } = require('../../core/event-bus')
const { createEventPayload } = require('../../core/events')

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

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
