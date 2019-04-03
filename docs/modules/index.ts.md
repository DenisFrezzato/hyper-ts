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
- [JSONArray (interface)](#jsonarray-interface)
- [ResponseEnded (interface)](#responseended-interface)
- [StatusOpen (interface)](#statusopen-interface)
- [JSON (type alias)](#json-type-alias)
- [JSONObject (type alias)](#jsonobject-type-alias)
- [Status (type alias)](#status-type-alias)
- [Middleware (class)](#middleware-class)
  - [eval (method)](#eval-method)
  - [exec (method)](#exec-method)
  - [map (method)](#map-method)
  - [ap (method)](#ap-method)
  - [chain (method)](#chain-method)
  - [chainFirst (method)](#chainfirst-method)
  - [chainSecond (method)](#chainsecond-method)
  - [ichain (method)](#ichain-method)
  - [foldMiddleware (method)](#foldmiddleware-method)
  - [mapLeft (method)](#mapleft-method)
  - [bimap (method)](#bimap-method)
  - [orElse (method)](#orelse-method)
  - [alt (method)](#alt-method)
  - [status (method)](#status-method)
  - [header (method)](#header-method)
  - [contentType (method)](#contenttype-method)
  - [cookie (method)](#cookie-method)
  - [clearCookie (method)](#clearcookie-method)
  - [closeHeaders (method)](#closeheaders-method)
  - [send (method)](#send-method)
  - [json (method)](#json-method)
  - [end (method)](#end-method)
- [Status (constant)](#status-constant)
- [closeHeaders (constant)](#closeheaders-constant)
- [end (constant)](#end-constant)
- [clearCookie (function)](#clearcookie-function)
- [contentType (function)](#contenttype-function)
- [cookie (function)](#cookie-function)
- [decodeBody (function)](#decodebody-function)
- [decodeHeader (function)](#decodeheader-function)
- [decodeMethod (function)](#decodemethod-function)
- [decodeParam (function)](#decodeparam-function)
- [decodeParams (function)](#decodeparams-function)
- [decodeQuery (function)](#decodequery-function)
- [fromConnection (function)](#fromconnection-function)
- [fromEither (function)](#fromeither-function)
- [fromIO (function)](#fromio-function)
- [fromIOEither (function)](#fromioeither-function)
- [fromLeft (function)](#fromleft-function)
- [fromPredicate (function)](#frompredicate-function)
- [fromTaskEither (function)](#fromtaskeither-function)
- [gets (function)](#gets-function)
- [header (function)](#header-function)
- [iof (function)](#iof-function)
- [json (function)](#json-function)
- [left (function)](#left-function)
- [modifyConnection (function)](#modifyconnection-function)
- [of (function)](#of-function)
- [redirect (function)](#redirect-function)
- [right (function)](#right-function)
- [send (function)](#send-function)
- [status (function)](#status-function)

---

# BodyOpen (interface)

Type indicating that headers have already been sent, and that the body is currently streaming

**Signature**

```ts
export interface BodyOpen {
  readonly BodyOpen: unique symbol
}
```

# Connection (interface)

A `Connection`, models the entirety of a connection between the HTTP server and the user agent,
both request and response.
State changes are tracked by the phantom type `S`

**Signature**

```ts
export interface Connection<S> {
  readonly _S: S
  getRequest: () => IncomingMessage
  getBody: () => unknown
  getHeader: (name: string) => unknown
  getParams: () => unknown
  getQuery: () => unknown
  getOriginalUrl: () => string
  getMethod: () => string
  setCookie: (
    this: Connection<HeadersOpen>,
    name: string,
    value: string,
    options: CookieOptions
  ) => Connection<HeadersOpen>
  clearCookie: (this: Connection<HeadersOpen>, name: string, options: CookieOptions) => Connection<HeadersOpen>
  setHeader: (this: Connection<HeadersOpen>, name: string, value: string) => Connection<HeadersOpen>
  setStatus: (this: Connection<StatusOpen>, status: Status) => Connection<HeadersOpen>
  setBody: (this: Connection<BodyOpen>, body: unknown) => Connection<ResponseEnded>
  endResponse: (this: Connection<BodyOpen>) => Connection<ResponseEnded>
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

# HeadersOpen (interface)

Type indicating that headers are ready to be sent, i.e. the body streaming has not been started

**Signature**

```ts
export interface HeadersOpen {
  readonly HeadersOpen: unique symbol
}
```

# JSONArray (interface)

**Signature**

```ts
export interface JSONArray extends Array<JSON> {}
```

# ResponseEnded (interface)

Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished

**Signature**

```ts
export interface ResponseEnded {
  readonly ResponseEnded: unique symbol
}
```

# StatusOpen (interface)

Type indicating that the status-line is ready to be sent

**Signature**

```ts
export interface StatusOpen {
  readonly StatusOpen: unique symbol
}
```

# JSON (type alias)

**Signature**

```ts
export type JSON = null | string | number | boolean | JSONArray | JSONObject
```

# JSONObject (type alias)

**Signature**

```ts
export type JSONObject = { [key: string]: JSON }
```

# Status (type alias)

**Signature**

```ts
export type Status = typeof Status[keyof typeof Status]
```

# Middleware (class)

A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates
in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output `Conn` types of the
middleware action.

**Signature**

```ts
export class Middleware<I, O, L, A> {
  constructor(readonly run: (c: Connection<I>) => TaskEither<L, [A, Connection<O>]>) { ... }
  ...
}
```

## eval (method)

**Signature**

```ts
eval(c: Connection<I>): TaskEither<L, A> { ... }
```

## exec (method)

**Signature**

```ts
exec(c: Connection<I>): TaskEither<L, Connection<O>> { ... }
```

## map (method)

**Signature**

```ts
map<I, L, A, B>(this: Middleware<I, I, L, A>, f: (a: A) => B): Middleware<I, I, L, B> { ... }
```

## ap (method)

**Signature**

```ts
ap<I, L, A, B>(this: Middleware<I, I, L, A>, fab: Middleware<I, I, L, (a: A) => B>): Middleware<I, I, L, B> { ... }
```

## chain (method)

**Signature**

```ts
chain<I, L, A, B>(this: Middleware<I, I, L, A>, f: (a: A) => Middleware<I, I, L, B>): Middleware<I, I, L, B> { ... }
```

## chainFirst (method)

Combine two effectful actions, keeping only the result of the first

**Signature**

```ts
chainFirst<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, A> { ... }
```

## chainSecond (method)

Combine two effectful actions, keeping only the result of the second

**Signature**

```ts
chainSecond<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, B> { ... }
```

## ichain (method)

**Signature**

```ts
ichain<Z, B>(f: (a: A) => Middleware<O, Z, L, B>): Middleware<I, Z, L, B> { ... }
```

## foldMiddleware (method)

**Signature**

```ts
foldMiddleware<Z, M, B>(
    onLeft: (l: L) => Middleware<I, Z, M, B>,
    onRight: (a: A) => Middleware<O, Z, M, B>
  ): Middleware<I, Z, M, B> { ... }
```

## mapLeft (method)

**Signature**

```ts
mapLeft<M>(f: (l: L) => M): Middleware<I, O, M, A> { ... }
```

## bimap (method)

**Signature**

```ts
bimap<V, B>(f: (l: L) => V, g: (a: A) => B): Middleware<I, O, V, B> { ... }
```

## orElse (method)

**Signature**

```ts
orElse<M>(f: (l: L) => Middleware<I, O, M, A>): Middleware<I, O, M, A> { ... }
```

## alt (method)

**Signature**

```ts
alt(fy: Middleware<I, O, L, A>): Middleware<I, O, L, A> { ... }
```

## status (method)

Returns a middleware that writes the response status

**Signature**

```ts
status<I, L, A>(this: Middleware<I, StatusOpen, L, A>, s: Status): Middleware<I, HeadersOpen, L, void> { ... }
```

## header (method)

Returns a middleware that writes the given headers

**Signature**

```ts
header<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    name: string,
    value: string
  ): Middleware<I, HeadersOpen, L, void> { ... }
```

## contentType (method)

Returns a middleware that sets the given `mediaType`

**Signature**

```ts
contentType<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    mediaType: MediaType
  ): Middleware<I, HeadersOpen, L, void> { ... }
```

## cookie (method)

Return a middleware that sets the cookie `name` to `value`, with the given `options`

**Signature**

```ts
cookie<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    name: string,
    value: string,
    options: CookieOptions
  ): Middleware<I, HeadersOpen, L, void> { ... }
```

## clearCookie (method)

Returns a middleware that clears the cookie `name`

**Signature**

```ts
clearCookie<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    name: string,
    options: CookieOptions
  ): Middleware<I, HeadersOpen, L, void> { ... }
```

## closeHeaders (method)

Return a middleware that changes the connection status to `BodyOpen`

**Signature**

```ts
closeHeaders<I, L, A>(this: Middleware<I, HeadersOpen, L, A>): Middleware<I, BodyOpen, L, void> { ... }
```

## send (method)

Return a middleware that sends `body` as response body

**Signature**

```ts
send<I, L, A>(this: Middleware<I, BodyOpen, L, A>, body: string): Middleware<I, ResponseEnded, L, void> { ... }
```

## json (method)

Return a middleware that sends `body` as JSON

**Signature**

```ts
json<I, L, A>(this: Middleware<I, HeadersOpen, L, A>, body: JSON): Middleware<I, ResponseEnded, L, void> { ... }
```

## end (method)

Return a middleware that ends the response without sending any response body

**Signature**

```ts
end<I, L, A>(this: Middleware<I, BodyOpen, L, A>): Middleware<I, ResponseEnded, L, void> { ... }
```

# Status (constant)

**Signature**

```ts
export const Status = ...
```

# closeHeaders (constant)

Return a middleware that changes the connection status to `BodyOpen`

**Signature**

```ts
export const closeHeaders: Middleware<HeadersOpen, BodyOpen, never, void> = ...
```

# end (constant)

Return a middleware that ends the response without sending any response body

**Signature**

```ts
export const end: Middleware<BodyOpen, ResponseEnded, never, void> = ...
```

# clearCookie (function)

Returns a middleware that clears the cookie `name`

**Signature**

```ts
export function clearCookie(name: string, options: CookieOptions): Middleware<HeadersOpen, HeadersOpen, never, void> { ... }
```

# contentType (function)

Returns a middleware that sets the given `mediaType`

**Signature**

```ts
export function contentType(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, never, void> { ... }
```

# cookie (function)

Return a middleware that sets the cookie `name` to `value`, with the given `options`

**Signature**

```ts
export function cookie(
  name: string,
  value: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, never, void> { ... }
```

# decodeBody (function)

Returns a middleware that tries to decode `connection.getBody()`

**Signature**

```ts
export function decodeBody<L, A>(f: (input: unknown) => Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A> { ... }
```

# decodeHeader (function)

Returns a middleware that tries to decode `connection.getHeader(name)`

**Signature**

```ts
export function decodeHeader<L, A>(
  name: string,
  f: (input: unknown) => Either<L, A>
): Middleware<StatusOpen, StatusOpen, L, A> { ... }
```

# decodeMethod (function)

Returns a middleware that tries to decode `connection.getMethod()`

**Signature**

```ts
export function decodeMethod<L, A>(f: (method: string) => Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A> { ... }
```

# decodeParam (function)

Returns a middleware that tries to decode `connection.getParams()[name]`

**Signature**

```ts
export function decodeParam<L, A>(
  name: string,
  f: (input: unknown) => Either<L, A>
): Middleware<StatusOpen, StatusOpen, L, A> { ... }
```

# decodeParams (function)

Returns a middleware that tries to decode `connection.getParams()`

**Signature**

```ts
export function decodeParams<L, A>(f: (input: unknown) => Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A> { ... }
```

# decodeQuery (function)

Returns a middleware that tries to decode `connection.getQuery()`

**Signature**

```ts
export function decodeQuery<L, A>(f: (input: unknown) => Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A> { ... }
```

# fromConnection (function)

**Signature**

```ts
export function fromConnection<I, L, A>(f: (c: Connection<I>) => Either<L, A>): Middleware<I, I, L, A> { ... }
```

# fromEither (function)

**Signature**

```ts
export const fromEither = <I, L, A>(fa: Either<L, A>): Middleware<I, I, L, A> => ...
```

# fromIO (function)

**Signature**

```ts
export const fromIO = <I, L, A>(fa: IO<A>): Middleware<I, I, L, A> => ...
```

# fromIOEither (function)

**Signature**

```ts
export const fromIOEither = <I, L, A>(fa: IOEither<L, A>): Middleware<I, I, L, A> => ...
```

# fromLeft (function)

**Signature**

```ts
export function fromLeft<I, L, A>(l: L): Middleware<I, I, L, A> { ... }
```

# fromPredicate (function)

**Signature**

```ts
export function fromPredicate<I, L, A, B extends A>(
  predicate: Refinement<A, B>,
  onFalse: (a: A) => L
): (a: A) => Middleware<I, I, L, A>
export function fromPredicate<I, L, A>(predicate: Predicate<A>, onFalse: (a: A) => L): (a: A) => Middleware<I, I, L, A> { ... }
```

# fromTaskEither (function)

**Signature**

```ts
export function fromTaskEither<I, L, A>(fa: TaskEither<L, A>): Middleware<I, I, L, A> { ... }
```

# gets (function)

**Signature**

```ts
export function gets<I, L, A>(f: (c: Connection<I>) => A): Middleware<I, I, L, A> { ... }
```

# header (function)

Returns a middleware that writes the given header

**Signature**

```ts
export function header(name: string, value: string): Middleware<HeadersOpen, HeadersOpen, never, void> { ... }
```

# iof (function)

**Signature**

```ts
export function iof<I, O, L, A>(a: A): Middleware<I, O, L, A> { ... }
```

# json (function)

Return a middleware that sends `body` as JSON

**Signature**

```ts
export function json(body: JSON): Middleware<HeadersOpen, ResponseEnded, never, void> { ... }
```

# left (function)

**Signature**

```ts
export function left<I, L, A>(fl: Task<L>): Middleware<I, I, L, A> { ... }
```

# modifyConnection (function)

**Signature**

```ts
export function modifyConnection<I, O, L>(f: (c: Connection<I>) => Connection<O>): Middleware<I, O, L, void> { ... }
```

# of (function)

**Signature**

```ts
export function of<I, L, A>(a: A): Middleware<I, I, L, A> { ... }
```

# redirect (function)

Return a middleware that sends a redirect to `uri`

**Signature**

```ts
export function redirect(uri: string): Middleware<StatusOpen, HeadersOpen, never, void> { ... }
```

# right (function)

**Signature**

```ts
export function right<I, L, A>(fa: Task<A>): Middleware<I, I, L, A> { ... }
```

# send (function)

Return a middleware that sends `body` as response body

**Signature**

```ts
export function send(body: string): Middleware<BodyOpen, ResponseEnded, never, void> { ... }
```

# status (function)

Returns a middleware that writes the response status

**Signature**

```ts
export function status(status: Status): Middleware<StatusOpen, HeadersOpen, never, void> { ... }
```
