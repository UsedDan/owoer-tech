---
title: Ptrade 外部互联方案
description: 量化交易 — Ptrade Windows 端与 VPS 的互联架构
---

# 量化交易项目 — Ptrade 外部互联方案

## 架构总览（2026-05-26）

```
你的 Ptrade (Windows, 内网)
    公网 IP: [公网IP]
    仿真系统: [仿真系统IP]
    │
    ├─ 方案 A：HTTP Webhook（首选）
    │  向 http://[VPS IP]:11900/api/trade 发 POST
    │  需腾讯云安全组放行端口 11900
    │
    ├─ 方案 B：PB通 DBF 文件接口
    │  XHPT_WT.dbf / XHPT_CD.dbf / XHPT_WTCX.dbf / XHPT_CJCX.dbf
    │  写文件到监控目录，Ptrade 自动读取
    │  → 文件同步到 VM（通过网络共享或定时拷贝）
    │
    └─ 方案 C：研究模块 Python
       在 Ptrade「研究」中写 Python 脚本
       用内置库 urllib.request 发 HTTP

我的 VM (Linux, 腾讯云)
    公网 IP: [VPS IP]
    Webhook 服务: http://0.0.0.0:11900 (已运行, PID: [进程号])
    数据文件: ./trade_log.jsonl
    自启+保活: crontab 已配置
    
    └→ 飞书通知你
```

## 服务端点

| 路径 | 方法 | 用途 |
|:---|:---:|:---|
| `/` | GET | 服务信息 |
| `/api/ping` | POST | 连通测试（需传 key） |
| `/api/trade` | POST | 上报成交数据 |
| `/api/status` | GET | 查看统计 |

## Ptrade 研究环境

- 手册中无专门章节（可能是更新版本）
- 需要截图确认界面
- 测试代码：
  ```python
  import urllib.request
  r = urllib.request.urlopen('http://[VPS IP]:11900/api/ping', timeout=10)
  print(r.read().decode())
  ```

## Webhook API Key

`***`（见 webhook_server.py）

