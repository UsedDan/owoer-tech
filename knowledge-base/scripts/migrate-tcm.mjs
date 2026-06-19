/**
 * 内容搬运脚本 — 从 knowledge/ 搬师承内容到网站目录
 *
 * 用法: node scripts/migrate-tcm.mjs [all|科目序号...]
 *   例: node scripts/migrate-tcm.mjs all           # 全部 10 科
 *   例: node scripts/migrate-tcm.mjs 1 2           # 只搬 1-2 科
 *   例: node scripts/migrate-tcm.mjs 1 2 3         # 搬 1-3 科
 *
 * 映射表：
 *   序号 → 科目中文名 → 网站目录 → skill 章节
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'

// ============================================
// 配置
// ============================================
const ROOT = resolve(import.meta.dirname, '..')
const WEB_DIR = resolve(ROOT, 'zh/book1-tcm')
const KNOWLEDGE_DIR = '/home/openclaw/workspace/knowledge/学习/师承考试'
const SKILL_DIR = '/home/openclaw/.claude/skills/师承考核指导/chapters'

const SUBJECTS = [
  {
    id: '01-basic-theory',
    name: '中医基础理论',
    webDir: '01-basic-theory',
    skillFile: 'ch03-basic-theory.md',
  },
  {
    id: '02-diagnostics',
    name: '中医诊断学',
    webDir: '02-diagnostics',
    skillFile: 'ch04-diagnostics.md',
  },
  {
    id: '03-pharmacology',
    name: '中药学',
    webDir: '03-pharmacology',
    skillFile: 'ch05-herbology.md',
  },
  {
    id: '04-prescriptions',
    name: '方剂学',
    webDir: '04-prescriptions',
    skillFile: 'ch06-formulary.md',
  },
  {
    id: '05-internal-med',
    name: '中医内科学',
    webDir: '05-internal-med',
    skillFile: 'ch07-internal-med.md',
  },
  {
    id: '06-surgery',
    name: '中医外科学',
    webDir: '06-surgery',
    skillFile: 'ch08-surgery.md',
  },
  {
    id: '07-gynecology',
    name: '中医妇科学',
    webDir: '07-gynecology',
    skillFile: 'ch09-gynecology.md',
  },
  {
    id: '08-pediatrics',
    name: '中医儿科学',
    webDir: '08-pediatrics',
    skillFile: 'ch10-pediatrics.md',
  },
  {
    id: '09-acupuncture',
    name: '针灸学',
    webDir: '09-acupuncture',
    skillFile: 'ch11-acupuncture.md',
  },
  {
    id: '10-practice',
    name: '实践技能考核',
    webDir: '10-practice',
    skillFile: 'ch02-clinical-defense.md',
  },
]

// ============================================
// 工具函数
// ============================================

/** 读取文件，返回内容 + frontmatter */
function readWithFrontmatter(filePath) {
  const raw = readFileSync(filePath, 'utf-8')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (fmMatch) {
    return { frontmatter: fmMatch[1], content: fmMatch[2].trim(), raw }
  }
  return { frontmatter: null, content: raw.trim(), raw }
}

/** 注入 VitePress frontmatter */
function wrapVitepress(content, { title, description }) {
  return `---
title: ${title}
description: ${description}
---

${content}
`
}

/** 安全写文件 */
function safeWrite(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✓ ${filePath.replace(ROOT + '/', '')}`)
}

// ============================================
// 主逻辑
// ============================================

function migrate(subject) {
  const { name, webDir, skillFile: skillFileName } = subject
  const dest = resolve(WEB_DIR, webDir)
  const examDir = resolve(KNOWLEDGE_DIR, '考试大纲', name)
  const noteDir = resolve(KNOWLEDGE_DIR, '教材笔记', name)

  console.log(`\n📦 ${name} (→ ${webDir}/)`)

  // 1. 考试大纲
  const examFile = resolve(examDir, 'index.md')
  if (existsSync(examFile)) {
    const { content } = readWithFrontmatter(examFile)
    const wrapped = wrapVitepress(content, {
      title: `${name} — 考试大纲`,
      description: `师承考试大纲 — ${name}`,
    })
    safeWrite(resolve(dest, 'syllabus.md'), wrapped)
  } else {
    console.log(`  ⚠️  考试大纲未找到: ${examFile}`)
  }

  // 2. 教材笔记
  const noteFile = resolve(noteDir, 'index.md')
  if (existsSync(noteFile)) {
    const { content } = readWithFrontmatter(noteFile)
    const wrapped = wrapVitepress(content, {
      title: `${name} — 教材笔记`,
      description: `教材笔记 — ${name}`,
    })
    safeWrite(resolve(dest, 'notes.md'), wrapped)
  } else {
    console.log(`  ⚠️  教材笔记未找到: ${noteFile}`)
  }

  // 3. 科目概览（skill 章节 → index.md，覆盖已有的占位页）
  const skillFile = resolve(SKILL_DIR, skillFileName)
  if (existsSync(skillFile)) {
    const raw = readFileSync(skillFile, 'utf-8')
    const wrapped = wrapVitepress(raw, {
      title: `${name} — 科目概览`,
      description: `${name}科目概览——师承考核指导`,
    })
    safeWrite(resolve(dest, 'index.md'), wrapped)
  } else {
    console.log(`  ⚠️  Skill 章节未找到: ${skillFile}`)
  }
}

// ============================================
// 入口
// ============================================

const args = process.argv.slice(2)

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
用法: node scripts/migrate-tcm.mjs [all|科目序号...]

示例:
  node scripts/migrate-tcm.mjs all          # 全部 10 科
  node scripts/migrate-tcm.mjs 1 2          # 只搬第 1-2 科
  node scripts/migrate-tcm.mjs 1 2 3 4 5   # 搬前 5 科

科目序号:
${SUBJECTS.map((s, i) => `  ${i + 1}. ${s.name}`).join('\n')}
`)
  process.exit(0)
}

if (args[0] === 'all') {
  console.log(`🚀 搬运全部 ${SUBJECTS.length} 科内容...`)
  for (const s of SUBJECTS) migrate(s)
} else {
  const indices = args.map(Number).filter(n => n >= 1 && n <= SUBJECTS.length)
  console.log(`🚀 搬运 ${indices.length} 科内容: ${indices.map(i => SUBJECTS[i-1].name).join('、')}...`)
  for (const i of indices) migrate(SUBJECTS[i - 1])
}

console.log('\n✅ 搬运完成！运行 npm run docs:build 验证。')
