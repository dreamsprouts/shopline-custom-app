#!/usr/bin/env node

/**
 * 文件驗證腳本
 * 用於驗證文件體系的完整性和一致性
 */

const fs = require('fs')
const path = require('path')

// 必需文件列表
const requiredFiles = [
  'README.md',
  'GUIDE.md',
  'docs/ARCHITECTURE.md',
  'docs/SHOPLINE_STANDARDS.md',
  'docs/API_DOCUMENTATION.md',
  'docs/DEPLOYMENT.md',
  'docs/PROCESSING_STATUS.md',
  'docs/INDEX.md',
  'docs/DOCS_SUMMARY.md'
]

// 文件依賴關係
const fileDependencies = {
  'README.md': ['docs/ARCHITECTURE.md', 'docs/SHOPLINE_STANDARDS.md', 'docs/API_DOCUMENTATION.md', 'docs/DEPLOYMENT.md'],
  'docs/INDEX.md': ['docs/ARCHITECTURE.md', 'docs/SHOPLINE_STANDARDS.md', 'docs/API_DOCUMENTATION.md', 'docs/DEPLOYMENT.md', 'docs/PROCESSING_STATUS.md'],
  'docs/ARCHITECTURE.md': ['docs/SHOPLINE_STANDARDS.md'],
  'docs/API_DOCUMENTATION.md': ['docs/SHOPLINE_STANDARDS.md']
}

/**
 * 檢查文件是否存在
 */
function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  return fs.existsSync(fullPath)
}

/**
 * 檢查文件大小
 */
function checkFileSize(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  if (!fs.existsSync(fullPath)) return 0
  
  const stats = fs.statSync(fullPath)
  return stats.size
}

/**
 * 檢查文件內容
 */
function checkFileContent(filePath) {
  const fullPath = path.join(__dirname, '..', filePath)
  if (!fs.existsSync(fullPath)) return false
  
  const content = fs.readFileSync(fullPath, 'utf8')
  
  // 檢查基本內容
  const checks = {
    hasTitle: /^#\s+.+$/m.test(content),
    hasContent: content.length > 100,
    hasStructure: /##\s+.+$/m.test(content) || /###\s+.+$/m.test(content),
    hasVersion: /\*\*版本\*\*|版本|Version/.test(content),
    hasLastUpdated: /\*\*最後更新\*\*|最後更新|Last Updated/.test(content)
  }
  
  return checks
}

/**
 * 檢查文件依賴
 */
function checkFileDependencies(filePath) {
  const dependencies = fileDependencies[filePath] || []
  const missing = []
  
  dependencies.forEach(dep => {
    if (!checkFileExists(dep)) {
      missing.push(dep)
    }
  })
  
  return {
    dependencies,
    missing,
    isValid: missing.length === 0
  }
}

/**
 * 驗證單個文件
 */
function validateFile(filePath) {
  const exists = checkFileExists(filePath)
  const size = checkFileSize(filePath)
  const content = exists ? checkFileContent(filePath) : null
  const dependencies = checkFileDependencies(filePath)
  
  return {
    filePath,
    exists,
    size,
    content,
    dependencies,
    isValid: exists && size > 0 && content && content.hasTitle && content.hasContent && dependencies.isValid
  }
}

/**
 * 驗證所有文件
 */
function validateAllFiles() {
  console.log('🔍 開始驗證文件體系...')
  console.log('')
  
  const results = []
  let totalValid = 0
  
  requiredFiles.forEach(filePath => {
    const result = validateFile(filePath)
    results.push(result)
    
    if (result.isValid) {
      totalValid++
      console.log(`✅ ${filePath}`)
      console.log(`   📊 大小: ${(result.size / 1024).toFixed(2)}KB`)
      console.log(`   📝 內容: ${result.content ? '完整' : '不完整'}`)
      console.log(`   🔗 依賴: ${result.dependencies.isValid ? '正常' : '缺失'}`)
    } else {
      console.log(`❌ ${filePath}`)
      if (!result.exists) {
        console.log('   📄 文件不存在')
      }
      if (result.size === 0) {
        console.log('   📊 文件為空')
      }
      if (result.content && !result.content.hasTitle) {
        console.log('   📝 缺少標題')
      }
      if (result.content && !result.content.hasContent) {
        console.log('   📝 內容不足')
      }
      if (!result.dependencies.isValid) {
        console.log(`   🔗 缺少依賴: ${result.dependencies.missing.join(', ')}`)
      }
    }
    console.log('')
  })
  
  console.log('📊 驗證結果:')
  console.log(`✅ 有效文件: ${totalValid}/${requiredFiles.length}`)
  console.log(`❌ 無效文件: ${requiredFiles.length - totalValid}/${requiredFiles.length}`)
  
  if (totalValid === requiredFiles.length) {
    console.log('🎉 文件體系驗證通過！')
  } else {
    console.log('⚠️  文件體系需要修復')
  }
  
  return results
}

/**
 * 生成驗證報告
 */
function generateReport(results) {
  const reportPath = path.join(__dirname, '..', 'docs', 'VALIDATION_REPORT.md')
  const reportDir = path.dirname(reportPath)
  
  // 確保目錄存在
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  const timestamp = new Date().toISOString()
  const report = `# 文件驗證報告

## 📊 驗證摘要

- **驗證時間**: ${timestamp}
- **總文件數**: ${results.length}
- **有效文件**: ${results.filter(r => r.isValid).length}
- **無效文件**: ${results.filter(r => !r.isValid).length}

## 📋 詳細結果

${results.map(result => `
### ${result.filePath}

- **狀態**: ${result.isValid ? '✅ 有效' : '❌ 無效'}
- **存在**: ${result.exists ? '✅' : '❌'}
- **大小**: ${(result.size / 1024).toFixed(2)}KB
- **內容**: ${result.content ? '✅' : '❌'}
- **依賴**: ${result.dependencies.isValid ? '✅' : '❌'}

${!result.dependencies.isValid ? `
**缺失依賴**:
${result.dependencies.missing.map(dep => `- ${dep}`).join('\n')}
` : ''}
`).join('\n')}

## 🔧 修復建議

${results.filter(r => !r.isValid).map(result => `
### ${result.filePath}
${!result.exists ? '- 創建文件' : ''}
${result.size === 0 ? '- 添加內容' : ''}
${result.content && !result.content.hasTitle ? '- 添加標題' : ''}
${result.content && !result.content.hasContent ? '- 添加內容' : ''}
${!result.dependencies.isValid ? `- 修復依賴: ${result.dependencies.missing.join(', ')}` : ''}
`).join('\n')}

---
*此報告由文件驗證腳本自動生成*
`

  fs.writeFileSync(reportPath, report, 'utf8')
  console.log(`📄 驗證報告已生成: ${reportPath}`)
}

/**
 * 主函數
 */
function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'validate':
      const results = validateAllFiles()
      generateReport(results)
      break
    case 'quick':
      validateAllFiles()
      break
    case 'help':
    default:
      console.log('📚 文件驗證工具')
      console.log('')
      console.log('用法:')
      console.log('  node scripts/validate-docs.js validate  - 完整驗證並生成報告')
      console.log('  node scripts/validate-docs.js quick     - 快速驗證')
      console.log('  node scripts/validate-docs.js help      - 顯示幫助')
      console.log('')
      console.log('範例:')
      console.log('  npm run docs:validate')
      console.log('  npm run docs:quick')
      break
  }
}

// 執行主函數
main()
