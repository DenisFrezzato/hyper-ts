import * as express from 'express'
import { CookieOptions, Conn, Status } from '.'

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
}
