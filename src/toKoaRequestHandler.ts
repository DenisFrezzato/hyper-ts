import { identity } from 'fp-ts/lib/function'
import { Task } from 'fp-ts/lib/Task'
import * as Koa from 'koa'
import { Middleware, ResponseEnded, StatusOpen } from '.'
import { KoaConn } from './KoaConn'

export function toKoaRequestHandler(f: (c: KoaConn<StatusOpen>) => Task<void>): Koa.Middleware {
  return ctx => f(new KoaConn<StatusOpen>(ctx)).run()
}

export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): Koa.Middleware {
  return toKoaRequestHandler(c => middleware.eval(c).fold(() => undefined, identity))
}
