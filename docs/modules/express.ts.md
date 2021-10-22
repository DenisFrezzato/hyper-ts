---
title: express.ts
nav_order: 1
parent: Modules
---

## express overview

Added in v0.5.0

---

<h2 class="text-delta">Table of contents</h2>

- [model](#model)
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
    - [pipeStream (method)](#pipestream-method)
    - [endResponse (method)](#endresponse-method)
    - [\_S (property)](#_s-property)
- [utils](#utils)
  - [fromRequestHandler](#fromrequesthandler)
  - [toErrorRequestHandler](#toerrorrequesthandler)
  - [toRequestHandler](#torequesthandler)

---

# model

## ExpressConnection (class)

**Signature**

```ts
export declare class ExpressConnection<S> {
  constructor(
    readonly req: Request,
    readonly res: Response,
    readonly actions: L.List<Action> = L.nil,
    readonly ended: boolean = false
  )
}
```

Added in v0.5.0

### chain (method)

**Signature**

```ts
chain<T>(action: Action, ended: boolean = false): ExpressConnection<T>
```

Added in v0.5.0

### getRequest (method)

**Signature**

```ts
getRequest(): IncomingMessage
```

Added in v0.5.0

### getBody (method)

**Signature**

```ts
getBody(): unknown
```

Added in v0.5.0

### getHeader (method)

**Signature**

```ts
getHeader(name: string): unknown
```

Added in v0.5.0

### getParams (method)

**Signature**

```ts
getParams(): unknown
```

Added in v0.5.0

### getQuery (method)

**Signature**

```ts
getQuery(): unknown
```

Added in v0.5.0

### getOriginalUrl (method)

**Signature**

```ts
getOriginalUrl(): string
```

Added in v0.5.0

### getMethod (method)

**Signature**

```ts
getMethod(): string
```

Added in v0.5.0

### setCookie (method)

**Signature**

```ts
setCookie(name: string, value: string, options: CookieOptions): ExpressConnection<HeadersOpen>
```

Added in v0.5.0

### clearCookie (method)

**Signature**

```ts
clearCookie(name: string, options: CookieOptions): ExpressConnection<HeadersOpen>
```

Added in v0.5.0

### setHeader (method)

**Signature**

```ts
setHeader(name: string, value: string): ExpressConnection<HeadersOpen>
```

Added in v0.5.0

### setStatus (method)

**Signature**

```ts
setStatus(status: Status): ExpressConnection<HeadersOpen>
```

Added in v0.5.0

### setBody (method)

**Signature**

```ts
setBody(body: unknown): ExpressConnection<ResponseEnded>
```

Added in v0.5.0

### pipeStream (method)

**Signature**

```ts
pipeStream(stream: NodeJS.ReadableStream): ExpressConnection<ResponseEnded>
```

Added in v0.6.2

### endResponse (method)

**Signature**

```ts
endResponse(): ExpressConnection<ResponseEnded>
```

Added in v0.5.0

### \_S (property)

**Signature**

```ts
readonly _S: S
```

Added in v0.5.0

# utils

## fromRequestHandler

The overload without error handler is unsafe and deprecated, use the one with
the error handler instead.

**Signature**

```ts
export declare function fromRequestHandler<I = StatusOpen, E = never, A = never>(
  requestHandler: RequestHandler,
  f: (req: Request) => A
): Middleware<I, I, E, A>
export declare function fromRequestHandler<I = StatusOpen, E = never, A = never>(
  requestHandler: RequestHandler,
  f: (req: Request) => E.Either<E, A>,
  onError: (reason: unknown) => E
): Middleware<I, I, E, A>
```

Added in v0.5.0

## toErrorRequestHandler

**Signature**

```ts
export declare function toErrorRequestHandler<I, O, E>(
  f: (err: unknown) => Middleware<I, O, E, void>
): ErrorRequestHandler
```

Added in v0.5.0

## toRequestHandler

**Signature**

```ts
export declare function toRequestHandler<I, O, E>(middleware: Middleware<I, O, E, void>): RequestHandler
```

Added in v0.5.0
