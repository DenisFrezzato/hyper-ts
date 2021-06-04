/**
 * @since 0.5.0
 */
import { Alt3 } from 'fp-ts/lib/Alt'
import { Bifunctor3 } from 'fp-ts/lib/Bifunctor'
import * as E from 'fp-ts/lib/Either'
import { IO } from 'fp-ts/lib/IO'
import { IOEither } from 'fp-ts/lib/IOEither'
import { Monad3 } from 'fp-ts/lib/Monad'
import { MonadTask3 } from 'fp-ts/lib/MonadTask'
import { MonadThrow3 } from 'fp-ts/lib/MonadThrow'
import { pipe, pipeable } from 'fp-ts/lib/pipeable'
import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { IncomingMessage } from 'http'
import { Readable } from 'stream'

import Either = E.Either
import Task = T.Task

/**
 * Adapted from https://github.com/purescript-contrib/purescript-media-types
 *
 * @since 0.5.0
 */
export const MediaType = {
  applicationFormURLEncoded: 'application/x-www-form-urlencoded',
  applicationJSON: 'application/json',
  applicationJavascript: 'application/javascript',
  applicationOctetStream: 'application/octet-stream',
  applicationXML: 'application/xml',
  imageGIF: 'image/gif',
  imageJPEG: 'image/jpeg',
  imagePNG: 'image/png',
  multipartFormData: 'multipart/form-data',
  textCSV: 'text/csv',
  textHTML: 'text/html',
  textPlain: 'text/plain',
  textXML: 'text/xml'
} as const

/**
 * @since 0.5.0
 */
export type MediaType = typeof MediaType[keyof typeof MediaType]

/**
 * @since 0.5.0
 */
export const Status = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  OK: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  IMUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  SwitchProxy: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  URITooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  Teapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HTTPVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511
} as const

/**
 * @since 0.5.0
 */
export type Status = typeof Status[keyof typeof Status]

/**
 * @since 0.5.0
 */
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

/**
 * Type indicating that the status-line is ready to be sent
 *
 * @since 0.5.0
 */
export interface StatusOpen {
  readonly StatusOpen: unique symbol
}

/**
 * Type indicating that headers are ready to be sent, i.e. the body streaming has not been started
 *
 * @since 0.5.0
 */
export interface HeadersOpen {
  readonly HeadersOpen: unique symbol
}

/**
 * Type indicating that headers have already been sent, and that the body is currently streaming
 *
 * @since 0.5.0
 */
export interface BodyOpen {
  readonly BodyOpen: unique symbol
}

/**
 * Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished
 *
 * @since 0.5.0
 */
export interface ResponseEnded {
  readonly ResponseEnded: unique symbol
}

/**
 * A `Connection`, models the entirety of a connection between the HTTP server and the user agent,
 * both request and response.
 * State changes are tracked by the phantom type `S`
 *
 * @since 0.5.0
 */
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
  readonly pipeStream: (this: Connection<BodyOpen>, stream: Readable) => Connection<ResponseEnded>
  readonly endResponse: (this: Connection<BodyOpen>) => Connection<ResponseEnded>
}

/**
 * @since 0.5.0
 */
export function gets<I = StatusOpen, E = never, A = never>(f: (c: Connection<I>) => A): Middleware<I, I, E, A> {
  return c => TE.right([f(c), c])
}

/**
 * @since 0.5.0
 */
export function fromConnection<I = StatusOpen, E = never, A = never>(
  f: (c: Connection<I>) => Either<E, A>
): Middleware<I, I, E, A> {
  return c =>
    TE.fromEither(
      pipe(
        f(c),
        E.map(a => [a, c])
      )
    )
}

/**
 * @since 0.5.0
 */
export function modifyConnection<I, O, E>(f: (c: Connection<I>) => Connection<O>): Middleware<I, O, E, void> {
  return c => TE.right([undefined, f(c)])
}

declare module 'fp-ts/lib/HKT' {
  interface URItoKind3<R, E, A> {
    Middleware: Middleware<R, R, E, A>
  }
}

/**
 * @since 0.5.0
 */
export const URI = 'Middleware'

/**
 * @since 0.5.0
 */
export type URI = typeof URI

/**
 * A middleware is an indexed monadic action transforming one `Connection` to another `Connection`. It operates
 * in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output `Connection` types of the
 * middleware action.
 *
 * @since 0.5.0
 */
export interface Middleware<I, O, E, A> {
  (c: Connection<I>): TE.TaskEither<E, [A, Connection<O>]>
}

// TODO: replace with TE.chainW after upgrading to more recent versions of fp-ts
/**
 * @internal
 */
export const TEchainW = <A, E2, B>(f: (a: A) => TE.TaskEither<E2, B>) => <E1>(
  ma: TE.TaskEither<E1, A>
): TE.TaskEither<E1 | E2, B> =>
  pipe(
    ma,
    T.chain(e => (E.isLeft(e) ? TE.left<E1 | E2, B>(e.left) : f(e.right)))
  )

/**
 * @since 0.6.1
 */
export function ichainW<A, O, Z, E, B>(
  f: (a: A) => Middleware<O, Z, E, B>
): <I, D>(ma: Middleware<I, O, D, A>) => Middleware<I, Z, D | E, B> {
  return ma => ci =>
    pipe(
      ma(ci),
      TEchainW(([a, co]) => f(a)(co))
    )
}

/**
 * @since 0.5.0
 */
export const ichain: <A, O, Z, E, B>(
  f: (a: A) => Middleware<O, Z, E, B>
) => <I>(ma: Middleware<I, O, E, A>) => Middleware<I, Z, E, B> = ichainW

/**
 * @since 0.5.0
 */
export function evalMiddleware<I, O, E, A>(ma: Middleware<I, O, E, A>, c: Connection<I>): TE.TaskEither<E, A> {
  return pipe(
    ma(c),
    TE.map(([a]) => a)
  )
}

/**
 * @since 0.5.0
 */
export function execMiddleware<I, O, E, A>(
  ma: Middleware<I, O, E, A>,
  c: Connection<I>
): TE.TaskEither<E, Connection<O>> {
  return pipe(
    ma(c),
    TE.map(([, c]) => c)
  )
}

/**
 * @since 0.5.0
 */
export function orElse<E, I, O, M, A>(
  f: (e: E) => Middleware<I, O, M, A>
): (ma: Middleware<I, O, E, A>) => Middleware<I, O, M, A> {
  return ma => c =>
    pipe(
      ma(c),
      TE.orElse(e => f(e)(c))
    )
}

/**
 * @since 0.5.0
 */
export function iof<I = StatusOpen, O = StatusOpen, E = never, A = never>(a: A): Middleware<I, O, E, A> {
  return c => TE.right([a, c as any])
}

/**
 * @since 0.5.0
 */
export function tryCatch<I = StatusOpen, E = never, A = never>(
  f: () => Promise<A>,
  onRejected: (reason: unknown) => E
): Middleware<I, I, E, A> {
  return fromTaskEither(TE.tryCatch(f, onRejected))
}

/**
 * @since 0.5.0
 */
export function fromTaskEither<I = StatusOpen, E = never, A = never>(fa: TE.TaskEither<E, A>): Middleware<I, I, E, A> {
  return c =>
    pipe(
      fa,
      TE.map(a => [a, c])
    )
}

/**
 * @since 0.5.0
 */
export function right<I = StatusOpen, E = never, A = never>(a: A): Middleware<I, I, E, A> {
  return iof(a)
}

/**
 * @since 0.5.0
 */
export function left<I = StatusOpen, E = never, A = never>(e: E): Middleware<I, I, E, A> {
  return fromTaskEither(TE.left(e))
}

/**
 * @since 0.5.0
 */
export function rightTask<I = StatusOpen, E = never, A = never>(fa: Task<A>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.rightTask(fa))
}

/**
 * @since 0.5.0
 */
export function leftTask<I = StatusOpen, E = never, A = never>(te: Task<E>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.leftTask(te))
}

/**
 * @since 0.5.0
 */
export function rightIO<I = StatusOpen, E = never, A = never>(fa: IO<A>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.rightIO(fa))
}

/**
 * @since 0.5.0
 */
export function leftIO<I = StatusOpen, E = never, A = never>(fe: IO<E>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.leftIO(fe))
}

/**
 * @since 0.5.0
 */
export function fromIOEither<I = StatusOpen, E = never, A = never>(fa: IOEither<E, A>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.fromIOEither(fa))
}

/**
 * Returns a middleware that writes the response status
 *
 * @since 0.5.0
 */
export function status<E = never>(status: Status): Middleware<StatusOpen, HeadersOpen, E, void> {
  return modifyConnection(c => c.setStatus(status))
}

/**
 * Returns a middleware that writes the given header
 *
 * @since 0.5.0
 */
export function header<E = never>(name: string, value: string): Middleware<HeadersOpen, HeadersOpen, E, void> {
  return modifyConnection(c => c.setHeader(name, value))
}

/**
 * Returns a middleware that sets the given `mediaType`
 *
 * @since 0.5.0
 */
export function contentType<E = never>(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, E, void> {
  return header('Content-Type', mediaType)
}

/**
 * Returns a middleware that sets the cookie `name` to `value`, with the given `options`
 *
 * @since 0.5.0
 */
export function cookie<E = never>(
  name: string,
  value: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void> {
  return modifyConnection(c => c.setCookie(name, value, options))
}

/**
 * Returns a middleware that clears the cookie `name`
 *
 * @since 0.5.0
 */
export function clearCookie<E = never>(
  name: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void> {
  return modifyConnection(c => c.clearCookie(name, options))
}

const closedHeaders: Middleware<HeadersOpen, BodyOpen, never, void> = iof(undefined)

/**
 * Returns a middleware that changes the connection status to `BodyOpen`
 *
 * @since 0.5.0
 */
export function closeHeaders<E = never>(): Middleware<HeadersOpen, BodyOpen, E, void> {
  return closedHeaders
}

/**
 * Returns a middleware that sends `body` as response body
 *
 * @since 0.5.0
 */
export function send<E = never>(body: string): Middleware<BodyOpen, ResponseEnded, E, void> {
  return modifyConnection(c => c.setBody(body))
}

const ended: Middleware<BodyOpen, ResponseEnded, never, void> = modifyConnection(c => c.endResponse())

/**
 * Returns a middleware that ends the response without sending any response body
 *
 * @since 0.5.0
 */
export function end<E = never>(): Middleware<BodyOpen, ResponseEnded, E, void> {
  return ended
}

/**
 * Returns a middleware that sends `body` as JSON
 *
 * @since 0.5.0
 */
export function json<E>(
  body: unknown,
  onError: (reason: unknown) => E
): Middleware<HeadersOpen, ResponseEnded, E, void> {
  return pipe(
    fromEither<HeadersOpen, E, string>(E.stringifyJSON(body, onError)),
    ichain(json =>
      pipe(
        contentType<E>(MediaType.applicationJSON),
        ichain(() => closeHeaders()),
        ichain(() => send(json))
      )
    )
  )
}

/**
 * Returns a middleware that sends a redirect to `uri`
 *
 * @since 0.5.0
 */
export function redirect<E = never>(uri: string): Middleware<StatusOpen, HeadersOpen, E, void> {
  return pipe(
    status(Status.Found),
    ichain(() => header('Location', uri))
  )
}

/**
 * Returns a middleware that pipes a stream to the response object.
 *
 * @since 0.6.2
 */
export function pipeStream<E>(stream: Readable): Middleware<BodyOpen, ResponseEnded, E, void> {
  return modifyConnection(c => c.pipeStream(stream))
}

const isUnknownRecord = (u: unknown): u is Record<string, unknown> => u !== null && typeof u === 'object'

/**
 * Returns a middleware that tries to decode `connection.getParams()[name]`
 *
 * @since 0.5.0
 */
export function decodeParam<E, A>(
  name: string,
  f: (input: unknown) => Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection(c => {
    const params = c.getParams()
    return f(isUnknownRecord(params) ? params[name] : undefined)
  })
}

/**
 * Returns a middleware that tries to decode `connection.getParams()`
 *
 * @since 0.5.0
 */
export function decodeParams<E, A>(f: (input: unknown) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection(c => f(c.getParams()))
}

/**
 * Returns a middleware that tries to decode `connection.getQuery()`
 *
 * @since 0.5.0
 */
export function decodeQuery<E, A>(f: (input: unknown) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection(c => f(c.getQuery()))
}

/**
 * Returns a middleware that tries to decode `connection.getBody()`
 *
 * @since 0.5.0
 */
export function decodeBody<E, A>(f: (input: unknown) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection(c => f(c.getBody()))
}

/**
 * Returns a middleware that tries to decode `connection.getMethod()`
 *
 * @since 0.5.0
 */
export function decodeMethod<E, A>(f: (method: string) => Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection(c => f(c.getMethod()))
}

/**
 * Returns a middleware that tries to decode `connection.getHeader(name)`
 *
 * @since 0.5.0
 */
export function decodeHeader<E, A>(
  name: string,
  f: (input: unknown) => Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection(c => f(c.getHeader(name)))
}

/**
 * @since 0.6.1
 */
export const Do =
  /*#__PURE__*/
  iof<unknown, unknown, never, {}>({})

/**
 * @internal
 */
const bind_ = <A, N extends string, B>(
  a: A,
  name: Exclude<N, keyof A>,
  b: B
): { [K in keyof A | N]: K extends keyof A ? A[K] : B } => Object.assign({}, a, { [name]: b }) as any

/**
 * @internal
 */
const bindTo_ = <N extends string>(name: N) => <B>(b: B): { [K in N]: B } => ({ [name]: b } as any)

/**
 * @since 0.6.1
 */
export const bindTo = <N extends string>(
  name: N
): (<I, E, A>(fa: Middleware<I, I, E, A>) => Middleware<I, I, E, { [K in N]: A }>) => map(bindTo_(name))

/**
 * @since 0.6.1
 */
export const bindW = <N extends string, I, A, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Middleware<I, I, E2, B>
): (<E1>(
  fa: Middleware<I, I, E1, A>
) => Middleware<I, I, E1 | E2, { [K in keyof A | N]: K extends keyof A ? A[K] : B }>) =>
  ichainW(a =>
    pipe(
      f(a),
      map(b => bind_(a, name, b))
    )
  )

/**
 * @since 0.6.1
 */
export const bind: <N extends string, I, E, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Middleware<I, I, E, B>
) => (fa: Middleware<I, I, E, A>) => Middleware<I, I, E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = bindW

/**
 * @since 0.5.0
 */
export const middleware: Monad3<URI> & Alt3<URI> & Bifunctor3<URI> & MonadThrow3<URI> & MonadTask3<URI> = {
  URI,
  map: (ma, f) => ci =>
    pipe(
      ma(ci),
      TE.map(([a, co]) => [f(a), co])
    ),
  of: right,
  ap: (mab, ma) => middleware.chain(mab, f => middleware.map(ma, a => f(a))),
  chain: (ma, f) => pipe(ma, ichain(f)),
  alt: (fx, f) => c =>
    pipe(
      fx(c),
      TE.alt(() => f()(c))
    ),
  bimap: (fea, f, g) => c =>
    pipe(
      fea(c),
      TE.bimap(f, ([a, c]) => [g(a), c])
    ),
  mapLeft: (fea, f) => c => pipe(fea(c), TE.mapLeft(f)),
  throwError: left,
  fromIO: rightIO,
  fromTask: rightTask
}

const {
  alt,
  ap,
  apFirst,
  apSecond,
  bimap,
  chain,
  chainFirst,
  flatten,
  map,
  mapLeft,
  filterOrElse,
  fromEither,
  fromOption,
  fromPredicate
} = pipeable(middleware)

export {
  /**
   * @since 0.5.0
   */
  alt,
  /**
   * @since 0.5.0
   */
  ap,
  /**
   * @since 0.5.0
   */
  apFirst,
  /**
   * @since 0.5.0
   */
  apSecond,
  /**
   * @since 0.5.0
   */
  bimap,
  /**
   * @since 0.5.0
   */
  chain,
  /**
   * @since 0.5.0
   */
  chainFirst,
  /**
   * @since 0.5.0
   */
  flatten,
  /**
   * @since 0.5.0
   */
  map,
  /**
   * @since 0.5.0
   */
  mapLeft,
  /**
   * @since 0.5.0
   */
  filterOrElse,
  /**
   * @since 0.5.0
   */
  fromEither,
  /**
   * @since 0.5.0
   */
  fromOption,
  /**
   * @since 0.5.0
   */
  fromPredicate
}
