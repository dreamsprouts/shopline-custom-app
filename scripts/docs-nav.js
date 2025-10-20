#!/usr/bin/env node

/**
 * 文件導航腳本
 * 用於快速查找和導航文件
 */

const fs = require('fs')
const path = require('path')

// 文件映射
const docMap = {
  // 核心文件
  'readme': 'README.md',
  'guide': 'GUIDE.md',
  
  // 架構文件
  'arch': 'docs/ARCHITECTURE.md',
  'architecture': 'docs/ARCHITECTURE.md',
  
  // 標準文件
  'standards': 'docs/SHOPLINE_STANDARDS.md',
  'shopline': 'docs/SHOPLINE_STANDARDS.md',
  
  // API 文件
  'api': 'docs/API_DOCUMENTATION.md',
  'endpoints': 'docs/API_DOCUMENTATION.md',
  
  // 部署文件
  'deploy': 'docs/DEPLOYMENT.md',
  'deployment': 'docs/DEPLOYMENT.md',
  
  // 狀態文件
  'status': 'docs/PROCESSING_STATUS.md',
  'processing': 'docs/PROCESSING_STATUS.md',
  
  // 索引文件
  'index': 'docs/INDEX.md',
  'docs': 'docs/INDEX.md',
  
  // 總結文件
  'summary': 'docs/DOCS_SUMMARY.md'
}

// 文件描述
const docDescriptions = {
  'README.md': '專案概述和快速開始指南',
  'GUIDE.md': '完整實作指南',
  'docs/ARCHITECTURE.md': '系統架構和設計文件',
  'docs/SHOPLINE_STANDARDS.md': 'SHOPLINE 平台標準代碼',
  'docs/API_DOCUMENTATION.md': 'API 端點文件',
  'docs/DEPLOYMENT.md': '部署和維護指南',
  'docs/PROCESSING_STATUS.md': '處理狀態和日誌',
  'docs/INDEX.md': '文件索引和導航',
  'docs/DOCS_SUMMARY.md': '文件體系總結'
}

/**
 * 查找文件
 */
function findDoc(query) {
  const normalizedQuery = query.toLowerCase()
  
  // 直接匹配
  if (docMap[normalizedQuery]) {
    return docMap[normalizedQuery]
  }
  
  // 模糊匹配
  const matches = Object.keys(docMap).filter(key => 
    key.includes(normalizedQuery) || normalizedQuery.includes(key)
  )
  
  if (matches.length === 1) {
    return docMap[matches[0]]
  }
  
  return null
}

/**
 * 顯示文件資訊
 */
function showDocInfo(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ 文件不存在: ${filePath}`)
    return
  }
  
  const stats = fs.statSync(fullPath)
  const size = (stats.size / 1024).toFixed(2)
  const modified = stats.mtime.toISOString().split('T')[0]
  
  console.log(`📄 ${filePath}`)
  console.log(`📝 ${docDescriptions[filePath] || '無描述'}`)
  console.log(`📊 大小: ${size}KB`)
  console.log(`📅 修改於: ${modified}`)
  console.log(`📍 路徑: ${fullPath}`)
}

/**
 * 列出所有文件
 */
function listAllDocs() {
  console.log('📚 可用文件:')
  console.log('')
  
  Object.entries(docMap).forEach(([key, filePath]) => {
    const fullPath = path.join(__dirname, '..', filePath)
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath)
      const size = (stats.size / 1024).toFixed(2)
      console.log(`✅ ${key.padEnd(15)} → ${filePath} (${size}KB)`)
    } else {
      console.log(`❌ ${key.padEnd(15)} → ${filePath} (不存在)`)
    }
  })
}

/**
 * 搜尋文件
 */
function searchDocs(query) {
  console.log(`🔍 搜尋: "${query}"`)
  console.log('')
  
  const filePath = findDoc(query)
  
  if (filePath) {
    showDocInfo(filePath)
  } else {
    console.log('❌ 未找到匹配的文件')
    console.log('')
    console.log('💡 提示: 使用以下命令查看所有可用文件:')
    console.log('   npm run docs:list')
  }
}

/**
 * 顯示幫助
 */
function showHelp() {
  console.log('📚 文件導航工具')
  console.log('')
  console.log('用法:')
  console.log('  node scripts/docs-nav.js <查詢>     - 查找文件')
  console.log('  node scripts/docs-nav.js list      - 列出所有文件')
  console.log('  node scripts/docs-nav.js help      - 顯示幫助')
  console.log('')
  console.log('範例:')
  console.log('  npm run docs:find api              - 查找 API 文件')
  console.log('  npm run docs:find arch             - 查找架構文件')
  console.log('  npm run docs:find deploy           - 查找部署文件')
  console.log('')
  console.log('可用查詢:')
  Object.keys(docMap).forEach(key => {
    console.log(`  ${key.padEnd(15)} → ${docMap[key]}`)
  })
}

/**
 * 主函數
 */
function main() {
  const command = process.argv[2]
  
  if (!command) {
    showHelp()
    return
  }
  
  switch (command.toLowerCase()) {
    case 'list':
      listAllDocs()
      break
    case 'help':
      showHelp()
      break
    default:
      searchDocs(command)
      break
  }
}

// 執行主函數
main()
