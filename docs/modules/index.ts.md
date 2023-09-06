---
title: index.ts
nav_order: 2
parent: Modules
---

## index overview

Added in v0.5.0

---

<h2 class="text-delta">Table of contents</h2>

- [Apply](#apply)
  - [~~apW~~](#apw)
  - [~~ap~~](#ap)
- [Bifunctor](#bifunctor)
  - [~~bimap~~](#bimap)
  - [~~mapLeft~~](#mapleft)
- [Functor](#functor)
  - [~~map~~](#map)
- [Monad](#monad)
  - [~~chainW~~](#chainw)
  - [~~chain~~](#chain)
  - [~~ichainW~~](#ichainw)
  - [~~ichain~~](#ichain)
- [Pointed](#pointed)
  - [~~iof~~](#iof)
  - [~~of~~](#of)
- [combinators](#combinators)
  - [~~orElse~~](#orelse)
- [constructor](#constructor)
  - [~~clearCookie~~](#clearcookie)
  - [~~closeHeaders~~](#closeheaders)
  - [~~contentType~~](#contenttype)
  - [~~cookie~~](#cookie)
  - [~~decodeBody~~](#decodebody)
  - [~~decodeHeader~~](#decodeheader)
  - [~~decodeMethod~~](#decodemethod)
  - [~~decodeParams~~](#decodeparams)
  - [~~decodeParam~~](#decodeparam)
  - [~~decodeQuery~~](#decodequery)
  - [~~end~~](#end)
  - [~~fromConnection~~](#fromconnection)
  - [~~fromIOEither~~](#fromioeither)
  - [~~fromTaskEither~~](#fromtaskeither)
  - [~~gets~~](#gets)
  - [~~header~~](#header)
  - [~~json~~](#json)
  - [~~leftIO~~](#leftio)
  - [~~leftTask~~](#lefttask)
  - [~~left~~](#left)
  - [~~modifyConnection~~](#modifyconnection)
  - [~~pipeStream~~](#pipestream)
  - [~~redirect~~](#redirect)
  - [~~rightIO~~](#rightio)
  - [~~rightTask~~](#righttask)
  - [~~right~~](#right)
  - [~~send~~](#send)
  - [~~status~~](#status)
- [instances](#instances)
  - [~~URI~~](#uri)
  - [~~URI~~ (type alias)](#uri-type-alias)
  - [~~middleware~~](#middleware)
- [interop](#interop)
  - [~~tryCatch~~](#trycatch)
- [model](#model)
  - [Connection (interface)](#connection-interface)
  - [~~Middleware~~ (type alias)](#middleware-type-alias)
- [utils](#utils)
  - [BodyOpen (interface)](#bodyopen-interface)
  - [CookieOptions (interface)](#cookieoptions-interface)
  - [HeadersOpen (interface)](#headersopen-interface)
  - [MediaType](#mediatype)
  - [MediaType (type alias)](#mediatype-type-alias)
  - [ResponseEnded (interface)](#responseended-interface)
  - [Status](#status)
  - [Status (type alias)](#status-type-alias)
  - [StatusOpen (interface)](#statusopen-interface)
  - [~~Do~~](#do)
  - [~~bindTo~~](#bindto)
  - [~~bindW~~](#bindw)
  - [~~bind~~](#bind)
  - [~~evalMiddleware~~](#evalmiddleware)
  - [~~execMiddleware~~](#execmiddleware)

---

# Apply

## ~~apW~~

Use [`apW`](./Middleware.ts.html#apw) instead.

**Signature**

```ts
export declare const apW: <I, E2, A>(
  fa: M.Middleware<I, I, E2, A>
) => <E1, B>(fab: M.Middleware<I, I, E1, (a: A) => B>) => M.Middleware<I, I, E2 | E1, B>
```

Added in v0.6.3

## ~~ap~~

Use [`ap`](./Middleware.ts.html#ap) instead.

**Signature**

```ts
export declare const ap: <I, E, A>(
  fa: M.Middleware<I, I, E, A>
) => <B>(fab: M.Middleware<I, I, E, (a: A) => B>) => M.Middleware<I, I, E, B>
```

Added in v0.6.3

# Bifunctor

## ~~bimap~~

Use [`bimap`](./Middleware.ts.html#bimap) instead.

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B
) => <I>(fa: M.Middleware<I, I, E, A>) => M.Middleware<I, I, G, B>
```

Added in v0.6.3

## ~~mapLeft~~

Use [`mapLeft`](./Middleware.ts.html#mapLeft) instead.

**Signature**

```ts
export declare const mapLeft: <E, G>(f: (e: E) => G) => <I, A>(fa: M.Middleware<I, I, E, A>) => M.Middleware<I, I, G, A>
```

Added in v0.6.3

# Functor

## ~~map~~

Use [`map`](./Middleware.ts.html#map) instead.

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => <I, E>(fa: M.Middleware<I, I, E, A>) => M.Middleware<I, I, E, B>
```

Added in v0.5.0

# Monad

## ~~chainW~~

Use [`chainW`](./Middleware.ts.html#chainW) instead.

**Signature**

```ts
export declare const chainW: <I, E2, A, B>(
  f: (a: A) => M.Middleware<I, I, E2, B>
) => <E1>(ma: M.Middleware<I, I, E1, A>) => M.Middleware<I, I, E2 | E1, B>
```

Added in v0.6.3

## ~~chain~~

Use [`chain`](./Middleware.ts.html#chain) instead.

**Signature**

```ts
export declare const chain: <I, E, A, B>(
  f: (a: A) => M.Middleware<I, I, E, B>
) => (ma: M.Middleware<I, I, E, A>) => M.Middleware<I, I, E, B>
```

Added in v0.6.3

## ~~ichainW~~

Use [`ichainW`](./Middleware.ts.html#ichainW) instead.

**Signature**

```ts
export declare const ichainW: typeof M.ichainW
```

Added in v0.6.1

## ~~ichain~~

Use [`ichain`](./Middleware.ts.html#ichain) instead.

**Signature**

```ts
export declare const ichain: <A, O, Z, E, B>(
  f: (a: A) => M.Middleware<O, Z, E, B>
) => <I>(ma: M.Middleware<I, O, E, A>) => M.Middleware<I, Z, E, B>
```

Added in v0.5.0

# Pointed

## ~~iof~~

Use [`iof`](./Middleware.ts.html#iof) instead.

**Signature**

```ts
export declare const iof: typeof M.iof
```

Added in v0.5.0

## ~~of~~

Use [`of`](./Middleware.ts.html#of) instead.

**Signature**

```ts
export declare const of: <I = StatusOpen, E = never, A = never>(a: A) => M.Middleware<I, I, E, A>
```

Added in v0.6.3

# combinators

## ~~orElse~~

Use [`orElse`](./Middleware.ts.html#orelse) instead.

**Signature**

```ts
export declare const orElse: <E, I, O, M, A>(
  f: (e: E) => M.Middleware<I, O, M, A>
) => (ma: M.Middleware<I, O, E, A>) => M.Middleware<I, O, M, A>
```

Added in v0.5.0

# constructor

## ~~clearCookie~~

Use [`clearCookie`](./Middleware.ts.html#clearCookie) instead.

**Signature**

```ts
export declare const clearCookie: typeof M.clearCookie
```

Added in v0.5.0

## ~~closeHeaders~~

Use [`closeHeaders`](./Middleware.ts.html#closeHeaders) instead.

**Signature**

```ts
export declare const closeHeaders: typeof M.closeHeaders
```

Added in v0.5.0

## ~~contentType~~

Use [`contentType`](./Middleware.ts.html#contentType) instead.

**Signature**

```ts
export declare const contentType: typeof M.contentType
```

Added in v0.5.0

## ~~cookie~~

Use [`cookie`](./Middleware.ts.html#cookie) instead.

**Signature**

```ts
export declare const cookie: typeof M.cookie
```

Added in v0.5.0

## ~~decodeBody~~

Use [`decodeBody`](./Middleware.ts.html#decodeBody) instead.

**Signature**

```ts
export declare const decodeBody: typeof M.decodeBody
```

Added in v0.5.0

## ~~decodeHeader~~

Use [`decodeHeader`](./Middleware.ts.html#decodeHeader) instead.

**Signature**

```ts
export declare const decodeHeader: typeof M.decodeHeader
```

Added in v0.5.0

## ~~decodeMethod~~

Use [`decodeMethod`](./Middleware.ts.html#decodeMethod) instead.

**Signature**

```ts
export declare const decodeMethod: typeof M.decodeMethod
```

Added in v0.5.0

## ~~decodeParams~~

Use [`decodeParams`](./Middleware.ts.html#decodeParams) instead.

**Signature**

```ts
export declare const decodeParams: typeof M.decodeParams
```

Added in v0.5.0

## ~~decodeParam~~

Use [`decodeParam`](./Middleware.ts.html#decodeParam) instead.

**Signature**

```ts
export declare const decodeParam: typeof M.decodeParam
```

Added in v0.5.0

## ~~decodeQuery~~

Use [`decodeQuery`](./Middleware.ts.html#decodeQuery) instead.

**Signature**

```ts
export declare const decodeQuery: typeof M.decodeQuery
```

Added in v0.5.0

## ~~end~~

Use [`end`](./Middleware.ts.html#end) instead.

**Signature**

```ts
export declare const end: typeof M.end
```

Added in v0.5.0

## ~~fromConnection~~

Use [`fromConnection`](./Middleware.ts.html#fromConnection) instead.

**Signature**

```ts
export declare const fromConnection: typeof M.fromConnection
```

Added in v0.5.0

## ~~fromIOEither~~

Use [`fromIOEither`](./Middleware.ts.html#fromIOEither) instead.

**Signature**

```ts
export declare const fromIOEither: typeof M.fromIOEither
```

Added in v0.5.0

## ~~fromTaskEither~~

Use [`fromTaskEither`](./Middleware.ts.html#fromTaskEither) instead.

**Signature**

```ts
export declare const fromTaskEither: typeof M.fromTaskEither
```

Added in v0.5.0

## ~~gets~~

Use [`gets`](./Middleware.ts.html#gets) instead.

**Signature**

```ts
export declare const gets: typeof M.gets
```

Added in v0.5.0

## ~~header~~

Use [`header`](./Middleware.ts.html#header) instead.

**Signature**

```ts
export declare const header: typeof M.header
```

Added in v0.5.0

## ~~json~~

Use [`json`](./Middleware.ts.html#json) instead.

**Signature**

```ts
export declare const json: typeof M.json
```

Added in v0.5.0

## ~~leftIO~~

Use [`leftIO`](./Middleware.ts.html#leftIO) instead.

**Signature**

```ts
export declare const leftIO: typeof M.leftIO
```

Added in v0.5.0

## ~~leftTask~~

Use [`leftTask`](./Middleware.ts.html#leftTask) instead.

**Signature**

```ts
export declare const leftTask: typeof M.leftTask
```

Added in v0.5.0

## ~~left~~

Use [`left`](./Middleware.ts.html#left) instead.

**Signature**

```ts
export declare const left: typeof M.left
```

Added in v0.5.0

## ~~modifyConnection~~

Use [`modifyConnection`](./Middleware.ts.html#modifyConnection) instead.

**Signature**

```ts
export declare const modifyConnection: typeof M.modifyConnection
```

Added in v0.5.0

## ~~pipeStream~~

Use [`pipeStream`](./Middleware.ts.html#pipeStream) instead.

**Signature**

```ts
export declare const pipeStream: typeof M.pipeStream
```

Added in v0.6.2

## ~~redirect~~

Use [`redirect`](./Middleware.ts.html#redirect) instead.

**Signature**

```ts
export declare const redirect: typeof M.redirect
```

Added in v0.5.0

## ~~rightIO~~

Use [`rightIO`](./Middleware.ts.html#rightIO) instead.

**Signature**

```ts
export declare const rightIO: typeof M.rightIO
```

Added in v0.5.0

## ~~rightTask~~

Use [`rightTask`](./Middleware.ts.html#rightTask) instead.

**Signature**

```ts
export declare const rightTask: typeof M.rightTask
```

Added in v0.5.0

## ~~right~~

Use [`right`](./Middleware.ts.html#right) instead.

**Signature**

```ts
export declare const right: typeof M.right
```

Added in v0.5.0

## ~~send~~

Use [`send`](./Middleware.ts.html#send) instead.

**Signature**

```ts
export declare const send: typeof M.send
```

Added in v0.5.0

## ~~status~~

Use [`status`](./Middleware.ts.html#status) instead.

**Signature**

```ts
export declare const status: typeof M.status
```

Added in v0.5.0

# instances

## ~~URI~~

Use [`URI`](./Middleware.ts.html#uri) instead.

**Signature**

```ts
export declare const URI: 'Middleware'
```

Added in v0.5.0

## ~~URI~~ (type alias)

Use [`URI`](./Middleware.ts.html#uri) instead.

**Signature**

```ts
export type URI = typeof M.URI
```

Added in v0.5.0

## ~~middleware~~

Use smaller instances from [`Middleware`](./Middleware.ts.html) module instead.

**Signature**

```ts
export declare const middleware: Monad3<'Middleware'> &
  Alt3<'Middleware'> &
  Bifunctor3<'Middleware'> &
  MonadThrow3<'Middleware'> &
  MonadTask3<'Middleware'>
```

Added in v0.5.0

# interop

## ~~tryCatch~~

Use [`tryCatch`](./Middleware.ts.html#tryCatch) instead.

**Signature**

```ts
export declare const tryCatch: typeof M.tryCatch
```

Added in v0.5.0

# model

## Connection (interface)

A `Connection`, models the entirety of a connection between the HTTP server and the user agent,
both request and response.
State changes are tracked by the phantom type `S`

**Signature**

```ts
export interface Connection<S> {
  /**
   * @since 0.5.0
   */
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
  readonly setBody: (this: Connection<BodyOpen>, body: string | Buffer) => Connection<ResponseEnded>
  readonly pipeStream: (
    this: Connection<BodyOpen>,
    stream: NodeJS.ReadableStream,
    onError: (e: unknown) => IO<void>
  ) => Connection<ResponseEnded>
  readonly endResponse: (this: Connection<BodyOpen>) => Connection<ResponseEnded>
}
```

Added in v0.5.0

## ~~Middleware~~ (type alias)

Use [`Middleware`](./Middleware.ts.html#middleware) instead.

**Signature**

```ts
export type Middleware<I, O, E, A> = M.Middleware<I, O, E, A>
```

Added in v0.5.0

# utils

## BodyOpen (interface)

Type indicating that headers have already been sent, and that the body is currently streaming

**Signature**

```ts
export interface BodyOpen {
  readonly BodyOpen: unique symbol
}
```

Added in v0.5.0

## CookieOptions (interface)

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

## HeadersOpen (interface)

Type indicating that headers are ready to be sent, i.e. the body streaming has not been started

**Signature**

```ts
export interface HeadersOpen {
  readonly HeadersOpen: unique symbol
}
```

Added in v0.5.0

## MediaType

Adapted from https://github.com/purescript-contrib/purescript-media-types

**Signature**

```ts
export declare const MediaType: {
  readonly applicationFormURLEncoded: 'application/x-www-form-urlencoded'
  readonly applicationJSON: 'application/json'
  readonly applicationJavascript: 'application/javascript'
  readonly applicationOctetStream: 'application/octet-stream'
  readonly applicationXML: 'application/xml'
  readonly imageGIF: 'image/gif'
  readonly imageJPEG: 'image/jpeg'
  readonly imagePNG: 'image/png'
  readonly multipartFormData: 'multipart/form-data'
  readonly textCSV: 'text/csv'
  readonly textHTML: 'text/html'
  readonly textPlain: 'text/plain'
  readonly textXML: 'text/xml'
}
```

Added in v0.5.0

## MediaType (type alias)

**Signature**

```ts
export type MediaType = typeof MediaType[keyof typeof MediaType]
```

Added in v0.5.0

## ResponseEnded (interface)

Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished

**Signature**

```ts
export interface ResponseEnded {
  readonly ResponseEnded: unique symbol
}
```

Added in v0.5.0

## Status

**Signature**

```ts
export declare const Status: {
  readonly Continue: 100
  readonly SwitchingProtocols: 101
  readonly Processing: 102
  readonly EarlyHints: 103
  readonly OK: 200
  readonly Created: 201
  readonly Accepted: 202
  readonly NonAuthoritativeInformation: 203
  readonly NoContent: 204
  readonly ResetContent: 205
  readonly PartialContent: 206
  readonly MultiStatus: 207
  readonly AlreadyReported: 208
  readonly IMUsed: 226
  readonly MultipleChoices: 300
  readonly MovedPermanently: 301
  readonly Found: 302
  readonly SeeOther: 303
  readonly NotModified: 304
  readonly UseProxy: 305
  readonly SwitchProxy: 306
  readonly TemporaryRedirect: 307
  readonly PermanentRedirect: 308
  readonly BadRequest: 400
  readonly Unauthorized: 401
  readonly PaymentRequired: 402
  readonly Forbidden: 403
  readonly NotFound: 404
  readonly MethodNotAllowed: 405
  readonly NotAcceptable: 406
  readonly ProxyAuthenticationRequired: 407
  readonly RequestTimeout: 408
  readonly Conflict: 409
  readonly Gone: 410
  readonly LengthRequired: 411
  readonly PreconditionFailed: 412
  readonly PayloadTooLarge: 413
  readonly URITooLong: 414
  readonly UnsupportedMediaType: 415
  readonly RangeNotSatisfiable: 416
  readonly ExpectationFailed: 417
  readonly Teapot: 418
  readonly MisdirectedRequest: 421
  readonly UnprocessableEntity: 422
  readonly Locked: 423
  readonly FailedDependency: 424
  readonly TooEarly: 425
  readonly UpgradeRequired: 426
  readonly PreconditionRequired: 428
  readonly TooManyRequests: 429
  readonly RequestHeaderFieldsTooLarge: 431
  readonly UnavailableForLegalReasons: 451
  readonly InternalServerError: 500
  readonly NotImplemented: 501
  readonly BadGateway: 502
  readonly ServiceUnavailable: 503
  readonly GatewayTimeout: 504
  readonly HTTPVersionNotSupported: 505
  readonly VariantAlsoNegotiates: 506
  readonly InsufficientStorage: 507
  readonly LoopDetected: 508
  readonly NotExtended: 510
  readonly NetworkAuthenticationRequired: 511
}
```

Added in v0.5.0

## Status (type alias)

**Signature**

```ts
export type Status = typeof Status[keyof typeof Status]
```

Added in v0.5.0

## StatusOpen (interface)

Type indicating that the status-line is ready to be sent

**Signature**

```ts
export interface StatusOpen {
  readonly StatusOpen: unique symbol
}
```

Added in v0.5.0

## ~~Do~~

Use [`Do`](./Middleware.ts.html#do) instead.

**Signature**

```ts
export declare const Do: M.Middleware<unknown, unknown, never, {}>
```

Added in v0.6.1

## ~~bindTo~~

Use [`bindTo`](./Middleware.ts.html#bindTo) instead.

**Signature**

```ts
export declare const bindTo: <N>(
  name: N
) => <R, E, A>(fa: M.Middleware<R, R, E, A>) => M.Middleware<R, R, E, { readonly [K in N]: A }>
```

Added in v0.6.1

## ~~bindW~~

Use [`bindW`](./Middleware.ts.html#bindW) instead.

**Signature**

```ts
export declare const bindW: <N extends string, I, A, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => M.Middleware<I, I, E2, B>
) => <E1>(
  fa: M.Middleware<I, I, E1, A>
) => M.Middleware<I, I, E2 | E1, { [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.6.1

## ~~bind~~

Use [`bind`](./Middleware.ts.html#bind) instead.

**Signature**

```ts
export declare const bind: <N, A, R, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => M.Middleware<R, R, E, B>
) => (
  ma: M.Middleware<R, R, E, A>
) => M.Middleware<R, R, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }>
```

Added in v0.6.1

## ~~evalMiddleware~~

Use [`evalMiddleware`](./Middleware.ts.html#evalMiddleware) instead.

**Signature**

```ts
export declare const evalMiddleware: typeof M.evalMiddleware
```

Added in v0.5.0

## ~~execMiddleware~~

Use [`execMiddleware`](./Middleware.ts.html#execMiddleware) instead.

**Signature**

```ts
export declare const execMiddleware: typeof M.execMiddleware
```

Added in v0.5.0
