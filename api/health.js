// Vercel Function: 健康檢查（簡化版，不依賴資料庫）
module.exports = (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: 'vercel',
      postgres_url: process.env.POSTGRES_URL ? 'configured' : 'missing'
    })
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
