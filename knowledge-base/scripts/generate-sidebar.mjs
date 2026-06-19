/**
 * 侧边栏配置生成脚本
 * 扫描 zh/book1-tcm/ 下已生成的单元文件，自动生成 config.mts 的 sidebar 配置块
 *
 * 用法: node scripts/generate-sidebar.mjs
 */

import { readdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const WEB_DIR = resolve(ROOT, 'zh/book1-tcm')

const SUBJECT_DIRS = [
  { dir: '01-basic-theory',  title: '中医基础理论' },
  { dir: '02-diagnostics',   title: '中医诊断学' },
  { dir: '03-pharmacology',  title: '中药学' },
  { dir: '04-prescriptions', title: '方剂学' },
  { dir: '05-internal-med',  title: '中医内科学' },
  { dir: '06-surgery',       title: '中医外科学' },
  { dir: '07-gynecology',    title: '中医妇科学' },
  { dir: '08-pediatrics',    title: '中医儿科学' },
  { dir: '09-acupuncture',   title: '针灸学' },
  { dir: '10-practice',      title: '实践技能' },
]

function parseUnitNumber(filename) {
  // Extract number from unit-XX or unit-XX-b patterns
  const match = filename.match(/unit-(\d+)(?:-b)?/)
  return match ? parseInt(match[1]) : 999
}

function buildUnitItems(dir, prefix) {
  const fullPath = resolve(WEB_DIR, dir)
  if (!existsSync(fullPath)) return { syllabus: [], notes: [] }

  const files = readdirSync(fullPath)
  const syllabusFiles = files
    .filter(f => f.startsWith(`${prefix}-unit-`) && f.endsWith('.md') && !f.includes('-b.'))
    .sort((a, b) => parseUnitNumber(a) - parseUnitNumber(b))
  const notesFiles = files
    .filter(f => f.startsWith(`notes-unit-`) && f.endsWith('.md') && !f.includes('-b.'))
    .sort((a, b) => parseUnitNumber(a) - parseUnitNumber(b))

  const syllabusItems = syllabusFiles.map(f => {
    const num = f.match(/unit-(\d+)/)[1]
    return `{ text: '单元${parseInt(num)}', link: '/zh/book1-tcm/${dir}/${f.replace('.md', '')}' }`
  })

  const notesItems = notesFiles.map(f => {
    const num = f.match(/unit-(\d+)/)[1]
    return `{ text: '单元${parseInt(num)}', link: '/zh/book1-tcm/${dir}/${f.replace('.md', '')}' }`
  })

  return { syllabus: syllabusItems, notes: notesItems }
}

const lines = []

for (const { dir, title } of SUBJECT_DIRS) {
  const { syllabus, notes } = buildUnitItems(dir, 'syllabus')

  const syllabusBlock = syllabus.length > 0
    ? `{\n              text: '📋 考试大纲',\n              collapsed: true,\n              items: [\n                ${syllabus.join(',\n                ')}\n              ],\n            }`
    : `{ text: '📋 考试大纲', link: '/zh/book1-tcm/${dir}/syllabus' }`

  const notesBlock = notes.length > 0
    ? `{\n              text: '📝 教材笔记',\n              collapsed: true,\n              items: [\n                ${notes.join(',\n                ')}\n              ],\n            }`
    : `{ text: '📝 教材笔记', link: '/zh/book1-tcm/${dir}/notes' }`

  lines.push(`            {\n              text: '${title}',\n              collapsed: true,\n              items: [\n                { text: '📖 科目概览', link: '/zh/book1-tcm/${dir}/' },\n                ${syllabusBlock},\n                ${notesBlock},\n              ],\n            }`)
}

console.log('          {\n            text: \'中医师承出师考试\',\n            link: \'/zh/book1-tcm/\',\n            items: [')
lines.forEach((line, i) => {
  console.log(line + (i < lines.length - 1 ? ',' : ''))
})
console.log('          ],\n          }')
