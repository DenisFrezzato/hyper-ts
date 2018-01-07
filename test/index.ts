import * as assert from 'assert'
import {
  Middleware,
  fromTask,
  gets,
  StatusOpen,
  writeStatus,
  closeHeaders,
  ResponseEnded,
  send,
  json,
  ResponseStateTransition,
  Handler,
  Conn,
  Header
} from '../src'
import { Either, right, left } from 'fp-ts/lib/Either'
import * as task from 'fp-ts/lib/Task'
import { Option, fromNullable } from 'fp-ts/lib/Option'
import * as express from 'express'

function mockRequest(params: { [key: string]: string }): express.Request {
  return { params } as any
}

interface MockedResponse {
  getStatus(): number
  getHeaders(): Array<Header>
  getContent(): string
}

function mockResponse(): express.Response & MockedResponse {
  let status: number
  let headers: Array<Header> = []
  let content: string
  return {
    status(s: number) {
      status = s
    },
    getStatus() {
      return status
    },
    header(field: string, value: string) {
      headers.push([field, value])
    },
    getHeaders() {
      return headers
    },
    send(o: string) {
      content = o
    },
    getContent() {
      return content
    }
  } as any
}

describe('Middleware', () => {
  it('should create a request handler', () => {
    const param = (name: string): Middleware<StatusOpen, StatusOpen, Option<string>> =>
      gets(c => fromNullable(c.req.params[name]))

    // `ResponseStateTransition<I, O>` is an alias for `Middleware<I, O, void>`
    const notFound = (message: string): ResponseStateTransition<StatusOpen, ResponseEnded> =>
      writeStatus(404)
        .ichain(() => closeHeaders)
        .ichain(() => send(message))
    interface User {
      name: string
    }

    interface API {
      fetchUser: (id: string) => task.Task<Either<string, User>>
    }

    const api: API = {
      fetchUser: (id: string): task.Task<Either<string, User>> => {
        return task.of(id === '1' ? right({ name: 'Giulio' }) : left('user not found'))
      }
    }

    const getUser = (api: API) => (id: string): Middleware<StatusOpen, StatusOpen, Either<string, User>> =>
      fromTask(api.fetchUser(id))

    const writeUser = (u: User): Handler => writeStatus(200).ichain(() => json(JSON.stringify(u)))

    const userMiddleware = (api: API): Handler =>
      param('user_id').ichain(o =>
        o.fold(() => notFound('id not found'), id => getUser(api)(id).ichain(e => e.fold(notFound, writeUser)))
      )

    const middleware = userMiddleware(api)

    const req1 = mockRequest({ user_id: '1' })
    const res1 = mockResponse()
    const conn1 = new Conn<StatusOpen>(req1, res1)
    const promise1 = middleware.eval(conn1).run()

    const req2 = mockRequest({ user_id: '2' })
    const res2 = mockResponse()
    const conn2 = new Conn<StatusOpen>(req2, res2)
    const promise2 = middleware.eval(conn2).run()

    return Promise.all([promise1, promise2]).then(() => {
      assert.strictEqual(res1.getStatus(), 200)
      assert.deepEqual(res1.getHeaders(), [['Content-Type', 'application/json']])
      assert.strictEqual(res1.getContent(), '{"name":"Giulio"}')

      assert.strictEqual(res2.getStatus(), 404)
      assert.deepEqual(res2.getHeaders(), [])
      assert.strictEqual(res2.getContent(), 'user not found')
    })
  })
})
