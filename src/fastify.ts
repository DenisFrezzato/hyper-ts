import { Task } from 'fp-ts/lib/Task'
import { right } from 'fp-ts/lib/TaskEither'
import { IncomingMessage, ServerResponse } from 'http'
import { Connection, HeadersOpen, Middleware, ResponseEnded, Status } from '.'
import * as fastify from 'fastify'
import { LinkedList, nil, cons, toArray } from './linkedList'

export type Action =
  | { type: 'setBody'; body: unknown }
  | { type: 'endResponse' }
  | { type: 'setStatus'; status: Status }
  | { type: 'setHeader'; name: string; value: string }

const endResponse: Action = { type: 'endResponse' }

export class FastifyConnection<S> implements Connection<S> {
  readonly _S!: S
  constructor(
    readonly req: fastify.FastifyRequest<IncomingMessage>,
    readonly reply: fastify.FastifyReply<ServerResponse>,
    readonly actions: LinkedList<Action> = nil,
    readonly ended: boolean = false
  ) {}
  chain<T>(action: Action, ended: boolean = false): FastifyConnection<T> {
    return new FastifyConnection<T>(this.req, this.reply, cons(action, this.actions), ended)
  }
  getRequest(): IncomingMessage {
    return this.req.raw
  }
  getBody(): unknown {
    return this.req.body
  }
  getHeader(name: string): unknown {
    return this.req.headers[name]
  }
  getParams(): unknown {
    return this.req.params
  }
  getQuery(): unknown {
    return this.req.query
  }
  getOriginalUrl(): string {
    // http.IncomingMessage is created by http.Server or http.ClientRequest.
    // https://nodejs.org/api/http.html#http_class_http_incomingmessage
    // Since it's created by http.Server, the url property is not undefined.
    return this.req.raw.url!
  }
  getMethod(): string {
    // See getOriginalUrl.
    return this.req.raw.method!
  }
  setHeader(name: string, value: string): FastifyConnection<HeadersOpen> {
    return this.chain({ type: 'setHeader', name, value })
  }
  setStatus(status: Status): FastifyConnection<HeadersOpen> {
    return this.chain({ type: 'setStatus', status })
  }
  setBody(body: unknown): FastifyConnection<ResponseEnded> {
    return this.chain({ type: 'setBody', body }, true)
  }
  endResponse(): FastifyConnection<ResponseEnded> {
    return this.chain(endResponse, true)
  }
}

const run = (reply: fastify.FastifyReply<ServerResponse>, action: Action): fastify.FastifyReply<ServerResponse> => {
  switch (action.type) {
    case 'endResponse':
      reply.sent = true
      return reply
    case 'setBody':
      return reply.send(action.body)
    case 'setHeader':
      reply.header(action.name, action.value)
      return reply
    case 'setStatus':
      return reply.status(action.status)
  }
}

const exec = <I, O, L>(
  middleware: Middleware<I, O, L, void>,
  req: fastify.FastifyRequest<IncomingMessage>,
  res: fastify.FastifyReply<ServerResponse>
): Promise<void> =>
  middleware
    .exec(new FastifyConnection<I>(req, res))
    .run()
    .then(e =>
      e.fold(
        () => undefined,
        c => {
          const { actions: list, reply } = c as FastifyConnection<O>
          const len = list.length
          const actions = toArray(list)
          for (let i = 0; i < len; i++) {
            run(reply, actions[i])
          }
        }
      )
    )

export function toRequestHandler<I, O, L>(middleware: Middleware<I, O, L, void>): fastify.RequestHandler {
  return (req, res) => exec(middleware, req, res)
}

export function fromRequestHandler(fastifyInstance: fastify.FastifyInstance) {
  return function<I, A>(
    requestHandler: fastify.RequestHandler<IncomingMessage>,
    f: (req: fastify.FastifyRequest<IncomingMessage>) => A
  ): Middleware<I, I, never, A> {
    return new Middleware(c =>
      right(
        new Task(() => {
          const { req, reply: res } = c as FastifyConnection<I>
          return Promise.resolve(requestHandler.call(fastifyInstance, req, res)).then(() => [f(req), c])
        })
      )
    )
  }
}
