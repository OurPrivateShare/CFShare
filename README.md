# CFShare

基于 **Cloudflare Workers + D1** 的二级域名分发平台。用户注册后即可在管理员开放的域名下申请二级域名并自助管理 DNS 解析；管理员可接入多个 Cloudflare 账号、按会员等级分配域名、发放兑换码。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/OurPrivateShare/CFShare)

[更新说明](UPDATE.md) · [MIT 许可证](LICENSE)

## 功能一览

### 用户端

- **邮箱验证码注册与找回密码**：通过管理员配置的 Gmail 发信，设有 60 秒冷却、每小时限额和 5 次错误失效机制。
- **申请二级域名**：选择后缀、输入前缀、检查可用性后申请；高等级专属域名对低等级用户显示为锁定，并引导升级。
- **解析管理**：支持 A、AAAA、CNAME、TXT、MX、NS、CAA 记录，以及 `@`、多级主机记录、通配符、TTL、MX 优先级和 Cloudflare CDN 代理开关，具体权限由套餐控制。
- **会员升级**：通过兑换码升级，同等级自动叠加续期，高等级立即升级；展示套餐对比与购买方式。
- **账户中心**：修改密码时自动注销其他设备，支持查询兑换记录。

### 管理端

| 模块 | 说明 |
| --- | --- |
| 控制台 | 用户、会员、域名与收入统计，部署检查清单和最近动态 |
| 用户管理 | 搜索筛选、设置会员等级与有效期、设为管理员、重置密码（可邮件通知）、封禁（可同时清除解析）、删除（同步删除 Cloudflare 记录）、手动建号 |
| 会员套餐 | 普通、高级、特级三档，可配置名称、价格展示、域名数量、每域名记录数、记录类型、CDN 代理权限和前缀最短长度 |
| 兑换码 | 批量生成，可配置等级、时长（月、季、年、永久或自定义）、每码使用次数、面值、有效期、前缀和备注；支持通用优惠码、停用和 TXT 导出，面值用于收入统计 |
| API Token | 支持来自多个 Cloudflare 账号的 Token，添加前先验证；展示可获取的用户邮箱与 ID、账户名称与 ID、Token ID 和过期时间；Token 以 AES-GCM 加密存储 |
| 域名管理 | 从所有 Token 同步域名，**默认不开放**；可逐个设置开放状态、最低会员等级、前缀最短与最长长度、备注，并显示所属账户与 Token |
| 用户域名 | 全站二级域名检索与回收 |
| 邮箱收件 | 通过 IMAP 读取 Gmail 收件箱，仅在打开页面时读取，详见[资源优化](#资源优化) |
| 系统设置 | 站点名称、公告、注册开关、购买说明与链接、Gmail 邮箱及应用专用密码、默认前缀长度和保留前缀 |
| 操作日志 | 登录、申请、解析、兑换、后台操作全量留痕，保留 90 天 |

## 部署步骤

### 准备 APP_SECRET

`APP_SECRET` 用于加密敏感数据、校验密码和签名登录会话，也是首次初始化管理员时需要填写的密钥。部署前使用以下命令生成密钥：

```bash
openssl rand -hex 32
```

命令会生成 32 字节随机值，以 64 位十六进制字符串输出。妥善保存这段字符串，并在下列任一部署方式中将其设为 `APP_SECRET`。服务端要求密钥至少 16 位。

> **部署后请勿修改 `APP_SECRET`**：更换密钥会导致已有 Token、邮箱密码无法解密，并影响密码校验与登录会话。

### 方式一：一键部署（推荐）

1. 点击上方 **Deploy to Cloudflare** 按钮，或进入[一键部署页面](https://deploy.workers.cloudflare.com/?url=https://github.com/MyPrivateShare/CFShare)。
2. 登录 Cloudflare 并授权 GitHub（会自动在你的 GitHub 下复制一份仓库）。
3. 在配置页：

   - **D1 数据库**：保持默认，系统会自动创建。
   - **APP_SECRET**：填入前面生成的密钥。

4. 点击 **Create and deploy**，等待构建与部署完成。
5. 打开 Cloudflare 分配的 Worker 地址，进入**初始化管理员**页面，填写管理员邮箱、密码和刚才的 `APP_SECRET`。

> 数据表会在首次访问时自动创建，无需手动执行迁移。

### 方式二：从 Cloudflare 控制台导入仓库

1. 在 GitHub 上 [Fork 本仓库](https://github.com/MyPrivateShare/CFShare/fork)。
2. 进入 [Cloudflare Workers 创建页面](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create)，选择 **Import a repository**，导入你的仓库。部署命令保持为 `npx wrangler deploy`，然后点击 **Deploy**。
3. 部署完成后，进入该 Worker 的 **Settings → Variables and Secrets**，添加名为 `APP_SECRET` 的 **Secret**，值为前面生成的密钥。
4. 访问 Worker 地址完成初始化。

`wrangler.jsonc` 中不包含 `database_id`，首次部署时 Wrangler 会自动创建并绑定 D1 数据库。

### 方式三：命令行

```bash
git clone https://github.com/MyPrivateShare/CFShare.git
cd CFShare
npm install
npx wrangler login
npx wrangler deploy
npx wrangler secret put APP_SECRET
```

首次部署会自动创建 D1 数据库，无需填写 `database_id`。执行最后一条命令时，按提示粘贴前面生成的密钥，然后访问 Worker 地址完成初始化。

## 本地开发

1. 克隆仓库后执行 `npm install`，安装开发依赖。
2. 将 `.dev.vars.example` 复制为 `.dev.vars`，把 `APP_SECRET` 替换为前面生成的密钥。
3. 执行 `npm run dev`，启动本地开发服务。

`.dev.vars` 用于保存本地密钥，已由 `.gitignore` 排除，不应提交到仓库。

## 上线后的配置

### 1. 配置 Gmail 发信与收信

进入后台的 **系统设置 → 邮箱配置**，填写 Gmail 邮箱与应用专用密码，其他选项保持默认：

1. 在 [Google 账号安全设置](https://myaccount.google.com/signinoptions/twosv)中开启两步验证。
2. 生成 [Gmail 应用专用密码](https://myaccount.google.com/apppasswords)（16 位，空格可保留）。
3. 在 [Gmail 收信设置](https://mail.google.com/mail/u/0/#settings/fwdandpop)中确认已开启 IMAP。
4. 保存后点击「发送测试邮件」验证。

> 发信使用 `smtp.gmail.com:465`，收信使用 `imap.gmail.com:993`，均通过 Workers 原生 TCP Socket 建立加密连接，无需第三方邮件服务。

### 2. 添加 Cloudflare API Token

进入后台的 **API Token → 添加 Token**，按以下步骤创建并接入 Token：

1. 打开 [Cloudflare API Token 管理页面](https://dash.cloudflare.com/profile/api-tokens)，点击 **Create Token**，选择 **Edit zone DNS** 模板。
2. 按下表配置权限：

   | 类型 | 资源 | 权限 | 用途 |
   | --- | --- | --- | --- |
   | Zone | DNS | Edit | 必需：增删改解析 |
   | Zone | Zone | Read | 必需：同步域名列表 |
   | User | User Details | Read | 可选：显示用户邮箱与 ID |
   | Account | Account Settings | Read | 可选：显示账户名称与 ID |

3. 在 **Zone Resources** 中选择 **All zones**，或指定要分发的域名。
4. 复制 Token，在后台粘贴并点击**验证**，确认信息后添加。接入多个 Cloudflare 账号时，重复上述步骤即可。

### 3. 开放域名

进入后台的**域名管理**，为需要分发的域名打开「开放」开关，设置最低会员等级与前缀长度，然后点击「保存」。

会员等级向上兼容：选择「普通会员及以上」时，所有用户均可申请；选择更高等级时，仅对应等级及以上用户可申请。

### 4. 绑定自定义域名（可选）

进入 Worker 的 **Settings → Domains & Routes → Add → Custom Domain**，添加自定义域名。绑定后可启用边缘 Cache API，进一步减少重复请求。

## 资源优化

针对 Cloudflare 免费套餐优化：Workers 每天 10 万次请求、单次 10 ms CPU、50 次子请求；D1 每天 500 万行读、10 万行写。

| 优化点 | 实现 |
| --- | --- |
| 静态资源分流 | 页面、JS、CSS 通过 Workers Static Assets 由边缘直接返回，不计入 Worker 请求次数；只有 `/api/*` 才唤起 Worker |
| 单页应用 | 原生 JavaScript，无框架、外部字体与 CDN 依赖（gzip 后约 25 KB）；首屏一次 `/api/bootstrap` 请求获取站点、用户与套餐信息 |
| 智能放置 | 开启 Smart Placement，Worker 自动靠近 D1 运行，降低数据库往返延迟 |
| 无状态会话 | HMAC 签名 Cookie，无需会话表；改密或封禁时通过 `token_version` 使旧会话即时失效 |
| 实例级缓存 | 系统设置缓存 30 秒、解密后的 Token 缓存 60 秒，减少 D1 读取与解密 CPU |
| 按需读取邮件 | 收件箱只在管理员打开「邮箱收件」页时读取，不轮询、无定时任务；列表缓存 60 秒，单封邮件缓存 1 天；使用 `EXAMINE`（只读）与 `BODY.PEEK` 读取，列表只取头部，详情最多取 400 KB |
| 批量删除 | 删除域名或用户时，使用 DNS Batch API 批量删除记录，减少子请求数量 |
| 限流 | 登录、验证码、申请、解析、兑换均有基于 D1 的限流，防止刷接口耗尽额度 |
| 解析列表本地化 | 解析记录同步保存在 D1，查看列表不调用 Cloudflare API |
| 定时清理 | 每天一次 Cron 清理过期验证码、限流记录与 90 天前日志 |
| CPU 优化 | PBKDF2 迭代次数针对 10 ms CPU 限制调优，并叠加服务端 pepper（`APP_SECRET`） |

## 安全设计

- 密码使用 PBKDF2-SHA256、随机盐与服务端 pepper。
- Cloudflare Token、Gmail 应用密码使用 AES-256-GCM 加密存储。
- 会话 Cookie 启用 HttpOnly、SameSite=Lax，并在 HTTPS 下启用 Secure；写操作校验自定义请求头，防御 CSRF。
- SQL 查询使用参数绑定，动态文本进行 HTML 转义，邮件正文在无脚本沙箱 iframe 中渲染。
- 找回密码不泄露账号是否存在；验证码以哈希形式存储，5 次错误后失效。
- 初始化管理员需要校验 `APP_SECRET`，防止部署后被抢注。

## 目录结构

```text
├── .dev.vars.example    # 本地环境变量示例
├── .gitignore           # Git 忽略规则
├── public/              # 前端静态资源（边缘直出）
│   ├── index.html
│   ├── app.js           # 单页应用
│   ├── app.css
│   └── _headers         # 安全与缓存响应头
├── src/
│   ├── index.js         # Worker 入口与路由表
│   ├── lib/
│   │   ├── auth.js      # 会话、邮箱验证码
│   │   ├── cf.js        # Cloudflare API 客户端
│   │   ├── crypto.js    # 哈希、加密、签名
│   │   ├── db.js        # 自动建表、设置、限流、审计
│   │   ├── dns.js       # 前缀与记录校验、批量清理
│   │   ├── http.js      # 路由与工具
│   │   └── mail.js      # SMTP 发信 / IMAP 收信 / MIME 解析
│   └── routes/          # auth / user / admin 接口
├── package.json         # 项目信息与开发命令
├── pnpm-lock.yaml       # 依赖锁文件
├── UPDATE.md            # 更新说明
└── wrangler.jsonc       # Cloudflare Workers 配置
```

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
