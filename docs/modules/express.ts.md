---
title: express.ts
nav_order: 1
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Action (type alias)](#action-type-alias)
- [LinkedList (type alias)](#linkedlist-type-alias)
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
- [nil (constant)](#nil-constant)
- [cons (function)](#cons-function)
- [fromRequestHandler (function)](#fromrequesthandler-function)
- [toArray (function)](#toarray-function)
- [toErrorRequestHandler (function)](#toerrorrequesthandler-function)
- [toRequestHandler (function)](#torequesthandler-function)

---

# Action (type alias)

**Signature**

```ts
export type Action =
  | { type: 'setBody'; body: unknown }
  | { type: 'endResponse' }
  | { type: 'setStatus'; status: Status }
  | { type: 'setHeader'; name: string; value: string }
  | { type: 'clearCookie'; name: string; options: CookieOptions }
  | { type: 'setCookie'; name: string; value: string; options: CookieOptions }
```

# LinkedList (type alias)

**Signature**

```ts
export type LinkedList<A> =
  | { type: 'Nil'; length: number }
  | { type: 'Cons'; head: A; tail: LinkedList<A>; length: number }
```

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

# nil (constant)

**Signature**

```ts
export const nil: LinkedList<never> = ...
```

# cons (function)

**Signature**

```ts
export const cons = <A>(head: A, tail: LinkedList<A>): LinkedList<A> => ...
```

# fromRequestHandler (function)

**Signature**

```ts
export function fromRequestHandler<I, A>(
  requestHandler: RequestHandler,
  f: (req: Request) => A
): Middleware<I, I, never, A> { ... }
```

# toArray (function)

**Signature**

```ts
export const toArray = <A>(list: LinkedList<A>): Array<A> => ...
```

# toErrorRequestHandler (function)

**Signature**

```ts
export function toErrorRequestHandler<I, O, L>(f: (err: unknown) => Middleware<I, O, L, void>): ErrorRequestHandler { ... }
```

# toRequestHandler (function)

**Signature**

```ts
export function toRequestHandler<I, O, L>(middleware: Middleware<I, O, L, void>): RequestHandler { ... }
```
