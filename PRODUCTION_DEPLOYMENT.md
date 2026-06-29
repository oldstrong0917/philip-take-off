# 🚀 Production Deployment Guide

此指南說明如何在生產環境中部署 Philip Memorial Platform，並配置自動 SSL 續期。

## 📋 前置要求

- ✅ 已購買域名（例：`memorial.example.com`）
- ✅ 域名 DNS 已指向伺服器 IP
- ✅ 伺服器已安裝 Docker & Docker Compose
- ✅ 伺服器 80 和 443 埠已開放
- ✅ AWS S3 bucket 已建立（用於照片儲存）

## 🔧 第 1 步：準備環境變數

複製範本並填入你的實際值：

```bash
cp .env.prod.example .env.prod
nano .env.prod  # 或用你喜歡的編輯器
```

**必須填入的欄位：**
- `DB_PASSWORD`: 資料庫密碼（建議使用強密碼）
- `JWT_SECRET`: JWT 簽名密鑰（使用以下命令生成：`openssl rand -base64 32`）
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY`: AWS 認證資訊
- `S3_BUCKET_NAME`: S3 bucket 名稱
- `DOMAIN`: 你的域名（例：`memorial.example.com`）
- `CERTBOT_EMAIL`: 用於 SSL 續期通知的電郵

## 🔐 第 2 步：配置 Nginx

編輯 `nginx.conf`，將所有 `YOUR_DOMAIN` 替換為你的實際域名：

```bash
# 自動替換（Linux/Mac）
sed -i 's/YOUR_DOMAIN/memorial.example.com/g' nginx.conf

# 或手動編輯
nano nginx.conf
```

**檢查替換結果：**
```bash
grep "server_name\|ssl_certificate" nginx.conf
```

應該看到你的域名，而不是 `YOUR_DOMAIN`。

## 🔒 第 3 步：初始化 SSL 憑證

使用提供的初始化腳本自動申請 Let's Encrypt 憑證：

```bash
bash scripts/init-ssl.sh memorial.example.com admin@example.com
```

**流程說明：**
1. 驗證 nginx.conf 配置
2. 驗證 DNS 設定
3. 建立必要目錄
4. 啟動 Nginx
5. 向 Let's Encrypt 申請憑證
6. 啟動完整應用堆疊

✅ **成功信號：**
```
✅ SSL Setup Complete!
Your application is now available at:
   🌐 https://memorial.example.com
```

## ▶️ 第 4 步：啟動應用

### 方式 A：完整命令

```bash
# 設定環境變數
export $(cat .env.prod | grep -v '^#' | xargs)

# 啟動所有服務
docker compose -f docker-compose.prod.yml up -d

# 檢查服務狀態
docker compose -f docker-compose.prod.yml ps
```

### 方式 B：簡化命令（使用 alias）

```bash
# 在 ~/.bashrc 或 ~/.zshrc 中添加
alias philip-prod='docker compose -f docker-compose.prod.yml'

# 然後使用
philip-prod up -d
philip-prod ps
philip-prod logs -f frontend
```

## 📊 監控與維護

### 檢查服務狀態

```bash
docker compose -f docker-compose.prod.yml ps

# 查看即時日誌
docker compose -f docker-compose.prod.yml logs -f

# 查看特定服務日誌
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f backend
```

### 檢查 SSL 憑證狀態

```bash
# 查看所有憑證
bash scripts/check-ssl-expiry.sh

# 預期輸出：
# ✅ memorial.example.com: 85 days remaining (expires 2025-12-20 12:34:56)
```

### 手動續期憑證（不推薦，應自動進行）

```bash
bash scripts/renew-ssl-manual.sh memorial.example.com

# 或續期所有憑證
bash scripts/renew-ssl-manual.sh all
```

## 🔄 自動續期工作流程

當你使用 `docker-compose.prod.yml` 時，**自動續期已設置**：

1. **Certbot 容器** 持續運行
2. **每 12 小時** 自動檢查憑證
3. **在到期前 30 天內** 自動續期
4. **續期成功後** Nginx 會自動重新載入新憑證

**驗證自動續期是否運行：**

```bash
# 查看 certbot 容器日誌
docker compose -f docker-compose.prod.yml logs certbot

# 應該看到類似：
# "Renewing an existing certificate for memorial.example.com"
```

## 🚨 故障排除

### 問題 1：網站顯示 "SSL 憑證無效" 或 "無法驗證憑證"

**原因：** 憑證尚未正確安裝或 Nginx 未使用新憑證

**解決：**
```bash
# 重新啟動 Nginx
docker compose -f docker-compose.prod.yml restart nginx

# 驗證憑證路徑
docker compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/

# 檢查 Nginx 配置
docker compose -f docker-compose.prod.yml exec nginx nginx -t
```

### 問題 2：DNS 解析失敗

**錯誤信息：** "dns lookup failure"

**解決：**
```bash
# 驗證 DNS 指向是否正確
nslookup memorial.example.com
dig memorial.example.com

# 應該看到伺服器 IP
```

### 問題 3：憑證過期

**症狀：** 瀏覽器顯示 "ERR_CERT_DATE_INVALID"

**檢查現狀：**
```bash
bash scripts/check-ssl-expiry.sh

# 如果已過期或即將過期
bash scripts/renew-ssl-manual.sh memorial.example.com
```

### 問題 4：無法連接到應用

**檢查：**
```bash
# 查看所有容器是否運行
docker compose -f docker-compose.prod.yml ps

# 查看錯誤日誌
docker compose -f docker-compose.prod.yml logs

# 檢查網路連接
docker compose -f docker-compose.prod.yml exec nginx ping frontend
docker compose -f docker-compose.prod.yml exec nginx ping backend
```

## 📈 性能優化建議

### 1. 啟用 HTTP/2 和 HSTS

✅ 已在 `nginx.conf` 中設定

### 2. 啟用 Gzip 壓縮

✅ 已在 `nginx.conf` 中設定

### 3. 設置資源快取

編輯 `nginx.conf` 添加：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 4. 監控和告警

建議設置：
- 定期檢查 SSL 憑證過期日期
- 設置伺服器上的日誌收集（ELK、Loki 等）
- 設置應用性能監控（APM）

## 🛡️ 安全性檢查清單

- [ ] 所有環境變數已設定，特別是 `JWT_SECRET` 和 `DB_PASSWORD`
- [ ] `.env.prod` 已添加到 `.gitignore`，不會提交到 Git
- [ ] 管理員密碼已修改（不使用預設的 `admin/admin123`）
- [ ] AWS IAM 使用者只有必要的 S3 權限
- [ ] 伺服器防火牆只開放必要埠口（80, 443）
- [ ] SSL 證書已成功安裝和驗證
- [ ] 自動備份已配置（資料庫）

## 📝 定期維護任務

### 每日
- [ ] 檢查應用日誌是否有錯誤

### 每週
- [ ] 驗證備份是否成功
- [ ] 檢查磁盤空間使用情況

### 每月
- [ ] 檢查 SSL 憑證狀態
- [ ] 更新 Docker 映像
- [ ] 審視應用性能指標

### 每季
- [ ] 審查和更新安全規則
- [ ] 測試備份恢復流程

## 📞 支持和資源

- **Let's Encrypt 文件：** https://letsencrypt.org/
- **Certbot 文件：** https://certbot.eff.org/
- **Nginx 文件：** https://nginx.org/en/docs/
- **Docker 文件：** https://docs.docker.com/

---

**提示：** 保存此指南的副本以供日後參考。建議在部署前充分測試所有步驟。
