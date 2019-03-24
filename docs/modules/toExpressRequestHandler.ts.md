---
title: toExpressRequestHandler.ts
nav_order: 4
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [fromMiddleware (function)](#frommiddleware-function)
- [toExpressRequestHandler (function)](#toexpressrequesthandler-function)

---

# fromMiddleware (function)

**Signature**

```ts
export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): express.RequestHandler { ... }
```

# toExpressRequestHandler (function)

**Signature**

```ts
export function toExpressRequestHandler(f: (c: ExpressConn<StatusOpen>) => Task<void>): express.RequestHandler { ... }
```
