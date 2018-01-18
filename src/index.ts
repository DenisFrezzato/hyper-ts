import * as express from 'express'
import { Monad } from 'fp-ts/lib/Monad'
import { HKT, HKTS, HKTAs, HKT3, HKT3S, HKT3As, HKT2S, HKT2As } from 'fp-ts/lib/HKT'
import { tuple } from 'fp-ts/lib/function'
import { Foldable, traverse_ } from 'fp-ts/lib/Foldable'
import { IxMonad } from 'fp-ts/lib/IxMonad'
import { Decoder, Validation, validate, Dictionary } from 'io-ts'

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

export enum Status {
  OK = 200,
  Created = 201,
  Found = 302,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406
}

/**
 * A `Conn`, short for "connection", models the entirety of a connection between the HTTP server and the user agent,
 * both request and response.
 * State changes are tracked by the phanton type `S`
 */
export class Conn<S> {
  // prettier-ignore
  readonly '_S': S
  constructor(readonly req: express.Request, readonly res: express.Response) {}
}

/**
 * A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates
 * in some base monad `M`, and is indexed by `I` and `O`, the input and output `Conn` types of the
 * middleware action.
 */
export type Middleware<M, I, O, A> = (c: Conn<I>) => HKT<M, [A, Conn<O>]>

export type Middleware1<M extends HKTS, I, O, A> = (c: Conn<I>) => HKTAs<M, [A, Conn<O>]>

export type Middleware2<M extends HKT2S, L, I, O, A> = (c: Conn<I>) => HKT2As<M, L, [A, Conn<O>]>

export interface MiddlewareT<M> {
  map: <I, A, B>(f: (a: A) => B, fa: Middleware<M, I, I, A>) => Middleware<M, I, I, B>
  of: <I, A>(a: A) => Middleware<M, I, I, A>
  ap: <I, A, B>(fab: Middleware<M, I, I, (a: A) => B>, fa: Middleware<M, I, I, A>) => Middleware<M, I, I, B>
  chain: <I, A, B>(f: (a: A) => Middleware<M, I, I, B>, fa: Middleware<M, I, I, A>) => Middleware<M, I, I, B>
  ichain: <I, O, Z, A, B>(f: (a: A) => Middleware<M, O, Z, B>, fa: Middleware<M, I, O, A>) => Middleware<M, I, Z, B>
  evalMiddleware: <I, O, A>(ma: Middleware<M, I, O, A>, c: Conn<I>) => HKT<M, A>
  lift: <I, A>(fa: HKT<M, A>) => Middleware<M, I, I, A>
  gets: <I, A>(f: (c: Conn<I>) => A) => Middleware<M, I, I, A>
}

export interface MiddlewareT1<M extends HKTS> {
  map: <I, A, B>(f: (a: A) => B, fa: Middleware1<M, I, I, A>) => Middleware1<M, I, I, B>
  of: <I, A>(a: A) => Middleware1<M, I, I, A>
  ap: <I, A, B>(fab: Middleware1<M, I, I, (a: A) => B>, fa: Middleware1<M, I, I, A>) => Middleware1<M, I, I, B>
  chain: <I, A, B>(f: (a: A) => Middleware1<M, I, I, B>, fa: Middleware1<M, I, I, A>) => Middleware1<M, I, I, B>
  ichain: <I, O, Z, A, B>(f: (a: A) => Middleware1<M, O, Z, B>, fa: Middleware1<M, I, O, A>) => Middleware1<M, I, Z, B>
  evalMiddleware: <I, O, A>(ma: Middleware1<M, I, O, A>, c: Conn<I>) => HKTAs<M, A>
  lift: <I, A>(fa: HKTAs<M, A>) => Middleware1<M, I, I, A>
  gets: <I, A>(f: (c: Conn<I>) => A) => Middleware1<M, I, I, A>
}

export interface MiddlewareT2<M extends HKT2S> {
  map: <L, I, A, B>(f: (a: A) => B, fa: Middleware2<M, L, I, I, A>) => Middleware2<M, L, I, I, B>
  of: <L, I, A>(a: A) => Middleware2<M, L, I, I, A>
  ap: <L, I, A, B>(
    fab: Middleware2<M, L, I, I, (a: A) => B>,
    fa: Middleware2<M, L, I, I, A>
  ) => Middleware2<M, L, I, I, B>
  chain: <L, I, A, B>(
    f: (a: A) => Middleware2<M, L, I, I, B>,
    fa: Middleware2<M, L, I, I, A>
  ) => Middleware2<M, L, I, I, B>
  ichain: <L, I, O, Z, A, B>(
    f: (a: A) => Middleware2<M, L, O, Z, B>,
    fa: Middleware2<M, L, I, O, A>
  ) => Middleware2<M, L, I, Z, B>
  evalMiddleware: <L, I, O, A>(ma: Middleware2<M, L, I, O, A>, c: Conn<I>) => HKT2As<M, L, A>
  lift: <L, I, A>(fa: HKT2As<M, L, A>) => Middleware2<M, L, I, I, A>
  gets: <L, I, A>(f: (c: Conn<I>) => A) => Middleware2<M, L, I, I, A>
}

export function getMiddlewareT<M extends HKT2S>(M: Monad<M>): MiddlewareT2<M>
export function getMiddlewareT<M extends HKTS>(M: Monad<M>): MiddlewareT1<M>
export function getMiddlewareT<M>(M: Monad<M>): MiddlewareT<M>
export function getMiddlewareT<M>(M: Monad<M>): MiddlewareT<M> {
  function map<I, A, B>(f: (a: A) => B, fa: Middleware<M, I, I, A>): Middleware<M, I, I, B> {
    return cf => M.map(([a, ct]) => tuple(f(a), ct), fa(cf))
  }

  function of<I, A>(a: A): Middleware<M, I, I, A> {
    return c => M.of(tuple(a, c))
  }

  function ap<I, A, B>(fab: Middleware<M, I, I, (a: A) => B>, fa: Middleware<M, I, I, A>): Middleware<M, I, I, B> {
    return c => {
      const ma = evalMiddleware(fa, c)
      const mab = evalMiddleware(fab, c)
      return M.map(b => tuple(b, c), M.ap(mab, ma))
    }
  }

  function chain<I, A, B>(f: (a: A) => Middleware<M, I, I, B>, fa: Middleware<M, I, I, A>): Middleware<M, I, I, B> {
    return ichain(f, fa)
  }

  function ichain<I, O, Z, A, B>(
    f: (a: A) => Middleware<M, O, Z, B>,
    fa: Middleware<M, I, O, A>
  ): Middleware<M, I, Z, B> {
    return ci => M.chain(([a, co]) => f(a)(co), fa(ci))
  }

  function evalMiddleware<I, O, A>(fa: Middleware<M, I, O, A>, c: Conn<I>): HKT<M, A> {
    return M.map(([a]) => a, fa(c))
  }

  function lift<I, A>(fa: HKT<M, A>): Middleware<M, I, I, A> {
    return c => M.map(a => tuple(a, c), fa)
  }

  function gets<I, A>(f: (c: Conn<I>) => A): Middleware<M, I, I, A> {
    return c => M.of(tuple(f(c), c))
  }

  return {
    evalMiddleware,
    map,
    of,
    ap,
    chain,
    ichain,
    lift,
    gets
  }
}

/** Type indicating that the status-line is ready to be sent */
export type StatusOpen = 'StatusOpen'

/** Type indicating that headers are ready to be sent, i.e. the body streaming has not been started */
export type HeadersOpen = 'HeadersOpen'

/** Type indicating that headers have already been sent, and that the body is currently streaming */
export type BodyOpen = 'BodyOpen'

/** Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished. */
export type ResponseEnded = 'ResponseEnded'

export type Header = [string, string]

export interface Monad3<M> {
  readonly URI: M
  map<I, A, B>(f: (a: A) => B, fa: HKT3<M, I, I, A>): HKT3<M, I, I, B>
  of<I, A>(a: A): HKT3<M, I, I, A>
  ap<I, A, B>(fab: HKT3<M, I, I, (a: A) => B>, fa: HKT3<M, I, I, A>): HKT3<M, I, I, B>
  chain<I, A, B>(f: (a: A) => HKT3<M, I, I, B>, fa: HKT3<M, I, I, A>): HKT3<M, I, I, B>
}

export interface MonadMiddleware<M> extends Monad3<M>, IxMonad<M> {
  status: (status: Status) => HKT3<M, StatusOpen, HeadersOpen, void>
  header: (header: Header) => HKT3<M, HeadersOpen, HeadersOpen, void>
  closeHeaders: HKT3<M, HeadersOpen, BodyOpen, void>
  send: (o: string) => HKT3<M, BodyOpen, ResponseEnded, void>
  end: HKT3<M, BodyOpen, ResponseEnded, void>
  cookie: (name: string, value: string, options: express.CookieOptions) => HKT3<M, HeadersOpen, HeadersOpen, void>
  clearCookie: (name: string, options: express.CookieOptions) => HKT3<M, HeadersOpen, HeadersOpen, void>
  gets: <I, A>(f: (c: Conn<I>) => A) => HKT3<M, I, I, A>
}

export function headers<M extends HKT3S>(
  R: MonadMiddleware<M>
): <F>(F: Foldable<F>) => (headers: HKT<F, Header>) => HKT3As<M, HeadersOpen, BodyOpen, void>
export function headers<M>(
  R: MonadMiddleware<M>
): <F>(F: Foldable<F>) => (headers: HKT<F, Header>) => HKT3<M, HeadersOpen, BodyOpen, void>
export function headers<M>(
  R: MonadMiddleware<M>
): <F>(F: Foldable<F>) => (headers: HKT<F, Header>) => HKT3<M, HeadersOpen, BodyOpen, void> {
  return F => headers => {
    const mheaders = traverse_(R, F)(h => R.header(h), headers) as HKT3<M, HeadersOpen, HeadersOpen, void>
    return R.ichain(() => R.closeHeaders, mheaders)
  }
}

export function contentType<M extends HKT3S>(
  R: MonadMiddleware<M>
): (mediaType: MediaType) => HKT3As<M, HeadersOpen, HeadersOpen, void>
export function contentType<M>(R: MonadMiddleware<M>): (mediaType: MediaType) => HKT3<M, HeadersOpen, HeadersOpen, void>
export function contentType<M>(
  R: MonadMiddleware<M>
): (mediaType: MediaType) => HKT3<M, HeadersOpen, HeadersOpen, void> {
  return mediaType => R.header(['Content-Type', mediaType])
}

export function json<M extends HKT3S>(R: MonadMiddleware<M>): (o: string) => HKT3As<M, HeadersOpen, ResponseEnded, void>
export function json<M>(R: MonadMiddleware<M>): (o: string) => HKT3<M, HeadersOpen, ResponseEnded, void>
export function json<M>(R: MonadMiddleware<M>): (o: string) => HKT3<M, HeadersOpen, ResponseEnded, void> {
  const contentType_ = contentType(R)
  return o => R.ichain(() => R.send(o), R.ichain(() => R.closeHeaders, contentType_(MediaType.applicationJSON)))
}

export function redirect<M extends HKT3S>(
  R: MonadMiddleware<M>
): (uri: string) => HKT3As<M, StatusOpen, HeadersOpen, void>
export function redirect<M>(R: MonadMiddleware<M>): (uri: string) => HKT3<M, StatusOpen, HeadersOpen, void>
export function redirect<M>(R: MonadMiddleware<M>): (uri: string) => HKT3<M, StatusOpen, HeadersOpen, void> {
  return uri => R.ichain(() => R.header(['Location', uri]), R.status(Status.Found))
}

export function param<M extends HKT3S>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<any, A>) => HKT3As<M, StatusOpen, StatusOpen, Validation<A>>
export function param<M>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<any, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function param<M>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<any, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return (name, type) => R.gets(c => validate(c.req.params, Dictionary).chain(params => validate(params[name], type)))
}

export function params<M extends HKT3S>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3As<M, StatusOpen, StatusOpen, Validation<A>>
export function params<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function params<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return type => R.gets(c => validate(c.req.params, type))
}

export function query<M extends HKT3S>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3As<M, StatusOpen, StatusOpen, Validation<A>>
export function query<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function query<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return type => R.gets(c => validate(c.req.query, type))
}

export function body<M extends HKT3S>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3As<M, StatusOpen, StatusOpen, Validation<A>>
export function body<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function body<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<any, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return type => R.gets(c => validate(c.req.body, type))
}
