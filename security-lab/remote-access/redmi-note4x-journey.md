# 🔐 红米 Note 4X (mido) 折腾全记录

> 从官方 Nethunter 到 PixelExperience + NetHunter 内核 + Magisk 的完整进化史

---

## 一、设备信息

| 项目 | 内容 |
|:---|:---|
| **型号** | 红米 Note 4X (mido) |
| **处理器** | Snapdragon 625 (8核 A53) |
| **内存** | 3GB / 4GB |
| **存储** | 32GB / 64GB |
| **当前系统** | PixelExperience Android 13 |
| **内核** | NetHunter 4.9.326 (p3h3n9 编译) |
| **Root** | Magisk v27.0 |
| **Chroot** | Kali NetHunter ARM64 Full (15GB) |
| **BL 锁** | ✅ 已解锁 |

---

## 二、完整时间线

### 第一阶段：官方 Nethunter 时期 (2026-05-30)

**状态：** 红米使用官方 Kali Nethunter 镜像，内核 3.18.31-perf

```
设备: 红米 Note 4X → 反向隧道:SSH_PORT → VPS
连接: 通过 USB 连 Win10 (ADB), 或移动网 4G
```

**已知问题：**
- USB 攻击功能不可用（官方内核无 CONFIG_USB_GADGET）
- 移动网 IP 223.104.x.x 动态分配，ICMP 被运营商拦截
- 需通过反向 SSH 隧道连接 VPS
- 重启后 Nethunter chroot 不自启（无 Magisk）

**隧道架构：**
```
VPS(VPS_IP:SSH_PORT) ← 红米:TUN_PORT(autossh) ← Win10:PROXY_PORT → Win10 代理
红米通过 USB 连 Win10，Win10 通过 ADB 控制红米
```

**一键恢复脚本：** `/sdcard/redmi_restore.sh`
```bash
su -c sh /sdcard/redmi_restore.sh
# 内部执行 tunnel4.sh + start_sshd.sh
```

**autossh shebang 根因：**
Kali chroot 内的 `/usr/bin/autossh` 是 wrapper 脚本，shebang 为 `#!/bin/sh`。
Android 原生 shell 中 `/bin/sh` 不存在（只有 `/system/bin/sh`），
直接调用时报 "No such file or directory"。
**解决：** 通过 `su -c "chroot ..."` 进入 Kali 环境再执行。

**chroot 内已配：**
- `rc.local` — ssh + cron + autossh + VNC 自启
- `crontab` — 每分钟保活 autossh，每5分钟保活 VNC
- `autossh-tunnel.sh` — AUTOSSH_GATETIME=0 立即重连

---

### 第二阶段：决定刷机 (2026-06-08)

**目标：** 从官方 Nethunter 迁移到 PixelExperience + NetHunter 内核，获得：
1. 更新的 Android 版本（Android 13）
2. NetHunter 自定义内核（支持更多特性）
3. Magisk root（实现开机自启）
4. 更稳定的 Nethunter 体验

**SD 卡已有资源：**
| 文件 | 大小 | 用途 |
|:---|:---:|:---|
| `PixelExperience_mido-13.0-20230812-0633-OFFICIAL.zip` | 1.3GB | ROM |
| `NetHunter_kernel_mido_zLOS-19.1_by_p3h3n9.zip` | 22MB | NetHunter 内核 |
| `magisk_patched-30700_GsTGD.zip` | 15MB | Magisk |
| `OrangeFox-R11.0_1-Stable-tulip.zip` | 46MB | ❌ 机型错误 (tulip≠mido) |

**刷机流程：**
1. `adb reboot bootloader`
2. `fastboot flash recovery OrangeFox-R11.1_4-Unified-mido.img`
3. 进 Recovery → Wipe (Dalvik + System + Data + Cache)
4. 刷 PixelExperience ROM
5. 刷 NetHunter 内核 (Magisk 模块)
6. 重启系统

**注意事项：**
- OrangeFox 比 TWRP 更好用（动态分区兼容性好）
- Magisk 手动 patch boot 遇到 bootloop → 改用 app patch 安全通过
- NetHunter full zip 作为 Magisk 模块直接安装

---

### 第三阶段：刷机完成 (2026-06-08)

**最终状态 ✅**
- ROM: PixelExperience Android 13
- 内核: NetHunter 4.9.326 (p3h3n9)
- Root: Magisk v27.0
- Chroot: Kali NetHunter ARM64 Full 15GB
  - 开机自启 ✅ (Magisk service.d 脚本)
  - SSH 自启 ✅ (sshd, root/kali 密钥登录)
  - 网络 OK ✅ (DNS: 8.8.8.8 + 1.1.1.1)
- Bluebinder: 编译完成 (libglibutil → libgbinder → bluebinder)
- WiFi 修复: Captive portal 禁用 (captive_portal_detection_enabled=0)
- SSH 密钥: `~/BACKUP_DIR/SSH_KEY_NAME`

**备份位置：** `~/BACKUP_DIR/` — 180MB
包含：stock_boot / magisk / OrangeFox / 编译脚本 / SSH密钥

**详细文档：**
- [刷机步骤详解](./redmi-flash-guide.md) — 从 Fastboot 到 chroot 自启的完整步骤
- [NetHunter 汉化记录](./nethunter-hanhua-guide.md) — 712 条翻译 v1→v4 四版迭代

**连接方式：**
| 方式 | 说明 |
|:---|:---|
| ADB | `adb shell` |
| SSH chroot | `ssh -i KEY_NAME root@ROOTER_LAN_IP` |
| chroot 内工具 | msfconsole, nmap, sqlmap, aircrack-ng 等 |

**待办（用户叫停）：**
- MSF payload APK + meterpreter session
- 反向 SSH 隧道 (红米→VPS:TUN_PORT)

---

### 第四阶段：NetHunter APK 汉化 (2026-06-09)

**目标：** 将 NetHunter APK 界面翻译为中文

**翻译规模：** 712 条英文字符串 → 中文

**版本迭代：**
| 版本 | 状态 | 说明 |
|:---|:---:|:---|
| v1 | ❌ | apktool 重编失败 (Material Design 动效资源 $ 文件) |
| v2 | ❌ | 删 $ 资源文件 + 删 transition 标签 → aapt2 可编 |
| v3 | ✅ | APK 编译签名安装成功，界面显示中文 |
| v4 | ✅ | 修复：40 个 $ 重命名 + 19 处引用更新，稳定版 |

**v4 版修复要点：**
- **根因：** apktool 解码时把 Material Design 动画拆成 `$` 开头的文件
- **修复1：** `rename_dollar_files.py` — 40 个 `$` 文件重命名
- **修复2：** 更新 19 处引用到新文件名
- **最终 APK：** `nethunter_zh_v4.apk` (26MB，已签名)

**完成状态：** ✅ 712 条完整中文界面，系统语言 zh-CN

---

### 最终架构图 (2026-06-09)

```
                          ┌─────────────────┐
                          │   VPS_CLOUD     │
                          │   VPS_IP        │
                          │  :SSH_PORT     │
                          └──────┬──────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
               SSH:TUN_PORT SSH:ASUS_PORT SSH:PROXY_PORT
                    │            │            │
              ┌─────┴─────┐ ┌───┴────┐ ┌───┴────┐
              │ 红米 mido  │ │ASUS    │ │Win10   │
              │ PE13+NH    │ │Kali    │ │DESKTOP │
              │ chroot SSH │ │远程节点 │ │桥接代理│
              └───────────┘ └────────┘ └────────┘
```

| 节点 | 连接方式 | 隧道 | 状态 |
|:---|:---|:---|:---:|
| **红米** | VPS:TUN_PORT → 红米 chroot SSH | autossh 自启 | ✅ |
| **ASUS Kali** | VPS:ASUS_PORT → ASUS SSH | autossh 自启 | ✅ |
| **Win10** | VPS → Win10:PROXY_PORT | 中间代理 | ❌ 断连 |

---

## 三、当前能力

| 能力 | 红米 | 说明 |
|:---|:---:|:---|
| SSH 远程终端 | ✅ | chroot 内完整 Kali 工具链 |
| RTL8812AU 无线监听 | ⏳ | 网卡已购，待到货 (6/10-11) |
| CSR8510 蓝牙嗅探 | ⏳ | 同上 |
| NetHunter 中文界面 | ✅ | v4 APK |
| Metasploit | ✅ | chroot 内 msfconsole |
| Nmap | ✅ | chroot 内 |
| Aircrack-ng | ⏳ | 需 RTL8812AU 到货 |
| 一加 8T 替代计划 | 🔲 | 备选采购 |

---

## 四、教训总结

1. **autossh shebang 坑** — Kali chroot 的 `#!/bin/sh` 在 Android 下不存在，必须通过 `su -c "chroot ..."` 调用
2. **apktool $ 文件坑** — Material Design 动效资源编译回 APK 时失败，需重命名文件 + 更新引用
3. **Magisk patch 坑** — 手动 patch boot.img 导致 bootloop，改用 Magisk app 内 patch 安全通过
4. **OrangeFox > TWRP** — 在动态分区手机上 OrangeFox 兼容性更好
5. **Captive portal 检测** — Android 13 的无网络告警通过 `captive_portal_detection_enabled=0` 禁用
