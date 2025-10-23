/**
 * Event-Driven 配置測試
 * 驗證功能開關機制
 */

console.log('🧪 Testing Event-Driven Configuration...\n')

// 測試 1: 預設配置 (全部停用)
console.log('Test 1: 預設配置 (Event Bus 停用)')
console.log('-------------------------------------------')
delete require.cache[require.resolve('../../../config/event-driven/config')]
const config1 = require('../../../config/event-driven/config')
console.log(`USE_EVENT_BUS=${process.env.USE_EVENT_BUS || 'undefined'}`)
console.log(`config.enabled = ${config1.enabled}`)
console.log(`✅ 預設應該停用: ${!config1.enabled ? 'PASS' : 'FAIL'}`)
console.log()

// 測試 2: 啟用 Event Bus
console.log('Test 2: 啟用 Event Bus')
console.log('-------------------------------------------')
process.env.USE_EVENT_BUS = 'true'
delete require.cache[require.resolve('../../../config/event-driven/config')]
const config2 = require('../../../config/event-driven/config')
console.log(`USE_EVENT_BUS=${process.env.USE_EVENT_BUS}`)
console.log(`config.enabled = ${config2.enabled}`)
console.log(`✅ 應該啟用: ${config2.enabled ? 'PASS' : 'FAIL'}`)
console.log()

// 測試 3: Connector 開關
console.log('Test 3: Connector 開關')
console.log('-------------------------------------------')
process.env.ENABLE_SHOPLINE_SOURCE = 'true'
process.env.ENABLE_NEXT_ENGINE_TARGET = 'true'
delete require.cache[require.resolve('../../../config/event-driven/config')]
const config3 = require('../../../config/event-driven/config')
console.log(`ENABLE_SHOPLINE_SOURCE=${process.env.ENABLE_SHOPLINE_SOURCE}`)
console.log(`config.connectors.shoplineSource = ${config3.connectors.shoplineSource}`)
console.log(`✅ Shopline Source 應該啟用: ${config3.connectors.shoplineSource ? 'PASS' : 'FAIL'}`)
console.log(`ENABLE_NEXT_ENGINE_TARGET=${process.env.ENABLE_NEXT_ENGINE_TARGET}`)
console.log(`config.connectors.nextEngineTarget = ${config3.connectors.nextEngineTarget}`)
console.log(`✅ Next Engine Target 應該啟用: ${config3.connectors.nextEngineTarget ? 'PASS' : 'FAIL'}`)
console.log()

// 測試 4: Event Store 配置
console.log('Test 4: Event Store 配置')
console.log('-------------------------------------------')
process.env.EVENT_STORE_ENABLED = 'true'
process.env.EVENT_STORE_RETENTION_DAYS = '60'
delete require.cache[require.resolve('../../../config/event-driven/config')]
const config4 = require('../../../config/event-driven/config')
console.log(`EVENT_STORE_ENABLED=${process.env.EVENT_STORE_ENABLED}`)
console.log(`config.eventStore.enabled = ${config4.eventStore.enabled}`)
console.log(`✅ Event Store 應該啟用: ${config4.eventStore.enabled ? 'PASS' : 'FAIL'}`)
console.log(`EVENT_STORE_RETENTION_DAYS=${process.env.EVENT_STORE_RETENTION_DAYS}`)
console.log(`config.eventStore.retentionDays = ${config4.eventStore.retentionDays}`)
console.log(`✅ Retention 應該是 60 天: ${config4.eventStore.retentionDays === 60 ? 'PASS' : 'FAIL'}`)
console.log()

// 測試 5: 錯誤處理配置
console.log('Test 5: 錯誤處理配置')
console.log('-------------------------------------------')
process.env.EVENT_MAX_RETRIES = '5'
process.env.EVENT_RETRY_DELAY_MS = '2000'
delete require.cache[require.resolve('../../../config/event-driven/config')]
const config5 = require('../../../config/event-driven/config')
console.log(`EVENT_MAX_RETRIES=${process.env.EVENT_MAX_RETRIES}`)
console.log(`config.errorHandling.maxRetries = ${config5.errorHandling.maxRetries}`)
console.log(`✅ Max Retries 應該是 5: ${config5.errorHandling.maxRetries === 5 ? 'PASS' : 'FAIL'}`)
console.log(`EVENT_RETRY_DELAY_MS=${process.env.EVENT_RETRY_DELAY_MS}`)
console.log(`config.errorHandling.retryDelayMs = ${config5.errorHandling.retryDelayMs}`)
console.log(`✅ Retry Delay 應該是 2000ms: ${config5.errorHandling.retryDelayMs === 2000 ? 'PASS' : 'FAIL'}`)
console.log()

// 測試 6: 顯示完整配置
console.log('Test 6: 顯示完整配置')
console.log('-------------------------------------------')
process.env.SHOW_EVENT_CONFIG = 'true'
delete require.cache[require.resolve('../../../config/event-driven/config')]
require('../../../config/event-driven/config')

console.log('\n✅ 所有配置測試完成！')

