# 红米 Note 4X 刷机详细步骤

> 从官方 MIUI → PixelExperience Android 13 + NetHunter 内核 + Magisk

---

## 一、前置准备

### 1.1 解锁 Bootloader
```
状态: ✅ 刷机前已解锁
提示: 解锁会清空所有数据，备份重要资料
```

### 1.2 所需文件

| 文件 | 大小 | 来源 | 用途 |
|:---|:---:|:---|:---|
| `PixelExperience_mido-13.0-*.zip` | 1.3GB | 官方下载 | Android 13 ROM |
| `NetHunter_kernel_mido_zLOS-19.1_by_p3h3n9.zip` | 22MB | XDA 论坛 | NetHunter 内核模块 |
| `OrangeFox-R11.1_4-Unified-mido.img` | ~50MB | orangefox.download | Recovery 替代 TWRP |
| `Magisk-v27.0.apk` | 15MB | GitHub | Root 管理 |

> **OrangeFox vs TWRP：** 在动态分区手机上 OrangeFox 兼容性更好，
> 特别是 mido 刷 PE13 这类新 ROM 时。如果 TWRP 解密失败或无法挂载分区，
> 换 OrangeFox 大概率解决。

### 1.3 备份
刷机前建议备份：
- `/sdcard` 下的个人文件（照片、下载等）
- WiFi 密码、短信等（可用 TitaniumBackup 或 Swift Backup）
- **当前 boot.img**（万一 Magisk patch 失败可恢复）

---

## 二、刷机流程

### Step 1: 进入 Fastboot 模式
```bash
# 手机开机状态下连接电脑，执行：
adb reboot bootloader

# 或手动操作：关机 → 音量下 + 电源键
```

### Step 2: 刷入 Recovery
```bash
# 确认设备已连接
fastboot devices

# 刷入 OrangeFox
fastboot flash recovery OrangeFox-R11.1_4-Unified-mido.img

# 分区到 recovery 后立即进入（不要重启进系统，会被覆盖）
# 音量上 + 电源键 进入 Recovery
```

### Step 3: Recovery 内操作
OrangeFox 启动后：
1. **Wipe** → 选 Advanced Wipe
   - Dalvik/ART Cache ✅
   - System ✅
   - Data ✅ （❗会清空应用数据）
   - Cache ✅
   - **不要选** Internal Storage（保留照片等文件）

2. **Install** → 选 ROM 文件
   - `PixelExperience_mido-13.0-*.zip`
   - 滑动确认刷入
   - ⏳ 等待约 3-5 分钟

### Step 4: 刷 NetHunter 内核
ROM 刷完后**不要重启**：
1. 回到 OrangeFox 主界面
2. **Install** → 选 NetHunter 内核包
   - `NetHunter_kernel_mido_zLOS-19.1_by_p3h3n9.zip`
3. 滑动确认安装
4. 安装完成后重启系统

### Step 5: 首次启动
重启后等待约 5-10 分钟首次启动
- 设置向导 → 跳过联网/WiFi
- 进入桌面后开启「开发者选项」
- 开启 **USB 调试** 和 **网络 adb 调试**

---

## 三、Magisk Root

### 方法一：App 内 Patch（推荐 ✅）
```bash
# 提取当前 boot.img
adb shell "su -c 'dd if=/dev/block/bootdevice/by-name/boot of=/sdcard/boot.img'"
adb pull /sdcard/boot.img

# 传到手机，用 Magisk app → 安装 → 选择并修补一个文件
# 选 boot.img → 开始修补 → 生成 magisk_patched-*.img

# 刷回修补后的 boot
adb push magisk_patched-*.img /sdcard/
adb shell "su -c 'dd if=/sdcard/magisk_patched-*.img of=/dev/block/bootdevice/by-name/boot'"
adb reboot
```

### 方法二：Recovery 刷 Magisk APK
OrangeFox 可以直接刷 Magisk APK（自动识别为 zip）：
1. Install → 选 `Magisk-v27.0.apk`
2. 滑动确认
3. 重启

> **⚠️ 手动 patch 坑：** 从 stock ROM 提 boot.img 用 Magisk patch 后再刷回，
> 有概率 bootloop。原因可能是 stock boot 和 custom ROM 的内核不兼容。
> **解决方案：** 用 Magisk app 内 patch（方法一）最安全。

---

## 四、安装 Kali NetHunter Chroot

### 4.1 下载 NetHunter APK
从 [GitHub releases](https://github.com/offensive-security/kali-nethunter-app/releases)
下载最新 NetHunter APK，侧载安装。

### 4.2 安装 Chroot
打开 NetHunter app：
1. **Kali Chroot** 标签页
2. 选 **Kali NetHunter ARM64 Full**
3. 点 **Install**（需要 WiFi，约 15GB 空间）
4. 等待下载并自动安装

安装完成后：
```bash
# 验证 chroot
su -c "chroot /data/local/nhsystem/kali-arm64 /bin/bash -c 'uname -a'"
```

### 4.3 配置中文环境（chroot 内）
```bash
su -c "chroot /data/local/nhsystem/kali-arm64 /bin/bash"

# 在 chroot 内执行：
apt update
apt install -y locales fonts-noto-cjk
locale-gen zh_CN.UTF-8
update-locale LANG=zh_CN.UTF-8
```

---

## 五、开机自启配置

### 5.1 Magisk service.d 脚本
创建 `/data/adb/service.d/nethunter.sh`：
```bash
#!/system/bin/sh
# 开机自启 Kali chroot

/data/adb/magisk/busybox chroot /data/local/nhsystem/kali-arm64 \
  /bin/bash -c "
    /etc/init.d/ssh start
    /etc/init.d/cron start
    nohup /root/autossh-tunnel.sh &
  "
```

```bash
# 设置权限
chmod 755 /data/adb/service.d/nethunter.sh
```

### 5.2 chroot 内 SSH 配置
```bash
su -c "chroot /data/local/nhsystem/kali-arm64 /bin/bash"
# 在 chroot 内：
echo "PermitRootLogin yes" >> /etc/ssh/sshd_config
echo "PasswordAuthentication no" >> /etc/ssh/sshd_config
service ssh restart
```

### 5.3 反向隧道 autossh
创建 `/root/autossh-tunnel.sh`：
```bash
#!/bin/bash
export AUTOSSH_GATETIME=0
export AUTOSSH_MAXSTART=9999

while true; do
  autossh -M 0 \
    -o "ServerAliveInterval=5" \
    -o "ServerAliveCountMax=3" \
    -o "ExitOnForwardFailure=yes" \
    -R TUN_PORT:localhost:22 \
    -i /root/.ssh/id_ed25519 \
    USERNAME@VPS_IP -p SSH_PORT
  sleep 10
done
```

> **常见坑：autossh shebang**
> Kali chroot 内的 `/usr/bin/autossh` 是 wrapper 脚本，shebang 为 `#!/bin/sh`。
> Android 原生 shell 中 `/bin/sh` 不存在，直接调用报错。
> **必须在 chroot 环境内执行**，不能从 Android shell 直接调用。

### 5.4 crontab 保活
```bash
# chroot 内
crontab -e
```

添加：
```
* * * * * /root/autossh-tunnel.sh 2>/dev/null
*/5 * * * * /usr/bin/vncserver 2>/dev/null
```

---

## 六、最终验证

```bash
# 1. 确认 Magisk 已安装
adb shell su -c "magisk -v"
# 输出: 27.0

# 2. 确认 chroot 可访问
adb shell su -c "chroot /data/local/nhsystem/kali-arm64 /bin/bash -c 'whoami'"
# 输出: root

# 3. 确认 SSH 可连接（从另一台机器或 VPS）
ssh -i SSH_KEY_NAME root@ROUTER_LAN_IP
# 成功进入 Kali chroot shell

# 4. 确认反向隧道
# 在 VPS 上：ssh -p TUN_PORT root@localhost
# 应该连接到红米 chroot
```

---

## 七、常见问题

| 问题 | 原因 | 解决 |
|:---|:---|:---|
| OrangeFox 无法挂载分区 | 旧版不支持动态分区 | 升级到 R11.1+ |
| 刷完 ROM 无限重启 | 没双清 | Recovery 内 Wipe Data |
| Magisk patch 后 bootloop | boot.img 不匹配 | 从当前 ROM 提取 boot.img 重 patch |
| ADB 连不上 | 驱动问题 | 换 USB 口或重装驱动 |
| chroot 空间不足 | /data 分区不够 | 删大文件或换 SD 卡 |
| autossh 报错 "No such file" | shebang 路径问题 | 确保在 chroot 内执行 |
