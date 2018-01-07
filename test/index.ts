import * as assert from 'assert'
import {
  Middleware,
  fromTask,
  gets,
  StatusOpen,
  status,
  closeHeaders,
  ResponseEnded,
  send,
  json,
  ResponseStateTransition,
  Handler,
  Conn,
  header,
  HeadersOpen,
  BodyOpen,
  headers,
  Header,
  contentType,
  MediaType,
  redirect,
  cookie,
  clearCookie
} from '../src'
import { Either, right, left } from 'fp-ts/lib/Either'
import * as task from 'fp-ts/lib/Task'
import { Option, fromNullable } from 'fp-ts/lib/Option'
import * as express from 'express'
import { array } from 'fp-ts/lib/Array'

function mockRequest(params: { [key: string]: string }): express.Request {
  return { params } as any
}

type MokedHeaders = { [key: string]: string }
type MokedCookies = { [key: string]: [string, express.CookieOptions] }

interface MockedResponse extends express.Response {
  getStatus(): number
  getContent(): string
  getCookies(): MokedCookies
}

function mockResponse(): MockedResponse {
  let status: number
  let headers: MokedHeaders = {}
  let content: string
  let cookies: MokedCookies = {}
  return {
    status(s: number) {
      status = s
    },
    getStatus() {
      return status
    },
    header(field: string, value: string) {
      headers[field] = value
    },
    getHeaders() {
      return headers
    },
    send(o: string) {
      content = o
    },
    getContent() {
      return content
    },
    cookie(name: string, value: string, options: express.CookieOptions) {
      cookies[name] = [value, options]
    },
    clearCookie(name: string, options: express.CookieOptions) {
      delete cookies[name]
    },
    getCookies() {
      return cookies
    }
  } as any
}

function assertResponse(
  res: MockedResponse,
  status: number | undefined,
  headers: MokedHeaders,
  content: string | undefined,
  cookies: MokedCookies
) {
  assert.strictEqual(res.getStatus(), status)
  assert.deepEqual(res.getHeaders(), headers)
  assert.strictEqual(res.getContent(), content)
  assert.deepEqual(res.getCookies(), cookies)
}

describe('status', () => {
  it('should write the status code', () => {
    const middleware = status(200)
    const res = mockResponse()
    const conn = new Conn<StatusOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, 200, {}, undefined, {})
      })
  })
})

describe('header', () => {
  it('should write the header', () => {
    const middleware = header(['name', 'value'])
    const res = mockResponse()
    const conn = new Conn<HeadersOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, undefined, { name: 'value' }, undefined, {})
      })
  })
})

describe('send', () => {
  it('should send the content', () => {
    const middleware = send('<h1>Hello world!</h1>')
    const res = mockResponse()
    const conn = new Conn<BodyOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, undefined, {}, '<h1>Hello world!</h1>', {})
      })
  })
})

describe('json', () => {
  it('should add the proper header and send the content', () => {
    const middleware = json('{}')
    const res = mockResponse()
    const conn = new Conn<HeadersOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, undefined, { 'Content-Type': 'application/json' }, '{}', {})
      })
  })
})

describe('cookie', () => {
  it('should add the cookie', () => {
    const middleware = cookie('name', 'value', {})
    const res = mockResponse()
    const conn = new Conn<HeadersOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, undefined, {}, undefined, { name: ['value', {}] })
      })
  })
})

describe('clearCookie', () => {
  it('should clear the cookie', () => {
    const middleware = cookie('name', 'value', {}).ichain(() => clearCookie('name', {}))
    const res = mockResponse()
    const conn = new Conn<HeadersOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, undefined, {}, undefined, {})
      })
  })
})

describe('headers', () => {
  it('should add the headers', () => {
    const hs: Array<Header> = [['a', 'b'], ['c', 'd']]
    const middleware = headers(array)(hs)
    const res = mockResponse()
    const conn = new Conn<HeadersOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, undefined, { a: 'b', c: 'd' }, undefined, {})
      })
  })
})

describe('contentType', () => {
  it('should add the `Content-Type` header', () => {
    const middleware = contentType(MediaType.applicationXML)
    const res = mockResponse()
    const conn = new Conn<HeadersOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, undefined, { 'Content-Type': 'application/xml' }, undefined, {})
      })
  })
})

describe('redirect', () => {
  it('should add the correct status / header', () => {
    const middleware = redirect('/users')
    const res = mockResponse()
    const conn = new Conn<StatusOpen>(mockRequest({}), res)
    return middleware
      .eval(conn)
      .run()
      .then(() => {
        assertResponse(res, 302, { Location: '/users' }, undefined, {})
      })
  })
})

describe('Middleware', () => {
  it('should create a request handler', () => {
    const param = (name: string): Middleware<StatusOpen, StatusOpen, Option<string>> =>
      gets(c => fromNullable(c.req.params[name]))

    // `ResponseStateTransition<I, O>` is an alias for `Middleware<I, O, void>`
    const notFound = (message: string): ResponseStateTransition<StatusOpen, ResponseEnded> =>
      status(404)
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

    const writeUser = (u: User): Handler => status(200).ichain(() => json(JSON.stringify(u)))

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
      assertResponse(res1, 200, { 'Content-Type': 'application/json' }, '{"name":"Giulio"}', {})
      assertResponse(res2, 404, {}, 'user not found', {})
    })
  })
})
