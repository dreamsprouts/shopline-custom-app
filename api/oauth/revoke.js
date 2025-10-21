// Vercel Function: 撤銷授權
const database = require('../../utils/database-postgres')

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
    const { handle } = req.body
    
    if (!handle) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing handle parameter' 
      })
    }

    // 初始化資料庫
    await database.init()
    
    // 刪除 Token
    const result = await database.deleteToken(handle)
    
    res.json({
      success: true,
      message: `Token deleted for ${handle}`,
      changes: result.changes
    })
    
  } catch (error) {
    console.error('撤銷授權處理失敗:', error)
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    })
  }
}
