/**
 * 迁移+脱敏脚本 — 搬运量化交易和渗透测试内容到知识库网站
 *
 * 量化交易  → zh/book3-quant/ （IP 脱敏）
 * 渗透测试  → zh/book4-pentest/ （学校名/地名/路径 脱敏）
 *
 * 用法: node scripts/migrate-other-content.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs'
import { resolve, dirname } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const KNOWLEDGE = '/home/openclaw/workspace/knowledge'

// ============================================
// 工具函数
// ============================================

function readSrc(relative) {
  const path = resolve(KNOWLEDGE, relative)
  return readFileSync(path, 'utf-8')
}

function safeWrite(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✓ ${filePath.replace(ROOT + '/', '')}`)
}

function copyWithMeta(srcRelative, destRelative, meta) {
  const content = readSrc(srcRelative)
  const wrapped = `---
title: ${meta.title}
description: ${meta.description}
---

${content}
`
  safeWrite(resolve(ROOT, destRelative), wrapped)
}

// ============================================
// 量化交易
// ============================================

const QUANT_DEST = resolve(ROOT, 'zh/book3-quant')
const QUANT_SRC = '量化交易'

function migrateQuant() {
  console.log('\n📊 量化交易')

  // 1. Ptrade互联方案 (IP脱敏)
  console.log('  🔗 Ptrade 互联方案...')
  let ptradeMd = readSrc(`${QUANT_SRC}/Ptrade互联方案.md`)
  ptradeMd = ptradeMd
    .replace(/101\.230\.90\.122/g, '[公网IP]')
    .replace(/152\.136\.254\.162/g, '[VPS IP]')
    .replace(/180\.169\.209\.203/g, '[仿真系统IP]')
    .replace(/PID: \d+/g, 'PID: [进程号]')
    .replace(/quant-300\/trade_log\.jsonl/g, './trade_log.jsonl')
  const ptradeWrapped = `---
title: Ptrade 外部互联方案
description: 量化交易 — Ptrade Windows 端与 VPS 的互联架构
---

${ptradeMd}
`
  safeWrite(resolve(QUANT_DEST, 'ptrade-guide.md'), ptradeWrapped)

  // 2. PE/PEG估值入门 (直接复制)
  console.log('  📈 PE/PEG 股票估值入门...')
  const peMd = readSrc(`${QUANT_SRC}/基础知识/PE-PEG股票估值入门.md`)
  const peWrapped = `---
title: PE 和 PEG — 股票估值基础知识
description: 量化交易 — 市盈率与 PEG 估值入门
---

${peMd}
`
  safeWrite(resolve(QUANT_DEST, 'pe-peg-valuation.md'), peWrapped)
}

// ============================================
// 渗透测试
// ============================================

const PENTEST_DEST = resolve(ROOT, 'zh/book4-pentest')
const PENTEST_SRC = '渗透测试'

function anonymizePentest(text) {
  return text
    // 学校名/地名 脱敏
    .replace(/济宁医学院继续教育学院/g, '某医学院继续教育学院')
    .replace(/济宁医学院/g, '某医学院')
    .replace(/济宁/g, '某')
    // URL 脱敏 (先替换完整域名，防止部分替换冲突)
    .replace(/jnmclms\.sccchina\.net/g, '[xxx]lms.sccchina.net')
    .replace(/jnmc\.sccchina\.net/g, '[xxx].sccchina.net')
    .replace(/jnmc/g, '[xxx]')
    // 本地路径脱敏
    .replace(/\/home\/openclaw\/\.openclaw\/workspace\//g, './workspace/')
    .replace(/\/home\/openclaw/g, '[用户目录]')
    // 其他个人信息
    .replace(/^>?\s*作者: .*$/gm, '')       // 移除作者行（含 blockquote 前缀）
}

function fixInternalLinks(text) {
  // 修复重命名后的内部链接（中文文件名 → 英文 slug）
  return text
    .replace(/《Kali-Linux-路由器渗透测试指南\.md》/g, '《Kali Linux 路由器渗透测试指南》')
    .replace(/\[Kali-Linux-路由器渗透测试指南\.md\]\(\.\/Kali-Linux-路由器渗透测试指南\.md\)/g, '[Kali Linux 路由器渗透测试指南](./kali-router-guide)')
    .replace(/\[渗透测试常用工具速查\.md\]\(\.\/渗透测试常用工具速查\.md\)/g, '[渗透测试常用工具速查](./tools-cheatsheet)')
}

function migratePentest() {
  console.log('\n🛡️ 渗透测试')

  // --- 无需脱敏 ---

  const plainCopies = [
    {
      src: `${PENTEST_SRC}/Kali-Linux-路由器渗透测试指南.md`,
      dest: 'kali-router-guide.md',
      title: 'Kali Linux 路由器渗透测试指南',
      desc: '使用 Kali Linux 对路由器进行安全评估的完整指南',
    },
    {
      src: `${PENTEST_SRC}/渗透测试常用工具速查.md`,
      dest: 'tools-cheatsheet.md',
      title: '渗透测试常用工具速查',
      desc: 'Nmap、Hydra、Metasploit 等常用渗透测试工具命令速查',
    },
    {
      src: `${PENTEST_SRC}/华为ET5321路由器渗透步骤.md`,
      dest: 'huawei-cpe-pentest.md',
      title: '华为 CPE 路由器渗透测试步骤',
      desc: '华为 4G LTE CPE 路由器的安全评估流程',
    },
  ]

  for (const { src, dest, title, desc } of plainCopies) {
    console.log(`  📄 ${title}...`)
    // 读取内容并修复内部链接
    let content = readSrc(src)
    content = fixInternalLinks(content)
    const wrapped = `---
title: ${title}
description: ${desc}
---

${content}
`
    safeWrite(resolve(ROOT, `zh/book4-pentest/${dest}`), wrapped)
  }

  // --- 需脱敏 ---

  // 1. Web自动化实践指南
  console.log('  🤖 反检测浏览器实践指南...')
  let autoMd = readSrc(`${PENTEST_SRC}/web-automation-guide.md`)
  autoMd = anonymizePentest(autoMd)
    // 去掉作者行（已被替换为空行）
    .replace(/^\n+---/, '---')
  const autoWrapped = `---
title: 反检测浏览器实践指南
description: Web 自动化 — 反检测浏览器与教育平台视频自动化实践
---

${autoMd}
`
  safeWrite(resolve(PENTEST_DEST, 'anti-detection-browser.md'), autoWrapped)

  // 2. 教育平台渗透笔记
  console.log('  📝 在线教育平台渗透笔记...')
  let eduMd = readSrc(`${PENTEST_SRC}/济宁医学院教育平台渗透笔记.md`)
  eduMd = anonymizePentest(eduMd)
  const eduWrapped = `---
title: 在线教育平台渗透笔记
description: 渗透测试 — 在线教育平台安全评估笔记
---

${eduMd}
`
  safeWrite(resolve(PENTEST_DEST, 'education-platform-pentest.md'), eduWrapped)
}

// ============================================
// 生成概览页
// ============================================

function writeLandingPages() {
  console.log('\n📝 概览页...')

  // 更新量化交易概览
  const quantIndex = `---
title: 量化交易
description: Python 量化交易知识整理
---

# 📊 量化交易

> Python 量化交易知识整理，策略开发、回测框架、风险管理。

## 📖 文章列表

- [🔗 Ptrade 外部互联方案](./ptrade-guide) — Ptrade Windows 端与 VPS 的互联架构
- [📈 PE/PEG 股票估值入门](./pe-peg-valuation) — 市盈率与 PEG 估值基础知识

## 计划中

- **策略开发** — 双均线、ETF 轮动、多因子等（整理中）
- **回测框架** — Backtrader、自定义回测引擎
- **风险管理** — 仓位管理、止损策略、最大回撤控制
`

  safeWrite(resolve(QUANT_DEST, 'index.md'), quantIndex)

  // 创建渗透测试概览
  const pentestIndex = `---
title: 渗透测试
description: 渗透测试知识整理 — 路由器安全、Web 自动化、工具速查
---

# 🛡️ 渗透测试

> 渗透测试技术笔记，仅用于对自有设备的授权安全评估。

## 📖 文章目录

### 🔧 路由器渗透测试

- [Kali Linux 路由器渗透测试指南](./kali-router-guide) — 从信息收集到漏洞利用的完整流程
- [华为 CPE 渗透测试步骤](./huawei-cpe-pentest) — 华为 4G LTE CPE 路由器的安全评估
- [渗透测试常用工具速查](./tools-cheatsheet) — Nmap、Hydra、Metasploit 命令速查

### 🤖 Web 自动化

- [反检测浏览器实践指南](./anti-detection-browser) — Camoufox 反检测浏览器与视频自动化
- [在线教育平台渗透笔记](./education-platform-pentest) — SPA 架构教育平台的安全分析

---

> ⚠️ **声明**：本站所有渗透测试内容均基于对自有设备的授权测试。未经授权对他人设备进行渗透测试属于违法行为。
`

  safeWrite(resolve(PENTEST_DEST, 'index.md'), pentestIndex)
}

// ============================================
// 入口
// ============================================

console.log('🔧 开始迁移量化交易和渗透测试内容...')

migrateQuant()
migratePentest()
writeLandingPages()

console.log('\n✅ 迁移完成！')
console.log(`   📊 量化交易 → zh/book3-quant/`)
console.log(`   🛡️ 渗透测试 → zh/book4-pentest/`)
console.log('\n   下一步: 更新 .vitepress/config.mts 中的 nav + sidebar')
