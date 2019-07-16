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
- [fromRequestHandler (function)](#fromrequesthandler-function)
- [toErrorRequestHandler (function)](#toerrorrequesthandler-function)
- [toRequestHandler (function)](#torequesthandler-function)

---

# ExpressConnection (class)

**Signature**

```ts
export class ExpressConnection<S> {
  constructor(
    readonly req: Request,
    readonly res: Response,
    readonly actions: LinkedList<Action> = nil,
    readonly ended: boolean = false
  ) { ... }
  ...
}
```

Added in v0.5.0

## chain (method)

**Signature**

```ts
chain<T>(action: Action, ended: boolean = false): ExpressConnection<T> { ... }
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
setCookie(name: string, value: string, options: CookieOptions): ExpressConnection<HeadersOpen> { ... }
```

## clearCookie (method)

**Signature**

```ts
clearCookie(name: string, options: CookieOptions): ExpressConnection<HeadersOpen> { ... }
```

## setHeader (method)

**Signature**

```ts
setHeader(name: string, value: string): ExpressConnection<HeadersOpen> { ... }
```

## setStatus (method)

**Signature**

```ts
setStatus(status: Status): ExpressConnection<HeadersOpen> { ... }
```

## setBody (method)

**Signature**

```ts
setBody(body: unknown): ExpressConnection<ResponseEnded> { ... }
```

## endResponse (method)

**Signature**

```ts
endResponse(): ExpressConnection<ResponseEnded> { ... }
```

# fromRequestHandler (function)

**Signature**

```ts
export function fromRequestHandler<I = StatusOpen, E = never, A = never>(
  requestHandler: RequestHandler,
  f: (req: Request) => A
): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# toErrorRequestHandler (function)

**Signature**

```ts
export function toErrorRequestHandler<I, O, E>(f: (err: unknown) => Middleware<I, O, E, void>): ErrorRequestHandler { ... }
```

Added in v0.5.0

# toRequestHandler (function)

**Signature**

```ts
export function toRequestHandler<I, O, E>(middleware: Middleware<I, O, E, void>): RequestHandler { ... }
```

Added in v0.5.0
