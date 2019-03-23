import * as Koa from 'koa'
import { StatusOpen, ResponseEnded } from '.'
import { MiddlewareTask } from './MiddlewareTask'
import { KoaConn } from './KoaConn'

export function toKoaRequestHandler(task: MiddlewareTask<StatusOpen, ResponseEnded, void>): Koa.Middleware {
  return ctx => task.eval(new KoaConn<StatusOpen>(ctx)).run()
}
