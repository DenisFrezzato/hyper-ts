import { Conn, Status, CookieOptions, ResponseEnded, StatusOpen } from '..'
import * as koa from 'koa'
import * as Router from 'koa-router'
import { MiddlewareTask } from '../MiddlewareTask'

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

export const toRequestHandler = (task: MiddlewareTask<StatusOpen, ResponseEnded, void>): Router.IMiddleware => (
  ctx,
  next
) => task.toRequestHandler(new KoaConn(ctx))()
