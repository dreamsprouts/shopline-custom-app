#!/usr/bin/env node

/**
 * Agent 資訊查找腳本
 * 簡化版本 - 只提供官方來源清單
 */

// 官方資源清單
const officialSources = {
  'website': {
    jp: 'https://jp.shopline.com/',
    en: 'https://www.shopline.com/'
  },
  'support': {
    jp: 'https://help.shopline.com/hc/ja',
    en: 'https://help.shopline.com/hc/en-001'
  },
  'developer': {
    docs: 'https://developer.shopline.com/docs/'
  }
}

/**
 * 顯示官方資源
 */
function showOfficialSources() {
  console.log('🌐 SHOPLINE 官方資源')
  console.log('')
  
  console.log('🏢 官網:')
  console.log(`  🇯🇵 日本: ${officialSources.website.jp}`)
  console.log(`  🇺🇸 英文: ${officialSources.website.en}`)
  console.log('')
  
  console.log('🆘 支援中心:')
  console.log(`  🇯🇵 日文: ${officialSources.support.jp}`)
  console.log(`  🇺🇸 英文: ${officialSources.support.en}`)
  console.log('')
  
  console.log('👨‍💻 開發者資源:')
  console.log(`  📚 文件: ${officialSources.developer.docs}`)
  console.log('')
  
  console.log('💡 使用原則:')
  console.log('1. 優先使用本地專案文件 (docs/ 資料夾)')
  console.log('2. 超出專案內容時，使用上述官方來源查詢')
  console.log('3. Agent 自行判斷何時需要查詢何種資訊')
}

/**
 * 顯示幫助
 */
function showHelp() {
  console.log('🤖 Agent 資訊查找工具 (簡化版)')
  console.log('')
  console.log('用法:')
  console.log('  node scripts/agent-info.js        - 顯示官方資源')
  console.log('  node scripts/agent-info.js help   - 顯示幫助')
  console.log('')
  console.log('範例:')
  console.log('  npm run agent:official')
}

/**
 * 主函數
 */
function main() {
  const command = process.argv[2]
  
  if (command === 'help') {
    showHelp()
  } else {
    showOfficialSources()
  }
}

// 執行主函數
main()