import * as express from 'express'
import { identity, tuple } from 'fp-ts/lib/function'
import { Task } from 'fp-ts/lib/Task'
import { Connection, CookieOptions, Middleware, ResponseEnded, Status, StatusOpen } from '.'
import { IO, io } from 'fp-ts/lib/IO'
import { tryCatch } from 'fp-ts/lib/TaskEither'

export class ExpressConnection<S> implements Connection<S> {
  readonly _S!: S
  constructor(
    readonly req: express.Request,
    readonly res: express.Response,
    readonly next: express.NextFunction,
    readonly action: IO<unknown> = io.of(undefined)
  ) {}
  chain<T>(thunk: () => void): ExpressConnection<T> {
    return new ExpressConnection<T>(this.req, this.res, this.next, this.action.chain(() => new IO(thunk)))
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
  getOriginalUrl() {
    return this.req.originalUrl
  }
  getMethod() {
    return this.req.method
  }
  setCookie<T>(name: string, value: string, options: CookieOptions) {
    return this.chain<T>(() => this.res.cookie(name, value, options))
  }
  clearCookie<T>(name: string, options: CookieOptions) {
    return this.chain<T>(() => this.res.clearCookie(name, options))
  }
  setHeader<T>(name: string, value: string) {
    return this.chain<T>(() => this.res.setHeader(name, value))
  }
  setStatus<T>(status: Status) {
    return this.chain<T>(() => this.res.status(status))
  }
  setBody<T>(body: unknown) {
    this.action.run()
    this.res.send(body)
    return new ExpressConnection<T>(this.req, this.res, this.next)
  }
  endResponse<T>() {
    this.action.run()
    this.res.end()
    return new ExpressConnection<T>(this.req, this.res, this.next)
  }
}

export function toRequestHandler(f: (c: ExpressConnection<StatusOpen>) => Task<void>): express.RequestHandler {
  return (req, res, next) => f(new ExpressConnection<StatusOpen>(req, res, next)).run()
}

export function fromMiddleware(middleware: Middleware<StatusOpen, ResponseEnded, never, void>): express.RequestHandler {
  return toRequestHandler(c => middleware.eval(c).fold(() => undefined, identity))
}

export function toMiddleware<L>(
  f: express.RequestHandler,
  onError: (err: unknown) => L
): Middleware<StatusOpen, StatusOpen, L, void> {
  return new Middleware(c =>
    tryCatch(
      () =>
        new Promise(resolve => {
          const ec: ExpressConnection<StatusOpen> = c as any
          f(ec.req, ec.res, err => {
            ec.next(err)
            resolve(tuple(undefined, c))
          })
        }),
      onError
    )
  )
}
