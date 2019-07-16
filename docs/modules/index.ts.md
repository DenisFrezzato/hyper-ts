---
title: index.ts
nav_order: 2
parent: Modules
---

---

<h2 class="text-delta">Table of contents</h2>

- [BodyOpen (interface)](#bodyopen-interface)
- [Connection (interface)](#connection-interface)
- [CookieOptions (interface)](#cookieoptions-interface)
- [HeadersOpen (interface)](#headersopen-interface)
- [Middleware (interface)](#middleware-interface)
- [ResponseEnded (interface)](#responseended-interface)
- [StatusOpen (interface)](#statusopen-interface)
- [MediaType (type alias)](#mediatype-type-alias)
- [Status (type alias)](#status-type-alias)
- [URI (type alias)](#uri-type-alias)
- [MediaType (constant)](#mediatype-constant)
- [Status (constant)](#status-constant)
- [URI (constant)](#uri-constant)
- [middleware (constant)](#middleware-constant)
- [clearCookie (function)](#clearcookie-function)
- [closeHeaders (function)](#closeheaders-function)
- [contentType (function)](#contenttype-function)
- [cookie (function)](#cookie-function)
- [decodeBody (function)](#decodebody-function)
- [decodeHeader (function)](#decodeheader-function)
- [decodeMethod (function)](#decodemethod-function)
- [decodeParam (function)](#decodeparam-function)
- [decodeParams (function)](#decodeparams-function)
- [decodeQuery (function)](#decodequery-function)
- [end (function)](#end-function)
- [evalMiddleware (function)](#evalmiddleware-function)
- [execMiddleware (function)](#execmiddleware-function)
- [fromConnection (function)](#fromconnection-function)
- [fromIOEither (function)](#fromioeither-function)
- [fromTaskEither (function)](#fromtaskeither-function)
- [gets (function)](#gets-function)
- [header (function)](#header-function)
- [ichain (function)](#ichain-function)
- [iof (function)](#iof-function)
- [json (function)](#json-function)
- [left (function)](#left-function)
- [leftIO (function)](#leftio-function)
- [leftTask (function)](#lefttask-function)
- [modifyConnection (function)](#modifyconnection-function)
- [orElse (function)](#orelse-function)
- [redirect (function)](#redirect-function)
- [right (function)](#right-function)
- [rightIO (function)](#rightio-function)
- [rightTask (function)](#righttask-function)
- [send (function)](#send-function)
- [status (function)](#status-function)
- [tryCatch (function)](#trycatch-function)

---

# BodyOpen (interface)

Type indicating that headers have already been sent, and that the body is currently streaming

**Signature**

```ts
export interface BodyOpen {
  readonly BodyOpen: unique symbol
}
```

Added in v0.5.0

# Connection (interface)

A `Connection`, models the entirety of a connection between the HTTP server and the user agent,
both request and response.
State changes are tracked by the phantom type `S`

**Signature**

```ts
export interface Connection<S> {
  readonly _S: S
  readonly getRequest: () => IncomingMessage
  readonly getBody: () => unknown
  readonly getHeader: (name: string) => unknown
  readonly getParams: () => unknown
  readonly getQuery: () => unknown
  readonly getOriginalUrl: () => string
  readonly getMethod: () => string
  readonly setCookie: (
    this: Connection<HeadersOpen>,
    name: string,
    value: string,
    options: CookieOptions
  ) => Connection<HeadersOpen>
  readonly clearCookie: (this: Connection<HeadersOpen>, name: string, options: CookieOptions) => Connection<HeadersOpen>
  readonly setHeader: (this: Connection<HeadersOpen>, name: string, value: string) => Connection<HeadersOpen>
  readonly setStatus: (this: Connection<StatusOpen>, status: Status) => Connection<HeadersOpen>
  readonly setBody: (this: Connection<BodyOpen>, body: unknown) => Connection<ResponseEnded>
  readonly endResponse: (this: Connection<BodyOpen>) => Connection<ResponseEnded>
}
```

Added in v0.5.0

# CookieOptions (interface)

**Signature**

```ts
export interface CookieOptions {
  readonly expires?: Date
  readonly domain?: string
  readonly httpOnly?: boolean
  readonly maxAge?: number
  readonly path?: string
  readonly sameSite?: boolean | 'strict' | 'lax'
  readonly secure?: boolean
  readonly signed?: boolean
}
```

Added in v0.5.0

# HeadersOpen (interface)

Type indicating that headers are ready to be sent, i.e. the body streaming has not been started

**Signature**

```ts
export interface HeadersOpen {
  readonly HeadersOpen: unique symbol
}
```

Added in v0.5.0

# Middleware (interface)

A middleware is an indexed monadic action transforming one `Connection` to another `Connection`. It operates
in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output `Connection` types of the
middleware action.

**Signature**

```ts
export interface Middleware<I, O, E, A> {
  (c: Connection<I>): TE.TaskEither<E, [A, Connection<O>]>
}
```

# ResponseEnded (interface)

Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished

**Signature**

```ts
export interface ResponseEnded {
  readonly ResponseEnded: unique symbol
}
```

Added in v0.5.0

# StatusOpen (interface)

Type indicating that the status-line is ready to be sent

**Signature**

```ts
export interface StatusOpen {
  readonly StatusOpen: unique symbol
}
```

Added in v0.5.0

# MediaType (type alias)

**Signature**

```ts
export type MediaType = typeof MediaType[keyof typeof MediaType]
```

Added in v0.5.0

# Status (type alias)

**Signature**

```ts
export type Status = typeof Status[keyof typeof Status]
```

Added in v0.5.0

# URI (type alias)

**Signature**

```ts
export type URI = typeof URI
```

Added in v0.5.0

# MediaType (constant)

Adapted from https://github.com/purescript-contrib/purescript-media-types

**Signature**

```ts
export const MediaType = ...
```

Added in v0.5.0

# Status (constant)

**Signature**

```ts
export const Status = ...
```

Added in v0.5.0

# URI (constant)

**Signature**

```ts
export const URI = ...
```

Added in v0.5.0

# middleware (constant)

**Signature**

```ts
export const middleware: Monad3<URI> & Alt3<URI> & Bifunctor3<URI> & MonadThrow3<URI> & MonadTask3<URI> = ...
```

Added in v0.5.0

# clearCookie (function)

Returns a middleware that clears the cookie `name`

**Signature**

```ts
export function clearCookie<E = never>(
  name: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void> { ... }
```

Added in v0.5.0

# closeHeaders (function)

Returns a middleware that changes the connection status to `BodyOpen`

**Signature**

```ts
export function closeHeaders<E = never>(): Middleware<HeadersOpen, BodyOpen, E, void> { ... }
```

Added in v0.5.0

# contentType (function)

Returns a middleware that sets the given `mediaType`

**Signature**

```ts
export function contentType<E = never>(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, E, void> { ... }
```

Added in v0.5.0

# cookie (function)

Returns a middleware that sets the cookie `name` to `value`, with the given `options`

**Signature**

```ts
export function cookie<E = never>(
  name: string,
  value: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void> { ... }
```

Added in v0.5.0

# decodeBody (function)

Returns a middleware that tries to decode `connection.getBody()`

**Signature**

```ts
export function decodeBody<E, A>(f: (input: unknown) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> { ... }
```

Added in v0.5.0

# decodeHeader (function)

Returns a middleware that tries to decode `connection.getHeader(name)`

**Signature**

```ts
export function decodeHeader<E, A>(
  name: string,
  f: (input: unknown) => Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A> { ... }
```

Added in v0.5.0

# decodeMethod (function)

Returns a middleware that tries to decode `connection.getMethod()`

**Signature**

```ts
export function decodeMethod<E, A>(f: (method: string) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> { ... }
```

Added in v0.5.0

# decodeParam (function)

Returns a middleware that tries to decode `connection.getParams()[name]`

**Signature**

```ts
export function decodeParam<E, A>(
  name: string,
  f: (input: unknown) => Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A> { ... }
```

Added in v0.5.0

# decodeParams (function)

Returns a middleware that tries to decode `connection.getParams()`

**Signature**

```ts
export function decodeParams<E, A>(f: (input: unknown) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> { ... }
```

Added in v0.5.0

# decodeQuery (function)

Returns a middleware that tries to decode `connection.getQuery()`

**Signature**

```ts
export function decodeQuery<E, A>(f: (input: unknown) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> { ... }
```

Added in v0.5.0

# end (function)

Returns a middleware that ends the response without sending any response body

**Signature**

```ts
export function end<E = never>(): Middleware<BodyOpen, ResponseEnded, E, void> { ... }
```

Added in v0.5.0

# evalMiddleware (function)

**Signature**

```ts
export function evalMiddleware<I, O, E, A>(ma: Middleware<I, O, E, A>, c: Connection<I>): TE.TaskEither<E, A> { ... }
```

Added in v0.5.0

# execMiddleware (function)

**Signature**

```ts
export function execMiddleware<I, O, E, A>(
  ma: Middleware<I, O, E, A>,
  c: Connection<I>
): TE.TaskEither<E, Connection<O>> { ... }
```

Added in v0.5.0

# fromConnection (function)

**Signature**

```ts
export function fromConnection<I = StatusOpen, E = never, A = never>(
  f: (c: Connection<I>) => Either<E, A>
): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# fromIOEither (function)

**Signature**

```ts
export function fromIOEither<I = StatusOpen, E = never, A = never>(fa: IOEither<E, A>): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# fromTaskEither (function)

**Signature**

```ts
export function fromTaskEither<I = StatusOpen, E = never, A = never>(fa: TE.TaskEither<E, A>): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# gets (function)

**Signature**

```ts
export function gets<I = StatusOpen, E = never, A = never>(f: (c: Connection<I>) => A): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# header (function)

Returns a middleware that writes the given header

**Signature**

```ts
export function header<E = never>(name: string, value: string): Middleware<HeadersOpen, HeadersOpen, E, void> { ... }
```

Added in v0.5.0

# ichain (function)

**Signature**

```ts
export function ichain<A, O, Z, E, B>(
  f: (a: A) => Middleware<O, Z, E, B>
): <I>(ma: Middleware<I, O, E, A>) => Middleware<I, Z, E, B> { ... }
```

Added in v0.5.0

# iof (function)

**Signature**

```ts
export function iof<I = StatusOpen, O = StatusOpen, E = never, A = never>(a: A): Middleware<I, O, E, A> { ... }
```

Added in v0.5.0

# json (function)

Returns a middleware that sends `body` as JSON

**Signature**

```ts
export function json<E>(
  body: unknown,
  onError: (reason: unknown) => E
): Middleware<HeadersOpen, ResponseEnded, E, void> { ... }
```

Added in v0.5.0

# left (function)

**Signature**

```ts
export function left<I = StatusOpen, E = never, A = never>(e: E): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# leftIO (function)

**Signature**

```ts
export function leftIO<I = StatusOpen, E = never, A = never>(fe: IO<E>): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# leftTask (function)

**Signature**

```ts
export function leftTask<I = StatusOpen, E = never, A = never>(te: Task<E>): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# modifyConnection (function)

**Signature**

```ts
export function modifyConnection<I, O, E>(f: (c: Connection<I>) => Connection<O>): Middleware<I, O, E, void> { ... }
```

Added in v0.5.0

# orElse (function)

**Signature**

```ts
export function orElse<E, I, O, M, A>(
  f: (e: E) => Middleware<I, O, M, A>
): (ma: Middleware<I, O, E, A>) => Middleware<I, O, M, A> { ... }
```

Added in v0.5.0

# redirect (function)

Returns a middleware that sends a redirect to `uri`

**Signature**

```ts
export function redirect<E = never>(uri: string): Middleware<StatusOpen, HeadersOpen, E, void> { ... }
```

Added in v0.5.0

# right (function)

**Signature**

```ts
export function right<I = StatusOpen, E = never, A = never>(a: A): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# rightIO (function)

**Signature**

```ts
export function rightIO<I = StatusOpen, E = never, A = never>(fa: IO<A>): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# rightTask (function)

**Signature**

```ts
export function rightTask<I = StatusOpen, E = never, A = never>(fa: Task<A>): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0

# send (function)

Returns a middleware that sends `body` as response body

**Signature**

```ts
export function send<E = never>(body: string): Middleware<BodyOpen, ResponseEnded, E, void> { ... }
```

Added in v0.5.0

# status (function)

Returns a middleware that writes the response status

**Signature**

```ts
export function status<E = never>(status: Status): Middleware<StatusOpen, HeadersOpen, E, void> { ... }
```

Added in v0.5.0

# tryCatch (function)

**Signature**

```ts
export function tryCatch<I = StatusOpen, E = never, A = never>(
  f: () => Promise<A>,
  onRejected: (reason: unknown) => E
): Middleware<I, I, E, A> { ... }
```

Added in v0.5.0
