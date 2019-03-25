import { identity } from 'fp-ts/lib/function'
import { Task } from 'fp-ts/lib/Task'
import * as koa from 'koa'
import { Conn, CookieOptions, Middleware, ResponseEnded, Status, StatusOpen } from '.'
import { IO, io } from 'fp-ts/lib/IO'

export class KoaConn<S> implements Conn<S> {
  readonly _S!: S
  constructor(readonly context: koa.Context, readonly action: IO<unknown> = io.of(undefined)) {}
  chain<T>(thunk: () => void): KoaConn<T> {
    return new KoaConn<T>(this.context, this.action.chain(() => new IO(thunk)))
  }
  getBody() {
    return this.context.request.body
  }
  getHeader(name: string) {
    return this.context.get(name)
  }
  getParams() {
    return this.context.params
  }
  getQuery() {
    return this.context.query
  }
  getOriginalUrl() {
    return this.context.originalUrl
  }
  getMethod() {
    return this.context.method
  }
  setCookie<T>(name: string, value: string, options: CookieOptions) {
    return this.chain<T>(() => this.context.cookies.set(name, value, options))
  }
  clearCookie<T>(name: string, options: CookieOptions) {
    return this.chain<T>(() => this.context.cookies.set(name, undefined, options))
  }
  setHeader<T>(name: string, value: string) {
    return this.chain<T>(() => this.context.set(name, value))
  }
  setStatus<T>(status: Status) {
    return this.chain<T>(() => (this.context.status = status))
  }
  setBody<T>(body: unknown) {
    this.action.run()
    this.context.body = body
    return new KoaConn<T>(this.context)
  }
  endResponse<T>() {
    this.action.run()
    this.context.response.res.end()
    return new KoaConn<T>(this.context)
  }
}

export function toRequestHandler(f: (c: KoaConn<StatusOpen>) => Task<void>): koa.Middleware {
  return ctx => f(new KoaConn<StatusOpen>(ctx)).run()
}

export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): koa.Middleware {
  return toRequestHandler(c => middleware.eval(c).fold(() => undefined, identity))
}
