import {
  getMiddlewareT,
  Conn,
  Status,
  StatusOpen,
  HeadersOpen,
  BodyOpen,
  ResponseEnded,
  MediaType,
  Header,
  MonadMiddleware,
  headers as headers_,
  contentType as contentType_,
  json as json_,
  redirect as redirect_,
  param as param_,
  params as params_,
  query as query_,
  body as body_,
  get as get_
} from './index'
import { Task } from 'fp-ts/lib/Task'
import * as task from 'fp-ts/lib/Task'
import * as express from 'express'
import { Foldable } from 'fp-ts/lib/Foldable'
import { HKT } from 'fp-ts/lib/HKT'
import { Decoder, Validation } from 'io-ts'

const t = getMiddlewareT(task)

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT3<U, L, A> {
    MiddlewareTask: MiddlewareTask<U, L, A>
  }
}

export const URI = 'MiddlewareTask'

export type URI = typeof URI

export class MiddlewareTask<I, O, A> {
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
    return t.evalMiddleware(this.run, c)
  }
  map<I, B>(this: MiddlewareTask<I, I, A>, f: (a: A) => B): MiddlewareTask<I, I, B> {
    return new MiddlewareTask(t.map(f, this.run))
  }
  ap<I, B>(this: MiddlewareTask<I, I, A>, fab: MiddlewareTask<I, I, (a: A) => B>): MiddlewareTask<I, I, B> {
    return new MiddlewareTask(t.ap(fab.run, this.run))
  }
  chain<I, B>(this: MiddlewareTask<I, I, A>, f: (a: A) => MiddlewareTask<I, I, B>): MiddlewareTask<I, I, B> {
    return this.ichain(f)
  }
  ichain<Z, B>(f: (a: A) => MiddlewareTask<O, Z, B>): MiddlewareTask<I, Z, B> {
    return new MiddlewareTask(t.ichain(a => f(a).run, this.run))
  }
  toRequestHandler(this: Handler): express.RequestHandler {
    return (req, res) => this.eval(new Conn(req, res)).run()
  }
}

export const of = <I, A>(a: A): MiddlewareTask<I, I, A> => {
  return new MiddlewareTask(t.of(a))
}

export const map = <I, A, B>(f: (a: A) => B, fa: MiddlewareTask<I, I, A>): MiddlewareTask<I, I, B> => {
  return fa.map(f)
}

export const ap = <S, A, B>(
  fab: MiddlewareTask<S, S, (a: A) => B>,
  fa: MiddlewareTask<S, S, A>
): MiddlewareTask<S, S, B> => {
  return fa.ap(fab)
}

export const chain = <S, A, B>(
  f: (a: A) => MiddlewareTask<S, S, B>,
  fa: MiddlewareTask<S, S, A>
): MiddlewareTask<S, S, B> => {
  return fa.chain(f)
}

export const ichain = <I, O, Z, A, B>(
  f: (a: A) => MiddlewareTask<O, Z, B>,
  fa: MiddlewareTask<I, O, A>
): MiddlewareTask<I, Z, B> => {
  return fa.ichain(f)
}

export const lift = <I, A>(fa: Task<A>): MiddlewareTask<I, I, A> => {
  return new MiddlewareTask(t.lift(fa))
}

export const gets = <I, A>(f: (c: Conn<I>) => A): MiddlewareTask<I, I, A> => {
  return new MiddlewareTask(t.gets(f))
}

/** A middleware transitioning from one `Response` state to another */
export interface ResponseStateTransition<I, O> extends MiddlewareTask<I, O, void> {}

/** A middleware representing a complete `Request` / `Response` handling */
export interface Handler extends ResponseStateTransition<StatusOpen, ResponseEnded> {}

const transition = <I, O>(f: (c: Conn<I>) => void): ResponseStateTransition<I, O> =>
  new MiddlewareTask(
    c =>
      new Task(() => {
        f(c)
        return Promise.resolve([undefined, c] as any)
      })
  )

export const status = (status: Status): ResponseStateTransition<StatusOpen, HeadersOpen> =>
  transition(c => c.res.status(status))

export const header = ([field, value]: Header): ResponseStateTransition<HeadersOpen, HeadersOpen> =>
  transition(c => c.res.header(field, value))

export const unsafeResponseStateTransition: ResponseStateTransition<any, any> = new MiddlewareTask(c =>
  task.of([undefined, c] as any)
)

export const closeHeaders: ResponseStateTransition<HeadersOpen, BodyOpen> = unsafeResponseStateTransition

export const send = (o: string): ResponseStateTransition<BodyOpen, ResponseEnded> => transition(c => c.res.send(o))

export const end: ResponseStateTransition<BodyOpen, ResponseEnded> = transition(c => c.res.end())

export const cookie = (
  name: string,
  value: string,
  options: express.CookieOptions
): ResponseStateTransition<HeadersOpen, HeadersOpen> => transition(c => c.res.cookie(name, value, options))

export const clearCookie = (
  name: string,
  options: express.CookieOptions
): ResponseStateTransition<HeadersOpen, HeadersOpen> => transition(c => c.res.clearCookie(name, options))

/** @instance */
export const monadMiddlewareTask: MonadMiddleware<URI> = {
  URI,
  map,
  of,
  ap,
  chain,
  iof: of,
  ichain,
  status,
  header,
  closeHeaders,
  send,
  end,
  cookie,
  clearCookie,
  gets
}

export const headers: <F>(
  F: Foldable<F>
) => (headers: HKT<F, Header>) => ResponseStateTransition<HeadersOpen, BodyOpen> = headers_(monadMiddlewareTask)

export const contentType: (mediaType: MediaType) => ResponseStateTransition<HeadersOpen, HeadersOpen> = contentType_(
  monadMiddlewareTask
)

export const json: (o: string) => ResponseStateTransition<HeadersOpen, ResponseEnded> = json_(monadMiddlewareTask)

export const redirect: (uri: string) => ResponseStateTransition<StatusOpen, HeadersOpen> = redirect_(
  monadMiddlewareTask
)

export const param: <A>(
  name: string,
  type: Decoder<any, A>
) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = param_(monadMiddlewareTask)

export const params: <A>(type: Decoder<any, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = params_(
  monadMiddlewareTask
)

export const query: <A>(type: Decoder<any, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = query_(
  monadMiddlewareTask
)

export const body: <A>(type: Decoder<any, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = body_(
  monadMiddlewareTask
)

export const get: <A>(
  name: string,
  type: Decoder<any, A>
) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = get_(monadMiddlewareTask)
