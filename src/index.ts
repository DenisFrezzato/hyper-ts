/**
 * @since 0.5.0
 */
import { Bifunctor3 } from 'fp-ts/Bifunctor'
import { Alt3 } from 'fp-ts/Alt'
import { Monad3 } from 'fp-ts/Monad'
import { MonadTask3 } from 'fp-ts/MonadTask'
import { MonadThrow3 } from 'fp-ts/MonadThrow'
import { IncomingMessage } from 'http'
import * as M from './Middleware'

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
  textXML: 'text/xml',
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
  NetworkAuthenticationRequired: 511,
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
 * @category model
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
  readonly pipeStream: (this: Connection<BodyOpen>, stream: NodeJS.ReadableStream) => Connection<ResponseEnded>
  readonly endResponse: (this: Connection<BodyOpen>) => Connection<ResponseEnded>
}

/**
 * Use [`gets`](./Middleware.ts.html#gets) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const gets = M.gets

/**
 * Use [`fromConnection`](./Middleware.ts.html#fromConnection) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const fromConnection = M.fromConnection

/**
 * Use [`modifyConnection`](./Middleware.ts.html#modifyConnection) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const modifyConnection = M.modifyConnection

/**
 * Use [`URI`](./Middleware.ts.html#uri) instead.
 *
 * @category instances
 * @since 0.5.0
 * @deprecated
 */
export const URI = M.URI

/**
 * Use [`URI`](./Middleware.ts.html#uri) instead.
 *
 * @category instances
 * @since 0.5.0
 * @deprecated
 */
export type URI = typeof M.URI

/**
 * Use [`Middleware`](./Middleware.ts.html#middleware) instead.
 *
 * @category model
 * @since 0.5.0
 * @deprecated
 */
export type Middleware<I, O, E, A> = M.Middleware<I, O, E, A>

/**
 * Use [`map`](./Middleware.ts.html#map) instead.
 *
 * @category Functor
 * @since 0.5.0
 * @deprecated
 */
export const map = M.map

/**
 * Use [`bimap`](./Middleware.ts.html#bimap) instead.
 *
 * @category Bifunctor
 * @since 0.6.3
 * @deprecated
 */
export const bimap = M.bimap

/**
 * Use [`mapLeft`](./Middleware.ts.html#mapLeft) instead.
 *
 * @category Bifunctor
 * @since 0.6.3
 * @deprecated
 */
export const mapLeft = M.mapLeft

/**
 * Use [`ap`](./Middleware.ts.html#ap) instead.
 *
 * @category Apply
 * @since 0.6.3
 * @deprecated
 */
export const ap = M.ap

/**
 * Use [`apW`](./Middleware.ts.html#apw) instead.
 *
 * @category Apply
 * @since 0.6.3
 * @deprecated
 */
export const apW = M.apW

/**
 * Use [`of`](./Middleware.ts.html#of) instead.
 *
 * @category Pointed
 * @since 0.6.3
 * @deprecated
 */
export const of = M.of

/**
 * Use [`iof`](./Middleware.ts.html#iof) instead.
 *
 * @category Pointed
 * @since 0.5.0
 * @deprecated
 */
export const iof = M.iof

/**
 * Use [`chain`](./Middleware.ts.html#chain) instead.
 *
 * @category Monad
 * @since 0.6.3
 * @deprecated
 */
export const chain = M.chain

/**
 * Use [`chainW`](./Middleware.ts.html#chainW) instead.
 *
 * @category Monad
 * @since 0.6.3
 * @deprecated
 */
export const chainW = M.chainW

/**
 * Use [`ichain`](./Middleware.ts.html#ichain) instead.
 *
 * @category Monad
 * @since 0.5.0
 * @deprecated
 */
export const ichain = M.ichain

/**
 * Use [`ichainW`](./Middleware.ts.html#ichainW) instead.
 *
 * @category Monad
 * @since 0.6.1
 * @deprecated
 */
export const ichainW = M.ichainW

/**
 * Use [`evalMiddleware`](./Middleware.ts.html#evalMiddleware) instead.
 *
 * @since 0.5.0
 * @deprecated
 */
export const evalMiddleware = M.evalMiddleware

/**
 * Use [`execMiddleware`](./Middleware.ts.html#execMiddleware) instead.
 *
 * @since 0.5.0
 * @deprecated
 */
export const execMiddleware = M.execMiddleware

/**
 * Use [`orElse`](./Middleware.ts.html#orelse) instead.
 *
 * @category combinators
 * @since 0.5.0
 * @deprecated
 */
export const orElse = M.orElse

/**
 * Use [`tryCatch`](./Middleware.ts.html#tryCatch) instead.
 *
 * @category interop
 * @since 0.5.0
 * @deprecated
 */
export const tryCatch = M.tryCatch

/**
 * Use [`fromTaskEither`](./Middleware.ts.html#fromTaskEither) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const fromTaskEither = M.fromTaskEither

/**
 * Use [`right`](./Middleware.ts.html#right) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const right = M.right

/**
 * Use [`left`](./Middleware.ts.html#left) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const left = M.left

/**
 * Use [`rightTask`](./Middleware.ts.html#rightTask) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const rightTask = M.rightTask

/**
 * Use [`leftTask`](./Middleware.ts.html#leftTask) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const leftTask = M.leftTask

/**
 * Use [`rightIO`](./Middleware.ts.html#rightIO) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const rightIO = M.rightIO

/**
 * Use [`leftIO`](./Middleware.ts.html#leftIO) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const leftIO = M.leftIO

/**
 * Use [`fromIOEither`](./Middleware.ts.html#fromIOEither) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const fromIOEither = M.fromIOEither

/**
 * Use [`status`](./Middleware.ts.html#status) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const status = M.status

/**
 * Use [`header`](./Middleware.ts.html#header) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const header = M.header

/**
 * Use [`contentType`](./Middleware.ts.html#contentType) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const contentType = M.contentType

/**
 * Use [`cookie`](./Middleware.ts.html#cookie) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const cookie = M.cookie

/**
 * Use [`clearCookie`](./Middleware.ts.html#clearCookie) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const clearCookie = M.clearCookie

/**
 * Use [`closeHeaders`](./Middleware.ts.html#closeHeaders) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const closeHeaders = M.closeHeaders

/**
 * Use [`send`](./Middleware.ts.html#send) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const send = M.send

/**
 * Use [`end`](./Middleware.ts.html#end) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const end = M.end

/**
 * Use [`json`](./Middleware.ts.html#json) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const json = M.json

/**
 * Use [`redirect`](./Middleware.ts.html#redirect) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const redirect = M.redirect

/**
 * Use [`pipeStream`](./Middleware.ts.html#pipeStream) instead.
 *
 * @category constructor
 * @since 0.6.2
 * @deprecated
 */
export const pipeStream = M.pipeStream

/**
 * Use [`decodeParam`](./Middleware.ts.html#decodeParam) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const decodeParam = M.decodeParam

/**
 * Use [`decodeParams`](./Middleware.ts.html#decodeParams) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const decodeParams = M.decodeParams

/**
 * Use [`decodeQuery`](./Middleware.ts.html#decodeQuery) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const decodeQuery = M.decodeQuery

/**
 * Use [`decodeBody`](./Middleware.ts.html#decodeBody) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const decodeBody = M.decodeBody

/**
 * Use [`decodeMethod`](./Middleware.ts.html#decodeMethod) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const decodeMethod = M.decodeMethod

/**
 * Use [`decodeHeader`](./Middleware.ts.html#decodeHeader) instead.
 *
 * @category constructor
 * @since 0.5.0
 * @deprecated
 */
export const decodeHeader = M.decodeHeader

/**
 * Use [`Do`](./Middleware.ts.html#do) instead.
 *
 * @since 0.6.1
 * @deprecated
 */
// tslint:disable-next-line: deprecation
export const Do = M.Do

/**
 * Use [`bindTo`](./Middleware.ts.html#bindTo) instead.
 *
 * @since 0.6.1
 * @deprecated
 */
export const bindTo = M.bindTo

/**
 * Use [`bindW`](./Middleware.ts.html#bindW) instead.
 *
 * @since 0.6.1
 * @deprecated
 */
export const bindW = M.bindW

/**
 * Use [`bind`](./Middleware.ts.html#bind) instead.
 *
 * @since 0.6.1
 * @deprecated
 */
export const bind = M.bind

/**
 * Use smaller instances from [`Middleware`](./Middleware.ts.html) module instead.
 *
 * @category instances
 * @since 0.5.0
 * @deprecated
 */
export const middleware: Monad3<M.URI> & Alt3<M.URI> & Bifunctor3<M.URI> & MonadThrow3<M.URI> & MonadTask3<M.URI> = {
  ...M.Functor,
  ...M.Bifunctor,
  ...M.MonadTask,
  ...M.MonadThrow,
  ...M.Alt,
}
