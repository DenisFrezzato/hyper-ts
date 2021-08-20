/**
 * A middleware is an indexed monadic action transforming one `Connection` to another `Connection`.
 * It operates in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output
 * `Connection` types of the middleware action.
 *
 * @since 0.7.0
 */
import * as TE from 'fp-ts/TaskEither'
import { Alt3 } from 'fp-ts/Alt'
import { apFirst as apFirst_, apSecond as apSecond_, Apply3, apS as apS_ } from 'fp-ts/Apply'
import { bind as bind_, Chain3, chainFirst as chainFirst_ } from 'fp-ts/Chain'
import { Bifunctor3 } from 'fp-ts/Bifunctor'
import { identity, Lazy, pipe, Predicate, Refinement } from 'fp-ts/function'
import { Functor3, bindTo as bindTo_ } from 'fp-ts/Functor'
import { Monad3 } from 'fp-ts/Monad'
import { BodyOpen, Connection, CookieOptions, HeadersOpen, MediaType, ResponseEnded, Status, StatusOpen } from '.'
import { Task } from 'fp-ts/Task'
import { IO } from 'fp-ts/IO'
import { IOEither } from 'fp-ts/IOEither'
import { Readable } from 'stream'
import { Applicative3 } from 'fp-ts/Applicative'
import { MonadThrow3 } from 'fp-ts/MonadThrow'
import { MonadTask3 } from 'fp-ts/MonadTask'
import * as E from 'fp-ts/Either'
import { Pointed3 } from 'fp-ts/Pointed'
import {
  fromPredicate as fromPredicate_,
  fromOption as fromOption_,
  filterOrElse as filterOrElse_,
  chainEitherK as chainEitherK_,
  FromEither3,
} from 'fp-ts/FromEither'
import * as O from 'fp-ts/Option'
import * as J from 'fp-ts/Json'
import { FromIO3, fromIOK as fromIOK_, chainIOK as chainIOK_, chainFirstIOK as chainFirstIOK_ } from 'fp-ts/FromIO'
import {
  FromTask3,
  fromTaskK as fromTaskK_,
  chainTaskK as chainTaskK_,
  chainFirstTaskK as chainFirstTaskK_,
} from 'fp-ts/FromTask'

declare module 'fp-ts/HKT' {
  interface URItoKind3<R, E, A> {
    Middleware: Middleware<R, R, E, A>
  }
}

/**
 * @category instances
 * @since 0.7.0
 */
export const URI = 'Middleware'

/**
 * @category instances
 * @since 0.7.0
 */
export type URI = typeof URI

/**
 * A middleware is an indexed monadic action transforming one `Connection` to another `Connection`. It operates
 * in the `TaskEither` monad, and is indexed by `I` and `O`, the input and output `Connection` types of the
 * middleware action.
 *
 * @category model
 * @since 0.7.0
 */
export interface Middleware<I, O, E, A> {
  (c: Connection<I>): TE.TaskEither<E, [A, Connection<O>]>
}

/**
 * @category constructor
 * @since 0.7.0
 */
export function gets<I = StatusOpen, E = never, A = never>(f: (c: Connection<I>) => A): Middleware<I, I, E, A> {
  return (c) => TE.right([f(c), c])
}

/**
 * @category constructor
 * @since 0.7.0
 */
export function fromConnection<I = StatusOpen, E = never, A = never>(
  f: (c: Connection<I>) => E.Either<E, A>
): Middleware<I, I, E, A> {
  return (c) =>
    TE.fromEither(
      pipe(
        f(c),
        E.map((a) => [a, c])
      )
    )
}

/**
 * @category constructor
 * @since 0.7.0
 */
export function modifyConnection<I, O, E>(f: (c: Connection<I>) => Connection<O>): Middleware<I, O, E, void> {
  return (c) => TE.right([undefined, f(c)])
}

const _map: Functor3<URI>['map'] = (fa, f) => (ci) =>
  pipe(
    fa(ci),
    TE.map(([a, co]) => [f(a), co])
  )

const _apPar: Monad3<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))
const _apSeq: Apply3<URI>['ap'] = (fab, fa) => _chain(fab, (f) => _map(fa, (a) => f(a)))

const _chain: Monad3<URI>['chain'] = (ma, f) => (c) =>
  pipe(
    ma(c),
    TE.chain(([a, c]) => f(a)(c))
  )

const _alt: Alt3<URI>['alt'] = (fx, f) => (c) =>
  pipe(
    fx(c),
    TE.alt(() => f()(c))
  )

const _bimap: Bifunctor3<URI>['bimap'] = (fea, f, g) => (c) =>
  pipe(
    fea(c),
    TE.bimap(f, ([a, c]) => [g(a), c])
  )

const _mapLeft: Bifunctor3<URI>['mapLeft'] = (fea, f) => (c) => pipe(fea(c), TE.mapLeft(f))

/**
 * `map` can be used to turn functions `(a: A) => B` into functions `(fa: F<A>) => F<B>` whose argument and return types
 * use the type constructor `F` to represent some computational context.
 *
 * @category Functor
 * @since 0.7.0
 */
export const map =
  <A, B>(f: (a: A) => B) =>
  <I, E>(fa: Middleware<I, I, E, A>): Middleware<I, I, E, B> =>
    _map(fa, f)

/**
 * Indexed version of [`map`](#map).
 *
 * @category IxFunctor
 * @since 0.7.0
 */
export const imap =
  <A, B>(f: (a: A) => B) =>
  <I, O, E>(fa: Middleware<I, O, E, A>): Middleware<I, O, E, B> =>
  (ci) =>
    pipe(
      fa(ci),
      TE.map(([a, co]) => [f(a), co])
    )

/**
 * Map a pair of functions over the two last type arguments of the bifunctor.
 *
 * @category Bifunctor
 * @since 0.7.0
 */
export const bimap =
  <E, G, A, B>(f: (e: E) => G, g: (a: A) => B) =>
  <I>(fa: Middleware<I, I, E, A>): Middleware<I, I, G, B> =>
    _bimap(fa, f, g)

/**
 * Map a function over the second type argument of a bifunctor.
 *
 * @category Bifunctor
 * @since 0.7.0
 */
export const mapLeft =
  <E, G>(f: (e: E) => G) =>
  <I, A>(fa: Middleware<I, I, E, A>): Middleware<I, I, G, A> =>
    _mapLeft(fa, f)

/**
 * Apply a function to an argument under a type constructor.
 *
 * @category Apply
 * @since 0.7.0
 */
export const ap =
  <I, E, A>(fa: Middleware<I, I, E, A>) =>
  <B>(fab: Middleware<I, I, E, (a: A) => B>): Middleware<I, I, E, B> =>
    _apSeq(fab, fa)

/**
 * Less strict version of [`ap`](#ap).
 *
 * @category Apply
 * @since 0.7.0
 */
export const apW: <I, E2, A>(
  fa: Middleware<I, I, E2, A>
) => <E1, B>(fab: Middleware<I, I, E1, (a: A) => B>) => Middleware<I, I, E1 | E2, B> = ap as any

/**
 * @category Pointed
 * @since 0.7.0
 */
export const of: <I = StatusOpen, E = never, A = never>(a: A) => Middleware<I, I, E, A> = right

/**
 * @category Pointed
 * @since 0.7.0
 */
export function iof<I = StatusOpen, O = StatusOpen, E = never, A = never>(a: A): Middleware<I, O, E, A> {
  return (c) => TE.right([a, c as any])
}

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation.
 *
 * @category Monad
 * @since 0.7.0
 */
export const chain =
  <I, E, A, B>(f: (a: A) => Middleware<I, I, E, B>) =>
  (ma: Middleware<I, I, E, A>): Middleware<I, I, E, B> =>
    _chain(ma, f)

/**
 * Less strict version of [`chain`](#chain).
 *
 * @category Monad
 * @since 0.7.0
 */
export const chainW: <I, E2, A, B>(
  f: (a: A) => Middleware<I, I, E2, B>
) => <E1>(ma: Middleware<I, I, E1, A>) => Middleware<I, I, E1 | E2, B> = chain as any

/**
 * Derivable from `Chain`.
 *
 * @category combinators
 * @since 0.7.0
 */
export const flatten: <I, E, A>(mma: Middleware<I, I, E, Middleware<I, I, E, A>>) => Middleware<I, I, E, A> =
  chain(identity)

/**
 * Less strict version of [`ichain`](#ichain).
 *
 * @category IxMonad
 * @since 0.7.0
 */
export function ichainW<A, O, Z, E, B>(
  f: (a: A) => Middleware<O, Z, E, B>
): <I, D>(ma: Middleware<I, O, D, A>) => Middleware<I, Z, D | E, B> {
  return (ma) => (ci) =>
    pipe(
      ma(ci),
      TE.chainW(([a, co]) => f(a)(co))
    )
}

/**
 * Indexed version of [`chain`](#chain).
 *
 * @category IxMonad
 * @since 0.7.0
 */
export const ichain: <A, O, Z, E, B>(
  f: (a: A) => Middleware<O, Z, E, B>
) => <I>(ma: Middleware<I, O, E, A>) => Middleware<I, Z, E, B> = ichainW

/**
 * @category Alt
 * @since 0.7.0
 */
export const alt =
  <I, E, A>(that: Lazy<Middleware<I, I, E, A>>) =>
  (fa: Middleware<I, I, E, A>): Middleware<I, I, E, A> =>
    _alt(fa, that)

/**
 * @since 0.7.0
 */
export function evalMiddleware<I, O, E, A>(ma: Middleware<I, O, E, A>, c: Connection<I>): TE.TaskEither<E, A> {
  return pipe(
    ma(c),
    TE.map(([a]) => a)
  )
}

/**
 * @since 0.7.0
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
 * @category combinators
 * @since 0.7.0
 */
export function orElse<E, I, O, M, A>(
  f: (e: E) => Middleware<I, O, M, A>
): (ma: Middleware<I, O, E, A>) => Middleware<I, O, M, A> {
  return (ma) => (c) =>
    pipe(
      ma(c),
      TE.orElse((e) => f(e)(c))
    )
}

/**
 * @category interop
 * @since 0.7.0
 */
export function tryCatch<I = StatusOpen, E = never, A = never>(
  f: () => Promise<A>,
  onRejected: (reason: unknown) => E
): Middleware<I, I, E, A> {
  return fromTaskEither(TE.tryCatch(f, onRejected))
}

/**
 * @category constructors
 * @since 0.7.0
 */
export function fromTaskEither<I = StatusOpen, E = never, A = never>(fa: TE.TaskEither<E, A>): Middleware<I, I, E, A> {
  return (c) =>
    pipe(
      fa,
      TE.map((a) => [a, c])
    )
}

/**
 * @category constructors
 * @since 0.7.0
 */
export function right<I = StatusOpen, E = never, A = never>(a: A): Middleware<I, I, E, A> {
  return iof(a)
}

/**
 * @category constructors
 * @since 0.7.0
 */
export function left<I = StatusOpen, E = never, A = never>(e: E): Middleware<I, I, E, A> {
  return fromTaskEither(TE.left(e))
}

/**
 * @category constructors
 * @since 0.7.0
 */
export function rightTask<I = StatusOpen, E = never, A = never>(fa: Task<A>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.rightTask(fa))
}

/**
 * @category constructors
 * @since 0.7.0
 */
export function leftTask<I = StatusOpen, E = never, A = never>(te: Task<E>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.leftTask(te))
}

/**
 * @category constructors
 * @since 0.7.0
 */
export function rightIO<I = StatusOpen, E = never, A = never>(fa: IO<A>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.rightIO(fa))
}

/**
 * @category constructors
 * @since 0.7.0
 */
export function leftIO<I = StatusOpen, E = never, A = never>(fe: IO<E>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.leftIO(fe))
}

/**
 * @category constructors
 * @since 0.7.0
 */
export const fromEither = <I = StatusOpen, E = never, A = never>(fa: E.Either<E, A>): Middleware<I, I, E, A> =>
  fromTaskEither(TE.fromEither(fa))

/**
 * @category constructors
 * @since 0.7.0
 */
export function fromIOEither<I = StatusOpen, E = never, A = never>(fa: IOEither<E, A>): Middleware<I, I, E, A> {
  return fromTaskEither(TE.fromIOEither(fa))
}

/**
 * Returns a middleware that writes the response status
 *
 * @category constructors
 * @since 0.7.0
 */
export function status<E = never>(status: Status): Middleware<StatusOpen, HeadersOpen, E, void> {
  return modifyConnection((c) => c.setStatus(status))
}

/**
 * Returns a middleware that writes the given header
 *
 * @category constructors
 * @since 0.7.0
 */
export function header<E = never>(name: string, value: string): Middleware<HeadersOpen, HeadersOpen, E, void> {
  return modifyConnection((c) => c.setHeader(name, value))
}

/**
 * Returns a middleware that sets the given `mediaType`
 *
 * @category constructors
 * @since 0.7.0
 */
export function contentType<E = never>(mediaType: MediaType): Middleware<HeadersOpen, HeadersOpen, E, void> {
  return header('Content-Type', mediaType)
}

/**
 * Returns a middleware that sets the cookie `name` to `value`, with the given `options`
 *
 * @category constructors
 * @since 0.7.0
 */
export function cookie<E = never>(
  name: string,
  value: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void> {
  return modifyConnection((c) => c.setCookie(name, value, options))
}

/**
 * Returns a middleware that clears the cookie `name`
 *
 * @category constructors
 * @since 0.7.0
 */
export function clearCookie<E = never>(
  name: string,
  options: CookieOptions
): Middleware<HeadersOpen, HeadersOpen, E, void> {
  return modifyConnection((c) => c.clearCookie(name, options))
}

const closedHeaders: Middleware<HeadersOpen, BodyOpen, never, void> = iof(undefined)

/**
 * Returns a middleware that changes the connection status to `BodyOpen`
 *
 * @category constructors
 * @since 0.7.0
 */
export function closeHeaders<E = never>(): Middleware<HeadersOpen, BodyOpen, E, void> {
  return closedHeaders
}

/**
 * Returns a middleware that sends `body` as response body
 *
 * @category constructors
 * @since 0.7.0
 */
export function send<E = never>(body: string): Middleware<BodyOpen, ResponseEnded, E, void> {
  return modifyConnection((c) => c.setBody(body))
}

const ended: Middleware<BodyOpen, ResponseEnded, never, void> = modifyConnection((c) => c.endResponse())

/**
 * Returns a middleware that ends the response without sending any response body
 *
 * @category constructors
 * @since 0.7.0
 */
export function end<E = never>(): Middleware<BodyOpen, ResponseEnded, E, void> {
  return ended
}

/**
 * Returns a middleware that sends `body` as JSON
 *
 * @category constructors
 * @since 0.7.0
 */
export function json<E>(
  body: unknown,
  onError: (reason: unknown) => E
): Middleware<HeadersOpen, ResponseEnded, E, void> {
  return pipe(
    fromEither<HeadersOpen, unknown, string>(J.stringify(body)),
    mapLeft(onError),
    ichain((json) =>
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
 * @category constructors
 * @since 0.7.0
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
 * @category constructors
 * @since 0.7.0
 */
export function pipeStream<E>(stream: Readable): Middleware<BodyOpen, ResponseEnded, E, void> {
  return modifyConnection((c) => c.pipeStream(stream))
}

const isUnknownRecord = (u: unknown): u is Record<string, unknown> => u !== null && typeof u === 'object'

/**
 * Returns a middleware that tries to decode `connection.getParams()[name]`
 *
 * @category constructors
 * @since 0.7.0
 */
export function decodeParam<E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection((c) => {
    const params = c.getParams()
    return f(isUnknownRecord(params) ? params[name] : undefined)
  })
}

/**
 * Returns a middleware that tries to decode `connection.getParams()`
 *
 * @category constructors
 * @since 0.7.0
 */
export function decodeParams<E, A>(f: (input: unknown) => E.Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection((c) => f(c.getParams()))
}

/**
 * Returns a middleware that tries to decode `connection.getQuery()`
 *
 * @category constructors
 * @since 0.7.0
 */
export function decodeQuery<E, A>(f: (input: unknown) => E.Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection((c) => f(c.getQuery()))
}

/**
 * Returns a middleware that tries to decode `connection.getBody()`
 *
 * @category constructors
 * @since 0.7.0
 */
export function decodeBody<E, A>(f: (input: unknown) => E.Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection((c) => f(c.getBody()))
}

/**
 * Returns a middleware that tries to decode `connection.getMethod()`
 *
 * @category constructors
 * @since 0.7.0
 */
export function decodeMethod<E, A>(f: (method: string) => E.Either<E, A>): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection((c) => f(c.getMethod()))
}

/**
 * Returns a middleware that tries to decode `connection.getHeader(name)`
 *
 * @category constructors
 * @since 0.7.0
 */
export function decodeHeader<E, A>(
  name: string,
  f: (input: unknown) => E.Either<E, A>
): Middleware<StatusOpen, StatusOpen, E, A> {
  return fromConnection((c) => f(c.getHeader(name)))
}

/**
 * @category instances
 * @since 0.7.0
 */
export const Functor: Functor3<URI> = {
  URI,
  map: _map,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const Pointed: Pointed3<URI> = {
  URI,
  of,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const ApplyPar: Apply3<URI> = {
  ...Functor,
  ap: _apPar,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const ApplySeq: Apply3<URI> = {
  ...Functor,
  ap: _apSeq,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const ApplicativePar: Applicative3<URI> = {
  ...ApplyPar,
  of,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const ApplicativeSeq: Applicative3<URI> = {
  ...ApplySeq,
  of,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const Chain: Chain3<URI> = {
  ...Functor,
  ap: _apPar,
  chain: _chain,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const Monad: Monad3<URI> = {
  ...ApplicativePar,
  chain: _chain,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const MonadThrow: MonadThrow3<URI> = {
  ...Monad,
  throwError: left,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const Alt: Alt3<URI> = {
  ...Functor,
  alt: _alt,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const FromEither: FromEither3<URI> = {
  URI,
  fromEither,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const Bifunctor: Bifunctor3<URI> = {
  URI,
  bimap: _bimap,
  mapLeft: _mapLeft,
}

/**
 * @category instances
 * @since 0.7.0
 */
export const MonadTask: MonadTask3<URI> = {
  ...Monad,
  fromIO: rightIO,
  fromTask: rightTask,
}

/**
 * @category combinators
 * @since 0.7.0
 */
export const apFirst = apFirst_(ApplyPar)

/**
 * Less strict version of [`apFirst`](#apfirst).
 *
 * @category combinators
 * @since 0.7.1
 */
export const apFirstW: <I, E2, B>(
  second: Middleware<I, I, E2, B>
) => <E1, A>(first: Middleware<I, I, E1, A>) => Middleware<I, I, E1 | E2, A> = apFirst as any

/**
 * @category combinators
 * @since 0.7.0
 */
export const apSecond = apSecond_(ApplyPar)

/**
 * Less strict version of [`apSecond`](#apsecond).
 *
 * @category combinators
 * @since 0.7.1
 */
export const apSecondW: <I, E2, B>(
  second: Middleware<I, I, E2, B>
) => <E1, A>(first: Middleware<I, I, E1, A>) => Middleware<I, I, E1 | E2, B> = apSecond as any

/**
 * Composes computations in sequence, using the return value of one computation to determine the next computation and
 * keeping only the result of the first.
 *
 * Derivable from `Chain`.
 *
 * @category combinators
 * @since 0.7.0
 */
export const chainFirst = chainFirst_(Chain)

/**
 * Less strict version of [`chainFirst`](#chainfirst).
 *
 * Derivable from `Chain`.
 *
 * @category combinators
 * @since 0.7.0
 */
export const chainFirstW: <I, E2, A, B>(
  f: (a: A) => Middleware<I, I, E2, B>
) => <E1>(ma: Middleware<I, I, E1, A>) => Middleware<I, I, E1 | E2, A> = chainFirst as any

/**
 * @category constructors
 * @since 0.7.0
 */
export const fromPredicate: {
  <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <I>(a: A) => Middleware<I, I, E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): <I>(a: A) => Middleware<I, I, E, A>
} = fromPredicate_(FromEither)

/**
 * @category combinators
 * @since 0.7.0
 */
export const filterOrElse: {
  <E, A, B extends A>(refinement: Refinement<A, B>, onFalse: (a: A) => E): <I>(
    ma: Middleware<I, I, E, A>
  ) => Middleware<I, I, E, B>
  <E, A>(predicate: Predicate<A>, onFalse: (a: A) => E): <I>(ma: Middleware<I, I, E, A>) => Middleware<I, I, E, A>
} = filterOrElse_(FromEither, Chain)

/**
 * Less strict version of [`filterOrElse`](#filterorelse).
 *
 * @category combinators
 * @since 0.7.0
 */
export const filterOrElseW: {
  <A, B extends A, E2>(refinement: Refinement<A, B>, onFalse: (a: A) => E2): <I, E1>(
    ma: Middleware<I, I, E1, A>
  ) => Middleware<I, I, E1 | E2, B>
  <A, E2>(predicate: Predicate<A>, onFalse: (a: A) => E2): <I, E1>(
    ma: Middleware<I, I, E1, A>
  ) => Middleware<I, I, E1 | E2, A>
} = filterOrElse

/**
 * @category constructors
 * @since 0.7.0
 */
export const fromOption: <E>(onNone: Lazy<E>) => <I, A>(ma: O.Option<A>) => Middleware<I, I, E, A> =
  fromOption_(FromEither)

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainEitherK: <E, A, B>(
  f: (a: A) => E.Either<E, B>
) => <I>(ma: Middleware<I, I, E, A>) => Middleware<I, I, E, B> = chainEitherK_(FromEither, Chain)

/**
 * Less strict version of [`chainEitherK`](#chaineitherk).
 *
 * @category combinators
 * @since 0.7.0
 */
export const chainEitherKW: <E2, A, B>(
  f: (a: A) => E.Either<E2, B>
) => <I, E1>(ma: Middleware<I, I, E1, A>) => Middleware<I, I, E1 | E2, B> = chainEitherK as any

/**
 * @category constructors
 * @since 0.7.0
 */
export const fromIO: FromIO3<URI>['fromIO'] = rightIO

/**
 * @category instances
 * @since 0.7.0
 */
export const FromIO: FromIO3<URI> = {
  URI,
  fromIO,
}

/**
 * @category combinators
 * @since 0.7.0
 */
export const fromIOK = fromIOK_(FromIO)

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainIOK = chainIOK_(FromIO, Chain)

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainFirstIOK = chainFirstIOK_(FromIO, Chain)

/**
 * @category constructors
 * @since 0.7.0
 */
export const fromTask: FromTask3<URI>['fromTask'] = rightTask

/**
 * @category instances
 * @since 0.7.0
 */
export const FromTask: FromTask3<URI> = {
  ...FromIO,
  fromTask,
}

/**
 * @category combinators
 * @since 0.7.0
 */
export const fromTaskK = fromTaskK_(FromTask)

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainTaskK = chainTaskK_(FromTask, Chain)

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainFirstTaskK = chainFirstTaskK_(FromTask, Chain)

/**
 * Less strict version of [`chainTaskEitherK`](#chaintaskeitherk).
 *
 * @category combinators
 * @since 0.7.0
 */
export const chainTaskEitherKW: <E2, A, B>(
  f: (a: A) => TE.TaskEither<E2, B>
) => <I, E1>(ma: Middleware<I, I, E1, A>) => Middleware<I, I, E1 | E2, B> = (f) => chainW((a) => fromTaskEither(f(a)))

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainTaskEitherK: <E, A, B>(
  f: (a: A) => TE.TaskEither<E, B>
) => <I>(ma: Middleware<I, I, E, A>) => Middleware<I, I, E, B> = chainTaskEitherKW

/**
 * Less strict version of [`chainFirstTaskEitherK`](#chainfirsttaskeitherk).
 *
 * @category combinators
 * @since 0.7.0
 */
export const chainFirstTaskEitherKW: <E2, A, B>(
  f: (a: A) => TE.TaskEither<E2, B>
) => <I, E1>(ma: Middleware<I, I, E1, A>) => Middleware<I, I, E1 | E2, A> = (f) =>
  chainFirstW((a) => fromTaskEither(f(a)))

/**
 * @category combinators
 * @since 0.7.0
 */
export const chainFirstTaskEitherK: <E, A, B>(
  f: (a: A) => TE.TaskEither<E, B>
) => <I>(ma: Middleware<I, I, E, A>) => Middleware<I, I, E, A> = chainFirstTaskEitherKW

/**
 * @since 0.7.0
 */
export const Do = iof<unknown, unknown, never, {}>({})

/**
 * @since 0.7.0
 */
export const bindTo = bindTo_(Functor)

/**
 * Indexed version of [`bindTo`](#bindto).
 *
 * @since 0.7.0
 */
export const ibindTo: <N extends string>(
  name: N
) => <I, O, E, A>(fa: Middleware<I, O, E, A>) => Middleware<I, O, E, { readonly [K in N]: A }> = bindTo as any

/**
 * @since 0.7.0
 */
export const bind = bind_(Chain)

/**
 * @since 0.7.0
 */
export const bindW: <N extends string, I, A, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Middleware<I, I, E2, B>
) => <E1>(
  fa: Middleware<I, I, E1, A>
) => Middleware<I, I, E1 | E2, { [K in keyof A | N]: K extends keyof A ? A[K] : B }> = bind as any

/**
 * Less strict version of [`ibind`](#ibind).
 *
 * @since 0.7.0
 */
export const ibindW: <N extends string, A, O, Z, E2, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Middleware<O, Z, E2, B>
) => <I, E1>(
  ma: Middleware<I, O, E1, A>
) => Middleware<I, Z, E1 | E2, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> = bindW as any

/**
 * @since 0.7.0
 */
export const ibind: <N extends string, A, O, Z, E, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Middleware<O, Z, E, B>
) => <I>(
  ma: Middleware<I, O, E, A>
) => Middleware<I, Z, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> = ibindW

/**
 * @since 0.7.0
 */
export const apS = apS_(ApplyPar)

/**
 * Less strict version of [`apS`](#aps).
 *
 * @since 0.7.0
 */
export const apSW: <N extends string, A, I, E2, B>(
  name: Exclude<N, keyof A>,
  fb: Middleware<I, I, E2, B>
) => <E1>(
  fa: Middleware<I, I, E1, A>
) => Middleware<I, I, E1 | E2, { readonly [K in keyof A | N]: K extends keyof A ? A[K] : B }> = apS as any

/**
 * Less strict version of [`iapS`](#iaps).
 *
 * @since 0.7.0
 */
export const iapSW: <N extends string, A, I, O, E2, B>(
  name: Exclude<N, keyof A>,
  fb: Middleware<I, O, E2, B>
) => <E1>(
  fa: Middleware<I, O, E1, A>
) => Middleware<I, O, E1 | E2, { readonly [K in keyof A | N]: K extends keyof A ? A[K] : B }> = apS as any

/**
 * @since 0.7.0
 */
export const iapS: <N extends string, A, I, O, E, B>(
  name: Exclude<N, keyof A>,
  fb: Middleware<I, O, E, B>
) => (
  fa: Middleware<I, O, E, A>
) => Middleware<I, O, E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> = iapSW
