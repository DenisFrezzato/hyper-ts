import { Request, RequestHandler, ErrorRequestHandler, Response, NextFunction } from 'express'
import { Task } from 'fp-ts/lib/Task'
import { right } from 'fp-ts/lib/TaskEither'
import { IncomingMessage } from 'http'
import { Connection, CookieOptions, HeadersOpen, Middleware, ResponseEnded, Status } from '.'

export type LinkedList<A> =
  | { type: 'Nil'; length: number }
  | { type: 'Cons'; head: A; tail: LinkedList<A>; length: number }

export const nil: LinkedList<never> = { type: 'Nil', length: 0 }

export const cons = <A>(head: A, tail: LinkedList<A>): LinkedList<A> => ({
  type: 'Cons',
  head,
  tail,
  length: tail.length + 1
})

export const toArray = <A>(list: LinkedList<A>): Array<A> => {
  const len = list.length
  const r: Array<A> = new Array(len)
  let l: LinkedList<A> = list
  let i = 1
  while (l.type !== 'Nil') {
    r[len - i] = l.head
    i++
    l = l.tail
  }
  return r
}

export type Action =
  | { type: 'setBody'; body: unknown }
  | { type: 'endResponse' }
  | { type: 'setStatus'; status: Status }
  | { type: 'setHeader'; name: string; value: string }
  | { type: 'clearCookie'; name: string; options: CookieOptions }
  | { type: 'setCookie'; name: string; value: string; options: CookieOptions }

const endResponse: Action = { type: 'endResponse' }

export class ExpressConnection<S> implements Connection<S> {
  readonly _S!: S
  constructor(
    readonly req: Request,
    readonly res: Response,
    readonly actions: LinkedList<Action> = nil,
    readonly ended: boolean = false
  ) {}
  chain<T>(action: Action, ended: boolean = false): ExpressConnection<T> {
    return new ExpressConnection<T>(this.req, this.res, cons(action, this.actions), ended)
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
  setCookie(name: string, value: string, options: CookieOptions): ExpressConnection<HeadersOpen> {
    return this.chain({ type: 'setCookie', name, value, options })
  }
  clearCookie(name: string, options: CookieOptions): ExpressConnection<HeadersOpen> {
    return this.chain({ type: 'clearCookie', name, options })
  }
  setHeader(name: string, value: string): ExpressConnection<HeadersOpen> {
    return this.chain({ type: 'setHeader', name, value })
  }
  setStatus(status: Status): ExpressConnection<HeadersOpen> {
    return this.chain({ type: 'setStatus', status })
  }
  setBody(body: unknown): ExpressConnection<ResponseEnded> {
    return this.chain({ type: 'setBody', body }, true)
  }
  endResponse(): ExpressConnection<ResponseEnded> {
    return this.chain(endResponse, true)
  }
}

const run = (res: Response, action: Action): Response => {
  switch (action.type) {
    case 'clearCookie':
      return res.clearCookie(action.name, action.options)
    case 'endResponse':
      res.end()
      return res
    case 'setBody':
      return res.send(action.body)
    case 'setCookie':
      return res.clearCookie(action.name, action.options)
    case 'setHeader':
      res.setHeader(action.name, action.value)
      return res
    case 'setStatus':
      return res.status(action.status)
  }
}

const exec = <I, O, L>(
  middleware: Middleware<I, O, L, void>,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> =>
  middleware
    .exec(new ExpressConnection<I>(req, res))
    .run()
    .then(e =>
      e.fold(next, c => {
        const { actions: list, res, ended } = c as ExpressConnection<O>
        const len = list.length
        const actions = toArray(list)
        for (let i = 0; i < len; i++) {
          run(res, actions[i])
        }
        if (!ended) {
          next()
        }
      })
    )

export function toRequestHandler<I, O, L>(middleware: Middleware<I, O, L, void>): RequestHandler {
  return (req, res, next) => exec(middleware, req, res, next)
}

export function toErrorRequestHandler<I, O, L>(f: (err: unknown) => Middleware<I, O, L, void>): ErrorRequestHandler {
  return (err, req, res, next) => exec(f(err), req, res, next)
}

export function fromRequestHandler<I, A>(
  requestHandler: RequestHandler,
  f: (req: Request) => A
): Middleware<I, I, never, A> {
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
