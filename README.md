# Life Mirror

**AI 人生镜像理论与产品项目**

> 帮助每一个人，看见自己，理解自己，成为自己。

Life Mirror 不是一个命理工具，也不是一个普通聊天机器人。

它是一套关于 AI 如何长期理解、映照并支持人成长的理论与产品体系。

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

Pattern Memory requires at least two independent saved events. It does not update Mirror DNA. Users can inspect, correct, hide, delete and export their memory. Personal memory is database-constrained as ineligible for model training.

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

Use `npm run dev:web` when only the static Institute site is needed. Set `LLM_PROVIDER=openai-compatible`, `LLM_API_KEY`, `LLM_MODEL` and, when needed, `LLM_BASE_URL` to enable an OpenAI-compatible provider. Secrets belong in local or deployment environment variables and must not be committed.

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
