import { Request, Response, RequestHandler } from 'express'
import { left, right } from 'fp-ts/lib/Either'
import { tuple } from 'fp-ts/lib/function'
import { IO, io } from 'fp-ts/lib/IO'
import { Task } from 'fp-ts/lib/Task'
import { TaskEither } from 'fp-ts/lib/TaskEither'
import { IncomingMessage } from 'http'
import { Connection, CookieOptions, Middleware, ResponseEnded, Status, StatusOpen } from '.'

export class ExpressConnection<S> implements Connection<S> {
  readonly _S!: S
  constructor(readonly req: Request, readonly res: Response, readonly action: IO<void> = io.of(undefined)) {}
  chain<T>(thunk: () => void): ExpressConnection<T> {
    return new ExpressConnection<T>(this.req, this.res, this.action.chain(() => new IO(thunk)))
  }
  getRequest(): IncomingMessage {
    return this.req
  }
  getBody(): unknown {
    return this.req.body
  }
  getHeader(name: string): unknown {
    return this.req.header(name)
  }
  getParams(): unknown {
    return this.req.params
  }
  getQuery(): unknown {
    return this.req.query
  }
  getOriginalUrl(): string {
    return this.req.originalUrl
  }
  getMethod(): string {
    return this.req.method
  }
  setCookie<T>(name: string, value: string, options: CookieOptions): Connection<T> {
    return this.chain<T>(() => this.res.cookie(name, value, options))
  }
  clearCookie<T>(name: string, options: CookieOptions): Connection<T> {
    return this.chain<T>(() => this.res.clearCookie(name, options))
  }
  setHeader<T>(name: string, value: string): Connection<T> {
    return this.chain<T>(() => this.res.setHeader(name, value))
  }
  setStatus<T>(status: Status): Connection<T> {
    return this.chain<T>(() => this.res.status(status))
  }
  setBody<T>(body: unknown): Connection<T> {
    return this.chain<T>(() => this.res.send(body))
  }
  endResponse<T>(): Connection<T> {
    return this.chain<T>(() => this.res.end())
  }
}

export function fromMiddleware<L>(middleware: Middleware<StatusOpen, ResponseEnded, L, void>): RequestHandler {
  return (req, res, next) =>
    middleware
      .run(new ExpressConnection<StatusOpen>(req, res))
      .run()
      .then(e => e.fold(next, ([, c]) => (c as ExpressConnection<ResponseEnded>).action.run()))
}

export function toMiddleware<L, A>(
  requestHandler: RequestHandler,
  onFailure: (err: unknown, req: Request) => L,
  onSuccess: (req: Request) => A
): Middleware<StatusOpen, StatusOpen, L, A> {
  return new Middleware(
    c =>
      new TaskEither(
        new Task(
          () =>
            new Promise(resolve => {
              const ec: ExpressConnection<StatusOpen> = c as any
              requestHandler(ec.req, ec.res, err => {
                if (err !== undefined) {
                  resolve(left(onFailure(err, ec.req)))
                } else {
                  resolve(right(tuple(onSuccess(ec.req), c)))
                }
              })
            })
        )
      )
  )
}
