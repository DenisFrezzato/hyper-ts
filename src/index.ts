import { Monad, Monad1, Monad2 } from 'fp-ts/lib/Monad'
import { HKT, URIS, Type, HKT3, URIS3, Type3, URIS2, Type2 } from 'fp-ts/lib/HKT'
import { tuple } from 'fp-ts/lib/function'
import { IxMonad, IxMonad3 } from 'fp-ts/lib/IxMonad'
import { Decoder, Validation, Dictionary, mixed } from 'io-ts'

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
 * State changes are tracked by the phanton type `S`
 */
export interface Conn<S> {
  readonly _S: S
  clearCookie: (name: string, options: CookieOptions) => void
  endResponse: () => void
  getBody: () => mixed
  getHeader: (name: string) => mixed
  getParams: () => mixed
  getQuery: () => mixed
  setBody: (body: mixed) => void
  setCookie: (name: string, value: string, options: CookieOptions) => void
  setHeader: (name: string, value: string) => void
  setStatus: (status: Status) => void
}

/**
 * A middleware is an indexed monadic action transforming one `Conn` to another `Conn`. It operates
 * in some base monad `M`, and is indexed by `I` and `O`, the input and output `Conn` types of the
 * middleware action.
 */
export type Middleware<M, I, O, A> = (c: Conn<I>) => HKT<M, [A, Conn<O>]>

export type Middleware1<M extends URIS, I, O, A> = (c: Conn<I>) => Type<M, [A, Conn<O>]>

export type Middleware2<M extends URIS2, L, I, O, A> = (c: Conn<I>) => Type2<M, L, [A, Conn<O>]>

export interface MiddlewareT<M> {
  map: <I, A, B>(fa: Middleware<M, I, I, A>, f: (a: A) => B) => Middleware<M, I, I, B>
  of: <I, A>(a: A) => Middleware<M, I, I, A>
  ap: <I, A, B>(fab: Middleware<M, I, I, (a: A) => B>, fa: Middleware<M, I, I, A>) => Middleware<M, I, I, B>
  chain: <I, A, B>(fa: Middleware<M, I, I, A>, f: (a: A) => Middleware<M, I, I, B>) => Middleware<M, I, I, B>
  ichain: <I, O, Z, A, B>(fa: Middleware<M, I, O, A>, f: (a: A) => Middleware<M, O, Z, B>) => Middleware<M, I, Z, B>
  evalMiddleware: <I, O, A>(ma: Middleware<M, I, O, A>, c: Conn<I>) => HKT<M, A>
  lift: <I, A>(fa: HKT<M, A>) => Middleware<M, I, I, A>
  gets: <I, A>(f: (c: Conn<I>) => A) => Middleware<M, I, I, A>
}

export interface MiddlewareT1<M extends URIS> {
  map: <I, A, B>(fa: Middleware1<M, I, I, A>, f: (a: A) => B) => Middleware1<M, I, I, B>
  of: <I, A>(a: A) => Middleware1<M, I, I, A>
  ap: <I, A, B>(fab: Middleware1<M, I, I, (a: A) => B>, fa: Middleware1<M, I, I, A>) => Middleware1<M, I, I, B>
  chain: <I, A, B>(fa: Middleware1<M, I, I, A>, f: (a: A) => Middleware1<M, I, I, B>) => Middleware1<M, I, I, B>
  ichain: <I, O, Z, A, B>(fa: Middleware1<M, I, O, A>, f: (a: A) => Middleware1<M, O, Z, B>) => Middleware1<M, I, Z, B>
  evalMiddleware: <I, O, A>(ma: Middleware1<M, I, O, A>, c: Conn<I>) => Type<M, A>
  lift: <I, A>(fa: Type<M, A>) => Middleware1<M, I, I, A>
  gets: <I, A>(f: (c: Conn<I>) => A) => Middleware1<M, I, I, A>
}

export interface MiddlewareT2<M extends URIS2> {
  map: <L, I, A, B>(fa: Middleware2<M, L, I, I, A>, f: (a: A) => B) => Middleware2<M, L, I, I, B>
  of: <L, I, A>(a: A) => Middleware2<M, L, I, I, A>
  ap: <L, I, A, B>(
    fab: Middleware2<M, L, I, I, (a: A) => B>,
    fa: Middleware2<M, L, I, I, A>
  ) => Middleware2<M, L, I, I, B>
  chain: <L, I, A, B>(
    fa: Middleware2<M, L, I, I, A>,
    f: (a: A) => Middleware2<M, L, I, I, B>
  ) => Middleware2<M, L, I, I, B>
  ichain: <L, I, O, Z, A, B>(
    fa: Middleware2<M, L, I, O, A>,
    f: (a: A) => Middleware2<M, L, O, Z, B>
  ) => Middleware2<M, L, I, Z, B>
  evalMiddleware: <L, I, O, A>(ma: Middleware2<M, L, I, O, A>, c: Conn<I>) => Type2<M, L, A>
  lift: <L, I, A>(fa: Type2<M, L, A>) => Middleware2<M, L, I, I, A>
  gets: <L, I, A>(f: (c: Conn<I>) => A) => Middleware2<M, L, I, I, A>
}

export function getMiddlewareT<M extends URIS2>(M: Monad2<M>): MiddlewareT2<M>
export function getMiddlewareT<M extends URIS>(M: Monad1<M>): MiddlewareT1<M>
export function getMiddlewareT<M>(M: Monad<M>): MiddlewareT<M>
export function getMiddlewareT<M>(M: Monad<M>): MiddlewareT<M> {
  function map<I, A, B>(fa: Middleware<M, I, I, A>, f: (a: A) => B): Middleware<M, I, I, B> {
    return cf => M.map(fa(cf), ([a, ct]) => tuple(f(a), ct))
  }

  function of<I, A>(a: A): Middleware<M, I, I, A> {
    return c => M.of(tuple(a, c))
  }

  function ap<I, A, B>(fab: Middleware<M, I, I, (a: A) => B>, fa: Middleware<M, I, I, A>): Middleware<M, I, I, B> {
    return c => {
      const ma = evalMiddleware(fa, c)
      const mab = evalMiddleware(fab, c)
      return M.map(M.ap(mab, ma), b => tuple(b, c))
    }
  }

  function chain<I, A, B>(fa: Middleware<M, I, I, A>, f: (a: A) => Middleware<M, I, I, B>): Middleware<M, I, I, B> {
    return ichain(fa, f)
  }

  function ichain<I, O, Z, A, B>(
    fa: Middleware<M, I, O, A>,
    f: (a: A) => Middleware<M, O, Z, B>
  ): Middleware<M, I, Z, B> {
    return ci => M.chain(fa(ci), ([a, co]) => f(a)(co))
  }

  function evalMiddleware<I, O, A>(fa: Middleware<M, I, O, A>, c: Conn<I>): HKT<M, A> {
    return M.map(fa(c), ([a]) => a)
  }

  function lift<I, A>(fa: HKT<M, A>): Middleware<M, I, I, A> {
    return c => M.map(fa, a => tuple(a, c))
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

export interface InducedMonad<M> {
  readonly URI: M
  map: <I, A, B>(fa: HKT3<M, I, I, A>, f: (a: A) => B) => HKT3<M, I, I, B>
  of: <I, A>(a: A) => HKT3<M, I, I, A>
  ap: <I, A, B>(fab: HKT3<M, I, I, (a: A) => B>, fa: HKT3<M, I, I, A>) => HKT3<M, I, I, B>
  chain: <I, A, B>(fa: HKT3<M, I, I, A>, f: (a: A) => HKT3<M, I, I, B>) => HKT3<M, I, I, B>
}

export interface InducedMonad3<M extends URIS3> {
  readonly URI: M
  map: <I, A, B>(fa: Type3<M, I, I, A>, f: (a: A) => B) => Type3<M, I, I, B>
  of: <I, A>(a: A) => Type3<M, I, I, A>
  ap: <I, A, B>(fab: Type3<M, I, I, (a: A) => B>, fa: Type3<M, I, I, A>) => Type3<M, I, I, B>
  chain: <I, A, B>(fa: Type3<M, I, I, A>, f: (a: A) => Type3<M, I, I, B>) => Type3<M, I, I, B>
}

export interface MonadMiddleware<M> extends InducedMonad<M>, IxMonad<M> {
  status: (status: Status) => HKT3<M, StatusOpen, HeadersOpen, void>
  headers: (headers: { [key: string]: string }) => HKT3<M, HeadersOpen, HeadersOpen, void>
  closeHeaders: HKT3<M, HeadersOpen, BodyOpen, void>
  send: (o: string) => HKT3<M, BodyOpen, ResponseEnded, void>
  end: HKT3<M, BodyOpen, ResponseEnded, void>
  cookie: (name: string, value: string, options: CookieOptions) => HKT3<M, HeadersOpen, HeadersOpen, void>
  clearCookie: (name: string, options: CookieOptions) => HKT3<M, HeadersOpen, HeadersOpen, void>
  gets: <I, A>(f: (c: Conn<I>) => A) => HKT3<M, I, I, A>
}

export interface MonadMiddleware3<M extends URIS3> extends InducedMonad3<M>, IxMonad3<M> {
  status: (status: Status) => Type3<M, StatusOpen, HeadersOpen, void>
  headers: (headers: { [key: string]: string }) => Type3<M, HeadersOpen, HeadersOpen, void>
  closeHeaders: Type3<M, HeadersOpen, BodyOpen, void>
  send: (o: string) => Type3<M, BodyOpen, ResponseEnded, void>
  end: Type3<M, BodyOpen, ResponseEnded, void>
  cookie: (name: string, value: string, options: CookieOptions) => Type3<M, HeadersOpen, HeadersOpen, void>
  clearCookie: (name: string, options: CookieOptions) => Type3<M, HeadersOpen, HeadersOpen, void>
  gets: <I, A>(f: (c: Conn<I>) => A) => Type3<M, I, I, A>
}

export function contentType<M extends URIS3>(
  R: MonadMiddleware3<M>
): (mediaType: MediaType) => Type3<M, HeadersOpen, HeadersOpen, void>
export function contentType<M>(R: MonadMiddleware<M>): (mediaType: MediaType) => HKT3<M, HeadersOpen, HeadersOpen, void>
export function contentType<M>(
  R: MonadMiddleware<M>
): (mediaType: MediaType) => HKT3<M, HeadersOpen, HeadersOpen, void> {
  return mediaType => R.headers({ 'Content-Type': mediaType })
}

export function json<M extends URIS3>(R: MonadMiddleware3<M>): (o: string) => Type3<M, HeadersOpen, ResponseEnded, void>
export function json<M>(R: MonadMiddleware<M>): (o: string) => HKT3<M, HeadersOpen, ResponseEnded, void>
export function json<M>(R: MonadMiddleware<M>): (o: string) => HKT3<M, HeadersOpen, ResponseEnded, void> {
  const contentType_ = contentType(R)
  return o => R.ichain(R.ichain(contentType_(MediaType.applicationJSON), () => R.closeHeaders), () => R.send(o))
}

export function redirect<M extends URIS3>(
  R: MonadMiddleware3<M>
): (uri: string) => Type3<M, StatusOpen, HeadersOpen, void>
export function redirect<M>(R: MonadMiddleware<M>): (uri: string) => HKT3<M, StatusOpen, HeadersOpen, void>
export function redirect<M>(R: MonadMiddleware<M>): (uri: string) => HKT3<M, StatusOpen, HeadersOpen, void> {
  return uri => R.ichain(R.status(Status.Found), () => R.headers({ Location: uri }))
}

export function param<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(name: string, type: Decoder<mixed, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function param<M>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function param<M>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return (name, type) => R.gets(c => Dictionary.decode(c.getParams()).chain(params => type.decode(params[name])))
}

export function params<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(type: Decoder<mixed, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function params<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function params<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return type => R.gets(c => type.decode(c.getParams()))
}

export function query<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(type: Decoder<mixed, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function query<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function query<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return type => R.gets(c => type.decode(c.getQuery()))
}

export function body<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(type: Decoder<mixed, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function body<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function body<M>(
  R: MonadMiddleware<M>
): <A>(type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return type => R.gets(c => type.decode(c.getBody()))
}

export function header<M extends URIS3>(
  R: MonadMiddleware3<M>
): <A>(name: string, type: Decoder<mixed, A>) => Type3<M, StatusOpen, StatusOpen, Validation<A>>
export function header<M>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>>
export function header<M>(
  R: MonadMiddleware<M>
): <A>(name: string, type: Decoder<mixed, A>) => HKT3<M, StatusOpen, StatusOpen, Validation<A>> {
  return (name, type) => R.gets(c => type.decode(c.getHeader(name)))
}
