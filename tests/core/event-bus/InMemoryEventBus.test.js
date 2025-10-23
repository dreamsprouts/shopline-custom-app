/**
 * InMemoryEventBus 單元測試
 * 簡單的測試腳本，不依賴外部測試框架
 */

const InMemoryEventBus = require('../../../core/event-bus/InMemoryEventBus')
const { createStandardEvent, EventTypes } = require('../../../core')
const { createInventoryPayload, createOrderPayload } = require('../../../core')

// 測試計數器
let passed = 0
let failed = 0

// 測試工具函數
const test = (description, fn) => {
  try {
    fn()
    console.log(`✅ PASS: ${description}`)
    passed++
  } catch (error) {
    console.error(`❌ FAIL: ${description}`)
    console.error(`   Error: ${error.message}`)
    failed++
  }
}

const assertEquals = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`)
  }
}

const assertTrue = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true')
  }
}

const assertThrows = (fn, message) => {
  try {
    fn()
    throw new Error(message || 'Expected function to throw')
  } catch (error) {
    // Expected
  }
}

// 測試套件
console.log('🧪 Running InMemoryEventBus Tests...\n')

// ========================================
// Test 1: 建立 Event Bus
// ========================================
test('應該能夠建立 InMemoryEventBus 實例', () => {
  const bus = new InMemoryEventBus()
  assertTrue(bus instanceof InMemoryEventBus, 'Bus should be instance of InMemoryEventBus')
  assertTrue(bus.enabled, 'Bus should be enabled by default')
})

test('應該能夠建立停用的 Event Bus', () => {
  const bus = new InMemoryEventBus({ enabled: false })
  assertEquals(bus.enabled, false, 'Bus should be disabled')
})

// ========================================
// Test 2: 發佈事件
// ========================================
test('應該能夠發佈標準事件', async () => {
  const bus = new InMemoryEventBus()
  
  const event = createStandardEvent({
    type: EventTypes.INVENTORY_UPDATED,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 10,
      change: 5
    })
  })
  
  await bus.publish(event)
  
  const stats = bus.getStats()
  assertEquals(stats.published, 1, 'Should have published 1 event')
})

test('發佈無效事件應該拋出錯誤', async () => {
  const bus = new InMemoryEventBus()
  
  try {
    await bus.publish({ invalid: 'event' })
    throw new Error('Should have thrown')
  } catch (error) {
    assertTrue(error.message.includes('must have'), 'Error should mention validation')
  }
})

test('停用的 Event Bus 不應該發佈事件', async () => {
  const bus = new InMemoryEventBus({ enabled: false })
  
  const event = createStandardEvent({
    type: EventTypes.INVENTORY_UPDATED,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 10,
      change: 5
    })
  })
  
  await bus.publish(event)
  
  const stats = bus.getStats()
  assertEquals(stats.published, 0, 'Should not have published any events')
})

// ========================================
// Test 3: 訂閱事件
// ========================================
test('應該能夠訂閱特定事件類型', (done) => {
  const bus = new InMemoryEventBus()
  let received = false
  
  bus.subscribe(EventTypes.INVENTORY_UPDATED, async (event) => {
    received = true
    assertEquals(event.type, EventTypes.INVENTORY_UPDATED, 'Event type should match')
  })
  
  const event = createStandardEvent({
    type: EventTypes.INVENTORY_UPDATED,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 10,
      change: 5
    })
  })
  
  bus.publish(event).then(() => {
    // 給一點時間讓事件處理完成
    setTimeout(() => {
      assertTrue(received, 'Should have received event')
    }, 100)
  })
})

test('應該能夠使用 wildcard 訂閱', (done) => {
  const bus = new InMemoryEventBus()
  let receivedCount = 0
  
  bus.subscribe('inventory.*', async (event) => {
    receivedCount++
  })
  
  const event1 = createStandardEvent({
    type: EventTypes.INVENTORY_UPDATED,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 10,
      change: 5
    })
  })
  
  const event2 = createStandardEvent({
    type: EventTypes.INVENTORY_LOW,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 2,
      change: -8
    })
  })
  
  Promise.all([
    bus.publish(event1),
    bus.publish(event2)
  ]).then(() => {
    setTimeout(() => {
      assertEquals(receivedCount, 2, 'Should have received 2 events')
    }, 100)
  })
})

test('應該能夠訂閱所有事件 (*)', (done) => {
  const bus = new InMemoryEventBus()
  let receivedCount = 0
  
  bus.subscribe('*', async (event) => {
    receivedCount++
  })
  
  const event1 = createStandardEvent({
    type: EventTypes.INVENTORY_UPDATED,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 10,
      change: 5
    })
  })
  
  const event2 = createStandardEvent({
    type: EventTypes.ORDER_CREATED,
    source: {
      platform: 'test',
      platformId: '456',
      connector: 'test-connector'
    },
    payload: createOrderPayload({
      orderNumber: 'ORDER-001',
      status: 'pending',
      customer: {
        email: 'test@example.com',
        name: 'Test User'
      },
      lineItems: [
        { sku: 'TEST-SKU', quantity: 1, price: 100 }
      ],
      total: 100,
      currency: 'USD'
    })
  })
  
  Promise.all([
    bus.publish(event1),
    bus.publish(event2)
  ]).then(() => {
    setTimeout(() => {
      assertEquals(receivedCount, 2, 'Should have received 2 events')
    }, 100)
  })
})

// ========================================
// Test 4: 取消訂閱
// ========================================
test('應該能夠取消訂閱', (done) => {
  const bus = new InMemoryEventBus()
  let receivedCount = 0
  
  const subscriptionId = bus.subscribe(EventTypes.INVENTORY_UPDATED, async (event) => {
    receivedCount++
  })
  
  const event = createStandardEvent({
    type: EventTypes.INVENTORY_UPDATED,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 10,
      change: 5
    })
  })
  
  // 發佈第一個事件
  bus.publish(event).then(() => {
    // 取消訂閱
    bus.unsubscribe(subscriptionId)
    
    // 發佈第二個事件
    return bus.publish(event)
  }).then(() => {
    setTimeout(() => {
      assertEquals(receivedCount, 1, 'Should have received only 1 event')
    }, 100)
  })
})

// ========================================
// Test 5: 批次發佈
// ========================================
test('應該能夠批次發佈事件', async () => {
  const bus = new InMemoryEventBus()
  
  const events = [
    createStandardEvent({
      type: EventTypes.INVENTORY_UPDATED,
      source: {
        platform: 'test',
        platformId: '123',
        connector: 'test-connector'
      },
      payload: createInventoryPayload({
        productCode: 'TEST-SKU-1',
        quantity: 10,
        change: 5
      })
    }),
    createStandardEvent({
      type: EventTypes.INVENTORY_UPDATED,
      source: {
        platform: 'test',
        platformId: '124',
        connector: 'test-connector'
      },
      payload: createInventoryPayload({
        productCode: 'TEST-SKU-2',
        quantity: 20,
        change: 10
      })
    })
  ]
  
  await bus.publishBatch(events)
  
  const stats = bus.getStats()
  assertEquals(stats.published, 2, 'Should have published 2 events')
})

// ========================================
// Test 6: 統計資訊
// ========================================
test('應該能夠取得統計資訊', async () => {
  const bus = new InMemoryEventBus()
  
  bus.subscribe(EventTypes.INVENTORY_UPDATED, async (event) => {
    // Handler
  })
  
  const event = createStandardEvent({
    type: EventTypes.INVENTORY_UPDATED,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 10,
      change: 5
    })
  })
  
  await bus.publish(event)
  
  const stats = bus.getStats()
  assertTrue(stats.published > 0, 'Should have published events')
  assertTrue(stats.activeSubscriptions > 0, 'Should have active subscriptions')
})

// ========================================
// Test 7: 清除訂閱
// ========================================
test('應該能夠清除所有訂閱', () => {
  const bus = new InMemoryEventBus()
  
  bus.subscribe(EventTypes.INVENTORY_UPDATED, async () => {})
  bus.subscribe(EventTypes.ORDER_CREATED, async () => {})
  
  let stats = bus.getStats()
  assertEquals(stats.activeSubscriptions, 2, 'Should have 2 subscriptions')
  
  bus.clear()
  
  stats = bus.getStats()
  assertEquals(stats.activeSubscriptions, 0, 'Should have 0 subscriptions')
})

// ========================================
// Test 8: 啟用/停用
// ========================================
test('應該能夠動態啟用/停用 Event Bus', async () => {
  const bus = new InMemoryEventBus()
  
  const event = createStandardEvent({
    type: EventTypes.INVENTORY_UPDATED,
    source: {
      platform: 'test',
      platformId: '123',
      connector: 'test-connector'
    },
    payload: createInventoryPayload({
      productCode: 'TEST-SKU',
      quantity: 10,
      change: 5
    })
  })
  
  // 啟用狀態發佈
  await bus.publish(event)
  let stats = bus.getStats()
  assertEquals(stats.published, 1, 'Should have published 1 event')
  
  // 停用
  bus.setEnabled(false)
  await bus.publish(event)
  stats = bus.getStats()
  assertEquals(stats.published, 1, 'Should still have only 1 event')
  
  // 重新啟用
  bus.setEnabled(true)
  await bus.publish(event)
  stats = bus.getStats()
  assertEquals(stats.published, 2, 'Should have published 2 events')
})

// ========================================
// 測試結果摘要
// ========================================
console.log('\n========================================')
console.log('測試結果摘要')
console.log('========================================')
console.log(`✅ 通過: ${passed}`)
console.log(`❌ 失敗: ${failed}`)
console.log(`📊 總計: ${passed + failed}`)
console.log('========================================\n')

// 結束代碼
process.exit(failed > 0 ? 1 : 0)

