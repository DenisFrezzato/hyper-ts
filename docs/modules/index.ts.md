---
title: index.ts
nav_order: 2
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [Conn (interface)](#conn-interface)
- [CookieOptions (interface)](#cookieoptions-interface)
- [IxInducedMonad (interface)](#ixinducedmonad-interface)
- [IxInducedMonad3 (interface)](#ixinducedmonad3-interface)
- [MiddlewareT (interface)](#middlewaret-interface)
- [MiddlewareT1 (interface)](#middlewaret1-interface)
- [MiddlewareT2 (interface)](#middlewaret2-interface)
- [MonadMiddleware (interface)](#monadmiddleware-interface)
- [MonadMiddleware3 (interface)](#monadmiddleware3-interface)
- [BodyOpen (type alias)](#bodyopen-type-alias)
- [HeadersOpen (type alias)](#headersopen-type-alias)
- [Middleware (type alias)](#middleware-type-alias)
- [Middleware1 (type alias)](#middleware1-type-alias)
- [Middleware2 (type alias)](#middleware2-type-alias)
- [ResponseEnded (type alias)](#responseended-type-alias)
- [Status (type alias)](#status-type-alias)
- [StatusOpen (type alias)](#statusopen-type-alias)
- [Status (constant)](#status-constant)
- [body (function)](#body-function)
- [contentType (function)](#contenttype-function)
- [getMiddlewareT (function)](#getmiddlewaret-function)
- [header (function)](#header-function)
- [json (function)](#json-function)
- [param (function)](#param-function)
- [params (function)](#params-function)
- [query (function)](#query-function)
- [redirect (function)](#redirect-function)

---

# Conn (interface)

A `Conn`, short for "connection", models the entirety of a connection between the HTTP server and the user agent,
both request and response.
State changes are tracked by the phantom type `S`

**Signature**

```ts
export interface Conn<S> {
  readonly _S: S
  clearCookie: (name: string, options: CookieOptions) => void
  endResponse: () => void
  getBody: () => unknown
  getHeader: (name: string) => unknown
  getParams: () => unknown
  getQuery: () => unknown
  setBody: (body: unknown) => void
  setCookie: (name: string, value: string, options: CookieOptions) => void
  setHeader: (name: string, value: string) => void
  setStatus: (status: Status) => void
}
```

# CookieOptions (interface)

**Signature**

```ts
export interface CookieOptions {
  expires?: Date
  domain?: string
  httpOnly?: boolean
  maxAge?: number
  path?: string
  sameSite?: boolean | 'strict' | 'lax'
  secure?: boolean
  signed?: boolean
}
```

# IxInducedMonad (interface)

This models the `Monad` interface induced by a `IxMonad`.
Note that `Monad` operations cannot change the state (`U = L`)

**Signature**

```ts
export interface IxInducedMonad<M> {
  readonly URI: M
  map: <I, A, B>(fa: HKT3<M, I, I, A>, f: (a: A) => B) => HKT3<M, I, I, B>
  of: <I, A>(a: A) => HKT3<M, I, I, A>
  ap: <I, A, B>(fab: HKT3<M, I, I, (a: A) => B>, fa: HKT3<M, I, I, A>) => HKT3<M, I, I, B>
  chain: <I, A, B>(fa: HKT3<M, I, I, A>, f: (a: A) => HKT3<M, I, I, B>) => HKT3<M, I, I, B>
}
```

# IxInducedMonad3 (interface)

**Signature**

```ts
export interface IxInducedMonad3<M extends URIS3> {
  readonly URI: M
  map: <I, A, B>(fa: Type3<M, I, I, A>, f: (a: A) => B) => Type3<M, I, I, B>
  of: <I, A>(a: A) => Type3<M, I, I, A>
  ap: <I, A, B>(fab: Type3<M, I, I, (a: A) => B>, fa: Type3<M, I, I, A>) => Type3<M, I, I, B>
  chain: <I, A, B>(fa: Type3<M, I, I, A>, f: (a: A) => Type3<M, I, I, B>) => Type3<M, I, I, B>
}
```

# MiddlewareT (interface)

**Signature**

```ts
export interface MiddlewareT<M> {
  map: <I, A, B>(fa: Middleware<M, I, I, A>, f: (a: A) => B) => Middleware<M, I, I, B>
  of: <I, A>(a: A) => Middleware<M, I, I, A>
  ap: <I, A, B>(fab: Middleware<M, I, I, (a: A) => B>, fa: Middleware<M, I, I, A>) => Middleware<M, I, I, B>
  chain: <I, A, B>(fa: Middleware<M, I, I, A>, f: (a: A) => Middleware<M, I, I, B>) => Middleware<M, I, I, B>
  ichain: <I, O, Z, A, B>(fa: Middleware<M, I, O, A>, f: (a: A) => Middleware<M, O, Z, B>) => Middleware<M, I, Z, B>
  evalMiddleware: <I, O, A>(ma: Middleware<M, I, O, A>, c: Conn<I>) => HKT<M, A>
  lift: <I, A>(fa: HKT<M, A>) => Middleware<M, I, I, A>
  gets: <I, A>(f: (c: Conn<I>) => A) => Middleware<M, I, I, A>
}
```

# MiddlewareT1 (interface)

**Signature**

```ts
export interface MiddlewareT1<M extends URIS> {
  map: <I, A, B>(fa: Middleware1<M, I, I, A>, f: (a: A) => B) => Middleware1<M, I, I, B>
  of: <I, A>(a: A) => Middleware1<M, I, I, A>
  ap: <I, A, B>(fab: Middleware1<M, I, I, (a: A) => B>, fa: Middleware1<M, I, I, A>) => Middleware1<M, I, I, B>
  chain: <I, A, B>(fa: Middleware1<M, I, I, A>, f: (a: A) => Middleware1<M, I, I, B>) => Middleware1<M, I, I, B>
  ichain: <I, O, Z, A, B>(fa: Middleware1<M, I, O, A>, f: (a: A) => Middleware1<M, O, Z, B>) => Middleware1<M, I, Z, B>
  evalMiddleware: <I, O, A>(ma: Middleware1<M, I, O, A>, c: Conn<I>) => Type<M, A>
  lift: <I, A>(fa: Type<M, A>) => Middleware1<M, I, I, A>
  gets: <I, A>(f: (c: Conn<I>) => A) => Middleware1<M, I, I, A>
}
```

# MiddlewareT2 (interface)

**Signature**

```ts
export interface MiddlewareT2<M extends URIS2> {
  map: <L, I, A, B>(fa: Middleware2<M, L, I, I, A>, f: (a: A) => B) => Middleware2<M, L, I, I, B>
  of: <L, I, A>(a: A) => Middleware2<M, L, I, I, A>
  ap: <L, I, A, B>(
    fab: Middleware2<M, L, I, I, (a: A) => B>,
    fa: Middleware2<M, L, I, I, A>
  ) => Middleware2<M, L, I, I, B>
  chain: <L, I, A, B>(
    fa: Middleware2<M, L, I, I, A>,
    f: (a: A) => Middleware2<M, L, I, I, B>
  ) => Middleware2<M, L, I, I, B>
  ichain: <L, I, O, Z, A, B>(
    fa: Middleware2<M, L, I, O, A>,
    f: (a: A) => Middleware2<M, L, O, Z, B>
  ) => Middleware2<M, L, I, Z, B>
  evalMiddleware: <L, I, O, A>(ma: Middleware2<M, L, I, O, A>, c: Conn<I>) => Type2<M, L, A>
  lift: <L, I, A>(fa: Type2<M, L, A>) => Middleware2<M, L, I, I, A>
  gets: <L, I, A>(f: (c: Conn<I>) => A) => Middleware2<M, L, I, I, A>
}
```

# MonadMiddleware (interface)

Middleware campabilites

**Signature**

```ts
export interface MonadMiddleware<M> extends IxInducedMonad<M>, IxMonad<M> {
  status: (status: Status) => HKT3<M, StatusOpen, HeadersOpen, void>
  headers: (headers: { [key: string]: string }) => HKT3<M, HeadersOpen, HeadersOpen, void>
  closeHeaders: HKT3<M, HeadersOpen, BodyOpen, void>
  send: (o: string) => HKT3<M, BodyOpen, ResponseEnded, void>
  end: HKT3<M, BodyOpen, ResponseEnded, void>
  cookie: (name: string, value: string, options: CookieOptions) => HKT3<M, HeadersOpen, HeadersOpen, void>
  clearCookie: (name: string, options: CookieOptions) => HKT3<M, HeadersOpen, HeadersOpen, void>
  gets: <I, A>(f: (c: Conn<I>) => A) => HKT3<M, I, I, A>
}
```

# MonadMiddleware3 (interface)

**Signature**

```ts
export interface MonadMiddleware3<M extends URIS3> extends IxInducedMonad3<M>, IxMonad3<M> {
  status: (status: Status) => Type3<M, StatusOpen, HeadersOpen, void>
  headers: (headers: { [key: string]: string }) => Type3<M, HeadersOpen, HeadersOpen, void>
  closeHeaders: Type3<M, HeadersOpen, BodyOpen, void>
  send: (o: string) => Type3<M, BodyOpen, ResponseEnded, void>
  end: Type3<M, BodyOpen, ResponseEnded, void>
  cookie: (name: string, value: string, options: CookieOptions) => Type3<M, HeadersOpen, HeadersOpen, void>
  clearCookie: (name: string, options: CookieOptions) => Type3<M, HeadersOpen, HeadersOpen, void>
  gets: <I, A>(f: (c: Conn<I>) => A) => Type3<M, I, I, A>
}
```

# BodyOpen (type alias)

Type indicating that headers have already been sent, and that the body is currently streaming

**Signature**

```ts
export type BodyOpen = 'BodyOpen'
```

# HeadersOpen (type alias)

Type indicating that headers are ready to be sent, i.e. the body streaming has not been started

**Signature**

```ts
export type HeadersOpen = 'HeadersOpen'
```

# Middleware (type alias)

A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates
in some base monad `M`, and is indexed by `I` and `O`, the input and output `Conn` types of the
middleware action.

**Signature**

```ts
export type Middleware<M, I, O, A> = (c: Conn<I>) => HKT<M, [A, Conn<O>]>
```

# Middleware1 (type alias)

**Signature**

```ts
export type Middleware1<M extends URIS, I, O, A> = (c: Conn<I>) => Type<M, [A, Conn<O>]>
```

# Middleware2 (type alias)

**Signature**

```ts
export type Middleware2<M extends URIS2, L, I, O, A> = (c: Conn<I>) => Type2<M, L, [A, Conn<O>]>
```

# ResponseEnded (type alias)

Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished.

**Signature**

```ts
export type ResponseEnded = 'ResponseEnded'
```

# Status (type alias)

**Signature**

```ts
export type Status = typeof Status[keyof typeof Status]
```

# StatusOpen (type alias)

Type indicating that the status-line is ready to be sent

**Signature**

```ts
export type StatusOpen = 'StatusOpen'
```

# Status (constant)

**Signature**

```ts
export const Status = ...
```

# body (function)

**Signature**

```ts
export function body<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(type: Decoder<unknown, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function body<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<unknown, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> { ... }
```

# contentType (function)

**Signature**

```ts
export function contentType<M extends URIS3>(
  R: MonadMiddleware3<M>
): (mediaType: MediaType) => Type3<M, HeadersOpen, HeadersOpen, void>
export function contentType<M>(R: MonadMiddleware<M>): (mediaType: MediaType) => HKT3<M, HeadersOpen, HeadersOpen, void> { ... }
```

# getMiddlewareT (function)

`Middleware` monad transformer

**Signature**

```ts
export function getMiddlewareT<M extends URIS2>(M: Monad2<M>): MiddlewareT2<M>
export function getMiddlewareT<M extends URIS>(M: Monad1<M>): MiddlewareT1<M>
export function getMiddlewareT<M>(M: Monad<M>): MiddlewareT<M> { ... }
```

# header (function)

**Signature**

```ts
export function header<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(name: string, type: Decoder<unknown, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function header<M>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<unknown, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> { ... }
```

# json (function)

**Signature**

```ts
export function json<M extends URIS3>(R: MonadMiddleware3<M>): (o: string) => Type3<M, HeadersOpen, ResponseEnded, void>
export function json<M>(R: MonadMiddleware<M>): (o: string) => HKT3<M, HeadersOpen, ResponseEnded, void> { ... }
```

# param (function)

**Signature**

```ts
export function param<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(name: string, type: Decoder<unknown, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function param<M>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<unknown, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> { ... }
```

# params (function)

**Signature**

```ts
export function params<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(type: Decoder<unknown, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function params<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<unknown, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> { ... }
```

# query (function)

**Signature**

```ts
export function query<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(type: Decoder<unknown, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function query<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<unknown, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> { ... }
```

# redirect (function)

**Signature**

```ts
export function redirect<M extends URIS3>(
  R: MonadMiddleware3<M>
): (uri: string) => Type3<M, StatusOpen, HeadersOpen, void>
export function redirect<M>(R: MonadMiddleware<M>): (uri: string) => HKT3<M, StatusOpen, HeadersOpen, void> { ... }
```
