# Life Mirror

**AI 人生镜像理论与产品项目**

**Current application version:** 0.8.0

**Development status:** the personal companion loop and private relationship beta are live; professional symbolic systems and proactive delivery remain in staged completion. See [`implementation/README.md`](implementation/README.md).

> 帮助每一个人，看见自己，理解自己，成为自己。

Life Mirror 不是一个命理工具，也不是一个普通聊天机器人。

它是一套关于 AI 如何长期理解、映照并支持人成长的理论与产品体系。

## Current Product Snapshot

The shipped product now includes:

- 拾光首页、每日开场、状态快捷回应与上次事件续问；
- 六爻、命盘、塔罗、占星四种镜像体验与统一结果顺序；
- 唯一出生资料，命盘与占星填写一次后自动复用；
- 用户资料、邮箱／ChatGPT 登录、D1 账户同步与游客数据迁移；
- 明确事实、已保存镜像与相关历史的授权记忆检索；
- 第一次保存即生成初始 Mirror DNA，后续证据可加强、修正或推翻；
- LifeMirror ID、好友搜索／申请、私密关系列表、双方授权的关系镜像；
- 分享链接回应与关系申请承接，而非仅导出图片。

仍未完成的关键能力：站外推送／邮件触达、完整通知中心、关系洞察的专业匹配模型、IANA 历史时区、专家金标准抽检，以及公开发布前所需的举报与风控运营后台。

---

# Project Architecture

Life Mirror follows a layered architecture from research to implementation:

```
Research
    ↓
Product
    ↓
Design
    ↓
Engineering
    ↓
Implementation
```

---

# Repository Structure

## Research

定义 Life Mirror 的理论基础与智能体系。

```
research/

├── theory/
├── system/
├── knowledge/
└── data/
```

包含：

- Life Mirror Theory
- System Architecture
- Knowledge Architecture
- Data Architecture

---

## Tools

定义系统可执行能力。

```
tools/
```

例如：

- Liuyao Engine
- Symbolic Analysis Tools

---

## Product

定义用户价值与体验。

```
product/
```

包含：

- Product Architecture
- Daily Mirror Experience

---

## Design

定义用户交互与视觉体系。

```
design/
```

包含：

- Visual Design System
- Daily Mirror Interface
- Reflection Experience
- Memory Timeline

---

## Engineering

定义技术实现方案。

```
engineering/
```

包含：

- Technical Architecture
- Mirror Runtime
- Knowledge System
- Data Architecture
- Tool System
- Memory System
- Evaluation System
- Infrastructure

---

## Implementation

定义开发执行路线。

```
implementation/
```

执行顺序：

```
PHASE-001 Foundation Setup
        ↓
PHASE-002 Daily Mirror MVP
        ↓
PHASE-003 Memory System
        ↓
PHASE-004 Personal Mirror Dashboard
        ↓
PHASE-005 Knowledge Expansion
        ↓
PHASE-006 Advanced Mirror Runtime
```

---

# Core Principles

1. Growth First：成长第一
2. Reflection Before Prediction：理解先于预测
3. Observation Before Judgment：观察，而非定义
4. Truth With Compassion：真实，也温柔
5. Long-term Memory：长期陪伴
6. Human Agency：人的主动权

---

# Product Vision

Life Mirror aims to build a Personal AI Mirror.

Not a chatbot.
Not a prediction engine.

A system that helps people understand themselves through:

- Personal Memory
- Structured Knowledge
- AI Reflection
- Long-term Growth

---

# Mission

**让 AI 不只是理解世界，也帮助每一个正在成长的人理解自己。**

---

# Development Foundation

PHASE-001 keeps the existing Institute website and the product runtime separate:

```text
Next.js Institute / H5 frontend
              ↓
       Fastify API Runtime
              ↓
          PostgreSQL

Runtime → LLM Provider abstraction
```

PHASE-001 provides authentication and provider infrastructure. PHASE-002 adds the first product route at `/app`: Question → deterministic Liuyao Tool → traditional knowledge retrieval → AI Reflection → explicit Reflection Event save.

PHASE-003 adds the long-term personal Memory Processing Layer:

```text
Saved Reflection Event
          ↓
Event Memory + Reflection Memory
          ↓
Evidence-backed Pattern Memory
```

The first saved mirror creates a clearly labelled initial Mirror DNA observation. It is not promoted to an evidence-backed Pattern until the same theme has at least two independent saved events. Later evidence can strengthen, revise or overturn the observation. Users can inspect, correct, hide, delete and export their memory. Personal memory is excluded from model training.

Version 0.7.1 adds the Daily Mirror correctness sequence: Your Hexagram → Traditional Interpretation → Mirror Reflection → Reflection Question → Save. KNOWLEDGE-003 now carries complete classical judgment, Image and line-text data, structurally separated from modern reflection mapping. Existing PHASE-003 memory data remains compatible.

Version 0.8.0 adds the retention and private-relationship loop: 今日拾光 → 继续对话 → 保存线索 → 初始 Mirror DNA → 关系分享／回应。It also introduces searchable LifeMirror IDs and upgrades Tarot to a 78-card, spread-aware, orientation-aware and cross-card professional beta.

## Memory and Agent Model

LifeMirror does not run several unconstrained agents over every message. The production path uses a controlled orchestrator:

```text
User input
  → consent and relevant-memory retrieval
  → deterministic domain tool (when needed)
  → structured facts and evidence
  → Shiguang response model
  → explicit save / memory update
```

Normal chat can use structured memory when the user enables it. It retrieves explicit facts and a small number of relevant saved mirror events; it does not silently store every sentence as a permanent user fact. Short-term conversation, event memory, reflection memory and evidence-backed patterns have different lifecycles. This follows the common modern-agent pattern of an orchestrator plus tools, retrieval memory and background extraction, while keeping inference separate from user-authored facts.

## Local Setup

Requirements:

- Node.js 22
- Docker with Compose

```bash
cp .env.example .env
docker compose up -d postgres
npm ci
npm run db:migrate
npm run dev
```

Local services:

- Web: `http://localhost:4173`
- API liveness: `http://localhost:8787/health/live`
- API readiness: `http://localhost:8787/health/ready`

Use `npm run dev:web` when only the static Institute site is needed. Set `LLM_PROVIDER=openai-compatible`, `LLM_API_KEY`, `LLM_MODEL` and, when needed, `LLM_BASE_URL` to enable the primary OpenAI-compatible provider. Optionally set `LLM_FALLBACK_BASE_URL`, `LLM_FALLBACK_API_KEY`, and `LLM_FALLBACK_MODEL`; the Sites Worker retries the backup only after a primary timeout/network failure, 429/5xx response, or empty response. Set `SHIGUANG_WEB_SEARCH_API_KEY` to enable source-backed live verification in the web conversation (the default endpoint uses Tavily's Search API format). Secrets belong in local or deployment environment variables and must not be committed.

Set `NEXT_PUBLIC_API_URL` when the web app and API use different origins. Keep `SESSION_COOKIE_SAME_SITE=strict` for same-site deployments; use `none` only for a secure HTTPS API serving a cross-site web origin. The API validates `WEB_ORIGIN` on every browser request. Set a unique `REFLECTION_TOKEN_SECRET` of at least 32 characters in production.

## Foundation Commands

```bash
npm run typecheck
npm test
npm run build
npm run build:api
npm run start:api
```

The public Institute remains deployable through GitHub Pages. The API is packaged independently with `deploy/api.Dockerfile` for development, staging and production environments.

## Memory API

```text
GET    /api/v1/memories
GET    /api/v1/memories/context
GET    /api/v1/memories/summary
GET    /api/v1/memories/export
PATCH  /api/v1/memories/:type/:id
DELETE /api/v1/memories/:type/:id
DELETE /api/v1/memories/source-events/:id
```

The summary contract prepares PHASE-004 consumers with current reflection, recent patterns and timeline data while returning `mirrorDna: null` until that phase is approved.