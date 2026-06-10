# Git 推送安全规则

## 推送前必须检查

### 1. 内容扫描
推送前 `git diff --cached` 检查即将提交的内容，逐一确认无不安全信息：
- ❌ IP 地址（如 `192.168.x.x`、`10.x.x.x`、公网 IP）
- ❌ 域名（如 `xxx.xyz` 等个人域名）
- ❌ 端口号（如 `:SSH_PORT`、`:PROXY_PORT`）
- ❌ 用户名（如 `used`、`root` 等服务器账户）
- ❌ API Key / Token / 密码
- ❌ 真实路径（如 `/home/xxx/`）

### 2. 替换规则
敏感信息必须替换为占位符：
- IP → `VPS_IP` / `LAN_IP` / `HOST_IP`
- 端口 → `SSH_PORT` / `MSF_PORT`
- 用户名 → `USERNAME`
- 域名 → `DOMAIN_XYZ`

### 3. 确认流程
1. `git status` 看改了哪些文件
2. `git diff --cached` 扫描内容
3. 发现敏感信息 → 替换后重新 add
4. 确认无误 → 再 commit + push

### 4. 补救机制
如果不小心已推送敏感信息：
1. 立即修复文件
2. `git commit --amend` 重写最近 commit
3. `git push --force` 强制推送清除
4. 注意：**force push 会改变 commit hash**，仅单人仓库安全

---

**这条规则写入 `owoer-tech/SECURITY.md`，每次推送前重温。**