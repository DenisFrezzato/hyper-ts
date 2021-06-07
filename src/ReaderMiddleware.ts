/**
 * @since 0.6.3
 */
import { pipe } from 'fp-ts/lib/pipeable'
import { Task } from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import * as H from '.'
import { IO } from 'fp-ts/lib/IO'
import { IOEither } from 'fp-ts/lib/IOEither'
import * as E from 'fp-ts/lib/Either'
import { Monad4 } from 'fp-ts/lib/Monad'
import { Alt4 } from 'fp-ts/lib/Alt'
import { Bifunctor4 } from 'fp-ts/lib/Bifunctor'
import { MonadThrow4 } from 'fp-ts/lib/MonadThrow'
import { Functor4 } from 'fp-ts/lib/Functor'
import { Apply4 } from 'fp-ts/lib/Apply'
import { Applicative4 } from 'fp-ts/lib/Applicative'
import * as RTE from 'fp-ts/lib/ReaderTaskEither'
import { getReaderM } from 'fp-ts/lib/ReaderT'
import { Reader } from 'fp-ts/lib/Reader'

const T = getReaderM(H.middleware)

/**
 * @since 0.6.3
 */
export const URI = 'ReaderMiddleware'

/**
 * @since 0.6.3
 */
export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URItoKind4<S, R, E, A> {
    readonly [URI]: ReaderMiddleware<S, R, R, E, A>
  }
}

/**
 * @since 0.6.3
 */
export interface ReaderMiddleware<R, I, O, E, A> {
  (r: R): H.Middleware<I, O, E, A>
}

/**
 * @since 0.6.3
 */
export function fromTaskEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: TE.TaskEither<E, A>
): ReaderMiddleware<R, I, I, E, A> {
  return () => H.fromTaskEither(fa)
}

/**
 * @since 0.6.3
 */
export function fromReaderTaskEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: RTE.ReaderTaskEither<R, E, A>
): ReaderMiddleware<R, I, I, E, A> {
  return r => H.fromTaskEither(fa(r))
}

/**
 * @since 0.6.3
 */
export const fromMiddleware: <R, I = H.StatusOpen, E = never, A = never>(
  fa: H.Middleware<I, I, E, A>
) => ReaderMiddleware<R, I, I, E, A> = T.fromM

/**
 * @since 0.6.3
 */
export const right: <R, I = H.StatusOpen, E = never, A = never>(a: A) => ReaderMiddleware<R, I, I, E, A> = T.of

/**
 * @since 0.6.3
 */
export function left<R, I = H.StatusOpen, E = never, A = never>(e: E): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(H.left(e))
}

/**
 * @since 0.6.3
 */
export function rightTask<R, I = H.StatusOpen, E = never, A = never>(fa: Task<A>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(H.rightTask(fa))
}

/**
 * @since 0.6.3
 */
export function leftTask<R, I = H.StatusOpen, E = never, A = never>(te: Task<E>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(H.leftTask(te))
}

/**
 * @since 0.6.3
 */
export function rightIO<R, I = H.StatusOpen, E = never, A = never>(fa: IO<A>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(H.rightIO(fa))
}

/**
 * @since 0.6.3
 */
export function leftIO<R, I = H.StatusOpen, E = never, A = never>(fe: IO<E>): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(H.leftIO(fe))
}

/**
 * @since 0.6.3
 */
export function fromIOEither<R, I = H.StatusOpen, E = never, A = never>(
  fa: IOEither<E, A>
): ReaderMiddleware<R, I, I, E, A> {
  return fromMiddleware(H.fromIOEither(fa))
}

/**
 * @since 0.6.3
 */
export const rightReader: <R, I = H.StatusOpen, E = never, A = never>(
  ma: Reader<R, A>
) => ReaderMiddleware<R, I, I, E, A> = T.fromReader

/**
 * @since 0.6.3
 */
export function leftReader<R, I = H.StatusOpen, E = never, A = never>(
  me: Reader<R, E>
): ReaderMiddleware<R, I, I, E, A> {
  return r => H.left(me(r))
}

/**
 * @since 0.6.3
 */
export const ask: <R, I = H.StatusOpen, E = never>() => ReaderMiddleware<R, I, I, E, R> = T.ask

/**
 * @since 0.6.3
 */
export const asks: <R, E = never, A = never>(f: (r: R) => A) => ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> =
  T.asks

/**
 * @since 0.6.3
 */
export function orElse<R, E, I, O, M, A>(
  f: (e: E) => ReaderMiddleware<R, I, O, M, A>
): (ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, O, M, A> {
  return ma => r => c =>
    pipe(
      ma(r)(c),
      TE.orElse(e => f(e)(r)(c))
    )
}

/**
 * @since 0.6.3
 */
export function status<R, E = never>(status: H.Status): ReaderMiddleware<R, H.StatusOpen, H.HeadersOpen, E, void> {
  return () => H.status(status)
}

/**
 * @since 0.6.3
 */
export function header<R, E = never>(
  name: string,
  value: string
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void> {
  return () => H.header(name, value)
}

/**
 * @since 0.6.3
 */
export function contentType<R, E = never>(
  mediaType: H.MediaType
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void> {
  return header('Content-Type', mediaType)
}

/**
 * @since 0.6.3
 */
export function cookie<R, E = never>(
  name: string,
  value: string,
  options: H.CookieOptions
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void> {
  return () => H.cookie(name, value, options)
}

/**
 * @since 0.6.3
 */
export function clearCookie<R, E = never>(
  name: string,
  options: H.CookieOptions
): ReaderMiddleware<R, H.HeadersOpen, H.HeadersOpen, E, void> {
  return () => H.clearCookie(name, options)
}

const closedHeaders: ReaderMiddleware<any, H.HeadersOpen, H.BodyOpen, never, void> = iof(undefined)

/**
 * @since 0.6.3
 */
export function closeHeaders<R, E = never>(): ReaderMiddleware<R, H.HeadersOpen, H.BodyOpen, E, void> {
  return closedHeaders
}

/**
 * @since 0.6.3
 */
export function send<R, E = never>(body: string): ReaderMiddleware<R, H.BodyOpen, H.ResponseEnded, E, void> {
  return () => H.send(body)
}

/**
 * @since 0.6.3
 */
export function end<R, E = never>(): ReaderMiddleware<R, H.BodyOpen, H.ResponseEnded, E, void> {
  return H.end
}

/**
 * @since 0.6.3
 */
export function json<R, E>(
  body: unknown,
  onError: (reason: unknown) => E
): ReaderMiddleware<R, H.HeadersOpen, H.ResponseEnded, E, void> {
  return () => H.json(body, onError)
}

/**
 * @since 0.6.3
 */
export function redirect<R, E = never>(uri: string): ReaderMiddleware<R, H.StatusOpen, H.HeadersOpen, E, void> {
  return () => H.redirect(uri)
}

/**
 * @since 0.6.3
 */
export function decodeParam<R, E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => H.decodeParam(name, f)
}

/**
 * @since 0.6.3
 */
export function decodeParams<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => H.decodeParams(f)
}

/**
 * @since 0.6.3
 */
export function decodeQuery<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => H.decodeQuery(f)
}

/**
 * @since 0.6.3
 */
export function decodeBody<R, E, A>(
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => H.decodeBody(f)
}

/**
 * @since 0.6.3
 */
export function decodeMethod<R, E, A>(
  f: (method: string) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => H.decodeMethod(f)
}

/**
 * @since 0.6.3
 */
export function decodeHeader<R, E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): ReaderMiddleware<R, H.StatusOpen, H.StatusOpen, E, A> {
  return () => H.decodeHeader(name, f)
}

/**
 * @since 0.6.3
 */
export const Do =
  /*#__PURE__*/
  iof<unknown, unknown, unknown, never, {}>({})

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
 * @since 0.6.3
 */
export const bindTo = <N extends string>(
  name: N
): (<R, I, E, A>(fa: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, { [K in N]: A }>) =>
  map(bindTo_(name))

/**
 * @since 0.6.3
 */
export const bindW = <N extends string, R, I, A, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderMiddleware<R, I, I, E2, B>
): (<E1>(
  fa: ReaderMiddleware<R, I, I, E1, A>
) => ReaderMiddleware<R, I, I, E1 | E2, { [K in keyof A | N]: K extends keyof A ? A[K] : B }>) =>
  ichainW(a =>
    pipe(
      f(a),
      map(b => bind_(a, name, b))
    )
  )

/**
 * @since 0.6.3
 */
export const bind: <N extends string, R, I, E, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ReaderMiddleware<R, I, I, E, B>
) => (
  fa: ReaderMiddleware<R, I, I, E, A>
) => ReaderMiddleware<R, I, I, E, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = bindW

const _alt: Alt4<URI>['alt'] = (fx, f) => r => c =>
  pipe(
    fx(r)(c),
    TE.alt(() => f()(r)(c))
  )

const _bimap: Bifunctor4<URI>['bimap'] = (fea, f, g) => r => c =>
  pipe(
    fea(r)(c),
    TE.bimap(f, ([a, c]) => [g(a), c])
  )

const _mapLeft: Bifunctor4<URI>['mapLeft'] = (fea, f) => r => c => pipe(fea(r)(c), TE.mapLeft(f))

/**
 * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
 * use the type constructor `F` to represent some computational context.
 *
 * @category Functor
 * @since 0.6.3
 */
export const map = <A, B>(f: (a: A) => B) => <R, I, E>(
  fa: ReaderMiddleware<R, I, I, E, A>
): ReaderMiddleware<R, I, I, E, B> => T.map(fa, f)

/**
 * Map a pair of functions over the two last type arguments of the bifunctor.
 *
 * @category Bifunctor
 * @since 0.6.3
 */
export const bimap = <E, G, A, B>(f: (e: E) => G, g: (a: A) => B) => <R, I>(
  fa: ReaderMiddleware<R, I, I, E, A>
): ReaderMiddleware<R, I, I, G, B> => _bimap(fa, f, g)

/**
 * Map a function over the second type argument of a bifunctor.
 *
 * @category Bifunctor
 * @since 0.6.3
 */
export const mapLeft = <E, G>(f: (e: E) => G) => <R, I, A>(
  fa: ReaderMiddleware<R, I, I, E, A>
): ReaderMiddleware<R, I, I, G, A> => _mapLeft(fa, f)

/**
 * Apply a function to an argument under a type constructor.
 *
 * @category Apply
 * @since 0.6.3
 */
export const ap = <R, I, E, A>(fa: ReaderMiddleware<R, I, I, E, A>) => <B>(
  fab: ReaderMiddleware<R, I, I, E, (a: A) => B>
): ReaderMiddleware<R, I, I, E, B> => T.ap(fab, fa)

/**
 * Less strict version of [`ap`](#ap).
 *
 * @category Apply
 * @since 0.6.3
 */
export const apW: <R2, I, E2, A>(
  fa: ReaderMiddleware<R2, I, I, E2, A>
) => <R1, E1, B>(
  fab: ReaderMiddleware<R1, I, I, E1, (a: A) => B>
) => ReaderMiddleware<R1 & R2, I, I, E1 | E2, B> = ap as any

/**
 * @category Pointed
 * @since 0.6.3
 */
export const of: <R, I = H.StatusOpen, E = never, A = never>(a: A) => ReaderMiddleware<R, I, I, E, A> = T.of

/**
 * @since 0.6.3
 */
export function iof<R, I = H.StatusOpen, O = H.StatusOpen, E = never, A = never>(
  a: A
): ReaderMiddleware<R, I, O, E, A> {
  return () => H.iof(a)
}

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation.
 *
 * @category Monad
 * @since 0.6.3
 */
export const chain = <R, I, E, A, B>(f: (a: A) => ReaderMiddleware<R, I, I, E, B>) => (
  ma: ReaderMiddleware<R, I, I, E, A>
): ReaderMiddleware<R, I, I, E, B> => T.chain(ma, f)

/**
 * Less strict version of [`chain`](#chain).
 *
 * @category Monad
 * @since 0.6.3
 */
export const chainW: <R2, I, E2, A, B>(
  f: (a: A) => ReaderMiddleware<R2, I, I, E2, B>
) => <R1, E1>(ma: ReaderMiddleware<R1, I, I, E1, A>) => ReaderMiddleware<R1 & R2, I, I, E1 | E2, B> = chain as any

/**
 * @since 0.6.3
 */
export const ichain: <R, A, O, Z, E, B>(
  f: (a: A) => ReaderMiddleware<R, O, Z, E, B>
) => <I>(ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, Z, E, B> = ichainW

/**
 * @since 0.6.3
 */
export function ichainW<R2, A, O, Z, E2, B>(
  f: (a: A) => ReaderMiddleware<R2, O, Z, E2, B>
): <R1, I, E1>(ma: ReaderMiddleware<R1, I, O, E1, A>) => ReaderMiddleware<R1 & R2, I, Z, E1 | E2, B> {
  return ma => r => ci =>
    pipe(
      ma(r)(ci),
      H.TEchainW(([a, co]) => f(a)(r)(co))
    )
}

/**
 * @since 0.6.3
 */
export const chainMiddlewareK = <R, I, E, A, B>(f: (a: A) => H.Middleware<I, I, E, B>) => (
  ma: ReaderMiddleware<R, I, I, E, A>
): ReaderMiddleware<R, I, I, E, B> => T.chain(ma, a => fromMiddleware(f(a)))

/**
 * @since 0.6.3
 */
export const ichainMiddlewareK: <R, A, O, Z, E, B>(
  f: (a: A) => H.Middleware<O, Z, E, B>
) => <I>(ma: ReaderMiddleware<R, I, O, E, A>) => ReaderMiddleware<R, I, Z, E, B> = chainMiddlewareK as any

/**
 * @since 0.6.3
 */
export const ichainMiddlewareW: <R, A, O, Z, E, B>(
  f: (a: A) => H.Middleware<O, Z, E, B>
) => <I, D>(ma: ReaderMiddleware<R, I, O, D, A>) => ReaderMiddleware<R, I, Z, D | E, B> = chainMiddlewareK as any

/**
 * @since 0.6.3
 */
export const chainTaskEitherK: <E, A, B>(
  f: (a: A) => TE.TaskEither<E, B>
) => <R, I>(ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B> = f => ma => r =>
  pipe(
    ma(r),
    H.chain(a => H.fromTaskEither(f(a)))
  )

/**
 * @since 0.6.3
 */
export const chainTaskEitherKW: <E2, A, B>(
  f: (a: A) => TE.TaskEither<E2, B>
) => <R, I, E1>(ma: ReaderMiddleware<R, I, I, E1, A>) => ReaderMiddleware<R, I, I, E1 | E2, B> = chainTaskEitherK as any

/**
 * @since 0.6.3
 */
export const chainReaderTaskEitherK: <R, E, A, B>(
  f: (a: A) => RTE.ReaderTaskEither<R, E, B>
) => <I>(ma: ReaderMiddleware<R, I, I, E, A>) => ReaderMiddleware<R, I, I, E, B> = f => ma => r =>
  pipe(
    ma(r),
    H.chain(a => H.fromTaskEither(f(a)(r)))
  )

/**
 * @since 0.6.3
 */
export const chainReaderTaskEitherKW: <R2, E2, A, B>(
  f: (a: A) => RTE.ReaderTaskEither<R2, E2, B>
) => <R1, I, E1>(
  ma: ReaderMiddleware<R1, I, I, E1, A>
) => ReaderMiddleware<R1 & R2, I, I, E1 | E2, B> = chainReaderTaskEitherK as any

/**
 * @since 0.6.3
 */
export const Functor: Functor4<URI> = {
  URI,
  map: T.map
}

/**
 * @since 0.6.3
 */
export const Apply: Apply4<URI> = {
  ...Functor,
  ap: T.ap
}

/**
 * @since 0.6.3
 */
export const Applicative: Applicative4<URI> = {
  ...Apply,
  of
}

/**
 * @since 0.6.3
 */
export const Monad: Monad4<URI> = {
  ...Applicative,
  chain: T.chain
}

/**
 * @since 0.6.3
 */
export const MonadThrow: MonadThrow4<URI> = {
  ...Monad,
  throwError: left
}

/**
 * @since 0.6.3
 */
export const Alt: Alt4<URI> = {
  ...Functor,
  alt: _alt
}

/**
 * @since 0.6.3
 */
export const Bifunctor: Bifunctor4<URI> = {
  URI,
  bimap: _bimap,
  mapLeft: _mapLeft
}
