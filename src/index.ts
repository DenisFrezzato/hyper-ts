import { tuple, constant, constIdentity, Refinement, Predicate } from 'fp-ts/lib/function'
import {
  TaskEither,
  taskEither,
  right as taskEitherRight,
  left as taskEitherLeft,
  fromLeft as taskEitherFromLeft,
  fromEither as taskEitherFromEither,
  fromIO as taskEitherFromIO,
  fromIOEither as taskEitherFromIOEither,
  fromPredicate as taskEitherFromPredicate
} from 'fp-ts/lib/TaskEither'
import { Task } from 'fp-ts/lib/Task'
import * as t from 'io-ts'
import { Either } from 'fp-ts/lib/Either'
import { IO } from 'fp-ts/lib/IO'
import { IOEither } from 'fp-ts/lib/IOEither'

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

export const Status = {
  OK,
  Created,
  Found,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  MethodNotAllowed,
  NotAcceptable
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

/**
 * A `Conn`, short for "connection", models the entirety of a connection between the HTTP server and the user agent,
 * both request and response.
 * State changes are tracked by the phantom type `S`
 */
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
  getOriginalUrl: () => string
}

/** Type indicating that the status-line is ready to be sent */
export type StatusOpen = 'StatusOpen'

/** Type indicating that headers are ready to be sent, i.e. the body streaming has not been started */
export type HeadersOpen = 'HeadersOpen'

/** Type indicating that headers have already been sent, and that the body is currently streaming */
export type BodyOpen = 'BodyOpen'

/** Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished. */
export type ResponseEnded = 'ResponseEnded'

/**
 * A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates
 * in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output `Conn` types of the
 * middleware action.
 */
export class Middleware<I, O, L, A> {
  constructor(readonly run: (c: Conn<I>) => TaskEither<L, [A, Conn<O>]>) {}
  eval(c: Conn<I>): TaskEither<L, A> {
    return this.run(c).map(([a]) => a)
  }
  map<I, L, A, B>(this: Middleware<I, I, L, A>, f: (a: A) => B): Middleware<I, I, L, B> {
    return new Middleware(ci => this.run(ci).map(([a, co]) => tuple(f(a), co)))
  }
  ap<I, L, A, B>(this: Middleware<I, I, L, A>, fab: Middleware<I, I, L, (a: A) => B>): Middleware<I, I, L, B> {
    return new Middleware(c =>
      this.eval(c)
        .ap(fab.eval(c))
        .map(b => tuple(b, c))
    )
  }
  /**
   * Flipped version of `ap`
   */
  ap_<I, B, C>(this: Middleware<I, I, L, (b: B) => C>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, C> {
    return fb.ap(this)
  }
  /**
   * Combine two (parallel) effectful actions, keeping only the result of the first
   */
  applyFirst<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, A> {
    return fb.ap(this.map(constant))
  }
  /**
   * Combine two (parallel) effectful actions, keeping only the result of the second
   */
  applySecond<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, B> {
    return fb.ap(this.map<I, L, A, (b: B) => B>(constIdentity))
  }
  chain<I, L, A, B>(this: Middleware<I, I, L, A>, f: (a: A) => Middleware<I, I, L, B>): Middleware<I, I, L, B> {
    return this.ichain(f)
  }
  /**
   * Combine two (sequential) effectful actions, keeping only the result of the first
   */
  chainFirst<I, L, A, B>(this: Middleware<I, I, L, A>, fb: Middleware<I, I, L, B>): Middleware<I, I, L, A> {
    return this.chain(a => fb.map(() => a))
  }
  /**
   * Combine two (sequential) effectful actions, keeping only the result of the second
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
  headers<I, L, A>(
    this: Middleware<I, HeadersOpen, L, A>,
    hs: Record<string, string>
  ): Middleware<I, HeadersOpen, L, void> {
    return this.ichain(() => headers(hs))
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

export function gets<I, L, A>(f: (c: Conn<I>) => A): Middleware<I, I, L, A> {
  return new Middleware(c => taskEither.of(tuple(f(c), c)))
}

export function fromConnection<I, L, A>(f: (c: Conn<I>) => Either<L, A>): Middleware<I, I, L, A> {
  return new Middleware(c => taskEitherFromEither(f(c).map(a => tuple(a, c))))
}

// internal helper
function transition<I, O, L>(f: (c: Conn<I>) => void): Middleware<I, O, L, void> {
  return new Middleware(c =>
    taskEitherRight(
      new Task(() => {
        f(c)
        return Promise.resolve([undefined, c] as any)
      })
    )
  )
}

/** Returns a middleware that writes the response status */
export function status<L>(status: Status): Middleware<StatusOpen, HeadersOpen, L, void> {
  return transition(c => c.setStatus(status))
}

/** Returns a middleware that writes the given headers */
export function headers<L>(headers: Record<string, string>): Middleware<HeadersOpen, HeadersOpen, L, void> {
  return transition(c => {
    for (const field in headers) {
      if (headers.hasOwnProperty(field)) {
        c.setHeader(field, headers[field])
      }
    }
  })
}

/** Returns a middleware that sets the given `mediaType` */
export function contentType<L>(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, L, void> {
  return headers({ 'Content-Type': mediaType })
}

/** Return a middleware that sets the cookie `name` to `value`, with the given `options` */
export function cookie<L>(
  name: string,
  value: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, L, void> {
  return transition(c => c.setCookie(name, value, options))
}

/** Returns a middleware that clears the cookie `name` */
export function clearCookie<L>(name: string, options: CookieOptions): Middleware<HeadersOpen, HeadersOpen, L, void> {
  return transition(c => c.clearCookie(name, options))
}

/** Return a middleware that changes the connection status to `BodyOpen` */
export const closeHeaders: Middleware<HeadersOpen, BodyOpen, never, void> = iof(undefined)

/** Return a middleware that sends `body` as response body */
export function send<L>(body: string): Middleware<BodyOpen, ResponseEnded, L, void> {
  return transition(c => c.setBody(body))
}

/** Return a middleware that ends the response without sending any response body */
export const end: Middleware<BodyOpen, ResponseEnded, never, void> = transition(c => c.endResponse())

/** Return a middleware that sends `body` as JSON */
export function json<L>(body: string): Middleware<HeadersOpen, ResponseEnded, L, void> {
  return contentType<L>(MediaType.applicationJSON)
    .closeHeaders()
    .send(body)
}

/** Return a middleware that sends a redirect to `uri` */
export function redirect<L>(uri: string): Middleware<StatusOpen, HeadersOpen, L, void> {
  return status<L>(Status.Found).headers({ Location: uri })
}

/** Returns a middleware validating `connection.getParams()[name]` */
export function param<A>(
  name: string,
  decoder: t.Decoder<unknown, A>
): Middleware<StatusOpen, StatusOpen, t.Errors, A> {
  return fromConnection(c => {
    const params = c.getParams()
    return decoder.decode(t.UnknownRecord.is(params) ? params[name] : undefined)
  })
}

/** Returns a middleware validating `connection.getParams()` */
export function params<A>(decoder: t.Decoder<unknown, A>): Middleware<StatusOpen, StatusOpen, t.Errors, A> {
  return fromConnection(c => decoder.decode(c.getParams()))
}

/** Returns a middleware validating `connection.getQuery()` */
export function query<A>(decoder: t.Decoder<unknown, A>): Middleware<StatusOpen, StatusOpen, t.Errors, A> {
  return fromConnection(c => decoder.decode(c.getQuery()))
}

/** Returns a middleware validating `connection.getBody()` */
export function body<A>(decoder: t.Decoder<unknown, A>): Middleware<StatusOpen, StatusOpen, t.Errors, A> {
  return fromConnection(c => decoder.decode(c.getBody()))
}

/** Returns a middleware validating `connection.getHeader(name)` */
export function header<A>(
  name: string,
  decoder: t.Decoder<unknown, A>
): Middleware<StatusOpen, StatusOpen, t.Errors, A> {
  return fromConnection(c => decoder.decode(c.getHeader(name)))
}
