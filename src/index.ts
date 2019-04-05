import { Either } from 'fp-ts/lib/Either'
import { Predicate, Refinement, tuple } from 'fp-ts/lib/function'
import { IO } from 'fp-ts/lib/IO'
import { IOEither, tryCatch2v as ioEitherTryCatch } from 'fp-ts/lib/IOEither'
import { Task } from 'fp-ts/lib/Task'
import {
  fromEither as taskEitherFromEither,
  fromIO as taskEitherFromIO,
  fromIOEither as taskEitherFromIOEither,
  fromLeft as taskEitherFromLeft,
  fromPredicate as taskEitherFromPredicate,
  left as taskEitherLeft,
  right as taskEitherRight,
  TaskEither,
  taskEither,
  tryCatch as taskEitherTryCatch
} from 'fp-ts/lib/TaskEither'
import { IncomingMessage } from 'http'

// Adapted from https://github.com/purescript-contrib/purescript-media-types
export enum MediaType {
  applicationFormURLEncoded = 'application/x-www-form-urlencoded',
  applicationJSON = 'application/json',
  applicationJavascript = 'application/javascript',
  applicationOctetStream = 'application/octet-stream',
  applicationXML = 'application/xml',
  imageGIF = 'image/gif',
  imageJPEG = 'image/jpeg',
  imagePNG = 'image/png',
  multipartFormData = 'multipart/form-data',
  textCSV = 'text/csv',
  textHTML = 'text/html',
  textPlain = 'text/plain',
  textXML = 'text/xml'
}

const OK: 200 = 200
const Created: 201 = 201
const Found: 302 = 302
const BadRequest: 400 = 400
const Unauthorized: 401 = 401
const Forbidden: 403 = 403
const NotFound: 404 = 404
const MethodNotAllowed: 405 = 405
const NotAcceptable: 406 = 406
const ServerError: 500 = 500

export const Status = {
  OK,
  Created,
  Found,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  MethodNotAllowed,
  NotAcceptable,
  ServerError
}

export type Status = typeof Status[keyof typeof Status]

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

/** Type indicating that the status-line is ready to be sent */
export interface StatusOpen {
  readonly StatusOpen: unique symbol
}

/** Type indicating that headers are ready to be sent, i.e. the body streaming has not been started */
export interface HeadersOpen {
  readonly HeadersOpen: unique symbol
}

/** Type indicating that headers have already been sent, and that the body is currently streaming */
export interface BodyOpen {
  readonly BodyOpen: unique symbol
}

/** Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished */
export interface ResponseEnded {
  readonly ResponseEnded: unique symbol
}

/**
 * A `Connection`, models the entirety of a connection between the HTTP server and the user agent,
 * both request and response.
 * State changes are tracked by the phantom type `S`
 */
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

export function gets<I, L, A>(f: (c: Connection<I>) => A): Middleware<I, I, L, A> {
  return new Middleware(c => taskEither.of(tuple(f(c), c)))
}

export function fromConnection<I, L, A>(f: (c: Connection<I>) => Either<L, A>): Middleware<I, I, L, A> {
  return new Middleware(c => taskEitherFromEither(f(c).map(a => tuple(a, c))))
}

export function modifyConnection<I, O, L>(f: (c: Connection<I>) => Connection<O>): Middleware<I, O, L, void> {
  return new Middleware(c => taskEither.of(tuple(undefined, f(c))))
}

/**
 * A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates
 * in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output `Conn` types of the
 * middleware action.
 */
export class Middleware<I, O, L, A> {
  constructor(readonly run: (c: Connection<I>) => TaskEither<L, [A, Connection<O>]>) {}
  eval(c: Connection<I>): TaskEither<L, A> {
    return this.run(c).map(([a]) => a)
  }
  exec(c: Connection<I>): TaskEither<L, Connection<O>> {
    return this.run(c).map(([, c]) => c)
  }
  map<I, L, A, B>(this: Middleware<I, I, L, A>, f: (a: A) => B): Middleware<I, I, L, B> {
    return new Middleware(ci => this.run(ci).map(([a, co]) => tuple(f(a), co)))
  }
  ap<I, L, A, B>(this: Middleware<I, I, L, A>, fab: Middleware<I, I, L, (a: A) => B>): Middleware<I, I, L, B> {
    return new Middleware(c => fab.run(c).chain(([f, co1]) => this.run(co1).map(([a, co2]) => tuple(f(a), co2))))
  }
  chain<I, L, A, B>(this: Middleware<I, I, L, A>, f: (a: A) => Middleware<I, I, L, B>): Middleware<I, I, L, B> {
    return this.ichain(f)
  }
  /**
   * Combine two effectful actions, keeping only the result of the first
   */
  chainFirst<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, A> {
    return this.chain(a => fb.map(() => a))
  }
  /**
   * Combine two effectful actions, keeping only the result of the second
   */
  chainSecond<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, B> {
    return this.chain(() => fb)
  }
  ichain<Z, B>(f: (a: A) => Middleware<O, Z, L, B>): Middleware<I, Z, L, B> {
    return new Middleware(ci => this.run(ci).chain(([a, co]) => f(a).run(co)))
  }
  foldMiddleware<Z, M, B>(
    onLeft: (l: L) => Middleware<I, Z, M, B>,
    onRight: (a: A) => Middleware<O, Z, M, B>
  ): Middleware<I, Z, M, B> {
    return new Middleware(c => this.run(c).foldTaskEither(l => onLeft(l).run(c), ([a, co]) => onRight(a).run(co)))
  }
  mapLeft<M>(f: (l: L) => M): Middleware<I, O, M, A> {
    return new Middleware(c => this.run(c).mapLeft(f))
  }
  bimap<V, B>(f: (l: L) => V, g: (a: A) => B): Middleware<I, O, V, B> {
    return new Middleware(c => this.run(c).bimap(f, ([a, c]) => tuple(g(a), c)))
  }
  orElse<M>(f: (l: L) => Middleware<I, O, M, A>): Middleware<I, O, M, A> {
    return new Middleware(c => this.run(c).orElse(l => f(l).run(c)))
  }
  alt(fy: Middleware<I, O, L, A>): Middleware<I, O, L, A> {
    return new Middleware(c => this.run(c).alt(fy.run(c)))
  }
  /** Returns a middleware that writes the response status */
  status<I, L, A>(this: Middleware<I, StatusOpen, L, A>, s: Status): Middleware<I, HeadersOpen, L, void> {
    return this.ichain(() => status(s))
  }
  /** Returns a middleware that writes the given headers */
  header<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    name: string,
    value: string
  ): Middleware<I, HeadersOpen, L, void> {
    return this.ichain(() => header(name, value))
  }
  /** Returns a middleware that sets the given `mediaType` */
  contentType<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    mediaType: MediaType
  ): Middleware<I, HeadersOpen, L, void> {
    return this.ichain(() => contentType(mediaType))
  }
  /** Return a middleware that sets the cookie `name` to `value`, with the given `options` */
  cookie<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    name: string,
    value: string,
    options: CookieOptions
  ): Middleware<I, HeadersOpen, L, void> {
    return this.ichain(() => cookie(name, value, options))
  }
  /** Returns a middleware that clears the cookie `name` */
  clearCookie<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    name: string,
    options: CookieOptions
  ): Middleware<I, HeadersOpen, L, void> {
    return this.ichain(() => clearCookie(name, options))
  }
  /** Return a middleware that changes the connection status to `BodyOpen` */
  closeHeaders<I, L, A>(this: Middleware<I, HeadersOpen, L, A>): Middleware<I, BodyOpen, L, void> {
    return this.ichain(() => closeHeaders)
  }
  /** Return a middleware that sends `body` as response body */
  send<I, L, A>(this: Middleware<I, BodyOpen, L, A>, body: string): Middleware<I, ResponseEnded, L, void> {
    return this.ichain(() => send(body))
  }
  /** Return a middleware that sends `body` as JSON */
  json<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    body: unknown,
    onError: (reason: unknown) => L
  ): Middleware<I, ResponseEnded, L, void> {
    return this.ichain(() => json(body, onError))
  }
  /** Return a middleware that ends the response without sending any response body */
  end<I, L, A>(this: Middleware<I, BodyOpen, L, A>): Middleware<I, ResponseEnded, L, void> {
    return this.ichain(() => end)
  }
}

export function of<I, L, A>(a: A): Middleware<I, I, L, A> {
  return iof(a)
}

export function iof<I, O, L, A>(a: A): Middleware<I, O, L, A> {
  return new Middleware<I, O, L, A>(c => taskEither.of(tuple(a, c as any)))
}

//
// lifting helpers
//

export function tryCatch<I, L, A>(f: () => Promise<A>, onrejected: (reason: unknown) => L): Middleware<I, I, L, A> {
  return fromTaskEither(taskEitherTryCatch(f, onrejected))
}

export function fromTaskEither<I, L, A>(fa: TaskEither<L, A>): Middleware<I, I, L, A> {
  return new Middleware(c => fa.map(a => tuple(a, c)))
}

export function right<I, L, A>(fa: Task<A>): Middleware<I, I, L, A> {
  return fromTaskEither(taskEitherRight(fa))
}

export function left<I, L, A>(fl: Task<L>): Middleware<I, I, L, A> {
  return fromTaskEither(taskEitherLeft(fl))
}

export function fromLeft<I, L, A>(l: L): Middleware<I, I, L, A> {
  return fromTaskEither(taskEitherFromLeft(l))
}

export const fromEither = <I, L, A>(fa: Either<L, A>): Middleware<I, I, L, A> => {
  return fromTaskEither(taskEitherFromEither(fa))
}

export const fromIO = <I, L, A>(fa: IO<A>): Middleware<I, I, L, A> => {
  return fromTaskEither(taskEitherFromIO(fa))
}

export const fromIOEither = <I, L, A>(fa: IOEither<L, A>): Middleware<I, I, L, A> => {
  return fromTaskEither(taskEitherFromIOEither(fa))
}

export function fromPredicate<I, L, A, B extends A>(
  predicate: Refinement<A, B>,
  onFalse: (a: A) => L
): (a: A) => Middleware<I, I, L, A>
export function fromPredicate<I, L, A>(predicate: Predicate<A>, onFalse: (a: A) => L): (a: A) => Middleware<I, I, L, A>
export function fromPredicate<I, L, A>(
  predicate: Predicate<A>,
  onFalse: (a: A) => L
): (a: A) => Middleware<I, I, L, A> {
  const f = taskEitherFromPredicate(predicate, onFalse)
  return a => fromTaskEither(f(a))
}

//
// primitive middlewares
//

/** Returns a middleware that writes the response status */
export function status(status: Status): Middleware<StatusOpen, HeadersOpen, never, void> {
  return modifyConnection(c => c.setStatus(status))
}

/** Returns a middleware that writes the given header */
export function header(name: string, value: string): Middleware<HeadersOpen, HeadersOpen, never, void> {
  return modifyConnection(c => c.setHeader(name, value))
}

/** Returns a middleware that sets the given `mediaType` */
export function contentType(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, never, void> {
  return header('Content-Type', mediaType)
}

/** Return a middleware that sets the cookie `name` to `value`, with the given `options` */
export function cookie(
  name: string,
  value: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, never, void> {
  return modifyConnection(c => c.setCookie(name, value, options))
}

/** Returns a middleware that clears the cookie `name` */
export function clearCookie(name: string, options: CookieOptions): Middleware<HeadersOpen, HeadersOpen, never, void> {
  return modifyConnection(c => c.clearCookie(name, options))
}

/** Return a middleware that changes the connection status to `BodyOpen` */
export const closeHeaders: Middleware<HeadersOpen, BodyOpen, never, void> = iof(undefined)

/** Return a middleware that sends `body` as response body */
export function send(body: string): Middleware<BodyOpen, ResponseEnded, never, void> {
  return modifyConnection(c => c.setBody(body))
}

/** Return a middleware that ends the response without sending any response body */
export const end: Middleware<BodyOpen, ResponseEnded, never, void> = modifyConnection(c => c.endResponse())

//
// derived middlewares
//

const stringifyJSON = <L>(u: unknown, onError: (reason: unknown) => L): IOEither<L, string> =>
  ioEitherTryCatch(() => JSON.stringify(u), onError)

/** Return a middleware that sends `body` as JSON */
export function json<L>(
  body: unknown,
  onError: (reason: unknown) => L
): Middleware<HeadersOpen, ResponseEnded, L, void> {
  return fromIOEither<HeadersOpen, L, string>(stringifyJSON(body, onError)).ichain(json =>
    contentType(MediaType.applicationJSON)
      .closeHeaders()
      .send(json)
  )
}

/** Return a middleware that sends a redirect to `uri` */
export function redirect(uri: string): Middleware<StatusOpen, HeadersOpen, never, void> {
  return status(Status.Found).header('Location', uri)
}

//
// decoders
//

const isUnknownRecord = (u: unknown): u is { [key: string]: unknown } => u !== null && typeof u === 'object'

/** Returns a middleware that tries to decode `connection.getParams()[name]` */
export function decodeParam<L, A>(
  name: string,
  f: (input: unknown) => Either<L, A>
): Middleware<StatusOpen, StatusOpen, L, A> {
  return fromConnection(c => {
    const params = c.getParams()
    return f(isUnknownRecord(params) ? params[name] : undefined)
  })
}

/** Returns a middleware that tries to decode `connection.getParams()` */
export function decodeParams<L, A>(f: (input: unknown) => Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A> {
  return fromConnection(c => f(c.getParams()))
}

/** Returns a middleware that tries to decode `connection.getQuery()` */
export function decodeQuery<L, A>(f: (input: unknown) => Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A> {
  return fromConnection(c => f(c.getQuery()))
}

/** Returns a middleware that tries to decode `connection.getBody()` */
export function decodeBody<L, A>(f: (input: unknown) => Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A> {
  return fromConnection(c => f(c.getBody()))
}

/** Returns a middleware that tries to decode `connection.getMethod()` */
export function decodeMethod<L, A>(f: (method: string) => Either<L, A>): Middleware<StatusOpen, StatusOpen, L, A> {
  return fromConnection(c => f(c.getMethod()))
}

/** Returns a middleware that tries to decode `connection.getHeader(name)` */
export function decodeHeader<L, A>(
  name: string,
  f: (input: unknown) => Either<L, A>
): Middleware<StatusOpen, StatusOpen, L, A> {
  return fromConnection(c => f(c.getHeader(name)))
}
