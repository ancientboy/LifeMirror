# Resend 邮箱验证码配置

LifeMirror 使用 Resend 发送邮箱登录验证码。首次验证成功会自动创建账户，已有账户会直接登录。

## 安全原则

- **不要把真实的 `RESEND_API_KEY` 写入源码、`.env.example`、README、Issue、提交信息或 Git 历史。**
- 本地开发使用未提交的 `.env` 或 `.env.local`。
- Sites 生产环境把 `RESEND_API_KEY` 配置为 Secret。
- `EMAIL_FROM` 可以作为普通环境变量保存。
- 测试 Key 与生产 Key 分开；正式上线前轮换测试 Key。
- 如果 Key 曾经出现在聊天、日志或 Git 中，应立即在 Resend 撤销并创建新 Key。

## 所需变量

```dotenv
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
EMAIL_FROM=LifeMirror <login@auth.lumeword.com>
```

仓库中的 `.env.example` 只保留空值或示例值，真实 Key 不应提交。

## Resend 后台配置

1. 在 Resend 添加并验证发件域名 `auth.lumeword.com`。
2. 按 Resend 提示配置 DNS 记录并等待状态变为 Verified。
3. 创建仅用于 LifeMirror 的 API Key。
4. 发件地址使用 `LifeMirror <login@auth.lumeword.com>`。

## 本地开发

```bash
cp .env.example .env
```

然后在本地 `.env` 中填入真实值。该文件已被 `.gitignore` 忽略。

## Sites 生产配置

在 LifeMirror 的 Sites 项目环境变量中添加：

| 变量 | 类型 | 示例 |
|---|---|---|
| `RESEND_API_KEY` | Secret | Resend 生成的 Key |
| `EMAIL_FROM` | 普通变量 | `LifeMirror <login@auth.lumeword.com>` |

修改 Secret 后需要重新部署，运行中的旧版本不会自动读取新值。

## 代码读取方式

服务端只通过运行时环境读取密钥：

```js
const apiKey = env.RESEND_API_KEY;
const from = env.EMAIL_FROM;
```

不要为缺失变量设置真实密钥作为源码默认值。缺少配置时应返回明确的服务未配置错误。

## 上线验证

1. 使用测试邮箱请求验证码。
2. 确认邮件来自 `login@auth.lumeword.com`。
3. 确认验证码 10 分钟内有效且只能使用一次。
4. 检查 60 秒冷却、请求限流和错误尝试次数限制。
5. 首次邮箱验证后确认自动创建账户。
6. 同一邮箱再次验证后确认登录原账户。
7. 在另一台设备登录，确认 D1 中的数据可以同步。

## Key 轮换

1. 在 Resend 创建新 Key。
2. 更新 Sites 的 `RESEND_API_KEY` Secret。
3. 重新部署并完成一次验证码实发测试。
4. 撤销旧 Key。
5. 检查 Resend 日志，确认没有异常发送。
