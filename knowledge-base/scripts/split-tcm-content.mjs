/**
 * 单元拆分脚本 — 将合并的考试大纲和教材笔记拆分为按单元的独立页面
 *
 * 用法: node scripts/split-tcm-content.mjs [all|科目序号...]
 *   例: node scripts/split-tcm-content.mjs all    # 全部 10 科
 *   例: node scripts/split-tcm-content.mjs 1      # 只拆第 1 科
 *
 * 拆分策略：
 *   考试大纲 — 合并文件按 ## 第X单元 H2 标题拆分
 *   教材笔记 — 按 ^第[一二三四五六七八九十百]+单元 行首模式检测拆分
 *   OCR 清理 — 去除页码残留 .41 .47 等，修复常见 OCR 错字
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname, basename } from 'path'

// ============================================
// 配置
// ============================================
const ROOT = resolve(import.meta.dirname, '..')
const WEB_DIR = resolve(ROOT, 'zh/book1-tcm')
const KNOWLEDGE_DIR = '/home/openclaw/workspace/knowledge/学习/师承考试'
const SRC_EXAM_DIR = resolve(KNOWLEDGE_DIR, '考试大纲')
const SRC_NOTE_DIR = resolve(KNOWLEDGE_DIR, '教材笔记')

const SUBJECTS = [
  { id: '01-basic-theory',    name: '中医基础理论', webDir: '01-basic-theory' },
  { id: '02-diagnostics',     name: '中医诊断学',   webDir: '02-diagnostics' },
  { id: '03-pharmacology',    name: '中药学',       webDir: '03-pharmacology' },
  { id: '04-prescriptions',   name: '方剂学',       webDir: '04-prescriptions' },
  { id: '05-internal-med',    name: '中医内科学',   webDir: '05-internal-med' },
  { id: '06-surgery',         name: '中医外科学',   webDir: '06-surgery' },
  { id: '07-gynecology',      name: '中医妇科学',   webDir: '07-gynecology' },
  { id: '08-pediatrics',      name: '中医儿科学',   webDir: '08-pediatrics' },
  { id: '09-acupuncture',     name: '针灸学',       webDir: '09-acupuncture' },
  { id: '10-practice',        name: '实践技能考核', webDir: '10-practice' },
]

// 教材笔记的目录名需要额外映射（实践技能部分 ≠ 实践技能考核）
const NOTE_DIR_MAP = {
  '实践技能考核': '实践技能部分',
}

// 已知有单独单元文件的科目（考试大纲）
const SUBJECTS_WITH_SEPARATE_UNITS = ['中医儿科学', '中医内科学', '中医外科学', '中药学', '方剂学', '针灸学']

// ============================================
// OCR 清理
// ============================================

function ocrClean(text) {
  return text
    // 去除页码残留：行首的 .41 .47 .48 .49 等
    .replace(/^\s*\.\d{2,3}\s*$/gm, '')
    // 去除行首的 ·48· 类页码标记
    .replace(/^\s*·\d+·\s*$/gm, '')
    // 去除混在正文中的 .41 类页码
    .replace(/[\s　]\.\d{2,3}([\s\n\)）])/g, '$1')
    // 常见 OCR 错字
    .replace(/嗨暗/g, '晦暗')
    .replace(/嗨暗的/g, '晦暗的')
    .replace(/租互/g, '相互')
    .replace(/租互作用/g, '相互作用')
    .replace(/租互制约/g, '相互制约')
    .replace(/租互排斥/g, '相互排斥')
    .replace(/租互依存/g, '相互依存')
    .replace(/租互为用/g, '相互为用')
    .replace(/牌胃/g, '脾胃')
    .replace(/牌/g, '脾')
    .replace(/王/g, '土')
    .replace(/滕理/g, '腠理')
    .replace(/理开合/g, '腠理开合')
    .replace(/文府/g, '玄府')
    .replace(/水谷槽粕/g, '水谷糟粕')
    .replace(/辅料/g, '糟粕')
    .replace(/槽粕/g, '糟粕')
    .replace(/自的/g, '目的')
    .replace(/之自的/g, '之目的')
    .replace(/漫少/g, '溲少')
    .replace(/便干漫少/g, '便干溲少')
    .replace(/古红/g, '舌红')
    .replace(/古淡/g, '舌淡')
    .replace(/古质/g, '舌质')
    .replace(/古苔/g, '舌苔')
    .replace(/古诊/g, '舌诊')
    .replace(/古象/g, '舌象')
    .replace(/膜觉/g, '嗅觉')
    .replace(/柴古/g, '柴胡')
    .replace(/桃仁/g, '桃仁')    // 保持正确
    .replace(/王不留行/g, '王不留行')  // 保持正确（中药名）
    .replace(/·/g, '·')           // 保持间隔号
    // 修复 . 和 。混用
    .replace(/(\S)\.(\s|$)/g, '$1。$2')
    // 修复数字后多余空格
    .replace(/(\d) (\d)/g, '$1$2')
}

// ============================================
// 工具函数
// ============================================

function readWithFrontmatter(filePath) {
  if (!existsSync(filePath)) return null
  const raw = readFileSync(filePath, 'utf-8')
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (fmMatch) {
    return { frontmatter: fmMatch[1], content: fmMatch[2], raw }
  }
  return { frontmatter: null, content: raw, raw }
}

function wrapVitepress(content, { title, description }) {
  return `---
title: ${title}
description: ${description}
---

${content}
`
}

function safeWrite(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✓ ${filePath.replace(ROOT + '/', '')}`)
}

function slugify(text) {
  // Chinese number to digit for unit sorting
  const numMap = {
    '一': '01', '二': '02', '三': '03', '四': '04', '五': '05',
    '六': '06', '七': '07', '八': '08', '九': '09', '十': '10',
    '十一': '11', '十二': '12', '十三': '13', '十四': '14', '十五': '15',
    '十六': '16', '十七': '17', '十八': '18', '十九': '19', '二十': '20',
    '二十一': '21', '二十二': '22', '二十三': '23', '二十四': '24', '二十五': '25',
    '二十六': '26', '二十七': '27', '二十八': '28', '二十九': '29', '三十': '30',
    '三十一': '31', '三十二': '32', '三十三': '33',
  }
  // Extract Chinese number from 第X单元
  const match = text.match(/第([一二三四五六七八九十百]+)单元/)
  if (match) {
    const num = numMap[match[1]] || '00'
    // Get the rest of the title after 第X单元
    const rest = text.replace(/第[一二三四五六七八九十百]+单元/, '').trim() || ''
    return { num, name: rest || match[0] }
  }
  return { num: '99', name: text }
}

// ============================================
// 考试大纲拆分
// ============================================

function getExamSyllabusUnits(subject) {
  const { name, webDir } = subject
  const srcDir = resolve(SRC_EXAM_DIR, name)
  const dest = resolve(WEB_DIR, webDir)

  console.log(`  📋 考试大纲...`)

  if (SUBJECTS_WITH_SEPARATE_UNITS.includes(name)) {
    // 已有单独单元文件 — 直接复制
    const files = readdirSync(srcDir)
      .filter(f => f !== 'index.md')
      .sort()

    for (const file of files) {
      const srcPath = resolve(srcDir, file)
      const raw = readFileSync(srcPath, 'utf-8')
      const { content } = readWithFrontmatter(srcPath)
        ? readWithFrontmatter(srcPath)
        : readWithFrontmatter(resolve(srcDir, basename(file, '.md') + '.md')) || { content: raw }

      const unitName = file.replace('.md', '')
      const cleaned = ocrClean(content)

      // Normalize unit number to numeric format
      const { num, name: unitTitle } = slugify(unitName)

      const wrapped = wrapVitepress(cleaned, {
        title: `${name} — ${unitName}`,
        description: `${name}考试大纲 — ${unitName}`,
      })
      safeWrite(resolve(dest, `syllabus-unit-${num}.md`), wrapped)
    }
    console.log(`    → ${files.length} 个单元文件`)
  } else {
    // 合并文件 — 按 ## 第X单元 拆分
    const examFile = resolve(srcDir, 'index.md')
    if (!existsSync(examFile)) {
      console.log(`    ⚠️  未找到: ${examFile}`)
      return []
    }
    const { content, frontmatter } = readWithFrontmatter(examFile)

    // 检测所有可能的单元标题模式（包括无 ## 的 第四单位/第六单位 等非标准写法）
    const unitPattern = /(?=^#*\s*第[一二三四五六七八九十百]+[单元位章])/m
    const sections = content.split(unitPattern)
    const units = []
    const usedNums = new Set()
    for (const section of sections) {
      if (!section.trim()) continue
      const cleanSection = ocrClean(section.trim())

      // 提取单元标题行
      const headingMatch = cleanSection.match(/^#*\s*(第[一二三四五六七八九十百]+[单元位章][^\n]*)/m)
      if (headingMatch) {
        const rawTitle = headingMatch[1].replace(/^#+\s*/, '').trim()
        // 归一化：单位/位 → 单元
        const normalizedTitle = rawTitle.replace('单位', '单元').replace('位', '单元')
        const { num, name: unitTitle } = slugify(normalizedTitle)

        // 处理重复单元号（如两个 第十二单元）
        const dedupKey = num
        const suffix = usedNums.has(dedupKey) ? `-b` : ''
        usedNums.add(dedupKey)

        const wrapped = wrapVitepress(cleanSection, {
          title: `${name} — ${normalizedTitle}`,
          description: `${name}考试大纲 — ${normalizedTitle}`,
        })
        safeWrite(resolve(dest, `syllabus-unit-${num}${suffix}.md`), wrapped)
        units.push({ num, title: normalizedTitle })
      } else {
        // 文件开头无单元标记部分（intro 或 实践技能考核）
        if (name === '实践技能考核') {
          const wrapped = wrapVitepress(cleanSection, {
            title: `${name} — 考试大纲`,
            description: `${name}考试大纲`,
          })
          safeWrite(resolve(dest, 'syllabus.md'), wrapped)
        }
      }
    }
    console.log(`    → ${units.length} 个单元`)
  }
}

// ============================================
// 教材笔记拆分
// ============================================

function getTextbookNoteUnits(subject) {
  const { name, webDir } = subject
  const noteName = NOTE_DIR_MAP[name] || name
  const srcFile = resolve(SRC_NOTE_DIR, noteName, 'index.md')
  const dest = resolve(WEB_DIR, webDir)

  console.log(`  📝 教材笔记...`)

  if (!existsSync(srcFile)) {
    console.log(`    ⚠️  未找到: ${srcFile}`)
    return []
  }

  const { content, frontmatter } = readWithFrontmatter(srcFile)
  if (!content) {
    console.log(`    ⚠️  内容为空: ${srcFile}`)
    return []
  }

  // 按 ^第[一二三四五六七八九十百]+单元 行首模式拆分
  // 也处理 X、 模式的标题（如 "、五行学说"）
  const sectionRegex = /(?=^第[一二三四五六七八九十百]+单元|\n、)/m
  const rawSections = content.split(sectionRegex)

  const units = []
  for (const rawSec of rawSections) {
    if (!rawSec.trim()) continue
    const cleanSec = ocrClean(rawSec.trim())

    // Try to extract unit title
    const unitMatch = cleanSec.match(/^第[一二三四五六七八九十百]+单元/)
    const altMatch = cleanSec.match(/^、[^\n]+/)

    if (unitMatch) {
      const unitHeader = unitMatch[0]
      const { num, name: unitTitle } = slugify(unitHeader)
      // Get the full title line (可能包含后续文字如 "第五单元五脏")
      const fullTitleLine = cleanSec.split('\n')[0]
      const fullTitle = fullTitleLine.startsWith(unitHeader) ? fullTitleLine : unitHeader

      const wrapped = wrapVitepress(cleanSec, {
        title: `${name} — ${fullTitle}`,
        description: `${name}教材笔记 — ${fullTitle}`,
      })
      safeWrite(resolve(dest, `notes-unit-${num}.md`), wrapped)
      units.push({ num, title: fullTitle })
    } else if (altMatch) {
      // 、五行学说 类型 — 这些实际上在单元内部，不拆
      // Append to previous unit or handle as general content
      if (units.length > 0) {
        // Append to last unit's file
        const lastUnit = units[units.length - 1]
        const existingPath = resolve(dest, `notes-unit-${lastUnit.num}.md`)
        const existing = readFileSync(existingPath, 'utf-8')
        writeFileSync(existingPath, existing + '\n\n' + cleanSec, 'utf-8')
      }
    } else {
      // Content before first unit heading or leftover
      // Usually the intro / frontmatter area
    }
  }

  console.log(`    → ${units.length} 个单元`)
  return units
}

// ============================================
// 收集单元信息（用于生成 sidebar config）
// ============================================

const UNIT_RESULTS = {}

function processSubject(subject) {
  const { name, webDir } = subject
  const dest = resolve(WEB_DIR, webDir)

  console.log(`\n📦 ${name} (→ ${webDir}/)`)

  // 考试大纲
  getExamSyllabusUnits(subject)

  // 教材笔记
  const noteUnits = getTextbookNoteUnits(subject)

  // 记录单元信息供 sidebar 生成
  UNIT_RESULTS[webDir] = {
    name,
    noteUnits,
  }
}

// ============================================
// 入口
// ============================================

const args = process.argv.slice(2)

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
用法: node scripts/split-tcm-content.mjs [all|科目序号...]

示例:
  node scripts/split-tcm-content.mjs all          # 全部 10 科
  node scripts/split-tcm-content.mjs 1 2          # 只拆第 1-2 科

科目序号:
${SUBJECTS.map((s, i) => `  ${i + 1}. ${s.name}`).join('\n')}
`)
  process.exit(0)
}

console.log('🔧 开始单元拆分...')

if (args[0] === 'all') {
  for (const s of SUBJECTS) processSubject(s)
} else {
  const indices = args.map(Number).filter(n => n >= 1 && n <= SUBJECTS.length)
  for (const i of indices) processSubject(SUBJECTS[i - 1])
}

// 输出所有单元的结果
console.log('\n📊 拆分结果:')
for (const [dir, info] of Object.entries(UNIT_RESULTS)) {
  console.log(`  ${info.name}: ${info.noteUnits.length} 个笔记单元`)
}

console.log('\n✅ 拆分完成！')
