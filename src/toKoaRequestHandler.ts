import * as Koa from 'koa'
import { StatusOpen, ResponseEnded } from '.'
import { MiddlewareTask } from './MiddlewareTask'
import { KoaConn } from './KoaConn'

export const toKoaRequestHandler = (task: MiddlewareTask<StatusOpen, ResponseEnded, void>): Koa.Middleware => ctx =>
  task.eval(new KoaConn(ctx)).run()
