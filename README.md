# StarVote

轻量级的评分投票系统，可自部署并选择 LeanCloud 或 Supabase 作为数据库。

## 数据库后端

通过环境变量 `DATA_BACKEND` 选择后端：

- `leancloud`（默认）：使用 LeanCloud
- `supabase`：使用 Supabase

对外 API 完全一致，切换后端只需修改环境变量。

### LeanCloud

需要在 LeanCloud 控制台创建两个表：

- `Vote`
- `Rating`

### Supabase

1. 在 Supabase 控制台打开 SQL Editor，执行 [supabase/schema.sql](supabase/schema.sql)
2. 在 Project Settings → API 中复制 Project URL 和 service_role key
3. 将 `DATA_BACKEND` 设置为 `supabase`，并配置对应的环境变量

## 环境变量

| 变量 | 说明 |
|---|---|
| `DATA_BACKEND` | `leancloud`（默认）或 `supabase` |
| `LEANCLOUD_APP_ID` | LeanCloud App ID |
| `LEANCLOUD_APP_KEY` | LeanCloud App Key |
| `LEANCLOUD_SERVER_URL` | LeanCloud API 地址 |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key（仅服务端使用，切勿暴露给前端） |
| `HOSTS` | 允许的 Referer 域名（逗号分隔，如 `localhost, xaoxuu.com`） |
