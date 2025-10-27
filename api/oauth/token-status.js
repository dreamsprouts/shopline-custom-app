// Vercel Function: Token 狀態檢查
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
    const handle = req.query.handle || process.env.SHOP_HANDLE || 'paykepoc'
    
    try {
      await database.init()
    } catch (dbError) {
      console.warn('⚠️ 資料庫連線失敗:', dbError.message)
      return res.json({
        success: false,
        message: 'Database not available',
        error: dbError.message
      })
    }

    const token = await database.getToken(handle)
    
    if (token) {
      res.json({
        success: true,
        message: `Token 已取得: ${handle}`,
        hasToken: true
      })
    } else {
      res.json({
        success: false,
        message: `Token 未取得: ${handle}`,
        hasToken: false
      })
    }
  } catch (error) {
    console.error('取得 Token 狀態失敗:', error)
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    })
  }
}
