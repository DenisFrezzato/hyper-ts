import { Reader } from 'fp-ts/lib/Reader'
import * as M from './Middleware'
import { Monad4 } from 'fp-ts/lib/Monad'
import { Alt4 } from 'fp-ts/lib/Alt'
import { Bifunctor4 } from 'fp-ts/lib/Bifunctor'
import { MonadThrow4 } from 'fp-ts/lib/MonadThrow'
import { getReaderM } from 'fp-ts/lib/ReaderT'
import { Task } from 'fp-ts/lib/Task'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither'
import { IOEither } from 'fp-ts/lib/IOEither'
import { ReaderEither } from 'fp-ts/lib/ReaderEither'
import { IO } from 'fp-ts/lib/IO'
import { pipeable, pipe } from 'fp-ts/lib/pipeable'
import { Either } from 'fp-ts/lib/Either'
import {
  Connection,
  StatusOpen,
  Status,
  HeadersOpen,
  MediaType,
  CookieOptions,
  BodyOpen,
  ResponseEnded
} from './Connection'

const T = getReaderM(M.middleware)

/**
 * @since 0.6.0
 */
declare module 'fp-ts/lib/HKT' {
  interface URItoKind4<S, R, E, A> {
    ReaderMiddleware: ReaderMiddleware<S, R, R, E, A>
  }
}

/**
 * @since 0.6.0
 */
export const URI = 'ReaderMiddleware'

/**
 * @since 0.6.0
 */
export type URI = 'ReaderMiddleware'

/**
 * @since 0.6.0
 */
export interface ReaderMiddleware<R, I, O, E, A> {
  (r: R): M.Middleware<I, O, E, A>
}

/**
 * @since 0.5.0
 */
export function gets<R, I = StatusOpen, E = never, A = never>(
  f: (c: Connection<I>) => A
): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.gets(f))
}

/**
 * @since 0.5.0
 */
export function fromConnection<R, I = StatusOpen, E = never, A = never>(
  f: (c: Connection<I>) => Either<E, A>
): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.fromConnection(f))
}

/**
 * @since 0.5.0
 */
export function modifyConnection<R, I, O, E>(
  f: (c: Connection<I>) => Connection<O>
): ReaderMiddleware<R, I, O, E, void> {
  return () => M.modifyConnection(f)
}

/**
 * @since 0.6.0
 */
export const ask: <R, I = StatusOpen, E = never>() => ReaderMiddleware<R, I, I, E, R> = T.ask

/**
 * @since 0.6.0
 */
export const asks: <R, I = StatusOpen, E = never, A = never>(f: (r: R) => A) => ReaderMiddleware<R, I, I, E, A> = T.asks

/**
 * @since 0.6.0
 */
export function local<Q, R>(
  f: (f: Q) => R
): <I, E, A>(ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<Q, I, I, E, A> {
  return ma => T.local(ma, f)
}

/**
 * @since 0.6.0
 */
export function ichain<R, A, O, Z, E, B>(
  f: (a: A) => ReaderMiddleware<R, O, Z, E, B>
): <I>(ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, Z, E, B> {
  return ma => r =>
    pipe(
      ma(r),
      M.ichain(a => f(a)(r))
    )
}

/**
 * @since 0.6.0
 */
export function evalReaderMiddleware<R, I, O, E, A>(
  ma: ReaderMiddleware<R, I, O, E, A>,
  c: Connection<I>
): ReaderTaskEither<R, E, A> {
  return r => M.evalMiddleware(ma(r), c)
}

/**
 * @since 0.6.0
 */
export function execReaderMiddleware<R, I, O, E, A>(
  ma: ReaderMiddleware<R, I, O, E, A>,
  c: Connection<I>
): ReaderTaskEither<R, E, Connection<O>> {
  return r => M.execMiddleware(ma(r), c)
}

/**
 * @since 0.6.0
 */
export function orElse<R, E, I, O, M, A>(
  f: (e: E) => ReaderMiddleware<R, I, O, M, A>
): (ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, O, M, A> {
  return ma => r =>
    pipe(
      ma(r),
      M.orElse(e => f(e)(r))
    )
}

/**
 * @since 0.6.0
 */
export function iof<R, I = StatusOpen, O = StatusOpen, E = never, A = never>(a: A): ReaderMiddleware<R, I, O, E, A> {
  return () => M.iof(a)
}

/**
 * @since 0.6.0
 */
export function left<R, I = StatusOpen, E = never, A = never>(e: E): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.left(e))
}

/**
 * @since 0.6.0
 */
export const right: <R, I = StatusOpen, E = never, A = never>(a: A) => ReaderMiddleware<R, I, I, E, A> = T.of

/**
 * @since 0.6.0
 */
export function rightTask<R, I = StatusOpen, E = never, A = never>(ma: Task<A>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.rightTask(ma))
}

/**
 * @since 0.6.0
 */
export function leftTask<R, I = StatusOpen, E = never, A = never>(me: Task<E>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.leftTask(me))
}

/**
 * @since 0.6.0
 */
export function fromTaskEither<R, I, E, A>(ma: TaskEither<E, A>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.fromTaskEither(ma))
}

/**
 * @since 0.6.0
 */
export function fromReaderTaskEither<R, I, E, A>(ma: ReaderTaskEither<R, E, A>): ReaderMiddleware<R, I, I, E, A> {
  return r => M.fromTaskEither(ma(r))
}

/**
 * @since 0.6.0
 */
export const fromMiddleware: <R, I, E, A>(ma: M.Middleware<I, I, E, A>) => ReaderMiddleware<R, I, I, E, A> = T.fromM

/**
 * @since 0.6.0
 */
export const rightReader: <R, I = StatusOpen, E = never, A = never>(
  ma: Reader<R, A>
) => ReaderMiddleware<R, I, I, E, A> = T.fromReader

/**
 * @since 0.6.0
 */
export function leftReader<R, I = StatusOpen, E = never, A = never>(me: Reader<R, E>): ReaderMiddleware<R, I, I, E, A> {
  return r => M.left(me(r))
}

/**
 * @since 0.6.0
 */
export function fromIOEither<R, I, E, A>(ma: IOEither<E, A>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.fromIOEither(ma))
}

/**
 * @since 0.6.0
 */
export function fromReaderEither<R, I, E, A>(ma: ReaderEither<R, E, A>): ReaderMiddleware<R, I, I, E, A> {
  return r => M.fromEither(ma(r))
}
/**
 * @since 0.6.0
 */
export function rightIO<R, I = StatusOpen, E = never, A = never>(ma: IO<A>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.rightIO(ma))
}

/**
 * @since 0.6.0
 */
export function leftIO<R, I = StatusOpen, E = never, A = never>(me: IO<E>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(M.leftIO(me))
}

/**
 * Returns a middleware that writes the response status
 *
 * @since 0.6.0
 */
export function status<R, E = never>(status: Status): ReaderMiddleware<R, StatusOpen, HeadersOpen, E, void> {
  return () => M.status(status)
}

/**
 * Returns a middleware that writes the given header
 *
 * @since 0.6.0
 */
export function header<R, E = never>(
  name: string,
  value: string
): ReaderMiddleware<R, HeadersOpen, HeadersOpen, E, void> {
  return fromMiddleware(M.header(name, value))
}

/**
 * Returns a middleware that sets the given `mediaType`
 *
 * @since 0.6.0
 */
export function contentType<R, E = never>(
  mediaType: MediaType
): ReaderMiddleware<R, HeadersOpen, HeadersOpen, E, void> {
  return fromMiddleware(M.header('Content-Type', mediaType))
}

/**
 * Returns a middleware that sets the cookie `name` to `value`, with the given `options`
 *
 * @since 0.6.0
 */
export function cookie<R, E = never>(
  name: string,
  value: string,
  options: CookieOptions
): ReaderMiddleware<R, HeadersOpen, HeadersOpen, E, void> {
  return fromMiddleware(M.cookie(name, value, options))
}

/**
 * Returns a middleware that clears the cookie `name`
 *
 * @since 0.6.0
 */
export function clearCookie<R, E = never>(
  name: string,
  options: CookieOptions
): ReaderMiddleware<R, HeadersOpen, HeadersOpen, E, void> {
  return fromMiddleware(M.clearCookie(name, options))
}

/**
 * Returns a middleware that changes the connection status to `BodyOpen`
 *
 * @since 0.6.0
 */
export function closeHeaders<R, E = never>(): ReaderMiddleware<R, HeadersOpen, BodyOpen, E, void> {
  return () => M.closeHeaders()
}

/**
 * Returns a middleware that sends `body` as response body
 *
 * @since 0.6.0
 */
export function send<R, E = never>(body: string): ReaderMiddleware<R, BodyOpen, ResponseEnded, E, void> {
  return () => M.send(body)
}

/**
 * Returns a middleware that ends the response without sending any response body
 *
 * @since 0.6.0
 */
export function end<R, E = never>(): ReaderMiddleware<R, BodyOpen, ResponseEnded, E, void> {
  return () => M.end()
}

/**
 * Returns a middleware that sends `body` as JSON
 *
 * @since 0.6.0
 */
export function json<R, E>(
  body: unknown,
  onError: (reason: unknown) => E
): ReaderMiddleware<R, HeadersOpen, ResponseEnded, E, void> {
  return () => M.json(body, onError)
}

/**
 * Returns a middleware that sends a redirect to `uri`
 *
 * @since 0.6.0
 */
export function redirect<R, E = never>(uri: string): ReaderMiddleware<R, StatusOpen, HeadersOpen, E, void> {
  return () => M.redirect(uri)
}

/**
 * Returns a middleware that tries to decode `connection.getParams()[name]`
 *
 * @since 0.6.0
 */
export function decodeParam<R, E, A>(
  name: string,
  f: (input: unknown) => Either<E, A>
): ReaderMiddleware<R, StatusOpen, StatusOpen, E, A> {
  return fromMiddleware(M.decodeParam(name, f))
}

/**
 * Returns a middleware that tries to decode `connection.getParams()`
 *
 * @since 0.6.0
 */
export function decodeParams<R, E, A>(
  f: (input: unknown) => Either<E, A>
): ReaderMiddleware<R, StatusOpen, StatusOpen, E, A> {
  return fromMiddleware(M.decodeParams(f))
}

/**
 * Returns a middleware that tries to decode `connection.getQuery()`
 *
 * @since 0.6.0
 */
export function decodeQuery<R, E, A>(
  f: (input: unknown) => Either<E, A>
): ReaderMiddleware<R, StatusOpen, StatusOpen, E, A> {
  return fromMiddleware(M.decodeQuery(f))
}

/**
 * Returns a middleware that tries to decode `connection.getBody()`
 *
 * @since 0.6.0
 */
export function decodeBody<R, E, A>(
  f: (input: unknown) => Either<E, A>
): ReaderMiddleware<R, StatusOpen, StatusOpen, E, A> {
  return fromMiddleware(M.decodeBody(f))
}

/**
 * Returns a middleware that tries to decode `connection.getMethod()`
 *
 * @since 0.6.0
 */
export function decodeMethod<R, E, A>(
  f: (method: string) => Either<E, A>
): ReaderMiddleware<R, StatusOpen, StatusOpen, E, A> {
  return fromMiddleware(M.decodeMethod(f))
}

/**
 * Returns a middleware that tries to decode `connection.getHeader(name)`
 *
 * @since 0.6.0
 */
export function decodeHeader<R, E, A>(
  name: string,
  f: (input: unknown) => Either<E, A>
): ReaderMiddleware<R, StatusOpen, StatusOpen, E, A> {
  return fromMiddleware(M.decodeHeader(name, f))
}

/**
 * @since 0.6.0
 */
export const readerMiddleware: Monad4<URI> & Alt4<URI> & Bifunctor4<URI> & MonadThrow4<URI> = {
  URI,
  map: T.map,
  of: right,
  ap: T.ap,
  chain: T.chain,
  alt: (fx, f) => r => M.middleware.alt(fx(r), () => f()(r)),
  bimap: (ma, f, g) => e => M.middleware.bimap(ma(e), f, g),
  mapLeft: (ma, f) => e => M.middleware.mapLeft(ma(e), f),
  throwError: left
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
} = pipeable(readerMiddleware)

export {
  /**
   * @since 0.6.0
   */
  alt,
  /**
   * @since 0.6.0
   */
  ap,
  /**
   * @since 0.6.0
   */
  apFirst,
  /**
   * @since 0.6.0
   */
  apSecond,
  /**
   * @since 0.6.0
   */
  bimap,
  /**
   * @since 0.6.0
   */
  chain,
  /**
   * @since 0.6.0
   */
  chainFirst,
  /**
   * @since 0.6.0
   */
  flatten,
  /**
   * @since 0.6.0
   */
  map,
  /**
   * @since 0.6.0
   */
  mapLeft,
  /**
   * @since 0.6.0
   */
  filterOrElse,
  /**
   * @since 0.6.0
   */
  fromEither,
  /**
   * @since 0.6.0
   */
  fromOption,
  /**
   * @since 0.6.0
   */
  fromPredicate
}
