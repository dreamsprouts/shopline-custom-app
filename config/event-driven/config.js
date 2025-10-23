/**
 * Event-Driven 架構配置
 * 提供功能開關和配置管理
 */

const config = {
  // Event Bus 核心開關
  enabled: process.env.USE_EVENT_BUS === 'true',
  
  // Event Bus 類型
  busType: process.env.EVENT_BUS_TYPE || 'memory', // 'memory' | 'redis' (未來)
  
  // 是否記錄所有事件
  logEvents: process.env.LOG_EVENTS !== 'false', // 預設為 true
  
  // Connector 開關
  connectors: {
    shoplineSource: process.env.ENABLE_SHOPLINE_SOURCE === 'true',
    shoplineTarget: process.env.ENABLE_SHOPLINE_TARGET === 'true',
    nextEngineSource: process.env.ENABLE_NEXT_ENGINE_SOURCE === 'true',
    nextEngineTarget: process.env.ENABLE_NEXT_ENGINE_TARGET === 'true'
  },
  
  // Event Store 配置
  eventStore: {
    enabled: process.env.EVENT_STORE_ENABLED === 'true',
    type: process.env.EVENT_STORE_TYPE || 'postgres', // 'postgres' | 'file' | 'none'
    retentionDays: parseInt(process.env.EVENT_STORE_RETENTION_DAYS || '90', 10)
  },
  
  // 錯誤處理配置
  errorHandling: {
    maxRetries: parseInt(process.env.EVENT_MAX_RETRIES || '3', 10),
    retryDelayMs: parseInt(process.env.EVENT_RETRY_DELAY_MS || '1000', 10),
    useDeadLetterQueue: process.env.EVENT_USE_DLQ === 'true'
  }
}

/**
 * 驗證配置
 */
const validateConfig = () => {
  if (config.busType !== 'memory' && config.busType !== 'redis') {
    console.warn(`[Config] Invalid busType: ${config.busType}, using 'memory'`)
    config.busType = 'memory'
  }
  
  if (config.errorHandling.maxRetries < 0) {
    console.warn('[Config] maxRetries must be >= 0, using 3')
    config.errorHandling.maxRetries = 3
  }
  
  return true
}

/**
 * 顯示配置摘要
 */
const printConfig = () => {
  console.log('========================================')
  console.log('Event-Driven 架構配置')
  console.log('========================================')
  console.log(`Event Bus: ${config.enabled ? '✅ 啟用' : '❌ 停用'}`)
  console.log(`Bus Type: ${config.busType}`)
  console.log(`Log Events: ${config.logEvents ? '是' : '否'}`)
  console.log('\nConnectors:')
  console.log(`  - Shopline Source: ${config.connectors.shoplineSource ? '✅' : '❌'}`)
  console.log(`  - Shopline Target: ${config.connectors.shoplineTarget ? '✅' : '❌'}`)
  console.log(`  - Next Engine Source: ${config.connectors.nextEngineSource ? '✅' : '❌'}`)
  console.log(`  - Next Engine Target: ${config.connectors.nextEngineTarget ? '✅' : '❌'}`)
  console.log('\nEvent Store:')
  console.log(`  - Enabled: ${config.eventStore.enabled ? '✅' : '❌'}`)
  console.log(`  - Type: ${config.eventStore.type}`)
  console.log(`  - Retention: ${config.eventStore.retentionDays} days`)
  console.log('========================================\n')
}

// 驗證配置
validateConfig()

// 如果需要，顯示配置
if (process.env.SHOW_EVENT_CONFIG === 'true') {
  printConfig()
}

module.exports = config

