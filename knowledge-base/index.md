---
layout: page
title: Owoer 知识库
---

<script setup>
import { useRouter } from 'vitepress'
import { onMounted } from 'vue'

onMounted(() => {
  // GitHub Pages 根路径重定向到中文首页
  if (typeof window !== 'undefined') {
    window.location.replace('/owoer-tech/knowledge-base/zh/')
  }
})
</script>
