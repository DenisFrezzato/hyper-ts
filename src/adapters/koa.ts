import { Conn, Status, CookieOptions } from '..'
import * as koa from 'koa'

export class KoaConn<S> implements Conn<S> {
  public readonly '-S': S

  constructor(readonly context: koa.Context) {}

  public endResponse() {
    return this.context.response.res.end()
  }

  public getBody() {
    return this.context.body
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

  public setBody(body: any) {
    this.context.body = body
  }

  public setCookie(name: string, value: string | undefined, options: CookieOptions) {
    this.context.cookies.set(name, value, options)
  }

  public setHeader(name: string, value: string) {
    this.context.set(name, value)
  }

  public setStatus(status: Status) {
    this.context.status = status
  }
}
