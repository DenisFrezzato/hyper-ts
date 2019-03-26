---
title: koa.ts
nav_order: 3
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [KoaConnection (class)](#koaconnection-class)
  - [chain (method)](#chain-method)
  - [getBody (method)](#getbody-method)
  - [getHeader (method)](#getheader-method)
  - [getParams (method)](#getparams-method)
  - [getQuery (method)](#getquery-method)
  - [getOriginalUrl (method)](#getoriginalurl-method)
  - [getMethod (method)](#getmethod-method)
  - [setCookie (method)](#setcookie-method)
  - [clearCookie (method)](#clearcookie-method)
  - [setHeader (method)](#setheader-method)
  - [setStatus (method)](#setstatus-method)
  - [setBody (method)](#setbody-method)
  - [endResponse (method)](#endresponse-method)
- [fromMiddleware (function)](#frommiddleware-function)
- [toRequestHandler (function)](#torequesthandler-function)

---

# KoaConnection (class)

**Signature**

```ts
export class KoaConnection<S> {
  constructor(readonly context: koa.Context, readonly action: IO<unknown> = io.of(undefined)) { ... }
  ...
}
```

## chain (method)

**Signature**

```ts
chain<T>(thunk: () => void): KoaConnection<T> { ... }
```

## getBody (method)

**Signature**

```ts
getBody() { ... }
```

## getHeader (method)

**Signature**

```ts
getHeader(name: string) { ... }
```

## getParams (method)

**Signature**

```ts
getParams() { ... }
```

## getQuery (method)

**Signature**

```ts
getQuery() { ... }
```

## getOriginalUrl (method)

**Signature**

```ts
getOriginalUrl() { ... }
```

## getMethod (method)

**Signature**

```ts
getMethod() { ... }
```

## setCookie (method)

**Signature**

```ts
setCookie<T>(name: string, value: string, options: CookieOptions) { ... }
```

## clearCookie (method)

**Signature**

```ts
clearCookie<T>(name: string, options: CookieOptions) { ... }
```

## setHeader (method)

**Signature**

```ts
setHeader<T>(name: string, value: string) { ... }
```

## setStatus (method)

**Signature**

```ts
setStatus<T>(status: Status) { ... }
```

## setBody (method)

**Signature**

```ts
setBody<T>(body: unknown) { ... }
```

## endResponse (method)

**Signature**

```ts
endResponse<T>() { ... }
```

# fromMiddleware (function)

**Signature**

```ts
export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): koa.Middleware { ... }
```

# toRequestHandler (function)

**Signature**

```ts
export function toRequestHandler(f: (c: KoaConnection<StatusOpen>) => Task<void>): koa.Middleware { ... }
```
