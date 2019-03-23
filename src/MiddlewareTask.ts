import { Task, task, URI as TaskURI } from 'fp-ts/lib/Task'
import { Decoder, Validation } from 'io-ts'
import {
  body as body_,
  BodyOpen,
  Conn,
  contentType as contentType_,
  CookieOptions,
  getMiddlewareT,
  header as header_,
  HeadersOpen,
  json as json_,
  MediaType,
  Middleware1,
  MonadMiddleware3,
  param as param_,
  params as params_,
  query as query_,
  redirect as redirect_,
  ResponseEnded,
  Status,
  StatusOpen
} from './index'

const middlewareT = getMiddlewareT(task)

export const URI = 'MiddlewareTask'

export type URI = typeof URI

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT3<U, L, A> {
    MiddlewareTask: MiddlewareTask<U, L, A>
  }
}

export class MiddlewareTask<I, O, A> {
  constructor(readonly run: Middleware1<TaskURI, I, O, A>) {}
  eval(c: Conn<I>): Task<A> {
    return middlewareT.evalMiddleware(this.run, c)
  }
  map<I, B>(this: MiddlewareTask<I, I, A>, f: (a: A) => B): MiddlewareTask<I, I, B> {
    return new MiddlewareTask(middlewareT.map(this.run, f))
  }
  ap<I, B>(this: MiddlewareTask<I, I, A>, fab: MiddlewareTask<I, I, (a: A) => B>): MiddlewareTask<I, I, B> {
    return new MiddlewareTask(middlewareT.ap(fab.run, this.run))
  }
  chain<I, B>(this: MiddlewareTask<I, I, A>, f: (a: A) => MiddlewareTask<I, I, B>): MiddlewareTask<I, I, B> {
    return this.ichain(f)
  }
  ichain<Z, B>(f: (a: A) => MiddlewareTask<O, Z, B>): MiddlewareTask<I, Z, B> {
    return new MiddlewareTask(middlewareT.ichain(this.run, a => f(a).run))
  }
}

const of = <I, A>(a: A): MiddlewareTask<I, I, A> => {
  return new MiddlewareTask(middlewareT.of(a))
}

const map = <I, A, B>(fa: MiddlewareTask<I, I, A>, f: (a: A) => B): MiddlewareTask<I, I, B> => {
  return fa.map(f)
}

const ap = <S, A, B>(fab: MiddlewareTask<S, S, (a: A) => B>, fa: MiddlewareTask<S, S, A>): MiddlewareTask<S, S, B> => {
  return fa.ap(fab)
}

const chain = <S, A, B>(fa: MiddlewareTask<S, S, A>, f: (a: A) => MiddlewareTask<S, S, B>): MiddlewareTask<S, S, B> => {
  return fa.chain(f)
}

const ichain = <I, O, Z, A, B>(
  fa: MiddlewareTask<I, O, A>,
  f: (a: A) => MiddlewareTask<O, Z, B>
): MiddlewareTask<I, Z, B> => {
  return fa.ichain(f)
}

export const lift = <I, A>(fa: Task<A>): MiddlewareTask<I, I, A> => {
  return new MiddlewareTask(middlewareT.lift(fa))
}

const gets = <I, A>(f: (c: Conn<I>) => A): MiddlewareTask<I, I, A> => {
  return new MiddlewareTask(middlewareT.gets(f))
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

const status = (status: Status): ResponseStateTransition<StatusOpen, HeadersOpen> =>
  transition(c => c.setStatus(status))

const headers = (headers: { [key: string]: string }): ResponseStateTransition<HeadersOpen, HeadersOpen> =>
  transition(c => {
    for (const field in headers) {
      if (headers.hasOwnProperty(field)) {
        c.setHeader(field, headers[field])
      }
    }
  })

export const unsafeResponseStateTransition: ResponseStateTransition<any, any> = new MiddlewareTask(c =>
  task.of([undefined, c] as any)
)

const closeHeaders: ResponseStateTransition<HeadersOpen, BodyOpen> = unsafeResponseStateTransition

const send = (o: string): ResponseStateTransition<BodyOpen, ResponseEnded> => transition(c => c.setBody(o))

const end: ResponseStateTransition<BodyOpen, ResponseEnded> = transition(c => c.endResponse())

const cookie = (
  name: string,
  value: string,
  options: CookieOptions
): ResponseStateTransition<HeadersOpen, HeadersOpen> => transition(c => c.setCookie(name, value, options))

const clearCookie = (name: string, options: CookieOptions): ResponseStateTransition<HeadersOpen, HeadersOpen> =>
  transition(c => c.clearCookie(name, options))

export const middleware: MonadMiddleware3<URI> = {
  URI,
  map,
  of,
  ap,
  chain,
  iof: of,
  ichain,
  status,
  headers,
  closeHeaders,
  send,
  end,
  cookie,
  clearCookie,
  gets
}

export const contentType: (mediaType: MediaType) => ResponseStateTransition<HeadersOpen, HeadersOpen> = contentType_(
  middleware
)

export const json: (o: string) => ResponseStateTransition<HeadersOpen, ResponseEnded> = json_(middleware)

export const redirect: (uri: string) => ResponseStateTransition<StatusOpen, HeadersOpen> = redirect_(middleware)

export const param: <A>(
  name: string,
  type: Decoder<unknown, A>
) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = param_(middleware)

export const params: <A>(type: Decoder<unknown, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = params_(
  middleware
)

export const query: <A>(type: Decoder<unknown, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = query_(
  middleware
)

export const body: <A>(type: Decoder<unknown, A>) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = body_(
  middleware
)

export const header: <A>(
  name: string,
  type: Decoder<unknown, A>
) => MiddlewareTask<StatusOpen, StatusOpen, Validation<A>> = header_(middleware)
