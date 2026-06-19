# Knowledge Base — 静态知识网站

> VitePress + GitHub Pages 搭建的中文知识库网站。
> 地址：https://usedan.github.io/knowledge-base/
> 参考样式：https://joeyyu23.github.io/claude-code-handbook/

## 目录结构

```
├── .vitepress/
│   ├── config.mts              主配置（nav、sidebar、base）
│   └── theme/
│       ├── index.ts            主题入口
│       └── custom.css          自定义样式
├── public/                     logo、favicon 等静态资源
├── zh/
│   ├── index.md                首页
│   ├── book1-tcm/              中医师承（Phase 1）
│   │   ├── index.md            书概览
│   │   ├── 01-basic-theory/    中医基础理论
│   │   ├── 02-diagnostics/     中医诊断学
│   │   ├── ...                 （共10科）
│   │   └── appendix/
│   ├── book2-english/          程序员的英语（Phase 2 待添加）
│   └── book3-quant/            量化交易（Phase 3 待添加）
├── index.md                    GitHub Pages 首页（重定向到 /zh/）
├── package.json
└── .github/workflows/
    └── deploy.yml              自动部署
```

## 铁律

### 1️⃣ 改配置前确认 base 路径

`config.mts` 中的 `base: '/knowledge-base/'` 必须与 GitHub 仓库名一致。如果改仓库名，记得同步更新 base。

### 2️⃣ 新增 book 流程

```
1. zh/ 下建目录 bookN-xxx/
2. 写 index.md（书首页）
3. config.mts 中添加 nav + sidebar 配置
4. 本地 npm run docs:dev 验证
5. git commit + push → 自动部署
```

### 3️⃣ 内容来源

| 网站内容 | 来源 |
|----------|------|
| 师承大纲各单元 | `~/workspace/knowledge/学习/师承考试/考试大纲/{科目}/` |
| 科目首页概览 | `~/.claude/skills/师承考核指导/chapters/` |
| 程序员的英语 | Win10 OCR 完成后回传 |
| 量化交易 | `~/workspace/knowledge/量化交易/` |
| 渗透测试 | `~/workspace/knowledge/渗透测试/` |

来源文件通过脚本批量搬运到对应目录，不在网站仓库内直接编辑原始内容。

### 4️⃣ 构建与部署命令

```bash
npm run docs:dev       # 本地预览 → http://localhost:5188
npm run docs:build     # 构建到 .vitepress/dist/
npm run docs:preview   # 预览构建结果
git push               # 自动触发 GitHub Actions 部署
```

### 5️⃣ 参考站点

- 仓库: https://github.com/JoeyYu23/claude-code-handbook
- 网站: https://joeyyu23.github.io/claude-code-handbook/
- 我们仿它的主题样式和侧边栏结构，内容不同
