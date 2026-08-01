# Life Mirror

**AI 人生镜像理论与产品项目**

> 帮助每一个人，看见自己，理解自己，成为自己。

Life Mirror 不是一个命理工具，也不是一个普通聊天机器人。它是一套关于 AI 如何长期理解、映照并支持人成长的理论与产品体系。

## 当前状态

- 品牌：拾光
- 产品定位：AI 人生镜像
- 理论框架：Life Mirror Theory
- 视觉方向：东方未来主义
- 当前版本：v0.1 Draft

## Interactive Theory System

- `theory/*.mdx`：带 metadata 的理论论文，新增文件会自动进入目录和静态路由
- `lib/theory.ts`：内容发现、metadata 解析与排序
- `components/theory/`：可嵌入 MDX 的理论模型、图谱与时间轴
- `app/theory/[slug]/page.tsx`：自动生成的研究论文页面
- `app/page.tsx`：研究院首页、Manifesto 与五个研究入口

每篇论文通过 frontmatter 声明 `id`、`slug`、`title`、`subtitle`、`version`、`part`、`order` 与 `status`。正文可同时使用 Markdown、GFM 表格、图片、代码块和 React 理论组件。

## 核心原则

1. Growth First：成长第一
2. Reflection Before Prediction：理解先于预测
3. Observation Before Judgment：观察，而非定义
4. Truth With Compassion：真实，也温柔
5. Long-term Memory：长期陪伴
6. Human Agency：人的主动权

## 使命

**让 AI 不只是理解世界，也帮助每一个正在成长的人理解自己。**
