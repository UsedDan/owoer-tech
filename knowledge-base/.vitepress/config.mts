import { defineConfig } from 'vitepress'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Owoer 知识库',
  description: '中医师承 | 程序员的英语 | 量化交易 — Used Dan 的技术知识库',
  base: '/owoer-tech/knowledge-base/',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,

  /* ============================================
     PWA — vite-plugin-pwa (离线缓存)
     ============================================ */
  vite: {
    build: {
      target: 'es2020',
    },
    ssr: {
      noExternal: ['workbox-window'],
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'logo.svg'],
        manifest: {
          name: 'Owoer 知识库',
          short_name: 'Owoer KB',
          description: '中医师承 | 程序员的英语 | 量化交易',
          theme_color: '#059669',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/owoer-tech/knowledge-base/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/usedan\.github\.io\/owoer-tech\/knowledge-base\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'vitepress-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
          ],
        },
      }),
    ],
  },

  /* ============================================
     Head — 图标 & Umami & SEO
     ============================================ */
  head: [
    ['link', { rel: 'icon', href: '/owoer-tech/knowledge-base/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/owoer-tech/knowledge-base/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#059669' }],
    // Umami 分析（上线后取消注释，换成实际地址）
    // ['script', {
    //   defer: '',
    //   src: 'https://你的vps:端口/script.js',
    //   'data-website-id': '你的站点ID',
    // }],
  ],

  /* ============================================
     Theme — 导航 & 侧边栏
     ============================================ */
  themeConfig: {
    logo: { src: '/logo.svg', width: 110, height: 24 },

    nav: [
      { text: '首页', link: '/zh/' },
      {
        text: '中医师承',
        link: '/zh/book1-tcm/',
        activeMatch: '/zh/book1-tcm/',
      },
      {
        text: '程序员的英语',
        link: '/zh/book2-english/',
        activeMatch: '/zh/book2-english/',
      },
      {
        text: '量化交易',
        link: '/zh/book3-quant/',
        activeMatch: '/zh/book3-quant/',
      },
    ],

    sidebar: {
      '/zh/book1-tcm/': [
        {
          text: '中医师承出师考试',
          link: '/zh/book1-tcm/',
          items: [
            {
              text: '中医基础理论',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/01-basic-theory/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/01-basic-theory/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/01-basic-theory/notes' },
              ],
            },
            {
              text: '中医诊断学',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/02-diagnostics/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/02-diagnostics/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/02-diagnostics/notes' },
              ],
            },
            {
              text: '中药学',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/03-pharmacology/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/03-pharmacology/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/03-pharmacology/notes' },
              ],
            },
            {
              text: '方剂学',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/04-prescriptions/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/04-prescriptions/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/04-prescriptions/notes' },
              ],
            },
            {
              text: '中医内科学',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/05-internal-med/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/05-internal-med/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/05-internal-med/notes' },
              ],
            },
            {
              text: '中医外科学',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/06-surgery/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/06-surgery/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/06-surgery/notes' },
              ],
            },
            {
              text: '中医妇科学',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/07-gynecology/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/07-gynecology/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/07-gynecology/notes' },
              ],
            },
            {
              text: '中医儿科学',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/08-pediatrics/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/08-pediatrics/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/08-pediatrics/notes' },
              ],
            },
            {
              text: '针灸学',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/09-acupuncture/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/09-acupuncture/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/09-acupuncture/notes' },
              ],
            },
            {
              text: '实践技能',
              collapsed: true,
              items: [
                { text: '📖 科目概览', link: '/zh/book1-tcm/10-practice/' },
                { text: '📋 考试大纲', link: '/zh/book1-tcm/10-practice/syllabus' },
                { text: '📝 教材笔记', link: '/zh/book1-tcm/10-practice/notes' },
              ],
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/UsedDan' },
      {
        icon: {
          svg: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .662.124.947.373L9.253 4.68c.142.124.249.258.32.4.071.142.107.284.107.426 0 .142-.036.275-.107.4-.071.124-.178.258-.32.4l-.027.027c-.142.124-.284.222-.426.293a1.03 1.03 0 0 1-.427.107c-.16 0-.311-.036-.453-.107a1.264 1.264 0 0 1-.4-.293l-.32-.32h-.746c-.373.035-.707.133-1 .293-.293.16-.542.382-.746.667-.204.284-.338.6-.4.946-.062.347-.08.698-.053 1.054h12.853c.018-.356 0-.707-.053-1.054-.054-.347-.187-.662-.4-.946-.213-.285-.462-.507-.747-.667-.284-.16-.618-.258-1-.293H15.04c-.124.107-.249.187-.373.24-.125.053-.267.08-.427.08-.16 0-.311-.027-.453-.08a1.388 1.388 0 0 1-.4-.24c-.124-.107-.222-.231-.293-.374a.963.963 0 0 1-.107-.426c0-.151.036-.293.107-.427.07-.133.169-.258.293-.373l.027-.027c.124-.142.258-.249.4-.32a1.11 1.11 0 0 1 .427-.107c.16 0 .302.036.426.107.125.071.259.178.4.32l1.227 1.12zM7.234 15.154c.408 0 .756-.14 1.043-.422.288-.281.43-.631.43-1.049 0-.418-.142-.768-.43-1.049-.287-.281-.635-.422-1.043-.422s-.756.14-1.043.422c-.287.281-.43.631-.43 1.049 0 .418.143.768.43 1.049.287.281.635.422 1.043.422zm9.532 0c.408 0 .756-.14 1.043-.422.288-.281.43-.631.43-1.049 0-.418-.142-.768-.43-1.049-.287-.281-.635-.422-1.043-.422s-.756.14-1.043.422c-.287.281-.43.631-.43 1.049 0 .418.143.768.43 1.049.287.281.635.422 1.043.422z" fill="currentColor"/></svg>',
        },
        link: 'https://space.bilibili.com/502947858',
      },
    ],

    footer: {
      message: 'Owoer Knowledge Base · Used Dan',
      copyright: 'MIT Licensed',
    },

    search: {
      provider: 'local',
    },

    // 上一篇/下一篇
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    // 外观
    appearance: 'true', // 跟随系统
  },
})
