# Philip Memorial Platform / Philip 追思紀念平台

> 繁中為主，附英文關鍵詞，方便本地協作與跨團隊交接。  
> Traditional Chinese first with English keywords for onboarding and handoff.

## 1) 專案簡介 (Project Overview)

這是一個「追思留言與照片紀念平台」，提供：

- 公開訪客提交留言與照片（含尺寸驗證）
- 公開頁面瀏覽所有已公開留言
- 管理者登入後進行留言維護（編輯、刪除、置頂、批次下載）

系統由三個核心服務組成：

- `frontend`：Next.js 前端網站（Port `3000`）
- `backend`：Express + Apollo GraphQL API（Port `4000`）
- `postgres`：資料庫（Port `5432`）

服務編排定義於 `docker-compose.yml`。

> Compose 專案名稱與 Postgres volume 已固定，避免因資料夾路徑變動而建立新資料卷導致資料看似遺失。

---

## 2) 核心特色 (Key Features)

- **公開留言流程 (Public Condolence Flow)**：上傳照片 + 文字祝福 + 是否公開
- **雙層圖片尺寸驗證 (Dual Image Validation)**：前端預檢 + 後端 `sharp` 最終驗證
- **管理後台 (Admin Dashboard)**：
  - JWT 登入保護
  - 置頂/取消置頂
  - 單筆與批次刪除
  - 單筆與批次下載（S3 簽名 URL）
- **S3 檔案儲存 (S3 Storage)**：照片上傳 S3，查詢時動態簽名下載連結

---

## 3) 技術棧 (Tech Stack)

### Frontend

- Next.js 16 (App Router)
- React 19 + TypeScript
- Apollo Client 4
- Tailwind CSS 4
- react-hook-form, Swiper, GSAP

### Backend

- Node.js + TypeScript
- Express 5
- Apollo Server (GraphQL)
- Knex + PostgreSQL
- JWT (`jsonwebtoken`) + bcryptjs
- Multer + Sharp
- AWS SDK v3 (S3)

### Infra / Tooling

- Docker + Docker Compose
- Jest（後端測試）

---

## 4) 系統架構 (Architecture)

```mermaid
flowchart LR
  user[UserVisitor] --> frontend[FrontendNextJs]
  admin[AdminUser] --> frontend
  frontend -->|"GraphQL Query/Mutation"| backend[BackendExpressApollo]
  backend -->|"ReadWrite"| db[(PostgreSQL)]
  backend -->|"Upload/Delete/SignUrl"| s3[(AWS_S3)]
```

### 資料流說明 (Data Flow)

1. 使用者於前端頁面送出 GraphQL 請求。
2. 一般查詢與管理操作透過 Apollo Client 連線至 `backend`。
3. 檔案上傳情境使用 `multipart/form-data` 直送 `/graphql`。
4. 後端 resolver 依需求讀寫 PostgreSQL，並與 S3 互動。
5. 查詢照片時，後端將原始 S3 URL 轉為具時效性的簽名 URL 回傳。

---

## 5) 專案結構 (Project Structure)

```text
philip-take-off/
├─ frontend/                     # Next.js 前端
│  ├─ src/app/                   # 路由頁面
│  ├─ src/components/            # 共用元件
│  ├─ src/graphql/               # 前端 Query/Mutation 定義
│  └─ src/lib/apolloClient.ts    # Apollo Client 與 JWT header
├─ backend/                      # Express + GraphQL 後端
│  ├─ src/index.ts               # 入口、middleware、/graphql
│  ├─ src/graphql/               # typeDefs + resolvers
│  ├─ src/db/migrations/         # DB migration
│  ├─ src/db/seeds/              # 初始資料（admin）
│  ├─ src/middleware/auth.ts     # JWT 驗證
│  └─ src/utils/                 # S3 + 圖片尺寸驗證
└─ docker-compose.yml            # 三服務編排
```

---

## 6) 前端設計與頁面 (Frontend Design)

主要路由（App Router）：

- `/`：首頁（追思主視覺 + 輪播 + CTA）
- `/messages`：公開留言與照片列表（含置頂標示）
- `/condolence`：留言表單 + 照片上傳 + 飛機動畫
- `/admin/login`：管理者登入頁
- `/admin/dashboard`：後台管理頁

互動設計重點：

- 導覽列採 RWD（桌機連結 + 手機漢堡選單）
- 上傳頁先取得 `photoLimits`，前端預先驗證照片尺寸
- 送出成功後切換到紙飛機動畫，完成後導回首頁

---

## 7) 後端設計與執行細節 (Backend Design & Runtime)

後端入口：`backend/src/index.ts`

- 啟動 Express + Apollo Server
- 註冊 `/graphql` endpoint
- 中介層串接：
  - `multer.single("photo")` 接收圖片
  - `express.json()` 解析 JSON 請求
  - multipart `operations` 轉寫成 `req.body`
- 在 GraphQL context 注入：
  - `admin`（Bearer JWT 驗證結果）
  - `file`（上傳圖片 buffer/mimetype/originalname）

Resolver 重要行為：

- `createCondolence`：
  1. 驗證有無上傳檔案
  2. 使用 `sharp` 驗證尺寸
  3. 上傳 S3
  4. 寫入 PostgreSQL
- `photos`：
  - 僅回傳 `is_public = true` 的留言
  - 先依 `is_pinned` 再依時間排序
- 後台 mutation（更新/刪除/置頂/批次）：
  - 一律需通過 `getAdminFromContext` 授權

---

## 8) 資料庫設計 (Database Schema)

### `admin_users`

- `id` (PK)
- `username` (unique)
- `password_hash`
- `created_at`, `updated_at`

### `condolences`

- `id` (UUID PK)
- `relationship`
- `how_met`
- `message`
- `photo_url`
- `photo_width`, `photo_height`
- `is_public` (default false)
- `is_pinned` (default false)
- `pinned_at` (nullable)
- `created_at`

Migration 位於：

- `backend/src/db/migrations/001_create_tables.ts`
- `backend/src/db/migrations/002_add_public_and_pinned.ts`

---

## 9) GraphQL API 概覽 (API Reference)

Endpoint: `POST /graphql`

### Query

- `condolences(limit, offset)`：後台列表
- `condolence(id)`：單筆查詢
- `photos`：公開頁使用的照片/留言列表
- `photoLimits`：上傳尺寸限制

### Mutation

- `createCondolence`：建立留言（搭配照片上傳）
- `adminLogin`：管理者登入，回傳 JWT
- `updateCondolence`：編輯留言
- `togglePinCondolence`：置頂切換
- `deleteCondolence`：刪除單筆
- `batchDeleteCondolences`：批次刪除
- `batchDownloadPhotos`：批次取得下載 URL

Schema 定義：`backend/src/graphql/typeDefs.ts`

---

## 10) 環境變數 (Environment Variables)

請建立你自己的 `.env` / `.env.local`，不要提交實際金鑰。

### Backend (`backend/.env`)

```bash
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/memorial_db
JWT_SECRET=replace-with-strong-secret

AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=memorial-photos

PHOTO_MIN_WIDTH=800
PHOTO_MIN_HEIGHT=600
PHOTO_MAX_WIDTH=4096
PHOTO_MAX_HEIGHT=4096
```

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

---

## 11) 本機開發流程 (Local Development)

> 建議先啟動 PostgreSQL（本機或 Docker），再啟動後端與前端。

### Step 1. 啟動資料庫

若使用 Docker 啟 DB：

```bash
docker compose up -d postgres
```

### Step 2. 啟動 Backend

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

Backend 預設：http://localhost:4000/graphql

### Step 3. 啟動 Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend 預設：http://localhost:3000

---

## 12) Docker Compose 一鍵啟動 (Container Run)

在專案根目錄執行：

```bash
docker compose up --build
```

若你要測試「照片上傳到 S3」，建議先在專案根目錄準備 `.env`（給 compose 變數替換）：

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
```

服務預設：

- Frontend: `http://localhost:3000`
- Backend GraphQL: `http://localhost:4000/graphql`
- Postgres: `localhost:5432`

停止服務：

```bash
docker compose down
```

若要連同資料卷移除：

```bash
docker compose down -v
```

---

## 13) 管理者帳號 (Admin Account)

Seed 預設建立帳號：

- username: `admin`
- password: `admin123`

來源：`backend/src/db/seeds/001_admin_user.ts`

上線前請務必：

- 修改預設密碼策略
- 改用安全初始化流程（例如 CI/CD 或秘密管理服務）

---

## 14) 安全與維運建議 (Security & Operations)

- **不要提交密鑰 (No Secrets in Git)**：`.env`、雲端金鑰、JWT secret 不可入版控
- **立即輪替憑證 (Rotate Credentials)**：若任何憑證曾曝光，請立刻重發
- **分環境設定 (Environment Isolation)**：dev/staging/prod 使用不同 DB、S3 bucket、JWT secret
- **最小權限原則 (Least Privilege)**：AWS IAM 僅開啟必要 S3 權限
- **觀測與告警 (Observability)**：建議加入 API error logging 與基本 metrics

---

## 15) 常見操作指令 (Useful Commands)

### Backend

```bash
npm run dev
npm run build
npm run start
npm run migrate
npm run migrate:rollback
npm run seed
npm run migrate:prod
npm run migrate:status:prod
npm run seed:prod
npm run admin:reset:prod
npm test
```

### Frontend

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

## 16) Troubleshooting

- **Docker 重建後資料不見**
  - 確認 `docker-compose.yml` 已固定 `name: philip-take-off`
  - 確認 volume 名稱固定為 `philip-take-off_pgdata`
- **正式環境 migration 執行失敗**
  - 使用 `npm run migrate:prod`（容器內）
  - 使用 `npm run migrate:status:prod` 檢查狀態
- **管理者登入失敗（帳密不對）**
  - 在 backend 容器內執行：
    - `ADMIN_USERNAME=admin ADMIN_PASSWORD=<new-password> npm run admin:reset:prod`
- **前端無法連後端**
  - 檢查 `NEXT_PUBLIC_GRAPHQL_URL` 是否正確
  - 確認後端已啟動於 `:4000`
- **上傳失敗**
  - 檢查檔案是否為圖片且尺寸在限制內
  - 檢查 AWS 憑證與 S3 bucket 設定
- **管理後台一直跳回登入頁**
  - 檢查瀏覽器 `localStorage.admin_token` 是否存在
  - token 過期請重新登入
- **GraphQL 操作被拒絕**
  - 確認是否為需要管理者權限的 mutation

---

## 17) Future Improvements

- 導入 refresh token / 更完整 session 管理
- 上傳流程加入縮圖與圖片最佳化
- 後台加入搜尋、篩選與分頁
- 補齊 E2E 測試與 API 合約測試

