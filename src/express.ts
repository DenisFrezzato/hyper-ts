import { Request, RequestHandler, ErrorRequestHandler, Response, NextFunction } from 'express'
import { rightTask } from 'fp-ts/lib/TaskEither'
import { IncomingMessage } from 'http'
import {
  Connection,
  CookieOptions,
  HeadersOpen,
  Middleware,
  ResponseEnded,
  Status,
  execMiddleware,
  StatusOpen
} from '.'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

/**
 * @internal
 */
export type LinkedList<A> =
  | { type: 'Nil'; length: number }
  | { type: 'Cons'; head: A; tail: LinkedList<A>; length: number }

/**
 * @internal
 */
export const nil: LinkedList<never> = { type: 'Nil', length: 0 }

/**
 * @internal
 */
export function cons<A>(head: A, tail: LinkedList<A>): LinkedList<A> {
  return {
    type: 'Cons',
    head,
    tail,
    length: tail.length + 1
  }
}

/**
 * @internal
 */
export function toArray<A>(list: LinkedList<A>): Array<A> {
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

/**
 * @internal
 */
export type Action =
  | { type: 'setBody'; body: unknown }
  | { type: 'endResponse' }
  | { type: 'setStatus'; status: Status }
  | { type: 'setHeader'; name: string; value: string }
  | { type: 'clearCookie'; name: string; options: CookieOptions }
  | { type: 'setCookie'; name: string; value: string; options: CookieOptions }

const endResponse: Action = { type: 'endResponse' }

/**
 * @since 0.5.0
 */
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

function run(res: Response, action: Action): Response {
  switch (action.type) {
    case 'clearCookie':
      return res.clearCookie(action.name, action.options)
    case 'endResponse':
      res.end()
      return res
    case 'setBody':
      return res.send(action.body)
    case 'setCookie':
      return res.cookie(action.name, action.value, action.options)
    case 'setHeader':
      res.setHeader(action.name, action.value)
      return res
    case 'setStatus':
      return res.status(action.status)
  }
}

function exec<I, O, E>(
  middleware: Middleware<I, O, E, void>,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return execMiddleware(middleware, new ExpressConnection<I>(req, res))().then(e =>
    pipe(
      e,
      E.fold(next, c => {
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
  )
}

/**
 * @since 0.5.0
 */
export function toRequestHandler<I, O, E>(middleware: Middleware<I, O, E, void>): RequestHandler {
  return (req, res, next) => exec(middleware, req, res, next)
}

/**
 * @since 0.5.0
 */
export function toErrorRequestHandler<I, O, E>(f: (err: unknown) => Middleware<I, O, E, void>): ErrorRequestHandler {
  return (err, req, res, next) => exec(f(err), req, res, next)
}

/**
 * @since 0.5.0
 */
export function fromRequestHandler<I = StatusOpen, E = never, A = never>(
  requestHandler: RequestHandler,
  f: (req: Request) => A
): Middleware<I, I, E, A> {
  return c =>
    rightTask(
      () =>
        new Promise(resolve => {
          const { req, res } = c as ExpressConnection<I>
          requestHandler(req, res, () => resolve([f(req), c]))
        })
    )
}
