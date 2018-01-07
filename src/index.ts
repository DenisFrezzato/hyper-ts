import * as express from 'express'
import * as task from 'fp-ts/lib/Task'
import { Monad } from 'fp-ts/lib/Monad'
import { IxMonad } from 'fp-ts/lib/IxMonad'
import { Foldable, traverse_ } from 'fp-ts/lib/Foldable'
import { HKT } from 'fp-ts/lib/HKT'
import { tuple } from 'fp-ts/lib/function'
import { Task } from 'fp-ts/lib/Task'

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

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT3<U, L, A> {
    Middleware: Middleware<U, L, A>
  }
}

export const URI = 'Middleware'

export type URI = typeof URI

/**
 * A middleware is an indexed monadic action transforming one `Conn` to another `Conn`.
 * It operates in some base monad `Task`, and is indexed by `I` and `O`,
 * the input and output `Conn` types of the middleware action.
 *
 * The input and output type parameters are used to ensure that a Conn is transformed,
 * and that side-effects are performed, correctly, throughout the middleware chain.
 *
 * Middleware are composed using `ichain`, the indexed monadic version of `chain`.
 */
export class Middleware<I, O, A> {
  // prettier-ignore
  readonly '_A': A
  // prettier-ignore
  readonly '_L': O
  // prettier-ignore
  readonly '_U': I
  // prettier-ignore
  readonly '_URI': URI
  constructor(readonly run: (c: Conn<I>) => Task<[A, Conn<O>]>) {}
  eval(c: Conn<I>): Task<A> {
    return this.run(c).map(([a]) => a)
  }
  map<B>(f: (a: A) => B): Middleware<I, O, B> {
    return new Middleware(cf => this.run(cf).map(([a, ct]) => tuple(f(a), ct)))
  }
  ap<S, B>(this: Middleware<S, S, A>, fab: Middleware<S, S, (a: A) => B>): Middleware<S, S, B> {
    return new Middleware(c => {
      // parallel execution
      const ta = this.eval(c)
      const tab = fab.eval(c)
      return ta.ap(tab).map(b => tuple(b, c))
    })
  }
  chain<S, B>(this: Middleware<S, S, A>, f: (a: A) => Middleware<S, S, B>): Middleware<S, S, B> {
    return this.ichain(f)
  }
  ichain<Z, B>(f: (a: A) => Middleware<O, Z, B>): Middleware<I, Z, B> {
    return new Middleware(cf => this.run(cf).chain(([a, ct]) => f(a).run(ct)))
  }
  toRequestHandler(this: Handler): express.RequestHandler {
    return (req, res) => this.eval(new Conn(req, res)).run()
  }
}

export const of = <S, A>(a: A): Middleware<S, S, A> => {
  return new Middleware(c => task.of(tuple(a, c)))
}

export const map = <I, O, A, B>(f: (a: A) => B, fa: Middleware<I, O, A>): Middleware<I, O, B> => {
  return fa.map(f)
}

export const ap = <S, A, B>(fab: Middleware<S, S, (a: A) => B>, fa: Middleware<S, S, A>): Middleware<S, S, B> => {
  return fa.ap(fab)
}

export const chain = <S, A, B>(f: (a: A) => Middleware<S, S, B>, fa: Middleware<S, S, A>): Middleware<S, S, B> => {
  return fa.chain(f)
}

export const ichain = <I, O, Z, A, B>(
  f: (a: A) => Middleware<O, Z, B>,
  fa: Middleware<I, O, A>
): Middleware<I, Z, B> => {
  return fa.ichain(f)
}

export const modify = <I, O>(f: (c: Conn<I>) => Conn<O>): Middleware<I, O, void> => {
  return new Middleware(c => task.of(tuple(undefined, f(c))))
}

export const gets = <I, A>(f: (c: Conn<I>) => A): Middleware<I, I, A> => {
  return new Middleware(c => task.of(tuple(f(c), c)))
}

export const fromTask = <I, A>(task: Task<A>): Middleware<I, I, A> => {
  return new Middleware(c => task.map(a => tuple(a, c)))
}

/** @instance */
export const middleware: Monad<URI> & IxMonad<URI> = {
  URI,
  map,
  of,
  ap,
  chain,
  iof: of,
  ichain
}

/** Type indicating that the status-line is ready to be sent */
export type StatusOpen = 'StatusOpen'

/** Type indicating that headers are ready to be sent, i.e. the body streaming has not been started */
export type HeadersOpen = 'HeadersOpen'

/** Type indicating that headers have already been sent, and that the body is currently streaming */
export type BodyOpen = 'BodyOpen'

/** Type indicating that headers have already been sent, and that the body stream, and thus the response, is finished. */
export type ResponseEnded = 'ResponseEnded'

/** A middleware transitioning from one `Response` state to another */
export interface ResponseStateTransition<I, O> extends Middleware<I, O, void> {}

/** A middleware representing a complete `Request` / `Response` handling */
export interface Handler extends ResponseStateTransition<StatusOpen, ResponseEnded> {}

const unsafeCoerce = <A, B>(a: A): B => a as any

const unsafeCoerceConn = <I, O>(c: Conn<I>): Promise<[void, Conn<O>]> =>
  Promise.resolve(tuple(undefined, unsafeCoerce(c)))

export const writeStatus = (status: Status): ResponseStateTransition<StatusOpen, HeadersOpen> =>
  new Middleware(
    c =>
      new Task(() => {
        c.res.status(status)
        return unsafeCoerceConn(c)
      })
  )

export type Header = [string, string]

export const writeHeader = ([field, value]: Header): ResponseStateTransition<HeadersOpen, HeadersOpen> =>
  new Middleware(
    c =>
      new Task(() => {
        c.res.header(field, value)
        return unsafeCoerceConn(c)
      })
  )

export const closeHeaders: ResponseStateTransition<HeadersOpen, BodyOpen> = modify(unsafeCoerce)

export const send = (o: string): ResponseStateTransition<BodyOpen, ResponseEnded> =>
  new Middleware(
    c =>
      new Task(() => {
        c.res.send(o)
        return unsafeCoerceConn(c)
      })
  )

export const json = (o: string): ResponseStateTransition<HeadersOpen, ResponseEnded> =>
  contentType(MediaType.applicationJSON)
    .ichain(() => closeHeaders)
    .ichain(() => send(o))

export const end: ResponseStateTransition<BodyOpen, ResponseEnded> = new Middleware(
  c =>
    new Task(() => {
      c.res.end()
      return unsafeCoerceConn(c)
    })
)

export const headers = <F>(F: Foldable<F>) => (
  headers: HKT<F, Header>
): ResponseStateTransition<HeadersOpen, BodyOpen> =>
  traverse_(middleware, F)(writeHeader, headers).ichain(() => closeHeaders)

export const contentType = (mediaType: MediaType): ResponseStateTransition<HeadersOpen, HeadersOpen> =>
  writeHeader(['Content-Type', mediaType])

export const redirect = (uri: string): ResponseStateTransition<StatusOpen, HeadersOpen> =>
  writeStatus(Status.Found).ichain(() => writeHeader(['Location', uri]))
