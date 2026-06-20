---
title: SRC 漏洞挖掘
description: SRC 漏洞挖掘学习路线与笔记 — PortSwigger 靶场通关记录
---

# 🎯 SRC 漏洞挖掘

> 基于 [First-Bounty](https://github.com/BehiSecc/First-Bounty) 路线图，从零挖到第一个 SRC 漏洞。

## 📖 学习笔记

- [📝 PortSwigger Day1 — 14 Lab 通关记录](./notes-day1) — 路径穿越、越权、SSRF、SQL注入、文件上传、命令注入

## 🎯 学习路线

### Phase 1: Web 基础（2-3周）
HTML/CSS → JavaScript → HTTP 协议 → 理解现代 Web 应用架构

### Phase 2: 漏洞专项（4-6周）
学概念 → 靶场练 → 读实战 writeup

| 优先级 | 漏洞分类 | SRC 出洞率 |
|:------:|---------|:----------:|
| 🔴 最高 | IDOR/越权、信息泄露 | 高危常客 |
| 🟡 高 | SQL 注入、XSS | 中危稳定产出 |
| 🟢 中 | SSRF、文件上传、认证缺陷 | 看运气 |

### Phase 3: 工具链
Burp Suite（核心）→ ffuf → nuclei → waybackurls

### Phase 4: 实战
注册补天/教育SRC → 选目标盯 6-8 周 → 低危入手

## 🎯 靶场

| 靶场 | 用途 |
|:----|:-----|
| [PortSwigger Academy](https://portswigger.net/web-security) | 官方免费靶场 |
| DVWA | Web 漏洞综合练习 |
| OWASP Juice Shop | 现代 Web 漏洞 |
| SQLi-labs | SQL 注入专项 |

---

> 参考：[First-Bounty](https://github.com/BehiSecc/First-Bounty) · [SRC-experience](https://github.com/dycsy/SRC-experience)
