import * as express from 'express'
import { left, right } from 'fp-ts/lib/Either'
import { tuple } from 'fp-ts/lib/function'
import { IO, io } from 'fp-ts/lib/IO'
import { Task } from 'fp-ts/lib/Task'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { Connection, CookieOptions, Middleware, ResponseEnded, Status, StatusOpen } from '.'

export class ExpressConnection<S> implements Connection<S> {
  readonly _S!: S
  constructor(
    readonly req: express.Request,
    readonly res: express.Response,
    readonly action: IO<void> = io.of(undefined)
  ) {}
  chain<T>(thunk: () => void): ExpressConnection<T> {
    return new ExpressConnection<T>(this.req, this.res, this.action.chain(() => new IO(thunk)))
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
    return new ExpressConnection<T>(this.req, this.res)
  }
  endResponse<T>() {
    this.action.run()
    this.res.end()
    return new ExpressConnection<T>(this.req, this.res)
  }
}

export function fromMiddleware<L>(middleware: Middleware<StatusOpen, ResponseEnded, L, void>): express.RequestHandler {
  return (req, res, next) =>
    middleware
      .eval(new ExpressConnection<StatusOpen>(req, res))
      .run()
      .then(e => {
        if (e.isLeft()) {
          next(e.value)
        }
      })
}

export function toMiddleware<L>(
  f: express.RequestHandler,
  onError: (err: unknown) => L
): Middleware<StatusOpen, StatusOpen, L, void> {
  return new Middleware(
    c =>
      new TaskEither(
        new Task(
          () =>
            new Promise(resolve => {
              const ec: ExpressConnection<StatusOpen> = c as any
              f(ec.req, ec.res, err => {
                if (err !== undefined) {
                  resolve(left(onError(err)))
                } else {
                  resolve(right(tuple(undefined, c)))
                }
              })
            })
        )
      )
  )
}
