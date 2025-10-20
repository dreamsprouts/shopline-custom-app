const crypto = require('crypto')

/**
 * 生成 HMAC-SHA256 簽名
 */
function generateHmacSha256(source, secret) {
  if (!source || !secret) {
    throw new Error('Source and secret must not be empty')
  }
  
  try {
    const signature = crypto
    .createHmac('sha256', secret)
    .update(source, 'utf8')
    .digest('hex')
    return signature
  } catch (error) {
    console.error('Error generating HMAC-SHA256 signature:', error)
    throw error
  }
}

/**
 * 驗證 GET 請求的簽名
 */
function verifyGetSignature(params, receivedSign, appSecret) {
  try {
    // 移除 sign 參數
  const filteredParams = Object.keys(params)
    .filter(key => key !== 'sign')
    .reduce((obj, key) => {
      obj[key] = params[key]
      return obj
    }, {})

    // 按字母順序排序
  const sortedKeys = Object.keys(filteredParams).sort()
    
    // 建立查詢字串
  const queryString = sortedKeys
      .map(key => `${key}=${filteredParams[key]}`)
    .join('&')

    // 計算預期簽名
  const expectedSign = generateHmacSha256(queryString, appSecret)
  
    // 使用 crypto.timingSafeEqual 進行安全比較
  return crypto.timingSafeEqual(
    Buffer.from(expectedSign, 'hex'),
    Buffer.from(receivedSign, 'hex')
  )
  } catch (error) {
    console.error('Error verifying GET signature:', error)
    return false
  }
}

/**
 * 驗證 POST 請求的簽名
 */
function verifyPostSignature(body, timestamp, receivedSign, appSecret) {
  try {
  const source = body + timestamp
  const expectedSign = generateHmacSha256(source, appSecret)
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSign, 'hex'),
    Buffer.from(receivedSign, 'hex')
  )
  } catch (error) {
    console.error('Error verifying POST signature:', error)
    return false
  }
}

/**
 * 驗證時間戳
 */
function verifyTimestamp(requestTimestamp, toleranceMinutes = 15) {
  try {
    const currentTime = Date.now()
    let requestTime = parseInt(requestTimestamp)
    // 若為秒級時間戳，轉為毫秒
    if (requestTime < 1e12) {
      requestTime = requestTime * 1000
    }
    const timeDiff = Math.abs(currentTime - requestTime)
    const toleranceMs = toleranceMinutes * 60 * 1000
    const within = timeDiff <= toleranceMs
    if (!within) {
      console.warn('Timestamp verification failed', { currentTime, requestTime, diffMs: timeDiff, toleranceMs })
    }
    return within
  } catch (error) {
    console.error('Error verifying timestamp:', error)
    return false
  }
}

/**
 * 為 GET 請求生成簽名
 */
function signGetRequest(params, appSecret) {
  const sortedKeys = Object.keys(params).sort()
  const queryString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&')
  return generateHmacSha256(queryString, appSecret)
}

/**
 * 為 POST 請求生成簽名
 */
function signPostRequest(body, timestamp, appSecret) {
  const source = body + timestamp
  return generateHmacSha256(source, appSecret)
}

module.exports = {
  generateHmacSha256,
  verifyGetSignature,
  verifyPostSignature,
  verifyTimestamp,
  signGetRequest,
  signPostRequest
}
