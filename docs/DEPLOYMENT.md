# SHOPLINE OAuth 系統部署指南

## 🚀 快速部署

### 1. 環境準備
```bash
# 檢查 Node.js 版本 (需要 16+)
node --version

# 檢查 npm 版本
npm --version

# 安裝 ngrok (用於本地開發)
npm install -g ngrok
```

### 2. 專案設置
```bash
# 複製專案
git clone <repository-url>
cd shopline-oauth-app

# 安裝依賴
npm install

# 啟動應用
npm start
```

### 3. ngrok 設置
```bash
# 設定 ngrok token
ngrok config add-authtoken 32oPQ50o6TPO04LvlnvuwjLKENf_29WWsE19EN9BxG4s1ehJU

# 啟動 ngrok tunnel
ngrok http 3000
```

## 🔧 配置管理

### 環境變數設置
```bash
# 開發環境
NODE_ENV=development
PORT=3000

# 生產環境
NODE_ENV=production
PORT=8080
```

### 配置文件
```json
{
  "app_key": "4c951e966557c8374d9a61753dfe3c52441aba3b",
  "app_secret": "dd46269d6920f49b07e810862d3093062b0fb858",
  "shop_handle": "paykepoc",
  "shop_url": "https://paykepoc.myshopline.com/",
  "ngrok_token": "32oPQ50o6TPO04LvlnvuwjLKENf_29WWsE19EN9BxG4s1ehJU",
  "port": 3000,
  "node_env": "development"
}
```

## 🗄️ 資料庫設置

### SQLite 資料庫
```bash
# 資料庫檔案位置
/Users/morrisli/Projects/custom-app/data/shopline_oauth.db

# 手動檢查資料庫
sqlite3 data/shopline_oauth.db ".tables"
sqlite3 data/shopline_oauth.db "SELECT * FROM oauth_tokens;"
```

### 生產環境資料庫 (PostgreSQL)
```javascript
// 生產環境建議使用 PostgreSQL
const { Pool } = require('pg')

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
})
```

## 🌐 生產環境部署

### Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=shopline_oauth
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Kubernetes 部署
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shopline-oauth-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: shopline-oauth-app
  template:
    metadata:
      labels:
        app: shopline-oauth-app
    spec:
      containers:
      - name: app
        image: shopline-oauth-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          value: "postgres-service"
```

## 🔒 安全設置

### HTTPS 設置
```javascript
// 生產環境 HTTPS 設置
const https = require('https')
const fs = require('fs')

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
}

https.createServer(options, app).listen(443)
```

### 環境變數安全
```bash
# 使用 .env 檔案
APP_KEY=your_app_key
APP_SECRET=your_app_secret
SHOP_HANDLE=your_shop_handle
DB_PASSWORD=your_db_password
```

### 防火牆設置
```bash
# 只允許必要端口
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

## 📊 監控和日誌

### 日誌設置
```javascript
// 使用 winston 日誌庫
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

### 健康檢查
```javascript
// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  })
})
```

### 監控指標
```javascript
// 添加監控指標
const prometheus = require('prom-client')

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
})

const oauthRequestsTotal = new prometheus.Counter({
  name: 'oauth_requests_total',
  help: 'Total number of OAuth requests',
  labelNames: ['type', 'status']
})
```

## 🔄 備份和恢復

### 資料庫備份
```bash
# SQLite 備份
sqlite3 data/shopline_oauth.db ".backup backup_$(date +%Y%m%d_%H%M%S).db"

# PostgreSQL 備份
pg_dump -h localhost -U username -d shopline_oauth > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 自動備份腳本
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_FILE="data/shopline_oauth.db"

# 建立備份目錄
mkdir -p $BACKUP_DIR

# 備份資料庫
sqlite3 $DB_FILE ".backup $BACKUP_DIR/oauth_backup_$DATE.db"

# 保留最近 7 天的備份
find $BACKUP_DIR -name "oauth_backup_*.db" -mtime +7 -delete

echo "Backup completed: oauth_backup_$DATE.db"
```

### 恢復程序
```bash
# 從備份恢復
sqlite3 data/shopline_oauth.db ".restore backup_20241020_120000.db"
```

## 🚨 故障排除

### 常見問題

#### 1. 簽名驗證失敗
```bash
# 檢查 app_secret 是否正確
echo $APP_SECRET

# 檢查時間戳是否同步
date
```

#### 2. 資料庫連線失敗
```bash
# 檢查資料庫檔案權限
ls -la data/shopline_oauth.db

# 檢查磁碟空間
df -h
```

#### 3. ngrok 連線問題
```bash
# 檢查 ngrok 狀態
curl http://localhost:4040/api/tunnels

# 重新啟動 ngrok
pkill ngrok
ngrok http 3000
```

### 日誌分析
```bash
# 查看應用日誌
tail -f logs/combined.log

# 查看錯誤日誌
tail -f logs/error.log

# 搜尋特定錯誤
grep "簽名驗證失敗" logs/combined.log
```

## 📈 性能優化

### 資料庫優化
```sql
-- 建立索引
CREATE INDEX idx_shop_handle ON oauth_tokens(shop_handle);
CREATE INDEX idx_expire_time ON oauth_tokens(expire_time);
CREATE INDEX idx_created_at ON oauth_tokens(created_at);

-- 清理過期 Token
DELETE FROM oauth_tokens 
WHERE expire_time < datetime('now');
```

### 快取設置
```javascript
// Redis 快取設置
const redis = require('redis')
const client = redis.createClient()

// 快取 Token 資料
async function getCachedToken(shopHandle) {
  const cached = await client.get(`token:${shopHandle}`)
  return cached ? JSON.parse(cached) : null
}

async function setCachedToken(shopHandle, tokenData) {
  await client.setex(`token:${shopHandle}`, 3600, JSON.stringify(tokenData))
}
```

### 負載均衡
```nginx
# nginx 配置
upstream shopline_oauth {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://shopline_oauth;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 更新和維護

### 版本控制
```bash
# 標記版本
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0

# 建立發布分支
git checkout -b release/v1.1.0
```

### 零停機更新
```bash
# 使用 PM2 進行零停機更新
pm2 reload shopline-oauth-app

# 或使用 Docker 滾動更新
docker-compose up -d --no-deps app
```

### 監控更新
```javascript
// 版本檢查端點
app.get('/version', (req, res) => {
  res.json({
    version: process.env.npm_package_version,
    build: process.env.BUILD_NUMBER,
    timestamp: new Date().toISOString()
  })
})
```

---

## 📋 部署檢查清單

### 部署前檢查
- [ ] 環境變數設置正確
- [ ] 資料庫連線正常
- [ ] HTTPS 憑證有效
- [ ] 防火牆規則正確
- [ ] 監控系統就緒

### 部署後驗證
- [ ] 健康檢查通過
- [ ] OAuth 流程正常
- [ ] 資料庫操作正常
- [ ] 日誌記錄正常
- [ ] 監控指標正常

### 維護任務
- [ ] 定期備份資料庫
- [ ] 清理過期 Token
- [ ] 更新依賴套件
- [ ] 檢查安全漏洞
- [ ] 性能監控分析
