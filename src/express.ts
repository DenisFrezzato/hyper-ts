/**
 * @since 0.5.0
 */
import { Request, RequestHandler, ErrorRequestHandler, Response, NextFunction } from 'express'
import { IncomingMessage } from 'http'
import { Connection, CookieOptions, HeadersOpen, ResponseEnded, Status, StatusOpen } from '.'
import { Middleware, execMiddleware } from './Middleware'
import * as E from 'fp-ts/Either'
import { constUndefined, pipe } from 'fp-ts/function'
import * as L from 'fp-ts-contrib/List'
import { pipeline } from 'stream'

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
  | { type: 'pipeStream'; stream: NodeJS.ReadableStream }

const endResponse: Action = { type: 'endResponse' }

/**
 * @category model
 * @since 0.5.0
 */
export class ExpressConnection<S> implements Connection<S> {
  /**
   * @since 0.5.0
   */
  readonly _S!: S
  constructor(
    readonly req: Request,
    readonly res: Response,
    readonly actions: L.List<Action> = L.nil,
    readonly ended: boolean = false
  ) {}
  /**
   * @since 0.5.0
   */
  chain<T>(action: Action, ended: boolean = false): ExpressConnection<T> {
    return new ExpressConnection<T>(this.req, this.res, L.cons(action, this.actions), ended)
  }
  /**
   * @since 0.5.0
   */
  getRequest(): IncomingMessage {
    return this.req
  }
  /**
   * @since 0.5.0
   */
  getBody(): unknown {
    return this.req.body
  }
  /**
   * @since 0.5.0
   */
  getHeader(name: string): unknown {
    return this.req.header(name)
  }
  /**
   * @since 0.5.0
   */
  getParams(): unknown {
    return this.req.params
  }
  /**
   * @since 0.5.0
   */
  getQuery(): unknown {
    return this.req.query
  }
  /**
   * @since 0.5.0
   */
  getOriginalUrl(): string {
    return this.req.originalUrl
  }
  /**
   * @since 0.5.0
   */
  getMethod(): string {
    return this.req.method
  }
  /**
   * @since 0.5.0
   */
  setCookie(name: string, value: string, options: CookieOptions): ExpressConnection<HeadersOpen> {
    return this.chain({ type: 'setCookie', name, value, options })
  }
  /**
   * @since 0.5.0
   */
  clearCookie(name: string, options: CookieOptions): ExpressConnection<HeadersOpen> {
    return this.chain({ type: 'clearCookie', name, options })
  }
  /**
   * @since 0.5.0
   */
  setHeader(name: string, value: string): ExpressConnection<HeadersOpen> {
    return this.chain({ type: 'setHeader', name, value })
  }
  /**
   * @since 0.5.0
   */
  setStatus(status: Status): ExpressConnection<HeadersOpen> {
    return this.chain({ type: 'setStatus', status })
  }
  /**
   * @since 0.5.0
   */
  setBody(body: string | Buffer): ExpressConnection<ResponseEnded> {
    return this.chain({ type: 'setBody', body }, true)
  }
  /**
   * @since 0.6.2
   */
  pipeStream(stream: NodeJS.ReadableStream): ExpressConnection<ResponseEnded> {
    return this.chain({ type: 'pipeStream', stream }, true)
  }
  /**
   * @since 0.5.0
   */
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
    case 'pipeStream':
      return pipeline(action.stream, res, constUndefined)
  }
}

function exec<I, O, E>(
  middleware: Middleware<I, O, E, void>,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return execMiddleware(middleware, new ExpressConnection<I>(req, res))().then((e) =>
    pipe(
      e,
      E.fold(
        (e) => next(e),
        (c) => {
          const { actions: list, res, ended } = c as ExpressConnection<O>
          const len = list.length
          const actions = L.toReversedArray(list)
          for (let i = 0; i < len; i++) {
            run(res, actions[i])
          }
          if (!ended) {
            next()
          }
        }
      )
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
 * The overload without error handler is unsafe and deprecated, use the one with
 * the error handler instead.
 *
 * @since 0.5.0
 */
export function fromRequestHandler<I = StatusOpen, E = never, A = never>(
  requestHandler: RequestHandler,
  f: (req: Request) => A
): Middleware<I, I, E, A>
export function fromRequestHandler<I = StatusOpen, E = never, A = never>(
  requestHandler: RequestHandler,
  f: (req: Request) => E.Either<E, A>,
  onError: (reason: unknown) => E
): Middleware<I, I, E, A>
export function fromRequestHandler<I = StatusOpen, E = never, A = never>(
  requestHandler: RequestHandler,
  f: (req: Request) => A | E.Either<E, A>,
  onError?: (reason: unknown) => E
): Middleware<I, I, E, A> {
  return (c) => () =>
    new Promise((resolve) => {
      const { req, res } = c as ExpressConnection<I>
      // tslint:disable-next-line strict-boolean-expressions
      const cb = onError
        ? (err: unknown) =>
            // tslint:disable-next-line strict-boolean-expressions
            err
              ? resolve(E.left(onError(err)))
              : pipe(
                  req,
                  f as (req: Request) => E.Either<E, A>,
                  E.map((a): [A, Connection<I>] => [a, c]),
                  resolve
                )
        : () => resolve(E.right([(f as (req: Request) => A)(req), c]))
      requestHandler(req, res, cb)
    })
}
