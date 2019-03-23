import { Conn, Status, CookieOptions } from '.'
import * as koa from 'koa'

export class KoaConn<S> implements Conn<S> {
  readonly _S!: S
  constructor(readonly context: koa.Context) {}
  clearCookie(name: string, options: CookieOptions) {
    this.context.cookies.set(name, undefined, options)
  }
  endResponse() {
    return this.context.response.res.end()
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
  setBody(body: unknown) {
    this.context.body = body
  }
  setCookie(name: string, value: string, options: CookieOptions) {
    this.context.cookies.set(name, value, options)
  }
  setHeader(name: string, value: string) {
    this.context.set(name, value)
  }
  setStatus(status: Status) {
    this.context.status = status
  }
}
