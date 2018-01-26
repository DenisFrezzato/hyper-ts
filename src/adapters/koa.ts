import { Conn, Status, CookieOptions } from '..'
import * as koa from 'koa'
import { mixed } from 'io-ts'

export class KoaConn<S> implements Conn<S> {
  public readonly '-S': S

  constructor(readonly context: koa.Context) {}

  public clearCookie(name: string, options: CookieOptions) {
    this.context.cookies.set(name, undefined, options)
  }

  public endResponse() {
    return this.context.response.res.end()
  }

  public getBody() {
    return this.context.request.body
  }

  public getHeader(name: string) {
    return this.context.get(name)
  }

  public getParams() {
    return this.context.params
  }

  public getQuery() {
    return this.context.query
  }

  public setBody(body: mixed) {
    this.context.body = body
  }

  public setCookie(name: string, value: string, options: CookieOptions) {
    this.context.cookies.set(name, value, options)
  }

  public setHeader(name: string, value: string) {
    this.context.set(name, value)
  }

  public setStatus(status: Status) {
    this.context.status = status
  }
}
