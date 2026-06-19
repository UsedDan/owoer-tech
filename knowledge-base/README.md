# 项目计划：静态知识网站（基于 VitePress + GitHub Pages）

> 创建时间：2026-06-19 | 最后更新：2026-06-19
> 参考站点：https://joeyyu23.github.io/claude-code-handbook/（VitePress, TypeScript, 50 stars）
> 本站地址：**https://usedan.github.io/knowledge-base/**（Project Page）

---

## 一、可行性分析

### 1.1 技术可行性 ✅

| 要素 | 结论 | 理由 |
|------|:----:|------|
| 技术栈 | ✅ | VitePress 1.6.x，Vue 驱动的文档站 SSG，与参考站点相同 |
| 部署 | ✅ | GitHub Pages 免费托管，Project Page 模式 |
| 国际化 | ✅ | VitePress 原生支持多语言路由（但本项目仅用中文） |
| 主题 | ✅ | 默认主题即符合需求，导航/侧边栏/搜索/TOC 开箱即用 |
| 内容格式 | ✅ | Markdown，与现有师承大纲 `.md` 文件完全兼容 |
| 构建速度 | ✅ | ~200 篇文档约 3-5 秒，Vite 冷启动极快 |
| SEO | ✅ | 静态 HTML，搜索引擎友好 |
| 维护成本 | ➖ | 零服务器，仅需 `git push` 更新 |

### 1.2 内容可行性 ✅

| 素材 | 规模 | 来源 | 状态 |
|------|:----:|------|:----:|
| 中医师承大纲 | **152 篇** .md，10 科 | `~/workspace/knowledge/学习/师承考试/考试大纲/` | ✅ 已有结构化目录 |
| 中医教材笔记 | 10 科 index.md | `~/workspace/knowledge/学习/师承考试/教材笔记/` | ✅ 已有大纲级内容 |
| 师承 skill 笔记 | 11 章结构化内容 | `~/.claude/skills/师承考核指导/chapters/` | ✅ 可复用为章节概览 |
| 程序员的英语 | OCR txt 221K | ~~Win10 桌面 english.zip，用户 OCR 中~~ | ⏳ 等用户完成 OCR |
| 量化交易知识 | ~15 篇 .md | `~/workspace/knowledge/量化交易/` | 后续扩展 |
| 渗透测试笔记 | ~6 篇 .md | `~/workspace/knowledge/渗透测试/` | 后续扩展 |

---

## 二、技术方案

### 2.1 技术栈

```
VitePress 1.6+          静态站点生成器（Vue.js + Vite）
  ├── 默认主题            导航/侧边栏/搜索 开箱即用
  ├── 自定义 CSS          仿 claude-code-handbook 样式（默认主题 + 少量定制）
  └── Markdown 扩展       Frontmatter + 代码高亮 + TOC
GitHub Pages             Project Page 模式
  └── GitHub Actions      push 自动构建部署
```

### 2.2 与参考站点的模式

| | User Page | **Project Page（博主用的）** |
|--|:---------:|:--------------------------:|
| 仓库名 | `usedan.github.io` | `knowledge-base` |
| 数量 | 仅 1 个/账号 | 无限 |
| 地址 | `https://usedan.github.io/` | `https://usedan.github.io/knowledge-base/` |
| 适用 | 个人主页 | **本项目** ✅ |
| 扩展性 | ❌ 只能一个站 | ✅ 可以同时搞多个站（师承站、量化站...） |

### 2.3 目录结构

```
knowledge-base/
├── .vitepress/
│   ├── config.mts                  主配置（导航、侧边栏）
│   └── theme/
│       ├── index.ts                主题入口
│       └── custom.css              仿 claude-code-handbook 样式
├── public/                         logo、favicon 等
├── zh/                             中文内容（主语言）
│   ├── index.md                    首页
│   ├── book1-tcm/                  第一书：中医师承
│   │   ├── index.md                书概览
│   │   ├── 01-basic-theory/        中医基础理论
│   │   ├── 02-diagnostics/         中医诊断学
│   │   ├── 03-pharmacology/        中药学
│   │   ├── 04-prescriptions/       方剂学
│   │   ├── 05-internal-med/        中医内科学
│   │   ├── 06-surgery/             中医外科学
│   │   ├── 07-gynecology/          中医妇科学
│   │   ├── 08-pediatrics/          中医儿科学
│   │   ├── 09-acupuncture/         针灸学
│   │   ├── 10-practice/            实践技能
│   │   └── appendix/               附录
│   ├── book2-english/              第二书：程序员的英语（待添加）
│   │   └── index.md                占位
│   └── book3-quant/                第三书：量化交易（待添加）
│       └── index.md                占位
├── index.md                        GitHub Pages 首页（重定向到 /zh/）
├── package.json
└── .github/workflows/
    └── deploy.yml                  GitHub Actions 自动部署
```

### 2.4 构建配置要点

```typescript
// .vitepress/config.mts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Owoer 知识库',
  description: '中医师承 | 程序员的英语 | 量化交易',
  base: '/knowledge-base/',  // ← Project Page 必须设置 base
  lastUpdated: true,
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/zh/' },
      { text: '中医师承', link: '/zh/book1-tcm/' },
    ],
    sidebar: { /* 按 book 配置 */ },
    socialLinks: [{ icon: 'github', link: 'https://github.com/UsedDan' }],
    footer: { message: 'Owoer Knowledge Base', copyright: 'MIT' },
  }
})
```

### 2.5 内容来源映射

| 网站路径 | 来源路径（本地 knowledge/） |
|----------|---------------------------|
| `zh/book1-tcm/01-basic-theory/` | `knowledge/学习/师承考试/考试大纲/中医基础理论/` |
| `zh/book1-tcm/02-diagnostics/` | `knowledge/学习/师承考试/考试大纲/中医诊断学/` |
| `zh/book1-tcm/03-pharmacology/` | `knowledge/学习/师承考试/考试大纲/中药学/` |
| ... | ... |
| 各科首页概览 | `~/.claude/skills/师承考核指导/chapters/ch0*-*.md`（skill 笔记） |

---

## 三、实施步骤

### Phase 1：基础搭建（30分钟）

1. 在 GitHub 创建仓库 `usedan/knowledge-base`
2. 本地初始化 VitePress 项目
3. 配置 `.vitepress/config.mts`（base, nav, sidebar）
4. 自定义 CSS 样式（仿参考站点）
5. 配置 GitHub Actions（博主同款 deploy.yml）
6. 写首页 `/zh/index.md`
7. 首次部署验证

### Phase 2：中医师承内容迁移（2-3小时）

1. 在 `zh/book1-tcm/` 下创建 10 科目录
2. 批量复制 152 篇大纲 `.md` 到对应目录
3. 为每篇添加 VitePress frontmatter（title, description）
4. 每科首页整合 skill 笔记章节概览
5. 配置各科侧边栏
6. 验证所有链接

### Phase 3：程序员的英语（待用户 OCR 完成后）

1. 从 Win10 接收 OCR 完成的章节 `.md`
2. 放入 `zh/book2-english/` 对应目录
3. 配置侧边栏

### Phase 4：持续扩展

1. 量化交易、渗透笔记按需添加
2. 对应 `zh/book3-quant/`、`zh/book4-sec/` 等

---

## 四、内容组织方案

### 4.1 中医师承（Book 1）— Phase 1

```
book1-tcm/
├── index.md                    书首页（出师考试概述 + 10科索引）
├── 01-basic-theory/            中医基础理论（13单元）
│   ├── index.md                科目首页（skill 笔记精华）
│   ├── 01-yin-yang.md          阴阳学说
│   ├── 02-five-elements.md     五行学说
│   └── ...（共13单元 + 笔记）
├── 02-diagnostics/             中医诊断学（10单元）
├── 03-pharmacology/            中药学（23单元）
├── 04-prescriptions/           方剂学（19单元）
├── 05-internal-med/            中医内科学（28单元）
├── 06-surgery/                 中医外科学（13单元）
├── 07-gynecology/              中医妇科学
├── 08-pediatrics/              中医儿科学（32单元）
├── 09-acupuncture/             针灸学（27单元）
└── 10-practice/                实践技能考核
    └── appendix/               附录
```

**数据量**: 10 科 × (大纲 + 笔记 + skill 概览)

### 4.2 程序员的英语（Book 2）— Phase 2

```
book2-english/
├── index.md                    书首页
├── 01-basics/                  基础篇
├── 02-reading/                 阅读篇（技术文档）
├── 03-vocabulary/              词汇表
└── appendix/                   附录
```

**数据量**: 待用户 OCR 完成后决定

### 4.3 量化交易（Book 3）— Phase 3+
### 4.4 渗透测试（Book 4）— Phase 3+

---

## 五、设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Pages 模式 | **Project Page** | 参照博主做法，后续可建多个站 |
| 仓库名 | `knowledge-base` | 含义清晰，URL `usedan.github.io/knowledge-base` |
| 语言 | **仅中文** | 用户无英文需求，减 50% 维护量 |
| 主题 | **默认 + 自定义 CSS** | 与 claude-code-handbook 视觉一致 |
| 搜索 | **VitePress 内置** | 够用，后续不够再换 Algolia |
| 深色模式 | **默认开启** | VitePress 自带 |
| 来源管理 | **内容单独维护** | knowledge/ 为源，脚本搬运到网站目录 |

---

## 六、GitHub Pages 部署

### 6.1 GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - uses: actions/configure-pages@v4
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with: { path: .vitepress/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 6.2 域名

`https://usedan.github.io/knowledge-base/`

---

## 七、工具链

| 环节 | 工具 |
|------|------|
| 编辑器 | Claude Code + VS Code |
| SSG | VitePress ^1.6 |
| 包管理 | npm |
| 版本控制 | Git + GitHub |
| CI/CD | GitHub Actions |
| 内容迁移 | 批量脚本（cp + frontmatter 注入） |

---

## 八、工作量估算

| 阶段 | 内容 | 预估 | 难度 |
|:----:|------|:---:|:----:|
| 🏗 | 项目初始化 + 配置 + 首次部署 | 30min | ⭐ |
| 📖 | 师承 152 篇 + 10 笔记 + skill 概览迁移 | 2-3h | ⭐⭐ |
| 📘 | 程序员的英语（等 OCR） | 待定 | ⭐⭐⭐ |
| 🎨 | 样式调优 | 30min | ⭐ |
| 🔄 | 后续新增书 | 按需 | ⭐ |

---

## 九、已确认事项（6/19 讨论结果）

- [x] **Pages 模式**: Project Page（跟博主一样）
- [x] **仓库名**: `knowledge-base` → `https://usedan.github.io/knowledge-base/`
- [x] **内容顺序**: 中医师承 → 程序员的英语 → 量化/渗透
- [x] **师承内容源**: 知识库大纲 152 篇 + skill 11 章笔记
- [x] **英语内容**: 压缩包已推送到 Win10 桌面，用户 OCR 中
- [x] **仅中文版**: 不需要英文
- [x] **深色模式**: 启用

## 十、待确认事项

- [ ] **项目目录放哪**：用户决定后在 `~/workspace/` 下创建
- [ ] **Logo**：用默认还是自定义？
