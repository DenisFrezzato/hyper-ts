---
title: index.ts
nav_order: 2
parent: Modules
---

# index overview

Added in v0.5.0

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
- [MediaType](#mediatype)
- [Status](#status)
- [URI](#uri)
- [alt](#alt)
- [ap](#ap)
- [apFirst](#apfirst)
- [apSecond](#apsecond)
- [bimap](#bimap)
- [chain](#chain)
- [chainFirst](#chainfirst)
- [clearCookie](#clearcookie)
- [closeHeaders](#closeheaders)
- [contentType](#contenttype)
- [cookie](#cookie)
- [decodeBody](#decodebody)
- [decodeHeader](#decodeheader)
- [decodeMethod](#decodemethod)
- [decodeParam](#decodeparam)
- [decodeParams](#decodeparams)
- [decodeQuery](#decodequery)
- [end](#end)
- [evalMiddleware](#evalmiddleware)
- [execMiddleware](#execmiddleware)
- [filterOrElse](#filterorelse)
- [flatten](#flatten)
- [fromConnection](#fromconnection)
- [fromEither](#fromeither)
- [fromIOEither](#fromioeither)
- [fromOption](#fromoption)
- [fromPredicate](#frompredicate)
- [fromTaskEither](#fromtaskeither)
- [gets](#gets)
- [header](#header)
- [ichain](#ichain)
- [iof](#iof)
- [json](#json)
- [left](#left)
- [leftIO](#leftio)
- [leftTask](#lefttask)
- [map](#map)
- [mapLeft](#mapleft)
- [middleware](#middleware)
- [modifyConnection](#modifyconnection)
- [orElse](#orelse)
- [redirect](#redirect)
- [right](#right)
- [rightIO](#rightio)
- [rightTask](#righttask)
- [send](#send)
- [status](#status)
- [tryCatch](#trycatch)

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

Added in v0.5.0

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

# MediaType

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

# Status

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

# URI

**Signature**

```ts
export declare const URI: 'Middleware'
```

Added in v0.5.0

# alt

**Signature**

```ts
export declare const alt: <R, E, A>(
  that: Lazy<Middleware<R, R, E, A>>
) => (fa: Middleware<R, R, E, A>) => Middleware<R, R, E, A>
```

Added in v0.5.0

# ap

**Signature**

```ts
export declare const ap: <R, E, A>(
  fa: Middleware<R, R, E, A>
) => <B>(fab: Middleware<R, R, E, (a: A) => B>) => Middleware<R, R, E, B>
```

Added in v0.5.0

# apFirst

**Signature**

```ts
export declare const apFirst: <R, E, B>(
  fb: Middleware<R, R, E, B>
) => <A>(fa: Middleware<R, R, E, A>) => Middleware<R, R, E, A>
```

Added in v0.5.0

# apSecond

**Signature**

```ts
export declare const apSecond: <R, E, B>(
  fb: Middleware<R, R, E, B>
) => <A>(fa: Middleware<R, R, E, A>) => Middleware<R, R, E, B>
```

Added in v0.5.0

# bimap

**Signature**

```ts
export declare const bimap: <E, G, A, B>(
  f: (e: E) => G,
  g: (a: A) => B
) => <R>(fa: Middleware<R, R, E, A>) => Middleware<R, R, G, B>
```

Added in v0.5.0

# chain

**Signature**

```ts
export declare const chain: <R, E, A, B>(
  f: (a: A) => Middleware<R, R, E, B>
) => (ma: Middleware<R, R, E, A>) => Middleware<R, R, E, B>
```

Added in v0.5.0

# chainFirst

**Signature**

```ts
export declare const chainFirst: <R, E, A, B>(
  f: (a: A) => Middleware<R, R, E, B>
) => (ma: Middleware<R, R, E, A>) => Middleware<R, R, E, A>
```

Added in v0.5.0

# clearCookie

Returns a middleware that clears the cookie `name`

**Signature**

```ts
export declare function clearCookie<E = never>(
  name: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void>
```

Added in v0.5.0

# closeHeaders

Returns a middleware that changes the connection status to `BodyOpen`

**Signature**

```ts
export declare function closeHeaders<E = never>(): Middleware<HeadersOpen, BodyOpen, E, void>
```

Added in v0.5.0

# contentType

Returns a middleware that sets the given `mediaType`

**Signature**

```ts
export declare function contentType<E = never>(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, E, void>
```

Added in v0.5.0

# cookie

Returns a middleware that sets the cookie `name` to `value`, with the given `options`

**Signature**

```ts
export declare function cookie<E = never>(
  name: string,
  value: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void>
```

Added in v0.5.0

# decodeBody

Returns a middleware that tries to decode `connection.getBody()`

**Signature**

```ts
export declare function decodeBody<E, A>(f: (input: unknown) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.5.0

# decodeHeader

Returns a middleware that tries to decode `connection.getHeader(name)`

**Signature**

```ts
export declare function decodeHeader<E, A>(
  name: string,
  f: (input: unknown) => Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.5.0

# decodeMethod

Returns a middleware that tries to decode `connection.getMethod()`

**Signature**

```ts
export declare function decodeMethod<E, A>(
  f: (method: string) => Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.5.0

# decodeParam

Returns a middleware that tries to decode `connection.getParams()[name]`

**Signature**

```ts
export declare function decodeParam<E, A>(
  name: string,
  f: (input: unknown) => Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.5.0

# decodeParams

Returns a middleware that tries to decode `connection.getParams()`

**Signature**

```ts
export declare function decodeParams<E, A>(
  f: (input: unknown) => Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.5.0

# decodeQuery

Returns a middleware that tries to decode `connection.getQuery()`

**Signature**

```ts
export declare function decodeQuery<E, A>(f: (input: unknown) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A>
```

Added in v0.5.0

# end

Returns a middleware that ends the response without sending any response body

**Signature**

```ts
export declare function end<E = never>(): Middleware<BodyOpen, ResponseEnded, E, void>
```

Added in v0.5.0

# evalMiddleware

**Signature**

```ts
export declare function evalMiddleware<I, O, E, A>(ma: Middleware<I, O, E, A>, c: Connection<I>): TE.TaskEither<E, A>
```

Added in v0.5.0

# execMiddleware

**Signature**

```ts
export declare function execMiddleware<I, O, E, A>(
  ma: Middleware<I, O, E, A>,
  c: Connection<I>
): TE.TaskEither<E, Connection<O>>
```

Added in v0.5.0

# filterOrElse

**Signature**

```ts
export declare const filterOrElse: {
  <E, A, B>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <R>(
    ma: Middleware<R, R, E, A>
  ) => Middleware<R, R, E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): <R>(ma: Middleware<R, R, E, A>) => Middleware<R, R, E, A>
}
```

Added in v0.5.0

# flatten

**Signature**

```ts
export declare const flatten: <R, E, A>(mma: Middleware<R, R, E, Middleware<R, R, E, A>>) => Middleware<R, R, E, A>
```

Added in v0.5.0

# fromConnection

**Signature**

```ts
export declare function fromConnection<I = StatusOpen, E = never, A = never>(
  f: (c: Connection<I>) => Either<E, A>
): Middleware<I, I, E, A>
```

Added in v0.5.0

# fromEither

**Signature**

```ts
export declare const fromEither: <R, E, A>(ma: Either<E, A>) => Middleware<R, R, E, A>
```

Added in v0.5.0

# fromIOEither

**Signature**

```ts
export declare function fromIOEither<I = StatusOpen, E = never, A = never>(fa: IOEither<E, A>): Middleware<I, I, E, A>
```

Added in v0.5.0

# fromOption

**Signature**

```ts
export declare const fromOption: <E>(onNone: Lazy<E>) => <R, A>(ma: Option<A>) => Middleware<R, R, E, A>
```

Added in v0.5.0

# fromPredicate

**Signature**

```ts
export declare const fromPredicate: {
  <E, A, B>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <U>(a: A) => Middleware<U, U, E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): <R>(a: A) => Middleware<R, R, E, A>
}
```

Added in v0.5.0

# fromTaskEither

**Signature**

```ts
export declare function fromTaskEither<I = StatusOpen, E = never, A = never>(
  fa: TE.TaskEither<E, A>
): Middleware<I, I, E, A>
```

Added in v0.5.0

# gets

**Signature**

```ts
export declare function gets<I = StatusOpen, E = never, A = never>(f: (c: Connection<I>) => A): Middleware<I, I, E, A>
```

Added in v0.5.0

# header

Returns a middleware that writes the given header

**Signature**

```ts
export declare function header<E = never>(name: string, value: string): Middleware<HeadersOpen, HeadersOpen, E, void>
```

Added in v0.5.0

# ichain

**Signature**

```ts
export declare function ichain<A, O, Z, E, B>(
  f: (a: A) => Middleware<O, Z, E, B>
): <I>(ma: Middleware<I, O, E, A>) => Middleware<I, Z, E, B>
```

Added in v0.5.0

# iof

**Signature**

```ts
export declare function iof<I = StatusOpen, O = StatusOpen, E = never, A = never>(a: A): Middleware<I, O, E, A>
```

Added in v0.5.0

# json

Returns a middleware that sends `body` as JSON

**Signature**

```ts
export declare function json<E>(
  body: unknown,
  onError: (reason: unknown) => E
): Middleware<HeadersOpen, ResponseEnded, E, void>
```

Added in v0.5.0

# left

**Signature**

```ts
export declare function left<I = StatusOpen, E = never, A = never>(e: E): Middleware<I, I, E, A>
```

Added in v0.5.0

# leftIO

**Signature**

```ts
export declare function leftIO<I = StatusOpen, E = never, A = never>(fe: IO<E>): Middleware<I, I, E, A>
```

Added in v0.5.0

# leftTask

**Signature**

```ts
export declare function leftTask<I = StatusOpen, E = never, A = never>(te: Task<E>): Middleware<I, I, E, A>
```

Added in v0.5.0

# map

**Signature**

```ts
export declare const map: <A, B>(f: (a: A) => B) => <R, E>(fa: Middleware<R, R, E, A>) => Middleware<R, R, E, B>
```

Added in v0.5.0

# mapLeft

**Signature**

```ts
export declare const mapLeft: <E, G>(f: (e: E) => G) => <R, A>(fa: Middleware<R, R, E, A>) => Middleware<R, R, G, A>
```

Added in v0.5.0

# middleware

**Signature**

```ts
export declare const middleware: Monad3<'Middleware'> &
  Alt3<'Middleware'> &
  Bifunctor3<'Middleware'> &
  MonadThrow3<'Middleware'> &
  MonadTask3<'Middleware'>
```

Added in v0.5.0

# modifyConnection

**Signature**

```ts
export declare function modifyConnection<I, O, E>(f: (c: Connection<I>) => Connection<O>): Middleware<I, O, E, void>
```

Added in v0.5.0

# orElse

**Signature**

```ts
export declare function orElse<E, I, O, M, A>(
  f: (e: E) => Middleware<I, O, M, A>
): (ma: Middleware<I, O, E, A>) => Middleware<I, O, M, A>
```

Added in v0.5.0

# redirect

Returns a middleware that sends a redirect to `uri`

**Signature**

```ts
export declare function redirect<E = never>(uri: string): Middleware<StatusOpen, HeadersOpen, E, void>
```

Added in v0.5.0

# right

**Signature**

```ts
export declare function right<I = StatusOpen, E = never, A = never>(a: A): Middleware<I, I, E, A>
```

Added in v0.5.0

# rightIO

**Signature**

```ts
export declare function rightIO<I = StatusOpen, E = never, A = never>(fa: IO<A>): Middleware<I, I, E, A>
```

Added in v0.5.0

# rightTask

**Signature**

```ts
export declare function rightTask<I = StatusOpen, E = never, A = never>(fa: Task<A>): Middleware<I, I, E, A>
```

Added in v0.5.0

# send

Returns a middleware that sends `body` as response body

**Signature**

```ts
export declare function send<E = never>(body: string): Middleware<BodyOpen, ResponseEnded, E, void>
```

Added in v0.5.0

# status

Returns a middleware that writes the response status

**Signature**

```ts
export declare function status<E = never>(status: Status): Middleware<StatusOpen, HeadersOpen, E, void>
```

Added in v0.5.0

# tryCatch

**Signature**

```ts
export declare function tryCatch<I = StatusOpen, E = never, A = never>(
  f: () => Promise<A>,
  onRejected: (reason: unknown) => E
): Middleware<I, I, E, A>
```

Added in v0.5.0
