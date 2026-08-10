# PHASE-009 Personal Context Contract

`D1 account_data` is the product source of truth for every authenticated user-facing context operation. The browser may cache it and guests may use local storage, but a signed-in mutation must first succeed against `/api/v1/account/*`.

| Entity | Product authority | Fastify role | Rule |
| --- | --- | --- | --- |
| Auth and account settings | D1 `identity_*`, `account_data` | none | The account session decides whether local data is a cache or guest-only data. |
| History (Tarot, Bazi, Astrology, Liuyao, Chat) | D1 `account_data.history` | analysis projection | History is user-owned evidence. Important, person, open-loop, and delete mutations write D1 first. |
| Explicit facts | D1 `account_data.facts` | analysis projection | Only user-authored, explicit memory. Users can correct or delete it. |
| Pattern memory | Fastify/Postgres | derived projection | Never overwrites a fact, history edit, or deletion. |
| Private person | D1 account context | optional relationship projection | Owner-authored perspective, not a fact about TA. |
| Daily and Review | D1 account context | Fastify may rank/project | Both consume only authorized facts and visible history; symbolic results never become personal facts. |

The contract version is exposed by `GET /api/v1/account/context`. Any future projection must be idempotent and treat the D1 record ID plus `updatedAt` as the conflict boundary. A projection failure must not block a user mutation or silently fall back to `setEvents(readGuestEvents())` for an authenticated user.
