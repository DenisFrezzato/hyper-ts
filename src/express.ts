import * as express from 'express'
import { identity } from 'fp-ts/lib/function'
import { Task } from 'fp-ts/lib/Task'
import { Conn, CookieOptions, Middleware, ResponseEnded, Status, StatusOpen } from '.'
import { IO, io } from 'fp-ts/lib/IO'

export class ExpressConn<S> implements Conn<S> {
  readonly _S!: S
  constructor(
    readonly req: express.Request,
    readonly res: express.Response,
    readonly action: IO<unknown> = io.of(undefined)
  ) {}
  chain<T>(thunk: () => void): ExpressConn<T> {
    return new ExpressConn<T>(this.req, this.res, this.action.chain(() => new IO(thunk)))
  }
  getBody() {
    return this.req.body
  }
  getHeader(name: string) {
    return this.req.header(name)
  }
  getParams() {
    return this.req.params
  }
  getQuery() {
    return this.req.query
  }
  getOriginalUrl() {
    return this.req.originalUrl
  }
  getMethod() {
    return this.req.method
  }
  setCookie<T>(name: string, value: string, options: CookieOptions) {
    return this.chain<T>(() => this.res.cookie(name, value, options))
  }
  clearCookie<T>(name: string, options: CookieOptions) {
    return this.chain<T>(() => this.res.clearCookie(name, options))
  }
  setHeader<T>(name: string, value: string) {
    return this.chain<T>(() => this.res.setHeader(name, value))
  }
  setStatus<T>(status: Status) {
    return this.chain<T>(() => this.res.status(status))
  }
  setBody<T>(body: unknown) {
    this.action.run()
    this.res.send(body)
    return new ExpressConn<T>(this.req, this.res)
  }
  endResponse<T>() {
    this.action.run()
    this.res.end()
    return new ExpressConn<T>(this.req, this.res)
  }
}

export function toRequestHandler(f: (c: ExpressConn<StatusOpen>) => Task<void>): express.RequestHandler {
  return (req, res) => f(new ExpressConn<StatusOpen>(req, res)).run()
}

export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): express.RequestHandler {
  return toRequestHandler(c => middleware.eval(c).fold(() => undefined, identity))
}
