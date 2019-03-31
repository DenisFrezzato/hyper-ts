import { Request, Response, RequestHandler } from 'express'
import { IO, io } from 'fp-ts/lib/IO'
import { Task } from 'fp-ts/lib/Task'
import { right } from 'fp-ts/lib/TaskEither'
import { IncomingMessage } from 'http'
import { Connection, CookieOptions, Middleware, Status } from '.'

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

export function fromMiddleware<I, O, L>(middleware: Middleware<I, O, L, void>): RequestHandler {
  return (req, res, next) =>
    middleware
      .exec(new ExpressConnection<I>(req, res))
      .run()
      .then(e =>
        e.fold(next, c => {
          const ec = c as ExpressConnection<O>
          ec.action.run()
          next()
        })
      )
}

export function toMiddleware<I, A>(requestHandler: RequestHandler, f: (req: Request) => A): Middleware<I, I, never, A> {
  return new Middleware(c =>
    right(
      new Task(
        () =>
          new Promise(resolve => {
            const { req, res } = c as ExpressConnection<I>
            requestHandler(req, res, () => resolve([f(req), c]))
          })
      )
    )
  )
}
