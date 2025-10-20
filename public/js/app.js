// SHOPLINE OAuth App Frontend JavaScript

class ShoplineOAuthApp {
    constructor() {
        this.config = {
            shopHandle: 'paykepoc',
            appKey: '4c951e966557c8374d9a61753dfe3c52441aba3b'
        }
        this.tokenData = null
        this.init()
    }

    init() {
        this.bindEvents()
        this.checkServerStatus()
        this.loadTokenFromServer()
    }

    bindEvents() {
        // OAuth 流程按鈕
        document.getElementById('startOAuthBtn').addEventListener('click', () => {
            this.startOAuthFlow()
        })

        // Token 刷新按鈕
        document.getElementById('refreshTokenBtn').addEventListener('click', () => {
            this.refreshToken()
        })

        // 撤銷授權按鈕
        document.getElementById('revokeAuthBtn').addEventListener('click', () => {
            this.revokeAuthorization()
        })

        // 新按鈕事件
        const testShopBtn = document.getElementById('testShopBtn')
        if (testShopBtn) testShopBtn.addEventListener('click', () => this.testShopAPI())

        const createProductBtn = document.getElementById('createProductBtn')
        if (createProductBtn) createProductBtn.addEventListener('click', () => this.createProductAPI())

        const testProductsBtn = document.getElementById('testProductsBtn')
        if (testProductsBtn) testProductsBtn.addEventListener('click', () => this.testProductsAPI())
    }

    async checkServerStatus() {
        try {
            const response = await fetch('/health')
            const data = await response.json()
            
            if (data.status === 'healthy') {
                this.updateServerStatus('運行中', 'online')
                await this.checkOAuthStatus()
            } else {
                this.updateServerStatus('異常', 'offline')
            }
        } catch (error) {
            console.error('伺服器狀態檢查失敗:', error)
            this.updateServerStatus('離線', 'offline')
        }
    }

    async checkOAuthStatus() {
        try {
            const response = await fetch('/oauth/status')
            const data = await response.json()
            
            if (data.status === 'running') {
                this.updateOAuthStatus('正常', 'online')
            } else {
                this.updateOAuthStatus('異常', 'offline')
            }
        } catch (error) {
            console.error('OAuth 狀態檢查失敗:', error)
            this.updateOAuthStatus('異常', 'offline')
        }
    }

    // 從伺服器載入 Token 狀態
    async loadTokenFromServer() {
        try {
            const response = await fetch('/oauth/token-status')
            const data = await response.json()
            
            if (data.success && data.token) {
                this.tokenData = data.token
                this.saveTokenToLocalStorage(data.token)
                this.updateTokenDisplay()
                this.updateTokenStatus('有效', 'valid')
                console.log('✅ Token 已從伺服器載入')
            } else {
                this.tokenData = null
                this.clearTokenFromLocalStorage()
                this.updateTokenDisplay()
                this.updateTokenStatus('無', 'none')
                console.log('ℹ️ 伺服器上沒有 Token')
            }
        } catch (error) {
            console.error('從伺服器載入 Token 失敗:', error)
            this.tokenData = null
            this.updateTokenStatus('載入失敗', 'error')
        }
    }

    updateServerStatus(status, type) {
        const statusElement = document.getElementById('serverStatus')
        statusElement.textContent = status
        statusElement.className = `text-lg font-bold ${type === 'online' ? 'text-green-900' : 'text-red-900'}`
    }

    updateOAuthStatus(status, type) {
        const statusElement = document.getElementById('oauthStatus')
        statusElement.textContent = status
        statusElement.className = `text-lg font-bold ${type === 'online' ? 'text-blue-900' : 'text-red-900'}`
    }

    updateTokenStatus(status, type) {
        const statusElement = document.getElementById('tokenStatus')
        statusElement.textContent = status
        statusElement.className = `text-lg font-bold ${type === 'valid' ? 'text-green-900' : type === 'expired' ? 'text-red-900' : 'text-gray-900'}`
    }

    updateTokenDisplay() {
        if (this.tokenData) {
            // 顯示授權狀態
            document.getElementById('notAuthorizedState').classList.add('hidden')
            document.getElementById('authorizedState').classList.remove('hidden')
            
            // 更新 Token 資訊
            document.getElementById('accessToken').textContent = this.tokenData.accessToken || 'N/A'
            document.getElementById('refreshToken').textContent = this.tokenData.refreshToken || 'N/A'
            document.getElementById('scope').textContent = this.tokenData.scope || 'N/A'
            
            // 格式化過期時間
            if (this.tokenData.expireTime) {
                const expireDate = new Date(this.tokenData.expireTime)
                document.getElementById('expireTime').textContent = expireDate.toLocaleString('zh-TW')
                
                // 檢查是否即將過期
                const now = new Date()
                const timeDiff = expireDate.getTime() - now.getTime()
                const hoursLeft = timeDiff / (1000 * 60 * 60)
                
                if (hoursLeft < 1) {
                    this.updateTokenStatus('即將過期', 'expired')
                } else if (hoursLeft < 24) {
                    this.updateTokenStatus('即將過期', 'expired')
                } else {
                    this.updateTokenStatus('有效', 'valid')
                }
            }
            
            // 啟用 API 測試按鈕
            const testShopBtn = document.getElementById('testShopBtn')
            const createProductBtn = document.getElementById('createProductBtn')
            const testProductsBtn = document.getElementById('testProductsBtn')
            if (testShopBtn) testShopBtn.disabled = false
            if (createProductBtn) createProductBtn.disabled = false
            if (testProductsBtn) testProductsBtn.disabled = false
        } else {
            // 顯示未授權狀態
            document.getElementById('authorizedState').classList.add('hidden')
            document.getElementById('notAuthorizedState').classList.remove('hidden')
            
            // 禁用 API 測試按鈕
            const testShopBtn = document.getElementById('testShopBtn')
            const createProductBtn = document.getElementById('createProductBtn')
            const testProductsBtn = document.getElementById('testProductsBtn')
            if (testShopBtn) testShopBtn.disabled = true
            if (createProductBtn) createProductBtn.disabled = true
            if (testProductsBtn) testProductsBtn.disabled = true
        }
    }

    // 儲存 Token 到本地儲存
    saveTokenToLocalStorage(token) {
        localStorage.setItem('shopline_token', JSON.stringify(token))
    }

    // 清除本地儲存的 Token
    clearTokenFromLocalStorage() {
        localStorage.removeItem('shopline_token')
    }

    startOAuthFlow() {
        this.showLoading('正在啟動授權流程...')
        
        // 構建授權 URL
        const scope = 'read_store_information,read_products,write_products'
        const redirectUri = `${window.location.origin}/oauth/callback`
        const authUrl = `https://${this.config.shopHandle}.myshopline.com/admin/oauth-web/#/oauth/authorize?appKey=${this.config.appKey}&responseType=code&scope=${scope}&redirectUri=${encodeURIComponent(redirectUri)}`
        
        console.log('啟動 OAuth 流程:', authUrl)
        
        // 開啟新視窗進行授權
        const authWindow = window.open(authUrl, 'shopline_oauth', 'width=600,height=700,scrollbars=yes,resizable=yes')
        
        // 監聽授權完成
        this.monitorAuthWindow(authWindow)
        
        this.hideLoading()
    }

    monitorAuthWindow(authWindow) {
        const checkClosed = setInterval(() => {
            if (authWindow.closed) {
                clearInterval(checkClosed)
                this.checkForToken()
            }
        }, 1000)

        // 5 分鐘後自動關閉監聽
        setTimeout(() => {
            clearInterval(checkClosed)
            if (!authWindow.closed) {
                authWindow.close()
            }
        }, 300000)
    }

    async checkForToken() {
        this.showLoading('正在檢查授權結果...')
        
        try {
            // 檢查是否有新的 token 資料
            const response = await fetch('/oauth/token-status')
            const data = await response.json()
            
            if (data.success && data.token) {
                this.tokenData = data.token
                this.saveToken(data.token)
                this.showAuthorizedState()
                this.updateTokenStatus('有效', 'valid')
                this.showSuccess('授權成功！Token 已獲取')
            } else {
                this.showError('授權失敗或未完成')
            }
        } catch (error) {
            console.error('檢查 Token 失敗:', error)
            this.showError('無法檢查授權狀態')
        }
        
        this.hideLoading()
    }

    loadStoredToken() {
        const storedToken = localStorage.getItem('shopline_token')
        if (storedToken) {
            try {
                this.tokenData = JSON.parse(storedToken)
                this.showAuthorizedState()
                this.updateTokenStatus('已載入', 'valid')
            } catch (error) {
                console.error('載入儲存的 Token 失敗:', error)
                localStorage.removeItem('shopline_token')
            }
        }
    }

    saveToken(tokenData) {
        localStorage.setItem('shopline_token', JSON.stringify(tokenData))
    }

    showAuthorizedState() {
        if (!this.tokenData) return
        
        document.getElementById('notAuthorizedState').classList.add('hidden')
        document.getElementById('authorizedState').classList.remove('hidden')
        
        // 更新 Token 資訊
        document.getElementById('accessToken').textContent = this.tokenData.accessToken || 'N/A'
        document.getElementById('refreshToken').textContent = this.tokenData.refreshToken || 'N/A'
        document.getElementById('scope').textContent = this.tokenData.scope || 'N/A'
        
        // 格式化過期時間
        if (this.tokenData.expireTime) {
            const expireDate = new Date(this.tokenData.expireTime)
            document.getElementById('expireTime').textContent = expireDate.toLocaleString('zh-TW')
            
            // 檢查是否即將過期
            const now = new Date()
            const timeDiff = expireDate.getTime() - now.getTime()
            const hoursLeft = timeDiff / (1000 * 60 * 60)
            
            if (hoursLeft < 1) {
                this.updateTokenStatus('即將過期', 'expired')
            } else if (hoursLeft < 24) {
                this.updateTokenStatus('即將過期', 'expired')
            }
        }
        
        // 啟用 API 測試按鈕（存在才處理，避免 null）
        const testShopBtn = document.getElementById('testShopBtn')
        const createProductBtn = document.getElementById('createProductBtn')
        const testProductsBtn = document.getElementById('testProductsBtn')
        if (testShopBtn) testShopBtn.disabled = false
        if (createProductBtn) createProductBtn.disabled = false
        if (testProductsBtn) testProductsBtn.disabled = false
    }

    async refreshToken() {
        if (!this.tokenData) {
            this.showError('沒有可刷新的 Token')
            return
        }
        
        this.showLoading('正在刷新 Token...')
        
        try {
            const response = await fetch('/oauth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    handle: this.config.shopHandle
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                // 正規化欄位名稱，避免 access_token vs accessToken 差異
                const t = data.data || {}
                const normalized = {
                    accessToken: t.accessToken || t.access_token,
                    refreshToken: t.refreshToken || t.refresh_token,
                    scope: t.scope,
                    expireTime: t.expireTime || t.expire_time
                }
                this.tokenData = normalized
                this.saveToken(normalized)
                this.showAuthorizedState()
                this.showSuccess('Token 刷新成功！')
            } else {
                this.showError('Token 刷新失敗: ' + (data.error || '未知錯誤'))
            }
        } catch (error) {
            console.error('Token 刷新錯誤:', error)
            this.showError('Token 刷新失敗')
        }
        
        this.hideLoading()
    }

    async revokeAuthorization() {
        if (!confirm('確定要撤銷授權嗎？這將清除所有 Token 資料。')) {
            return
        }

        try {
            this.showLoading('正在撤銷授權...')
            
            const response = await fetch('/oauth/revoke', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    handle: this.config.shopHandle 
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                this.tokenData = null
                localStorage.removeItem('shopline_token')
                
                document.getElementById('authorizedState').classList.add('hidden')
                document.getElementById('notAuthorizedState').classList.remove('hidden')
                
                this.updateTokenStatus('無', 'none')
                
                // 禁用 API 測試按鈕（存在才處理）
                const testShopBtn = document.getElementById('testShopBtn')
                const createProductBtn = document.getElementById('createProductBtn')
                const testProductsBtn = document.getElementById('testProductsBtn')
                if (testShopBtn) testShopBtn.disabled = true
                if (createProductBtn) createProductBtn.disabled = true
                if (testProductsBtn) testProductsBtn.disabled = true
                
                this.showSuccess('授權已撤銷，Token 資料已清除。')
            } else {
                this.showError('撤銷授權失敗: ' + data.message)
            }
        } catch (error) {
            console.error('Error revoking authorization:', error)
            this.showError('撤銷授權失敗，請檢查伺服器日誌。')
        } finally {
            this.hideLoading()
        }
    }

    async testProductsAPI() {
        this.showLoading('正在測試商品 API...')
        try {
            const response = await fetch('/api/test/products', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.tokenData.accessToken}` }
            })
            const data = await response.json()
            if (data.success) {
                this.showAPIResult('✅ 商品 API 測試成功', {
                    message: data.message,
                    apiInfo: data.apiInfo,
                    data: data.data,
                    timestamp: new Date().toISOString()
                })
            } else {
                this.showAPIResult('❌ 商品 API 測試失敗', {
                    error: data.error,
                    status: data.status,
                    apiInfo: data.apiInfo,
                    timestamp: new Date().toISOString()
                })
            }
        } catch (error) {
            console.error('商品 API 測試失敗:', error)
            this.showAPIResult('❌ 商品 API 測試失敗', { 
                error: error.message,
                timestamp: new Date().toISOString()
            })
        }
        this.hideLoading()
    }

    async testShopAPI() {
      this.showLoading('正在測試商店 API...')
      try {
          const response = await fetch('/api/test/shop', {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${this.tokenData.accessToken}` }
          })
          const data = await response.json()
          if (data.success) {
              this.showAPIResult('✅ 商店 API 測試成功', {
                  message: data.message,
                  apiInfo: data.apiInfo,
                  data: data.data,
                  timestamp: new Date().toISOString()
              })
          } else {
              this.showAPIResult('❌ 商店 API 測試失敗', {
                  error: data.error,
                  status: data.status,
                  apiInfo: data.apiInfo,
                  timestamp: new Date().toISOString()
              })
          }
      } catch (error) {
          console.error('商店 API 測試失敗:', error)
          this.showAPIResult('❌ 商店 API 測試失敗', { error: error.message, timestamp: new Date().toISOString() })
      }
      this.hideLoading()
  }

  async createProductAPI() {
      this.showLoading('正在建立商品...')
      try {
          const ts = Date.now()
          const rand = Math.floor(Math.random()*10000)
          const baseHandle = `shopline-${ts}-${rand}`
          const payload = {
              product: {
                  handle: baseHandle,
                  title: baseHandle,
                  tags: ['tag1, tag2'],
                  variants: [{
                      sku: 'T0000000001',
                      price: '1000',
                      required_shipping: true,
                      taxable: true,
                      image: {
                          alt: 'This is a image alt',
                          src: 'https://img.myshopline.com/image/official/e46e6189dd5641a3b179444cacdcdd2a.png'
                      },
                      inventory_tracker: true
                  }],
                  images: [{
                      src: 'https://img.myshopline.com/image/official/e46e6189dd5641a3b179444cacdcdd2a.png',
                      alt: 'This is a image alt'
                  }],
                  subtitle: 'This is a subtitle',
                  body_html: 'This is a description',
                  status: 'active',
                  published_scope: 'web'
              }
          }

          const response = await fetch('/api/test/products', {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${this.tokenData.accessToken}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
          })
          const data = await response.json()
          if (data.success) {
              this.showAPIResult('✅ 建立商品成功', {
                  message: data.message,
                  apiInfo: data.apiInfo,
                  data: data.data,
                  timestamp: new Date().toISOString()
              })
          } else {
              this.showAPIResult('❌ 建立商品失敗', {
                  error: data.error,
                  status: data.status,
                  apiInfo: data.apiInfo,
                  timestamp: new Date().toISOString()
              })
          }
      } catch (error) {
          console.error('建立商品失敗:', error)
          this.showAPIResult('❌ 建立商品失敗', { error: error.message, timestamp: new Date().toISOString() })
      }
      this.hideLoading()
  }

    async testOrdersAPI() {
        this.showLoading('正在測試訂單 API...')
        
        try {
            const response = await fetch('/api/test/orders', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.tokenData.accessToken}`
                }
            })
            
            const data = await response.json()
            
            if (data.success) {
                this.showAPIResult('✅ 訂單 API 測試成功', {
                    message: data.message,
                    apiInfo: data.apiInfo,
                    data: data.data,
                    timestamp: new Date().toISOString()
                })
            } else {
                this.showAPIResult('❌ 訂單 API 測試失敗', {
                    error: data.error,
                    status: data.status,
                    apiInfo: data.apiInfo,
                    timestamp: new Date().toISOString()
                })
            }
        } catch (error) {
            console.error('訂單 API 測試失敗:', error)
            this.showAPIResult('❌ 訂單 API 測試失敗', { 
                error: error.message,
                timestamp: new Date().toISOString()
            })
        }
        
        this.hideLoading()
    }

    async testAllAPIs() {
        this.showLoading('正在測試所有 API...')
        
        try {
            const response = await fetch('/api/test/all', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.tokenData.accessToken}`
                }
            })
            
            const data = await response.json()
            
            if (data.success) {
                this.showAPIResult('✅ 所有 API 測試成功', {
                    summary: data.summary,
                    results: data.results,
                    timestamp: new Date().toISOString()
                })
            } else {
                this.showAPIResult('❌ 部分 API 測試失敗', {
                    summary: data.summary,
                    results: data.results,
                    timestamp: new Date().toISOString()
                })
            }
        } catch (error) {
            console.error('所有 API 測試失敗:', error)
            this.showAPIResult('❌ 所有 API 測試失敗', { 
                error: error.message,
                timestamp: new Date().toISOString()
            })
        }
        
        this.hideLoading()
    }

    showAPIResult(title, data) {
        const resultDiv = document.getElementById('apiResult')
        const contentDiv = document.getElementById('apiResultContent')
        
        contentDiv.textContent = JSON.stringify(data, null, 2)
        resultDiv.classList.remove('hidden')
        
        // 滾動到結果區域
        resultDiv.scrollIntoView({ behavior: 'smooth' })
    }

    showLoading(message) {
        document.getElementById('loadingMessage').textContent = message
        document.getElementById('loadingModal').classList.remove('hidden')
    }

    hideLoading() {
        document.getElementById('loadingModal').classList.add('hidden')
    }

    showSuccess(message) {
        // 簡單的成功提示
        alert('✅ ' + message)
    }

    showError(message) {
        // 簡單的錯誤提示
        alert('❌ ' + message)
    }
}

// 當頁面載入完成時初始化應用
document.addEventListener('DOMContentLoaded', () => {
    new ShoplineOAuthApp()
})
