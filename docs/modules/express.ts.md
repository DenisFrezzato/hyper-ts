---
title: express.ts
nav_order: 1
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [ExpressConnection (class)](#expressconnection-class)
  - [chain (method)](#chain-method)
  - [getRequest (method)](#getrequest-method)
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
- [toMiddleware (function)](#tomiddleware-function)

---

# ExpressConnection (class)

**Signature**

```ts
export class ExpressConnection<S> {
  constructor(
    readonly req: express.Request,
    readonly res: express.Response,
    readonly action: IO<void> = io.of(undefined)
  ) { ... }
  ...
}
```

## chain (method)

**Signature**

```ts
chain<T>(thunk: () => void): ExpressConnection<T> { ... }
```

## getRequest (method)

**Signature**

```ts
getRequest(): IncomingMessage { ... }
```

## getBody (method)

**Signature**

```ts
getBody(): unknown { ... }
```

## getHeader (method)

**Signature**

```ts
getHeader(name: string): unknown { ... }
```

## getParams (method)

**Signature**

```ts
getParams(): unknown { ... }
```

## getQuery (method)

**Signature**

```ts
getQuery(): unknown { ... }
```

## getOriginalUrl (method)

**Signature**

```ts
getOriginalUrl(): string { ... }
```

## getMethod (method)

**Signature**

```ts
getMethod(): string { ... }
```

## setCookie (method)

**Signature**

```ts
setCookie<T>(name: string, value: string, options: CookieOptions): Connection<T> { ... }
```

## clearCookie (method)

**Signature**

```ts
clearCookie<T>(name: string, options: CookieOptions): Connection<T> { ... }
```

## setHeader (method)

**Signature**

```ts
setHeader<T>(name: string, value: string): Connection<T> { ... }
```

## setStatus (method)

**Signature**

```ts
setStatus<T>(status: Status): Connection<T> { ... }
```

## setBody (method)

**Signature**

```ts
setBody<T>(body: unknown): Connection<T> { ... }
```

## endResponse (method)

**Signature**

```ts
endResponse<T>(): Connection<T> { ... }
```

# fromMiddleware (function)

**Signature**

```ts
export function fromMiddleware<L>(middleware: Middleware<StatusOpen, ResponseEnded, L, void>): express.RequestHandler { ... }
```

# toMiddleware (function)

**Signature**

```ts
export function toMiddleware<L>(
  f: express.RequestHandler,
  onError: (err: unknown) => L
): Middleware<StatusOpen, StatusOpen, L, void> { ... }
```
