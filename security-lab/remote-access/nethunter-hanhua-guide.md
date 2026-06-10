# NetHunter APK 汉化全记录

> 712 条英文字符串 → 中文 · v1 → v4 四版迭代

---

## 一、汉化规模

| 项目 | 数值 |
|:---|:---:|
| 翻译字符串 | 712 条 |
| 原始语言 | 英语 (en) |
| 目标语言 | 简体中文 (zh-rCN) |
| 最终 APK 大小 | 26MB |
| 版本迭代 | v1 → v4 |

---

## 二、环境准备

### 所需工具
```bash
# APK 反编译/重编译
apt install apktool aapt2 zipalign

# 签名工具（Android SDK 自带）
apksigner

# 查看 APK 内的字符串
# 或直接用 apktool 解码
apktool d Nethunter.apk -o Nethunter_decoded/
```

### 提取字符串
解码后的 `res/values/strings.xml` 就是目标文件：
```bash
# 提取所有英文字符串
grep '<string name=' res/values/strings.xml | wc -l
# 输出: 712
```

---

## 三、翻译流程

### 3.1 创建中文 strings.xml
```bash
# 创建中文翻译目录
mkdir -p res/values-zh-rCN/

# 复制英文 strings.xml 到中文目录
cp res/values/strings.xml res/values-zh-rCN/
```

### 3.2 编写翻译脚本
```python
# gen_zh_xml2.py — 批量翻译 strings.xml
import xml.etree.ElementTree as ET

# 翻译字典（英→中）
TRANSLATIONS = {
    "app_name": "NetHunter",
    "scan_networks": "扫描网络",
    "start_attack": "开始攻击",
    # ... 712 条
}
```

> **翻译要点：**
> - 技术术语保持一致性（如 session→会话、payload→载荷）
> - 专业工具名保留英文（如 Metasploit、Nmap）
> - 按钮/操作类短文本用简洁中文（如 Start→启动、Stop→停止）

---

## 四、版本迭代

### v1 — apktool 重编失败 ❌

**症状：** apktool 解码后无法重编
```
Error: Resource does not exist: $avd_xxx__N
```

**根因：** NetHunter APK 使用了 Material Design 动效资源，
apktool 解码时把动画描述文件拆成了带 `$` 前缀的文件名。
aapt2 拒绝处理文件名含 `$` 的资源。

### v2 — 删 $ 资源 + 删 transition 标签 ❌

**尝试：**
```bash
# 删除所有 $ 开头的资源文件
find . -name '\$*' -delete

# 删除所有 transition 标签引用
sed -i '/<transition.*\$.*>/d' res/*
```

**结果：** aapt2 能编译了，APK 可安装，但打开后崩溃。
因为删了资源文件导致动画引用失效。

### v3 — 完整重编成功 ✅

**方法：** 彻底清理 + 完整重编
```bash
apktool b Nethunter_decoded/ -o Nethunter_zh.apk

# 对齐
zipalign -p 4 Nethunter_zh.apk Nethunter_zh_aligned.apk

# 签名（使用 debug keystore）
apksigner sign --ks ~/.android/debug.keystore \
  --ks-pass pass:android \
  Nethunter_zh_aligned.apk
```

**结果：** 编译签名成功，安装到红米运行正常，界面显示中文 ✅

### v4 — 稳定版（推荐）✅

**修复内容：**
```
v4 版修复：
1. 40 个 $ 前缀 Material 动画文件 → 重命名为 anim_ 前缀
2. 19 处引用更新 → 指向新文件名
3. 完整中文界面 → 712 条全部翻译
```

**关键修复脚本：**
```python
# rename_dollar_files.py
import os, re

for root, dirs, files in os.walk('res/'):
    for f in files:
        if f.startswith('$'):
            new_name = 'anim_' + f[1:]  # $avd_xxx → anim_avd_xxx
            os.rename(os.path.join(root, f), os.path.join(root, new_name))
```

**最终命令：**
```bash
# 重命名
python3 rename_dollar_files.py

# 重编
apktool b Nethunter_decoded/ -o nethunter_zh_v4.apk
zipalign -p 4 nethunter_zh_v4.apk nethunter_zh_v4_aligned.apk
apksigner sign --ks ~/.android/debug.keystore \
  --ks-pass pass:android \
  nethunter_zh_v4_aligned.apk

# 安装
adb install nethunter_zh_v4_aligned.apk
```

**v4 最终 APK 信息：**
```
文件: nethunter_zh_v4.apk
大小: 26MB
签名: v1 + v2 + v3 (apksigner, debug.keystore)
系统语言: zh-CN 时自动显示中文
工具: apktool + aapt2 + zipalign + apksigner
```

---

## 五、技术要点总结

| 问题 | 解决方案 |
|:---|:---|
| apktool 解码后文件名含 `$` | rename 脚本批量重命名 |
| aapt2 拒绝 $ 文件 | 自定义前缀替换 |
| transition 动画引用断裂 | 重命名后同步更新引用 |
| APK 签名 | apksigner v1+v2+v3（debug.keystore） |
| 安装验证 | adb install，系统语言切换 zh-CN 确认 |

---

## 六、备份位置

最终 APK 及所有中间文件：
```
ASUS Kali: ~/redmi-刷机备份/nethunter-hanhua/
├── nethunter_zh_v4.apk          ← 最终版
├── Nethunter_decoded/           ← 解码目录
├── rename_dollar_files.py       ← 重命名脚本
├── gen_zh_xml2.py               ← 翻译生成脚本
├── strings_zh.xml               ← 中文翻译文件
└── build_log.txt                ← 构建日志
```
