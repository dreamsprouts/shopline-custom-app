#!/usr/bin/env node

/**
 * 文件更新腳本
 * 用於自動更新文件體系中的版本號和時間戳
 */

const fs = require('fs')
const path = require('path')

// 配置文件
const config = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  files: [
    'README.md',
    'docs/ARCHITECTURE.md',
    'docs/SHOPLINE_STANDARDS.md',
    'docs/API_DOCUMENTATION.md',
    'docs/DEPLOYMENT.md',
    'docs/PROCESSING_STATUS.md',
    'docs/INDEX.md',
    'docs/DOCS_SUMMARY.md'
  ]
}

/**
 * 更新文件中的版本號和時間戳
 */
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    
    // 更新版本號
    content = content.replace(
      /(\*\*版本\*\*|版本|Version):\s*[\d.]+/g,
      `$1: ${config.version}`
    )
    
    // 更新最後更新時間
    content = content.replace(
      /(\*\*最後更新\*\*|最後更新|Last Updated):\s*[\d-]+/g,
      `$1: ${config.lastUpdated}`
    )
    
    // 更新時間戳
    content = content.replace(
      /(\*\*時間\*\*|時間|Timestamp):\s*[\d-]+/g,
      `$1: ${config.lastUpdated}`
    )
    
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ 已更新: ${filePath}`)
    
  } catch (error) {
    console.error(`❌ 更新失敗: ${filePath}`, error.message)
  }
}

/**
 * 更新所有文件
 */
function updateAllFiles() {
  console.log('🔄 開始更新文件體系...')
  console.log(`📅 版本: ${config.version}`)
  console.log(`📅 更新時間: ${config.lastUpdated}`)
  console.log('')
  
  config.files.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath)
    if (fs.existsSync(fullPath)) {
      updateFile(fullPath)
    } else {
      console.log(`⚠️  文件不存在: ${filePath}`)
    }
  })
  
  console.log('')
  console.log('✅ 文件更新完成！')
}

/**
 * 顯示文件狀態
 */
function showFileStatus() {
  console.log('📊 文件狀態:')
  console.log('')
  
  config.files.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath)
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath)
      const size = (stats.size / 1024).toFixed(2)
      const modified = stats.mtime.toISOString().split('T')[0]
      console.log(`✅ ${filePath} (${size}KB, 修改於: ${modified})`)
    } else {
      console.log(`❌ ${filePath} (不存在)`)
    }
  })
}

/**
 * 主函數
 */
function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'update':
      updateAllFiles()
      break
    case 'status':
      showFileStatus()
      break
    case 'help':
    default:
      console.log('📚 文件更新腳本')
      console.log('')
      console.log('用法:')
      console.log('  node scripts/update-docs.js update  - 更新所有文件')
      console.log('  node scripts/update-docs.js status  - 顯示文件狀態')
      console.log('  node scripts/update-docs.js help    - 顯示幫助')
      console.log('')
      console.log('範例:')
      console.log('  npm run docs:update')
      console.log('  npm run docs:status')
      break
  }
}

// 執行主函數
main()
