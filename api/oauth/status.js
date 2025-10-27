// Vercel Function: OAuth 狀態檢查
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
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('OAuth status error:', error)
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    })
  }
}
