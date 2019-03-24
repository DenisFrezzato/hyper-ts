---
title: toKoaRequestHandler.ts
nav_order: 5
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [fromMiddleware (function)](#frommiddleware-function)
- [toKoaRequestHandler (function)](#tokoarequesthandler-function)

---

# fromMiddleware (function)

**Signature**

```ts
export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): Koa.Middleware { ... }
```

# toKoaRequestHandler (function)

**Signature**

```ts
export function toKoaRequestHandler(f: (c: KoaConn<StatusOpen>) => Task<void>): Koa.Middleware { ... }
```
