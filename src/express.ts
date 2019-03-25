import * as express from 'express'
import { identity } from 'fp-ts/lib/function'
import { Task } from 'fp-ts/lib/Task'
import { Conn, CookieOptions, Middleware, ResponseEnded, Status, StatusOpen } from '.'

export class ExpressConn<S> implements Conn<S> {
  readonly _S!: S
  constructor(readonly req: express.Request, readonly res: express.Response) {}
  clearCookie(name: string, options: CookieOptions) {
    this.res.clearCookie(name, options)
  }
  endResponse() {
    return this.res.end()
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
  setBody(body: unknown) {
    this.res.send(body)
  }
  setCookie(name: string, value: string, options: CookieOptions) {
    this.res.cookie(name, value, options)
  }
  setHeader(name: string, value: string) {
    this.res.setHeader(name, value)
  }
  setStatus(status: Status) {
    this.res.status(status)
  }
  getOriginalUrl() {
    return this.req.originalUrl
  }
}

export function toRequestHandler(f: (c: ExpressConn<StatusOpen>) => Task<void>): express.RequestHandler {
  return (req, res) => f(new ExpressConn<StatusOpen>(req, res)).run()
}

export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): express.RequestHandler {
  return toRequestHandler(c => middleware.eval(c).fold(() => undefined, identity))
}
