import * as express from 'express'
import { identity } from 'fp-ts/lib/function'
import { Task } from 'fp-ts/lib/Task'
import { Middleware, ResponseEnded, StatusOpen } from '.'
import { ExpressConn } from './ExpressConn'

export function toExpressRequestHandler(f: (c: ExpressConn<StatusOpen>) => Task<void>): express.RequestHandler {
  return (req, res) => f(new ExpressConn<StatusOpen>(req, res)).run()
}

export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): express.RequestHandler {
  return toExpressRequestHandler(c => middleware.eval(c).fold(() => undefined, identity))
}
