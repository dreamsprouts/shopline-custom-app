// Vercel Function: 主頁面
const fs = require('fs')
const path = require('path')

module.exports = (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/html')
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

    // 讀取 index.html 檔案
    const indexPath = path.join(__dirname, '..', 'views', 'index.html')
    const htmlContent = fs.readFileSync(indexPath, 'utf8')
    
    res.status(200).send(htmlContent)
  } catch (error) {
    console.error('Index page error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
