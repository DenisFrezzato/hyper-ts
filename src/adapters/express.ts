import * as express from 'express'
import { Body, CookieOptions, Conn, Status, StatusOpen, ResponseEnded } from '..'
import { MiddlewareTask } from '../MiddlewareTask'

export class ExpressConn<S> implements Conn<S> {
  public readonly '-S': S

  constructor(readonly req: express.Request, readonly res: express.Response) {}

  public endResponse() {
    return this.res.end()
  }

  public getBody() {
    return this.req.body
  }

  public getHeader(name: string) {
    return this.req.header(name)
  }

  public getParams() {
    return this.req.params
  }

  public getQuery() {
    return this.req.query
  }

  public setBody(body: Body) {
    this.res.send(body)
  }

  public setCookie(name: string, value: string | undefined, options: CookieOptions) {
    this.res.cookie(name, value, options)
  }

  public setHeader(name: string, value: string) {
    this.res.setHeader(name, value)
  }

  public setStatus(status: Status) {
    this.res.status(status)
  }
}

export const toRequestHandler = (task: MiddlewareTask<StatusOpen, ResponseEnded, void>): express.RequestHandler => (
  req,
  res,
  next
) => task.toRequestHandler(new ExpressConn(req, res))()
